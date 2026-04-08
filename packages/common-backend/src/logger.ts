/**
 * Logging utilities with context support
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private requestId?: string;

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  clearRequestId(): void {
    this.requestId = undefined;
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      this.requestId ? `[${this.requestId}]` : '',
      entry.message,
    ].filter(Boolean);

    let logLine = parts.join(' ');

    if (entry.context && Object.keys(entry.context).length > 0) {
      logLine += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      logLine += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        logLine += `\n${entry.error.stack}`;
      }
    }

    return logLine;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formatted = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log an error with additional context
   */
  logError(error: unknown, context?: LogContext): void {
    if (error instanceof Error) {
      this.error(error.message, error, context);
    } else {
      this.error('Unknown error occurred', undefined, { ...context, error });
    }
  }
}

export const logger = new Logger();

/**
 * Create a child logger with specific context
 */
export function createChildLogger(baseContext: LogContext): {
  debug: (message: string, additionalContext?: LogContext) => void;
  info: (message: string, additionalContext?: LogContext) => void;
  warn: (message: string, additionalContext?: LogContext) => void;
  error: (message: string, error?: Error, additionalContext?: LogContext) => void;
  logError: (error: unknown, additionalContext?: LogContext) => void;
} {
  return {
    debug: (message: string, additionalContext?: LogContext) => {
      logger.debug(message, { ...baseContext, ...additionalContext });
    },
    info: (message: string, additionalContext?: LogContext) => {
      logger.info(message, { ...baseContext, ...additionalContext });
    },
    warn: (message: string, additionalContext?: LogContext) => {
      logger.warn(message, { ...baseContext, ...additionalContext });
    },
    error: (message: string, error?: Error, additionalContext?: LogContext) => {
      logger.error(message, error, { ...baseContext, ...additionalContext });
    },
    logError: (error: unknown, additionalContext?: LogContext) => {
      logger.logError(error, { ...baseContext, ...additionalContext });
    },
  };
}

/**
 * Middleware to attach request ID to logger
 */
export function attachRequestId(requestId: string): void {
  logger.setRequestId(requestId);
}

export function detachRequestId(): void {
  logger.clearRequestId();
}
