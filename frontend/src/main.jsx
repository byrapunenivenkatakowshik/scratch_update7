import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReactDOMErrorBoundary from './components/ReactDOMErrorBoundary.jsx'

// Global error handler for React DOM errors (must be set before createRoot)
window.addEventListener('error', (event) => {
  console.error('Global error handler:', event.error);
  
  if (event.error && event.error.stack && 
      (event.error.stack.includes('react-dom') || 
       event.error.stack.includes('createRoot') ||
       event.error.stack.includes('flushSync'))) {
    console.error('🚨 React DOM Client Error detected globally');
    event.preventDefault(); // Prevent default browser error handling
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (event.reason && event.reason.stack && event.reason.stack.includes('react-dom')) {
    console.error('🚨 React DOM promise rejection detected');
  }
});

// Get the root element with error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found. Make sure you have a div with id="root" in your HTML.');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found. Please refresh the page.</div>';
  throw new Error('Root element not found');
}

// Create root with comprehensive error handling
let root;
try {
  root = createRoot(rootElement);
  console.log('✅ React root created successfully');
} catch (error) {
  console.error('❌ Error creating React root:', error);
  
  // Emergency fallback - render error message directly
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial, sans-serif; text-align: center;">
      <h2>🚨 React Root Creation Error</h2>
      <p>Failed to create React root. This is likely a React 19 compatibility issue.</p>
      <p>Error: ${error.message}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin: 10px;">Reload Page</button>
      <button onclick="localStorage.clear(); window.location.reload()" style="padding: 10px 20px; margin: 10px;">Clear Data & Reload</button>
    </div>
  `;
  throw error;
}

// Render with multiple error boundaries
if (root) {
  try {
    // Wrap the entire app with React DOM error boundary
    root.render(
      <ReactDOMErrorBoundary>
        <App />
      </ReactDOMErrorBoundary>
    );
    console.log('✅ React app rendered successfully');
  } catch (error) {
    console.error('❌ React rendering error:', error);
    
    // Emergency fallback - render a simple error message
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial, sans-serif; text-align: center;">
        <h2>🚨 React Rendering Error</h2>
        <p>There was an error rendering the React application.</p>
        <p>Error: ${error.message}</p>
        <div style="margin: 20px 0;">
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin: 10px;">Reload Page</button>
          <button onclick="localStorage.clear(); window.location.reload()" style="padding: 10px 20px; margin: 10px;">Clear Data & Reload</button>
          <button onclick="window.location.href='/'" style="padding: 10px 20px; margin: 10px;">Go Home</button>
        </div>
        <details style="text-align: left; margin-top: 20px;">
          <summary style="cursor: pointer;">Show Error Details</summary>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 12px;">${error.stack}</pre>
        </details>
      </div>
    `;
  }
}