// Mock process.env
process.env = {
  ...process.env,
  NEXT_PUBLIC_WEBSOCKET_URL: 'ws://localhost:3001',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'test@example.com',
  SMTP_PASS: 'test-password',
  TWILIO_ACCOUNT_SID: 'test-sid',
  TWILIO_AUTH_TOKEN: 'test-token',
  TWILIO_FROM_NUMBER: '+1234567890',
};

// Add any global test setup here
beforeAll(() => {
  // Setup any global test dependencies
});

afterAll(() => {
  // Cleanup any global test dependencies
});
