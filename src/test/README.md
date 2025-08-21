# Booking System Validation Suite

A comprehensive testing suite for validating the booking system's functionality, performance, and scalability.

## Prerequisites

### System Requirements
- Node.js (v16 or higher)
- Redis Server (v6 or higher)
- NGINX
- TypeScript

### Environment Variables
Create a `.env` file in the project root with the following variables:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start Redis server:
```bash
redis-server
```

3. Configure NGINX:
```bash
# Copy the provided NGINX configuration
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo service nginx restart
```

4. Start application servers:
```bash
# Terminal 1
npm run start:server1

# Terminal 2
npm run start:server2

# Terminal 3
npm run start:server3
```

## Running Tests

### 1. Run All Tests
```bash
npm run test:unified
```

### 2. Run Individual Test Suites
```bash
# Calendar Sync Tests
npm run test:calendar-sync

# Availability Tests
npm run test:availability

# Payment Gateway Tests
npm run test:payment

# Booking Management Tests
npm run test:booking

# Load Tests
npm run test:load
```

## Test Reports

Reports are generated in both JSON and HTML formats in the `reports` directory:
- `unified-test-report-{timestamp}.json`: Detailed JSON report
- `unified-test-report-{timestamp}.html`: Human-readable HTML report

## Debugging Guide

### Common Issues and Solutions

1. **Redis Connection Failed**
   - Check if Redis server is running: `redis-cli ping`
   - Verify Redis configuration in `.env`
   - Check Redis logs: `tail -f /var/log/redis/redis-server.log`

2. **NGINX Health Check Failed**
   - Verify NGINX is running: `sudo service nginx status`
   - Check NGINX configuration: `sudo nginx -t`
   - Check NGINX logs: `tail -f /var/log/nginx/error.log`

3. **Payment Tests Failed**
   - Verify Stripe API keys
   - Check Stripe webhook configuration
   - Use Stripe CLI to debug webhooks locally

4. **Email/SMS Notifications Failed**
   - Verify SMTP/Twilio credentials
   - Check email server connectivity
   - Review notification service logs

### Performance Issues

1. **High Response Times**
   - Check Redis cache hit rates
   - Monitor system resources (CPU, Memory)
   - Review NGINX access logs for bottlenecks

2. **Cache Efficiency**
   - Monitor Redis memory usage: `redis-cli info memory`
   - Check cache eviction policies
   - Review cache key patterns

3. **Load Balancing**
   - Verify upstream server health
   - Check request distribution
   - Monitor connection pools

### Analyzing Test Results

1. **Response Time Analysis**
   - Review p95 and p99 percentiles
   - Compare against baseline metrics
   - Identify slow endpoints

2. **Error Rate Analysis**
   - Review error logs
   - Check error patterns
   - Verify error handling

3. **Throughput Analysis**
   - Monitor RPS (Requests Per Second)
   - Check for bottlenecks
   - Review resource utilization

## Maintenance

1. **Regular Updates**
   - Update test data periodically
   - Review and adjust thresholds
   - Update dependencies

2. **Monitoring**
   - Set up alerts for test failures
   - Monitor system resources
   - Track performance trends

3. **Backup**
   - Backup test reports regularly
   - Archive historical data
   - Document configuration changes

## Support

For issues and support:
1. Check the debugging guide above
2. Review test logs in the `reports` directory
3. Contact the development team
