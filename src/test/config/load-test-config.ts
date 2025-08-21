export const loadTestConfig = {
  general: {
    baseUrl: 'http://localhost:3001',
    rampUpPeriod: 30, // seconds
    sustainedPeriod: 300, // seconds
    rampDownPeriod: 30, // seconds
    maxVirtualUsers: 1000,
    requestTimeout: 30000, // milliseconds
  },
  endpoints: {
    availability: {
      path: '/api/availability',
      rateLimit: 1000, // requests per minute
      method: 'GET',
    },
    booking: {
      path: '/api/bookings',
      rateLimit: 500,
      method: 'POST',
    },
    modification: {
      path: '/api/bookings/:id',
      rateLimit: 200,
      method: 'PUT',
    },
    cancellation: {
      path: '/api/bookings/:id',
      rateLimit: 200,
      method: 'DELETE',
    },
  },
  redis: {
    host: 'localhost',
    port: 6379,
    monitoringInterval: 5000, // milliseconds
  },
  nginx: {
    upstreams: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    healthCheckInterval: 5000, // milliseconds
  },
  metrics: {
    samplingRate: 1000, // milliseconds
    percentiles: [50, 90, 95, 99],
    errorThreshold: 0.01, // 1% error rate threshold
    maxLatency: 500, // milliseconds
  },
};
