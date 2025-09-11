import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks';
import { VALIDATION_RULES } from '../../utils/constants';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState('');
  const { isLoading } = useAuth();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION_RULES.email.pattern.test(formData.email)) {
      newErrors.email = VALIDATION_RULES.email.message;
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < VALIDATION_RULES.username.minLength) {
      newErrors.username = VALIDATION_RULES.username.message;
    } else if (!VALIDATION_RULES.username.pattern.test(formData.username)) {
      newErrors.username = VALIDATION_RULES.username.message;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION_RULES.password.minLength) {
      newErrors.password = VALIDATION_RULES.password.message;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Registration successful! Please wait for admin approval.');
        setFormData({
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
        });
      } else {
        setMessage(result.detail || 'Registration failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div>
      {message && (
        <div className={`mb-4 p-4 rounded-lg text-sm font-medium shadow-lg ${
          message.includes('successful') 
            ? 'bg-green-500/20 border-2 border-green-500/50 text-green-300'
            : 'bg-red-500/20 border-2 border-red-500/50 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              message.includes('successful') ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {message}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
            placeholder="Enter your email"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
            placeholder="Choose a username"
            autoComplete="username"
          />
          {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
            placeholder="Choose a password"
            autoComplete="new-password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Register
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
        >
          Already have an account? Login here
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;