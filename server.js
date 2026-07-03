import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './src/server/routes.js';
import { errorHandler, logRequest } from './src/server/middleware.js';
import { initBackgroundJob } from './src/server/jobs.js';
import { initializeCache } from './src/server/cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load configuration
let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (error) {
  console.error('Fatal: config.json not found or invalid JSON. Please create config.json based on .env.example');
  process.exit(1);
}

const app = express();
const PORT = config.app.port || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(logRequest);

// Initialize cache
initializeCache();

// Routes
app.use('/api', routes(config));

// Serve static React files (in production)
app.use(express.static(path.join(__dirname, 'dist')));

// Error handling
app.use(errorHandler);

// Initialize background refresh job
initBackgroundJob(config);

// Start server
app.listen(PORT, () => {
  console.log(`Test Monitor dashboard listening on http://localhost:${PORT}`);
  console.log(`Next refresh in ${config.app.refreshIntervalMinutes} minutes`);
});
