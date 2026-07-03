/**
 * Task 13: Test Details Helper
 * Parses testId and looks up test information from cache
 */

/**
 * Parse testId to extract section and test name
 * Format: section:testName (e.g., "selenium:LoginTest")
 */
function parseTestId(testId) {
  const parts = testId.split(':');
  if (parts.length !== 2) {
    return null;
  }
  return {
    section: parts[0],
    testName: parts[1]
  };
}

/**
 * Search for test in cache data
 */
function findTestInCache(section, testName, cachedData) {
  const sectionData = cachedData.sections?.[section];
  if (!Array.isArray(sectionData)) {
    return null;
  }

  // Search through section data for matching test
  for (const item of sectionData) {
    if (item.name === testName || item.className === testName) {
      return item;
    }
  }

  return null;
}

/**
 * Get suggested fix for a test from fixes data
 */
function getSuggestedFix(testName, fixes) {
  if (!fixes || typeof fixes !== 'object') {
    return null;
  }
  return fixes[testName] || null;
}

/**
 * Extract recent changes for a test
 * (this would typically come from git history)
 */
function getRecentChanges(testName, cachedData) {
  const recentChanges = [];

  // Check git data for related commits
  if (cachedData.git?.yearly) {
    cachedData.git.yearly.forEach(item => {
      if (item.file && item.file.includes(testName.replace(/([A-Z])/g, '_$1').toLowerCase())) {
        recentChanges.push({
          date: item.date || new Date().toISOString(),
          message: item.message || 'Test file modified',
          author: item.author || 'Unknown'
        });
      }
    });
  }

  return recentChanges.slice(0, 5); // Return last 5 changes
}

/**
 * Get test details by testId
 * Returns {section, area, name, status, className, suggestedFix, recentChanges, lastUpdated}
 */
export function getTestDetails(testId, cachedData) {
  // Parse the testId
  const parsed = parseTestId(testId);
  if (!parsed) {
    return null;
  }

  const { section, testName } = parsed;

  // Find test in cache
  const test = findTestInCache(section, testName, cachedData);
  if (!test) {
    return null;
  }

  // Build detailed response
  const suggestedFix = getSuggestedFix(test.name || testName, cachedData.fixes);
  const recentChanges = getRecentChanges(test.name || testName, cachedData);

  return {
    section,
    area: test.area || 'Unknown',
    name: test.name || testName,
    status: test.status || 'UNKNOWN',
    className: test.className || '',
    duration: test.duration || 0,
    lastRun: test.lastRun || cachedData.timestamp,
    suggestedFix,
    recentChanges,
    lastUpdated: cachedData.timestamp || new Date().toISOString(),
    // Additional metadata
    failed: test.failed || 0,
    stale: test.stale || 0,
    skipped: test.skipped || false
  };
}
