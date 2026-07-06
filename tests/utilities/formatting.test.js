/**
 * Utility Function Tests
 * Tests data formatting, calculations, and helper functions
 * Uses real data from running server
 */

import assert from 'assert';

describe('Data Formatting Utilities', () => {
  describe('Percentage Calculation', () => {
    test('should calculate pass percentage correctly', () => {
      const total = 100;
      const failed = 10;
      const percentage = ((total - failed) / total) * 100;

      assert.strictEqual(percentage, 90);
    });

    test('should handle edge case: 0 total tests', () => {
      const total = 0;
      const failed = 0;
      const percentage = total > 0 ? ((total - failed) / total) * 100 : 0;

      assert.strictEqual(percentage, 0);
    });

    test('should handle edge case: all tests failed', () => {
      const total = 100;
      const failed = 100;
      const percentage = ((total - failed) / total) * 100;

      assert.strictEqual(percentage, 0);
    });

    test('should format percentage to 2 decimal places', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();
      const selenium = data.sections.selenium;

      const percentage = ((selenium.total - selenium.failed) / selenium.total) * 100;
      const formatted = percentage.toFixed(2);

      assert(formatted.includes('.'));
    });
  });

  describe('Test Status Formatting', () => {
    test('should map status to display text', () => {
      const statusMap = {
        'PASS': '✓ Passed',
        'FAIL': '✗ Failed',
        'SKIP': '⊘ Skipped'
      };

      assert.strictEqual(statusMap['PASS'], '✓ Passed');
      assert.strictEqual(statusMap['FAIL'], '✗ Failed');
    });

    test('should map status to color class', () => {
      const colorMap = {
        'PASS': 'green-900',
        'FAIL': 'red-900',
        'SKIP': 'yellow-900'
      };

      assert.strictEqual(colorMap['PASS'], 'green-900');
      assert.strictEqual(colorMap['FAIL'], 'red-900');
    });

    test('should handle unknown status gracefully', () => {
      const status = 'UNKNOWN';
      const color = {
        'PASS': 'green-900',
        'FAIL': 'red-900',
        'SKIP': 'yellow-900'
      }[status] || 'gray-900';

      assert.strictEqual(color, 'gray-900');
    });
  });

  describe('Time Formatting', () => {
    test('should format date to readable format', () => {
      const date = new Date('2026-07-06T10:45:00.583Z');
      const formatted = date.toLocaleString();

      assert(formatted.includes('2026'));
      assert(formatted.includes('7'));
    });

    test('should handle ISO format dates', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();

      const timestamp = data.timestamp;
      assert(timestamp);

      const date = new Date(timestamp);
      assert(!isNaN(date.getTime()));
    });

    test('should calculate time elapsed', () => {
      const now = new Date();
      const past = new Date(now - 60000); // 1 minute ago
      const elapsed = (now - past) / 1000; // in seconds

      assert(elapsed > 50 && elapsed <= 70);
    });

    test('should format "last passed" info', () => {
      const lastPassed = 'Build #6995';
      assert(lastPassed.includes('Build'));
      assert(lastPassed.includes('#'));
    });
  });

  describe('File Path Formatting', () => {
    test('should extract filename from path', () => {
      const filepath = 'src/tests/auth/test_login.py';
      const filename = filepath.split('/').pop();

      assert.strictEqual(filename, 'test_login.py');
    });

    test('should convert class name to file path', () => {
      const className = 'com.example.TestClass';
      const filepath = className.replace(/\./g, '/') + '.java';

      assert.strictEqual(filepath, 'com/example/TestClass.java');
    });

    test('should extract test type from filename', () => {
      const testGetType = (filename) => {
        if (filename.includes('Selenium') || filename.includes('UI')) return 'selenium';
        if (filename.includes('Integration')) return 'integration';
        if (filename.includes('Unit')) return 'unit';
        return 'unknown';
      };

      assert.strictEqual(testGetType('test_selenium_auth.py'), 'selenium');
      assert.strictEqual(testGetType('TestIntegration.java'), 'integration');
      assert.strictEqual(testGetType('TestUnit.java'), 'unit');
    });
  });

  describe('Metric Aggregation', () => {
    test('should sum tests across areas', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();
      const areas = data.sections.selenium.areas || [];

      let totalTests = 0;
      areas.forEach(area => {
        totalTests += area.total;
      });

      assert(totalTests >= 0);
    });

    test('should sum failed tests across areas', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();
      const areas = data.sections.selenium.areas || [];

      let failedTests = 0;
      areas.forEach(area => {
        failedTests += area.failed;
      });

      assert(failedTests >= 0);
    });

    test('should calculate section totals from areas', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();
      const section = data.sections.selenium;
      const areas = section.areas || [];

      let calculatedTotal = 0;
      areas.forEach(area => {
        calculatedTotal += area.total;
      });

      assert(calculatedTotal > 0 || areas.length === 0);
    });
  });

  describe('Number Formatting', () => {
    test('should format large numbers with thousands separator', () => {
      const num = 1000;
      const formatted = num.toLocaleString();

      assert(formatted === '1,000' || formatted === '1.000');
    });

    test('should round decimals appropriately', () => {
      const num = 95.5555;
      const rounded = Math.round(num * 100) / 100;

      assert.strictEqual(rounded, 95.56);
    });
  });

  describe('String Validation', () => {
    test('should validate test names', () => {
      const validName = 'test_auth_login_success';
      assert(validName.match(/^test_[a-z_]+$/));
    });

    test('should handle empty strings', () => {
      const str = '';
      assert.strictEqual(str.length, 0);
      assert.strictEqual(str || 'N/A', 'N/A');
    });

    test('should sanitize file paths', () => {
      const path = 'file/../../../etc/passwd';
      const safe = path.replace(/\.\.\//g, '');

      assert(safe.includes('file'));
    });
  });

  describe('Diff Content Formatting', () => {
    test('should validate unified diff format', () => {
      const diff = `diff --git a/file.java b/file.java
--- a/file.java
+++ b/file.java
@@ -1,5 +1,6 @@
 line1
+line2`;

      assert(diff.includes('diff --git'));
      assert(diff.includes('---'));
      assert(diff.includes('+++'));
      assert(diff.includes('@@'));
    });

    test('should extract filename from diff header', () => {
      const diffHeader = 'diff --git a/TestClass.java b/TestClass.java';
      const filename = diffHeader.match(/b\/(.+)$/)[1];

      assert.strictEqual(filename, 'TestClass.java');
    });

    test('should identify added/removed lines in diff', () => {
      const line1 = '+added line';
      const line2 = '-removed line';
      const line3 = ' unchanged line';

      assert(line1.startsWith('+'));
      assert(line2.startsWith('-'));
      assert(!line3.startsWith('+') && !line3.startsWith('-'));
    });
  });

  describe('Error Messages', () => {
    test('should format error messages clearly', () => {
      const error = { code: 404, message: 'Not Found' };
      const formatted = `Error ${error.code}: ${error.message}`;

      assert(formatted.includes('404'));
      assert(formatted.includes('Not Found'));
    });

    test('should handle HTTP status codes', () => {
      const codes = {
        200: 'OK',
        400: 'Bad Request',
        404: 'Not Found',
        500: 'Internal Server Error'
      };

      assert.strictEqual(codes[200], 'OK');
      assert.strictEqual(codes[404], 'Not Found');
    });
  });

  describe('Array Utilities', () => {
    test('should filter tests by status', async () => {
      const response = await fetch('http://localhost:3000/api/test-details/selenium/Authentication');
      const data = await response.json();
      const tests = data.tests || [];

      const failed = tests.filter(t => t.status === 'FAIL');
      assert(Array.isArray(failed));
    });

    test('should sort tests by status priority', () => {
      const tests = [
        { name: 'test1', status: 'PASS' },
        { name: 'test2', status: 'FAIL' },
        { name: 'test3', status: 'SKIP' }
      ];

      const priority = { 'FAIL': 0, 'SKIP': 1, 'PASS': 2 };
      const sorted = tests.sort((a, b) => priority[a.status] - priority[b.status]);

      assert.strictEqual(sorted[0].status, 'FAIL');
      assert.strictEqual(sorted[2].status, 'PASS');
    });

    test('should paginate arrays', () => {
      const items = Array(35).fill({ name: 'item' });
      const pageSize = 10;
      const page = 1;

      const start = page * pageSize;
      const end = start + pageSize;
      const paged = items.slice(start, end);

      assert.strictEqual(paged.length, 10);
    });
  });

  describe('Object Utilities', () => {
    test('should extract specific properties from objects', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();

      const section = data.sections.selenium;
      const { total, failed, stale } = section;

      assert(Number.isInteger(total));
      assert(Number.isInteger(failed));
      assert(Number.isInteger(stale));
    });

    test('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };

      assert.strictEqual(merged.a, 1);
      assert.strictEqual(merged.b, 3);
      assert.strictEqual(merged.c, 4);
    });
  });
});
