import { log, warn, error } from '../server/logger.js';
import axios from 'axios';

export async function fetchSeleniumTests(portalUrl) {
  try {
    // Fetch Selenium portal results page using the complete URL with ?all=yes
    const response = await axios.get(portalUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TestMonitor/1.0'
      }
    });

    log('[Selenium] Fetched portal data from:', portalUrl);
    const html = response.data;

    // Extract from specific elements:
    // 1. "Total available tests" value - look for the row with "Total available tests"
    const totalAvailableMatch = html.match(/Total available tests[\s\S]*?<td[^>]*>[\s]*(\d+)/);
    const totalAvailableTests = totalAvailableMatch ? parseInt(totalAvailableMatch[1]) : 0;

    // 2. "Unique tests run" value - look for text then the next td with a number
    const totalMatch = html.match(/Unique tests run[\s\S]*?<td[^>]*>[\s]*(\d+)/);
    const totalTests = totalMatch ? parseInt(totalMatch[1]) : 0;

    // 2. "Passed" checkbox - look for >Passed< label then find the count in width="40" td
    const passedMatch = html.match(/>Passed<[\s\S]*?width="40"[^>]*>[\s]*(\d+)/);
    const passedCount = passedMatch ? parseInt(passedMatch[1]) : 0;

    // 3. "Failed" checkbox - look for >Failed< label then find the count
    const failedMatch = html.match(/>Failed<[\s\S]*?<td[^>]*align="right"[^>]*>[\s]*\d+%[\s]*<\/td>[\s]*<td[^>]*align="right"[^>]*>[\s]*(\d+)/);
    const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;

    log(`[Selenium] Extracted: Total=${totalTests}, Passed=${passedCount}, Failed=${failedCount}`);

    // Extract area data from test-dir-summary rows
    // Pattern: data-dir="dir-AREANAME" ... Total: X ... Passed: Y
    const areas = [];
    let totalFailed = 0;

    const areaPattern = /data-dir="dir-([^"]+)"[^>]*>[\s\S]*?<span[^>]*title="Total[^>]*>(\d+)<\/span>[\s\S]*?<span class="test-passed"[^>]*>(\d+)<\/span>/g;
    let match;

    while ((match = areaPattern.exec(html)) !== null) {
      const areaName = match[1]
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();

      const total = parseInt(match[2]);
      const passed = parseInt(match[3]);
      const failed = total - passed;
      totalFailed += failed;

      // Create test objects matching actual pass/fail counts
      const tests = [];

      // Add individual PASSED test entries (max 10)
      for (let i = 1; i <= Math.min(passed, 10); i++) {
        tests.push({
          filename: `test_${areaName.toLowerCase().replace(/ /g, '_')}_pass_${i}.py`,
          status: 'PASS',
          lastPassed: 'Latest Build',
          recentChanges: 'Test passing',
          suggestedFix: 'N/A'
        });
      }

      // Add individual FAILED test entries (max 10)
      for (let i = 1; i <= Math.min(failed, 10); i++) {
        tests.push({
          filename: `test_${areaName.toLowerCase().replace(/ /g, '_')}_fail_${i}.py`,
          status: 'FAIL',
          lastPassed: 'Build #N/A',
          recentChanges: 'Test failure detected',
          suggestedFix: 'Review failure logs'
        });
      }

      // Add summary entries if counts exceed 10
      if (passed > 10) {
        tests.push({
          filename: `... and ${passed - 10} more passing tests`,
          status: 'PASS',
          lastPassed: 'Latest Build',
          recentChanges: 'Additional passing tests',
          suggestedFix: 'N/A'
        });
      }

      if (failed > 10) {
        tests.push({
          filename: `... and ${failed - 10} more failing tests`,
          status: 'FAIL',
          lastPassed: 'Build #N/A',
          recentChanges: 'Additional test failures',
          suggestedFix: 'Review failure logs'
        });
      }

      // If no test data, show area summary
      if (tests.length === 0) {
        tests.push({
          filename: `${total} total tests in area`,
          status: 'PASS',
          lastPassed: 'Latest Build',
          recentChanges: 'All tests passing',
          suggestedFix: 'N/A'
        });
      }

      areas.push({
        name: areaName,
        total: total,
        failed: failed,
        stale: 0,
        tests: tests
      });
    }

    log(`[Selenium] Parsed ${totalTests} unique tests run, ${totalAvailableTests} total available, ${totalFailed} failed across ${areas.length} areas`);

    return {
      total: totalTests, // Unique tests run
      totalAvailable: totalAvailableTests, // Total available tests from portal
      failed: totalFailed,
      stale: 0,
      areas: areas
    };
  } catch (error) {
    error('Error fetching Selenium Tests:', error.message);
    return { total: 0, failed: 0, stale: 0, areas: [] };
  }
}
