import { getStatusBgColor, getStatusColor } from '../utils/formatting';

export default function DetailsModal({ testDetails, onClose }) {
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
          {testDetails.suggestedFix ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Suggested Fix</h3>
              <div className="bg-green-900/20 border border-green-700/50 rounded p-4 text-green-100">
                {testDetails.suggestedFix.suggested_fix || testDetails.suggestedFix}
              </div>
              {testDetails.suggestedFix.fixed_by && (
                <div className="text-xs text-gray-500 mt-2">
                  Added by {testDetails.suggestedFix.fixed_by} on {testDetails.suggestedFix.added_date}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 text-yellow-100">
              No suggested fix yet. You can add one by editing fixes.json
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-right pt-4 border-t border-dark-border">
            Last updated: {new Date(testDetails.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
