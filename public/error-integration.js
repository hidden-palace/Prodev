/**
 * Error Handling Integration Script
 * Integrates error handling services with the existing application
 */

// Import error handling services
import applicationErrorHandler from '../services/error-handler.js';
import apiClient from '../services/api-client.js';
import formValidator from '../services/form-validator.js';
import offlineManager from '../services/offline-manager.js';

// Global error handling setup
window.addEventListener('DOMContentLoaded', () => {
  initializeErrorHandling();
  setupFormValidation();
  setupAPIInterception();
  setupOfflineSupport();
  setupNetworkMonitoring();
});

/**
 * Initialize comprehensive error handling
 */
function initializeErrorHandling() {
  console.log('🛡️ Initializing comprehensive error handling...');

  // Make error handler globally available
  window.applicationErrorHandler = applicationErrorHandler;
  window.apiClient = apiClient;
  window.formValidator = formValidator;
  window.offlineManager = offlineManager;

  // Setup global error boundaries
  setupGlobalErrorBoundaries();

  // Setup performance monitoring
  setupPerformanceMonitoring();

  console.log('✅ Error handling initialized successfully');
}

/**
 * Setup global error boundaries
 */
function setupGlobalErrorBoundaries() {
  // Catch and handle all unhandled errors
  window.addEventListener('error', (event) => {
    applicationErrorHandler.handleCaughtError(event.error, 'global_exception', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Catch and handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    applicationErrorHandler.handleCaughtError(event.reason, 'unhandled_promise', {
      promise: event.promise
    });
    event.preventDefault();
  });
}

/**
 * Setup form validation for all forms
 */
function setupFormValidation() {
  // Define validation rules for common forms
  const validationRules = {
    'chat-form': {
      message: ['required', { rule: 'maxLength', params: [4000] }]
    },
    'login-form': {
      email: ['required', 'email'],
      password: ['required', { rule: 'minLength', params: [6] }]
    },
    'contact-form': {
      name: ['required', { rule: 'minLength', params: [2] }],
      email: ['required', 'email'],
      message: ['required', { rule: 'minLength', params: [10] }]
    },
    'lead-form': {
      business_name: ['required', { rule: 'minLength', params: [2] }],
      contact_name: ['required'],
      email: ['email'],
      phone: ['phone']
    }
  };

  // Apply validation rules to forms
  Object.entries(validationRules).forEach(([formId, rules]) => {
    formValidator.setRules(formId, rules);
    
    const form = document.getElementById(formId);
    if (form) {
      formValidator.setupRealTimeValidation(form);
      setupFormSubmissionHandling(form);
    }
  });
}

/**
 * Setup form submission handling with error management
 */
function setupFormSubmissionHandling(form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    
    try {
      // Validate form
      const validation = formValidator.validateFormElement(form);
      if (!validation.valid) {
        throw { type: 'validation', details: validation.errors };
      }
      
      // Submit form
      const endpoint = form.action || form.dataset.action;
      const method = form.method || 'POST';
      
      const result = await apiClient.request(endpoint, {
        method: method.toUpperCase(),
        body: JSON.stringify(data)
      });
      
      // Handle success
      applicationErrorHandler.showNotification('Form submitted successfully!', 'success');
      
      // Reset form if specified
      if (form.dataset.resetOnSuccess !== 'false') {
        form.reset();
      }
      
      // Trigger custom success event
      form.dispatchEvent(new CustomEvent('formSuccess', { detail: result }));
      
    } catch (caughtException) {
      await applicationErrorHandler.handleFormSubmission(data, async () => {
        throw caughtException;
      }, { queueable: form.dataset.queueable === 'true' });
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}

/**
 * Setup API interception for automatic error handling
 */
function setupAPIInterception() {
  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    try {
      // Use offline manager for intelligent caching
      if (url.startsWith('/api/')) {
        return await offlineManager.interceptFetch(url, options);
      }
      
      return await originalFetch(url, options);
    } catch (caughtException) {
      return applicationErrorHandler.handleCaughtError(caughtException, 'fetch_request', {
        url,
        method: options.method || 'GET'
      });
    }
  };
}

/**
 * Setup offline support and synchronization
 */
function setupOfflineSupport() {
  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_OFFLINE_ACTIONS') {
        offlineManager.syncOfflineActions();
      }
    });
  }
  
  // Setup offline indicators
  updateOfflineIndicator();
  
  window.addEventListener('online', updateOfflineIndicator);
  window.addEventListener('offline', updateOfflineIndicator);
}

