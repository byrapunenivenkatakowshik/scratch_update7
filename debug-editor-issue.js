// Debug script to help identify the editor issue

console.log('🔍 Debugging Editor Issue - Run this from the frontend directory');

// Check if the required dependencies are installed
const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');
const packagePath = path.join(frontendPath, 'package.json');

if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  console.log('📦 Package.json dependencies:');
  console.log('- React version:', packageJson.dependencies?.react);
  console.log('- React DOM version:', packageJson.dependencies?.['react-dom']);
  console.log('- React Router version:', packageJson.dependencies?.['react-router-dom']);
  console.log('- TipTap version:', packageJson.dependencies?.['@tiptap/react']);
  console.log('- Socket.io client version:', packageJson.dependencies?.['socket.io-client']);
  
  // Check for potential issues
  const reactVersion = packageJson.dependencies?.react;
  if (reactVersion && reactVersion.startsWith('19')) {
    console.log('⚠️  React 19 detected - this may cause compatibility issues');
  }
  
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Check browser console for specific error messages');
  console.log('2. Verify backend is running on port 5000');
  console.log('3. Check if Firebase credentials are properly configured');
  console.log('4. Try accessing /login first to authenticate');
  console.log('5. Check network tab for failed API requests');
  
  console.log('\n🐛 Common issues to check:');
  console.log('- AuthContext: API_URL was undefined (fixed)');
  console.log('- useWebRTC: Missing callback dependency (fixed)');
  console.log('- Error boundary: May be catching React 19 issues');
  console.log('- Socket connection: Check if backend is accessible');
  
  console.log('\n📋 Test checklist:');
  console.log('☐ Backend server running (npm run dev in backend/)');
  console.log('☐ Frontend server running (npm run dev in frontend/)');
  console.log('☐ User can access /login page');
  console.log('☐ User can register/login successfully');
  console.log('☐ User can access /dashboard');
  console.log('☐ User can create a new document');
  console.log('☐ User can access /editor/:id');
  
  console.log('\n🔍 Debug URLs to test:');
  console.log('- Frontend: http://localhost:5173 (or 5174)');
  console.log('- Backend API: http://localhost:5000/api');
  console.log('- Health check: http://localhost:5000/health');
  console.log('- Login: http://localhost:5173/login');
  console.log('- Dashboard: http://localhost:5173/dashboard');
  
} else {
  console.log('❌ Package.json not found. Run this from the project root directory.');
}

console.log('\n🚀 Quick fix commands:');
console.log('cd frontend && npm install');
console.log('cd backend && npm install');
console.log('cd backend && npm run dev');
console.log('cd frontend && npm run dev');