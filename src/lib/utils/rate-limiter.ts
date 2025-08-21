interface RateLimiterConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

export class RateLimiter {
  private timestamps: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    try {
      return await fn();
    } finally {
      this.recordExecution();
    }
  }

  private async waitForSlot(): Promise<void> {
    while (true) {
      this.clearOldTimestamps();
      if (this.timestamps.length < this.config.maxRequests) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private clearOldTimestamps(): void {
    const now = Date.now();
    const cutoff = now - this.config.timeWindow;
    this.timestamps = this.timestamps.filter(ts => ts > cutoff);
  }

  private recordExecution(): void {
    this.timestamps.push(Date.now());
  }
}
