interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

// Rate limit configurations
const USER_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10, // 10 messages per second
  windowMs: 1000,
};

const ROOM_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100, // 100 messages per second per room
  windowMs: 1000,
};

const IP_CONNECTION_LIMIT = {
  maxConnections: 5, // 5 connections per IP
};

class RateLimiter {
  private userLimits = new Map<string, RateLimitTracker>();
  private roomLimits = new Map<string, RateLimitTracker>();
  private ipConnections = new Map<string, Set<string>>();

  /**
   * Check if a user has exceeded their rate limit
   */
  checkUserLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const tracker = this.userLimits.get(userId);

    if (!tracker || now > tracker.resetTime) {
      // Reset or create new tracker
      const newTracker: RateLimitTracker = {
        count: 1,
        resetTime: now + USER_RATE_LIMIT.windowMs,
      };
      this.userLimits.set(userId, newTracker);
      return {
        allowed: true,
        remaining: USER_RATE_LIMIT.maxRequests - 1,
        resetTime: newTracker.resetTime,
      };
    }

    if (tracker.count >= USER_RATE_LIMIT.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: tracker.resetTime,
      };
    }

    tracker.count++;
    return {
      allowed: true,
      remaining: USER_RATE_LIMIT.maxRequests - tracker.count,
      resetTime: tracker.resetTime,
    };
  }

  /**
   * Check if a room has exceeded its rate limit
   */
  checkRoomLimit(roomId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const tracker = this.roomLimits.get(roomId);

    if (!tracker || now > tracker.resetTime) {
      // Reset or create new tracker
      const newTracker: RateLimitTracker = {
        count: 1,
        resetTime: now + ROOM_RATE_LIMIT.windowMs,
      };
      this.roomLimits.set(roomId, newTracker);
      return {
        allowed: true,
        remaining: ROOM_RATE_LIMIT.maxRequests - 1,
        resetTime: newTracker.resetTime,
      };
    }

    if (tracker.count >= ROOM_RATE_LIMIT.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: tracker.resetTime,
      };
    }

    tracker.count++;
    return {
      allowed: true,
      remaining: ROOM_RATE_LIMIT.maxRequests - tracker.count,
      resetTime: tracker.resetTime,
    };
  }

  /**
   * Check if an IP can establish a new connection
   */
  checkIpLimit(ip: string, connectionId: string): { allowed: boolean; count: number } {
    const connections = this.ipConnections.get(ip);

    if (!connections) {
      this.ipConnections.set(ip, new Set([connectionId]));
      return { allowed: true, count: 1 };
    }

    if (connections.size >= IP_CONNECTION_LIMIT.maxConnections) {
      return { allowed: false, count: connections.size };
    }

    connections.add(connectionId);
    return { allowed: true, count: connections.size };
  }

  /**
   * Remove a connection from IP tracking
   */
  removeConnection(ip: string, connectionId: string): void {
    const connections = this.ipConnections.get(ip);
    if (connections) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.ipConnections.delete(ip);
      }
    }
  }

  /**
   * Clean up expired rate limit trackers
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up user limits
    for (const [userId, tracker] of this.userLimits.entries()) {
      if (now > tracker.resetTime) {
        this.userLimits.delete(userId);
      }
    }

    // Clean up room limits
    for (const [roomId, tracker] of this.roomLimits.entries()) {
      if (now > tracker.resetTime) {
        this.roomLimits.delete(roomId);
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      activeUsers: this.userLimits.size,
      activeRooms: this.roomLimits.size,
      trackedIps: this.ipConnections.size,
      totalConnections: Array.from(this.ipConnections.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup interval: remove expired trackers every 30 seconds
setInterval(() => rateLimiter.cleanup(), 30000);
