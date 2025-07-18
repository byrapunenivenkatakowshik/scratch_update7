import React from 'react';
import '../styles/ErrorBoundary.css';

class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorDetails: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Props:', this.props);
    console.error('Stack:', error.stack);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        componentStack: errorInfo.componentStack
      }
    });

    // Report to console for debugging
    if (window.DEBUG || process.env.NODE_ENV === 'development') {
      console.group('🚨 Detailed Error Information');
      console.log('Error Message:', error.message);
      console.log('Error Name:', error.name);
      console.log('Error Stack:', error.stack);
      console.log('Component Stack:', errorInfo.componentStack);
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      console.log('Local Storage:', localStorage.getItem('token') ? 'Token exists' : 'No token');
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <h2 className="error-boundary-title">🚨 Application Error</h2>
            <p className="error-boundary-message">
              Something went wrong. This error has been logged for debugging.
            </p>
            
            <div className="error-boundary-actions">
              <button 
                onClick={() => window.location.reload()}
                className="error-boundary-button"
              >
                🔄 Reload Page
              </button>
              
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="error-boundary-button"
              >
                🏠 Go Home & Clear Data
              </button>
            </div>

            {(window.DEBUG || process.env.NODE_ENV === 'development') && (
              <details className="error-boundary-details">
                <summary>🔍 Debug Information (Click to expand)</summary>
                <div className="error-boundary-debug">
                  <h4>Error Details:</h4>
                  <p><strong>Message:</strong> {this.state.error?.message}</p>
                  <p><strong>Type:</strong> {this.state.error?.name}</p>
                  <p><strong>URL:</strong> {window.location.href}</p>
                  
                  <h4>Stack Trace:</h4>
                  <pre className="error-boundary-stack">
                    {this.state.error?.stack}
                  </pre>
                  
                  <h4>Component Stack:</h4>
                  <pre className="error-boundary-stack">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                  
                  <h4>Props:</h4>
                  <pre className="error-boundary-stack">
                    {JSON.stringify(this.props, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DebugErrorBoundary;