import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { log, error } from '../server/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let locReport = null;
try {
  locReport = JSON.parse(readFileSync(path.join(__dirname, '../data/loc-report.json'), 'utf-8'));
} catch (err) {
  error('[Coverage] Failed to load src/data/loc-report.json:', err.message);
  locReport = null;
}

const EXPECTED_BASELINE = 500000;

/**
 * @param {number} areaLoC
 * @param {number|null} testCount - null means no test-count source exists for this area yet
 * @param {number} totalLoC - grand total SLOC across all areas, used to scale this area's
 *   share of EXPECTED_BASELINE so a small module isn't held to the same target as the
 *   whole codebase
 */
function computeAreaCoverage(areaLoC, testCount, totalLoC) {
  const baseline = EXPECTED_BASELINE * (areaLoC / totalLoC);
  if (testCount === null) {
    return { coveragePercentage: null, coveredLoC: 0, baseline };
  }
  const coveragePercentage = Math.min(Math.round((testCount / baseline) * 100), 100);
  const coveredLoC = Math.round(areaLoC * (coveragePercentage / 100));
  return { coveragePercentage, coveredLoC, baseline };
}

function areaFileCount(areaKey) {
  const area = locReport.areas[areaKey];
  const rows = area.directories || area.repos;
  return rows.reduce((sum, r) => sum + (r.files || 0), 0);
}

/**
 * Calculate coverage metrics from the static LOC dataset (src/data/loc-report.json)
 * combined with live test counts.
 * @param {Object} config - unused now that measurement is static; kept for call-site compatibility
 * @param {Object|null} testData - {portal, reporting, proxy, total} test counts from the dashboard cache
 * @param {Object|null} jenkinsCoverage - real, tool-measured coverage from the dashboard cache
 *   (src/api/jenkins-coverage.js, fetched by the background refresh job — never fetched here,
 *   this function stays network-free). Shape: {reporting: {...}, proxy: {...}}, passed through
 *   as-is under `jenkinsReportedCoverage` since it needs no further computation.
 */
