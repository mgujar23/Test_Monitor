import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Section from '../components/Section';
import DetailsModal from '../components/DetailsModal';
import { fetchDashboard, triggerManualRefresh, fetchTestDetails } from '../utils/api';

const SECTION_TITLES = {
  readyCluster: 'Ready Cluster Status',
  selenium: 'Selenium Tests',
  integrationTests: 'Integration Tests',
  smokeTests: 'Smoke Tests',
  newTestsAdded: 'New Tests Added (Yearly)'
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    loadDashboard();
    // Refresh every 30 seconds to check for updates
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      await triggerManualRefresh();
      await loadDashboard();
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setError('Refresh failed: ' + err.message);
    }
  }

  async function handleClickMetric(sectionKey, areaName, metric) {
    if (metric !== 'failed' && metric !== 'stale') {
      return; // Only show details for failed and stale
    }

    try {
      const testId = `${sectionKey}::${areaName}::${areaName}`;
      const details = await fetchTestDetails(testId);
      setSelectedTest(details);
    } catch (err) {
      console.error('Failed to load test details:', err);
      setError('Failed to load test details');
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <Header
        lastUpdateTime={dashboardData?.timestamp}
        onRefresh={handleRefresh}
        isLoading={loading}
      />

      {error && (
        <div className="bg-red-900/20 border-b border-red-700/50 text-red-200 px-6 py-3">
          ⚠️ {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-4">
          {dashboardData && Object.entries(SECTION_TITLES).map(([key, title]) => (
            <Section
              key={key}
              sectionKey={key}
              title={title}
              data={dashboardData.sections[key]}
              onClickMetric={handleClickMetric}
            />
          ))}
        </div>
      </main>

      {selectedTest && (
        <DetailsModal
          testDetails={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </div>
  );
}
