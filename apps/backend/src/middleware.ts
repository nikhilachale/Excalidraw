/**
 * Authentication middleware for Express
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, AuthenticationError, logger, attachRequestId, detachRequestId } from "@repo/common-backend";

export const middleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string;
  attachRequestId(requestId);

  try {
    const token = req.headers.authorization;

    if (!token) {
      logger.warn('Authentication failed: no token provided', {
        path: req.path,
        method: req.method,
      });
      throw new AuthenticationError('No authorization token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // @ts-ignore
    req.userId = decoded.userId;

    logger.debug('User authenticated', { userId: decoded.userId, path: req.path });

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    logger.warn('Authentication failed: invalid token', {
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new AuthenticationError('Invalid or expired token');
  } finally {
    detachRequestId();
  }
};
