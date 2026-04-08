/**
 * Custom error types for the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization failed') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 500, 'DATABASE_ERROR', true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    context?: Record<string, unknown>;
    requestId?: string;
  };
}

/**
 * Convert error to standardized error response
 */
export function toErrorResponse(error: unknown, requestId?: string): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        context: error.context,
        requestId,
      },
    };
  }

  // Handle Prisma errors
  if (error instanceof Error && error.constructor.name === 'PrismaClientKnownRequestError') {
    return {
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        statusCode: 500,
        context: { originalMessage: error.message },
        requestId,
      },
    };
  }

  // Handle Zod validation errors
  if (error instanceof Error && error.constructor.name === 'ZodError') {
    return {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        context: { originalError: error.message },
        requestId,
      },
    };
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    error: {
      message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      requestId,
    },
  };
}

/**
 * Check if error is operational (expected and can be handled)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
