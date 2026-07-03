import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../../cache');
const CACHE_FILE = path.join(CACHE_DIR, 'dashboard-data.json');

/**
 * Create empty dashboard data structure
 */
export function createEmptyDashboardData() {
  return {
    timestamp: new Date().toISOString(),
    refreshDurationMs: 0,
    sections: {
      readyCluster: [],
      selenium: [],
      integrationTests: [],
      smokeTests: [],
      newTestsAdded: [],
    },
    lastError: null,
  };
}

/**
 * Initialize cache directory and create empty dashboard-data.json if it doesn't exist
 */
export function initializeCache() {
  try {
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`[Cache] Created cache directory at ${CACHE_DIR}`);
    }

    // Create empty dashboard-data.json if it doesn't exist
    if (!fs.existsSync(CACHE_FILE)) {
      const emptyData = createEmptyDashboardData();
      fs.writeFileSync(CACHE_FILE, JSON.stringify(emptyData, null, 2));
      console.log(`[Cache] Initialized empty cache file at ${CACHE_FILE}`);
    }

    console.log('[Cache] Cache initialization completed');
  } catch (error) {
    console.error('[Cache] Error during initialization:', error.message);
    throw error;
  }
}

/**
 * Load cache from dashboard-data.json file
 * Returns null if file doesn't exist or is invalid
 */
export function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.warn('[Cache] Cache file not found, returning null');
      return null;
    }

    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    console.log('[Cache] Cache loaded successfully');
    return parsed;
  } catch (error) {
    console.error('[Cache] Error loading cache:', error.message);
    return null;
  }
}

/**
 * Save data to cache file (dashboard-data.json)
 */
export function saveCache(data) {
  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log('[Cache] Cache saved successfully');
  } catch (error) {
    console.error('[Cache] Error saving cache:', error.message);
    throw error;
  }
}
