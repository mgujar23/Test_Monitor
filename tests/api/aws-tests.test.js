import { jest } from '@jest/globals';

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { get: mockGet }
}));

const { fetchAWSSystemTest, fetchAWSControlTest } = await import('../../src/api/aws-tests.js');

const config = {
  reportingJenkins: {
    baseUrl: 'https://jenkins.cicd.cloud.fpdev.io',
    username: 'testuser',
    apiToken: 'test-token'
  }
};

const mockJobInfo = {
  lastSuccessfulBuild: { number: 42, url: 'https://jenkins.cicd.cloud.fpdev.io/job/x/42/' }
};

const mockTestReport = {
  passCount: 18,
  failCount: 2,
  skipCount: 0,
  duration: 123.45,
  suites: [
    {
      name: 'com.example.web.LoginTest',
      cases: [
        { name: 'testLoginSuccess', status: 'PASSED' },
        { name: 'testLoginFailure', status: 'FAILED', errorDetails: 'assertion failed' }
      ]
    }
  ]
};

describe('fetchAWSSystemTest', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  test('returns real total/failed/areas from a successful build', async () => {
    mockGet
      .mockResolvedValueOnce({ data: mockJobInfo })
      .mockResolvedValueOnce({ data: mockTestReport });

    const result = await fetchAWSSystemTest(config);

    expect(result.name).toBe('AWS System Test');
    expect(result.buildNumber).toBe(42);
    expect(result.total).toBe(20);
    expect(result.failed).toBe(2);
    expect(result.stale).toBe(0);
    expect(result.hasTestData).toBe(true);
    expect(result.areas).toHaveLength(1);
    expect(result.areas[0].name).toBe('Login');
    expect(result.areas[0].total).toBe(2);
    expect(result.areas[0].failed).toBe(1);
    expect(result.areas[0].tests).toHaveLength(2);

    // Verify it hit the correct job path and host
    expect(mockGet).toHaveBeenCalledWith(
      'https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-system-test/job/master/api/json',
      expect.objectContaining({ auth: { username: 'testuser', password: 'test-token' } })
    );
  });

  test('returns hasTestData false with a statusMessage when there is no successful build', async () => {
    mockGet.mockResolvedValueOnce({
      data: { builds: [{ number: 10 }, { number: 9 }], firstBuild: { number: 5 }, lastBuild: { number: 10 } }
    });

    const result = await fetchAWSSystemTest(config);

    expect(result.hasTestData).toBe(false);
    expect(result.total).toBe(0);
    expect(result.failed).toBe(0);
    expect(typeof result.statusMessage).toBe('string');
    expect(result.statusMessage).toMatch(/failed/i);
  });

  test('falls back to default stats on a network error', async () => {
    mockGet.mockRejectedValueOnce(new Error('connect ETIMEDOUT'));

    const result = await fetchAWSSystemTest(config);

    expect(result.total).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.areas).toEqual([]);
    expect(result.buildNumber).toBeTruthy();
  });
});

describe('fetchAWSControlTest', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  test('returns real total/failed/areas from a successful build', async () => {
    mockGet
      .mockResolvedValueOnce({ data: mockJobInfo })
      .mockResolvedValueOnce({ data: mockTestReport });

    const result = await fetchAWSControlTest(config);

    expect(result.name).toBe('AWS Control Test');
    expect(result.total).toBe(20);
    expect(result.failed).toBe(2);

    expect(mockGet).toHaveBeenCalledWith(
      'https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-control/job/master/api/json',
      expect.objectContaining({ auth: { username: 'testuser', password: 'test-token' } })
    );
  });
});
