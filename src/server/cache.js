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
    cacheCreatedAt: new Date().toISOString(),
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
 * Check if cache is valid and not stale
 * Cache is considered invalid if:
 * - Older than 10 minutes
 * - Empty or missing sections
 */
function isCacheValid() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('[Cache] Cache file does not exist - will refresh');
      return false;
    }

    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

    // Check if cache has valid data
    if (!data.sections || !data.cacheCreatedAt) {
      console.log('[Cache] Cache is incomplete - will refresh');
      return false;
    }

    // Check if cache is older than 10 minutes
    const cacheAge = Date.now() - new Date(data.cacheCreatedAt).getTime();
    const MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

    if (cacheAge > MAX_CACHE_AGE) {
      console.log(`[Cache] Cache is ${Math.round(cacheAge / 1000)}s old (max: ${MAX_CACHE_AGE / 1000}s) - will refresh`);
      return false;
    }

    console.log(`[Cache] Cache is valid (age: ${Math.round(cacheAge / 1000)}s)`);
    return true;
  } catch (error) {
    console.log('[Cache] Error validating cache:', error.message, '- will refresh');
    return false;
  }
}

/**
 * Initialize cache directory and create empty dashboard-data.json if it doesn't exist
 * Always clears cache on startup to ensure fresh data
 */
export function initializeCache() {
  try {
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`[Cache] Created cache directory at ${CACHE_DIR}`);
    }

    // Clear cache file on startup to ensure fresh data is fetched
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('[Cache] Cleared stale cache on startup');
    }

    // Create fresh empty cache
    const emptyData = createEmptyDashboardData();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(emptyData, null, 2));
    console.log('[Cache] Initialized fresh cache file');
    console.log('[Cache] Cache initialization completed - data will be fetched from live sources');
  } catch (error) {
    console.error('[Cache] Error during initialization:', error.message);
    throw error;
  }
}

/**
 * Load cache from dashboard-data.json file
 * Returns null if file doesn't exist, is invalid, or is stale
 * This ensures fresh data is fetched periodically
 */
export function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.warn('[Cache] Cache file not found, returning null to fetch fresh data');
      return null;
    }

    // Check if cache is valid before returning
    if (!isCacheValid()) {
      console.log('[Cache] Cache is stale or invalid, returning null to fetch fresh data');
      return null;
    }

    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    console.log('[Cache] Valid cache loaded successfully');
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
