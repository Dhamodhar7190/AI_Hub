import React, { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks';
import { OTPResponse } from '../../types';

interface LoginFormProps {
  onOTPRequired: (otpData: OTPResponse & { username: string }) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onOTPRequired, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://13.200.13.37:8000/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (response.ok) {
        onOTPRequired({ ...result, username });
      } else {
        setError(result.detail || 'Login failed');
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
          <label className="block text-gray-300 mb-2 font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="Enter your username"
            autoComplete="username"
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