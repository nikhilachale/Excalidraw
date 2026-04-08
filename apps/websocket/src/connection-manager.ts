interface ConnectionAttempt {
  attempts: number;
  lastAttemptTime: number;
  cooldownUntil: number;
  backoffMultiplier: number;
}

const CONNECTION_RATE_LIMIT = {
  maxAttempts: 3, // 3 attempts per minute
  windowMs: 60000, // 1 minute window
  baseCooldownMs: 5000, // 5 seconds base cooldown
  maxCooldownMs: 60000, // 60 seconds max cooldown
};

class ConnectionManager {
  private attempts = new Map<string, ConnectionAttempt>();
  private connections = new Map<string, { userId: string; connectTime: number; lastActivity: number }>();

  /**
   * Check if an IP can establish a new connection
   * Implements rate limiting with exponential backoff
   */
  canConnect(ip: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const attemptData = this.attempts.get(ip);

    if (!attemptData) {
      // First time connection or expired
      this.attempts.set(ip, {
        attempts: 1,
        lastAttemptTime: now,
        cooldownUntil: 0,
        backoffMultiplier: 1,
      });
      return { allowed: true };
    }

    // Check if in cooldown
    if (now < attemptData.cooldownUntil) {
      const remainingMs = attemptData.cooldownUntil - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return {
        allowed: false,
        message: `Too many connection attempts. Please wait ${remainingSeconds} seconds.`,
      };
    }

    // Check if within rate limit window
    const timeSinceFirstAttempt = now - attemptData.lastAttemptTime;
    if (timeSinceFirstAttempt > CONNECTION_RATE_LIMIT.windowMs) {
      // Window expired, reset
      this.attempts.set(ip, {
        attempts: 1,
        lastAttemptTime: now,
        cooldownUntil: 0,
        backoffMultiplier: 1,
      });
      return { allowed: true };
    }

    // Check if max attempts reached
    if (attemptData.attempts >= CONNECTION_RATE_LIMIT.maxAttempts) {
      // Calculate cooldown with exponential backoff
      const cooldownMs = Math.min(
        CONNECTION_RATE_LIMIT.baseCooldownMs * attemptData.backoffMultiplier,
        CONNECTION_RATE_LIMIT.maxCooldownMs
      );

      // Update attempt data with cooldown
      this.attempts.set(ip, {
        attempts: attemptData.attempts + 1,
        lastAttemptTime: now,
        cooldownUntil: now + cooldownMs,
        backoffMultiplier: Math.min(attemptData.backoffMultiplier * 2, 12), // Max 12x multiplier
      });

      const cooldownSeconds = Math.ceil(cooldownMs / 1000);
      return {
        allowed: false,
        message: `Too many connection attempts. Please wait ${cooldownSeconds} seconds.`,
      };
    }

    // Increment attempts
    this.attempts.set(ip, {
      attempts: attemptData.attempts + 1,
      lastAttemptTime: attemptData.lastAttemptTime, // Keep original window start
      cooldownUntil: attemptData.cooldownUntil,
      backoffMultiplier: attemptData.backoffMultiplier,
    });

    return { allowed: true };
  }

  /**
   * Register a successful connection
   */
  registerConnection(connectionId: string, userId: string): void {
    this.connections.set(connectionId, {
      userId,
      connectTime: Date.now(),
      lastActivity: Date.now(),
    });
  }

  /**
   * Update activity timestamp for a connection
   */
  updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): { userId?: string; duration?: number } | undefined {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const duration = Date.now() - connection.connectTime;
      this.connections.delete(connectionId);
      return { userId: connection.userId, duration };
    }
    return undefined;
  }

  /**
   * Get connections for a specific user
   */
  getUserConnections(userId: string): string[] {
    const connections: string[] = [];
    for (const [id, conn] of this.connections.entries()) {
      if (conn.userId === userId) {
        connections.push(id);
      }
    }
    return connections;
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    const now = Date.now();
    const idleThreshold = 5 * 60 * 1000; // 5 minutes

    let idleConnections = 0;
    let totalConnectionTime = 0;
    let connectionCounts = new Map<string, number>();

    for (const [id, conn] of this.connections.entries()) {
      const idleTime = now - conn.lastActivity;
      if (idleTime > idleThreshold) {
        idleConnections++;
      }

      totalConnectionTime += (now - conn.connectTime);

      const userCount = connectionCounts.get(conn.userId) || 0;
      connectionCounts.set(conn.userId, userCount + 1);
    }

    return {
      totalConnections: this.connections.size,
      idleConnections,
      trackedIps: this.attempts.size,
      averageConnectionTime: this.connections.size > 0
        ? Math.round(totalConnectionTime / this.connections.size / 1000)
        : 0,
      maxConnectionsPerUser: Math.max(0, ...Array.from(connectionCounts.values())),
    };
  }

  /**
   * Clean up old connection attempt records
   */
  cleanup(): void {
    const now = Date.now();

    for (const [ip, attemptData] of this.attempts.entries()) {
      // Remove if window has expired and not in cooldown
      if (
        now - attemptData.lastAttemptTime > CONNECTION_RATE_LIMIT.windowMs &&
        now > attemptData.cooldownUntil
      ) {
        this.attempts.delete(ip);
      }
    }
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();

// Cleanup interval: remove old records every 5 minutes
setInterval(() => connectionManager.cleanup(), 300000);
