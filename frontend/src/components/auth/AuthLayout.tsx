import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-black to-orange-600/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl border border-orange-500/20 shadow-2xl max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4">
            <span className="text-2xl font-bold text-white">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">FARM</h1>
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          {subtitle && (
            <p className="text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Form Content */}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;