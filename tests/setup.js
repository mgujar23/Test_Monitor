/**
 * Test Setup
 * Global test configuration and utilities
 */

// Global test utilities
global.testConfig = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5181',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  performanceThreshold: {
    apiResponse: 2000,      // 2 seconds
    dashboardLoad: 3000,    // 3 seconds
    modalOpen: 100,         // 100ms
    pageChange: 100         // 100ms
  }
};

// Test utilities
global.testUtils = {
  // Fetch with error handling
  async fetchJson(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
      throw error;
    }
  },

  // Retry logic for flaky endpoints
  async fetchWithRetry(url, maxRetries = 3, delay = 100) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.fetchJson(url);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  },

  // Performance measurement
  async measurePerformance(fn, name) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[PERF] ${name}: ${duration}ms`);
    return { result, duration };
  },

  // Wait for condition
  async waitFor(condition, timeout = 5000, interval = 100) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for condition');
  }
};

// Setup global timeout
beforeAll(() => {
  jest.setTimeout(global.testConfig.timeout);
});

// Log test environment
beforeEach(() => {
  console.log('\n--- Starting test ---');
});

// Cleanup after each test
afterEach(() => {
  console.log('--- Test completed ---\n');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Test environment configured:');
console.log(`- Backend: ${global.testConfig.backendUrl}`);
console.log(`- Frontend: ${global.testConfig.frontendUrl}`);
console.log(`- API Base: ${global.testConfig.apiBaseUrl}`);
