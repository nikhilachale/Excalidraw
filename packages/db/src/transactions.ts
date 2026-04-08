/**
 * Database transaction utilities with retry logic and error handling
 */

import { prismaClient } from './index.js';
import { DatabaseError, logger } from '@repo/common-backend';

export type TransactionIsolationLevel =
  | 'ReadUncommitted'
  | 'ReadCommitted'
  | 'RepeatableRead'
  | 'Serializable'
  | 'Snapshot';

export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  isolationLevel?: TransactionIsolationLevel;
}

/**
 * Default transaction options
 */
const DEFAULT_OPTIONS: TransactionOptions = {
  maxRetries: 3,
  retryDelay: 100,
  isolationLevel: 'ReadCommitted',
};

/**
 * Transient error codes that can be retried
 */
const RETRYABLE_ERROR_CODES = [
  'P1001', // Can't reach database server
  'P1002', // Database server error
  'P1008', // Connection timeout
  'P2034', // Transaction failed due to write conflict
];

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (
    error != null &&
    typeof error === 'object' &&
    'code' in error &&
    'constructor' in error &&
    error.constructor.name === 'PrismaClientKnownRequestError' &&
    typeof error.code === 'string'
  ) {
    return RETRYABLE_ERROR_CODES.includes(error.code);
  }
  return false;
}

/**
 * Sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function within a database transaction with automatic rollback
 */
export async function executeTransaction<T>(
  callback: (tx: Omit<typeof prismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    try {
      return await prismaClient.$transaction(
        async (tx: unknown) => {
          logger.debug(`Executing transaction (attempt ${attempt}/${opts.maxRetries})`, {
            operation: callback.name || 'anonymous',
          });

          const result = await callback(tx as Omit<typeof prismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>);

          logger.debug('Transaction completed successfully', {
            operation: callback.name || 'anonymous',
            attempt,
          });

          return result;
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: opts.isolationLevel,
        }
      );
    } catch (error) {
      lastError = error;

      logger.warn('Transaction failed', {
        operation: callback.name || 'anonymous',
        attempt,
        maxRetries: opts.maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt >= opts.maxRetries! || !isRetryableError(error)) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = opts.retryDelay! * Math.pow(2, attempt - 1);
      logger.info(`Retrying transaction after ${delay}ms`, { attempt });
      await sleep(delay);
    }
  }

  // All retries exhausted
  logger.error('Transaction failed after all retries', lastError instanceof Error ? lastError : undefined, {
    operation: callback.name || 'anonymous',
    maxRetries: opts.maxRetries,
  });

  throw new DatabaseError(
    `Transaction failed after ${opts.maxRetries} attempts`,
    {
      operation: callback.name || 'anonymous',
      attempts: opts.maxRetries,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
    }
  );
}

/**
 * Execute a database operation with retry logic (outside transaction)
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    try {
      logger.debug(`Executing database operation (attempt ${attempt}/${opts.maxRetries})`, {
        operation: operation.name || 'anonymous',
      });

      const result = await operation();

      logger.debug('Database operation completed successfully', {
        operation: operation.name || 'anonymous',
        attempt,
      });

      return result;
    } catch (error) {
      lastError = error;

      logger.warn('Database operation failed', {
        operation: operation.name || 'anonymous',
        attempt,
        maxRetries: opts.maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt >= opts.maxRetries! || !isRetryableError(error)) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = opts.retryDelay! * Math.pow(2, attempt - 1);
      logger.info(`Retrying operation after ${delay}ms`, { attempt });
      await sleep(delay);
    }
  }

  // All retries exhausted
  logger.error('Database operation failed after all retries', lastError instanceof Error ? lastError : undefined, {
    operation: operation.name || 'anonymous',
    maxRetries: opts.maxRetries,
  });

  throw new DatabaseError(
    `Database operation failed after ${opts.maxRetries} attempts`,
    {
      operation: operation.name || 'anonymous',
      attempts: opts.maxRetries,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
    }
  );
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await prismaClient.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    logger.debug('Database health check passed', { latency });

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Database health check failed', error instanceof Error ? error : undefined, {
      latency: Date.now() - startTime,
    });

    return {
      healthy: false,
      error: errorMessage,
    };
  }
}

/**
 * Graceful shutdown for database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    logger.info('Closing database connection...');
    await prismaClient.$disconnect();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection', error instanceof Error ? error : undefined);
    throw error;
  }
}
