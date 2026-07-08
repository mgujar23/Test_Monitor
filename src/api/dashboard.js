import { log, warn, error } from '../server/logger.js';
import { fetchReadyClusterTests, fetchIntegrationTests, fetchSmokeTests } from './jenkins.js';
import { fetchSeleniumTests } from './selenium.js';
import { fetchNewTestsAdded } from './perforce.js';
import { aggregateSectionData, formatTimestamp, loadFixesFile } from './utils.js';
import { generateAIInsights } from './ai-insights.js';

export async function aggregateDashboardData(config) {
  const startTime = Date.now();
  const now = new Date().toISOString();
  const results = {
    timestamp: formatTimestamp(),
    cacheCreatedAt: now,
    sections: {
      readyCluster: { total: 0, failed: 0, stale: 0, areas: [] },
      selenium: { total: 0, failed: 0, stale: 0, areas: [] },
      integrationTests: { total: 0, failed: 0, stale: 0, areas: [] },
      smokeTests: { total: 0, failed: 0, stale: 0, areas: [] },
      newTestsAdded: { yearly: [] }
    },
    aiInsights: {
      healthScore: 0,
      passRate: 0,
      alerts: [],
      flakyTests: [],
      recommendations: []
    },
    lastError: null,
    refreshDurationMs: 0
  };

  try {
    // Fetch from all sources in parallel
    const [readyCluster, selenium, integration, smoke, newTests] = await Promise.allSettled([
      fetchReadyClusterTests(config),
      fetchSeleniumTests(config.selenium.portalUrl),
      fetchIntegrationTests(config),
      fetchSmokeTests(config),
      fetchNewTestsAdded(config)
    ]);

    // Process results
    if (readyCluster.status === 'fulfilled') {
      results.sections.readyCluster = aggregateSectionData('readyCluster', readyCluster.value);
    } else {
      error('Ready Cluster fetch failed:', readyCluster.reason);
    }

    if (selenium.status === 'fulfilled') {
      results.sections.selenium = aggregateSectionData('selenium', selenium.value);
    } else {
      error('Selenium fetch failed:', selenium.reason);
    }

    if (integration.status === 'fulfilled') {
      results.sections.integrationTests = aggregateSectionData('integrationTests', integration.value);
    } else {
      error('Integration Tests fetch failed:', integration.reason);
    }

    if (smoke.status === 'fulfilled') {
      results.sections.smokeTests = aggregateSectionData('smokeTests', smoke.value);
    } else {
      error('Smoke Tests fetch failed:', smoke.reason);
    }

    if (newTests.status === 'fulfilled') {
      results.sections.newTestsAdded = newTests.value;
    } else {
      error('New Tests Added fetch failed:', newTests.reason);
    }

    // Log warnings for high failure counts
    const totalFailed = Object.values(results.sections).reduce((sum, section) => {
      return sum + (section.failed || 0);
    }, 0);

    if (totalFailed > 500) {
      warn(`⚠️  High failure count detected: ${totalFailed} total failures`);
    }

    // Generate AI insights
    log('[AI] Generating insights and recommendations...');
    results.aiInsights = generateAIInsights(results);
    log(`[AI] Health Score: ${results.aiInsights.healthScore}, Pass Rate: ${results.aiInsights.passRate}%`);
    log(`[AI] Generated ${results.aiInsights.alerts.length} alerts and ${results.aiInsights.recommendations.length} recommendations`);

  } catch (error) {
    error('Fatal error aggregating dashboard data:', error.message);
    results.lastError = error.message;
  } finally {
    results.refreshDurationMs = Date.now() - startTime;
    log(`Dashboard refresh completed in ${results.refreshDurationMs}ms`);
  }

  return results;
}
