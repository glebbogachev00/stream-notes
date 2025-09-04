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
  '3d': { name: '3 days', hours: 3 * 24 },
  '7d': { name: '7 days', hours: 7 * 24 },
};

const DEFAULT_SETTINGS = {
  theme: 'white',
  fontSize: 'base',
  letterSpacing: 0,
  organizationStyle: 'bullets',
  deleteTimer: '24h',
  onboardingCompleted: false,
  personalityEnabled: true,
  samoModeEnabled: true,
  stealThisQuoteEnabled: true,
  stencilModeEnabled: true,
  syncEnabled: false
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
        theme: settings.theme,
        fontSize: settings.fontSize,
        letterSpacing: settings.letterSpacing,
        organizationStyle: settings.organizationStyle,
        deleteTimer: settings.deleteTimer,
        personalityEnabled: settings.personalityEnabled,
        samoModeEnabled: settings.samoModeEnabled,
        stealThisQuoteEnabled: settings.stealThisQuoteEnabled,
        stencilModeEnabled: settings.stencilModeEnabled,
        syncEnabled: settings.syncEnabled
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

  const togglePersonality = () => {
    setSettings(prev => ({ ...prev, personalityEnabled: !prev.personalityEnabled }));
  };

  const shouldOrganizeText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Check if text is already formatted with bullets, numbers, or dashes
    const alreadyFormatted = lines.some(line => 
      /^(\d+\.|[•\-*]\s|[•\-*]$)/.test(line.trim())
    );
    
    if (alreadyFormatted) {
      return false; // Don't format if already formatted
    }
    
    // Single line - organize if it contains multiple short sentences or tasks
    if (lines.length === 1) {
      const line = lines[0];
      const sentences = line.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
      
      // Check if it looks like a task list (contains task keywords)
      if (/\btask\b|\btodo\b/i.test(line)) {
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
    // Split by newline, but keep empty strings for empty lines
    const lines = text.split('\n'); 
    const style = ORGANIZATION_STYLES[settings.organizationStyle];
    
    // Separate formatted and unformatted lines
    const formattedLines = [];
    const unformattedLines = [];
    
    lines.forEach(line => {
      // Check if line is already formatted (e.g., starts with a bullet, number, or dash)
      if (/^(\d+\.|[•\-*]\s)/.test(line.trim())) {
        formattedLines.push(line); // Keep as is
      } else if (line.trim() !== '') { // Only consider non-empty, unformatted lines for auto-formatting
        unformattedLines.push(line); 
      } else {
        formattedLines.push(''); // Preserve empty lines
      }
    });
    
    // If no unformatted lines, return original text (preserving all original spacing)
    if (unformattedLines.length === 0) {
      return text;
    }
    
    // Check if unformatted content should be organized
    if (shouldOrganizeText(unformattedLines.join('\n'))) {
      // Format only the unformatted lines
      const newlyFormatted = style.format(unformattedLines);
      
      // Combine: existing formatted lines + newly formatted lines
      const allLines = [...formattedLines, ...newlyFormatted.split('\n')];
      return allLines.join('\n');
    }
    
    // If shouldn't be organized, return original text
    return text;
  };

  const removeListFormatting = (text) => {
    return text
      .split('\n')
      .map(line => {
        // Remove list markers while preserving any formatting
        let cleaned = line.replace(/^(\d+\.|[•\-*])\s*/, '').trim();
        
        // Fix malformed formatting patterns
        // Handle cases like "*- text**" -> "**text**"
        cleaned = cleaned.replace(/^\*[-*]\s*/, '**');
        // Handle cases like "- hola**" after removing "- " 
        if (cleaned.startsWith('*') && !cleaned.startsWith('**') && cleaned.includes('**')) {
          cleaned = '**' + cleaned.substring(1);
        }
        
        return cleaned;
      })
      .join('\n');
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      completeOnboarding,
      resetSettings,
      togglePersonality,
      formatText,
      removeListFormatting,
      shouldOrganizeText,
      ORGANIZATION_STYLES,
      DELETE_TIMERS
    }}>
      {children}
    </SettingsContext.Provider>
  );
};