// Test script to verify error boundary functionality
// Run this in browser console after the app loads

console.log('🧪 Error Boundary Test Script');
console.log('==========================');

// Function to test error boundary
window.testErrorBoundary = function() {
  console.log('🔥 Testing error boundary...');
  
  // Create a React DOM error
  const error = new Error('Test React DOM error');
  error.stack = `Error: Test React DOM error
    at testErrorBoundary (test-error-boundary.js:1:1)
    at Object.createRoot (react-dom-client.development.js:123:45)
    at Object.render (react-dom-client.development.js:456:78)`;
  
  throw error;
};

// Function to test React DOM specific error
window.testReactDOMError = function() {
  console.log('🔥 Testing React DOM client error...');
  
  // Simulate a React DOM client error
  const error = new Error('Minified React error #418');
  error.stack = `Error: Minified React error #418
    at createRoot (react-dom-client.development.js:123:45)
    at Object.render (react-dom-client.development.js:456:78)
    at flushSync (react-dom-client.development.js:789:12)`;
  
  throw error;
};

// Function to check if error boundary is working
window.checkErrorBoundary = function() {
  console.log('🔍 Checking error boundary status...');
  
  // Check if ReactDOMErrorBoundary is available
  const hasErrorBoundary = window.React && window.React.Component;
  console.log('React Component available:', hasErrorBoundary);
  
  // Check if error boundary is in DOM
  const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
  console.log('Error boundaries found:', errorBoundaries.length);
  
  // Check for error boundary state
  if (window.lastReactError) {
    console.log('Last React error:', window.lastReactError);
  } else {
    console.log('No React errors recorded');
  }
};

// Function to simulate document opening error
window.testDocumentError = function() {
  console.log('🔥 Testing document-specific error...');
  
  // Try to trigger the error that occurs when opening documents
  const error = new Error('Cannot read properties of undefined (reading \'cursorPosition\')');
  error.stack = `TypeError: Cannot read properties of undefined (reading 'cursorPosition')
    at Editor.jsx:258:45
    at Array.map (<anonymous>)
    at Editor.jsx:252:23
    at React.createElement (react.development.js:123:45)`;
  
  throw error;
};

// Auto-run check
console.log('📋 Available test functions:');
console.log('- testErrorBoundary() - Test basic error boundary');
console.log('- testReactDOMError() - Test React DOM client error');
console.log('- testDocumentError() - Test document-specific error');
console.log('- checkErrorBoundary() - Check error boundary status');

// Run initial check
checkErrorBoundary();

console.log('\n🎯 To test the error boundary, run:');
console.log('testReactDOMError()');