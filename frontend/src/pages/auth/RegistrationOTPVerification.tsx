import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { apiService } from '../../services/api';

const RegistrationOTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { email, expiresInMinutes } = location.state || {};

  const [otpCode, setOtpCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(expiresInMinutes ? expiresInMinutes * 60 : 300);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    if (timeLeft === 0) {
      setError('OTP has expired. Please register again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.verifyRegistrationOTP({
        email,
        otp_code: otpCode
      });

      setIsVerified(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/', {
          state: {
            message: 'Registration successful! Your account is pending admin approval.'
          }
        });
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail[0]?.msg || 'Invalid OTP code');
        } else if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else {
          setError('Invalid OTP code');
        }
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
    setError('');
  };

  if (isVerified) {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your registration is complete"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white text-lg">Registration Successful!</p>
            <p className="text-gray-400 text-sm">
              Your account is pending admin approval. You will be able to login once approved.
            </p>
          </div>

          <div className="pt-4">
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={
        <div className="text-center">
          <p className="text-gray-400">We've sent a verification code to</p>
          <p className="text-orange-500 font-medium mt-1">{email}</p>
          <p className="text-gray-400 mt-2">Please check your inbox and enter the code below.</p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">Time remaining:</p>
          <p className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-orange-500'}`}>
            {formatTime(timeLeft)}
          </p>
        </div>

        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
            OTP Code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={otpCode}
            onChange={handleOTPChange}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-center text-2xl tracking-widest"
            placeholder="000000"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || otpCode.length !== 6 || timeLeft === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Shield className="w-5 h-5" />
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
        </button>

        <p className="text-center text-sm text-gray-400">
          Didn't receive the code? Check your spam folder or try registering again.
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full text-orange-500 hover:text-orange-400 text-sm transition-colors"
        >
          Back to Login
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegistrationOTPVerification;
