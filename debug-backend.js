// Quick backend debugging script
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function debugBackend() {
  try {
    console.log('🔍 Debugging Backend...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health:', healthResponse.data);

    // Test login endpoint
    console.log('\n2. Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Login successful:', loginResponse.data.user);
      
      const token = loginResponse.data.token;
      
      // Test document creation
      console.log('\n3. Testing document creation...');
      const docResponse = await axios.post(`${API_BASE}/documents`, {
        title: 'Debug Test Document',
        content: 'This is a debug test document',
        isPublic: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Document created:', docResponse.data.document.id);
      
      const documentId = docResponse.data.document.id;
      
      // Test comment creation
      console.log('\n4. Testing comment creation...');
      const commentResponse = await axios.post(`${API_BASE}/comments`, {
        documentId,
        text: 'This is a debug comment',
        selectedText: 'debug test',
        type: 'comment'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Comment created:', commentResponse.data.comment.id);
      
      // Test comment retrieval
      console.log('\n5. Testing comment retrieval...');
      const getCommentsResponse = await axios.get(`${API_BASE}/comments/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Comments retrieved:', getCommentsResponse.data.comments.length);
      
      console.log('\n🎉 All backend endpoints are working correctly!');
      
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data || loginError.message);
      
      // Try to register first
      console.log('\n🔄 Attempting to register user...');
      try {
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });
        console.log('✅ User registered:', registerResponse.data.user);
      } catch (registerError) {
        console.log('❌ Registration failed:', registerError.response?.data || registerError.message);
      }
    }

  } catch (error) {
    console.error('❌ Backend error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugBackend();