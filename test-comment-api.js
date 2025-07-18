// Test script to verify comment API is working
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

const testDocument = {
  title: 'Test Document',
  content: 'This is a test document with some content.',
  isPublic: true
};

const testComment = {
  text: 'This is a test comment',
  selectedText: 'test document',
  type: 'comment'
};

const testSuggestion = {
  text: 'This is a test suggestion',
  selectedText: 'test document',
  suggestedText: 'sample document',
  type: 'suggestion'
};

let token = '';
let documentId = '';

async function testCommentSystem() {
  try {
    console.log('🧪 Testing Comment System API...\n');

    // 1. Register or login user
    console.log('1. Testing user authentication...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      token = registerResponse.data.token;
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === 'User already exists') {
        // User already exists, try login
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        token = loginResponse.data.token;
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    // 2. Create a test document
    console.log('2. Creating test document...');
    const docResponse = await axios.post(`${API_BASE}/documents`, testDocument, {
      headers: { Authorization: `Bearer ${token}` }
    });
    documentId = docResponse.data.document.id;
    console.log(`✅ Document created with ID: ${documentId}`);

    // 3. Test adding a comment
    console.log('3. Adding test comment...');
    const commentResponse = await axios.post(`${API_BASE}/comments`, {
      ...testComment,
      documentId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const commentId = commentResponse.data.comment.id;
    console.log(`✅ Comment added with ID: ${commentId}`);

    // 4. Test adding a suggestion
    console.log('4. Adding test suggestion...');
    const suggestionResponse = await axios.post(`${API_BASE}/comments`, {
      ...testSuggestion,
      documentId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const suggestionId = suggestionResponse.data.comment.id;
    console.log(`✅ Suggestion added with ID: ${suggestionId}`);

    // 5. Test getting comments
    console.log('5. Retrieving comments...');
    const getCommentsResponse = await axios.get(`${API_BASE}/comments/document/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Retrieved ${getCommentsResponse.data.comments.length} comments`);

    // 6. Test resolving comment
    console.log('6. Resolving comment...');
    await axios.put(`${API_BASE}/comments/${commentId}/resolve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Comment resolved successfully');

    // 7. Test accepting suggestion
    console.log('7. Accepting suggestion...');
    await axios.put(`${API_BASE}/comments/${suggestionId}/resolve`, {
      action: 'accept'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Suggestion accepted successfully');

    // 8. Test adding reply
    console.log('8. Adding reply to comment...');
    const replyResponse = await axios.post(`${API_BASE}/comments/${commentId}/reply`, {
      text: 'This is a test reply'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Reply added with ID: ${replyResponse.data.reply.id}`);

    console.log('\n🎉 All tests passed! Comment system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCommentSystem();