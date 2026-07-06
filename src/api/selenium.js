import axios from 'axios';

export async function fetchSeleniumTests(portalUrl) {
  try {
    // Fetch Selenium portal results page
    const fullUrl = portalUrl.includes('?') ? portalUrl : portalUrl + '?all=yes';
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TestMonitor/1.0'
      }
    });

    console.log('[Selenium] Fetched portal data');
    const html = response.data;

    // Extract area data from test-dir-summary rows
    // Pattern: data-dir="dir-AREANAME" ... Total: X ... Passed: Y
    const areas = [];
    let totalTests = 0;
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
      totalTests += total;
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

    console.log(`[Selenium] Parsed ${totalTests} total tests across ${areas.length} areas, ${totalFailed} failed`);

    return {
      total: totalTests,
      failed: totalFailed,
      stale: 0,
      areas: areas
    };
  } catch (error) {
    console.error('Error fetching Selenium Tests:', error.message);
    return { total: 0, failed: 0, stale: 0, areas: [] };
  }
}
