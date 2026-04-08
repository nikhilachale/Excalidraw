import express from "express";
import {
  prismaClient,
  executeTransaction,
  checkDatabaseHealth,
  closeDatabaseConnection,
} from "@repo/db/client";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
  type CreateRoomResponse,
  type RoomLookupResponse,
} from "@repo/common/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/common-backend/config';
import { middleware } from "./middleware.js";
import type { Request, Response, RequestHandler } from 'express';
import {
  errorHandler,
  asyncHandler,
  requestIdMiddleware,
  notFoundHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  logger,
  attachRequestId,
  detachRequestId,
} from "@repo/common-backend";

const app = express();
app.use(express.json());

// Apply request ID middleware to all requests
app.use(requestIdMiddleware);

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

/**
 * POST /signup - Create a new user account
 */
app.post("/signup", asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      logger.warn('Signup validation failed', { errors: parsedData.error.errors });
      throw new ValidationError('Invalid user data', { errors: parsedData.error.errors });
    }

    const data = parsedData.data;

    logger.info('Creating user', { username: data.username });

    // Check if user already exists
    const existingUser = await prismaClient.user.findUnique({
      where: { email: data.username },
    });

    if (existingUser) {
      logger.warn('User already exists', { username: data.username });
      throw new ValidationError('User with this email already exists');
    }

    // Create user in a transaction
    const user = await executeTransaction(async (tx) => {
      return await tx.user.create({
        data: {
          name: data.name,
          email: data.username,
          password: data.password,
        },
      });
    });

    // Generate token for immediate login after signup
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    logger.info('User created successfully', { userId: user.id });

    res.status(201).json({
      userId: user.id,
      token,
    });
  } finally {
    detachRequestId();
  }
}));

/**
 * POST /signin - Authenticate user and return token
 */
app.post("/signin", asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
      logger.warn('Signin validation failed', { errors: parsedData.error.errors });
      throw new ValidationError('Invalid signin data', { errors: parsedData.error.errors });
    }

    const data = parsedData.data;

    logger.info('User signin attempt', { email: data.username });

    const user = await prismaClient.user.findUnique({
      where: {
        email: data.username,
      },
    });

    if (!user) {
      logger.warn('Signin failed: user not found', { email: data.username });
      throw new AuthenticationError('Invalid credentials');
    }

    if (user.password !== data.password) {
      logger.warn('Signin failed: incorrect password', { email: data.username });
      throw new AuthenticationError('Invalid credentials');
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    logger.info('User signed in successfully', { userId: user.id });

    res.json({
      token,
    });
  } finally {
    detachRequestId();
  }
}));

/**
 * GET /userinfo - Get current user information
 */
app.get("/userinfo", middleware, asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    // @ts-ignore
    const userId = req.userId;

    const user = await prismaClient.user.findUnique({
      where: { id: String(userId) },
    });

    if (!user) {
      logger.warn('User not found', { userId });
      throw new NotFoundError('User');
    }

    logger.info('User info retrieved', { userId });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } finally {
    detachRequestId();
  }
}));

/**
 * POST /room - Create a new room
 */
app.post("/room", middleware, asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      logger.warn('Room creation validation failed', { errors: parsedData.error.errors });
      throw new ValidationError('Invalid room data', { errors: parsedData.error.errors });
    }

    // @ts-ignore
    const userId = req.userId;

    const baseSlug = normalizeRoomSlug(parsedData.data.name);
    if (!baseSlug || baseSlug.length < 3) {
      throw new ValidationError('Room name must produce a valid slug (at least 3 characters)');
    }

    logger.info('Creating room', { adminId: userId, name: parsedData.data.name });

    // Create room in a transaction with unique slug generation
    const room = await executeTransaction(async (tx) => {
      let slug = baseSlug;
      let suffix = 1;

      // Find unique slug
      while (true) {
        const existing = await tx.room.findUnique({ where: { slug } });
        if (!existing) {
          break;
        }
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;

        // Safety limit to prevent infinite loops
        if (suffix > 1000) {
          throw new DatabaseError('Could not generate unique room slug');
        }
      }

      return await tx.room.create({
        data: {
          slug,
          adminId: userId,
        },
      });
    });

    const payload: CreateRoomResponse = {
      roomId: room.id,
      slug: room.slug,
    };

    logger.info('Room created successfully', { roomId: room.id, slug: room.slug });

    res.status(201).json(payload);
  } finally {
    detachRequestId();
  }
}));

