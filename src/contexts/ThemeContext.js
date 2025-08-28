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
    focusColor: 'rgba(59, 130, 246, 0.25)',
    focusBorder: '#3b82f6',
    focusColorOuter: 'rgba(59, 130, 246, 0.1)',
    themeAccent: '#3b82f6',
    themeAccentLight: '#60a5fa',
    inputBgLight: '#ffffff',
    inputBgDark: '#fafafa',
    panelBg: 'rgba(255, 255, 255, 0.95)',
    separatorColor: 'rgb(0, 0, 0)'
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
    focusBorder: '#9ca3af',
    focusColorOuter: 'rgba(156, 163, 175, 0.15)',
    themeAccent: '#9ca3af',
    themeAccentLight: '#d1d5db',
    inputBgLight: '#111827',
    inputBgDark: '#0f172a',
    panelBg: 'rgba(17, 24, 39, 0.95)',
    separatorColor: 'rgb(255, 255, 255)'
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
    focusColor: 'rgba(245, 158, 11, 0.25)',
    focusBorder: '#f59e0b',
    focusColorOuter: 'rgba(245, 158, 11, 0.1)',
    themeAccent: '#f59e0b',
    themeAccentLight: '#fbbf24',
    inputBgLight: '#fffbeb',
    inputBgDark: '#fef3c7',
    panelBg: 'rgba(255, 251, 235, 0.95)',
    separatorColor: 'rgb(120, 53, 15)'
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
    focusColor: 'rgba(99, 102, 241, 0.25)',
    focusBorder: '#6366f1',
    focusColorOuter: 'rgba(99, 102, 241, 0.1)',
    themeAccent: '#6366f1',
    themeAccentLight: '#818cf8',
    inputBgLight: '#f8fafc',
    inputBgDark: '#f1f5f9',
    panelBg: 'rgba(248, 250, 252, 0.95)',
    separatorColor: 'rgb(71, 85, 105)'
  },
  dark: {
    name: 'dark',
    bg: 'premium-dark',
    text: 'text-slate-100 glow-text',
    textSecondary: 'text-slate-300',
    textTertiary: 'text-slate-400',
    border: 'border-slate-700',
    borderHover: 'hover:border-slate-600',
    borderSecondary: 'border-slate-800',
    borderSecondaryHover: 'hover:border-slate-700',
    buttonHover: 'hover:bg-slate-800',
    inputBg: 'bg-slate-800',
    ring: 'ring-slate-600',
    textDestructive: 'hover:text-red-400',
    focusColor: 'rgba(59, 130, 246, 0.4)',
    focusBorder: '#3b82f6',
    focusColorOuter: 'rgba(59, 130, 246, 0.2)',
    themeAccent: '#3b82f6',
    themeAccentLight: '#60a5fa',
    inputBgLight: '#1e293b',
    inputBgDark: '#0f172a',
    panelBg: 'rgba(30, 41, 59, 0.95)',
    separatorColor: 'rgb(148, 163, 184)'
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