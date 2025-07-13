/**
 * Comprehensive Error Handler Service
 * Provides centralized error handling, logging, and user notifications
 */

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    this.initializeErrorHandling();
    this.setupNetworkMonitoring();
  }

  async initializeErrorHandling() {
    const storedErrors = JSON.parse(localStorage.getItem('stored_errors') || '[]');
    for (const item of storedErrors) {
      this.sendErrorToServer(item);
    }
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.errorQueue.length > 0) {
        this.errorQueue.forEach((item) => this.sendErrorToServer(item));
        this.errorQueue = [];
        localStorage.removeItem('stored_errors');
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Global error handlers
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleCaughtError(event.reason, 'unhandled_promise');
      event.preventDefault();
    });

    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleCaughtError(event.error, 'javascript_error');
    });
  }

  async handleCaughtError(caughtError, context = 'unknown', options = {}) {
    const errorInfo = this.categorizeError(caughtError, context);
    
    // Log error
    this.logError(errorInfo);
    
    // Handle based on error type
    switch (errorInfo.type) {
      case 'network':
        return this.handleNetworkError(errorInfo, options);
      case 'api':
        return this.handleAPIError(errorInfo, options);
      case 'validation':
        return this.handleValidationError(errorInfo, options);
      case 'authentication':
        return this.handleAuthError(errorInfo, options);
      case 'permission':
        return this.handlePermissionError(errorInfo, options);
      case 'rate_limit':
        return this.handleRateLimitError(errorInfo, options);
      case 'server_error':
        return this.handleServerError(errorInfo, options);
      default:
        return this.handleGenericError(errorInfo, options);
    }
  }

  categorizeError(caughtError, context) {
    const errorInfo = {
      original: caughtError,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isOnline: this.isOnline
    };

    // Network errors
    if (!this.isOnline || caughtError.message?.includes('fetch') || caughtError.message?.includes('network')) {
      errorInfo.type = 'network';
      errorInfo.severity = 'medium';
      errorInfo.userMessage = 'Network is unreachable. Please check your internet connection.';
      errorInfo.retryable = true;
    }
    // API errors
    else if (caughtError.status && caughtError.status >= 400 && caughtError.status < 500) {
      errorInfo.type = 'api';
      errorInfo.severity = 'high';
      errorInfo.userMessage = 'An error occurred while communicating with the server.';
    }
    // Validation errors
    else if (caughtError.message?.includes('validation') || caughtError.message?.includes('invalid')) {
      errorInfo.type = 'validation';
      errorInfo.severity = 'low';
      errorInfo.retryable = false;
    }
    // Authentication errors
    else if (caughtError.status === 401 || caughtError.message?.includes('unauthorized')) {
      errorInfo.type = 'authentication';
      errorInfo.severity = 'high';
      errorInfo.retryable = false;
    }
    // Permission errors
    else if (caughtError.status === 403 || caughtError.message?.includes('forbidden')) {
      errorInfo.type = 'permission';
      errorInfo.severity = 'medium';
      errorInfo.retryable = false;
    }
    // Rate limit errors
    else if (caughtError.message?.includes('rate limit') || caughtError.status === 429) {
      errorInfo.type = 'rate_limit';
      errorInfo.severity = 'medium';
      errorInfo.userMessage = 'Too many requests. Please try again later.';
      errorInfo.retryable = true;
    }
    // Server errors
    else {
      errorInfo.type = 'server_error';
      errorInfo.severity = 'high';
      errorInfo.userMessage = 'An unexpected error occurred. Please try again later.';
      errorInfo.retryable = false;
    }

    return errorInfo;
  }

  logError(errorInfo) {
    console.group('Error Information');
    console.error('Type:', errorInfo.type);
    console.error('Context:', errorInfo.context);
    console.error('Error Object:', errorInfo.original);
    console.groupEnd();
  }

  // Handle different types of errors

  async handleNetworkError(errorInfo, options) {
    if (!this.isOnline) {
      // Queue the item for later if possible
      if (options.queueable) {
        this.queueForOffline(options.operation, options.data);
        this.showNotification('Action saved offline. Will sync when connection is restored.', 'info');
        return { success: false, queued: true };
      }
      return { success: false, message: 'You appear to be offline. Please connect to the internet and try again.' };
    }

    switch (errorInfo.original.status) {
      case 500:
      case 502:
      case 503:
        this.showNotification('The server is currently unavailable. Please try again later.', 'error');
        return { success: false, retryable: true };
      default:
        this.showNotification('An unexpected error occurred. Please try again later.', 'error');
        return { success: false, retryable: false };
    }
  }

  async handleAPIError(errorInfo, options) {
    if (errorInfo.original.status === 404) {
      this.showNotification('The requested resource was not found.', 'error');
      return { success: false, status: 404 };
    }
    if (errorInfo.original.status === 409) {
      this.showNotification('Conflict detected. The resource may have been modified by another user.', 'warning');
      return { success: false, status: 409 };
    }
    if (errorInfo.original.status === 422) {
      this.showNotification('Validation failed. Please check your input.', 'error');
      return { success: false, status: 422 };
    }
    if (errorInfo.original.status === 429) {
      this.showNotification('Too many requests. Please wait a moment and try again.', 'warning');
      return this.handleRateLimitError(errorInfo, options);
    }
    if (errorInfo.original.status >= 500) {
      this.showNotification('Server error. Please try again later.', 'error');
      return { success: false, status: errorInfo.original.status, retryable: false };
    }
    // Fallback
    this.showNotification('An unexpected error occurred. Please try again.', 'error');
    return { success: false, retryable: false };
  }

  handleValidationError(errorInfo, options) {
    const validationError = errorInfo.original;
    
    if (validationError.details && Array.isArray(validationError.details)) {
      // Handle multiple validation errors
      validationError.details.forEach(detail => {
        this.showFieldError(detail.field, detail.message);
      });
    } else if (validationError.field && validationError.message) {
      // Handle single field error
      this.showFieldError(validationError.field, validationError.message);
    } else {
      // Generic validation error
      this.showNotification('Please check your input and try again.', 'error');
    }
    return { success: false };
  }

  async handleRateLimitError(errorInfo, options) {
    const retryAfter = errorInfo.original.retryAfter || 60;
    this.showNotification(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`, 'info');
    return new Promise((resolve) => setTimeout(() => resolve({ success: false, queued: true }), retryAfter * 1000));
  }

  handleAuthError(errorInfo, options) {
    this.showNotification('Authentication required. Please log in to continue.', 'error');
    
    // Clear any stored auth tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);

    return { success: false, requiresAuth: true };
  }

  handlePermissionError(errorInfo, options) {
    this.showNotification('You do not have permission to perform this action.', 'error');
    return { success: false };
  }

  handleServerError(errorInfo, options) {
    this.showNotification('Server error. Please try again later.', 'error');
    return { success: false };
  }

  handleGenericError(errorInfo, options) {
    this.showNotification('An unknown error occurred. Please try again.', 'error');
    return { success: false };
  }

  // Utility functions

  showNotification(message, type) {
    // Assuming a global UI notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  showFieldError(field, message) {
    // Display error on specific form field (placeholder implementation)
    const fieldElem = document.querySelector(`[name="${field}"]`);
    if (fieldElem) {
      let errorElem = document.createElement('div');
      errorElem.className = 'field-error';
      errorElem.textContent = message;
      fieldElem.parentElement.insertBefore(errorElem, fieldElem.nextSibling);
    }
  }

  queueForOffline(operation, data) {
    this.errorQueue.push({ operation, data });
    localStorage.setItem('stored_errors', JSON.stringify(this.errorQueue));
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;