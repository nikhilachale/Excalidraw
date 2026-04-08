import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/common-backend/config';
import { prismaClient } from '@repo/db/client';
import {
  WebSocketEventSchema,
  type WebSocketEvent,
} from './schemas.js';
import { rateLimiter } from './rate-limiter.js';
import { connectionManager } from './connection-manager.js';
import { resourceMonitor } from './resource-monitor.js';
import { logger } from './logger.js';

interface User {
  ws: WebSocket;
  userId: string;
  ip: string;
  connectionId: string;
}

interface Room {
  id: string;
  members: Set<User>;
}

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server listening on port ${PORT}`);

const users = new Map<WebSocket, User>();
const rooms = new Map<string, Room>();

// background queue for async writes
const chatQueue: { roomId: number; message: string; userId: string }[] = [];

function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return decoded?.userId ?? null;
  } catch {
    return null;
  }
}

function send(ws: WebSocket, data: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function getClientIp(request: { socket: { remoteAddress?: string } }): string {
  return request.socket.remoteAddress || 'unknown';
}

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function processChatQueue() {
  if (chatQueue.length === 0) return;
  const batch = chatQueue.splice(0, chatQueue.length);
  try {
    await prismaClient.chat.createMany({ data: batch });
  } catch (e) {
    logger.error('DB write failed:', { error: e instanceof Error ? e.message : String(e) });
  }
}

// background writer runs every 100ms
setInterval(processChatQueue, 100);

// Periodic monitoring and cleanup
setInterval(() => {
  const rateLimitStats = rateLimiter.getStats();
  const connectionStats = connectionManager.getStats();
  const resourceStats = resourceMonitor.getStats();
  const logStats = logger.getStats();

  logger.info('Server statistics:', {
    activeConnections: users.size,
    rooms: rooms.size,
    rateLimits: rateLimitStats,
    connectionStats,
    resources: resourceStats,
    logs: logStats,
  });
}, 60000); // Log every minute

wss.on('connection', (ws, request) => {
  const url = request.url;
  if (!url) {
    logger.logInvalidToken(getClientIp(request), { reason: 'No URL provided' });
    return ws.close();
  }

  const urlParts = url.split('?');
  if (urlParts.length < 2) {
    logger.logInvalidToken(getClientIp(request), { reason: 'No query parameters' });
    return ws.close();
  }

  const token = new URLSearchParams(urlParts[1]).get('token') || '';
  const userId = verifyToken(token);
  if (!userId) {
    const ip = getClientIp(request);
    logger.logInvalidToken(ip, { url });
    return ws.close();
  }

  const ip = getClientIp(request);
  const connectionId = generateConnectionId();

  // Check connection rate limiting
  const connectionCheck = connectionManager.canConnect(ip);
  if (!connectionCheck.allowed) {
    logger.logConnectionLimit(ip, connectionManager.getStats().trackedIps);
    send(ws, { type: 'error', message: connectionCheck.message });
    return ws.close();
  }

  // Check IP-based connection limits
  const ipLimitCheck = rateLimiter.checkIpLimit(ip, connectionId);
  if (!ipLimitCheck.allowed) {
    logger.logConnectionLimit(ip, ipLimitCheck.count);
    send(ws, { type: 'error', message: 'Too many connections from this IP' });
    return ws.close();
  }

  logger.logConnection(userId, ip, { connectionId });

  users.set(ws, { ws, userId, ip, connectionId });
  connectionManager.registerConnection(connectionId, userId);

  ws.on('message', async (rawData) => {
    let data: unknown;
    try {
      data = JSON.parse(rawData.toString());
    } catch {
      logger.logInvalidEvent(userId, 'parse_error', 'Invalid JSON');
      send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    // Validate event structure
    const parseResult = WebSocketEventSchema.safeParse(data);
    if (!parseResult.success) {
      logger.logInvalidEvent(userId, 'validation_error', parseResult.error.message);
      send(ws, { type: 'error', message: 'Invalid event data' });
      return;
    }

    const event = parseResult.data as WebSocketEvent;
    const user = users.get(ws);
    if (!user) return;

    // Update connection activity
    connectionManager.updateActivity(connectionId);

    // Track message and check resource limits
    if (!resourceMonitor.trackMessage(userId, connectionId)) {
      logger.logResourceLimit(userId, 'message_rate');
      send(ws, { type: 'error', message: 'Message rate limit exceeded' });
      return;
    }

    const roomKey = event.roomId;

    switch (event.type) {
      case 'join_room': {
        if (!roomKey) {
          logger.logInvalidEvent(userId, 'join_room', 'No room ID provided');
          return;
        }

        if (!rooms.has(roomKey)) {
          rooms.set(roomKey, { id: roomKey, members: new Set() });
        }
        rooms.get(roomKey)!.members.add(user);
        logger.info(`User ${userId} joined room ${roomKey}`, { userId, roomId: roomKey });
        break;
      }

      case 'leave_room': {
        if (!roomKey) {
          logger.logInvalidEvent(userId, 'leave_room', 'No room ID provided');
          return;
        }
        rooms.get(roomKey)?.members.delete(user);
        logger.info(`User ${userId} left room ${roomKey}`, { userId, roomId: roomKey });
        break;
      }

      case 'chat': {
        if (!roomKey || !('message' in event)) {
          logger.logInvalidEvent(userId, 'chat', 'Missing room ID or message');
          return;
        }

        const room = rooms.get(roomKey);
        if (!room) {
          send(ws, { type: 'error', message: 'Room not found' });
          logger.logUnauthorizedAccess(userId, 'chat', roomKey);
          return;
        }

        // Verify user is in room
        if (!room.members.has(user)) {
          send(ws, { type: 'error', message: 'You must join room before sending messages' });
          logger.logUnauthorizedAccess(userId, 'chat', roomKey);
          return;
        }

        // Check user rate limit
        const userRateLimit = rateLimiter.checkUserLimit(userId);
        if (!userRateLimit.allowed) {
          logger.logRateLimit(userId, 'user', { roomId: roomKey });
          send(ws, { type: 'error', message: 'Rate limit exceeded. Please slow down.' });
          return;
        }

        // Check room rate limit
        const roomRateLimit = rateLimiter.checkRoomLimit(roomKey);
        if (!roomRateLimit.allowed) {
          logger.logRateLimit(userId, 'room', { roomId: roomKey });
          send(ws, { type: 'error', message: 'Room is too busy. Please try again later.' });
          return;
        }

        // 1️⃣ broadcast immediately (low latency)
        const payload = JSON.stringify({
          type: 'chat',
          message: event.message,
          roomId: roomKey,
          sender: user.userId,
        });
        for (const member of room.members) {
          if (member.ws.readyState === WebSocket.OPEN) member.ws.send(payload);
        }

        // 2️⃣ save asynchronously
        const numericRoomId = Number(roomKey);
        if (!Number.isInteger(numericRoomId)) {
          send(ws, { type: 'error', message: 'Invalid room id for chat event' });
          logger.logInvalidEvent(userId, 'chat', 'Invalid room ID');
          return;
        }
        chatQueue.push({ roomId: numericRoomId, message: event.message as string, userId: user.userId });

        break;
      }

      case 'clear': {
        if (!roomKey) {
          logger.logInvalidEvent(userId, 'clear', 'No room ID provided');
          return;
        }
        const room = rooms.get(roomKey);
        if (!room) {
          send(ws, { type: 'error', message: 'Room not found' });
          logger.logUnauthorizedAccess(userId, 'clear', roomKey);
          break;
        }

        // Verify user is in room
        if (!room.members.has(user)) {
          send(ws, { type: 'error', message: 'You must join room before clearing' });
          logger.logUnauthorizedAccess(userId, 'clear', roomKey);
          break;
        }

        // Verify user is room admin
        const numericRoomId = Number(roomKey);
        if (!Number.isInteger(numericRoomId)) {
          send(ws, { type: 'error', message: 'Invalid room id' });
          logger.logInvalidEvent(userId, 'clear', 'Invalid room ID');
          break;
        }

        try {
          const dbRoom = await prismaClient.room.findUnique({
            where: { id: numericRoomId },
          });

          if (!dbRoom) {
            send(ws, { type: 'error', message: 'Room not found' });
            logger.logInvalidEvent(userId, 'clear', 'Room not found in DB');
            break;
          }

          if (dbRoom.adminId !== user.userId) {
            send(ws, { type: 'error', message: 'Only room admin can clear canvas' });
            logger.logUnauthorizedAccess(userId, 'clear', roomKey);
            break;
          }

          const payload = JSON.stringify({ type: 'clear', roomId: roomKey, sender: user.userId });
          for (const member of room.members) {
            if (member.ws.readyState === WebSocket.OPEN) member.ws.send(payload);
          }
          logger.info(`Canvas cleared by ${userId}`, { userId, roomId: roomKey });
        } catch (error) {
          logger.error('Error verifying room admin:', {
            userId,
            roomId: roomKey,
            error: error instanceof Error ? error.message : String(error),
          });
          send(ws, { type: 'error', message: 'Error clearing canvas' });
        }
        break;
      }

      default:
        logger.logInvalidEvent(userId, 'unknown', 'Unknown event type');
        send(ws, { type: 'error', message: 'Unknown event type' });
    }
  });

  ws.on('close', () => {
    const user = users.get(ws);
    if (!user) return;

    logger.logDisconnection(user.userId, user.ip, { connectionId: user.connectionId });

    // Clean up resources
    rateLimiter.removeConnection(user.ip, user.connectionId);
    connectionManager.removeConnection(user.connectionId);
    resourceMonitor.removeConnection(user.connectionId, user.userId);

    users.delete(ws);
    for (const room of rooms.values()) {
      room.members.delete(user);
    }
  });

  ws.on('error', (error) => {
    const user = users.get(ws);
    if (user) {
      logger.error('WebSocket error:', {
        userId: user.userId,
        connectionId: user.connectionId,
        error: error.message,
      });
    } else {
      logger.error('WebSocket error:', { error: error.message });
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  wss.close(() => {
    logger.info('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  wss.close(() => {
    logger.info('WebSocket server closed');
    process.exit(0);
  });
});
