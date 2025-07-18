// Test the fixed frontend API configuration
import axios from 'axios';

// Test the configuration
const config = {
  apiUrl: 'http://localhost:5000/api'
};

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing Fixed Frontend API Configuration...\n');
    
    // Test with correct URL structure
    console.log('Base URL:', config.apiUrl);
    console.log('Full URL for login:', `${config.apiUrl}/auth/login`);
    
    // Test login
    const response = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful:', response.data.user);
    
    // Test document creation
    const token = response.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const docResponse = await api.post('/documents', {
      title: 'API Test Document',
      content: 'Testing the fixed API',
      isPublic: true
    });
    
    console.log('✅ Document created:', docResponse.data.document.id);
    
    // Test comment creation
    const commentResponse = await api.post('/comments', {
      documentId: docResponse.data.document.id,
      text: 'Test comment',
      selectedText: 'API Test',
      type: 'comment'
    });
    
    console.log('✅ Comment created:', commentResponse.data.comment.id);
    
    console.log('\n🎉 Frontend API configuration is now working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendAPI();