const fs = require('fs');
const path = require('path');

function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

function getElapsedTimeString(startTime) {
  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function loadFixesFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading fixes file from ${filePath}:`, error);
  }
  return {};
}

function getFixForTest(fixes, testName) {
  return fixes[testName] || null;
}

function aggregateSectionData(sections) {
  const aggregated = {
    total: 0,
    failed: 0,
    stale: 0,
    sections: [],
  };

  sections.forEach(section => {
    aggregated.total += section.total || 0;
    aggregated.failed += section.failed || 0;
    aggregated.stale += section.stale || 0;
    aggregated.sections.push({
      name: section.name || 'Unknown',
      total: section.total || 0,
      failed: section.failed || 0,
      stale: section.stale || 0,
    });
  });

  return aggregated;
}

function formatDurationMs(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

function calculateNextRefreshTime(lastRefresh, intervalMs) {
  return new Date(lastRefresh.getTime() + intervalMs);
}

module.exports = {
  formatTimestamp,
  getElapsedTimeString,
  loadFixesFile,
  getFixForTest,
  aggregateSectionData,
  formatDurationMs,
  calculateNextRefreshTime,
};
