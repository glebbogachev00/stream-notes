import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { currentTheme, switchTheme, themes, theme } = useTheme();

  const handleToggle = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    switchTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-2 py-1 dynamic-text-base font-light transition-all duration-200 ${theme.textTertiary} ${theme.buttonHover}`}
      title={`Current theme: ${currentTheme}. Click to cycle themes.`}
    >
      [{currentTheme}]
    </button>
  );
};

export default ThemeToggle;