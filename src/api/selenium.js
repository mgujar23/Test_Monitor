const axios = require('axios');
const cheerio = require('cheerio');

class SeleniumClient {
  constructor(baseUrl, timeout = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async fetchTestResults() {
    try {
      // Attempt JSON API first
      return await this.fetchFromJsonApi();
    } catch (error) {
      try {
        // Fall back to HTML parsing
        return await this.fetchFromHtmlPortal();
      } catch (htmlError) {
        console.error('Both JSON API and HTML parsing failed:', htmlError);
        return this.getDefaultResponse();
      }
    }
  }

  async fetchFromJsonApi() {
    const response = await axios.get(`${this.baseUrl}/api/results`, {
      timeout: this.timeout,
    });
    return this.parseApiResponse(response.data);
  }

  async fetchFromHtmlPortal() {
    const response = await axios.get(this.baseUrl, {
      timeout: this.timeout,
    });
    return this.parseHtmlResponse(response.data);
  }

  parseApiResponse(data) {
    const areas = (data.areas || []).map(area => ({
      name: area.name || 'Unknown',
      total: area.total || 0,
      failed: area.failed || 0,
      stale: area.stale || 0,
      tests: area.tests || [],
    }));

    return {
      total: data.total || 0,
      failed: data.failed || 0,
      stale: data.stale || 0,
      areas,
    };
  }

  parseHtmlResponse(html) {
    const $ = cheerio.load(html);
    const areas = [];

    $('[data-area]').each((i, elem) => {
      const $elem = $(elem);
      areas.push({
        name: $elem.data('area') || 'Unknown',
        total: parseInt($elem.data('total') || 0),
        failed: parseInt($elem.data('failed') || 0),
        stale: parseInt($elem.data('stale') || 0),
        tests: [],
      });
    });

    return {
      total: parseInt($('[data-total]').data('total') || 0),
      failed: parseInt($('[data-failed]').data('failed') || 0),
      stale: parseInt($('[data-stale]').data('stale') || 0),
      areas,
    };
  }

  getDefaultResponse() {
    return {
      total: 0,
      failed: 0,
      stale: 0,
      areas: [],
    };
  }
}

module.exports = SeleniumClient;
