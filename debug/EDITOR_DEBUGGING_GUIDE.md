# Editor Issue Debugging Guide

## 🚨 Identified Issues

### Primary Issue: React 19 Compatibility
Your project is using React 19 (^19.1.0) which may cause compatibility issues with some dependencies.

### Fixed Issues:
1. ✅ **AuthContext API_URL undefined** - Fixed by importing config
2. ✅ **useWebRTC callback dependency** - Fixed by moving handleCursorUpdate definition
3. ✅ **Missing useCallback import** - Added to EditorPage.jsx

## 🔍 Step-by-Step Debugging

### Step 1: Check Backend Connection
```bash
# Start backend server
cd backend
npm run dev

# Test in another terminal
curl http://localhost:5000/health
```

### Step 2: Check Frontend
```bash
# Start frontend server
cd frontend
npm run dev

# Open browser and check console
# Visit: http://localhost:5173/login
```

### Step 3: Test Authentication Flow
1. Go to `/login` page
2. Try to register a new user or login
3. Check browser console for errors
4. Check network tab for failed API calls

### Step 4: Test Dashboard Access
1. After login, go to `/dashboard`
2. Try to create a new document
3. Check if document creation works

### Step 5: Test Editor Access
1. From dashboard, click on a document
2. Check if editor loads or shows error boundary
3. Check browser console for specific errors

## 🐛 Common Error Patterns

### If you see "Something went wrong" error boundary:
1. Open browser developer tools
2. Check console for React errors
3. Look for errors containing:
   - `react-dom`
   - `createRoot`
   - `flushSync`
   - `useWebRTC`
   - `useSocket`

### If authentication fails:
1. Check backend logs for auth errors
2. Verify Firebase credentials in backend/.env
3. Check if JWT_SECRET is set

### If editor shows blank or crashes:
1. Check if TipTap extensions are compatible with React 19
2. Look for socket connection errors
3. Check if useWebRTC is causing issues

## 🔧 Potential Solutions

### Solution 1: React 19 Compatibility Issues
If you're seeing React 19 compatibility errors, consider downgrading:

```bash
cd frontend
npm install react@18.2.0 react-dom@18.2.0
npm install @types/react@18.2.0 @types/react-dom@18.2.0
```

### Solution 2: TipTap Compatibility
If TipTap is causing issues with React 19:

```bash
cd frontend
npm install @tiptap/react@2.1.0 @tiptap/starter-kit@2.1.0
# Update all @tiptap packages to version 2.x
```

### Solution 3: WebRTC Issues
If WebRTC is causing problems, you can temporarily disable it:

1. Comment out WebRTC usage in EditorPage.jsx
2. Remove WebRTC-related code from Editor.jsx
3. Test if basic editor works

### Solution 4: Socket.io Issues
If socket connection fails:

1. Check backend server is running
2. Check CORS settings in backend/server.js
3. Verify socket.io client version compatibility

## 🧪 Test Commands

### Test Backend Health
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Frontend Build
```bash
cd frontend
npm run build
```

### Test Frontend in Development
```bash
cd frontend
npm run dev
```

## 📋 Debugging Checklist

**Backend Issues:**
- [ ] Backend server starts without errors
- [ ] Health endpoint returns 200
- [ ] Firebase credentials are valid
- [ ] JWT_SECRET is set
- [ ] Socket.io server initializes correctly

**Frontend Issues:**
- [ ] Frontend builds without errors
- [ ] Login page loads
- [ ] Authentication works
- [ ] Dashboard loads
- [ ] Document creation works
- [ ] Editor component loads

**React 19 Specific Issues:**
- [ ] Check for React DOM client errors
- [ ] Check for createRoot errors
- [ ] Check for flushSync errors
- [ ] Check for hook compatibility issues

## 🔍 Browser Console Commands

Open browser console and run:

```javascript
// Check if React is loaded
console.log('React version:', React.version);

// Check for authentication
console.log('Auth token:', localStorage.getItem('token'));

// Check for errors
console.log('Last React error:', window.lastReactError);

// Check socket connection
console.log('Socket status:', window.socket?.connected);
```

## 📞 Next Steps

1. **Follow the debugging steps above**
2. **Check specific error messages in browser console**
3. **Test each component individually**
4. **Consider React downgrade if needed**
5. **Report specific error messages for targeted fixes**

## 🎯 Quick Fix Attempt

If you want to try a quick fix for React 19 issues:

```bash
# In frontend directory
npm install react@18.2.0 react-dom@18.2.0
npm install @types/react@18.2.0 @types/react-dom@18.2.0
npm run dev
```

This should resolve most React 19 compatibility issues with the current codebase.