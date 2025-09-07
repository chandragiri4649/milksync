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

  // Generic request method with session and JWT token support
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get JWT token from localStorage (fallback when cookies don't work)
    const adminToken = localStorage.getItem('adminToken');
    const staffToken = localStorage.getItem('staffToken');
    const distributorToken = localStorage.getItem('distributorToken');
    const token = adminToken || staffToken || distributorToken;
    
    const defaultOptions = {
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        // Add JWT token to Authorization header if available
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    console.log('🌐 API Request:', {
      url,
      method: finalOptions.method || 'GET',
      hasCredentials: finalOptions.credentials === 'include',
      headers: finalOptions.headers,
      cookies: document.cookie || 'No cookies found',
      domain: window.location.hostname,
      crossOrigin: new URL(url).hostname !== window.location.hostname,
      // Enhanced authentication debugging
      authDetails: {
        hasJwtToken: !!token,
        tokenSource: token ? (adminToken ? 'admin' : staffToken ? 'staff' : 'distributor') : 'none',
        hasAuthHeader: !!finalOptions.headers.Authorization,
        sessionCookie: document.cookie.includes('milksync-session'),
        cookieCount: document.cookie ? document.cookie.split(';').length : 0
      }
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

  // Cookie testing methods for debugging
  async testCookie() {
    try {
      console.log('🍪 Testing cookie setting...');
      const response = await this.get('/test-cookie');
      console.log('🍪 Test cookie response:', response);
      
      // Check if cookie was set
      setTimeout(() => {
        console.log('🍪 Cookies after test-cookie call:', {
          allCookies: document.cookie,
          hasTestCookie: document.cookie.includes('test-cookie')
        });
      }, 100);
      
      return response;
    } catch (error) {
      console.error('Cookie test failed:', error);
      return null;
    }
  }

  async checkCookie() {
    try {
      console.log('🔍 Checking cookies on server...');
      const response = await this.get('/check-cookie');
      console.log('🔍 Cookie check response:', response);
      return response;
    } catch (error) {
      console.error('Cookie check failed:', error);
      return null;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
