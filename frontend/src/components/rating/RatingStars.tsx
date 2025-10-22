import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onChange,
  readonly = false,
  size = 'md',
  showCount = false,
  count = 0
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={`
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            transition-transform duration-150
            ${readonly ? '' : 'focus:outline-none focus:ring-2 focus:ring-orange-500 rounded'}
          `}
        >
          <Star
            className={`
              ${sizeClasses[size]}
              ${star <= rating ? 'fill-orange-500 text-orange-500' : 'text-gray-400'}
              transition-colors duration-150
            `}
          />
        </button>
      ))}
      {showCount && count > 0 && (
        <span className="text-sm text-gray-400 ml-2">({count})</span>
      )}
    </div>
  );
};

export default RatingStars;
