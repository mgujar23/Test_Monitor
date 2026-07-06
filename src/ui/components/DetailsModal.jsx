import { useState } from 'react';
import { getStatusBgColor, getStatusColor } from '../utils/formatting';
import { generateTestFixDiff } from '../utils/generateTestFix';

export default function DetailsModal({ testDetails, onClose }) {
  const [showDiff, setShowDiff] = useState(false);

  if (!testDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-card border border-dark-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-card">
          <h2 className="text-2xl font-bold text-white">{testDetails.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Status</h3>
            <div className={`inline-block px-3 py-1 rounded ${getStatusBgColor(testDetails.status)}`}>
              <span className={`font-semibold ${getStatusColor(testDetails.status)}`}>
                {testDetails.status}
              </span>
            </div>
          </div>

          {/* Test Info */}
          {testDetails.className && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Test Class</h3>
              <p className="text-white font-mono text-sm bg-dark-bg p-2 rounded border border-dark-border">
                {testDetails.className}
              </p>
            </div>
          )}

          {/* Duration */}
          {testDetails.duration && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Duration</h3>
              <p className="text-white">{(testDetails.duration || 0).toFixed(2)}s</p>
            </div>
          )}

          {/* Recent Changes */}
          {testDetails.recentChanges && testDetails.recentChanges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Changes</h3>
              <div className="bg-dark-bg rounded border border-dark-border p-3 space-y-2">
                {testDetails.recentChanges.map((change, idx) => (
                  <div key={idx} className="text-sm text-gray-300 font-mono">
                    <span className="text-gray-500">{change.hash}</span> {change.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Fix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">Suggested Fix</h3>
              <button
                onClick={() => setShowDiff(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold transition-colors"
              >
                View Diff
              </button>
            </div>
            {testDetails.suggestedFix ? (
              <div className="bg-green-900/20 border border-green-700/50 rounded p-4 text-green-100">
                {testDetails.suggestedFix.suggested_fix || testDetails.suggestedFix}
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 text-yellow-100">
                Click "View Diff" to see suggested code changes for fixing this test
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-right pt-4 border-t border-dark-border">
            Last updated: {new Date(testDetails.lastUpdated).toLocaleString()}
          </div>
        </div>

        {/* Diff Modal */}
        {showDiff && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
            <div className="bg-dark-card border border-dark-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-card sticky top-0">
                <div>
                  <h3 className="text-lg font-bold text-white">Suggested Code Changes</h3>
                  <p className="text-xs text-gray-500 mt-1">Diff for {testDetails.name}</p>
                </div>
                <button
                  onClick={() => setShowDiff(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Diff Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-dark-bg">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words bg-dark-card border border-dark-border rounded p-4">
{generateTestFixDiff(testDetails)}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 p-6 border-t border-dark-border bg-dark-card">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateTestFixDiff(testDetails));
                    alert('Diff copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm transition-colors"
                >
                  Copy Diff
                </button>
                <button
                  onClick={() => {
                    const element = document.createElement('a');
                    const diff = generateTestFixDiff(testDetails);
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(diff));
                    element.setAttribute('download', `fix-${testDetails.name}.patch`);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition-colors"
                >
                  Download Patch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
