import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../utils/api';

export default function AIInsightsPage() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMetric, setExpandedMetric] = useState(null);

  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadInsights() {
    try {
      const data = await fetchDashboard();
      setInsights(data.aiInsights);
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setLoading(false);
    }
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-passed';
    if (score >= 60) return 'text-yellow-400';
    return 'text-failed';
  };

  const getHealthScoreDetails = () => {
    if (!dashboardData) return null;
    const sections = dashboardData.sections;
    const details = [];

    Object.entries(sections).forEach(([key, data]) => {
      if (data.total > 0) {
        const failureRate = ((data.failed || 0) / data.total) * 100;
        let deduction = 0;
        let reason = '';

        if (failureRate > 10) {
          deduction = 20;
          reason = 'Critical: >10% failures';
        } else if (failureRate > 5) {
          deduction = 10;
          reason = 'Warning: 5-10% failures';
        } else if (failureRate > 1) {
          deduction = 5;
          reason = 'Minor: 1-5% failures';
        }

        details.push({
          section: key.replace(/([A-Z])/g, ' $1').toUpperCase().trim(),
          total: data.total,
          failed: data.failed || 0,
          failureRate: failureRate.toFixed(2),
          deduction,
          reason
        });
      }
    });

    return details;
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'text-red-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-passed';
      default: return 'text-gray-400';
    }
  };

  const getRiskBgColor = (level) => {
    switch (level) {
      case 'HIGH': return 'bg-red-900/20 border-red-900/50';
      case 'MEDIUM': return 'bg-yellow-900/20 border-yellow-900/50';
      case 'LOW': return 'bg-green-900/20 border-green-900/50';
      default: return 'bg-gray-900/20 border-gray-900/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-xl font-semibold">AI Test Monitoring Agent</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {insights && (
          <div className="space-y-6">
            {/* Agent Header */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center justify-between">
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
            </div>

            {/* PRIMARY METRICS */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">📊 Primary Metrics</h2>
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => setExpandedMetric(expandedMetric === 'health' ? null : 'health')}
                  className="bg-dark-bg rounded p-3 border border-dark-border hover:border-gray-500 transition-colors text-left cursor-pointer"
                >
                  <div className="text-xs text-gray-400 mb-1">Health Score</div>
                  <div className={`text-3xl font-bold ${getHealthColor(insights.healthScore)}`}>
                    {insights.healthScore}
                  </div>
                  <div className="text-xs text-gray-500">/100</div>
                </button>

                <div className="bg-dark-bg rounded p-3 border border-dark-border">
                  <div className="text-xs text-gray-400 mb-1">Pass Rate</div>
                  <div className="text-3xl font-bold text-passed">
                    {insights.passRate}%
                  </div>
                  <div className="text-xs text-gray-500">overall</div>
                </div>

                <button
                  onClick={() => setExpandedMetric(expandedMetric === 'alerts' ? null : 'alerts')}
                  className="bg-dark-bg rounded p-3 border border-dark-border hover:border-gray-500 transition-colors text-left cursor-pointer"
                >
                  <div className="text-xs text-gray-400 mb-1">Critical Alerts</div>
                  <div className="text-3xl font-bold text-failed">
                    {insights.alerts.filter(a => a.type === 'CRITICAL').length}
                  </div>
                  <div className="text-xs text-gray-500">need action</div>
                </button>

                <button
                  onClick={() => setExpandedMetric(expandedMetric === 'flaky' ? null : 'flaky')}
                  className="bg-dark-bg rounded p-3 border border-dark-border hover:border-gray-500 transition-colors text-left cursor-pointer"
                >
                  <div className="text-xs text-gray-400 mb-1">Flaky Tests</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {insights.flakyTests.length}
                  </div>
                  <div className="text-xs text-gray-500">detected</div>
                </button>
              </div>

              {/* Expandable Metric Details */}
              {expandedMetric === 'health' && (
                <div className="mt-4 bg-dark-bg rounded border border-dark-border p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">💡 Health Score Calculation</h3>
                  <div className="space-y-3 text-xs">
                    <div className="bg-dark-card rounded p-3 border border-dark-border">
                      <div className="text-gray-400 mb-2">Starting Score: <span className="text-white font-bold">100</span></div>
                      <div className="space-y-2">
                        {getHealthScoreDetails()?.map((detail, idx) => (
                          <div key={idx} className="border-t border-dark-border pt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-300">{detail.section}</span>
                              <span className="text-gray-400">{detail.failed}/{detail.total} failed</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500">
                              <span>{detail.failureRate}% failure rate</span>
                              <span className={detail.deduction > 0 ? 'text-red-400' : 'text-passed'}>
                                {detail.deduction > 0 ? `-${detail.deduction}` : 'No deduction'}
                              </span>
                            </div>
                            {detail.reason && <div className="text-gray-600 mt-1">{detail.reason}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <span className="text-white font-bold">Final Score: {insights.healthScore}/100</span>
                    </div>
                  </div>
                </div>
              )}

              {expandedMetric === 'alerts' && (
                <div className="mt-4 bg-dark-bg rounded border border-dark-border p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">🔴 Critical Alerts Details</h3>
                  <div className="space-y-2 text-xs">
                    {insights.alerts.filter(a => a.type === 'CRITICAL').length > 0 ? (
                      insights.alerts.filter(a => a.type === 'CRITICAL').map((alert, idx) => (
                        <div key={idx} className="bg-dark-card rounded p-3 border border-red-900/30">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-white font-semibold">{alert.title}</span>
                            <span className="text-red-400">C{Math.round(alert.confidence)}%</span>
                          </div>
                          <div className="text-gray-400 mb-2">{alert.message}</div>
                          <div className="text-gray-500">💡 {alert.suggestion}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No critical alerts detected</div>
                    )}
                  </div>
                </div>
              )}

              {expandedMetric === 'flaky' && (
                <div className="mt-4 bg-dark-bg rounded border border-dark-border p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">⚠️ Flaky Tests Details</h3>
                  <div className="space-y-2 text-xs">
                    {insights.flakyTests.length > 0 ? (
                      insights.flakyTests.map((test, idx) => (
                        <div key={idx} className="bg-dark-card rounded p-3 border border-yellow-900/30">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-white font-semibold">{test.name}</div>
                              <div className="text-gray-500">{test.area}</div>
                            </div>
                            <span className="text-yellow-400">~{Math.round(test.failureRate)}%</span>
                          </div>
                          <div className="text-gray-500 mt-2">
                            Failing: {test.recommendation}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No flaky tests detected</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 1. TOP FAILING AREAS */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">🎯 Top Failing Areas</h2>
              <div className="space-y-2">
                {insights.topFailingAreas?.length > 0 ? (
                  insights.topFailingAreas.map((area, idx) => (
                    <div key={idx} className="bg-dark-bg rounded border border-dark-border p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">{idx + 1}. {area.name}</div>
                        <div className="text-xs text-gray-500">{area.section}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-failed">{area.failures} failures</div>
                        <div className="text-xs text-gray-500">{area.failureRate}% of {area.total}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No failing areas detected</div>
                )}
              </div>
            </div>

            {/* 2. TEST QUALITY SCORECARD */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">⭐ Test Quality Scorecard</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-bg rounded border border-dark-border p-4 text-center">
                  <div className="text-4xl font-bold text-passed mb-2">{insights.testQualityScore?.overall}</div>
                  <div className="text-xs text-gray-400">Overall Score</div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Code Coverage', value: insights.testQualityScore?.coverage },
                    { label: 'Stability', value: insights.testQualityScore?.stability },
                    { label: 'Performance', value: insights.testQualityScore?.performance }
                  ].map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-400">{metric.label}</span>
                        <span className="text-white font-semibold">{metric.value}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-passed"
                          style={{ width: `${metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. RISK ASSESSMENT */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">⚠️ Risk Assessment Matrix</h2>
              <div className="space-y-2">
                {insights.riskAssessment?.map((item, idx) => (
                  <div key={idx} className={`rounded border p-3 ${getRiskBgColor(item.level)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-300">{item.section}</div>
                        <div className="text-xs text-gray-500">{item.failures} failures detected</div>
                      </div>
                      <div className={`text-lg font-bold ${getRiskColor(item.level)}`}>{item.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. ESTIMATED FIX TIME */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">⏱️ Estimated Fix Time</h2>
              <div className="bg-dark-bg rounded border border-dark-border p-4 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">{insights.estimatedFixTime}</div>
                <div className="text-sm text-gray-400">hours to fix all failures</div>
                <div className="text-xs text-gray-500 mt-3">(estimated 15 min per failed test)</div>
              </div>
            </div>

            {/* 5. PERFORMANCE METRICS */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">⚡ Performance Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                {insights.performanceMetrics?.map((metric, idx) => (
                  <div key={idx} className="bg-dark-bg rounded border border-dark-border p-3">
                    <div className="text-sm font-semibold text-gray-300 mb-2">{metric.section}</div>
                    <div className="text-2xl font-bold text-blue-400 mb-1">{metric.avgTime}s</div>
                    <div className="text-xs text-gray-500">avg execution time</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. IMPROVEMENT MILESTONES */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">🏆 Improvement Milestones</h2>
              <div className="bg-dark-bg rounded border border-dark-border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Current Pass Rate</div>
                    <div className="text-3xl font-bold text-passed">{insights.improvementMilestones?.current}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Target</div>
                    <div className="text-3xl font-bold text-blue-400">{insights.improvementMilestones?.target}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded h-3 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-passed to-blue-400"
                    style={{ width: `${insights.improvementMilestones?.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {insights.improvementMilestones?.progress}% progress • {insights.improvementMilestones?.remaining}% remaining to target
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">💡 AI Recommendations</h2>
              <div className="space-y-3">
                {insights.recommendations?.map((rec, idx) => (
                  <div key={idx} className="bg-dark-bg rounded border border-dark-border p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
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
          </div>
        )}
      </main>
    </div>
  );
}
