import React from 'react';
import { Plus, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  isOpen = false,
  icon,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 z-50 flex items-center justify-center ${className}`}
    >
      <div className="transition-transform duration-300">
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          icon || <Plus className="w-6 h-6" />
        )}
      </div>
    </button>
  );
};

export default FloatingActionButton;
