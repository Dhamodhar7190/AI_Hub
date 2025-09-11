import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      button: 'danger' as const
    },
    warning: {
      icon: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20', 
      button: 'primary' as const
    },
    info: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      button: 'primary' as const
    }
  };

  const style = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'}>
      <div className="space-y-6">
        <div className={`flex items-center gap-4 p-4 rounded-lg border ${style.bg}`}>
          <AlertTriangle className={`w-8 h-8 ${style.icon} flex-shrink-0`} />
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={style.button}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;