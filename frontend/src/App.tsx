import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';
import { AuthProvider } from './components/AuthProvider';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import OTPModal from './components/auth/OTPModal';
import RegistrationOTPModal from './components/auth/RegistrationOTPModal';
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
  const [showLoginOTP, setShowLoginOTP] = useState(false);
  const [showRegisterOTP, setShowRegisterOTP] = useState(false);
  const [loginOTPData, setLoginOTPData] = useState<(OTPResponse & { email: string }) | null>(null);
  const [registerOTPData, setRegisterOTPData] = useState<{ message: string; otp_code: string; expires_in_minutes: number; email: string } | null>(null);
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

  const handleLoginOTPRequired = (data: OTPResponse & { email: string }) => {
    setLoginOTPData(data);
    setShowLoginOTP(true);
  };

  const handleLoginOTPClose = () => {
    setShowLoginOTP(false);
    setLoginOTPData(null);
  };

  const handleRegisterOTPRequired = (data: { message: string; otp_code: string; expires_in_minutes: number; email: string }) => {
    setRegisterOTPData(data);
    setShowRegisterOTP(true);
  };

  const handleRegisterOTPClose = () => {
    setShowRegisterOTP(false);
    setRegisterOTPData(null);
  };

  const handleRegistrationSuccess = () => {
    setShowRegisterOTP(false);
    setRegisterOTPData(null);
    setIsLogin(true);
  };

  return (
    <AuthLayout
      title={isLogin ? 'Welcome Back' : 'Create Account'}
      subtitle={isLogin ? 'Sign in to your account' : 'Join the AI Agent community'}
    >
      {isLogin ? (
        <LoginForm
          onOTPRequired={handleLoginOTPRequired}
          onSwitchToRegister={() => setIsLogin(false)}
        />
      ) : (
        <RegisterForm
          onSwitchToLogin={() => setIsLogin(true)}
          onRegistrationSuccess={handleRegistrationSuccess}
          onOTPRequired={handleRegisterOTPRequired}
        />
      )}

      {/* Login OTP Modal */}
      {showLoginOTP && loginOTPData && (
        <OTPModal
          isOpen={showLoginOTP}
          onClose={handleLoginOTPClose}
          email={loginOTPData.email}
          otpCode={loginOTPData.otp_code}
          expiresInMinutes={loginOTPData.expires_in_minutes}
        />
      )}

      {/* Registration OTP Modal */}
      {showRegisterOTP && registerOTPData && (
        <RegistrationOTPModal
          isOpen={showRegisterOTP}
          onClose={handleRegisterOTPClose}
          email={registerOTPData.email}
          otpCode={registerOTPData.otp_code}
          expiresInMinutes={registerOTPData.expires_in_minutes}
          onSuccess={handleRegistrationSuccess}
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