import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onDismiss, 
  className = '',
  variant = 'error'
}) => {
  const variantClasses = {
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };

  const iconColor = {
    error: 'text-red-400',
    warning: 'text-yellow-400', 
    info: 'text-blue-400'
  };

  return (
    <div className={`border rounded-lg p-4 flex items-center gap-3 ${variantClasses[variant]} ${className}`}>
      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${iconColor[variant]}`} />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`hover:opacity-70 transition-opacity ${iconColor[variant]}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;