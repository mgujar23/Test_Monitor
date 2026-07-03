export function formatTimestamp(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function formatDuration(ms) {
  if (!ms) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getStatusColor(status) {
  if (!status) return 'text-gray-400';
  if (status.includes('FAILED') || status.includes('failed')) return 'text-failed';
  if (status.includes('SKIP')) return 'text-stale';
  return 'text-passed';
}

export function getStatusBgColor(status) {
  if (!status) return 'bg-gray-800';
  if (status.includes('FAILED') || status.includes('failed')) return 'bg-red-900/20';
  if (status.includes('SKIP')) return 'bg-yellow-900/20';
  return 'bg-green-900/20';
}
