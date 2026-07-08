import { execSync } from 'child_process';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('[Startup] Checking for processes on port 3000...');
  execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');
  console.log('[Startup] Port 3000 is now available');
} catch (error) {
  console.log('[Startup] No process found on port 3000');
}

console.log('[Startup] Starting server...');
const server = spawn('node', ['--watch', 'server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('[Startup] Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('[Startup] Shutting down gracefully...');
  server.kill();
  process.exit(0);
});
