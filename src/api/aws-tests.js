import axios from 'axios';
import https from 'https';
import { log, error } from '../server/logger.js';
import { extractAreasFromSuites, getDefaultReportingStats } from './reporting.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchJenkinsJobTestResults(config, jobPath, displayName) {
  try {
    const baseUrl = config.reportingJenkins?.baseUrl || 'https://jenkins.cicd.cloud.fpdev.io';
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

    if (!jobResponse.data.lastSuccessfulBuild) {
      const builds = jobResponse.data.builds || [];
      const firstBuild = jobResponse.data.firstBuild?.number;
      const lastBuild = jobResponse.data.lastBuild?.number;
      const failedCount = Math.min(6, builds.length);

      return {
        name: displayName,
        buildNumber: lastBuild ?? 'N/A',
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
        statusMessage: (firstBuild !== undefined && lastBuild !== undefined)
          ? `⚠️ Last ${failedCount} builds failed (builds ${firstBuild}-${lastBuild})`
          : '⚠️ No builds found for this job',
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
      log(`[AWS Tests] ${displayName}: No test report available`);
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log(`[AWS Tests] ${displayName}: Build`, lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: displayName,
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
    error(`[AWS Tests] Error fetching ${displayName}:`, e.message);
    return getDefaultReportingStats();
  }
}

export async function fetchAWSSystemTest(config) {
  return fetchJenkinsJobTestResults(config, '/job/GHE-CPT-DEV/job/web-security-system-test/job/master/', 'AWS System Test');
}

export async function fetchAWSControlTest(config) {
  return fetchJenkinsJobTestResults(config, '/job/GHE-CPT-DEV/job/web-security-control/job/master/', 'AWS Control Test');
}
