import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEMES = {
  white: {
    name: 'white',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-400',
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    borderSecondary: 'border-gray-100',
    borderSecondaryHover: 'hover:border-gray-200',
    buttonHover: 'hover:bg-gray-50',
    inputBg: 'bg-transparent'
  },
  black: {
    name: 'black',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    textTertiary: 'text-gray-600',
    border: 'border-gray-800',
    borderHover: 'hover:border-gray-700',
    borderSecondary: 'border-gray-900',
    borderSecondaryHover: 'hover:border-gray-800',
    buttonHover: 'hover:bg-gray-900',
    inputBg: 'bg-transparent'
  },
  grey: {
    name: 'grey',
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textTertiary: 'text-gray-500',
    border: 'border-gray-300',
    borderHover: 'hover:border-gray-400',
    borderSecondary: 'border-gray-200',
    borderSecondaryHover: 'hover:border-gray-300',
    buttonHover: 'hover:bg-gray-200',
    inputBg: 'bg-transparent'
  },
  beige: {
    name: 'beige',
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    textSecondary: 'text-amber-800',
    textTertiary: 'text-amber-600',
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    borderSecondary: 'border-amber-100',
    borderSecondaryHover: 'hover:border-amber-200',
    buttonHover: 'hover:bg-amber-100',
    inputBg: 'bg-transparent'
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('stream_theme');
    return saved && THEMES[saved] ? saved : 'white';
  });

  useEffect(() => {
    localStorage.setItem('stream_theme', currentTheme);
  }, [currentTheme]);

  const switchTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const theme = THEMES[currentTheme];

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      theme, 
      switchTheme,
      themes: Object.keys(THEMES)
    }}>
      {children}
    </ThemeContext.Provider>
  );
};