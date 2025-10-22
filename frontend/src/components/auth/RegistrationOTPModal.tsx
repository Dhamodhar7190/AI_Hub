import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface RegistrationOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  otpCode: string;
  expiresInMinutes: number;
  onSuccess: () => void;
}

const RegistrationOTPModal: React.FC<RegistrationOTPModalProps> = ({
  isOpen,
  onClose,
  email,
  otpCode,
  expiresInMinutes,
  onSuccess
}) => {
  const [enteredOTP, setEnteredOTP] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiresInMinutes * 60); // Convert to seconds
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('OTP has expired. Please register again.');
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

  const handleCopyOTP = async () => {
    try {
      await navigator.clipboard.writeText(otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = otpCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!enteredOTP.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (enteredOTP.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      // const response = await fetch(`http://13.200.13.37:8000/api/v1/auth/verify-registration-otp`, { // Production server
      const response = await fetch(`http://localhost:8000/api/v1/auth/verify-registration-otp`, { // Local development
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp_code: enteredOTP,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || 'Email verified successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        if (Array.isArray(result.detail)) {
          setError(result.detail[0]?.msg || 'Invalid OTP code');
        } else if (typeof result.detail === 'string') {
          setError(result.detail);
        } else {
          setError('Invalid OTP code');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setEnteredOTP(value);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Your Email">
      <div className="space-y-6">
        {/* OTP Display for Testing */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h4 className="font-medium text-blue-400">Email Verification</h4>
          </div>
          <p className="text-sm text-blue-300 mb-3">
            We've sent a verification code to <strong>{email}</strong>
          </p>

          {/* OTP Display */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Your OTP Code:</p>
                <p className="text-2xl font-mono font-bold text-orange-400 tracking-wider">
                  {otpCode}
                </p>
              </div>
              <button
                onClick={handleCopyOTP}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-300" />
                    <span className="text-gray-300">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-gray-300 mb-2">Time remaining:</p>
          <p className={`text-2xl font-mono font-bold ${
            timeLeft < 60 ? 'text-red-400' : 'text-orange-400'
          }`}>
            {formatTime(timeLeft)}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Enter the 6-digit OTP code
            </label>
            <input
              type="text"
              value={enteredOTP}
              onChange={handleOTPChange}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl font-mono tracking-wider focus:border-orange-500 focus:outline-none transition-colors"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Copy the code above or enter it manually
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={timeLeft === 0 || !!success}
              className="flex-1"
            >
              Verify Email
            </Button>
          </div>
        </form>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-400">
          <p>
            Use the code displayed above for testing purposes.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default RegistrationOTPModal;
