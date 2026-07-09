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

    // Extract area data from test content rows grouped by data-dir
    // This gives us the actual count of tests available in each area
    const areasByName = {};
    let totalFailed = 0;

    // Normalize area key by removing "dir-" prefix if present
    const normalizeAreaKey = (key) => key.replace(/^dir-/, '');

    // Count all test content rows by area to get "Total available tests" per area
    const contentRowPattern = /<tr[^>]*data-dir="([^"]+)"[^>]*class="[^"]*test-dir-content[^"]*"[^>]*>/g;
    let contentMatch;

    while ((contentMatch = contentRowPattern.exec(html)) !== null) {
      const areaKey = normalizeAreaKey(contentMatch[1]);
      if (!areasByName[areaKey]) {
        areasByName[areaKey] = { total: 0, passed: 0, failed: 0 };
      }
      areasByName[areaKey].total++;
    }

    log(`[Selenium] Found ${Object.keys(areasByName).length} areas from content rows`);

    // Extract summary data from test-dir-summary rows
    // Format: <tr class="test-dir-summary" data-dir="dir-{AREA}">
    //   <span>Total</span> = <span class="test-passed">Passed</span> [+ <span class="test-failed">Failed</span>]
    const summaryRowPattern = /<tr[^>]*class="[^"]*test-dir-summary[^"]*"[^>]*data-dir="dir-([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
    let summaryMatch;
    let areasProcessed = 0;
    let summaryMatches = 0;

    log(`[Selenium] Looking for test-dir-summary rows`);
    log(`[Selenium] Known areas from content rows (${Object.keys(areasByName).length}): ${Object.keys(areasByName).join(', ')}`);

    // Test the pattern
    const testPattern = /<tr[^>]*test-dir-summary/g;
    const testMatches = html.match(testPattern);
    log(`[Selenium] Found ${testMatches ? testMatches.length : 0} rows with 'test-dir-summary' class`);

    while ((summaryMatch = summaryRowPattern.exec(html)) !== null) {
      summaryMatches++;
      const rawAreaKey = summaryMatch[1];
      const areaKey = normalizeAreaKey(rawAreaKey);
      const rowContent = summaryMatch[2];

      // Extract total from first span
      const totalMatch = rowContent.match(/<span[^>]*>(\d+)<\/span>/);
      const total = totalMatch ? parseInt(totalMatch[1]) : 0;

      // Extract passed from span with test-passed class
      const passedMatch = rowContent.match(/<span[^>]*class="[^"]*test-passed[^"]*"[^>]*>(\d+)<\/span>/);
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;

      // Extract failed from span with test-failed class
      const failedMatch = rowContent.match(/<span[^>]*class="[^"]*test-failed[^"]*"[^>]*>(\d+)<\/span>/);
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

      log(`[Selenium] Summary row #${summaryMatches}: raw="${rawAreaKey}" normalized="${areaKey}"`);
      log(`[Selenium]   → counts: total=${total}, passed=${passed}, failed=${failed}`);

      if (areasByName[areaKey]) {
        areasByName[areaKey].passed = passed;
        areasByName[areaKey].failed = failed;
        totalFailed += failed;
        areasProcessed++;
        log(`[Selenium]   ✓ MATCHED to known area`);
      } else {
        log(`[Selenium]   ✗ NOT FOUND in known areas`);
      }
    }

    log(`[Selenium] Summary extraction: ${summaryMatches} rows found, ${areasProcessed} areas matched`);

    // Build areas array with proper formatting
    const areas = [];
    let sumOfAreaTotals = 0;

    Object.entries(areasByName).forEach(([areaKey, counts]) => {
      const areaName = areaKey
        .replace(/^dir-/, '')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim();

      const total = counts.total;
      const passed = counts.passed || 0;
      const failed = counts.failed || 0;

      // Include area if it has content rows OR if it has summary data (passed/failed)
      if (total > 0 || passed > 0 || failed > 0) {
        sumOfAreaTotals += total;

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
          passed: passed,
          failed: failed,
          stale: 0,
          tests: tests
        });
      }
    });

    // Create separate area arrays for each metric
    // For "Unique tests run": show areas with passed/failed counts
    const uniqueTestsAreas = areas.map(area => ({
      name: area.name,
      total: area.passed + area.failed,
      failed: area.failed,
      stale: 0,
      tests: area.tests
    })).filter(a => a.total > 0);

    // For "Total available tests": show areas with total count (all tests available)
    const totalAvailableAreas = areas.map(area => ({
      name: area.name,
      total: area.total,
      failed: 0,
      stale: 0,
      tests: [{
        filename: `${area.total} total tests available in area`,
        status: 'PASS',
        lastPassed: 'N/A',
        recentChanges: 'Available tests',
        suggestedFix: 'N/A'
      }]
    })).filter(a => a.total > 0);

    // Calculate sums for each metric
    const sumUniqueTestsRunByArea = uniqueTestsAreas.reduce((sum, a) => sum + a.total, 0);
    const sumTotalAvailableByArea = totalAvailableAreas.reduce((sum, a) => sum + a.total, 0);

    // Add "Unassigned / Other" if needed
    const unassignedUnique = Math.max(0, totalTests - sumUniqueTestsRunByArea);
    if (unassignedUnique > 0) {
      uniqueTestsAreas.push({
        name: 'Unassigned / Other',
        total: unassignedUnique,
        failed: 0,
        stale: 0,
        tests: [{
          filename: `${unassignedUnique} tests not assigned to any area`,
          status: 'PASS',
          lastPassed: 'Latest Build',
          recentChanges: 'Unassigned tests',
          suggestedFix: 'N/A'
        }]
      });
    }

    const unassignedTotal = Math.max(0, totalAvailableTests - sumTotalAvailableByArea);
    if (unassignedTotal > 0) {
      totalAvailableAreas.push({
        name: 'Unassigned / Other',
        total: unassignedTotal,
        failed: 0,
        stale: 0,
        tests: [{
          filename: `${unassignedTotal} tests not assigned to any area`,
          status: 'PASS',
          lastPassed: 'Latest Build',
          recentChanges: 'Unassigned tests',
          suggestedFix: 'N/A'
        }]
      });
    }

    log(`[Selenium] Parsed ${totalTests} unique tests run, ${totalAvailableTests} total available (${uniqueTestsAreas.length} areas), ${totalFailed} failed`);

    return {
      total: totalTests, // Unique tests run
      totalAvailable: totalAvailableTests, // Total available tests from portal
      failed: totalFailed,
      stale: 0,
      areas: uniqueTestsAreas, // Areas for "Unique tests run"
      areasAvailable: totalAvailableAreas // Areas for "Total available tests"
    };
  } catch (error) {
    error('Error fetching Selenium Tests:', error.message);
    return { total: 0, failed: 0, stale: 0, areas: [] };
  }
}
