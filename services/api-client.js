/**
 * Enhanced API Client with Error Handling
 * Provides robust API communication with automatic error handling
 */

import errorHandler from './error-handler.js';

class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.defaultTimeout = 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make HTTP request with comprehensive error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: options.timeout || this.defaultTimeout,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.response = response;
        error.data = errorData;
        throw error;
      }

      const data = await response.json();
      return data;

    } catch (fetchError) {
      // Handle different types of fetch errors
      if (fetchError.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.type = 'timeout';
        throw timeoutError;
      }

      if (!navigator.onLine) {
        const networkError = new Error('Network unavailable');
        networkError.type = 'network';
        throw networkError;
      }

      throw fetchError;
    }
  }

  /**
   * GET request with error handling
   */
  async get(endpoint, options = {}) {
    return errorHandler.handleAPICall(
      () => this.request(endpoint, { ...options, method: 'GET' }),
      { queueable: false, retry: true }
    );
  }

  /**
   * POST request with error handling
   */
  async post(endpoint, data, options = {}) {
    return errorHandler.handleAPICall(
      () => this.request(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
      }),
      { queueable: options.queueable, retry: options.retry }
    );
  }

  /**
   * PUT request with error handling
   */
  async put(endpoint, data, options = {}) {
    return errorHandler.handleAPICall(
      () => this.request(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      { queueable: options.queueable, retry: options.retry }
    );
  }

  /**
   * DELETE request with error handling
   */
  async delete(endpoint, options = {}) {
    return errorHandler.handleAPICall(
      () => this.request(endpoint, { ...options, method: 'DELETE' }),
      { queueable: false, retry: true }
    );
  }

  /**
   * Upload file with progress and error handling
   */
  async uploadFile(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append(options.fieldName || 'file', file);

    // Add additional fields if provided
    if (options.additionalFields) {
      Object.entries(options.additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return errorHandler.handleAPICall(
      () => this.request(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          ...options.headers
        }
      }),
      { queueable: false, retry: false }
    );
  }

  /**
   * Batch requests with error handling
   */
  async batch(requests) {
    const results = [];
    const errors = [];

    for (const request of requests) {
      try {
        const result = await this.request(request.endpoint, request.options);
        results.push({ success: true, data: result, request });
      } catch (error) {
        const handledError = await errorHandler.handleError(error, 'batch_request');
        errors.push({ success: false, error: handledError, request });
        results.push({ success: false, error: handledError, request });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success),
      failed: results.filter(r => !r.success),
      hasErrors: errors.length > 0
    };
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;