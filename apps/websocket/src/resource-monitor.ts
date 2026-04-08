interface UserResourceUsage {
  messageCount: number;
  lastResetTime: number;
  connectionDuration: number;
}

const RESOURCE_LIMITS = {
  maxUserMessagesPerMinute: 300, // 300 messages per minute per user
  maxConnectionDuration: 2 * 60 * 60 * 1000, // 2 hours max connection duration
  maxMessageCount: 1000, // Max messages per connection
  idleTimeout: 10 * 60 * 1000, // 10 minutes idle timeout
  memoryCheckInterval: 60 * 1000, // Check memory every minute
};

class ResourceMonitor {
  private userResources = new Map<string, UserResourceUsage>();
  private connectionResources = new Map<string, { messageCount: number; lastActivity: number }>();

  /**
   * Track a message from a user
   */
  trackMessage(userId: string, connectionId: string): boolean {
    const now = Date.now();

    // Track per-user resources
    let userResource = this.userResources.get(userId);
    if (!userResource || now - userResource.lastResetTime > 60000) {
      userResource = {
        messageCount: 0,
        lastResetTime: now,
        connectionDuration: 0,
      };
      this.userResources.set(userId, userResource);
    }

    userResource.messageCount++;

    if (userResource.messageCount > RESOURCE_LIMITS.maxUserMessagesPerMinute) {
      return false; // Rate limit exceeded
    }

    // Track per-connection resources
    let connResource = this.connectionResources.get(connectionId);
    if (!connResource) {
      connResource = {
        messageCount: 0,
        lastActivity: now,
      };
      this.connectionResources.set(connectionId, connResource);
    }

    connResource.messageCount++;
    connResource.lastActivity = now;

    if (connResource.messageCount > RESOURCE_LIMITS.maxMessageCount) {
      return false; // Connection sent too many messages
    }

    return true;
  }

  /**
   * Check if a connection should be terminated due to resource limits
   */
  shouldTerminate(connectionId: string, connectionStartTime: number): boolean {
    const now = Date.now();
    const connResource = this.connectionResources.get(connectionId);

    if (!connResource) {
      return false;
    }

    // Check idle timeout
    const idleTime = now - connResource.lastActivity;
    if (idleTime > RESOURCE_LIMITS.idleTimeout) {
      return true;
    }

    // Check connection duration
    const connectionDuration = now - connectionStartTime;
    if (connectionDuration > RESOURCE_LIMITS.maxConnectionDuration) {
      return true;
    }

    return false;
  }

  /**
   * Remove connection from tracking
   */
  removeConnection(connectionId: string, userId: string): void {
    this.connectionResources.delete(connectionId);

    // Clean up user resource if needed
    const userResource = this.userResources.get(userId);
    if (userResource) {
      userResource.connectionDuration += Date.now() - (userResource.lastResetTime - userResource.connectionDuration);
    }
  }

  /**
   * Find idle connections
   */
  findIdleConnections(): string[] {
    const now = Date.now();
    const idleConnections: string[] = [];

    for (const [connectionId, resource] of this.connectionResources.entries()) {
      const idleTime = now - resource.lastActivity;
      if (idleTime > RESOURCE_LIMITS.idleTimeout) {
        idleConnections.push(connectionId);
      }
    }

    return idleConnections;
  }

  /**
   * Get system resource statistics
   */
  getStats() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const totalMessages = Array.from(this.connectionResources.values()).reduce(
      (sum, r) => sum + r.messageCount,
      0
    );

    return {
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      trackedUsers: this.userResources.size,
      activeConnections: this.connectionResources.size,
      totalMessages,
    };
  }

  /**
   * Clean up old resource data
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up user resources that haven't been active in a while
    for (const [userId, resource] of this.userResources.entries()) {
      if (now - resource.lastResetTime > 300000) { // 5 minutes
        this.userResources.delete(userId);
      }
    }
  }
}

// Export singleton instance
export const resourceMonitor = new ResourceMonitor();

// Cleanup interval: remove old records every 5 minutes
setInterval(() => resourceMonitor.cleanup(), 300000);

// Automatic cleanup of idle connections
setInterval(() => {
  const idleConnections = resourceMonitor.findIdleConnections();
  for (const connectionId of idleConnections) {
    console.log(`⚠️  Terminating idle connection: ${connectionId}`);
    // Note: Actual termination should be handled by the WebSocket server
  }
}, RESOURCE_LIMITS.idleTimeout / 2); // Check every half the idle timeout
