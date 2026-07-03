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
    console.log('[Jobs] Refresh already in progress, skipping');
    return;
  }

  jobState.isRefreshing = true;
  const startTime = Date.now();

  try {
    console.log('[Jobs] Starting dashboard data refresh...');

    // Dynamically import DashboardAggregator (handles CommonJS interop)
    const { default: DashboardAggregator } = await import('../api/dashboard.js');

    // Create aggregator and fetch data
    const aggregator = new DashboardAggregator(config);
    const dashboardData = await aggregator.aggregateDashboardData();

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
    console.log(`[Jobs] Dashboard refresh completed in ${duration}ms`);
  } catch (error) {
    console.error('[Jobs] Error during refresh:', error);
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

    console.log(`[Jobs] Initializing background refresh job (interval: ${intervalMinutes} minutes)`);
    console.log(`[Jobs] Cron expression: ${cronExpression}`);

    // Schedule the cron job
    jobState.cronTask = cron.schedule(cronExpression, async () => {
      console.log(`[Jobs] Cron job triggered at ${new Date().toISOString()}`);
      await performRefresh(config);
    });

    // Perform initial refresh immediately
    console.log('[Jobs] Performing initial refresh...');
    performRefresh(config);

    // Set next refresh time
    jobState.nextRefresh = new Date(Date.now() + (intervalMinutes * 60 * 1000));

    console.log('[Jobs] Background job initialized successfully');
  } catch (error) {
    console.error('[Jobs] Fatal error initializing background job:', error);
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
    console.log('[Jobs] Background job stopped');
  }
}
