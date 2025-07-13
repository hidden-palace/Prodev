/**
 * Enhanced Error Middleware for Express Server
 */

const config = require('../config');

/**
 * Global error handler: logs error and sends JSON response
 */
function enhancedExceptionHandler(exception, req, res, next) {
  console.error('=== API EXCEPTION ===');
  console.error('Exception:', exception);
  console.error('Stack:', exception.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);

  if (res.headersSent) {
    return next(exception);
  }

  const statusCode = exception.status || 500;
  const responseBody = {
    message: exception.message || 'Internal server exception',
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
  enhancedExceptionHandler,
  requestLogger
};