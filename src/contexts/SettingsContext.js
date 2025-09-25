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

const DEFAULT_SYNC_ENDPOINT = '';

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
  syncEndpoint: DEFAULT_SYNC_ENDPOINT,
  syncKey: '',
  enhancedEditingEnabled: false,
  foldersEnabled: true,
  folders: [],
  foldersUpdatedAt: 0,
  availableThemes: ['white', 'beige', 'dark'], // All themes available by default
  autoSortingEnabled: false,
  showMoreByDefault: false,
  flowFormattingEnabled: true,
  timerEnabled: false,
  installIconEnabled: true,
  streamAssistantEnabled: true
};

const sanitizeDeleteTimer = (timerKey) => (
  DELETE_TIMERS[timerKey] ? timerKey : DEFAULT_SETTINGS.deleteTimer
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Clean up localhost endpoints from localStorage on component mount
  React.useEffect(() => {
    const storedEndpoint = localStorage.getItem('stream-sync-endpoint');
    if (storedEndpoint && storedEndpoint.includes('localhost')) {
      localStorage.removeItem('stream-sync-endpoint');
    }
  }, []);

  const [settings, setSettings] = useState(() => {
    try {
      // Try new split settings format first
      const syncableSaved = localStorage.getItem('stream-syncable-settings');
      const localSaved = localStorage.getItem('stream-local-settings');
      const onboardingCompleted = localStorage.getItem('stream-onboarding-completed') === 'true';
      const storedSyncKey = localStorage.getItem('stream-sync-key') || '';
      const storedSyncEndpoint = localStorage.getItem('stream-sync-endpoint') || DEFAULT_SYNC_ENDPOINT;
      // Clear localhost endpoints if they exist in localStorage
      const cleanSyncEndpoint = storedSyncEndpoint.includes('localhost') ? '' : storedSyncEndpoint;
      
      let baseSettings = { ...DEFAULT_SETTINGS };
      
      if (syncableSaved || localSaved) {
        // New format - merge syncable and local settings
        const syncableParsed = syncableSaved ? JSON.parse(syncableSaved) : {};
        const localParsed = localSaved ? JSON.parse(localSaved) : {};
        
        baseSettings = {
          ...baseSettings,
          ...syncableParsed,
          ...localParsed,
          onboardingCompleted: syncableParsed.onboardingCompleted !== undefined ? syncableParsed.onboardingCompleted : onboardingCompleted
        };
      } else {
        // Fallback to legacy format
        const saved = localStorage.getItem('stream-settings');
        baseSettings = saved ?
          { ...DEFAULT_SETTINGS, ...JSON.parse(saved), onboardingCompleted } :
          { ...DEFAULT_SETTINGS, onboardingCompleted };
      }

      const sanitizedDeleteTimer = sanitizeDeleteTimer(baseSettings.deleteTimer);

      return {
        ...baseSettings,
        deleteTimer: sanitizedDeleteTimer,
        syncKey: baseSettings.syncKey || storedSyncKey,
        syncEndpoint: baseSettings.syncEndpoint || cleanSyncEndpoint
      };
    } catch (error) {
      // Error loading settings, using defaults
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      const storage = window.streamStorage;
      
      // Syncable settings - stored via storage adapter to sync across devices
      const syncableSettings = {
        organizationStyle: settings.organizationStyle,
        deleteTimer: settings.deleteTimer,
        personalityEnabled: settings.personalityEnabled,
        samoModeEnabled: settings.samoModeEnabled,
        stealThisQuoteEnabled: settings.stealThisQuoteEnabled,
        stencilModeEnabled: settings.stencilModeEnabled,
        enhancedEditingEnabled: settings.enhancedEditingEnabled,
        foldersEnabled: settings.foldersEnabled,
        folders: settings.folders,
        foldersUpdatedAt: settings.foldersUpdatedAt,
        availableThemes: settings.availableThemes,
        autoSortingEnabled: settings.autoSortingEnabled,
        showMoreByDefault: settings.showMoreByDefault,
        flowFormattingEnabled: settings.flowFormattingEnabled,
        timerEnabled: settings.timerEnabled,
        installIconEnabled: settings.installIconEnabled,
        streamAssistantEnabled: settings.streamAssistantEnabled,
        onboardingCompleted: settings.onboardingCompleted
      };

      // Local-only settings - device-specific preferences
      const localSettings = {
        theme: settings.theme,
        fontSize: settings.fontSize,
        letterSpacing: settings.letterSpacing,
        syncEnabled: settings.syncEnabled,
        syncEndpoint: settings.syncEndpoint,
        syncKey: settings.syncKey
      };

      if (storage) {
        // Use storage adapter for syncable settings
        storage.set('stream-syncable-settings', JSON.stringify(syncableSettings));
      } else {
        // Fallback to localStorage
        localStorage.setItem('stream-syncable-settings', JSON.stringify(syncableSettings));
      }

      // Always use localStorage for local-only settings
      localStorage.setItem('stream-local-settings', JSON.stringify(localSettings));
      
      // Legacy support - keep old keys for backward compatibility
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
        syncEndpoint: settings.syncEndpoint,
        syncKey: settings.syncKey,
        enhancedEditingEnabled: settings.enhancedEditingEnabled,
        foldersEnabled: settings.foldersEnabled,
        folders: settings.folders,
        availableThemes: settings.availableThemes,
        autoSortingEnabled: settings.autoSortingEnabled,
        showMoreByDefault: settings.showMoreByDefault,
        flowFormattingEnabled: settings.flowFormattingEnabled,
        timerEnabled: settings.timerEnabled,
        installIconEnabled: settings.installIconEnabled,
        streamAssistantEnabled: settings.streamAssistantEnabled
      }));
      localStorage.setItem('stream-onboarding-completed', settings.onboardingCompleted.toString());
      if (settings.syncKey) {
        localStorage.setItem('stream-sync-key', settings.syncKey);
      }
      if (settings.syncEndpoint) {
        localStorage.setItem('stream-sync-endpoint', settings.syncEndpoint);
      }
    } catch (error) {
      // Error saving settings
    }
  }, [settings]);

  useEffect(() => {
    const handleSyncUpdate = (event) => {
      const updatedKeys = event?.detail?.keys || [];
      if (!updatedKeys.includes('stream-syncable-settings') && !updatedKeys.includes('stream-settings')) {
        return;
      }

      try {
        // Try new syncable settings first
        const syncableSaved = localStorage.getItem('stream-syncable-settings');
        const localSaved = localStorage.getItem('stream-local-settings');
        
        if (syncableSaved) {
          const syncableParsed = JSON.parse(syncableSaved);
          const localParsed = localSaved ? JSON.parse(localSaved) : {};
          
          setSettings((prev) => {
            const merged = {
              ...prev,
              ...syncableParsed,
              ...localParsed // Local settings override syncable ones
            };
            merged.deleteTimer = sanitizeDeleteTimer(merged.deleteTimer);
            return merged;
          });
        } else {
          // Fallback to legacy stream-settings
          const saved = localStorage.getItem('stream-settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            setSettings((prev) => {
              const merged = {
                ...prev,
                ...parsed
              };
              merged.deleteTimer = sanitizeDeleteTimer(merged.deleteTimer);
              return merged;
            });
          }
        }
      } catch (error) {
        // Ignore sync parse errors to avoid breaking settings
      }
    };

    window.addEventListener('stream-sync-update', handleSyncUpdate);
    return () => {
      window.removeEventListener('stream-sync-update', handleSyncUpdate);
    };
  }, []);

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updates = { ...newSettings };
      if (Object.prototype.hasOwnProperty.call(newSettings, 'folders')) {
        updates.foldersUpdatedAt = Date.now();
      }

      if (Object.prototype.hasOwnProperty.call(newSettings, 'deleteTimer')) {
        updates.deleteTimer = sanitizeDeleteTimer(newSettings.deleteTimer);
      }
      
      // Unlock doom theme when timer is first enabled
      if (Object.prototype.hasOwnProperty.call(newSettings, 'timerEnabled') && 
          newSettings.timerEnabled === true && 
          prev.timerEnabled === false) {
        const alreadyUnlocked = localStorage.getItem('stream_doom_unlocked') === 'true';
        if (!alreadyUnlocked) {
          localStorage.setItem('stream_doom_unlocked', 'true');
          // Dispatch event to notify ThemeContext
          window.dispatchEvent(new CustomEvent('theme-unlocked', { detail: { theme: 'doom', message: 'Doom theme unlocked!' } }));
        }
      }
      
      const nextSettings = { ...prev, ...updates };
      nextSettings.deleteTimer = sanitizeDeleteTimer(nextSettings.deleteTimer);
      return nextSettings;
    });
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
    localStorage.removeItem('stream-sync-key');
    localStorage.removeItem('stream-sync-endpoint');
    localStorage.removeItem('stream-sync-meta');
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
      const lines = text.split('\n');
      if (lines.length === 0) return text;
      
      // Check how many non-empty lines are already formatted
      const nonEmptyLines = lines.filter(line => line.trim() !== '');
      const formattedLines = nonEmptyLines.filter(line => {
        const trimmed = line.trim();
        return /^(\d+\.|[•\-*])\s/.test(trimmed);
      });
      
      const hasAnyFormatting = formattedLines.length > 0;
      const allFormatted = nonEmptyLines.length > 0 && formattedLines.length === nonEmptyLines.length;
      
      if (allFormatted) {
        // If ALL lines are formatted, remove formatting (toggle off)
        return removeListFormatting(text);
      } else if (hasAnyFormatting) {
        // Mixed formatting: toggle each line individually
        return lines.map(line => {
          if (line.trim() === '') {
            // Preserve empty lines
            return line;
          }
          
          const trimmed = line.trim();
          const isFormatted = /^(\d+\.|[•\-*])\s/.test(trimmed);
          
          if (isFormatted) {
            // Remove formatting from this line
            return line.replace(/^(\s*)(\d+\.|[•\-*])\s*/, '$1');
          } else {
            // Add formatting to this line
            const leadingWhitespace = line.match(/^\s*/)[0];
            return leadingWhitespace + style.marker + ' ' + trimmed;
          }
        }).join('\n');
      } else {
        // No existing formatting: apply formatting to non-empty lines
        const nonEmptyFilteredLines = lines.map(line => line.trim()).filter(Boolean);
        return style.format(nonEmptyFilteredLines);
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
