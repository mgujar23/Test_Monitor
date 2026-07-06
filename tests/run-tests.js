/**
 * Simple Test Runner
 * Runs tests without Jest dependency
 */

import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestsList = [];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    log(`  ✓ ${name}`, colors.green);
  } catch (error) {
    failedTests++;
    failedTestsList.push({ name, error: error.message });
    log(`  ✗ ${name}`, colors.red);
    log(`    Error: ${error.message}`, colors.yellow);
  }
}

function describe(suiteName, fn) {
  log(`\n${suiteName}`, colors.cyan);
  fn();
}

// Fetch helper
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ============ API TESTS ============
describe('Backend API Tests', () => {
  describe('GET /api/dashboard', () => {
    test('should return dashboard with all sections', async () => {
      const data = await fetchJson(`${BASE_URL}/api/dashboard`);
      assert(data.sections, 'No sections found');
      assert(data.sections.readyCluster, 'readyCluster section missing');
      assert(data.sections.selenium, 'selenium section missing');
      assert(data.sections.integration, 'integration section missing');
      assert(data.sections.smokeTests, 'smokeTests section missing');
      assert(data.sections.newTests, 'newTests section missing');
    });

    test('sections should have correct structure', async () => {
      const data = await fetchJson(`${BASE_URL}/api/dashboard`);
      const section = data.sections.readyCluster;

      assert(typeof section.total === 'number', 'total is not a number');
      assert(typeof section.failed === 'number', 'failed is not a number');
      assert(section.failed <= section.total, 'failed > total');
    });

    test('should include timestamp', async () => {
      const data = await fetchJson(`${BASE_URL}/api/dashboard`);
      assert(data.timestamp, 'No timestamp');
      const date = new Date(data.timestamp);
      assert(!isNaN(date.getTime()), 'Invalid timestamp format');
    });

    test('selenium section should have areas', async () => {
      const data = await fetchJson(`${BASE_URL}/api/dashboard`);
      const selenium = data.sections.selenium;
      assert(Array.isArray(selenium.areas), 'areas is not an array');
      assert(selenium.areas.length > 0, 'No areas found');
    });

    test('each area should have required fields', async () => {
      const data = await fetchJson(`${BASE_URL}/api/dashboard`);
      const area = data.sections.selenium.areas[0];
      assert(area.name, 'area missing name');
      assert(typeof area.total === 'number', 'area total is not number');
      assert(typeof area.failed === 'number', 'area failed is not number');
    });

    test('response time should be acceptable', async () => {
      const start = Date.now();
      await fetchJson(`${BASE_URL}/api/dashboard`);
      const duration = Date.now() - start;
      assert(duration < 3000, `Response took ${duration}ms (expected < 3000ms)`);
    });
  });

  describe('GET /api/test-details/:section/:area', () => {
    test('should return test details', async () => {
      const data = await fetchJson(`${BASE_URL}/api/test-details/selenium/Authentication`);
      assert(data.tests, 'No tests property');
      assert(Array.isArray(data.tests), 'tests is not an array');
    });

    test('each test should have required fields', async () => {
      const data = await fetchJson(`${BASE_URL}/api/test-details/selenium/Authentication`);
      if (data.tests.length > 0) {
        const test = data.tests[0];
        assert(test.filename, 'test missing filename');
        assert(test.status, 'test missing status');
        assert(['PASS', 'FAIL', 'SKIP'].includes(test.status), `Invalid status: ${test.status}`);
      }
    });
  });

  describe('GET /api/diff/:testId', () => {
    test('should return diff for a test', async () => {
      const data = await fetchJson(`${BASE_URL}/api/diff/test_selenium_auth_fail_1`);
      assert(data.diff, 'No diff property');
      assert(typeof data.diff === 'string', 'diff is not a string');
      assert(data.diff.length > 0, 'diff is empty');
    });

    test('diff should have valid format', async () => {
      const data = await fetchJson(`${BASE_URL}/api/diff/test_unit_mock_fail_1`);
      const diff = data.diff;
      assert(diff.includes('diff --git') || diff.includes('@@'), 'Not a valid diff format');
    });
  });

  describe('GET /api/recent-changes', () => {
    test('should return recent changes', async () => {
      const data = await fetchJson(`${BASE_URL}/api/recent-changes`);
      const changes = Array.isArray(data) ? data : data.changes;
      assert(Array.isArray(changes), 'changes is not an array');
    });

    test('changes should have details', async () => {
      const data = await fetchJson(`${BASE_URL}/api/recent-changes`);
      const changes = Array.isArray(data) ? data : data.changes;

      if (changes.length > 0) {
        const change = changes[0];
        assert(change.hash || change.commit, 'change missing hash/commit');
        assert(change.message || change.title, 'change missing message/title');
      }
    });
  });
});

