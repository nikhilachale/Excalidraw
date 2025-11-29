import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/common-backend/config';
import { prismaClient } from '@repo/db/client';

interface User {
  ws: WebSocket;
  userId: string;
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

function send(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

async function processChatQueue() {
  if (chatQueue.length === 0) return;
  const batch = chatQueue.splice(0, chatQueue.length);
  try {
    await prismaClient.chat.createMany({ data: batch });
  } catch (e) {
    console.error("DB write failed:", e);
  }
}

// background writer runs every 100ms
setInterval(processChatQueue, 100);

wss.on('connection', (ws, request) => {
  const url = request.url;
  if (!url) return ws.close();

  const urlParts = url.split('?');
  if (urlParts.length < 2) return ws.close();
  
  const token = new URLSearchParams(urlParts[1]).get('token') || '';
  const userId = verifyToken(token);
  if (!userId) return ws.close();

  console.log(`✅ Connected: ${userId}`);
  users.set(ws, { ws, userId });

  ws.on('message', (rawData) => {
    let data: any;
    try {
      data = JSON.parse(rawData.toString());
    } catch {
      return send(ws, { type: 'error', message: 'Invalid JSON' });
    }

    const { type, roomId, message } = data;
    const user = users.get(ws);
    if (!user) return;

    switch (type) {
      case 'join_room': {
        if (!roomId) return;
        if (!rooms.has(roomId)) rooms.set(roomId, { id: roomId, members: new Set() });
        rooms.get(roomId)!.members.add(user);
        break;
      }

      case 'leave_room': {
        rooms.get(roomId)?.members.delete(user);
        break;
      }

      case 'chat': {
        if (!roomId || !message) return;

        // 1️⃣ broadcast immediately (low latency)
        const room = rooms.get(roomId);
        if (room) {
          const payload = JSON.stringify({ type: 'chat', message, roomId, sender: user.userId });
          for (const member of room.members) {
            if (member.ws.readyState === WebSocket.OPEN) member.ws.send(payload);
          }
        }

        // 2️⃣ save asynchronously
        chatQueue.push({ roomId: Number(roomId), message, userId: user.userId });

        break;
      }

      case 'clear': {
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (room) {
          const payload = JSON.stringify({ type: 'clear', roomId, sender: user.userId });
          for (const member of room.members) {
            if (member.ws.readyState === WebSocket.OPEN) member.ws.send(payload);
          }
        }
        break;
        
      }

      default:
        send(ws, { type: 'error', message: 'Unknown event type' });
    }
  });

  ws.on('close', () => {
    const user = users.get(ws);
    if (!user) return;
    users.delete(ws);
    for (const room of rooms.values()) room.members.delete(user);
  });
});