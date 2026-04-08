import express from "express";
import { prismaClient } from "@repo/db/client";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
  type CreateRoomResponse,
  type RoomLookupResponse,
} from "@repo/common/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/common-backend/config';
import { middleware } from "./middleware";
import type { Request, Response, NextFunction, RequestHandler } from 'express';

const app = express();
app.use(express.json());

function normalizeRoomSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const allowedOrigins = [
  'http://localhost:4002', 
  'https://canvas-ui.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsMiddleware: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  
  // For development, allow localhost and specific origins
  // For production, strictly validate origins
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  
  if (isAllowedOrigin ) {
    res.header('Access-Control-Allow-Origin', origin);
  }  else {
    // In production, reject unauthorized origins
    if (origin && !isAllowedOrigin) {
      res.status(403).json({ message: 'CORS policy: Origin not allowed' });
      return;
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Request-Private-Network');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle private network access
  if (req.headers['access-control-request-private-network']) {
    res.header('Access-Control-Allow-Private-Network', 'true');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};
app.use(corsMiddleware);

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    console.log("incorrect input:  ", parsedData.error);
    res.status(400).json({
      message: "incorrect inputs",
    });
    return;
  }

  const data = parsedData.data;

  console.log("Creating user with data:", data);
  try {
    const user = await prismaClient.user.create({
      data: {
        name: data.name,
        email: data.username,
        password: data.password,
      },
    });
    
    // Generate token for immediate login after signup
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );
    
    res.json({
      userId: user.id,
      token,
    });

    console.log("User created with ID:", user.id);
    console.log("User created with token:", token);
  } catch (e) {
    console.log("error in creating user: ", e);
    res.status(500).json({ message: "error in creating user" });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    console.log("incorrect input:  ", parsedData.error);
    res.status(400).json({
      message: "incorrect inputs",
    });
    return;
  }

  const data = parsedData.data;
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: data.username,
      },
    });

    if (!user || user.password !== data.password) {
      res.status(401).json({
        message: "user not found check credentials",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );
    res.json({
      token,
    });
  } catch (e) {
    console.log("error in signin: ", e);
    res.status(500).json({
      message: "error in signing in",
    });
  }
});

app.get("/userinfo", middleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;

  try {
    const user = await prismaClient.user.findUnique({
      where: { id: String(userId) },
    });

    if (!user) {
      res.status(404).json({ message: "user not found" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (e) {
    console.error("error in getting user info:", e);
    res.status(500).json({ message: "error in getting user info" });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Incorrect inputs",
    });
    return;
  }

  // @ts-ignore
  const userId = req.userId;
  try {
    const baseSlug = normalizeRoomSlug(parsedData.data.name);
    if (!baseSlug || baseSlug.length < 3) {
      res.status(400).json({ message: "Room name must produce a valid slug" });
      return;
    }

    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await prismaClient.room.findUnique({ where: { slug } });
      if (!existing) {
        break;
      }
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const room = await prismaClient.room.create({
      data: {
        slug,
        adminId: userId,
      },
    });
    const payload: CreateRoomResponse = {
      roomId: room.id,
      slug: room.slug,
    };
    res.json(payload);
  } catch (err) {
    console.log("error in creating room: ", err);
    res.status(500).json({ message: "error in creating room" });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 1000,
    });

    res.json({
      messages,
    });
  } catch (e) {
    console.log(e);
    res.json({
      messages: [],
    });
  }
});

app.post("/chats/:roomId/clear", middleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  console.log("Clear endpoint hit with roomId:", req.params.roomId);
  try {
    const roomId = Number(req.params.roomId);

    // Verify user is the room admin
    const room = await prismaClient.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.adminId !== userId) {
      res.status(403).json({ message: "Only room admin can clear the canvas" });
      return;
    }

    await prismaClient.chat.deleteMany({
      where: {
        roomId: roomId,
      }
    });
    res.json({ message: "Canvas cleared" });
  } catch (e) {
    console.error("Error clearing canvas:", e);
    res.status(500).json({ message: "Error clearing canvas" });
  }
});

app.get("/room/:slug", async (req, res) => {
  const roomRef = req.params.slug.trim();
  console.log("room lookup:", roomRef);

  try {
    const normalizedSlug = normalizeRoomSlug(roomRef);
    const numericId = Number(roomRef);

    const data = Number.isInteger(numericId)
      ? await prismaClient.room.findUnique({ where: { id: numericId } })
      : await prismaClient.room.findUnique({ where: { slug: normalizedSlug } });

    if (!data) {
      res.status(404).json({ message: "room not found" });
      return;
    }

    const payload: RoomLookupResponse = {
      message: "room found",
      data: {
        id: data.id,
        slug: data.slug,
      },
    };
    res.json(payload);
  } catch (e) {
    console.error("error in getting room:", e);
    res.status(500).json({ message: "error in getting room" });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
  console.log("Routes registered:"); 
  console.log("POST /chats/:roomId/clear"); 
});