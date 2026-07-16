import axios from 'axios';
import https from 'https';
import { log, error } from '../server/logger.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// CSG Service Reporting - from jenkins.cicd.cloud.fpdev.io
export async function fetchCSGServiceReporting(config) {
  try {
    log('[Reporting] Fetching CSG Service Reporting');

    const baseUrl = config.reportingJenkins?.baseUrl || 'https://jenkins.cicd.cloud.fpdev.io';
    const jobPath = config.reportingJenkins?.jobPath || '/job/GHE-CSG-DEV/job/csg_service-reporting/job/master/';
    const username = config.reportingJenkins?.username || 'mgujar';
    const apiToken = config.reportingJenkins?.apiToken || config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    // Get job info for build number
    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    // Prefer successful build, fall back to completed build
    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    // Get test report
    const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };

    try {
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] CSG: No test report available');
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;

    // Extract areas from test suites
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] CSG Service: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount, 'Areas:', areas.length);

    return {
      name: 'CSG Service Reporting',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas
    };
  } catch (e) {
    error('[Reporting] Error fetching CSG Service:', e.message);
    return getDefaultReportingStats();
  }
}

// CSTORE Reporting Test - from jenkins.infra-dev.forcepoint.net
export async function fetchCSTOREReporting(config) {
  try {
    log('[Reporting] Fetching CSTORE Reporting Test');

    const baseUrl = config.jenkins?.baseUrl || 'https://jenkins.infra-dev.forcepoint.net';
    const jobPath = '/job/Projects/job/Test/job/CStoreReportingTest/';
    const username = 'mgujar';
    const apiToken = config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    // Get job info
    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    // Check for successful build
    if (!jobResponse.data.lastSuccessfulBuild) {
      // Count failed builds
      const builds = jobResponse.data.builds || [];
      const firstBuild = jobResponse.data.firstBuild?.number;
      const lastBuild = jobResponse.data.lastBuild?.number;
      const failedCount = Math.min(6, builds.length);

      return {
        name: 'CSTORE Reporting Test',
        buildNumber: lastBuild,
        buildUrl: jobResponse.data.lastBuild?.url || '',
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Last ${failedCount} builds failed (builds ${firstBuild}-${lastBuild})`,
        hasTestData: false
      };
    }

    // Prefer successful build, fall back to completed build
    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    // Get build details (result, duration)
    let buildData = { result: 'UNKNOWN', duration: 0 };
    try {
      const buildDetailsUrl = `${baseUrl}${jobPath}${lastBuild.number}/api/json`;
      const buildDetailsResponse = await axios.get(buildDetailsUrl, {
        auth: { username, password: apiToken },
        timeout: 10000,
        httpsAgent: httpsAgent
      });
      buildData = buildDetailsResponse.data;
    } catch (e) {
      log('[Reporting] CSTORE: Could not fetch build details');
    }

    // Get test report
    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };

    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] CSTORE: No test report available');
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] CSTORE: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: 'CSTORE Reporting Test',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas
    };
  } catch (e) {
    error('[Reporting] Error fetching CSTORE:', e.message);
    return getDefaultReportingStats();
  }
}

// ETL SIEM - from jenkins.cicd.cloud.fpdev.io
export async function fetchETLSIEM(config) {
  try {
    log('[Reporting] Fetching ETL SIEM');

    const baseUrl = config.reportingJenkins?.baseUrl || 'https://jenkins.cicd.cloud.fpdev.io';
    const jobPath = '/job/GHE-CSG-DEV/job/etl-siem/job/master/';
    const username = config.reportingJenkins?.username || 'mgujar';
    const apiToken = config.reportingJenkins?.apiToken || config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    // Get job info
    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    // Prefer successful build, fall back to completed build
    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    // Get test report
    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };

    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] ETL SIEM: No test report available');
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] ETL SIEM: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: 'ETL SIEM',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas
    };
  } catch (e) {
    error('[Reporting] Error fetching ETL SIEM:', err.message);
    return getDefaultReportingStats();
  }
}

// ETL SIEM Cluster Test - from jenkins.infra-dev.forcepoint.net
export async function fetchETLSIEMClusterTest(config) {
  try {
    log('[Reporting] Fetching ETL SIEM Cluster Test');

    const baseUrl = config.jenkins?.baseUrl || 'https://jenkins.infra-dev.forcepoint.net';
    const jobPath = '/job/Projects/job/Test/job/ETLSIEMTest/';
    const username = 'mgujar';
    const apiToken = config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    // Get job info
    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    // Prefer successful build, fall back to completed build
    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    // Get build details (result, duration)
    let buildData = { result: 'UNKNOWN', duration: 0 };
    try {
      const buildDetailsUrl = `${baseUrl}${jobPath}${lastBuild.number}/api/json`;
      const buildDetailsResponse = await axios.get(buildDetailsUrl, {
        auth: { username, password: apiToken },
        timeout: 10000,
        httpsAgent: httpsAgent
      });
      buildData = buildDetailsResponse.data;
    } catch (e) {
      log('[Reporting] ETL SIEM Cluster: Could not fetch build details');
    }

    // Get test report
    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };
    let hasTestData = true;

    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] ETL SIEM Cluster: No test report available');
      hasTestData = false;
    }

    // If no test data but successful builds exist, show message
    if (!hasTestData && jobResponse.data.lastSuccessfulBuild) {
      const lastCompleted = jobResponse.data.lastCompletedBuild?.number || lastBuild.number;
      const lastSuccessful = jobResponse.data.lastSuccessfulBuild?.number;
      const failedCount = lastCompleted - lastSuccessful;

      return {
        name: 'ETL SIEM Cluster Test',
        buildNumber: lastSuccessful,
        buildUrl: jobResponse.data.lastSuccessfulBuild.url || '',
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Last ${failedCount} builds failed (build #${lastSuccessful} was the last successful)`,
        hasTestData: false
      };
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] ETL SIEM Cluster: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: 'ETL SIEM Cluster Test',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas,
      hasTestData: true
    };
  } catch (e) {
    error('[Reporting] Error fetching ETL SIEM Cluster Test:', e.message);
    return getDefaultReportingStats();
  }
}

