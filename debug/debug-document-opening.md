# Debug Guide: Document Opening Issues

## Quick Debug Steps

### 1. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Click on a document to open it
4. Look for any error messages

### 2. Check Network Tab
1. Open browser developer tools (F12)
2. Go to Network tab
3. Click on a document to open it
4. Look for:
   - Failed API requests (red entries)
   - 404, 401, or 500 status codes
   - Check if the request to `/api/documents/{id}` is being made

### 3. Check Backend Status
1. Make sure backend is running:
   ```bash
   cd backend
   npm start
   ```
2. Check if server is running on port 5000
3. Test API endpoint directly:
   ```bash
   curl http://localhost:5000/api/documents
   ```

### 4. Common Issues & Solutions

#### Issue 1: Backend Not Running
**Symptoms**: Network errors, connection refused
**Solution**: Start the backend server
```bash
cd backend
npm install
npm start
```

#### Issue 2: Authentication Token Issues
**Symptoms**: 401 errors, redirected to login
**Solution**: 
1. Check if you're logged in
2. Try logging out and logging back in
3. Clear localStorage: `localStorage.clear()`

#### Issue 3: Document Not Found
**Symptoms**: 404 errors when clicking document
**Solution**: Check if document exists in database

#### Issue 4: Port Mismatch
**Symptoms**: API calls fail
**Solution**: Update API URL in frontend
1. Check `frontend/src/services/api.js`
2. Update `API_BASE_URL` to match your backend port

#### Issue 5: CORS Issues
**Symptoms**: CORS errors in console
**Solution**: Check backend CORS configuration

### 5. Environment Variables Check
Make sure these are set in your `.env` files:

**Backend (.env)**:
```
PORT=5000
JWT_SECRET=your-secret-key
FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

**Frontend (.env)**:
```
REACT_APP_API_URL=http://localhost:5000
```

### 6. Test Individual Components

#### Test API Service
```javascript
// In browser console
import { documentService } from './services/api';
documentService.getDocuments().then(console.log).catch(console.error);
```

#### Test Authentication
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

### 7. Enable Debug Mode
Add this to your EditorPage component for debugging:

```javascript
useEffect(() => {
  console.log('EditorPage mounted with id:', id);
  console.log('User:', user);
  console.log('Document:', document);
}, [id, user, document]);
```

### 8. Check React Router
Make sure the URL structure is correct:
- Dashboard: `http://localhost:3000/dashboard`
- Editor: `http://localhost:3000/editor/{document-id}`

### 9. Firebase Issues
If using Firebase:
1. Check Firebase console for errors
2. Verify Firebase configuration
3. Check database rules

### 10. Quick Fix Script
Run this in your browser console to diagnose:

```javascript
// Debug document opening
function debugDocumentOpening() {
  console.log('=== Document Opening Debug ===');
  console.log('Current URL:', window.location.href);
  console.log('Token exists:', !!localStorage.getItem('token'));
  console.log('User logged in:', !!JSON.parse(localStorage.getItem('user') || 'null'));
  console.log('API Base URL:', 'http://localhost:5000/api');
  
  // Test API connection
  fetch('http://localhost:5000/api/documents', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(response => {
    console.log('API Response Status:', response.status);
    return response.json();
  })
  .then(data => console.log('API Response Data:', data))
  .catch(error => console.error('API Error:', error));
}

debugDocumentOpening();
```

### 11. Most Common Solutions

1. **Restart both frontend and backend**:
   ```bash
   # Terminal 1
   cd backend
   npm start
   
   # Terminal 2
   cd frontend
   npm start
   ```

2. **Clear browser cache and localStorage**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

3. **Check if document ID is valid**:
   - Look at the URL when clicking a document
   - Make sure the ID is not undefined or null

4. **Update API URL**:
   ```javascript
   // In frontend/src/services/api.js
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
   ```

Run through these steps and let me know what errors you see in the console!