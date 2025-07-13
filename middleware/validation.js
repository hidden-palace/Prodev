/**
 * Enhanced Error Middleware for Express Server
 * Provides comprehensive server-side error handling
 */

const config = require('../config');

/**
 * Enhanced error handler with detailed logging and user-friendly responses
 */
const enhancedErrorHandler = (err, req, res, next) => {
  console.error('=== ENHANCED ERROR HANDLER ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Headers:', req.headers);
  console.error('Request Body:', req.body);
  console.error('User Agent:', req.get('User-Agent'));
  console.error('IP Address:', req.ip);
  console.error('Error:', err);
  console.error('Stack:', err.stack);

  // Prevent sending response if already sent
  if (res.headersSent) {
    console.error('Headers already sent, cannot send error response');
    return next(err);
  }

  // Ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  // Categorize error and determine response
  const errorInfo = categorizeError(err, req);
  const response = buildErrorResponse(errorInfo, req);

  // Log error for troubleshooting
  console.error('Error Info:', JSON.stringify(errorInfo, null, 2));

  // Send error response
  res.status(response.statusCode || 500);
  res.send(response.body || { error: errorInfo });
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = Date.now();
  console.log('Incoming Request:', {
    id: requestId,
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log('RESPONSE:', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler for Express-Validator
 */
const validationErrorHandler = (validationResult) => {
  return (req, res, next) => {
    if (!validationResult.isEmpty()) {
      const errors = validationResult.array();
      const validationErr = new Error('Validation failed');
      validationErr.type = 'validation';
      validationErr.details = errors.map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }));
      return next(validationErr);
    }
    next();
  };
};

module.exports = {
  enhancedErrorHandler,
  requestLogger,
  asyncHandler,
  validationErrorHandler,
  categorizeError,
  buildErrorResponse
};
