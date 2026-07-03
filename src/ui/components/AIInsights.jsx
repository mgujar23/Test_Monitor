import { useState } from 'react';

export default function AIInsights({ insights }) {
  const [expandedAlert, setExpandedAlert] = useState(null);

  if (!insights) {
    return null;
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '🟡';
      case 'INFO':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-passed';
    if (score >= 60) return 'text-yellow-400';
    return 'text-failed';
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Agent Header */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Test Monitoring Agent</h1>
              <div className="text-xs text-gray-400">Real-time test intelligence & recommendations</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <div className="text-xs text-gray-500">Last update: now</div>
          </div>
        </div>

        {/* Health Score & Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-dark-bg rounded p-3 border border-dark-border">
            <div className="text-xs text-gray-400 mb-1">Health Score</div>
            <div className={`text-3xl font-bold ${getHealthColor(insights.healthScore)}`}>
              {insights.healthScore}
            </div>
            <div className="text-xs text-gray-500">/100</div>
          </div>

          <div className="bg-dark-bg rounded p-3 border border-dark-border">
            <div className="text-xs text-gray-400 mb-1">Pass Rate</div>
            <div className="text-3xl font-bold text-passed">
              {insights.passRate}%
            </div>
            <div className="text-xs text-gray-500">overall</div>
          </div>

          <div className="bg-dark-bg rounded p-3 border border-dark-border">
            <div className="text-xs text-gray-400 mb-1">Critical Alerts</div>
            <div className="text-3xl font-bold text-failed">
              {insights.alerts.filter(a => a.type === 'CRITICAL').length}
            </div>
            <div className="text-xs text-gray-500">need action</div>
          </div>

          <div className="bg-dark-bg rounded p-3 border border-dark-border">
            <div className="text-xs text-gray-400 mb-1">Flaky Tests</div>
            <div className="text-3xl font-bold text-yellow-400">
              {insights.flakyTests.length}
            </div>
            <div className="text-xs text-gray-500">detected</div>
          </div>
        </div>
      </div>

      {/* AI Alerts Section */}
      {insights.alerts && insights.alerts.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>⚡</span> AI Insights & Alerts
          </h2>

          <div className="space-y-2">
            {insights.alerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-dark-bg rounded border border-dark-border p-3 cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => setExpandedAlert(expandedAlert === idx ? null : idx)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{alert.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                        {Math.round(alert.confidence)}% confidence
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{alert.message}</div>

                    {expandedAlert === idx && (
                      <div className="mt-3 pt-3 border-t border-dark-border">
                        <div className="text-xs">
                          <span className="text-gray-500">💡 Suggestion: </span>
                          <span className="text-gray-300">{alert.suggestion}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {expandedAlert === idx ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flaky Tests Section */}
      {insights.flakyTests && insights.flakyTests.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>⚠️</span> Flaky Tests Detected
          </h2>

          <div className="space-y-2">
            {insights.flakyTests.map((test, idx) => (
              <div key={idx} className="bg-dark-bg rounded border border-dark-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">{test.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {test.area} • Failing ~{Math.round(test.failureRate)}% of runs
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{test.recommendation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>💡</span> AI Recommendations
          </h2>

          <div className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-dark-bg rounded border border-dark-border p-3">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{rec.action}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        rec.priority === 'HIGH' ? 'bg-red-900 text-red-200' :
                        rec.priority === 'MEDIUM' ? 'bg-yellow-900 text-yellow-200' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{rec.reason}</div>
                    <div className="text-xs text-gray-500 mt-2">📊 Impact: {rec.impact}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
