/**
 * Comprehensive Error Handler Service
 * Provides centralized error handling, logging, and user notification
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

  /**
   * Initialize global error handling
   */
  initializeErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, 'unhandled_promise');
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleError(event.error, 'javascript_error');
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        console.error('Resource loading error:', event.target.src || event.target.href);
        this.handleError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), 'resource_error');
      }
    }, true);
  }

  /**
   * Setup network monitoring for offline support
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotification('Connection restored! Syncing pending changes...', 'success');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('You are offline. Changes will be saved locally and synced when connection is restored.', 'warning');
    });
  }

  /**
   * Main error handling method
   */
  handleError(error, context = 'unknown', options = {}) {
    const errorInfo = this.categorizeError(error, context);
    
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
      case 'server':
        return this.handleServerError(errorInfo, options);
      default:
        return this.handleGenericError(errorInfo, options);
    }
  }

  /**
   * Categorize error type for appropriate handling
   */
  categorizeError(error, context) {
    const errorInfo = {
      original: error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isOnline: this.isOnline
    };

    // Network errors
    if (!this.isOnline || error.message?.includes('fetch') || error.message?.includes('network')) {
      errorInfo.type = 'network';
      errorInfo.severity = 'medium';
      errorInfo.retryable = true;
    }
    // API errors
    else if (error.status || error.response) {
      errorInfo.type = 'api';
      errorInfo.status = error.status || error.response?.status;
      errorInfo.severity = this.getAPISeverity(errorInfo.status);
      errorInfo.retryable = this.isRetryableStatus(errorInfo.status);
    }
    // Validation errors
    else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      errorInfo.type = 'validation';
      errorInfo.severity = 'low';
      errorInfo.retryable = false;
    }
    // Authentication errors
    else if (error.status === 401 || error.message?.includes('unauthorized')) {
      errorInfo.type = 'authentication';
      errorInfo.severity = 'high';
      errorInfo.retryable = false;
    }
    // Permission errors
    else if (error.status === 403 || error.message?.includes('forbidden')) {
      errorInfo.type = 'permission';
      errorInfo.severity = 'medium';
      errorInfo.retryable = false;
    }
    // Rate limit errors
    else if (error.status === 429) {
      errorInfo.type = 'rate_limit';
      errorInfo.severity = 'medium';
      errorInfo.retryable = true;
    }
    // Server errors
    else if (error.status >= 500) {
      errorInfo.type = 'server';
      errorInfo.severity = 'high';
      errorInfo.retryable = true;
    }
    // Generic errors
    else {
      errorInfo.type = 'generic';
      errorInfo.severity = 'medium';
      errorInfo.retryable = false;
    }

    return errorInfo;
  }

  /**
   * Handle network errors with offline support
   */
  async handleNetworkError(errorInfo, options) {
    if (!this.isOnline) {
      // Queue for later if it's a data operation
      if (options.queueable) {
        this.queueForOffline(options.operation, options.data);
        this.showNotification('Action saved offline. Will sync when connection is restored.', 'info');
        return { success: false, queued: true };
      }
    }

    // Try to retry if retryable
    if (errorInfo.retryable && options.retry !== false) {
      return this.retryOperation(options.operation, options.data, errorInfo);
    }

    this.showNotification('Network connection issue. Please check your internet connection.', 'error');
    return { success: false, error: errorInfo };
  }

  /**
   * Handle API errors with specific status code handling
   */
  async handleAPIError(errorInfo, options) {
    const status = errorInfo.status;
    
    switch (status) {
      case 400:
        this.showNotification('Invalid request. Please check your input and try again.', 'error');
        break;
      case 401:
        this.showNotification('Session expired. Please log in again.', 'error');
        // Redirect to login or refresh token
        this.handleSessionExpired();
        break;
      case 403:
        this.showNotification('You don\'t have permission to perform this action.', 'error');
        break;
      case 404:
        this.showNotification('The requested resource was not found.', 'error');
        break;
      case 409:
        this.showNotification('Conflict detected. The resource may have been modified by another user.', 'warning');
        break;
      case 422:
        this.showNotification('Validation failed. Please check your input.', 'error');
        break;
      case 429:
        this.showNotification('Too many requests. Please wait a moment and try again.', 'warning');
        return this.handleRateLimitError(errorInfo, options);
      case 500:
      case 502:
      case 503:
      case 504:
        this.showNotification('Server error. Our team has been notified. Please try again later.', 'error');
        if (errorInfo.retryable) {
          return this.retryOperation(options.operation, options.data, errorInfo);
        }
        break;
      default:
        this.showNotification('An unexpected error occurred. Please try again.', 'error');
    }

    return { success: false, error: errorInfo };
  }

  /**
   * Handle validation errors with field-specific messages
   */
  handleValidationError(errorInfo, options) {
    const error = errorInfo.original;
    
    if (error.details && Array.isArray(error.details)) {
      // Handle multiple validation errors
      error.details.forEach(detail => {
        this.showFieldError(detail.field, detail.message);
      });
    } else if (error.field && error.message) {
      // Handle single field error
      this.showFieldError(error.field, error.message);
    } else {
      // Generic validation error
      this.showNotification('Please check your input and try again.', 'error');
    }

    return { success: false, error: errorInfo, type: 'validation' };
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(errorInfo, options) {
    this.showNotification('Authentication required. Please log in to continue.', 'error');
    
    // Clear any stored auth tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);

    return { success: false, error: errorInfo, requiresAuth: true };
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(errorInfo, options) {
    this.showNotification('You don\'t have permission to perform this action. Contact your administrator if you believe this is an error.', 'error');
    return { success: false, error: errorInfo, type: 'permission' };
  }

  /**
   * Handle rate limit errors with exponential backoff
   */
  async handleRateLimitError(errorInfo, options) {
    const retryAfter = errorInfo.original.headers?.['retry-after'] || 60;
    
    this.showNotification(`Rate limit exceeded. Retrying in ${retryAfter} seconds...`, 'warning');
    
    // Wait for the specified time before retrying
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    
    if (options.operation) {
      return this.retryOperation(options.operation, options.data, errorInfo);
    }

    return { success: false, error: errorInfo, retryAfter };
  }

  /**
   * Handle server errors with retry logic
   */
  async handleServerError(errorInfo, options) {
    this.showNotification('Server error occurred. Attempting to retry...', 'warning');
    
    if (errorInfo.retryable && options.retry !== false) {
      return this.retryOperation(options.operation, options.data, errorInfo);
    }

    this.showNotification('Server is temporarily unavailable. Please try again later.', 'error');
    return { success: false, error: errorInfo };
  }

  /**
   * Handle generic errors
   */
  handleGenericError(errorInfo, options) {
    console.error('Generic error:', errorInfo);
    this.showNotification('An unexpected error occurred. Please refresh the page and try again.', 'error');
    return { success: false, error: errorInfo };
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation, data, errorInfo) {
    const operationKey = `${operation.name}_${JSON.stringify(data)}`;
    const currentAttempts = this.retryAttempts.get(operationKey) || 0;

    if (currentAttempts >= this.maxRetries) {
      this.retryAttempts.delete(operationKey);
      this.showNotification('Maximum retry attempts reached. Please try again later.', 'error');
      return { success: false, error: errorInfo, maxRetriesReached: true };
    }

    const delay = this.retryDelay * Math.pow(2, currentAttempts);
    this.retryAttempts.set(operationKey, currentAttempts + 1);

    this.showNotification(`Retrying in ${delay / 1000} seconds... (Attempt ${currentAttempts + 1}/${this.maxRetries})`, 'info');

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const result = await operation(data);
      this.retryAttempts.delete(operationKey);
      this.showNotification('Operation completed successfully!', 'success');
      return { success: true, result, retried: true };
    } catch (retryError) {
      return this.handleError(retryError, 'retry', { operation, data, retry: true });
    }
  }

  /**
   * Queue operations for offline processing
   */
  queueForOffline(operation, data) {
    const queueItem = {
      id: Date.now() + Math.random(),
      operation: operation.name,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    this.errorQueue.push(queueItem);
    
    // Store in localStorage for persistence
    localStorage.setItem('offline_queue', JSON.stringify(this.errorQueue));
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue() {
    const storedQueue = localStorage.getItem('offline_queue');
    if (storedQueue) {
      this.errorQueue = JSON.parse(storedQueue);
    }

    if (this.errorQueue.length === 0) return;

    this.showNotification(`Processing ${this.errorQueue.length} offline actions...`, 'info');

    const results = [];
    for (const item of this.errorQueue) {
      try {
        // Reconstruct operation and execute
        const result = await this.executeQueuedOperation(item);
        results.push({ success: true, item, result });
      } catch (error) {
        console.error('Failed to process queued item:', item, error);
        results.push({ success: false, item, error });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (failed === 0) {
      this.showNotification(`All ${successful} offline actions synced successfully!`, 'success');
      this.errorQueue = [];
    } else {
      this.showNotification(`${successful} actions synced, ${failed} failed. Failed actions will be retried.`, 'warning');
      this.errorQueue = results.filter(r => !r.success).map(r => r.item);
    }

    localStorage.setItem('offline_queue', JSON.stringify(this.errorQueue));
  }

  /**
   * Execute a queued operation
   */
  async executeQueuedOperation(item) {
    // This would need to be implemented based on your specific operations
    // For example, if it's an API call, reconstruct and execute it
    switch (item.operation) {
      case 'saveData':
        return await this.saveData(item.data);
      case 'updateProfile':
        return await this.updateProfile(item.data);
      // Add more operations as needed
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Show user-friendly notifications
   */
  showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications of the same type
    const existingNotifications = document.querySelectorAll(`.notification-${type}`);
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, duration);
    }
  }

  /**
   * Show field-specific error messages
   */
  showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
    if (!field) return;

    // Remove existing error
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add error class to field
    field.classList.add('error');

    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;

    // Insert after the field
    field.parentElement.insertBefore(errorElement, field.nextSibling);

    // Remove error when field is focused
    field.addEventListener('focus', () => {
      field.classList.remove('error');
      if (errorElement.parentElement) {
        errorElement.remove();
      }
    }, { once: true });
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Handle session expiration
   */
  handleSessionExpired() {
    // Clear auth data
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Show login modal or redirect
    this.showNotification('Your session has expired. Please log in again.', 'warning', 0);
    
    // Redirect after a delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }

  /**
   * Log errors for monitoring and debugging
   */
  logError(errorInfo) {
    const logEntry = {
      ...errorInfo,
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId(),
      buildVersion: this.getBuildVersion()
    };

    // Log to console for development
    console.error('Error logged:', logEntry);

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(logEntry);
    }

    // Store locally for offline scenarios
    this.storeErrorLocally(logEntry);
  }

  /**
   * Send error to tracking service
   */
  async sendToErrorTracking(errorInfo) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorInfo)
      });
    } catch (trackingError) {
      console.error('Failed to send error to tracking service:', trackingError);
    }
  }

  /**
   * Store error locally for later transmission
   */
  storeErrorLocally(errorInfo) {
    const errors = JSON.parse(localStorage.getItem('stored_errors') || '[]');
    errors.push(errorInfo);
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    localStorage.setItem('stored_errors', JSON.stringify(errors));
  }

  /**
   * Utility methods
   */
  getAPISeverity(status) {
    if (status >= 500) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }

  isRetryableStatus(status) {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  getSessionId() {
    return sessionStorage.getItem('session_id') || 'anonymous';
  }

  getCurrentUserId() {
    return localStorage.getItem('user_id') || 'anonymous';
  }

  getBuildVersion() {
    return process.env.BUILD_VERSION || '1.0.0';
  }

  /**
   * Public API for manual error handling
   */
  async handleAPICall(apiCall, options = {}) {
    try {
      const result = await apiCall();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error, 'api_call', {
        operation: apiCall,
        queueable: options.queueable,
        retry: options.retry
      });
    }
  }

  async handleFormSubmission(formData, submitFunction, options = {}) {
    try {
      // Validate form data
      if (options.validator) {
        const validation = options.validator(formData);
        if (!validation.valid) {
          throw { type: 'validation', details: validation.errors };
        }
      }

      const result = await submitFunction(formData);
      this.showNotification('Form submitted successfully!', 'success');
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error, 'form_submission', {
        operation: submitFunction,
        data: formData,
        queueable: options.queueable
      });
    }
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;