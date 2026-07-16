import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/formatting';

export default function Header({ lastUpdateTime, onRefresh, isLoading, sectionGroupStats }) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      <header className="bg-dark-card border-b border-dark-border p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">Cloud Web - Test Monitor</h1>
            <p className="text-sm text-gray-400">
              Last updated: {formatTimestamp(lastUpdateTime)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/insights')}
              className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
            >
              🤖 AI Insights
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isLoading || isRefreshing
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </header>

      {/* Test Statistics by Section Group */}
      {sectionGroupStats && (
        <div className="bg-dark-bg border-b border-dark-border/50 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Test Summary by Section</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-dark-card border border-dark-border rounded p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">Portal</div>
                <div className="text-2xl font-bold text-blue-400">{(sectionGroupStats.portal || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">Proxy</div>
                <div className="text-2xl font-bold text-green-400">{(sectionGroupStats.proxy || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">Reporting</div>
                <div className="text-2xl font-bold text-orange-400">{(sectionGroupStats.reporting || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded p-3 bg-blue-900/20">
                <div className="text-gray-400 text-xs font-medium mb-1">Total</div>
                <div className="text-2xl font-bold text-white">{(sectionGroupStats.total || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
