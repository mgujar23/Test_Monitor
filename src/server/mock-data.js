/**
 * Mock Data Generator for Test Monitor Dashboard
 *
 * Generates realistic sample dashboard data for demo/testing purposes.
 * Used when DEMO_MODE environment variable is set.
 */

/**
 * Generate mock dashboard data with realistic test counts
 * @returns {Object} Dashboard data structure with mock test suites
 */
export function generateMockDashboardData() {
  const timestamp = new Date().toISOString();
  const baseTime = new Date();
  baseTime.setHours(baseTime.getHours() - 2);

  return {
    timestamp,
    refreshDurationMs: 2847,
    sections: {
      readyCluster: generateMockTests('readyCluster', 45, 3, 2),
      selenium: generateMockTests('selenium', 28, 2, 1),
      integrationTests: generateMockTests('integrationTests', 156, 8, 5),
      smokeTests: generateMockTests('smokeTests', 22, 1, 0),
      newTestsAdded: generateMockTests('newTestsAdded', 12, 0, 0)
    },
    summary: {
      totalTests: 263,
      totalFailed: 14,
      totalStale: 8,
      lastRefresh: timestamp,
      successRate: 94.7
    },
    lastError: null
  };
}

/**
 * Generate mock test items for a section
 * @param {string} section - Section name
 * @param {number} total - Total tests to generate
 * @param {number} failedCount - Number of failed tests
 * @param {number} staleCount - Number of stale tests
 * @returns {Array} Array of mock test items
 */
function generateMockTests(section, total, failedCount, staleCount) {
  const tests = [];
  const statusOptions = ['PASSED', 'FAILED', 'FAILED', 'FAILED', 'STALE', 'STALE'];
  const areaOptions = ['Authentication', 'API', 'UI', 'Performance', 'Integration', 'Security'];

  for (let i = 0; i < total; i++) {
    let status = 'PASSED';
    const rand = Math.random();

    // Distribute failed and stale tests
    if (i < failedCount) {
      status = 'FAILED';
    } else if (i < failedCount + staleCount) {
      status = 'STALE';
    }

    tests.push({
      id: `${section}-test-${i + 1}`,
      name: `test_${generateTestName(i)}`,
      area: areaOptions[i % areaOptions.length],
      className: `${section}.${generateTestClass(i)}`,
      status,
      duration: Number((Math.random() * 3 + 0.1).toFixed(2)),
      lastRun: generateLastRunTime(i),
      failed: status === 'FAILED' ? 1 : 0,
      errorCount: status === 'FAILED' ? Math.floor(Math.random() * 5) + 1 : 0,
      errorMessage: status === 'FAILED' ? generateErrorMessage(i) : null,
      frequency: Math.floor(Math.random() * 10) + 1
    });
  }

  return tests;
}

/**
 * Generate a realistic test name
 * @param {number} index - Test index
 * @returns {string} Test name
 */
function generateTestName(index) {
  const actions = [
    'login',
    'logout',
    'create_user',
    'delete_user',
    'update_profile',
    'verify_email',
    'reset_password',
    'upload_file',
    'download_report',
    'schedule_task',
    'validate_form',
    'check_permissions',
    'verify_audit_log',
    'test_api_endpoint',
    'verify_database_state'
  ];

  const action = actions[index % actions.length];
  const variant = Math.floor(index / actions.length);
  return variant > 0 ? `${action}_${variant}` : action;
}

/**
 * Generate a realistic class name
 * @param {number} index - Test index
 * @returns {string} Class name
 */
function generateTestClass(index) {
  const classes = [
    'AuthenticationTest',
    'UserManagementTest',
    'APIEndpointTest',
    'DataValidationTest',
    'SecurityTest',
    'PerformanceTest',
    'IntegrationTest',
    'UIRegressionTest'
  ];
  return classes[index % classes.length];
}

/**
 * Generate a last run timestamp
 * @param {number} index - Test index
 * @returns {string} ISO timestamp
 */
function generateLastRunTime(index) {
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 72) + 1; // 1-72 hours ago
  const minutes = Math.floor(Math.random() * 60);
  const date = new Date(now.getTime() - hoursAgo * 3600000 - minutes * 60000);
  return date.toISOString();
}

/**
 * Generate a realistic error message
 * @param {number} index - Test index
 * @returns {string} Error message
 */
function generateErrorMessage(index) {
  const errors = [
    'AssertionError: Expected timeout to be less than 5000ms, but was 5250ms',
    'TimeoutError: Element not found within 30000ms',
    'ConnectionError: Failed to connect to database server',
    'ValidationError: Field "email" is required and missing',
    'PermissionError: User does not have required access level',
    'DataMismatchError: Expected value "active" but got "pending"',
    'NetworkError: Request failed with status 503',
    'ReferenceError: Variable "userData" is not defined',
    'SyntaxError: Invalid JSON response from server',
    'FileNotFoundError: Test data file not found at path'
  ];
  return errors[index % errors.length];
}

/**
 * Generate sample dashboard data with custom options
 * @param {Object} options - Configuration options
 * @returns {Object} Customized dashboard data
 */
export function generateMockDashboardDataWithOptions(options = {}) {
  const {
    totalTests = 263,
    failureRate = 0.05,
    staleRate = 0.03,
    refreshDurationMs = 2847
  } = options;

  const failedCount = Math.floor(totalTests * failureRate);
  const staleCount = Math.floor(totalTests * staleRate);

  return {
    timestamp: new Date().toISOString(),
    refreshDurationMs,
    sections: {
      readyCluster: generateMockTests('readyCluster', 45, 2, 1),
      selenium: generateMockTests('selenium', 28, 1, 0),
      integrationTests: generateMockTests('integrationTests', 156, failedCount - 3, staleCount - 1),
      smokeTests: generateMockTests('smokeTests', 22, 0, 0),
      newTestsAdded: generateMockTests('newTestsAdded', 12, 0, 0)
    },
    summary: {
      totalTests,
      totalFailed: failedCount,
      totalStale: staleCount,
      lastRefresh: new Date().toISOString(),
      successRate: Number(((1 - failureRate) * 100).toFixed(1))
    },
    lastError: null
  };
}
