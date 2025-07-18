// Test configuration to ensure it's working
import config from './config/config';

console.log('Configuration test:');
console.log('API URL:', config.apiUrl);
console.log('WebSocket URL:', config.wsUrl);

// Test if the URLs are valid
try {
  new URL(config.apiUrl);
  console.log('✅ API URL is valid');
} catch (error) {
  console.error('❌ API URL is invalid:', error.message);
}

try {
  new URL(config.wsUrl);
  console.log('✅ WebSocket URL is valid');
} catch (error) {
  console.error('❌ WebSocket URL is invalid:', error.message);
}

export default config;