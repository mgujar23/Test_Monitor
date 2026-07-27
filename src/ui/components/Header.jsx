import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/formatting';

export default function Header({ lastUpdateTime, onRefresh, isLoading, sectionGroupStats }) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <header className="bg-dark-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Cloud Web Test Monitor Dashboard</h1>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                ⏱️ Last updated: {formatTimestamp(lastUpdateTime)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/coverage')}
                className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                📊 Coverage Metrics
              </button>
              <button
                onClick={() => navigate('/insights')}
                className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                🤖 AI Insights
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading || isRefreshing
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                {isRefreshing ? '⟳ Refreshing...' : '🔄 Refresh Now'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Test Statistics by Section Group */}
      {sectionGroupStats && (
        <div className="bg-dark-bg border-b border-gray-700/50 py-6 pl-0 pr-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider pl-8">📊 Test Summary</h3>
            <div className="grid grid-cols-4 gap-4 mb-6 pl-8 pr-0">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all shadow-md hover:shadow-lg">
                <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">Portal</div>
                <div className="text-xl font-bold text-blue-400">{(sectionGroupStats.portal || 0).toLocaleString()}</div>
                <div className="text-slate-500 text-xs mt-2 font-medium">tests</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-green-500/50 transition-all shadow-md hover:shadow-lg">
                <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">Proxy</div>
                <div className="text-xl font-bold text-green-400">{(sectionGroupStats.proxy || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-2 font-medium">tests</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-orange-500/50 transition-all shadow-md hover:shadow-lg">
                <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">Reporting</div>
                <div className="text-xl font-bold text-orange-400">{(sectionGroupStats.reporting || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-2 font-medium">tests</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all shadow-md hover:shadow-lg">
                <div className="text-blue-300 text-xs font-semibold mb-2 uppercase tracking-wide">Total</div>
                <div className="text-xl font-bold text-blue-400">{(sectionGroupStats.total || 0).toLocaleString()}</div>
                <div className="text-blue-400 text-xs mt-2 font-medium">tests</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Metric Explanation Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedMetric(null)}>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedMetric === 'codeCoverage' && 'Code Coverage'}
                {selectedMetric === 'testCoverage' && 'Test Coverage'}
                {selectedMetric === 'passingPercentage' && 'Passing Percentage'}
              </h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold mb-2">
                  {selectedMetric === 'codeCoverage' && <span className="text-blue-400">{sectionGroupStats.codeCoverage}%</span>}
                  {selectedMetric === 'testCoverage' && <span className="text-green-400">{sectionGroupStats.testCoverage}%</span>}
                  {selectedMetric === 'passingPercentage' && <span className="text-green-400">{sectionGroupStats.passingPercentage}%</span>}
                </div>
              </div>

              <div className="bg-dark-bg rounded p-3 border border-dark-border/50">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedMetric === 'codeCoverage' && (
                    <>
                      <strong>How it's calculated:</strong><br/>
                      Tests: {sectionGroupStats.total?.toLocaleString()} ÷ Expected baseline: 500,000 = {sectionGroupStats.codeCoverage}%<br/><br/>
                      Measures the extent of test coverage relative to a full production baseline.
                    </>
                  )}
                  {selectedMetric === 'testCoverage' && (
                    <>
                      <strong>How it's calculated:</strong><br/>
                      Tests with results: {sectionGroupStats.total?.toLocaleString()} ÷ Total expected tests = {sectionGroupStats.testCoverage}%<br/><br/>
                      Indicates what percentage of all test executions have recorded results available.
                    </>
                  )}
                  {selectedMetric === 'passingPercentage' && (
                    <>
                      <strong>How it's calculated:</strong><br/>
                      Passed tests: {(sectionGroupStats.total - sectionGroupStats.totalFailed)?.toLocaleString()} ÷ Total tests: {sectionGroupStats.total?.toLocaleString()} = {sectionGroupStats.passingPercentage}%<br/><br/>
                      Shows the percentage of all tests that are passing across Portal ({sectionGroupStats.passingPercentage}%), Proxy, and Reporting sections.
                    </>
                  )}
                </p>
              </div>

              <div className="border-t border-dark-border pt-3">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Breakdown by Section:</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Portal: {sectionGroupStats.portal?.toLocaleString()} tests</span>
                    <span className="text-blue-400">{sectionGroupStats.portal > 0 ? Math.round(((sectionGroupStats.portal - sectionGroupStats.portalFailed) / sectionGroupStats.portal) * 100) : 0}% passing</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proxy: {sectionGroupStats.proxy?.toLocaleString()} tests</span>
                    <span className="text-green-400">{sectionGroupStats.proxy > 0 ? Math.round(((sectionGroupStats.proxy - sectionGroupStats.proxyFailed) / sectionGroupStats.proxy) * 100) : 0}% passing</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reporting: {sectionGroupStats.reporting?.toLocaleString()} tests</span>
                    <span className="text-orange-400">{sectionGroupStats.reporting > 0 ? Math.round(((sectionGroupStats.reporting - sectionGroupStats.reportingFailed) / sectionGroupStats.reporting) * 100) : 0}% passing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
