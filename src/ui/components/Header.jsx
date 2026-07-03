import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/formatting';

export default function Header({ lastUpdateTime, onRefresh, isLoading }) {
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
  );
}
