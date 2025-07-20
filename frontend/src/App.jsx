import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Landing = lazy(() => import('./pages/Landing'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const Profile = lazy(() => import('./pages/Profile'));

const LoadingFallback = () => (
  <div className="loading-container" style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <div>Loading...</div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Dashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/editor/:id"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <EditorPage />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Profile />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <h2>404 - Page Not Found</h2>
                      <p>The page you're looking for doesn't exist.</p>
                    </div>
                  } />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;