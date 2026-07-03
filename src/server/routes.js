import express from 'express';

export default function routes(config) {
  const router = express.Router();

  // Dashboard endpoint - returns full cached data
  router.get('/dashboard', (req, res) => {
    res.json({
      message: 'Dashboard endpoint - will implement in Task 11'
    });
  });

  // Failed tests for a section
  router.get('/failed-tests/:section', (req, res) => {
    res.json({
      message: 'Failed tests endpoint - will implement in Task 12'
    });
  });

  // Test details
  router.get('/test-details/:testId', (req, res) => {
    res.json({
      message: 'Test details endpoint - will implement in Task 13'
    });
  });

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      message: 'Health endpoint - will implement in Task 14'
    });
  });

  // Manual refresh trigger
  router.post('/refresh', (req, res) => {
    res.json({
      message: 'Manual refresh - will implement in Task 15'
    });
  });

  return router;
}
