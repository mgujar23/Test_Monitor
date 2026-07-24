// Auto-detect API base path based on environment
const API_BASE = window.location.hostname === 'localhost' ? '/api' : '/test-monitor/api';

export async function fetchDashboard() {
  const response = await fetch(`${API_BASE}/dashboard`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFailedTests(section) {
  const response = await fetch(`${API_BASE}/failed-tests/${section}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch failed tests: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTestDetails(testId) {
  const response = await fetch(`${API_BASE}/test-details/${testId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch test details: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerManualRefresh() {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger refresh: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch health: ${response.statusText}`);
  }
  return response.json();
}
