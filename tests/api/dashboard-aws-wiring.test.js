import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const mockFetchAWSSystemTest = jest.fn();
const mockFetchAWSControlTest = jest.fn();

// Resolve the mocked module to an absolute path. A plain relative specifier
// here gets resolved by Jest against tests/setup.js (the setupFilesAfterEnv
// entry) rather than this file, due to how Jest tracks the "currently
// executing module" for ESM test files run under --experimental-vm-modules,
// which breaks the relative lookup. Using an absolute path sidesteps that.
const awsTestsModulePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/api/aws-tests.js');

jest.unstable_mockModule(awsTestsModulePath, () => ({
  fetchAWSSystemTest: mockFetchAWSSystemTest,
  fetchAWSControlTest: mockFetchAWSControlTest
}));

const { aggregateDashboardData } = await import('../../src/api/dashboard.js');

describe('aggregateDashboardData AWS section wiring', () => {
  test('wires fetchAWSSystemTest and fetchAWSControlTest results into the correct section keys', async () => {
    mockFetchAWSSystemTest.mockResolvedValue({ name: 'AWS System Test', total: 10, failed: 1, stale: 0, areas: [], buildNumber: 5, hasTestData: true });
    mockFetchAWSControlTest.mockResolvedValue({ name: 'AWS Control Test', total: 20, failed: 2, stale: 0, areas: [], buildNumber: 7, hasTestData: true });

    const config = {
      selenium: { portalUrl: 'https://example.invalid' },
      jenkins: { baseUrl: 'https://example.invalid', apiToken: 'x', jobs: {} },
      reportingJenkins: { baseUrl: 'https://example.invalid', username: 'x', apiToken: 'x' },
      perforce: {}
    };

    const result = await aggregateDashboardData(config);

    expect(result.sections.awsSystemTest.total).toBe(10);
    expect(result.sections.awsSystemTest.buildNumber).toBe(5);
    expect(result.sections.awsControl.total).toBe(20);
    expect(result.sections.awsControl.buildNumber).toBe(7);
  }, 15000);
});