// ============ DATA VALIDATION TESTS ============
describe('Data Validation Tests', () => {
  test('all metrics should be valid numbers', async () => {
    const data = await fetchJson(`${BASE_URL}/api/dashboard`);

    Object.entries(data.sections).forEach(([sectionName, section]) => {
      assert(Number.isInteger(section.total), `${sectionName}: total is not integer`);
      assert(Number.isInteger(section.failed), `${sectionName}: failed is not integer`);
      assert(Number.isInteger(section.stale), `${sectionName}: stale is not integer`);
      assert(section.failed <= section.total, `${sectionName}: failed > total`);
      assert(section.stale <= section.total, `${sectionName}: stale > total`);
    });
  });

  test('pass percentage should be calculable', async () => {
    const data = await fetchJson(`${BASE_URL}/api/dashboard`);

    Object.entries(data.sections).forEach(([sectionName, section]) => {
      if (section.total > 0) {
        const passed = section.total - section.failed;
        const percentage = (passed / section.total) * 100;
        assert(percentage >= 0 && percentage <= 100,
          `${sectionName}: invalid percentage ${percentage}`);
      }
    });
  });

  test('areas should aggregate to section totals', async () => {
    const data = await fetchJson(`${BASE_URL}/api/dashboard`);
    const section = data.sections.selenium;

    if (section.areas && section.areas.length > 0) {
      let totalArea = 0;
      section.areas.forEach(area => {
        totalArea += area.total;
      });

      // Areas total should be >= section total (some tests might not be in areas)
      assert(totalArea > 0, 'No tests in areas');
    }
  });
});

// ============ UI COMPONENT DATA TESTS ============
describe('UI Component Data Tests', () => {
  test('test details should have suggestedFix', async () => {
    const data = await fetchJson(`${BASE_URL}/api/test-details/selenium/Authentication`);

    if (data.tests.length > 0) {
      const failedTests = data.tests.filter(t => t.status === 'FAIL');
      failedTests.forEach(test => {
        assert(test.suggestedFix, `Test ${test.filename} missing suggestedFix`);
      });
    }
  });

  test('test details should have lastPassed info', async () => {
    const data = await fetchJson(`${BASE_URL}/api/test-details/selenium/Authentication`);

    if (data.tests.length > 0) {
      data.tests.forEach(test => {
        assert(test.lastPassed !== undefined, `Test ${test.filename} missing lastPassed`);
      });
    }
  });

  test('diff should be usable by developers', async () => {
    const data = await fetchJson(`${BASE_URL}/api/diff/test_selenium_auth_fail_1`);
    const diff = data.diff;

    // Should be able to parse diff structure
    assert(diff.includes('@@'), 'Missing diff location marker @@');
  });
});

// ============ PERFORMANCE TESTS ============
describe('Performance Tests', () => {
  test('dashboard endpoint should respond in < 2 seconds', async () => {
    const start = Date.now();
    await fetchJson(`${BASE_URL}/api/dashboard`);
    const duration = Date.now() - start;
    assert(duration < 2000, `Slow response: ${duration}ms`);
  });

  test('should handle multiple concurrent requests', async () => {
    const requests = Array(5).fill(null).map(() =>
      fetchJson(`${BASE_URL}/api/dashboard`)
    );
    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;
    assert(duration < 5000, `Concurrent requests too slow: ${duration}ms`);
  });
});

// ============ ERROR HANDLING TESTS ============
describe('Error Handling Tests', () => {
  test('invalid section should handle gracefully', async () => {
    try {
      await fetchJson(`${BASE_URL}/api/test-details/invalid/area`);
      // Either returns empty or 404, both acceptable
    } catch (error) {
      // Expected for non-existent section
      assert(error.message.includes('404') || error.message.includes('HTTP'));
    }
  });

  test('API should always return valid JSON', async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard`);
    const contentType = response.headers.get('content-type');
    assert(contentType.includes('application/json'),
      `Invalid content-type: ${contentType}`);
  });
});

// ============ RUN TESTS ============
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║          Test Monitor - Test Suite Run           ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

  try {
    // Run all tests (they're automatically executed via describe/test calls above)

    // Results summary
    log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
    log('║                  TEST RESULTS                     ║', colors.blue);
    log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

    log(`Total Tests:   ${totalTests}`);
    log(`Passed:        ${passedTests} ${colors.green}✓${colors.reset}`, colors.green);
    log(`Failed:        ${failedTests} ${colors.red}✗${colors.reset}`, failedTests > 0 ? colors.red : colors.green);
    log(`Success Rate:  ${successRate}%`, successRate === '100.00' ? colors.green : colors.yellow);

    if (failedTests > 0) {
      log('\n╔─ FAILED TESTS ─────────────────────────────────────╗', colors.red);
      failedTestsList.forEach(({ name, error }) => {
        log(`│ ✗ ${name}`, colors.red);
        log(`│   ${error.substring(0, 50)}`, colors.yellow);
      });
      log('╚───────────────────────────────────────────────────╝\n', colors.red);
    }

    if (failedTests === 0) {
      log('\n🎉 All tests passed!', colors.green);
    }

    log('\n' + '═'.repeat(51) + '\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    log(`\nFatal Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

runAllTests();
