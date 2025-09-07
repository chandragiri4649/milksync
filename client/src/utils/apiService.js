import config from '../config';

// API Service for session-based requests with JWT token support
class ApiService {
  constructor() {
    this.baseURL = config.API_BASE;
    console.log('🚀 ApiService initialized with JWT token support');
  }

  // Helper method to get current JWT token
  getToken() {
    const adminToken = localStorage.getItem('adminToken');
    const staffToken = localStorage.getItem('staffToken');
    const distributorToken = localStorage.getItem('distributorToken');
    const token = adminToken || staffToken || distributorToken;
    
    console.log('🔍 Token check:', {
      hasAdminToken: !!adminToken,
      hasStaffToken: !!staffToken,
      hasDistributorToken: !!distributorToken,
      finalToken: token ? token.substring(0, 20) + '...' : 'None'
    });
    
    return token;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Check for session expiry or authentication issues
      if (response.status === 401) {
        console.warn('🚨 Authentication failed, checking token status...');
        const token = this.getToken();
        
        if (!token) {
          console.warn('🚨 No JWT token found, redirecting to login...');
          // Clear any stored tokens
          localStorage.removeItem('adminToken');
          localStorage.removeItem('staffToken');
          localStorage.removeItem('distributorToken');
          
          // Redirect to login
          window.location.href = '/';
          throw new Error('Please login again.');
        } else {
          console.warn('🚨 JWT token exists but authentication failed. Token might be expired.');
          // Clear any stored tokens
          localStorage.removeItem('adminToken');
          localStorage.removeItem('staffToken');
          localStorage.removeItem('distributorToken');
          
          throw new Error('Session expired. Please login again.');
        }
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Generic request method with session and JWT token support
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get JWT token from localStorage (fallback when cookies don't work)
    const token = this.getToken();
    
    // Force Authorization header for all requests
    const authHeaders = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Adding Authorization header with token:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No JWT token found in localStorage');
    }

    const defaultOptions = {
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
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
        tokenLength: token ? token.length : 0,
        tokenSource: (() => {
          const adminToken = localStorage.getItem('adminToken');
          const staffToken = localStorage.getItem('staffToken');
          const distributorToken = localStorage.getItem('distributorToken');
          if (adminToken) return 'admin';
          if (staffToken) return 'staff';
          if (distributorToken) return 'distributor';
          return 'none';
        })(),
        hasAuthHeader: !!finalOptions.headers.Authorization,
        authHeaderValue: finalOptions.headers.Authorization ? 'Bearer token present' : 'No auth header',
        sessionCookie: document.cookie.includes('milksync-session'),
        localStorageTokens: {
          admin: !!localStorage.getItem('adminToken'),
          staff: !!localStorage.getItem('staffToken'),
          distributor: !!localStorage.getItem('distributorToken')
        }
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
      
      // If we get 401 and we have a token but didn't send Authorization header, retry once
      if (response.status === 401 && !finalOptions.headers.Authorization && this.getToken()) {
        console.warn('🔄 Retrying request with Authorization header...');
        const retryOptions = {
          ...finalOptions,
          headers: {
            ...finalOptions.headers,
            'Authorization': `Bearer ${this.getToken()}`
          }
        };
        
        const retryResponse = await fetch(url, retryOptions);
        console.log('📡 Retry API Response:', {
          status: retryResponse.status,
          statusText: retryResponse.statusText,
          url: retryResponse.url
        });
        
        return await this.handleResponse(retryResponse);
      }
      
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
    console.log('🔐 Login attempt for:', userType);
    const response = await this.post(`/${userType}/login`, credentials);
    
    // Ensure token is stored after successful login
    if (response.token) {
      console.log('💾 Storing JWT token:', response.token.substring(0, 20) + '...');
      localStorage.setItem(`${userType}Token`, response.token);
      
      // Verify token was stored
      const storedToken = localStorage.getItem(`${userType}Token`);
      console.log('✅ Token verification:', storedToken ? 'Stored successfully' : 'Failed to store');
    } else {
      console.warn('⚠️ No token received from login response');
    }
    
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
