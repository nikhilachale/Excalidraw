import express from "express";
import { prismaClient } from "@repo/db/client";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/common-backend/config';
import { middleware } from "./middleware";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    console.log("incorrect input:  ", parsedData.error);
    res.json({
      message: "incorrect inputs"
    });
    return;
  }

  const data = parsedData.data;
  try {
    const user = await prismaClient.user.create({
      data: {
        name: data.name,
        email: data.username,
        password: data.password
      }
    });
    res.json({
      userId: user.id
    });
  } catch (e) {
    console.log("error in creating user: ", e);
    res.json({ message: "error in creating user" });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    console.log("incorrect input:  ", parsedData.error);
    res.json({
      message: "incorrect inputs"
    });
    return;
  }

  const data = parsedData.data;
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: data.username
      }
    });

    if (!user || user.password !== data.password) {
      res.json({
        message: "user not found check credentials"
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id
      },
      JWT_SECRET
    );
    res.json({
      token
    });
  } catch (e) {
    console.log("error in signin: ", e);
    res.json({
      message: "error in signing in"
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs"
    });
    return;
  }

  // @ts-ignore
  const userId = req.userId;
  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId
      }
    });
    res.json({
      roomId: room.id
    });
  } catch (err) {
    console.log("error in creating room: ", err);
    res.json({ message: "error in creating room" });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  console.log("roomid:", roomId);
  
  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: parseInt(roomId)
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });
    res.json({
      message: "chats found of room",
      messages
    });
  } catch (e) {
    console.error("error in getting chats: ", e);
    res.json({ message: "error in getting chats" });
  }
});

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  console.log("slug:", slug);

  try {
    const data = await prismaClient.room.findUnique({
      where: {
        slug
      }
    });
    res.json({
      message: "room found",
      data: data
    });
  } catch (e) {
    console.error("error in getting room:", e);
    res.json({ message: "error in getting room" });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3000");
});