/**
 * GET /chats/:roomId - Get chat messages for a room
 */
app.get("/chats/:roomId", asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    const roomId = Number(req.params.roomId);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      throw new ValidationError('Invalid room ID');
    }

    logger.info('Fetching chat messages', { roomId });

    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 1000,
    });

    logger.info('Chat messages retrieved', { roomId, count: messages.length });

    res.json({
      messages,
    });
  } finally {
    detachRequestId();
  }
}));

/**
 * POST /chats/:roomId/clear - Clear all chat messages in a room (admin only)
 */
app.post("/chats/:roomId/clear", middleware, asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    // @ts-ignore
    const userId = req.userId;

    const roomId = Number(req.params.roomId);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      throw new ValidationError('Invalid room ID');
    }

    logger.info('Clearing room canvas', { roomId, userId });

    // Clear messages in a transaction
    await executeTransaction(async (tx) => {
      // Verify user is the room admin
      const room = await tx.room.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        logger.warn('Room not found for clear operation', { roomId });
        throw new NotFoundError('Room');
      }

      if (room.adminId !== userId) {
        logger.warn('Unauthorized clear attempt', { roomId, userId, adminId: room.adminId });
        throw new AuthorizationError('Only room admin can clear the canvas');
      }

      // Delete all chat messages
      await tx.chat.deleteMany({
        where: {
          roomId: roomId,
        }
      });
    });

    logger.info('Room canvas cleared successfully', { roomId });

    res.json({ message: "Canvas cleared" });
  } finally {
    detachRequestId();
  }
}));

/**
 * GET /room/:slug - Look up a room by slug or ID
 */
app.get("/room/:slug", asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    const roomRef = (req.params.slug || '').trim();

    if (!roomRef) {
      throw new ValidationError('Room identifier is required');
    }

    logger.info('Room lookup', { roomRef });

    const normalizedSlug = normalizeRoomSlug(roomRef);
    const numericId = Number(roomRef);

    let data;
    if (Number.isInteger(numericId) && numericId > 0) {
      data = await prismaClient.room.findUnique({ where: { id: numericId } });
    } else {
      data = await prismaClient.room.findUnique({ where: { slug: normalizedSlug } });
    }

    if (!data) {
      logger.warn('Room not found', { roomRef });
      throw new NotFoundError('Room');
    }

    const payload: RoomLookupResponse = {
      message: "room found",
      data: {
        id: data.id,
        slug: data.slug,
      },
    };

    logger.info('Room found', { roomId: data.id, slug: data.slug });

    res.json(payload);
  } finally {
    detachRequestId();
  }
}));

/**
 * GET /health - Health check endpoint
 */
app.get("/health", asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();

  const health = {
    status: dbHealth.healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  };

  const statusCode = dbHealth.healthy ? 200 : 503;
  res.status(statusCode).json(health);
}));

/**
 * GET /ready - Readiness check endpoint
 */
app.get("/ready", asyncHandler(async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();

  if (!dbHealth.healthy) {
    res.status(503).json({
      ready: false,
      database: dbHealth,
    });
    return;
  }

  res.json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
}));

// Apply error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info('Routes registered:', {
    routes: [
      'POST /signup',
      'POST /signin',
      'GET /userinfo',
      'POST /room',
      'GET /chats/:roomId',
      'POST /chats/:roomId/clear',
      'GET /room/:slug',
      'GET /health',
      'GET /ready',
    ]
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await closeDatabaseConnection();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error instanceof Error ? error : undefined);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
