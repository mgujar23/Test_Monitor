import { log, warn, error } from './logger.js';
export function logRequest(req, res, next) {
  log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

export function errorHandler(err, req, res, next) {
  error(`Error: ${err.message}`);
  error(err.stack);

  res.status(err.status || 500).json({
    error: err.message,
    timestamp: new Date().toISOString(),
  });
}
