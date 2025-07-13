/**
 * Enhanced API Client with Error Handling
 * Provides robust API communication with automatic error handling
 */

import appErrorHandler from './error-handler.js';

class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.defaultTimeout = 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
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
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const httpError = new Error(errorData.message || `HTTP ${response.status}`);
        httpError.status = response.status;
        httpError.response = response;
        httpError.data = errorData;
        throw httpError;
      }

      return await response.json();
    } catch (caughtError) {
      if (caughtError.name === 'AbortError') {
        // Handle request timeout
        return appErrorHandler.handleCaughtError(caughtError, 'timeout');
      }
      throw caughtError;
    }
  }

  async batchRequest(requests) {
    try {
      const responses = await Promise.all(requests.map((req) => this.request(req.method, req.url, req.options)));
      return responses;
    } catch (caughtError) {
      const handledCaughtError = await appErrorHandler.handleCaughtError(caughtError, 'batch_request');
      throw handledCaughtError;
    }
  }
}

export default APIClient;
