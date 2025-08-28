import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const ORGANIZATION_STYLES = {
  bullets: {
    name: 'Bullet points',
    example: '• Item 1\n• Item 2',
    format: (items) => items.map(item => `• ${item}`).join('\n')
  },
  numbers: {
    name: 'Numbers',
    example: '1. Item 1\n2. Item 2',
    format: (items) => items.map((item, i) => `${i + 1}. ${item}`).join('\n')
  },
  dashes: {
    name: 'Dashes',
    example: '- Item 1\n- Item 2',
    format: (items) => items.map(item => `- ${item}`).join('\n')
  },
  plain: {
    name: 'Plain text',
    example: 'Item 1\nItem 2',
    format: (items) => items.join('\n')
  }
};

export const DELETE_TIMERS = {
  '1h': { name: '1 hour', hours: 1 },
  '6h': { name: '6 hours', hours: 6 },
  '24h': { name: '24 hours', hours: 24 },
  '3d': { name: '3 days', hours: 72 },
  'never': { name: 'Never', hours: Infinity }
};

const DEFAULT_SETTINGS = {
  organizationStyle: 'bullets',
  deleteTimer: '24h',
  onboardingCompleted: false
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('stream-settings');
      const onboardingCompleted = localStorage.getItem('stream-onboarding-completed') === 'true';
      
      return saved ? 
        { ...DEFAULT_SETTINGS, ...JSON.parse(saved), onboardingCompleted } :
        { ...DEFAULT_SETTINGS, onboardingCompleted };
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stream-settings', JSON.stringify({
        organizationStyle: settings.organizationStyle,
        deleteTimer: settings.deleteTimer
      }));
      localStorage.setItem('stream-onboarding-completed', settings.onboardingCompleted.toString());
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const completeOnboarding = (onboardingSettings) => {
    setSettings(prev => ({
      ...prev,
      ...onboardingSettings,
      onboardingCompleted: true
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('stream-settings');
    localStorage.removeItem('stream-onboarding-completed');
  };

  const shouldOrganizeText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Single line - organize if it contains multiple short sentences or tasks
    if (lines.length === 1) {
      const line = lines[0];
      const sentences = line.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
      
      // Check if it looks like a task list (contains numbers/bullets already)
      if (/^\d+\.|^[•\-*]|\btask\b|\btodo\b/i.test(line)) {
        return true;
      }
      
      // Multiple short sentences
      if (sentences.length >= 2 && sentences.every(s => s.length < 50)) {
        return true;
      }
      
      return false;
    }
    
    // Multiple lines - organize if lines are generally short
    if (lines.length > 1) {
      const avgLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
      return avgLength < 60;
    }
    
    return false;
  };

  const formatText = (text) => {
    if (!shouldOrganizeText(text)) {
      return text;
    }

    const style = ORGANIZATION_STYLES[settings.organizationStyle];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Single line with multiple sentences - split by sentence endings
    if (lines.length === 1) {
      const line = lines[0];
      let items = [];
      
      // If already formatted, extract the content
      if (/^\d+\.|\b[•\-*]\b/.test(line)) {
        items = line.split(/\d+\.|[•\-*]/).map(s => s.trim()).filter(Boolean);
      } else {
        // Split by sentence endings but keep meaningful content
        items = line.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
      }
      
      return style.format(items);
    }
    
    // Multiple lines - format each line as an item
    return style.format(lines);
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      completeOnboarding,
      resetSettings,
      formatText,
      shouldOrganizeText,
      ORGANIZATION_STYLES,
      DELETE_TIMERS
    }}>
      {children}
    </SettingsContext.Provider>
  );
};