// Helper function to extract areas from test suites
function extractAreasFromSuites(suites) {
  const areaMap = {};

  suites.forEach(suite => {
    // Extract area name from class name (e.g., com.websense.cstore.api.ObjectUtilTest -> ObjectUtil)
    const parts = suite.name.split('.');
    const className = parts[parts.length - 1].replace('Test', '');
    const areaName = className;

    if (!areaMap[areaName]) {
      areaMap[areaName] = {
        name: areaName,
        total: 0,
        failed: 0,
        stale: 0,
        tests: []
      };
    }

    // Process test cases
    (suite.cases || []).forEach(testCase => {
      areaMap[areaName].total++;

      const status = testCase.skipped ? 'STALE' : testCase.status === 'PASSED' ? 'PASS' : 'FAIL';
      if (status === 'FAIL') {
        areaMap[areaName].failed++;
      }

      areaMap[areaName].tests.push({
        filename: testCase.name,
        status: status,
        lastPassed: status === 'PASS' ? 'Latest Build' : 'Previous Build',
        recentChanges: testCase.errorDetails || 'See Jenkins for details',
        suggestedFix: status === 'FAIL' ? 'Review test failure logs' : 'N/A'
      });
    });
  });

  return Object.values(areaMap).filter(area => area.total > 0);
}

// Legacy function for backward compatibility
export async function fetchReportingTests(config) {
  return fetchCSGServiceReporting(config);
}

export async function fetchReportingMetrics(config) {
  try {
    log('[Reporting] Fetching reporting metrics');
    return {
      total: 0,
      failed: 0,
      stale: 0,
      areas: [],
      builds: [],
      changes: []
    };
  } catch (e) {
    error('[Reporting] Error fetching reporting metrics:', err.message);
    return {
      total: 0,
      failed: 0,
      stale: 0,
      areas: [],
      builds: [],
      changes: []
    };
  }
}

