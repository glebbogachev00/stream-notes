import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkMatrixUnlock } from '../utils/quoteDetection';

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
    inputBg: 'bg-gray-50',
    ring: 'ring-gray-300',
    textDestructive: 'hover:text-red-500',
    focusColor: 'rgba(59, 130, 246, 0.25)',
    focusBorder: '#3b82f6',
    focusColorOuter: 'rgba(59, 130, 246, 0.1)',
    themeAccent: '#3b82f6',
    themeAccentLight: '#60a5fa',
    inputBgLight: 'bg-gray-50',
    inputBgDark: 'bg-gray-100',
    panelBg: 'rgba(255, 255, 255, 0.95)',
    separatorColor: 'rgb(0, 0, 0)'
  },
  beige: {
    name: 'beige',
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    textSecondary: 'text-amber-900',
    textTertiary: 'text-amber-800',
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    borderSecondary: 'border-amber-100',
    borderSecondaryHover: 'hover:border-amber-200',
    buttonHover: 'hover:bg-amber-100',
    inputBg: 'bg-amber-50',
    ring: 'ring-amber-300',
    textDestructive: 'hover:text-red-500',
    focusColor: 'rgba(245, 158, 11, 0.25)',
    focusBorder: '#f59e0b',
    focusColorOuter: 'rgba(245, 158, 11, 0.1)',
    themeAccent: '#f59e0b',
    themeAccentLight: '#fbbf24',
    inputBgLight: 'bg-amber-100',
    inputBgDark: 'bg-amber-200',
    panelBg: 'rgba(255, 251, 235, 0.95)',
    separatorColor: 'rgb(120, 53, 15)'
  },
  dark: {
    name: 'dark',
    bg: 'bg-neutral-900',
    text: 'text-neutral-100',
    textSecondary: 'text-neutral-300',
    textTertiary: 'text-neutral-500',
    border: 'border-neutral-700',
    borderHover: 'hover:border-neutral-600',
    borderSecondary: 'border-neutral-800',
    borderSecondaryHover: 'hover:border-neutral-700',
    buttonHover: 'hover:bg-neutral-800',
    inputBg: 'bg-neutral-800',
    ring: 'ring-neutral-600',
    textDestructive: 'hover:text-red-400',
    focusColor: 'rgba(115, 115, 115, 0.3)',
    focusBorder: '#737373',
    focusColorOuter: 'rgba(115, 115, 115, 0.15)',
    themeAccent: '#737373',
    themeAccentLight: '#a3a3a3',
    inputBgLight: 'bg-neutral-800',
    inputBgDark: 'bg-neutral-700',
    panelBg: 'rgba(23, 23, 23, 0.95)',
    separatorColor: 'rgb(255, 255, 255)'
  },
  matrix: {
    name: 'matrix',
    bg: 'bg-black',
    text: 'text-green-400',
    textSecondary: 'text-green-500',
    textTertiary: 'text-green-600',
    border: 'border-green-800',
    borderHover: 'hover:border-green-700',
    borderSecondary: 'border-green-900',
    borderSecondaryHover: 'hover:border-green-800',
    buttonHover: 'hover:bg-green-950',
    inputBg: 'bg-green-950',
    ring: 'ring-green-600',
    textDestructive: 'hover:text-red-400',
    focusColor: 'rgba(34, 197, 94, 0.25)',
    focusBorder: '#22c55e',
    focusColorOuter: 'rgba(34, 197, 94, 0.1)',
    themeAccent: '#22c55e',
    themeAccentLight: '#4ade80',
    inputBgLight: 'bg-green-950',
    inputBgDark: 'bg-green-900',
    panelBg: 'rgba(0, 0, 0, 0.95)',
    separatorColor: 'rgb(34, 197, 94)'
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
  const [matrixUnlocked, setMatrixUnlocked] = useState(() => checkMatrixUnlock());

  useEffect(() => {
    localStorage.setItem('stream_theme', currentTheme);
  }, [currentTheme]);

  const switchTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const unlockMatrixTheme = () => {
    setMatrixUnlocked(true);
  };

  const getAvailableThemes = () => {
    const baseThemes = ['white', 'beige', 'dark'];
    return matrixUnlocked ? [...baseThemes, 'matrix'] : baseThemes;
  };

  const theme = THEMES[currentTheme];

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      theme, 
      switchTheme,
      themes: getAvailableThemes(),
      unlockMatrixTheme,
      matrixUnlocked
    }}>
      {children}
    </ThemeContext.Provider>
  );
};