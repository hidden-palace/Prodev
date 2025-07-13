/**
 * Enhanced Error Middleware for Express Server
 */

const config = require('../config');
// If you're using categorizeError, make sure it's imported correctly like below:
// const { categorizeError } = require('../utils/categorize-error'); // Uncomment if used

/**
 * Global error handler: logs error and sends JSON response
 */
function enhancedErrorHandler(err, req, res, next) {
  console.error('=== API ERROR ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  const responseBody = {
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(responseBody);
}

/**
 * Request logger middleware: logs incoming requests and response status
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  console.log(`Incoming: ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    console.log(`Completed ${res.statusCode} in ${Date.now() - start}ms`);
  });
  next();
}

module.exports = {
  enhancedErrorHandler,
  requestLogger
};