export async function getCoverageMetrics(config, testData = null, jenkinsCoverage = null) {
  if (locReport === null) {
    return null;
  }

  log('[Coverage] Building coverage metrics from static loc-report.json (generated', locReport.generatedDate + ')');

  const portalLoC = locReport.areas.portal.totalLoC;
  const awsLoC = locReport.areas.aws.totalLoC;
  const reportingLoC = locReport.areas.reporting.totalLoC;
  const proxyLoC = locReport.areas.proxy.totalLoC;
  const totalLoC = portalLoC + awsLoC + reportingLoC + proxyLoC;

  const portalTests = testData?.portal || 325000;
  const reportingTests = testData?.reporting || 1089;
  const proxyTests = testData?.proxy || 10553;
  const totalTests = testData?.total || (portalTests + reportingTests + proxyTests);

  const portal = computeAreaCoverage(portalLoC, portalTests, totalLoC);
  const reporting = computeAreaCoverage(reportingLoC, reportingTests, totalLoC);
  const proxy = computeAreaCoverage(proxyLoC, proxyTests, totalLoC);
  const aws = computeAreaCoverage(awsLoC, testData?.aws ?? null, totalLoC);

  const totalCovered = portal.coveredLoC + aws.coveredLoC + reporting.coveredLoC + proxy.coveredLoC;
  const overallCoveragePercent = Math.min(Math.round((totalCovered / totalLoC) * 100), 100);
  const totalCoveragePercent = Math.min(Math.round((totalTests / EXPECTED_BASELINE) * 100), 100);

  log('[Coverage] Coverage % - Portal:', portal.coveragePercentage + '%', 'AWS:', aws.coveragePercentage, 'Reporting:', reporting.coveragePercentage + '%', 'Proxy:', proxy.coveragePercentage + '%', 'Overall:', overallCoveragePercent + '%');

  const byArea = {
    portal: { name: 'Portal', totalLoC: portalLoC, totalFiles: areaFileCount('portal'), coveredLoC: portal.coveredLoC, coveragePercentage: portal.coveragePercentage, testCount: portalTests, expectedBaseline: Math.round(portal.baseline) },
    aws: { name: 'AWS', totalLoC: awsLoC, totalFiles: areaFileCount('aws'), coveredLoC: aws.coveredLoC, coveragePercentage: aws.coveragePercentage, testCount: testData?.aws ?? null, expectedBaseline: Math.round(aws.baseline) },
    reporting: { name: 'Reporting', totalLoC: reportingLoC, totalFiles: areaFileCount('reporting'), coveredLoC: reporting.coveredLoC, coveragePercentage: reporting.coveragePercentage, testCount: reportingTests, expectedBaseline: Math.round(reporting.baseline) },
    proxy: { name: 'Proxy', totalLoC: proxyLoC, totalFiles: areaFileCount('proxy'), coveredLoC: proxy.coveredLoC, coveragePercentage: proxy.coveragePercentage, testCount: proxyTests, expectedBaseline: Math.round(proxy.baseline) }
  };

  const bySource = {
    portal: { source: 'Portal', loC: portalLoC, files: byArea.portal.totalFiles, coveragePercentage: portal.coveragePercentage },
    aws: { source: 'AWS', loC: awsLoC, files: byArea.aws.totalFiles, coveragePercentage: aws.coveragePercentage },
    reporting: { source: 'Reporting', loC: reportingLoC, files: byArea.reporting.totalFiles, coveragePercentage: reporting.coveragePercentage },
    proxy: { source: 'Proxy', loC: proxyLoC, files: byArea.proxy.totalFiles, coveragePercentage: proxy.coveragePercentage }
  };

  return {
    generatedDate: locReport.generatedDate,
    timestamp: new Date().toISOString(),
    jenkinsReportedCoverage: jenkinsCoverage,
    summary: {
      totalLoC,
      coveredLoC: totalCovered,
      uncoveredLoC: totalLoC - totalCovered,
      coveragePercentage: overallCoveragePercent,
      expectedBaseline: EXPECTED_BASELINE
    },
    byArea,
    bySource,
    distribution: {
      areaTables: {
        portal: { totalLoC: portalLoC, rows: locReport.areas.portal.directories },
        aws: { totalLoC: awsLoC, rows: locReport.areas.aws.repos },
        reporting: { totalLoC: reportingLoC, rows: locReport.areas.reporting.repos },
        proxy: { totalLoC: proxyLoC, rows: locReport.areas.proxy.repos }
      },
      topLanguages: [
        { lang: 'Perl (.pm)', loC: Math.round(portalLoC * 0.25), percent: 22 },
        { lang: 'SQL (.sql)', loC: Math.round(portalLoC * 0.15), percent: 13 },
        { lang: 'JavaScript (.js)', loC: Math.round(totalLoC * 0.12), percent: 11 },
        { lang: 'Python (.py)', loC: Math.round(reportingLoC * 0.15), percent: 10 },
        { lang: 'TypeScript (.ts)', loC: Math.round(totalLoC * 0.10), percent: 9 },
        { lang: 'Java (.java)', loC: Math.round(reportingLoC * 0.10), percent: 8 }
      ]
    },
    recommendations: [
      ...(reporting.coveragePercentage < 75 ? [{
        priority: 'high',
        message: `Increase Reporting coverage to 75% (currently ${reporting.coveragePercentage}%)`,
        estimatedLoC: `need ~${Math.round((75 - reporting.coveragePercentage) * reporting.baseline / 100).toLocaleString()} additional tests`
      }] : []),
      ...(overallCoveragePercent < 80 ? [{
        priority: 'medium',
        message: `Target 80% overall coverage (currently ${overallCoveragePercent}%)`,
        estimatedLoC: `need ~${Math.round((80 - totalCoveragePercent) * EXPECTED_BASELINE / 100).toLocaleString()} additional tests`
      }] : []),
      {
        priority: 'low',
        message: `Portal (${portal.coveragePercentage}%), Proxy (${proxy.coveragePercentage}%), and Reporting (${reporting.coveragePercentage}%) coverage - monitor quarterly`,
        estimatedLoC: 'continue current testing strategy'
      }
    ]
  };
}
