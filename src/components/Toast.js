import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Toast = ({ message, onClose, duration = 2000 }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className={`px-4 py-3 rounded-lg ${theme.bg} ${theme.text} ${theme.border} border backdrop-blur-sm shadow-lg`}>
        <p className="text-sm font-light">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Toast;