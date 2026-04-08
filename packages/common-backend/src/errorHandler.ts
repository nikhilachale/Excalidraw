/**
 * Error handling middleware for Express
 */

import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import {
  AppError,
  toErrorResponse,
  isOperationalError,
  logger,
} from './index.js';

/**
 * Global error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string | undefined;

  // Log the error with context
  logger.logError(err, {
    path: req.path,
    method: req.method,
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Convert error to standard response
  const errorResponse = toErrorResponse(err, requestId);

  // Determine status code
  let statusCode = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (err instanceof Error && err.constructor.name === 'PrismaClientKnownRequestError') {
    statusCode = 500;
  } else if (err instanceof Error && err.constructor.name === 'ZodError') {
    statusCode = 400;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);

  // If error is not operational, log it for investigation
  if (!isOperationalError(err)) {
    logger.error('Non-operational error occurred', err instanceof Error ? err : undefined, {
      path: req.path,
      method: req.method,
      requestId,
    });
  }
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request ID generation middleware
 */
export const requestIdMiddleware: RequestHandler = (req, res, next): void => {
  const requestId = req.headers['x-request-id'] as string | undefined ||
                    generateRequestId();

  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler: RequestHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string | undefined;
  const errorResponse = toErrorResponse(
    new Error(`Route ${req.method} ${req.path} not found`),
    requestId
  );
  res.status(404).json(errorResponse);
};

/**
 * Validation error helper
 */
export function handleValidationError(error: unknown, context?: Record<string, unknown>): never {
  if (error instanceof Error && error.constructor.name === 'ZodError') {
    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      true,
      context
    );
  }
  throw error;
}
