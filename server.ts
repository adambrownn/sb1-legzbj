import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import { createLogger } from './src/lib/logger';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables first, but don't override existing ones
if (process.env.NODE_ENV !== 'test') {
    dotenv.config();
}

const logger = createLogger('booking-app');

logger.info('Starting server with configuration:', {
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    clientPort: process.env.CLIENT_PORT
});

const app = express();
const port = Number(process.env.PORT) || 3001;

// CORS configuration
const corsOptions = {
    origin: `http://localhost:${process.env.CLIENT_PORT || '3005'}`,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['*', 'Authorization']
};

logger.debug('CORS configuration:', corsOptions);

app.use(cors(corsOptions));
app.use(cookieParser()); // Required for CSRF
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Redis client
let redisClient;
if (process.env.NODE_ENV === 'test') {
    // Use mock Redis for tests
    const { mockRedisClient } = await import('./src/lib/redis');
    redisClient = mockRedisClient;
    logger.info('Using mock Redis client for tests');
    await redisClient.connect();
} else {
    // Use real Redis for non-test environments
    const { getRedisClient } = await import('./src/lib/redis');
    redisClient = await getRedisClient();
}

// Ensure Redis is available before starting the server
app.use(async (req, res, next) => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        await redisClient.ping();
        next();
    } catch (error) {
        logger.error('Redis connection error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return res.status(503).send('Service Unavailable: Redis not connected');
    }
});

// Import security middleware
import { csrfProtection, handleCSRFError, setCSRFToken, setupCSP, errorHandler } from './src/middleware/index.js';
// Import routes
import authRouter from './src/api/auth/index.js';
import bookingsRouter from './src/api/bookings/index.js';
import propertiesRouter from './src/api/properties/index.js';
import reviewsRouter from './src/api/reviews/index.js';
import paymentsRouter from './src/api/payments/index.js';

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount auth routes
app.use('/api/auth', authRouter);
// Mount other routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/payments', paymentsRouter);

// Apply security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Apply CSP
app.use(setupCSP);

// Debug middleware to log requests (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', req.body);
    }
    next();
  });
}

// Apply CSRF protection to all routes except authentication endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  // List of paths that don't require CSRF protection
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout', // 🔧 ADDED: Exclude logout from CSRF
    '/api/auth/request-password-reset',
    '/api/auth/verify-email',
    '/api/public',
    '/health'
  ];

  // 🔧 FIXED: More flexible path matching
  if (publicPaths.some(path => req.path.startsWith(path))) {
    console.log('🔧 CSRF DEBUG: Skipping CSRF for:', req.path);
    next();
  } else {
    console.log('🔧 CSRF DEBUG: Applying CSRF for:', req.path);
    csrfProtection(req, res, next);
  }
});

// Set CSRF token after protection middleware
app.use(setCSRFToken);

// Handle CSRF errors
app.use(handleCSRFError);

// Global error handler - should be last
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await redisClient.connect();
    }
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Client URL: http://localhost:${process.env.CLIENT_PORT || '3005'}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use. Please choose a different port.`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle process errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export app for testing
export { app };

// Start server only if not imported for testing
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
