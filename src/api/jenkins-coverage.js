import axios from 'axios';
import https from 'https';
import { log, warn, error } from '../server/logger.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Real, tool-measured code coverage for the Reporting area, from the
 * Jenkins "Coverage" plugin (JaCoCo) on csg_service-reporting's last
 * successful build. Distinct from this app's test-count-based proxy
 * metric in coverage.js — this is an actual instrumented measurement.
 */
export async function fetchReportingJacocoCoverage(config) {
  try {
    const baseUrl = config.reportingJenkins?.baseUrl || 'https://jenkins.cicd.cloud.fpdev.io';
    const jobPath = '/job/GHE-CSG-DEV/job/csg_service-reporting/job/master/';
    const username = config.reportingJenkins?.username || 'mgujar';
    const apiToken = config.reportingJenkins?.apiToken || config.jenkins?.apiToken;

    if (!apiToken) {
      return { name: 'Reporting (csg_service-reporting)', percentage: null, metric: 'line', source: 'JaCoCo (Jenkins Coverage plugin)', available: false, reason: 'No API token configured' };
    }

    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent
    });

    const lastBuild = jobResponse.data.lastSuccessfulBuild;
    if (!lastBuild) {
      return { name: 'Reporting (csg_service-reporting)', percentage: null, metric: 'line', source: 'JaCoCo (Jenkins Coverage plugin)', available: false, reason: 'No successful build' };
    }

    const jacocoUrl = `${baseUrl}${jobPath}${lastBuild.number}/jacoco/api/json`;
    const jacocoResponse = await axios.get(jacocoUrl, {
      auth: { username, password: apiToken },
      timeout: 15000,
      httpsAgent
    });

    const stats = jacocoResponse.data.projectStatistics || {};
    const linePercentage = parseFloat(stats.line);
    const totalLoC = parseInt(stats.loc, 10);

    if (isNaN(linePercentage)) {
      return { name: 'Reporting (csg_service-reporting)', percentage: null, metric: 'line', source: 'JaCoCo (Jenkins Coverage plugin)', available: false, reason: 'No line coverage figure in JaCoCo report' };
    }

    log('[JenkinsCoverage] Reporting (JaCoCo): build', lastBuild.number, 'line coverage', linePercentage + '%, LOC', totalLoC);

    return {
      name: 'Reporting (csg_service-reporting)',
      percentage: linePercentage,
      totalLoC: isNaN(totalLoC) ? null : totalLoC,
      metric: 'line',
      source: 'JaCoCo (Jenkins Coverage plugin)',
      buildNumber: lastBuild.number,
      buildUrl: `${baseUrl}${jobPath}${lastBuild.number}/jacoco/`,
      available: true
    };
  } catch (err) {
    error('[JenkinsCoverage] Error fetching Reporting JaCoCo coverage:', err.message);
    return { name: 'Reporting (csg_service-reporting)', percentage: null, metric: 'line', source: 'JaCoCo (Jenkins Coverage plugin)', available: false, reason: err.message };
  }
}

/**
 * Real, tool-measured code coverage for the Proxy area, from a coverage.py
 * HTML report published as a Jenkins HTML report ("PRX Coverage Report") on
 * the PrxAutotests job. The report has no build number in its URL — Jenkins'
 * HTML Publisher plugin exposes only the latest report at this stable path.
 */
export async function fetchProxyPythonCoverage(config) {
  try {
    const baseUrl = config.jenkins?.baseUrl || 'https://jenkins.infra-dev.forcepoint.net';
    const reportUrl = `${baseUrl}/job/Projects/job/Test/job/PrxAutotests/PRX_20Coverage_20Report/index.html`;
    const apiToken = config.jenkins?.apiToken;

    if (!apiToken) {
      return { name: 'Proxy (PrxAutotests)', percentage: null, metric: 'line (statements)', source: 'coverage.py', available: false, reason: 'No API token configured' };
    }

    const response = await axios.get(reportUrl, {
      auth: { username: 'mgujar', password: apiToken },
      timeout: 15000,
      httpsAgent
    });

    const html = response.data;
    const totalRowMatch = html.match(/<tr class="total">[\s\S]*?data-ratio="(\d+)\s+(\d+)"[^>]*>([\d.]+)%/);

    if (!totalRowMatch) {
      warn('[JenkinsCoverage] Proxy (coverage.py): could not find TOTAL row in report HTML');
      return { name: 'Proxy (PrxAutotests)', percentage: null, metric: 'line (statements)', source: 'coverage.py', available: false, reason: 'Could not parse TOTAL row from report' };
    }

    const [, coveredStatements, totalStatements, percentageText] = totalRowMatch;
    const percentage = parseFloat(percentageText);

    log('[JenkinsCoverage] Proxy (coverage.py): TOTAL', coveredStatements, '/', totalStatements, 'statements =', percentage + '%');

    return {
      name: 'Proxy (PrxAutotests)',
      percentage,
      totalLoC: parseInt(totalStatements, 10),
      metric: 'line (statements)',
      source: 'coverage.py',
      coveredStatements: parseInt(coveredStatements, 10),
      totalStatements: parseInt(totalStatements, 10),
      buildUrl: reportUrl,
      available: true
    };
  } catch (err) {
    error('[JenkinsCoverage] Error fetching Proxy coverage.py report:', err.message);
    return { name: 'Proxy (PrxAutotests)', percentage: null, metric: 'line (statements)', source: 'coverage.py', available: false, reason: err.message };
  }
}
