import React from 'react';

class ReactDOMErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, errorId: Date.now() };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('=== REACT DOM ERROR BOUNDARY ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Check if it's a React DOM client error
    const isReactDOMError = error.stack && (
      error.stack.includes('react-dom') ||
      error.stack.includes('react-dom-client') ||
      error.stack.includes('createRoot') ||
      error.stack.includes('flushSync')
    );
    
    if (isReactDOMError) {
      console.error('🚨 React DOM Client Error detected!');
      console.error('This is likely a React 19 compatibility issue');
    }
    
    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Report to window for debugging
    window.lastReactError = {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  handleGoHome = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isReactDOMError = this.state.error && this.state.error.stack && (
        this.state.error.stack.includes('react-dom') ||
        this.state.error.stack.includes('react-dom-client')
      );

      return (
        <div style={{
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
              🚨 React Application Error
            </h2>
            
            {isReactDOMError && (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>
                  React DOM Client Error Detected
                </h3>
                <p style={{ color: '#856404', margin: 0 }}>
                  This appears to be a React 19 compatibility issue. Try the solutions below.
                </p>
              </div>
            )}

            <p style={{ marginBottom: '20px' }}>
              The React application encountered an error and cannot continue. 
              Please try one of the recovery options below.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Recovery Options:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={this.handleRetry}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔃 Reload Page
                </button>
                
                <button
                  onClick={this.handleClearAndReload}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🧹 Clear Data & Reload
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🏠 Go Home
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  🔍 Error Details (Development Mode)
                </summary>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '4px',
                  marginTop: '10px'
                }}>
                  <h4>Error Message:</h4>
                  <p style={{ 
                    fontFamily: 'monospace', 
                    backgroundColor: '#e9ecef', 
                    padding: '10px', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {this.state.error?.message || 'No error message available'}
                  </p>
                  
                  <h4>Error Stack:</h4>
                  <pre style={{
                    backgroundColor: '#e9ecef',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {this.state.error?.stack || 'No stack trace available'}
                  </pre>
                  
                  <h4>Component Stack:</h4>
                  <pre style={{
                    backgroundColor: '#e9ecef',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {this.state.errorInfo?.componentStack || 'No component stack available'}
                  </pre>
                </div>
              </details>
            )}

            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>💡 Troubleshooting Tips:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>If this keeps happening, try downgrading React to version 18</li>
                <li>Check browser console for additional error details</li>
                <li>Ensure all packages are compatible with React 19</li>
                <li>Try disabling browser extensions</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ReactDOMErrorBoundary;