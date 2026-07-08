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

try {
  console.log('[Startup] Checking for processes on port 5173...');
  execSync('lsof -ti:5173 | xargs kill -9 2>/dev/null || true');
  console.log('[Startup] Port 5173 is now available');
} catch (error) {
  console.log('[Startup] No process found on port 5173');
}

console.log('[Startup] Starting backend server...');
const server = spawn('node', ['--watch', 'server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

console.log('[Startup] Starting frontend dev server (Vite)...');
const frontend = spawn('npm', ['run', 'dev:ui'], {
  cwd: __dirname,
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('[Startup] Failed to start backend server:', error);
  frontend.kill();
  process.exit(1);
});

frontend.on('error', (error) => {
  console.error('[Startup] Failed to start frontend server:', error);
  server.kill();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('[Startup] Shutting down gracefully...');
  server.kill();
  frontend.kill();
  process.exit(0);
});
