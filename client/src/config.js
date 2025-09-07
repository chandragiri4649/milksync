// Configuration file for API endpoints and server URLs
const baseServerUrl = process.env.REACT_APP_SERVER_URL || 'https://milksync.onrender.com';

const config = {
  // Server URL - change this when deploying to production
  SERVER_URL: baseServerUrl,
  
  // API endpoints
  API_BASE: `${baseServerUrl}/api`,
  
  // Image base URL
  IMAGE_BASE_URL: baseServerUrl
};

export default config;
