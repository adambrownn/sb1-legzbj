
Advanced Availability Validation Instructions
==========================================

1. Prerequisites:
   - Ensure Redis is running locally or set environment variables:
     export REDIS_HOST=your-redis-host
     export REDIS_PORT=your-redis-port

2. Run the validation script:
   npm run test:availability

3. Monitor the output for:
   - Daily availability tests
   - Hourly availability tests
   - Timezone handling tests
   - Overlapping booking tests
   - Cache efficiency metrics

4. Check the test summary for:
   - Number of successful tests
   - Number of failed tests
   - Cache hit rate
   - Detailed error messages if any

5. Interpreting results:
   - All tests should pass
   - Cache hit rate should be above 50%
   - Timezone conversions should be consistent
   - No double bookings should be allowed

Note: This script uses mock data for testing. For production validation,
replace mock data with real database operations.
