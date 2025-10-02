import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkMatrixUnlock } from '../utils/quoteDetection';

const ThemeContext = createContext();

const THEMES = {
  white: {
    name: 'white',
    bg: 'bg-gradient-to-br from-white to-gray-50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textTertiary: 'text-gray-500',
    bgSecondary: 'bg-white/70',
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
    separatorColor: 'rgb(55, 65, 81)'
  },
  beige: {
    name: 'beige',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    text: 'text-amber-950',
    textSecondary: 'text-amber-900',
    textTertiary: 'text-amber-700',
    bgSecondary: 'bg-amber-100/80',
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
    bg: 'bg-black',
    text: 'text-neutral-100',
    textSecondary: 'text-neutral-200',
    textTertiary: 'text-neutral-400',
    bgSecondary: 'bg-neutral-800/80',
    border: 'border-neutral-800',
    borderHover: 'hover:border-neutral-700',
    borderSecondary: 'border-neutral-900',
    borderSecondaryHover: 'hover:border-neutral-800',
    buttonHover: 'hover:bg-neutral-900',
    inputBg: 'bg-neutral-900',
    ring: 'ring-neutral-700',
    textDestructive: 'hover:text-red-400',
    focusColor: 'rgba(115, 115, 115, 0.3)',
    focusBorder: '#737373',
    focusColorOuter: 'rgba(115, 115, 115, 0.15)',
    themeAccent: '#737373',
    themeAccentLight: '#a3a3a3',
    inputBgLight: 'bg-neutral-900',
    inputBgDark: 'bg-neutral-800',
    panelBg: 'rgba(0, 0, 0, 0.95)',
    separatorColor: 'rgb(255, 255, 255)'
  },
  matrix: {
    name: 'matrix',
    bg: 'bg-black',
    text: 'text-green-400',
    textSecondary: 'text-green-300',
    textTertiary: 'text-green-500',
    bgSecondary: 'bg-green-950/80',
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
  },
  edge: {
    name: 'edge',
    bg: 'bg-slate-900',
    text: 'text-cyan-300',
    textSecondary: 'text-cyan-200',
    textTertiary: 'text-slate-300',
    bgSecondary: 'bg-slate-800/80',
    border: 'border-cyan-500',
    borderHover: 'hover:border-cyan-400',
    borderSecondary: 'border-slate-700',
    borderSecondaryHover: 'hover:border-cyan-600',
    buttonHover: 'hover:bg-slate-800',
    inputBg: 'bg-slate-800',
    ring: 'ring-cyan-400',
    textDestructive: 'hover:text-cyan-200',
    focusColor: 'rgba(12, 188, 231, 0.3)',
    focusBorder: '#0cbce7',
    focusColorOuter: 'rgba(12, 188, 231, 0.15)',
    themeAccent: '#0cbce7',
    themeAccentLight: '#22d3ee',
    inputBgLight: 'bg-slate-800',
    inputBgDark: 'bg-slate-700',
    panelBg: 'rgba(15, 23, 42, 0.95)',
    separatorColor: 'rgb(12, 188, 231)'
  },
  quake: {
    name: 'quake',
    bg: 'bg-stone-900',
    text: 'text-amber-100',
    textSecondary: 'text-amber-100',
    textTertiary: 'text-amber-300',
    bgSecondary: 'bg-stone-800/80',
    border: 'border-amber-600',
    borderHover: 'hover:border-amber-500',
    borderSecondary: 'border-stone-700',
    borderSecondaryHover: 'hover:border-amber-700',
    buttonHover: 'hover:bg-stone-800',
    inputBg: 'bg-stone-800',
    ring: 'ring-amber-500',
    textDestructive: 'hover:text-red-400',
    focusColor: 'rgba(245, 158, 11, 0.3)',
    focusBorder: '#f59e0b',
    focusColorOuter: 'rgba(245, 158, 11, 0.15)',
    themeAccent: '#f59e0b',
    themeAccentLight: '#fbbf24',
    inputBgLight: 'bg-stone-800',
    inputBgDark: 'bg-stone-700',
    panelBg: 'rgba(41, 37, 36, 0.95)',
    separatorColor: 'rgb(245, 158, 11)'
  },
  doom: {
    name: 'doom',
    bg: 'bg-red-950',
    text: 'text-red-50',
    textSecondary: 'text-red-100',
    textTertiary: 'text-red-200',
    bgSecondary: 'bg-red-900/80',
    border: 'border-red-600',
    borderHover: 'hover:border-red-500',
    borderSecondary: 'border-red-800',
    borderSecondaryHover: 'hover:border-red-700',
    buttonHover: 'hover:bg-red-900',
    inputBg: 'bg-red-900',
    ring: 'ring-red-500',
    textDestructive: 'hover:text-orange-400',
    focusColor: 'rgba(239, 68, 68, 0.3)',
    focusBorder: '#ef4444',
    focusColorOuter: 'rgba(239, 68, 68, 0.15)',
    themeAccent: '#ef4444',
    themeAccentLight: '#f87171',
    inputBgLight: 'bg-red-900',
    inputBgDark: 'bg-red-800',
    panelBg: 'rgba(69, 10, 10, 0.95)',
    separatorColor: 'rgb(239, 68, 68)'
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const checkEdgeUnlock = () => {
  // Check both localStorage flag (for folders unlock) and art notes (for SAMO unlock)
  const hasFlag = localStorage.getItem('stream_edge_unlocked') === 'true';
  const artNotes = JSON.parse(localStorage.getItem('stream_art_notes') || '[]');
  const hasArt = artNotes.some(note => note.artStyle === 'samo' || note.artStyle === 'stencil');
  return hasFlag || hasArt;
};

const checkQuakeUnlock = () => {
  return localStorage.getItem('stream_quake_unlocked') === 'true';
};

const checkDoomUnlock = () => {
  return localStorage.getItem('stream_doom_unlocked') === 'true';
};


export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('stream_theme');
    return saved && THEMES[saved] ? saved : 'white';
  });
  const [matrixUnlocked, setMatrixUnlocked] = useState(() => checkMatrixUnlock());
  const [edgeUnlocked, setEdgeUnlocked] = useState(() => checkEdgeUnlock());
  const [quakeUnlocked, setQuakeUnlocked] = useState(() => checkQuakeUnlock());
  const [doomUnlocked, setDoomUnlocked] = useState(() => checkDoomUnlock());

  useEffect(() => {
    localStorage.setItem('stream_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // Listen for theme unlock events
    const handleThemeUnlock = (event) => {
      const { theme, message } = event.detail;
      if (theme === 'doom') {
        setDoomUnlocked(true);
      } else if (theme === 'quake') {
        setQuakeUnlocked(true);
      }
      
      // Dispatch toast event for the App component to handle
      if (message) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, duration: 5000 } }));
      }
    };

    window.addEventListener('theme-unlocked', handleThemeUnlock);
    return () => {
      window.removeEventListener('theme-unlocked', handleThemeUnlock);
    };
  }, []);

  const switchTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const unlockMatrixTheme = () => {
    setMatrixUnlocked(true);
  };

  const unlockEdgeTheme = () => {
    setEdgeUnlocked(true);
  };

  const unlockQuakeTheme = () => {
    localStorage.setItem('stream_quake_unlocked', 'true');
    setQuakeUnlocked(true);
  };

  const unlockDoomTheme = () => {
    localStorage.setItem('stream_doom_unlocked', 'true');
    setDoomUnlocked(true);
  };

  const getAvailableThemes = () => {
    const baseThemes = ['white', 'beige', 'dark'];
    const unlockedThemes = [...baseThemes];
    if (matrixUnlocked) unlockedThemes.push('matrix');
    if (edgeUnlocked) unlockedThemes.push('edge');
    if (quakeUnlocked) unlockedThemes.push('quake');
    if (doomUnlocked) unlockedThemes.push('doom');
    return unlockedThemes;
  };

  const theme = THEMES[currentTheme];

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      switchTheme,
      themes: getAvailableThemes(),
      unlockMatrixTheme,
      matrixUnlocked,
      unlockEdgeTheme,
      edgeUnlocked,
      unlockQuakeTheme,
      quakeUnlocked,
      unlockDoomTheme,
      doomUnlocked
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