/**
 * Update offline indicator
 */
function updateOfflineIndicator() {
  const existingIndicator = document.querySelector('.offline-indicator');
  
  if (!navigator.onLine) {
    if (!existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'offline-indicator';
      indicator.textContent = 'You are offline. Changes will be saved locally.';
      document.body.appendChild(indicator);
    }
  } else {
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }
}

/**
 * Setup network monitoring
 */
function setupNetworkMonitoring() {
  let connectionQuality = 'good';
  
  // Monitor connection quality
  if ('connection' in navigator) {
    const connection = navigator.connection;
    
    const updateConnectionQuality = () => {
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        connectionQuality = 'poor';
      } else if (effectiveType === '3g') {
        connectionQuality = 'fair';
      } else {
        connectionQuality = 'good';
      }
      
      // Adjust timeout and retry settings based on connection
      adjustNetworkSettings(connectionQuality);
    };
    
    connection.addEventListener('change', updateConnectionQuality);
    updateConnectionQuality();
  }
}

/**
 * Adjust network settings based on connection quality
 */
function adjustNetworkSettings(quality) {
  const settings = {
    poor: { timeout: 60000, retries: 1 },
    fair: { timeout: 30000, retries: 2 },
    good: { timeout: 15000, retries: 3 }
  };
  
  const config = settings[quality] || settings.good;
  
  // Update API client settings
  if (window.apiClient) {
    window.apiClient.defaultTimeout = config.timeout;
  }
  
  console.log(`Network quality: ${quality}, adjusted settings:`, config);
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
  // Monitor page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      
      if (perfData.loadEventEnd - perfData.loadEventStart > 5000) {
        console.warn('Slow page load detected:', perfData.loadEventEnd - perfData.loadEventStart);
      }
      
      // Monitor memory usage
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (memoryUsage > 0.8) {
          console.warn('High memory usage detected:', memoryUsage);
        }
      }
    }, 1000);
  });
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn('Long task detected:', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
}

/**
 * Utility functions for error handling
 */
window.ErrorUtils = {
  /**
   * Handle async operations with error management
   */
  async handleAsync(operation, context = 'async_operation', options = {}) {
    try {
      return await operation();
    } catch (caughtException) {
      return applicationErrorHandler.handleCaughtError(caughtException, context, options);
    }
  },
  
  /**
   * Wrap functions with error handling
   */
  wrapFunction(fn, context = 'wrapped_function') {
    return function(...args) {
      try {
        const result = fn.apply(this, args);
        if (result instanceof Promise) {
          return result.catch(caughtException => 
            applicationErrorHandler.handleCaughtError(caughtException, context, { args })
          );
        }
        return result;
      } catch (caughtException) {
        return applicationErrorHandler.handleCaughtError(caughtException, context, { args });
      }
    };
  },
  
  /**
   * Show loading state with error handling
   */
  async withLoading(operation, loadingElement) {
    if (loadingElement) {
      loadingElement.classList.add('loading');
    }
    
    try {
      return await operation();
    } finally {
      if (loadingElement) {
        loadingElement.classList.remove('loading');
      }
    }
  },
  
  /**
   * Debounce function calls to prevent spam
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Export for module usage
export {
  applicationErrorHandler,
  apiClient,
  formValidator,
  offlineManager
};