import { BaseValidation } from '../../validate-base';
import { webSocketService } from '../../../lib/services/websocket.service';
import { retryWithBackoff } from '../../config/unified-test-config';
import { createLogger } from '../../../lib/logger';

export class WebSocketConnectionTests extends BaseValidation {
  private wsService = webSocketService.getInstance();
  private logger = createLogger('websocket-connection-tests');
  private successCount = 0;
  private failureCount = 0;

  constructor() {
    super('WebSocketConnection');
  }

  protected async runValidation(): Promise<void> {
    await this.runWithErrorHandling(async () => {
      await this.validateConnectionStability();
    }, 'Connection stability validation');

    await this.runWithErrorHandling(async () => {
      await this.validateReconnectionBackoff();
    }, 'Reconnection backoff validation');

    await this.runWithErrorHandling(async () => {
      await this.validateHeartbeat();
    }, 'Heartbeat validation');

    this.logger.info('WebSocket connection validation completed', {
      successCount: this.successCount,
      failureCount: this.failureCount
    });
  }

  private async validateConnectionStability() {
    this.logger.debug('Starting connection stability validation');

    try {
      // Initial connection
      await this.wsService.connect();
      
      // Monitor connection for 30 seconds
      const startTime = Date.now();
      const monitorDuration = 30000;
      let disconnectCount = 0;
      
      while (Date.now() - startTime < monitorDuration) {
        if (!this.wsService.isConnected()) {
          disconnectCount++;
          this.logger.warn('Connection lost during stability test');
          await this.wsService.connect();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (disconnectCount === 0) {
        this.successCount++;
        this.logger.debug('Connection remained stable for the entire duration');
      } else {
        throw new Error(`Connection unstable: ${disconnectCount} disconnections occurred`);
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Connection stability validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateReconnectionBackoff() {
    this.logger.debug('Starting reconnection backoff validation');

    try {
      const maxAttempts = 3;
      const baseDelay = 1000;
      let lastAttemptTime = 0;
      let attemptCount = 0;

      // Force disconnect
      await this.wsService.disconnect();

      while (attemptCount < maxAttempts) {
        const currentTime = Date.now();
        const expectedDelay = baseDelay * Math.pow(2, attemptCount);

        if (currentTime - lastAttemptTime >= expectedDelay) {
          await this.wsService.connect();
          lastAttemptTime = currentTime;
          attemptCount++;

          this.logger.debug('Reconnection attempt', {
            attempt: attemptCount,
            delay: expectedDelay
          });

          if (this.wsService.isConnected()) {
            break;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (this.wsService.isConnected()) {
        this.successCount++;
        this.logger.debug('Successfully validated reconnection backoff');
      } else {
        throw new Error('Failed to reconnect after maximum attempts');
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Reconnection backoff validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateHeartbeat() {
    this.logger.debug('Starting heartbeat validation');

    try {
      await this.wsService.connect();
      
      // Monitor heartbeat for 1 minute
      const startTime = Date.now();
      const monitorDuration = 60000;
      const heartbeatInterval = 15000;
      let lastHeartbeat = Date.now();
      let missedHeartbeats = 0;

      while (Date.now() - startTime < monitorDuration) {
        const currentTime = Date.now();
        
        if (currentTime - lastHeartbeat > heartbeatInterval) {
          const isAlive = await this.wsService.ping();
          
          if (!isAlive) {
            missedHeartbeats++;
            this.logger.warn('Missed heartbeat detected');
          } else {
            lastHeartbeat = currentTime;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (missedHeartbeats === 0) {
        this.successCount++;
        this.logger.debug('Heartbeat remained stable for the entire duration');
      } else {
        throw new Error(`Unstable heartbeat: ${missedHeartbeats} beats missed`);
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Heartbeat validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
