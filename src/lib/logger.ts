import { pino } from 'pino';

// Create a shared logger instance with consistent configuration
export const logger = pino({
  name: 'booking-app',
  level: process.env.LOG_LEVEL || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  // Add timestamp to all logs
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  // Add additional default fields
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive information
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    '*.password',
    '*.token',
    '*.key',
  ],
});

// Create namespace loggers for different modules
export const createLogger = (namespace: string) => logger.child({ namespace });

// Export commonly used log levels
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

export default logger;