// PRX Auto Test - from jenkins.infra-dev.forcepoint.net
export async function fetchPRXAutoTest(config) {
  try {
    log('[Reporting] Fetching PRX Auto Test');

    const baseUrl = config.jenkins?.baseUrl || 'https://jenkins.infra-dev.forcepoint.net';
    const jobPath = '/job/Projects/job/Test/job/PrxAutotests/';
    const username = 'mgujar';
    const apiToken = config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    // Get job info
    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    // Check for successful build
    if (!jobResponse.data.lastSuccessfulBuild) {
      const builds = jobResponse.data.builds || [];
      const firstBuild = jobResponse.data.firstBuild?.number;
      const lastBuild = jobResponse.data.lastBuild?.number;
      const failedCount = Math.min(6, builds.length);

      return {
        name: 'PRX Auto Test',
        buildNumber: lastBuild,
        buildUrl: jobResponse.data.lastBuild?.url || '',
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Last ${failedCount} builds failed (builds ${firstBuild}-${lastBuild})`,
        hasTestData: false
      };
    }

    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    // Get test report
    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };
    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] PRX Auto Test: No test report available');
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] PRX Auto Test: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: 'PRX Auto Test',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas,
      hasTestData: true
    };
  } catch (e) {
    error('[Reporting] Error fetching PRX Auto Test:', e.message);
    return getDefaultReportingStats();
  }
}

// PRX Integration Test - from jenkins.infra-dev.forcepoint.net
export async function fetchPRXIntegrationTest(config) {
  try {
    log('[Reporting] Fetching PRX Integration Test');

    const baseUrl = config.jenkins?.baseUrl || 'https://jenkins.infra-dev.forcepoint.net';
    const jobPath = '/job/Projects/job/Test/job/PrxIntegrationTrigger/';
    const username = 'mgujar';
    const apiToken = config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    if (!jobResponse.data.lastSuccessfulBuild) {
      const builds = jobResponse.data.builds || [];
      const firstBuild = jobResponse.data.firstBuild?.number;
      const lastBuild = jobResponse.data.lastBuild?.number;
      const failedCount = Math.min(6, builds.length);

      return {
        name: 'PRX Integration Test',
        buildNumber: lastBuild,
        buildUrl: jobResponse.data.lastBuild?.url || '',
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Last ${failedCount} builds failed (builds ${firstBuild}-${lastBuild})`,
        hasTestData: false
      };
    }

    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };
    let hasTestData = true;
    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] PRX Integration Test: No test report available');
      hasTestData = false;
    }

    if (!hasTestData) {
      return {
        name: 'PRX Integration Test',
        buildNumber: lastBuild.number,
        buildUrl: lastBuild.url,
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Test reports not available for build #${lastBuild.number}`,
        hasTestData: false
      };
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] PRX Integration Test: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: 'PRX Integration Test',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas,
      hasTestData: true
    };
  } catch (e) {
    error('[Reporting] Error fetching PRX Integration Test:', e.message);
    return getDefaultReportingStats();
  }
}

// PRX Release Cluster Build - from jenkins.infra-dev.forcepoint.net
export async function fetchPRXReleaseCluster(config) {
  try {
    log('[Reporting] Fetching PRX Release Cluster Build');

    const baseUrl = config.jenkins?.baseUrl || 'https://jenkins.infra-dev.forcepoint.net';
    const jobPath = '/job/Projects/job/Test/job/PRX-Release-SystemTestCluster_Build/';
    const username = 'mgujar';
    const apiToken = config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    if (!jobResponse.data.lastSuccessfulBuild) {
      const builds = jobResponse.data.builds || [];
      const firstBuild = jobResponse.data.firstBuild?.number;
      const lastBuild = jobResponse.data.lastBuild?.number;
      const failedCount = Math.min(6, builds.length);

      return {
        name: 'PRX Release Cluster Build',
        buildNumber: lastBuild,
        buildUrl: jobResponse.data.lastBuild?.url || '',
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Last ${failedCount} builds failed (builds ${firstBuild}-${lastBuild})`,
        hasTestData: false
      };
    }

    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };
    let hasTestData = true;
    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log('[Reporting] PRX Release Cluster: No test report available');
      hasTestData = false;
    }

    if (!hasTestData) {
      return {
        name: 'PRX Release Cluster Build',
        buildNumber: lastBuild.number,
        buildUrl: lastBuild.url,
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Test reports not available for build #${lastBuild.number}`,
        hasTestData: false
      };
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log('[Reporting] PRX Release Cluster: Build', lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: 'PRX Release Cluster Build',
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas,
      hasTestData: true
    };
  } catch (e) {
    error('[Reporting] Error fetching PRX Release Cluster:', e.message);
    return getDefaultReportingStats();
  }
}

function getDefaultReportingStats() {
  return {
    name: 'Reporting Suite',
    buildNumber: 'N/A',
    buildUrl: '#',
    passCount: 0,
    failCount: 0,
    skipCount: 0,
    totalTests: 0,
    passRate: '0.00',
    duration: '0.00',
    total: 0,
    failed: 0,
    stale: 0,
    areas: []
  };
}
