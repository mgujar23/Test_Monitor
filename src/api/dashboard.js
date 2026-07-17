import { log, warn, error } from '../server/logger.js';
import { fetchReadyClusterTests, fetchIntegrationTests, fetchSmokeTests } from './jenkins.js';
import { fetchSeleniumTests } from './selenium.js';
import { fetchNewTestsAdded, fetchRecentChanges } from './perforce.js';
import { fetchCSGServiceReporting, fetchCSTOREReporting, fetchETLSIEM, fetchETLSIEMClusterTest, fetchReportingMetrics, fetchPRXAutoTest } from './reporting.js';
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
      newTestsAdded: { yearly: [] },
      csgServiceReporting: {},
      cstoreReporting: {},
      etlSIEM: {},
      etlSIEMCluster: {},
      reportingMetrics: { total: 0, failed: 0, stale: 0, areas: [] },
      prxAutoTest: {}
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
    const [readyCluster, selenium, integration, smoke, newTests, csgServiceReporting, cstoreReporting, etlSIEM, etlSIEMCluster, reportingMetrics, prxAutoTest, recentChanges] = await Promise.allSettled([
      fetchReadyClusterTests(config),
      fetchSeleniumTests(config.selenium.portalUrl),
      fetchIntegrationTests(config),
      fetchSmokeTests(config),
      fetchNewTestsAdded(config),
      fetchCSGServiceReporting(config),
      fetchCSTOREReporting(config),
      fetchETLSIEM(config),
      fetchETLSIEMClusterTest(config),
      fetchReportingMetrics(config),
      fetchPRXAutoTest(config),
      fetchRecentChanges(config)
    ]);

    // Process results
    if (readyCluster.status === 'fulfilled') {
      results.sections.readyCluster = aggregateSectionData('readyCluster', readyCluster.value);
      // Add recent changes to readyCluster section
      if (recentChanges.status === 'fulfilled') {
        log('[Dashboard] Recent changes status:', recentChanges.value?.changes?.length || 0, 'changes');
        results.sections.readyCluster.changes = recentChanges.value?.changes || [];
      } else {
        log('[Dashboard] Recent changes failed:', recentChanges.reason);
        results.sections.readyCluster.changes = [];
      }
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

    if (csgServiceReporting.status === 'fulfilled') {
      results.sections.csgServiceReporting = csgServiceReporting.value;
    } else {
      error('CSG Service Reporting fetch failed:', csgServiceReporting.reason);
    }

    if (cstoreReporting.status === 'fulfilled') {
      results.sections.cstoreReporting = cstoreReporting.value;
    } else {
      error('CSTORE Reporting fetch failed:', cstoreReporting.reason);
    }

    if (etlSIEM.status === 'fulfilled') {
      results.sections.etlSIEM = etlSIEM.value;
    } else {
      error('ETL SIEM fetch failed:', etlSIEM.reason);
    }

    if (etlSIEMCluster.status === 'fulfilled') {
      results.sections.etlSIEMCluster = etlSIEMCluster.value;
    } else {
      error('ETL SIEM Cluster Test fetch failed:', etlSIEMCluster.reason);
    }

    if (reportingMetrics.status === 'fulfilled') {
      results.sections.reportingMetrics = aggregateSectionData('reportingMetrics', reportingMetrics.value);
    } else {
      error('Reporting Metrics fetch failed:', reportingMetrics.reason);
    }

    if (prxAutoTest.status === 'fulfilled') {
      results.sections.prxAutoTest = prxAutoTest.value;
    } else {
      error('PRX Auto Test fetch failed:', prxAutoTest.reason);
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

  } catch (err) {
    error('Fatal error aggregating dashboard data:', err.message);
    results.lastError = err.message;
  } finally {
    results.refreshDurationMs = Date.now() - startTime;
    log(`Dashboard refresh completed in ${results.refreshDurationMs}ms`);
  }

  return results;
}
