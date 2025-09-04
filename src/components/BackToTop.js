import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const BackToTop = () => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 p-3 ${theme.textSecondary} hover:${theme.text} transition-all duration-300 opacity-80 hover:opacity-100 z-50 rounded-full bg-opacity-20 ${theme.bg === 'bg-white' ? 'bg-black' : theme.bg === 'bg-amber-50' ? 'bg-amber-900' : 'bg-white'} hover:bg-opacity-30`}
      aria-label="Back to top"
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M4.5 15.75l7.5-7.5 7.5 7.5" 
        />
      </svg>
    </button>
  );
};

export default BackToTop;