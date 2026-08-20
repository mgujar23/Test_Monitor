import express from 'express';
import { loadCache } from './cache.js';
import { getTestDetails } from '../api/test-details.js';
import { getHealthStatus, performRefresh } from './jobs.js';
import { generateMockDashboardData } from './mock-data.js';
import { getCoverageMetrics } from '../api/coverage.js';

export default function routes(config) {
  const router = express.Router();
  const DEMO_MODE = process.env.DEMO_MODE === 'true';

  // The background job (jobs.js) only refreshes every refreshIntervalMinutes,
  // and a stale cache isn't refreshed on-demand by a request — so the cache's
  // staleness threshold must exceed the refresh interval (plus room for the
  // refresh itself to run) or every cycle has a guaranteed window where the
  // cache is considered stale before the next scheduled refresh completes,
  // and these routes 503 for that whole window. 5 minutes of headroom covers
  // typical refresh duration plus cron timing drift.
  const refreshIntervalMinutes = config.app?.refreshIntervalMinutes || 15;
  const CACHE_MAX_AGE_MS = (refreshIntervalMinutes * 60 * 1000) + (5 * 60 * 1000);

  // Task 11: Dashboard endpoint - returns full cached data or mock data if DEMO_MODE
  router.get('/dashboard', (req, res) => {
    try {
      let dashboardData;

      if (DEMO_MODE) {
        dashboardData = generateMockDashboardData();
        console.log('[Routes] Serving mock dashboard data (DEMO_MODE enabled)');
      } else {
        dashboardData = loadCache(CACHE_MAX_AGE_MS);
        if (!dashboardData) {
          return res.status(503).json({
            error: 'Cache not available',
            message: 'Dashboard data is being initialized. Please try again in a moment.'
          });
        }
      }
      res.json(dashboardData);
    } catch (error) {
      console.error('[Routes] Error loading dashboard:', error);
      res.status(500).json({
        error: 'Failed to load dashboard data',
        message: error.message
      });
    }
  });

  // Task 12: Failed tests for a section
  router.get('/failed-tests/:section', (req, res) => {
    try {
      const { section } = req.params;
      const cachedData = loadCache(CACHE_MAX_AGE_MS);

      if (!cachedData) {
        return res.status(503).json({
          error: 'Cache not available',
          section
        });
      }

      // Extract failures from the specified section
      const sectionData = cachedData.sections?.[section] || [];
      const failures = [];
      let totalFailed = 0;

      if (Array.isArray(sectionData)) {
        sectionData.forEach(item => {
          if (item.failed === 1 || item.status === 'FAILED') {
            failures.push({
              name: item.name || 'Unknown',
              area: item.area || 'Unknown',
              status: item.status || 'FAILED',
              className: item.className || '',
              duration: item.duration || 0,
              lastRun: item.lastRun || null
            });
            totalFailed++;
          }
        });
      }

      res.json({
        section,
        totalFailed,
        failures
      });
    } catch (error) {
      console.error('[Routes] Error fetching failed tests:', error);
      res.status(500).json({
        error: 'Failed to fetch failed tests',
        message: error.message
      });
    }
  });

  // Task 13: Test details
  router.get('/test-details/:testId', (req, res) => {
    try {
      const { testId } = req.params;
      const cachedData = loadCache(CACHE_MAX_AGE_MS);

      if (!cachedData) {
        return res.status(503).json({
          error: 'Cache not available',
          testId
        });
      }

      const testDetails = getTestDetails(testId, cachedData);

      if (!testDetails) {
        return res.status(404).json({
          error: 'Test not found',
          testId
        });
      }

      res.json(testDetails);
    } catch (error) {
      console.error('[Routes] Error fetching test details:', error);
      res.status(500).json({
        error: 'Failed to fetch test details',
        message: error.message
      });
    }
  });

  // Task 14: Health check
  router.get('/health', (req, res) => {
    try {
      const health = getHealthStatus();
      res.json(health);
    } catch (error) {
      console.error('[Routes] Error getting health status:', error);
      res.status(500).json({
        error: 'Failed to get health status',
        message: error.message
      });
    }
  });

  // Task 14: Manual refresh trigger
  router.post('/refresh', (req, res) => {
    try {
      performRefresh(config);
      res.json({
        message: 'Refresh triggered successfully',
        status: 'in-progress'
      });
    } catch (error) {
      console.error('[Routes] Error triggering refresh:', error);
      res.status(500).json({
        error: 'Failed to trigger refresh',
        message: error.message
      });
    }
  });

  // Coverage metrics endpoint
  router.get('/coverage-metrics', async (req, res) => {
    try {
      // Get test data from dashboard cache for accurate coverage calculation
      const dashboardData = loadCache(CACHE_MAX_AGE_MS);
      const testData = dashboardData?.aiInsights?.sectionGroupStats ? {
        portal: dashboardData.aiInsights.sectionGroupStats.portal || 325000,
        reporting: dashboardData.aiInsights.sectionGroupStats.reporting || 1089,
        proxy: dashboardData.aiInsights.sectionGroupStats.proxy || 10553,
        aws: dashboardData.aiInsights.sectionGroupStats.aws ?? null,
        total: dashboardData.aiInsights.sectionGroupStats.total || 336642
      } : null;

      const jenkinsCoverage = dashboardData?.jenkinsCoverage || null;
      const metrics = await getCoverageMetrics(config, testData, jenkinsCoverage);
      if (!metrics) {
        return res.status(503).json({
          error: 'Coverage metrics not available',
          message: 'Unable to calculate coverage metrics at this time'
        });
      }
      res.json(metrics);
    } catch (error) {
      console.error('[Routes] Error fetching coverage metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch coverage metrics',
        message: error.message
      });
    }
  });

  return router;
}
