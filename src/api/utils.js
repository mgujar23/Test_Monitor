import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXES_FILE = path.join(__dirname, '../../fixes.json');

export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

export function getElapsedTimeString(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function loadFixesFile() {
  try {
    if (!fs.existsSync(FIXES_FILE)) {
      console.warn(`Fixes file not found: ${FIXES_FILE}`);
      return {};
    }
    const data = fs.readFileSync(FIXES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading fixes file:', error.message);
    return {};
  }
}

export function getFixForTest(testFileName) {
  const fixes = loadFixesFile();
  return fixes[testFileName] || null;
}

export function aggregateSectionData(sectionName, sectionsData) {
  // Combine data from all sources for a section
  // This merges test counts, areas, and applies fixes

  const fixes = loadFixesFile();

  // Attach fixes to test data
  if (sectionsData.areas) {
    for (const area of sectionsData.areas) {
      for (const test of area.tests || []) {
        const fixKey = test.className ? `${test.className}::${test.name}` : test.name;
        if (fixes[fixKey]) {
          test.suggestedFix = fixes[fixKey];
        }
      }
    }
  }

  return sectionsData;
}

export function formatDurationMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function calculateNextRefreshTime(lastRefreshTime, intervalMinutes) {
  const next = new Date(lastRefreshTime);
  next.setMinutes(next.getMinutes() + intervalMinutes);
  return next.toISOString();
}
