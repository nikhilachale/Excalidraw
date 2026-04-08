/**
 * WebSocket server with robust error handling and state management
 */

import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, logger } from '@repo/common-backend';
import { prismaClient, executeWithRetry, checkDatabaseHealth } from '@repo/db/client';

interface User {
  ws: WebSocket;
  userId: string;
  lastSeen: number;
}

interface Room {
  id: string;
  members: Set<User>;
  createdAt: number;
}

interface ChatMessage {
  roomId: number;
  message: string;
  userId: string;
  timestamp: number;
}

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });

logger.info(`WebSocket server listening on port ${PORT}`);

// In-memory state
const users = new Map<WebSocket, User>();
const rooms = new Map<string, Room>();

// Background queue for async writes
const chatQueue: ChatMessage[] = [];
let isProcessingQueue = false;
const MAX_QUEUE_SIZE = 1000;
const QUEUE_PROCESS_INTERVAL = 100;

// Metrics
const metrics = {
  connections: 0,
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  queueSize: 0,
  queueProcessingTime: 0,
};

/**
 * Verify JWT token
 */
function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return decoded?.userId ?? null;
  } catch (error) {
    logger.warn('Token verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Send message to WebSocket client safely
 */
function send(ws: WebSocket, data: Record<string, unknown>): boolean {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(data));
      metrics.messagesSent++;
      return true;
    } catch (error) {
      logger.error('Error sending WebSocket message', error instanceof Error ? error : undefined);
      metrics.errors++;
      return false;
    }
  }
  return false;
}

/**
 * Send error message to client
 */
function sendError(ws: WebSocket, message: string): void {
  send(ws, { type: 'error', message });
}

/**
 * Process chat queue with error handling and retry logic
 */
