import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEMES = {
  white: {
    name: 'white',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-gray-700',
    textTertiary: 'text-gray-500',
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    borderSecondary: 'border-gray-100',
    borderSecondaryHover: 'hover:border-gray-200',
    buttonHover: 'hover:bg-gray-50',
    inputBg: 'bg-white',
    ring: 'ring-gray-300',
    textDestructive: 'hover:text-red-500',
    focusColor: 'rgba(59, 130, 246, 0.3)',
    focusBorder: '#3b82f6'
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
    inputBg: 'bg-gray-900',
    ring: 'ring-gray-700',
    textDestructive: 'hover:text-red-500',
    focusColor: 'rgba(156, 163, 175, 0.3)',
    focusBorder: '#9ca3af'
  },
  beige: {
    name: 'beige',
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    textSecondary: 'text-amber-800',
    textTertiary: 'text-amber-700',
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    borderSecondary: 'border-amber-100',
    borderSecondaryHover: 'hover:border-amber-200',
    buttonHover: 'hover:bg-amber-100',
    inputBg: 'bg-amber-50',
    ring: 'ring-amber-300',
    textDestructive: 'hover:text-red-500',
    focusColor: 'rgba(245, 158, 11, 0.3)',
    focusBorder: '#f59e0b'
  },
  blue: {
    name: 'blue',
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textTertiary: 'text-slate-500',
    border: 'border-slate-200',
    borderHover: 'hover:border-slate-300',
    borderSecondary: 'border-slate-100',
    borderSecondaryHover: 'hover:border-slate-200',
    buttonHover: 'hover:bg-slate-100',
    inputBg: 'bg-slate-50',
    ring: 'ring-slate-300',
    textDestructive: 'hover:text-red-500',
    focusColor: 'rgba(99, 102, 241, 0.3)',
    focusBorder: '#6366f1'
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