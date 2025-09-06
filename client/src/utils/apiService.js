import config from '../config';

// API Service for session-based requests
class ApiService {
  constructor() {
    this.baseURL = config.API_BASE;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Check for session expiry
      if (response.status === 401 && errorData.sessionExpired) {
        // Clear any stored tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('distributorToken');
        
        // // Redirect to login
        // window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Generic request method with session support
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    console.log('🌐 API Request:', {
      url,
      method: finalOptions.method || 'GET',
      hasCredentials: finalOptions.credentials === 'include',
      headers: finalOptions.headers,
      cookies: document.cookie || 'No cookies found'
    });

    try {
      const response = await fetch(url, finalOptions);
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    const requestOptions = {
      method: 'POST',
      ...options
    };

    // Handle FormData differently
    if (data instanceof FormData) {
      // Remove Content-Type header to let browser set it with boundary
      const { headers, ...otherOptions } = requestOptions;
      const { 'Content-Type': contentType, ...otherHeaders } = headers || {};
      
      return this.request(endpoint, {
        ...requestOptions,
        headers: otherHeaders,
        body: data
      });
    } else {
      // Handle JSON data
      return this.request(endpoint, {
        ...requestOptions,
        body: JSON.stringify(data),
      });
    }
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    const requestOptions = {
      method: 'PUT',
      ...options
    };

    // Handle FormData differently
    if (data instanceof FormData) {
      // Remove Content-Type header to let browser set it with boundary
      const { headers, ...otherOptions } = requestOptions;
      const { 'Content-Type': contentType, ...otherHeaders } = headers || {};
      
      return this.request(endpoint, {
        ...requestOptions,
        headers: otherHeaders,
        body: data
      });
    } else {
      // Handle JSON data
      return this.request(endpoint, {
        ...requestOptions,
        body: JSON.stringify(data),
      });
    }
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Session management methods
  async checkSession() {
    try {
      // Try to get session info from a generic endpoint
      const response = await this.get('/session');
      return response;
    } catch (error) {
      console.error('Session check failed:', error);
      return null;
    }
  }

  async login(userType, credentials) {
    const response = await this.post(`/${userType}/login`, credentials);
    return response;
  }

  async logout() {
    try {
      await this.post('/logout');
      // Clear any stored tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('staffToken');
      localStorage.removeItem('distributorToken');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
