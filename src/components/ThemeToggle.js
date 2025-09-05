import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, switchTheme, themes } = useTheme();

  const handleToggle = () => {
    const currentIndex = themes.indexOf(theme.name);
    const nextIndex = (currentIndex + 1) % themes.length;
    switchTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-2 py-1 dynamic-text-base font-light transition-all duration-200 ${theme.textTertiary} ${theme.buttonHover}`}
      title={`Current theme: ${theme.name}. Click to cycle themes.`}
    >
      [{theme.name}]
    </button>
  );
};

export default ThemeToggle;