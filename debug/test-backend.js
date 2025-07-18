// Simple test script to check if backend is working
// Run this with: node test-backend.js

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testBackend() {
  console.log('🔍 Testing backend connection...');
  
  try {
    // Test basic connection
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Backend is running');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend is not running on port 5000');
      console.log('Please start the backend with: cd backend && npm start');
    } else {
      console.log('❌ Error connecting to backend:', error.message);
    }
  }
  
  // Test documents endpoint (will fail if not authenticated)
  try {
    const response = await axios.get(`${API_URL}/api/documents`);
    console.log('✅ Documents endpoint working');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️  Documents endpoint requires authentication (this is expected)');
    } else {
      console.log('❌ Documents endpoint error:', error.message);
    }
  }
}

testBackend();