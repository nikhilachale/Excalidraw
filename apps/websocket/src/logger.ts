enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
}

enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INVALID_EVENT = 'INVALID_EVENT',
  CONNECTION_LIMIT_EXCEEDED = 'CONNECTION_LIMIT_EXCEEDED',
  ABUSIVE_BEHAVIOR = 'ABUSIVE_BEHAVIOR',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  ip?: string;
  roomId?: string;
  eventType?: SecurityEventType;
  metadata?: Record<string, unknown>;
}

class SecurityLogger {
  private logs: LogEntry[] = [];
  private maxLogSize = 1000;

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };

    this.logs.push(entry);

    // Keep log size in check
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }

    // Output to console with color coding
    const color = this.getConsoleColor(level);
    console.log(`\x1b[${color}m[${entry.timestamp}] [${level}] ${message}\x1b[0m`);

    if (Object.keys(metadata || {}).length > 0) {
      console.log('  Metadata:', JSON.stringify(metadata, null, 2));
    }
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.INFO:
        return '36'; // Cyan
      case LogLevel.WARN:
        return '33'; // Yellow
      case LogLevel.ERROR:
        return '31'; // Red
      case LogLevel.SECURITY:
        return '35'; // Magenta
      default:
        return '0';
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  security(eventType: SecurityEventType, message: string, metadata: Record<string, unknown> = {}): void {
    this.log(LogLevel.SECURITY, message, {
      eventType,
      ...metadata,
    });

    // Send alert for serious security events
    if (
      eventType === SecurityEventType.ABUSIVE_BEHAVIOR ||
      eventType === SecurityEventType.CONNECTION_LIMIT_EXCEEDED
    ) {
      this.sendAlert(eventType, message, metadata);
    }
  }

  logConnection(userId: string, ip: string, metadata?: Record<string, unknown>): void {
    this.info(`User connected: ${userId}`, {
      userId,
      ip,
      ...metadata,
    });
  }

  logDisconnection(userId: string, ip: string, metadata?: Record<string, unknown>): void {
    this.info(`User disconnected: ${userId}`, {
      userId,
      ip,
      ...metadata,
    });
  }

  logRateLimit(userId: string, type: 'user' | 'room' | 'ip', metadata?: Record<string, unknown>): void {
    this.security(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for ${type}: ${userId}`,
      {
        userId,
        type,
        ...metadata,
      }
    );
  }

  logInvalidToken(ip: string, metadata?: Record<string, unknown>): void {
    this.security(SecurityEventType.INVALID_TOKEN, 'Invalid or expired token used', {
      ip,
      ...metadata,
    });
  }

  logUnauthorizedAccess(userId: string, action: string, roomId?: string): void {
    this.security(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      `Unauthorized access attempt: ${action}`,
      {
        userId,
        roomId,
        action,
      }
    );
  }

  logInvalidEvent(userId: string, eventType: string, error: string): void {
    this.security(SecurityEventType.INVALID_EVENT, `Invalid WebSocket event: ${eventType}`, {
      userId,
      eventType,
      error,
    });
  }

  logConnectionLimit(ip: string, count: number): void {
    this.security(
      SecurityEventType.CONNECTION_LIMIT_EXCEEDED,
      `Connection limit exceeded for IP: ${ip}`,
      {
        ip,
        count,
      }
    );
  }

  logAbusiveBehavior(userId: string, reason: string, metadata?: Record<string, unknown>): void {
    this.security(SecurityEventType.ABUSIVE_BEHAVIOR, `Abusive behavior detected: ${reason}`, {
      userId,
      reason,
      ...metadata,
    });
  }

  logResourceLimit(userId: string, limitType: string, metadata?: Record<string, unknown>): void {
    this.security(
      SecurityEventType.RESOURCE_LIMIT_EXCEEDED,
      `Resource limit exceeded: ${limitType}`,
      {
        userId,
        limitType,
        ...metadata,
      }
    );
  }

  private sendAlert(eventType: SecurityEventType, message: string, metadata: Record<string, unknown>): void {
    // In production, this would send alerts to monitoring services
    // For now, we'll log it prominently
    console.log(`\x1b[31;1m🚨 SECURITY ALERT: ${eventType}\x1b[0m`);
    console.log(`\x1b[31;1mMessage: ${message}\x1b[0m`);
    console.log(`\x1b[31;1mMetadata: ${JSON.stringify(metadata, null, 2)}\x1b[0m`);

    // TODO: Integrate with monitoring service (e.g., Sentry, DataDog, etc.)
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  getSecurityEvents(limit?: number): LogEntry[] {
    return this.getLogs(LogLevel.SECURITY, limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      info: 0,
      warn: 0,
      error: 0,
      security: 0,
      securityEvents: {} as Record<SecurityEventType, number>,
    };

    for (const log of this.logs) {
      stats[log.level.toLowerCase() as keyof typeof stats]++;

      if (log.eventType) {
        stats.securityEvents[log.eventType] = (stats.securityEvents[log.eventType] || 0) + 1;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const logger = new SecurityLogger();
