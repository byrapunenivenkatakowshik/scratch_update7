# Troubleshooting: Document Opening Issues

## 🚨 Quick Fix Checklist

### Step 1: Check Both Servers Are Running

1. **Backend Server** (Terminal 1):
   ```bash
   cd backend
   npm install
   npm start
   ```
   Should show: `Server running on port 5000`

2. **Frontend Server** (Terminal 2):
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Should show: `Local: http://localhost:3000`

### Step 2: Test Backend Connection

Run the test script:
```bash
node test-backend.js
```

Or test manually:
```bash
curl http://localhost:5000/health
```

### Step 3: Check Browser Console

1. Open browser (Chrome/Firefox)
2. Go to `http://localhost:3000`
3. Press F12 to open Developer Tools
4. Click Console tab
5. Try to open a document
6. Look for error messages

## 🔍 Common Issues & Solutions

### Issue 1: "Cannot GET /editor/[document-id]"

**Problem**: Frontend server not running or wrong port
**Solution**: 
```bash
cd frontend
npm start
```

### Issue 2: Network Error / Connection Refused

**Problem**: Backend server not running
**Solution**:
```bash
cd backend
npm start
```

### Issue 3: 401 Unauthorized

**Problem**: Not logged in or token expired
**Solution**:
1. Try logging out and logging back in
2. Clear browser data:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Issue 4: 404 Document Not Found

**Problem**: Document doesn't exist or ID is wrong
**Solution**:
1. Check the URL - should be `/editor/[valid-document-id]`
2. Try creating a new document from dashboard
3. Check if you have permission to access the document

### Issue 5: Page Loads but Document Content Doesn't Appear

**Problem**: API call failing or document fetch error
**Solution**:
1. Check browser console for errors
2. Verify network requests in Network tab
3. Check if document has content

### Issue 6: "process is not defined" Error

**Problem**: Environment variables not accessible in browser
**Solution**: Configuration has been fixed! API now uses a config file instead of process.env
- File: `frontend/src/config/config.js`
- Default: `http://localhost:5000/api`

### Issue 7: CORS Errors

**Problem**: Frontend and backend running on different ports
**Solution**: Check `backend/server.js` CORS configuration:
```javascript
cors: {
  origin: "http://localhost:3000", // Should match frontend port
  methods: ["GET", "POST"],
  credentials: true
}
```

## 🛠️ Advanced Debugging

### Debug Mode

Add this to your browser console on any page:
```javascript
// Enable debug mode
window.DEBUG = true;

// Check authentication
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// Test API connection
fetch('http://localhost:5000/health')
  .then(res => res.json())
  .then(data => console.log('Backend Status:', data))
  .catch(err => console.error('Backend Error:', err));
```

### Network Tab Analysis

1. Open F12 -> Network tab
2. Click on a document
3. Look for requests to:
   - `/api/documents/[id]` - Should return 200 OK
   - WebSocket connections - Should be established
4. Check response data and error codes

### Firebase Debug

If using Firebase, check:
1. Firebase console for errors
2. Database rules
3. Authentication status
4. Network connectivity to Firebase

## 📋 Environment Setup

### Backend Environment (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### Frontend Environment (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

## 🔧 Step-by-Step Debugging Process

### 1. Verify Servers
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start

# Terminal 3 - Test
node test-backend.js
```

### 2. Check Authentication
```javascript
// In browser console
console.log('Logged in:', !!localStorage.getItem('token'));
```

### 3. Test Document API
```javascript
// In browser console
fetch('http://localhost:5000/api/documents', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log('Documents:', data))
.catch(err => console.error('Error:', err));
```

### 4. Check Document ID
```javascript
// In browser console on editor page
const pathParts = window.location.pathname.split('/');
const documentId = pathParts[pathParts.length - 1];
console.log('Document ID:', documentId);
```

### 5. Manual Document Fetch
```javascript
// In browser console
const documentId = 'your-document-id'; // Replace with actual ID
fetch(`http://localhost:5000/api/documents/${documentId}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log('Document:', data))
.catch(err => console.error('Error:', err));
```

## 🎯 Most Likely Solutions

### Solution 1: Restart Everything
```bash
# Kill all node processes
pkill -f node

# Restart backend
cd backend
npm start

# Restart frontend (in new terminal)
cd frontend
npm start
```

### Solution 2: Clear Browser Data
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Solution 3: Check Ports
- Backend should be on port 5000
- Frontend should be on port 3000
- Update CORS settings if different

### Solution 4: Database Issues
```bash
# Check Firebase connectivity
# Update Firebase configuration
# Verify database rules
```

## 📞 Still Not Working?

If none of the above solutions work:

1. **Check the exact error message** in browser console
2. **Verify the document ID** in the URL
3. **Test with a new document** created from dashboard
4. **Check Firebase console** for database errors
5. **Verify all environment variables** are set correctly

## 📝 Error Message Reference

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Cannot GET /editor/...` | Frontend server not running | Start frontend server |
| `Network Error` | Backend server not running | Start backend server |
| `401 Unauthorized` | Not logged in or token expired | Log in again |
| `404 Not Found` | Document doesn't exist | Check document ID |
| `CORS Error` | Port mismatch | Update CORS configuration |
| `Firebase Error` | Database connection issue | Check Firebase config |

Run through these steps systematically and you should be able to identify and fix the document opening issue!