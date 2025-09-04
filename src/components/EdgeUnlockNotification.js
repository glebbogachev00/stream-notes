import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const EdgeUnlockNotification = ({ onClose }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`${theme.bg} ${theme.border} border px-4 py-3 shadow-lg max-w-xs`}>
        <div className={`dynamic-text-sm font-light ${theme.text}`}>
          New theme unlocked: Edge
        </div>
      </div>
    </div>
  );
};

export default EdgeUnlockNotification;