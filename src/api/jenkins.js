import axios from 'axios';

const API_TIMEOUT = 10000;
const RETRY_ATTEMPTS = 1;

export class JenkinsClient {
  constructor(baseUrl, apiToken) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
    this.client = axios.create({
      timeout: API_TIMEOUT,
      auth: {
        username: 'api',
        password: apiToken
      }
    });
  }

  async fetchJobTests(jobPath) {
    try {
      // Fetch job JSON data
      const jobUrl = `${this.baseUrl}${jobPath}api/json`;
      const response = await this.client.get(jobUrl);
      const jobData = response.data;

      // Extract last build number
      const lastBuildNumber = jobData.lastBuild?.number;
      if (!lastBuildNumber) {
        console.warn(`No builds found for job ${jobPath}`);
        return this.createEmptyTestData();
      }

      // Fetch test results from last build
      const buildUrl = `${this.baseUrl}${jobPath}${lastBuildNumber}/testReport/api/json`;
      const testResponse = await this.client.get(buildUrl);
      const testData = testResponse.data;

      return this.parseTestData(testData);
    } catch (error) {
      console.error(`Jenkins API error for ${jobPath}:`, error.message);
      throw error;
    }
  }

  parseTestData(testData) {
    const suites = testData.suites || [];
    const areas = {};

    // Group tests by suite (area)
    for (const suite of suites) {
      const suiteName = suite.name || 'Unknown';
      if (!areas[suiteName]) {
        areas[suiteName] = {
          name: suiteName,
          total: 0,
          failed: 0,
          stale: 0,
          tests: []
        };
      }

      const cases = suite.cases || [];
      for (const testCase of cases) {
        areas[suiteName].total += 1;

        if (testCase.status === 'FAILED' || testCase.status === 'failed') {
          areas[suiteName].failed += 1;
        }

        if (testCase.status === 'SKIPPED' || testCase.status === 'skipped') {
          areas[suiteName].stale += 1;
        }

        areas[suiteName].tests.push({
          name: testCase.name,
          status: testCase.status,
          duration: testCase.duration,
          className: testCase.className
        });
      }
    }

    const areasArray = Object.values(areas);
    const total = areasArray.reduce((sum, a) => sum + a.total, 0);
    const failed = areasArray.reduce((sum, a) => sum + a.failed, 0);
    const stale = areasArray.reduce((sum, a) => sum + a.stale, 0);

    return { total, failed, stale, areas: areasArray };
  }

  createEmptyTestData() {
    return { total: 0, failed: 0, stale: 0, areas: [] };
  }
}

export async function fetchReadyClusterTests(config) {
  const client = new JenkinsClient(config.jenkins.baseUrl, config.jenkins.apiToken);
  return client.fetchJobTests(config.jenkins.jobs.readyCluster);
}

export async function fetchIntegrationTests(config) {
  const client = new JenkinsClient(config.jenkins.baseUrl, config.jenkins.apiToken);
  return client.fetchJobTests(config.jenkins.jobs.integrationTests);
}

export async function fetchSmokeTests(config) {
  const client = new JenkinsClient(config.jenkins.baseUrl, config.jenkins.apiToken);
  return client.fetchJobTests(config.jenkins.jobs.smokeTests);
}
