import { pino } from 'pino';

export abstract class BaseValidation {
  protected logger: pino.Logger;
  protected testState: {
    startTime: number;
    errors: Array<{
      context: string;
      error: Error | string;
      timestamp: string;
    }>;
  };

  constructor(protected readonly validationType: string) {
    this.logger = pino({
      name: `validation:${validationType}`,
      level: 'debug'
    });
    this.testState = {
      startTime: Date.now(),
      errors: []
    };
  }

  public async validate(): Promise<boolean> {
    this.logger.debug('Test preconditions validated successfully');
    
    try {
      await this.runValidation();
      
      if (this.testState.errors.length > 0) {
        this.logger.error(`${this.validationType} validation failed:`, {
          errorCount: this.testState.errors.length,
          errors: this.testState.errors
        });
        return false;
      }
      
      this.logger.info(`${this.validationType} validation completed successfully`);
      return true;
    } catch (error) {
      this.logger.error(`${this.validationType} validation failed with error:`, {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  protected abstract runValidation(): Promise<void>;

  protected async runWithErrorHandling(
    operation: () => Promise<void>,
    context: string
  ): Promise<void> {
    try {
      await operation();
      this.logger.debug(`Successfully completed ${context}`);
    } catch (error) {
      this.testState.errors.push({
        context,
        error: error instanceof Error ? error : String(error),
        timestamp: new Date().toISOString()
      });
      this.logger.error(`Error in ${context}:`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error; // Re-throw to allow proper test failure handling
    }
  }
}
