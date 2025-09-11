import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';
import { AuthProvider } from './components/AuthProvider';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import OTPModal from './components/auth/OTPModal';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import SubmitAgent from './components/pages/SubmitAgent';
import MyAgents from './components/pages/MyAgents';
import ReviewAgents from './components/admin/ReviewAgents';
import UserManagement from './components/admin/UserManagement';
import Profile from './components/pages/Profile';
import { OTPResponse } from './types';
import './styles/globals.css';

// Auth Page Component
const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [otpData, setOTPData] = useState<(OTPResponse & { username: string }) | null>(null);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleOTPRequired = (data: OTPResponse & { username: string }) => {
    setOTPData(data);
    setShowOTP(true);
  };

  const handleOTPClose = () => {
    setShowOTP(false);
    setOTPData(null);
  };

  const handleRegistrationSuccess = () => {
    setIsLogin(true);
  };

  return (
    <AuthLayout
      title={isLogin ? 'Welcome Back' : 'Create Account'}
      subtitle={isLogin ? 'Sign in to your account' : 'Join the AI Agent community'}
    >
      {isLogin ? (
        <LoginForm
          onOTPRequired={handleOTPRequired}
          onSwitchToRegister={() => setIsLogin(false)}
        />
      ) : (
        <RegisterForm
          onSwitchToLogin={() => setIsLogin(true)}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}

      {/* OTP Modal */}
      {showOTP && otpData && (
        <OTPModal
          isOpen={showOTP}
          onClose={handleOTPClose}
          username={otpData.username}
          otpCode={otpData.otp_code}
          expiresInMinutes={otpData.expires_in_minutes}
        />
      )}
    </AuthLayout>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!user.roles.includes('admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Main App Router Component
const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit"
          element={
            <ProtectedRoute>
              <Layout><SubmitAgent /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-agents"
          element={
            <ProtectedRoute>
              <Layout><MyAgents /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/review-agents"
          element={
            <AdminRoute>
              <Layout><ReviewAgents /></Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Layout><UserManagement /></Layout>
            </AdminRoute>
          }
        />
        <Route path="/admin" element={<AdminRoute><Navigate to="/admin/review-agents" replace /></AdminRoute>} />
      </Routes>
    </Router>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppRouter />
      </div>
    </AuthProvider>
  );
};

export default App;