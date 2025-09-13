import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formatNoteWithAI, isAIConfigured } from '../services/aiService';

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
  fontSize: 'xl',
  letterSpacing: 0,
  organizationStyle: 'bullets',
  deleteTimer: '24h',
  onboardingCompleted: false,
  personalityEnabled: false,
  samoModeEnabled: false,
  stealThisQuoteEnabled: false,
  stencilModeEnabled: false,
  syncEnabled: false,
  enhancedEditingEnabled: false,
  foldersEnabled: true,
  folders: [],
  availableThemes: ['white', 'beige', 'dark'], // All themes available by default
  autoSortingEnabled: false,
  showMoreByDefault: false,
  showHeaderButtons: true,
  flowFormattingEnabled: true
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
      // Error loading settings, using defaults
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
        syncEnabled: settings.syncEnabled,
        enhancedEditingEnabled: settings.enhancedEditingEnabled,
        foldersEnabled: settings.foldersEnabled,
        folders: settings.folders,
        availableThemes: settings.availableThemes,
        autoSortingEnabled: settings.autoSortingEnabled,
        showMoreByDefault: settings.showMoreByDefault,
        showHeaderButtons: settings.showHeaderButtons,
        flowFormattingEnabled: settings.flowFormattingEnabled
      }));
      localStorage.setItem('stream-onboarding-completed', settings.onboardingCompleted.toString());
    } catch (error) {
      // Error saving settings
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
    // If auto-sorting is disabled, don't organize
    if (!settings.autoSortingEnabled) {
      return false;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Check if text is already formatted with bullets, numbers, or dashes
    const alreadyFormatted = lines.some(line => 
      /^(\d+\.|[•\-*]\s|[•\-*]$)/.test(line.trim())
    );
    
    if (alreadyFormatted) {
      return false; // Don't format if already formatted
    }
    
    // Enhanced intelligent detection algorithm
    if (lines.length === 1) {
      const line = lines[0];
      
      // Don't organize very long text (likely paragraph/essay)
      if (line.length > 200) {
        return false;
      }
      
      // Check for task/list keywords
      const taskKeywords = /\b(task|todo|buy|call|email|remember|check|visit|schedule|book|order|pick up|drop off)\b/i;
      if (taskKeywords.test(line)) {
        return true;
      }
      
      // Check for comma-separated items (shopping lists, etc.)
      const commaSeparated = line.split(',').map(s => s.trim()).filter(Boolean);
      if (commaSeparated.length >= 3 && commaSeparated.every(item => item.length < 80)) {
        return true;
      }
      
      // Check for semicolon-separated items
      const semicolonSeparated = line.split(';').map(s => s.trim()).filter(Boolean);
      if (semicolonSeparated.length >= 2 && semicolonSeparated.every(item => item.length < 80)) {
        return true;
      }
      
      // Multiple short sentences
      const sentences = line.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
      if (sentences.length >= 2 && sentences.every(s => s.length < 60)) {
        return true;
      }
      
      return false;
    }
    
    // Multiple lines - be more selective
    if (lines.length > 1) {
      // Don't organize if any line is very long (likely paragraph)
      if (lines.some(line => line.length > 150)) {
        return false;
      }
      
      // Don't organize if there are too many lines (likely essay/article)
      if (lines.length > 10) {
        return false;
      }
      
      // Check if it looks like a list of items/tasks
      const avgLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
      const shortLines = lines.filter(line => line.length < 80).length;
      
      // Organize if most lines are short and average length is reasonable
      return avgLength < 50 && (shortLines / lines.length) > 0.7;
    }
    
    return false;
  };

  const formatText = (text, forceFormat = false) => {
    // Only auto-format if auto-sorting is enabled, unless explicitly forced
    if (!settings.autoSortingEnabled && !forceFormat) {
      return text;
    }

    const style = ORGANIZATION_STYLES[settings.organizationStyle];
    
    // If force formatting (manual button), format everything as a simple list
    if (forceFormat) {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) return text;
      
      // Check if ALL non-empty lines are already formatted (be more strict)
      const allFormatted = lines.length > 0 && lines.every(line => {
        const trimmed = line.trim();
        return trimmed === '' || /^(\d+\.|[•\-*])\s/.test(trimmed);
      });
      
      if (allFormatted) {
        // If all lines are formatted, remove formatting (toggle off)
        return removeListFormatting(text);
      } else {
        // If not all lines are formatted, format everything (toggle on)
        return style.format(lines);
      }
    }

    // Original auto-formatting logic
    // Split by newline, but keep empty strings for empty lines
    const lines = text.split('\n'); 
    
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
      let itemsToFormat = unformattedLines;
      
      // Handle comma or semicolon separated items in single line
      if (unformattedLines.length === 1) {
        const line = unformattedLines[0];
        
        // Check for comma-separated items
        const commaSeparated = line.split(',').map(s => s.trim()).filter(Boolean);
        if (commaSeparated.length >= 3) {
          itemsToFormat = commaSeparated;
        } else {
          // Check for semicolon-separated items
          const semicolonSeparated = line.split(';').map(s => s.trim()).filter(Boolean);
          if (semicolonSeparated.length >= 2) {
            itemsToFormat = semicolonSeparated;
          }
        }
      }
      
      // Format the items
      const newlyFormatted = style.format(itemsToFormat);
      
      // Combine: existing formatted lines + newly formatted lines
      const allLines = [...formattedLines, ...newlyFormatted.split('\n')];
      return allLines.join('\n');
    }
    
    // If shouldn't be organized, return original text
    return text;
  };

  const formatNote = useCallback(async (text) => {
    if (!settings.flowFormattingEnabled || !isAIConfigured()) {
      return text;
    }
    try {
      const formattedText = await formatNoteWithAI(text, settings);
      return formattedText;
    } catch (error) {
      console.error("Failed to format text with flow formatting:", error);
      return text; // Fallback to original text on error
    }
  }, [settings]);

  const removeListFormatting = (text) => {
    return text
      .split('\n')
      .map(line => {
        // Remove ALL list markers (including nested ones) while preserving any formatting
        let cleaned = line;
        
        // Keep removing list markers until none are left (handles nested bullets)
        while (/^[\s]*(\d+\.|[•\-*])\s*/.test(cleaned)) {
          cleaned = cleaned.replace(/^[\s]*(\d+\.|[•\-*])\s*/, '');
        }
        
        // Trim and handle empty lines
        cleaned = cleaned.trim();
        
        // Fix common malformed patterns from mixed bold+list formatting
        // Handle cases like "**- text**" -> "**text**"
        cleaned = cleaned.replace(/^\*\*[-*•]\s*/, '**');
        // Handle cases like "*- text**" -> "**text**"  
        cleaned = cleaned.replace(/^\*[-*•]\s*/, '**');
        // Handle cases where single * got left behind: "*text**" -> "**text**"
        if (cleaned.startsWith('*') && !cleaned.startsWith('**') && cleaned.includes('**')) {
          cleaned = '**' + cleaned.substring(1);
        }
        // Clean up any multiple asterisks that got merged incorrectly
        cleaned = cleaned.replace(/\*\*\*+/g, '**');
        // Fix orphaned asterisks at the end
        cleaned = cleaned.replace(/\*\*$/, '');
        cleaned = cleaned.replace(/^\*\*$/, '');
        
        return cleaned;
      })
      .filter(line => line.trim() !== '') // Remove empty lines
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
      formatNote,
      removeListFormatting,
      shouldOrganizeText,
      ORGANIZATION_STYLES,
      DELETE_TIMERS
    }}>
      {children}
    </SettingsContext.Provider>
  );
};