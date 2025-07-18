// Configuration for the application
// This avoids process.env issues in browser environments

const config = {
  // Default configuration for development
  apiUrl: 'http://localhost:5000/api',
  wsUrl: 'http://localhost:5000',
  
  // You can manually change these for production
  // apiUrl: 'https://your-api-domain.com/api',
  // wsUrl: 'https://your-api-domain.com',
};

export default config;