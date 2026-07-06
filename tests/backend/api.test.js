/**
 * Backend API Endpoint Tests
 * Tests all REST API endpoints for the test monitor dashboard
 */

import assert from 'assert';

// Test data fixtures
const mockDashboardData = {
  timestamp: '2026-07-06T10:45:00.583Z',
  sections: {
    readyCluster: {
      total: 150,
      failed: 8,
      stale: 2,
      builds: [
        {
          number: 6999,
          status: 'FAIL',
          clusterName: 'cluster-c24',
          url: 'http://jenkins.example.com/job/6999'
        }
      ]
    },
    selenium: {
      total: 450,
      failed: 23,
      stale: 5,
      areas: [
        {
          name: 'Authentication',
          total: 50,
          failed: 3,
          stale: 0
        }
      ]
    }
  }
};

describe('Backend API Endpoints', () => {
  describe('GET /api/dashboard', () => {
    test('should return dashboard data with all sections', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert(data.timestamp);
      assert(data.sections);
      assert(data.sections.readyCluster);
      assert(data.sections.selenium);
      assert(data.sections.integration);
      assert(data.sections.smokeTests);
      assert(data.sections.newTests);
    });

    test('should have correct data structure for readyCluster', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();
      const readyCluster = data.sections.readyCluster;

      assert(Number.isInteger(readyCluster.total));
      assert(Number.isInteger(readyCluster.failed));
      assert(Number.isInteger(readyCluster.stale));
      assert(Array.isArray(readyCluster.builds) || Array.isArray(readyCluster.areas));
    });

    test('should have metrics totaling correctly', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();

      Object.values(data.sections).forEach(section => {
        if (section.total && section.failed && section.stale) {
          assert(section.failed <= section.total, 'Failed tests should not exceed total');
          assert(section.stale <= section.total, 'Stale tests should not exceed total');
        }
      });
    });

    test('should include recent changes', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();

      assert(data.recentChanges || data.sections.readyCluster.builds);
    });
  });

  describe('GET /api/test-details/:section/:area', () => {
    test('should return test details for a specific section and area', async () => {
      const response = await fetch('http://localhost:3000/api/test-details/selenium/Authentication');
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert(Array.isArray(data.tests));

      data.tests.forEach(test => {
        assert(test.filename);
        assert(test.status);
        assert(test.lastPassed !== undefined);
        assert(test.recentChanges !== undefined);
        assert(test.suggestedFix !== undefined);
      });
    });

    test('should handle non-existent section gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/test-details/nonexistent/area');
      assert(response.status === 404 || response.status === 200);
    });

    test('should include correct test metadata', async () => {
      const response = await fetch('http://localhost:3000/api/test-details/selenium/Authentication');
      const data = await response.json();

      if (data.tests.length > 0) {
        const test = data.tests[0];
        assert(['PASS', 'FAIL', 'SKIP'].includes(test.status));
      }
    });
  });

  describe('GET /api/diff/:testId', () => {
    test('should return diff for a specific test', async () => {
      const response = await fetch('http://localhost:3000/api/diff/test_selenium_auth_fail_1');
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert(data.diff);
      assert(data.diff.includes('diff --git'));
      assert(data.testName);
    });

    test('diff should contain valid unified diff format', async () => {
      const response = await fetch('http://localhost:3000/api/diff/test_unit_mock_fail_1');
      const data = await response.json();

      const diff = data.diff;
      assert(diff.includes('---') || diff.includes('+++'));
      assert(diff.includes('@@ '));
    });
  });

  describe('GET /api/recent-changes', () => {
    test('should return recent changes/commits', async () => {
      const response = await fetch('http://localhost:3000/api/recent-changes');
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert(Array.isArray(data.changes) || Array.isArray(data));

      if (data.changes && data.changes.length > 0) {
        const change = data.changes[0];
        assert(change.hash || change.commit);
        assert(change.author || change.message);
      }
    });

    test('should include commit details', async () => {
      const response = await fetch('http://localhost:3000/api/recent-changes');
      const data = await response.json();
      const changes = Array.isArray(data) ? data : data.changes;

      if (changes.length > 0) {
        const change = changes[0];
        assert(change.message || change.title);
        assert(change.date || change.timestamp);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required parameters', async () => {
      const response = await fetch('http://localhost:3000/api/test-details/');
      assert(response.status === 404 || response.status === 400);
    });

    test('should return valid JSON for all endpoints', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const contentType = response.headers.get('content-type');
      assert(contentType.includes('application/json'));
    });

    test('should handle server errors gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      if (response.status >= 500) {
        const data = await response.json();
        assert(data.error || data.message);
      }
    });
  });

  describe('Performance', () => {
    test('dashboard endpoint should respond within 5 seconds', async () => {
      const start = Date.now();
      await fetch('http://localhost:3000/api/dashboard');
      const duration = Date.now() - start;
      assert(duration < 5000, `Response took ${duration}ms, expected < 5000ms`);
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch('http://localhost:3000/api/dashboard')
      );
      const responses = await Promise.all(requests);

      responses.forEach(response => {
        assert.strictEqual(response.status, 200);
      });
    });
  });
});
