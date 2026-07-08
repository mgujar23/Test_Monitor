import { log, warn, error } from './logger.js';
import cron from 'node-cron';
import { saveCache } from './cache.js';

/**
 * Task 14: Background Jobs Module
 * Manages periodic cache refresh and health status
 */

// Global state for tracking job execution
const jobState = {
  isRefreshing: false,
  lastRefresh: null,
  nextRefresh: null,
  lastError: null,
  refreshIntervalMinutes: 15,
  cronTask: null
};

/**
 * Perform dashboard data aggregation and cache it
 */
export async function performRefresh(config) {
  if (jobState.isRefreshing) {
    log('[Jobs] Refresh already in progress, skipping');
    return;
  }

  jobState.isRefreshing = true;
  const startTime = Date.now();

  try {
    log('[Jobs] Starting dashboard data refresh...');

    // Import aggregation function
    const { aggregateDashboardData } = await import('../api/dashboard.js');

    // Fetch aggregated data
    const dashboardData = await aggregateDashboardData(config);

    // Add refresh metadata
    const dataWithMetadata = {
      ...dashboardData,
      refreshMetadata: {
        refreshedAt: new Date().toISOString(),
        refreshDurationMs: Date.now() - startTime
      }
    };

    // Save to cache
    saveCache(dataWithMetadata);

    // Update job state
    jobState.lastRefresh = new Date();
    jobState.lastError = null;
    jobState.nextRefresh = new Date(Date.now() + (jobState.refreshIntervalMinutes * 60 * 1000));

    const duration = Date.now() - startTime;
    log(`[Jobs] Dashboard refresh completed in ${duration}ms`);
  } catch (error) {
    error('[Jobs] Error during refresh:', error);
    jobState.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    jobState.isRefreshing = false;
  }
}

/**
 * Initialize background cron job for periodic refresh
 */
export function initBackgroundJob(config) {
  try {
    const intervalMinutes = config.app?.refreshIntervalMinutes || 15;
    jobState.refreshIntervalMinutes = intervalMinutes;

    // Calculate cron expression for the interval
    // For 15 minutes: */15 * * * * (every 15 minutes)
    const cronExpression = `*/${intervalMinutes} * * * *`;

    log(`[Jobs] Initializing background refresh job (interval: ${intervalMinutes} minutes)`);
    log(`[Jobs] Cron expression: ${cronExpression}`);

    // Schedule the cron job
    jobState.cronTask = cron.schedule(cronExpression, async () => {
      log(`[Jobs] Cron job triggered at ${new Date().toISOString()}`);
      await performRefresh(config);
    });

    // Perform initial refresh immediately
    log('[Jobs] Performing initial refresh...');
    performRefresh(config);

    // Set next refresh time
    jobState.nextRefresh = new Date(Date.now() + (intervalMinutes * 60 * 1000));

    log('[Jobs] Background job initialized successfully');
  } catch (error) {
    error('[Jobs] Fatal error initializing background job:', error);
    throw error;
  }
}

/**
 * Get current health status of the refresh job
 */
export function getHealthStatus() {
  return {
    status: jobState.isRefreshing ? 'busy' : 'healthy',
    lastRefresh: jobState.lastRefresh ? jobState.lastRefresh.toISOString() : null,
    nextRefresh: jobState.nextRefresh ? jobState.nextRefresh.toISOString() : null,
    isRefreshing: jobState.isRefreshing,
    refreshIntervalMinutes: jobState.refreshIntervalMinutes,
    lastError: jobState.lastError,
    timestamp: new Date().toISOString()
  };
}

/**
 * Stop the background job (for cleanup/testing)
 */
export function stopBackgroundJob() {
  if (jobState.cronTask) {
    jobState.cronTask.stop();
    log('[Jobs] Background job stopped');
  }
}
