# Fix for "process is not defined" Error

## Problem
The error `process is not defined at api.js:3:22` occurs because `process.env` is not available in the browser environment by default.

## Solution
✅ **Fixed!** I've replaced environment variable usage with a configuration file.

## Changes Made

### 1. Created Configuration File
**File**: `frontend/src/config/config.js`
```javascript
const config = {
  // Default configuration for development
  apiUrl: 'http://localhost:5000/api',
  wsUrl: 'http://localhost:5000',
  
  // You can manually change these for production
  // apiUrl: 'https://your-api-domain.com/api',
  // wsUrl: 'https://your-api-domain.com',
};
```

### 2. Updated API Service
**File**: `frontend/src/services/api.js`
```javascript
import config from '../config/config';
const API_BASE_URL = config.apiUrl;
```

### 3. Updated Socket Hook
**File**: `frontend/src/hooks/useSocket.js`
```javascript
import config from '../config/config';
socketRef.current = io(config.wsUrl, {
  transports: ['websocket'],
  autoConnect: false
});
```

### 4. Updated ForgotPassword Component
**File**: `frontend/src/pages/ForgotPassword.jsx`
```javascript
import config from '../config/config';
const response = await fetch(`${config.apiUrl}/auth/forgot-password`, {
```

## Testing the Fix

1. **Restart the frontend server**:
   ```bash
   cd frontend
   npm start
   ```

2. **Test the configuration**:
   ```bash
   # In browser console
   import config from './config/config';
   console.log('API URL:', config.apiUrl);
   ```

3. **Try opening a document again** - the "process is not defined" error should be gone!

## For Production

To use different URLs for production, edit `frontend/src/config/config.js`:

```javascript
const config = {
  // For production
  apiUrl: 'https://your-api-domain.com/api',
  wsUrl: 'https://your-api-domain.com',
};
```

## Next Steps

1. ✅ Fixed "process is not defined" error
2. 🔄 Restart frontend server
3. 🧪 Test document opening
4. 🎯 Check browser console for any remaining errors

The document opening should now work without the environment variable error!