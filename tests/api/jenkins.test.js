import { JenkinsClient } from '../../src/api/jenkins.js';

// Test data parsing
const mockTestData = {
  suites: [
    {
      name: 'API Tests',
      cases: [
        { name: 'test_login', status: 'PASSED', duration: 1.23 },
        { name: 'test_logout', status: 'FAILED', duration: 2.45 },
        { name: 'test_signup', status: 'SKIPPED', duration: 0 }
      ]
    }
  ]
};

const client = new JenkinsClient('http://jenkins.example.com', 'fake-token');
const result = client.parseTestData(mockTestData);

console.log('Parse test result:', JSON.stringify(result, null, 2));
console.assert(result.total === 3, 'Should have 3 total tests');
console.assert(result.failed === 1, 'Should have 1 failed test');
console.assert(result.stale === 1, 'Should have 1 stale test');
console.log('✓ Jenkins client tests passed');
