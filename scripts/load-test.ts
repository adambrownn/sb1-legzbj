import autocannon from 'autocannon';
import { format, addDays } from 'date-fns';
import fs from 'fs';
import path from 'path';

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  scenarios: {
    name: string;
    weight: number;
    request: {
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: any;
    };
  }[];
}

interface TestResult {
  scenario: string;
  timestamp: string;
  latency: {
    min: number;
    max: number;
    average: number;
    p99: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
  };
  throughput: number;
  errors: any[];
}

async function runLoadTest(config: LoadTestConfig): Promise<void> {
  const results: TestResult[] = [];
  const startTime = new Date();

  console.log(`Starting load test at ${startTime.toISOString()}`);
  console.log(`Target URL: ${config.url}`);
  console.log(`Duration: ${config.duration} seconds`);
  console.log(`Concurrent connections: ${config.connections}`);

  for (const scenario of config.scenarios) {
    console.log(`\nRunning scenario: ${scenario.name}`);

    const instance = autocannon({
      url: config.url,
      connections: config.connections,
      duration: config.duration,
      headers: {
        'content-type': 'application/json',
        ...scenario.request.headers,
      },
      requests: [
        {
          method: scenario.request.method,
          path: scenario.request.path,
          body: JSON.stringify(scenario.request.body),
          weight: scenario.weight,
        },
      ],
    });

    const result = await new Promise<autocannon.Result>((resolve) => {
      instance.on('done', resolve);
    });

    results.push({
      scenario: scenario.name,
      timestamp: new Date().toISOString(),
      latency: {
        min: result.latency.min,
        max: result.latency.max,
        average: result.latency.average,
        p99: result.latency.p99,
      },
      requests: {
        total: result.requests.total,
        successful: result.requests.successful,
        failed: result.requests.failed,
      },
      throughput: result.throughput.average,
      errors: result.errors,
    });
  }

  // Save results
  const resultsDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filename = path.join(
    resultsDir,
    `load-test-${format(startTime, 'yyyy-MM-dd-HH-mm-ss')}.json`
  );

  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${filename}`);

  // Print summary
  console.log('\nTest Summary:');
  results.forEach((result) => {
    console.log(`\nScenario: ${result.scenario}`);
    console.log(`Average Latency: ${result.latency.average}ms`);
    console.log(`99th Percentile Latency: ${result.latency.p99}ms`);
    console.log(`Requests/sec: ${(result.throughput / 1024).toFixed(2)}k`);
    console.log(`Success Rate: ${((result.requests.successful / result.requests.total) * 100).toFixed(2)}%`);
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  });
}

// Example test scenarios
const config: LoadTestConfig = {
  url: process.env.API_URL || 'http://localhost:3000',
  connections: 100,
  duration: 30,
  scenarios: [
    {
      name: 'Check Availability',
      weight: 5,
      request: {
        method: 'POST',
        path: '/api/availability',
        body: {
          propertyId: 'property-123',
          date: format(new Date(), 'yyyy-MM-dd'),
          timezone: 'UTC',
        },
      },
    },
    {
      name: 'Create Booking',
      weight: 2,
      request: {
        method: 'POST',
        path: '/api/bookings',
        body: {
          propertyId: 'property-123',
          checkIn: format(new Date(), 'yyyy-MM-dd'),
          checkOut: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
          guestCount: 2,
        },
      },
    },
    {
      name: 'Modify Booking',
      weight: 1,
      request: {
        method: 'PUT',
        path: '/api/bookings/booking-123',
        body: {
          checkOut: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
        },
      },
    },
  ],
};

// Run the load test
runLoadTest(config).catch(console.error);
