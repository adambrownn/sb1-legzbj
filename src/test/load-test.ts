import { loadTestConfig } from './config/load-test-config';
import { loadTestData } from './mocks/load-test-data';
import autocannon from 'autocannon';
import Redis from 'ioredis';
import axios from 'axios';
import pino from 'pino';
import { EventEmitter } from 'events';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

export class LoadTest extends EventEmitter {
  private redis: Redis;
  private metrics: {
    responseTimes: number[];
    errors: number;
    requests: number;
    cacheHits: number;
    cacheMisses: number;
    throughput: number[];
  };

  constructor() {
    super();
    this.redis = new Redis(loadTestConfig.redis);
    this.metrics = {
      responseTimes: [],
      errors: 0,
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      throughput: [],
    };
  }

  private async monitorRedisCache() {
    const startTime = Date.now();
    let previousHits = 0;
    let previousMisses = 0;

    setInterval(async () => {
      const info = await this.redis.info('stats');
      const hits = parseInt(info.match(/keyspace_hits:(\d+)/)[1]);
      const misses = parseInt(info.match(/keyspace_misses:(\d+)/)[1]);

      this.metrics.cacheHits += hits - previousHits;
      this.metrics.cacheMisses += misses - previousMisses;

      previousHits = hits;
      previousMisses = misses;

      const hitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses);
      logger.info(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`);
    }, loadTestConfig.redis.monitoringInterval);
  }

  private async monitorNginxHealth() {
    setInterval(async () => {
      for (const upstream of loadTestConfig.nginx.upstreams) {
        try {
          const start = Date.now();
          await axios.get(`${upstream}/health`);
          const responseTime = Date.now() - start;
          logger.info(`Upstream ${upstream} health check: OK (${responseTime}ms)`);
        } catch (error) {
          logger.error(`Upstream ${upstream} health check failed: ${error.message}`);
        }
      }
    }, loadTestConfig.nginx.healthCheckInterval);
  }

  private createInstance(endpoint: string, method: string, payload?: any) {
    return autocannon({
      url: `${loadTestConfig.general.baseUrl}${endpoint}`,
      connections: loadTestConfig.general.maxVirtualUsers,
      duration: loadTestConfig.general.sustainedPeriod,
      amount: undefined,
      timeout: loadTestConfig.general.requestTimeout,
      method,
      headers: {
        'content-type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
      setupClient: (client) => {
        client.on('response', (client, statusCode, resBytes, responseTime) => {
          this.metrics.responseTimes.push(responseTime);
          this.metrics.requests++;
          if (statusCode >= 400) {
            this.metrics.errors++;
          }
        });
      },
    });
  }

  private async testAvailabilityEndpoint() {
    logger.info('Testing availability endpoint...');
    const instance = this.createInstance(
      loadTestConfig.endpoints.availability.path,
      loadTestConfig.endpoints.availability.method
    );
    
    return new Promise((resolve) => {
      instance.on('done', resolve);
    });
  }

  private async testBookingEndpoint() {
    logger.info('Testing booking endpoint...');
    const instance = this.createInstance(
      loadTestConfig.endpoints.booking.path,
      loadTestConfig.endpoints.booking.method,
      loadTestData.generateRandomBooking()
    );
    
    return new Promise((resolve) => {
      instance.on('done', resolve);
    });
  }

  private async testModificationEndpoint() {
    logger.info('Testing modification endpoint...');
    const modRequest = loadTestData.modificationRequests[
      Math.floor(Math.random() * loadTestData.modificationRequests.length)
    ];
    
    const instance = this.createInstance(
      loadTestConfig.endpoints.modification.path.replace(':id', modRequest.bookingId),
      loadTestConfig.endpoints.modification.method,
      modRequest.changes
    );
    
    return new Promise((resolve) => {
      instance.on('done', resolve);
    });
  }

  private calculateMetrics() {
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const percentiles = loadTestConfig.metrics.percentiles.map(p => {
      const index = Math.ceil((p / 100) * sortedTimes.length) - 1;
      return {
        percentile: p,
        value: sortedTimes[index],
      };
    });

    const errorRate = this.metrics.errors / this.metrics.requests;
    const avgThroughput = this.metrics.throughput.reduce((a, b) => a + b, 0) / 
      this.metrics.throughput.length;

    return {
      totalRequests: this.metrics.requests,
      errorRate,
      percentiles,
      avgThroughput,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
    };
  }

  private saveReport(metrics: any) {
    const report = {
      timestamp: new Date().toISOString(),
      config: loadTestConfig,
      metrics,
    };

    const reportPath = join(__dirname, '..', '..', 'reports', 
      `load-test-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logger.info(`Report saved to ${reportPath}`);
  }

  async runLoadTest(): Promise<{ success: number; failure: number; metrics: any }> {
    logger.info('Starting load test...');
    
    // Start monitoring
    await this.monitorRedisCache();
    await this.monitorNginxHealth();

    // Run tests
    await this.testAvailabilityEndpoint();
    await this.testBookingEndpoint();
    await this.testModificationEndpoint();

    // Calculate and save metrics
    const metrics = this.calculateMetrics();
    this.saveReport(metrics);

    // Log results
    logger.info('\nLoad Test Results:');
    logger.info(`Total Requests: ${metrics.totalRequests}`);
    logger.info(`Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    logger.info('Response Time Percentiles:');
    metrics.percentiles.forEach(({ percentile, value }) => {
      logger.info(`  p${percentile}: ${value}ms`);
    });
    logger.info(`Average Throughput: ${Math.round(metrics.avgThroughput)} req/sec`);
    logger.info(`Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(2)}%`);

    // Cleanup
    await this.redis.quit();

    return {
      success: metrics.totalRequests - metrics.errorRate * metrics.totalRequests,
      failure: metrics.errorRate * metrics.totalRequests,
      metrics,
    };
  }
}

// Run load test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const loadTest = new LoadTest();
  loadTest.runLoadTest().catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}
