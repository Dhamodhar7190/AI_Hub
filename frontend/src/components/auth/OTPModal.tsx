import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  otpCode: string; // Still needed for backend compatibility
  expiresInMinutes: number;
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  email,
  otpCode: _otpCode, // Rename to indicate it's unused in UI
  expiresInMinutes
}) => {
  const [enteredOTP, setEnteredOTP] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(expiresInMinutes * 60); // Convert to seconds
  const { verifyOTP, isLoading } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('OTP has expired. Please try logging in again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!enteredOTP.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (enteredOTP.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    try {
      await verifyOTP(email, enteredOTP);
      // Auth hook will handle the successful login
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setEnteredOTP(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with animated background */}
      <div className="fixed inset-0 bg-black/90">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-black to-orange-600/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4 relative">
        <div className="relative bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl border border-orange-500/20 shadow-2xl max-w-md w-full">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="space-y-4">
            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center">Enter OTP Code</h2>

            {/* Info Message */}
            <div className="text-center text-sm text-gray-400">
              <p>We've sent a verification code to <span className="text-orange-400 font-medium">{email}</span></p>
              <p className="mt-1">Please check your inbox and enter the code below.</p>
            </div>

            {/* Timer */}
            <div className="text-center py-2">
              <p className="text-gray-400 text-sm mb-1">Time remaining:</p>
              <p className={`text-xl font-mono font-bold ${
                timeLeft < 60 ? 'text-red-400' : 'text-orange-400'
              }`}>
                {formatTime(timeLeft)}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/20 border-2 border-red-500/50 text-red-300 text-sm font-medium shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  {error}
                </div>
              </div>
            )}

            {/* OTP Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={enteredOTP}
                  onChange={handleOTPChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl font-mono tracking-wider focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={timeLeft === 0}
                className="w-full"
              >
                <Shield className="w-5 h-5 mr-2" />
                Verify OTP
              </Button>
            </form>

            {/* Instructions */}
            <div className="text-center text-xs text-gray-400">
              <p>
                Didn't receive the code? Check your spam folder or try logging in again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;