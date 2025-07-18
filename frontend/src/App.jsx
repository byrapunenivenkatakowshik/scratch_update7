import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ReactDOMErrorBoundary from './components/ReactDOMErrorBoundary';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import SimpleEditorPage from './pages/SimpleEditorPage';
import Profile from './pages/Profile';

function App() {
  return (
    <ReactDOMErrorBoundary>
      <ThemeProvider>
        <ReactDOMErrorBoundary>
          <AuthProvider>
            <ReactDOMErrorBoundary>
              <Router>
                <div className="App">
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
                          <ReactDOMErrorBoundary>
                            <Dashboard />
                          </ReactDOMErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/editor/:id"
                      element={
                        <ProtectedRoute>
                          <ReactDOMErrorBoundary>
                            <EditorPage />
                          </ReactDOMErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ReactDOMErrorBoundary>
                            <Profile />
                          </ReactDOMErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </div>
              </Router>
            </ReactDOMErrorBoundary>
          </AuthProvider>
        </ReactDOMErrorBoundary>
      </ThemeProvider>
    </ReactDOMErrorBoundary>
  );
}

export default App;