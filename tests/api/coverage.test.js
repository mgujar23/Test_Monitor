import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { getCoverageMetrics } from '../../src/api/coverage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('getCoverageMetrics', () => {
  const testData = { portal: 325000, reporting: 1089, proxy: 10553, total: 336642 };

  test('area totals match the transcribed loc-report.json values', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    expect(metrics.byArea.portal.totalLoC).toBe(3657741);
    expect(metrics.byArea.aws.totalLoC).toBe(57466);
    expect(metrics.byArea.reporting.totalLoC).toBe(1184492);
    expect(metrics.byArea.proxy.totalLoC).toBe(316684);
    expect(metrics.summary.totalLoC).toBe(5216383);
  });

  test('per-area coverage percentage is measured against each area\'s own SLOC-proportional baseline, not the flat 500K total', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    // portal baseline = 500000 * (3657741/5216383) ≈ 350601; round(325000/350601*100) = 93
    expect(metrics.byArea.portal.coveragePercentage).toBe(93);
    expect(metrics.byArea.portal.expectedBaseline).toBe(350601);
    // reporting baseline = 500000 * (1184492/5216383) ≈ 113536; round(1089/113536*100) = 1
    expect(metrics.byArea.reporting.coveragePercentage).toBe(1);
    expect(metrics.byArea.reporting.expectedBaseline).toBe(113536);
    // proxy baseline = 500000 * (316684/5216383) ≈ 30355; round(10553/30355*100) = 35
    expect(metrics.byArea.proxy.coveragePercentage).toBe(35);
    expect(metrics.byArea.proxy.expectedBaseline).toBe(30355);
  });

  test('aws has null coverage percentage and zero covered LoC when no AWS test count is supplied', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    expect(metrics.byArea.aws.coveragePercentage).toBeNull();
    expect(metrics.byArea.aws.coveredLoC).toBe(0);
  });

  test('overall coverage percentage is LoC-weighted across all four areas, using each area\'s SLOC-proportional coverage %', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    // portalCovered = round(3657741 * 0.93) = 3401699
    // reportingCovered = round(1184492 * 0.01) = 11845
    // proxyCovered = round(316684 * 0.35) = 110839
    // awsCovered = 0
    // totalCovered = 3524383; totalLoC = 5216383 -> round(3524383/5216383*100) = 68
    expect(metrics.summary.coveredLoC).toBe(3524383);
    expect(metrics.summary.coveragePercentage).toBe(68);
    expect(metrics.summary.uncoveredLoC).toBe(5216383 - 3524383);
  });

  test('distribution.areaTables exposes the raw per-area rows for table rendering', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    expect(metrics.distribution.areaTables.portal.rows).toHaveLength(31);
    expect(metrics.distribution.areaTables.aws.rows).toHaveLength(4);
    expect(metrics.distribution.areaTables.reporting.rows).toHaveLength(7);
    expect(metrics.distribution.areaTables.proxy.rows).toHaveLength(2);
  });

  test('never performs live measurement — works identically with no config', async () => {
    const metrics = await getCoverageMetrics({}, null);
    expect(metrics.summary.totalLoC).toBe(5216383);
    expect(metrics.byArea.portal.coveragePercentage).toBe(93); // falls back to the 325000 default, same SLOC-proportional baseline as the testData case
  });

  test('grandTotalLoC in loc-report.json matches the sum of the four area totals (catches drift if an area total is edited later)', () => {
    const locReport = JSON.parse(
      readFileSync(path.join(__dirname, '../../src/data/loc-report.json'), 'utf-8')
    );
    const { portal, aws, reporting, proxy } = locReport.areas;
    expect(locReport.grandTotalLoC).toBe(
      portal.totalLoC + aws.totalLoC + reporting.totalLoC + proxy.totalLoC
    );
  });
});
