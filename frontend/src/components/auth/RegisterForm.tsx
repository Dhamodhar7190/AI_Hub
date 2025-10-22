import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks';
import { VALIDATION_RULES } from '../../utils/constants';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isLoading } = useAuth();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION_RULES.email.pattern.test(formData.email)) {
      newErrors.email = VALIDATION_RULES.email.message;
    } else if (!formData.email.endsWith('@feuji.com')) {
      newErrors.email = 'Enter a Valid mail';
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
      const response = await fetch(`http://13.200.13.37:8000/api/v1/auth/register`, { // Production server
      // const response = await fetch(`http://localhost:8000/api/v1/auth/register`, { // Local development
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
        // Navigate to registration OTP verification page
        navigate('/verify-registration', {
          state: {
            email: formData.email,
            expiresInMinutes: result.expires_in_minutes
          }
        });
      } else {
        // Handle validation errors
        if (Array.isArray(result.detail)) {
          setMessage(result.detail[0]?.msg || 'Registration failed');
        } else if (typeof result.detail === 'string') {
          setMessage(result.detail);
        } else {
          setMessage('Registration failed');
        }
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 pr-12 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Choose a password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 pr-12 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
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