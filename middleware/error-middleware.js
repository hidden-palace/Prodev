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

  // Log error for monitoring
  logErrorForMonitoring(errorInfo, req);

  // Send response
  try {
    res.status(errorInfo.statusCode).json(response);
  } catch (responseError) {
    console.error('Failed to send error response:', responseError);
    try {
      res.status(500).end('{"error":"Internal server error","details":"Failed to send proper error response"}');
    } catch (criticalError) {
      console.error('Complete failure to send any response:', criticalError);
    }
  }
};

/**
 * Categorize error type and severity
 */
function categorizeError(err, req) {
  const errorInfo = {
    original: err,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || generateRequestId(),
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Get error message safely
  let message = 'Unknown error occurred';
  if (typeof err === 'string') {
    message = err;
  } else if (err && typeof err.message === 'string') {
    message = err.message;
  } else if (err && typeof err.details === 'string') {
    message = err.details;
  } else if (err && typeof err.error === 'string') {
    message = err.error;
  }

  errorInfo.message = message;

  // Categorize by error type
  if (message.includes('OpenAI API authentication failed') || message.includes('API key')) {
    errorInfo.type = 'authentication';
    errorInfo.statusCode = 401;
    errorInfo.severity = 'high';
    errorInfo.userMessage = 'Authentication error with AI service. Please check configuration.';
    errorInfo.retryable = false;
  } else if (message.includes('rate limit') || err.status === 429) {
    errorInfo.type = 'rate_limit';
    errorInfo.statusCode = 429;
    errorInfo.severity = 'medium';
    errorInfo.userMessage = 'Too many requests. Please try again later.';
    errorInfo.retryable = true;
    errorInfo.retryAfter = 60;
  } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    errorInfo.type = 'timeout';
    errorInfo.statusCode = 408;
    errorInfo.severity = 'medium';
    errorInfo.userMessage = 'Request timeout. Please try again.';
    errorInfo.retryable = true;
  } else if (message.includes('network') || message.includes('ECONNREFUSED')) {
    errorInfo.type = 'network';
    errorInfo.statusCode = 503;
    errorInfo.severity = 'high';
    errorInfo.userMessage = 'Service temporarily unavailable. Please try again later.';
    errorInfo.retryable = true;
  } else if (message.includes('validation') || message.includes('invalid')) {
    errorInfo.type = 'validation';
    errorInfo.statusCode = 400;
    errorInfo.severity = 'low';
    errorInfo.userMessage = 'Invalid input. Please check your data and try again.';
    errorInfo.retryable = false;
  } else if (message.includes('not found') || err.status === 404) {
    errorInfo.type = 'not_found';
    errorInfo.statusCode = 404;
    errorInfo.severity = 'low';
    errorInfo.userMessage = 'The requested resource was not found.';
    errorInfo.retryable = false;
  } else if (message.includes('forbidden') || err.status === 403) {
    errorInfo.type = 'forbidden';
    errorInfo.statusCode = 403;
    errorInfo.severity = 'medium';
    errorInfo.userMessage = 'You do not have permission to access this resource.';
    errorInfo.retryable = false;
  } else if (message.includes('unauthorized') || err.status === 401) {
    errorInfo.type = 'unauthorized';
    errorInfo.statusCode = 401;
    errorInfo.severity = 'medium';
    errorInfo.userMessage = 'Authentication required. Please log in and try again.';
    errorInfo.retryable = false;
  } else if (message.includes('conflict') || err.status === 409) {
    errorInfo.type = 'conflict';
    errorInfo.statusCode = 409;
    errorInfo.severity = 'medium';
    errorInfo.userMessage = 'Conflict detected. The resource may have been modified.';
    errorInfo.retryable = false;
  } else if (err.status >= 500 || message.includes('database') || message.includes('server')) {
    errorInfo.type = 'server';
    errorInfo.statusCode = err.status || 500;
    errorInfo.severity = 'high';
    errorInfo.userMessage = 'Internal server error. Our team has been notified.';
    errorInfo.retryable = true;
  } else {
    errorInfo.type = 'generic';
    errorInfo.statusCode = err.status || 500;
    errorInfo.severity = 'medium';
    errorInfo.userMessage = 'An unexpected error occurred. Please try again.';
    errorInfo.retryable = false;
  }

  return errorInfo;
}

/**
 * Build user-friendly error response
 */
function buildErrorResponse(errorInfo, req) {
  const response = {
    error: errorInfo.userMessage,
    type: errorInfo.type,
    timestamp: errorInfo.timestamp,
    requestId: errorInfo.requestId
  };

  // Add retry information if applicable
  if (errorInfo.retryable) {
    response.retryable = true;
    if (errorInfo.retryAfter) {
      response.retryAfter = errorInfo.retryAfter;
    }
  }

  // Add development details in non-production
  if (config.server.nodeEnv !== 'production') {
    response.details = errorInfo.message;
    response.stack = errorInfo.original.stack;
    response.debug = {
      url: errorInfo.url,
      method: errorInfo.method,
      severity: errorInfo.severity
    };
  }

  // Add specific error context
  switch (errorInfo.type) {
    case 'validation':
      if (errorInfo.original.details) {
        response.validationErrors = errorInfo.original.details;
      }
      break;
    case 'rate_limit':
      response.suggestion = 'Please wait before making another request';
      break;
    case 'authentication':
      response.suggestion = 'Please check your API keys and authentication settings';
      break;
    case 'network':
      response.suggestion = 'Please check your internet connection and try again';
      break;
  }

  return response;
}

/**
 * Log error for monitoring and alerting
 */
function logErrorForMonitoring(errorInfo, req) {
  const logEntry = {
    ...errorInfo,
    environment: config.server.nodeEnv,
    version: process.env.BUILD_VERSION || '1.0.0',
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };

  // Log to console with structured format
  console.error('ERROR_LOG:', JSON.stringify(logEntry, null, 2));

  // In production, send to monitoring service
  if (config.server.nodeEnv === 'production') {
    sendToMonitoringService(logEntry);
  }

  // Store critical errors locally
  if (errorInfo.severity === 'high') {
    storeCriticalError(logEntry);
  }
}

/**
 * Send error to external monitoring service
 */
async function sendToMonitoringService(errorLog) {
  try {
    // This would integrate with services like Sentry, LogRocket, etc.
    console.log('Sending error to monitoring service:', errorLog.requestId);
    
    // Example integration:
    // await fetch('https://monitoring-service.com/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // });
  } catch (monitoringError) {
    console.error('Failed to send error to monitoring service:', monitoringError);
  }
}

/**
 * Store critical errors locally for analysis
 */
function storeCriticalError(errorLog) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const errorDir = path.join(__dirname, '../logs/errors');
    if (!fs.existsSync(errorDir)) {
      fs.mkdirSync(errorDir, { recursive: true });
    }
    
    const filename = `critical_error_${Date.now()}.json`;
    const filepath = path.join(errorDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(errorLog, null, 2));
    console.log('Critical error stored locally:', filepath);
  } catch (storageError) {
    console.error('Failed to store critical error locally:', storageError);
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = requestId;
  
  const startTime = Date.now();
  
  // Log request
  console.log('REQUEST:', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Log response when finished
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
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 */
const validationErrorHandler = (validationResult) => {
  return (req, res, next) => {
    if (!validationResult.isEmpty()) {
      const errors = validationResult.array();
      const error = new Error('Validation failed');
      error.type = 'validation';
      error.details = errors.map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }));
      return next(error);
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