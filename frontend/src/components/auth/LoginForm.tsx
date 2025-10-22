import React, { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks';
import { OTPResponse } from '../../types';

interface LoginFormProps {
  onOTPRequired: (otpData: OTPResponse & { email: string }) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onOTPRequired, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // const response = await fetch(`http://13.200.13.37:8000/api/v1/auth/login`, { // Production server
      const response = await fetch(`http://localhost:8000/api/v1/auth/login`, { // Local development
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        onOTPRequired({ ...result, email });
      } else {
        // Handle validation errors
        if (Array.isArray(result.detail)) {
          setError(result.detail[0]?.msg || 'Login failed');
        } else if (typeof result.detail === 'string') {
          setError(result.detail);
        } else {
          setError('Login failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/20 border-2 border-red-500/50 text-red-300 text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Send OTP
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToRegister}
          className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
        >
          Don't have an account? Register here
        </button>
      </div>
    </div>
  );
};

export default LoginForm;