async function processChatQueue(): Promise<void> {
  if (isProcessingQueue || chatQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  const startTime = Date.now();

  try {
    // Take a batch of messages to process
    const batchSize = Math.min(chatQueue.length, 100);
    const batch = chatQueue.splice(0, batchSize);

    logger.debug(`Processing chat queue batch`, {
      batchSize,
      remaining: chatQueue.length,
    });

    // Execute with retry logic
    await executeWithRetry(async () => {
      await prismaClient.chat.createMany({
        data: batch.map((msg) => ({
          roomId: msg.roomId,
          message: msg.message,
          userId: msg.userId,
        })),
      });
    });

    const processingTime = Date.now() - startTime;
    metrics.queueProcessingTime = processingTime;

    logger.debug('Chat queue batch processed successfully', {
      batchSize,
      processingTime,
    });
  } catch (error) {
    logger.error('Failed to process chat queue batch', error instanceof Error ? error : undefined, {
      queueSize: chatQueue.length,
    });
    metrics.errors++;

    // If queue is too large, reject oldest messages to prevent memory issues
    if (chatQueue.length > MAX_QUEUE_SIZE) {
      const rejectedCount = chatQueue.length - MAX_QUEUE_SIZE;
      chatQueue.splice(0, rejectedCount);
      logger.warn('Rejected old chat messages due to queue overflow', {
        rejectedCount,
        maxSize: MAX_QUEUE_SIZE,
      });
    }
  } finally {
    isProcessingQueue = false;
    metrics.queueSize = chatQueue.length;
  }
}

// Start background queue processor
const queueProcessor = setInterval(processChatQueue, QUEUE_PROCESS_INTERVAL);

/**
 * Clean up inactive users and empty rooms
 */
function cleanupInactiveUsers(): void {
  const now = Date.now();
  const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  for (const [ws, user] of users.entries()) {
    if (now - user.lastSeen > INACTIVE_TIMEOUT) {
      logger.info('Closing inactive WebSocket connection', { userId: user.userId });
      ws.close();
    }
  }
}

// Run cleanup every minute
setInterval(cleanupInactiveUsers, 60000);

/**
 * Handle WebSocket connection
 */
wss.on('connection', (ws, request) => {
  metrics.connections++;

  const url = request.url;
  if (!url) {
    logger.warn('WebSocket connection rejected: no URL');
    ws.close();
    return;
  }

  const urlParts = url.split('?');
  if (urlParts.length < 2) {
    logger.warn('WebSocket connection rejected: no query parameters');
    ws.close();
    return;
  }

  const token = new URLSearchParams(urlParts[1]).get('token') || '';
  const userId = verifyToken(token);

  if (!userId) {
    logger.warn('WebSocket connection rejected: invalid token');
    sendError(ws, 'Authentication failed');
    ws.close();
    return;
  }

  logger.info(`WebSocket connected: ${userId}`);

  const user: User = {
    ws,
    userId,
    lastSeen: Date.now(),
  };

  users.set(ws, user);

  // Send connection acknowledgment
  send(ws, { type: 'connected', userId });

  /**
   * Handle incoming messages
   */
  ws.on('message', async (rawData) => {
    user.lastSeen = Date.now();
    metrics.messagesReceived++;

    let data: unknown;
    try {
      data = JSON.parse(rawData.toString());
    } catch (error) {
      logger.warn('Invalid JSON received', { userId });
      sendError(ws, 'Invalid JSON');
      return;
    }

    // Type guard for message data
    if (typeof data !== 'object' || data === null) {
      logger.warn('Invalid message format', { userId });
      sendError(ws, 'Invalid message format');
      return;
    }

    const messageData = data as Record<string, unknown>;
    const { type, roomId, message } = messageData;

    if (typeof type !== 'string') {
      sendError(ws, 'Missing or invalid message type');
      return;
    }

    const roomKey = typeof roomId === 'number' ? String(roomId) : (typeof roomId === 'string' ? roomId : '');

    try {
      switch (type) {
        case 'join_room': {
          if (!roomKey) {
            sendError(ws, 'Room ID is required');
            return;
          }

          if (!rooms.has(roomKey)) {
            rooms.set(roomKey, { id: roomKey, members: new Set(), createdAt: Date.now() });
            logger.info('Room created', { roomId: roomKey, userId });
          }

          const room = rooms.get(roomKey)!;
          room.members.add(user);

          logger.debug('User joined room', { userId, roomId: roomKey, memberCount: room.members.size });
          send(ws, { type: 'joined', roomId: roomKey });
          break;
        }

        case 'leave_room': {
          if (!roomKey) {
            sendError(ws, 'Room ID is required');
            return;
          }

          const room = rooms.get(roomKey);
          if (room) {
            room.members.delete(user);
            logger.debug('User left room', { userId, roomId: roomKey, memberCount: room.members.size });

            // Clean up empty rooms
            if (room.members.size === 0) {
              rooms.delete(roomKey);
              logger.info('Empty room deleted', { roomId: roomKey });
            }
          }

          send(ws, { type: 'left', roomId: roomKey });
          break;
        }

        case 'chat': {
          if (!roomKey || typeof message !== 'string') {
            sendError(ws, 'Room ID and message are required');
            return;
          }

          const room = rooms.get(roomKey);
          if (!room) {
            sendError(ws, 'Room not found');
            return;
          }

          // Verify user is in room
          if (!room.members.has(user)) {
            sendError(ws, 'You must join the room before sending messages');
            return;
          }

          const numericRoomId = Number(roomKey);
          if (!Number.isInteger(numericRoomId) || numericRoomId <= 0) {
            sendError(ws, 'Invalid room ID');
            return;
          }

          // Broadcast immediately to all room members (low latency)
          const payload = { type: 'chat', message, roomId: roomKey, sender: user.userId };
          const payloadString = JSON.stringify(payload);

          let deliveredCount = 0;
          for (const member of room.members) {
            if (member.ws.readyState === WebSocket.OPEN) {
              member.ws.send(payloadString);
              deliveredCount++;
            }
          }

          logger.debug('Chat message broadcast', {
            userId,
            roomId: roomKey,
            deliveredCount,
            totalMembers: room.members.size,
          });

          // Queue for async database persistence
          if (chatQueue.length < MAX_QUEUE_SIZE) {
            chatQueue.push({
              roomId: numericRoomId,
              message,
              userId: user.userId,
              timestamp: Date.now(),
            });
          } else {
            logger.warn('Chat queue full, message dropped', { queueSize: chatQueue.length });
            sendError(ws, 'Message queue full, please try again');
          }

          metrics.queueSize = chatQueue.length;
          break;
        }

        case 'clear': {
          if (!roomKey) {
            sendError(ws, 'Room ID is required');
            return;
          }

          const room = rooms.get(roomKey);
          if (!room) {
            sendError(ws, 'Room not found');
            return;
          }

          // Verify user is in room
          if (!room.members.has(user)) {
            sendError(ws, 'You must join the room before clearing');
            return;
          }

          const numericRoomId = Number(roomKey);
          if (!Number.isInteger(numericRoomId) || numericRoomId <= 0) {
            sendError(ws, 'Invalid room ID');
            return;
          }

          // Verify user is room admin
          const dbRoom = await prismaClient.room.findUnique({
            where: { id: numericRoomId }
          });

          if (!dbRoom) {
            sendError(ws, 'Room not found');
            return;
          }

          if (dbRoom.adminId !== user.userId) {
            logger.warn('Unauthorized clear attempt', {
              userId,
              roomId: roomKey,
              adminId: dbRoom.adminId,
            });
            sendError(ws, 'Only room admin can clear the canvas');
            return;
          }

          // Broadcast clear message to all room members
          const payload = { type: 'clear', roomId: roomKey, sender: user.userId };
          const payloadString = JSON.stringify(payload);

          for (const member of room.members) {
            if (member.ws.readyState === WebSocket.OPEN) {
              member.ws.send(payloadString);
            }
          }

          logger.info('Canvas cleared', { userId, roomId: roomKey });
          break;
        }

        case 'ping': {
          send(ws, { type: 'pong' });
          break;
        }

        default:
          sendError(ws, 'Unknown event type');
          logger.warn('Unknown WebSocket event type', { type, userId });
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', error instanceof Error ? error : undefined, {
        type,
        userId,
        roomId: roomKey,
      });
      sendError(ws, 'Internal server error');
      metrics.errors++;
    }
  });

  /**
   * Handle WebSocket disconnection
   */
  ws.on('close', (code, reason) => {
    metrics.connections--;
    users.delete(ws);

    // Remove user from all rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.members.has(user)) {
        room.members.delete(user);

        logger.debug('User removed from room on disconnect', {
          userId,
          roomId,
          remainingMembers: room.members.size,
        });

        // Clean up empty rooms
        if (room.members.size === 0) {
          rooms.delete(roomId);
          logger.info('Empty room deleted on disconnect', { roomId });
        }
      }
    }

    logger.info('WebSocket disconnected', {
      userId,
      code,
      reason: reason.toString(),
      activeConnections: metrics.connections,
    });
  });

  /**
   * Handle WebSocket errors
   */
  ws.on('error', (error) => {
    logger.error('WebSocket error', error, { userId });
    metrics.errors++;
  });
});

/**
 * Health check endpoint for WebSocket server
 */
wss.on('listening', () => {
  logger.info('WebSocket server is ready', { port: PORT });
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down WebSocket server gracefully...`);

  // Stop queue processing
  clearInterval(queueProcessor);

  // Process remaining queue
  if (chatQueue.length > 0) {
    logger.info('Processing remaining chat queue...', { queueSize: chatQueue.length });
    await processChatQueue();
  }

  // Close all WebSocket connections
  for (const [ws, user] of users.entries()) {
    send(ws, { type: 'server_shutdown', message: 'Server is shutting down' });
    ws.close();
  }

  // Close database connection
  try {
    await prismaClient.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', error instanceof Error ? error : undefined);
  }

  logger.info('WebSocket server shutdown complete');
  process.exit(0);
};

const handleShutdown = (signal: string): void => {
  // Use setTimeout to allow the current event loop to complete
  setTimeout(() => {
    gracefulShutdown(signal).catch((error) => {
      logger.error('Error during graceful shutdown', error instanceof Error ? error : undefined);
      process.exit(1);
    });
  }, 0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

/**
 * Log metrics periodically
 */
setInterval(() => {
  logger.info('WebSocket server metrics', { ...metrics, activeConnections: users.size });
}, 60000);
