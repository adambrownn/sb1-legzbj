import pino from 'pino';

export const logger = pino({
  name: 'property-booking',
  level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});
