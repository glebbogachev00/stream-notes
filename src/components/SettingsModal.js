import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import { useStorage } from '../contexts/StorageContext';
import CollapsibleSection from './CollapsibleSection';
import FontSizeControl from './FontSizeControl';
import { getUserTag, setUserTag, validateUserTag, formatUserTag, clearUserTag } from '../utils/tags';
import { sanitizeInput } from '../utils/security';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, switchTheme, themes } = useTheme();
  const { settings, updateSettings, resetSettings, togglePersonality } = useSettings();
  const { isSyncSupported } = useStorage();
  const [newUserTag, setNewUserTag] = useState('');
  const [tagError, setTagError] = useState('');
  const userTag = getUserTag();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleReset = () => {
    if (window.confirm('This will reset all preferences and show onboarding again. Continue?')) {
      resetSettings();
      clearUserTag();
      onClose();
      // Page will reload to show onboarding
      window.location.reload();
    }
  };

  const handleTagChange = () => {
    if (!newUserTag.trim()) {
      setTagError('Please enter a tag name');
      return;
    }

    const sanitized = sanitizeInput(newUserTag);
    if (!validateUserTag(sanitized)) {
      setTagError('Use only letters, numbers, hyphens, and underscores (2-15 characters)');
      return;
    }

    try {
      setUserTag(sanitized);
      setNewUserTag('');
      setTagError('');
      // No page refresh, modal stays open
    } catch (error) {
      setTagError(error.message);
    }
  };

  const handleResetOnboarding = () => {
    if (window.confirm('This will reset your onboarding status and show the onboarding process again. Continue?')) {
      updateSettings({ onboardingCompleted: false }); // Set onboardingCompleted to false
      window.location.reload(); // Reload the page to show onboarding
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              {settings.personalityEnabled ? "stream's command center" : "application settings"}
            </h2>
            <p className={`dynamic-text-base ${theme.textSecondary} font-light mt-1`}>
              {settings.personalityEnabled ? "let's tweak how i help your brain flow!" : "adjust application preferences."}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            close
          </button>
        </div>

        <div className="space-y-6">
          <CollapsibleSection title="data storage">
            <div className="space-y-3">
              <button
                onClick={() => updateSettings({ syncEnabled: false })}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                  !settings.syncEnabled
                    ? `${theme.border} ${theme.text}`
                    : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                }`}
              >
                <div className="dynamic-text-xs font-light mb-1">
                  ○ local only (this device only)
                </div>
              </button>
              
              {isSyncSupported() ? (
                <button
                  onClick={() => updateSettings({ syncEnabled: true })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    settings.syncEnabled
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light mb-1">
                    ○ browser sync (sync across devices)
                  </div>
                </button>
              ) : (
                <div className={`pb-3 border-b ${theme.borderSecondary}`}>
                  <div className={`dynamic-text-xs font-light mb-1 ${theme.textTertiary}`}>
                    ○ browser sync (not available)
                  </div>
                </div>
              )}
              
              <div className={`dynamic-text-xs ${theme.textTertiary} font-light leading-relaxed pt-2`}>
                browser sync uses your existing browser account to sync notes across devices. your data never goes to stream servers.
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "font size" : "font size"}>
            <FontSizeControl isAlwaysEditing={true} />
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "spacing" : "letter spacing"}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings({ letterSpacing: Math.max(-1, settings.letterSpacing - 0.5) })}
                className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                [-]
              </button>
              <span className={`dynamic-text-xs font-light ${theme.text}`}>
                {settings.letterSpacing}px
              </span>
              <button
                onClick={() => updateSettings({ letterSpacing: Math.min(5, settings.letterSpacing + 0.5) })}
                className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                [+]
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "lists" : "list style"}>
            <div className="space-y-2">
              {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ organizationStyle: key })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    settings.organizationStyle === key
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light mb-1">
                    {style.name.toLowerCase()}
                  </div>
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-mono whitespace-pre-line leading-tight`}>
                    {style.example}
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "cleanup" : "auto-delete"}>
            <div className="space-y-3">
              {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ deleteTimer: key })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    settings.deleteTimer === key
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light">
                    {timer.name.toLowerCase()}
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "colors" : "theme"}>
            <div className="space-y-3">
              {themes.map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => {
                    updateSettings({ theme: themeName });
                    switchTheme(themeName);
                  }}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    settings.theme === themeName
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light">
                    [{themeName}]
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="feature visibility">
            <div className="space-y-3">
              <button
                onClick={() => updateSettings({ samoModeEnabled: !settings.samoModeEnabled })}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}>
                <div className="dynamic-text-xs font-light">
                  {settings.samoModeEnabled ? 'hide samo' : 'show samo'}
                </div>
              </button>
              <button
                onClick={() => updateSettings({ stealThisQuoteEnabled: !settings.stealThisQuoteEnabled })}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}>
                <div className="dynamic-text-xs font-light">
                  {settings.stealThisQuoteEnabled ? 'hide steal this quote' : 'show steal this quote'}
                </div>
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "your signature" : "user tag"}>
            <div className="space-y-4">
              {userTag ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
                      current tag:
                    </div>
                    <span 
                      className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${theme.text}`}
                      style={{ 
                        backgroundColor: `${theme.text}20`,
                        border: `1px solid ${theme.text}40`
                      }}
                    >
                      {formatUserTag(userTag)}
                    </span>
                  </div>
                  
                  <div className={`text-sm ${theme.text}`}>
                    [<input
                      type="text"
                      value={newUserTag}
                      onChange={(e) => {
                        const value = sanitizeInput(e.target.value);
                        setNewUserTag(value);
                        setTagError('');
                      }}
                      placeholder={userTag.name}
                      className={`bg-transparent ${theme.text} text-sm font-light focus:outline-none`}
                      style={{ margin: 0, padding: 0, border: 'none', width: `${(newUserTag || userTag.name).length}ch`, minWidth: '1ch', display: 'inline' }}
                      maxLength={15}
                    />]©
                    <button
                      onClick={handleTagChange}
                      disabled={!newUserTag.trim()}
                      className={`px-2 py-1 dynamic-text-xs font-light ${
                        newUserTag.trim() 
                          ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}` 
                          : theme.textTertiary
                      } transition-colors`}
                    >
                      update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-light text-center pb-2`}>
                    Create your unique signature to sign your notes.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${theme.text}`}>[</span>
                    <input
                      type="text"
                      value={newUserTag}
                      onChange={(e) => {
                        const value = sanitizeInput(e.target.value);
                        setNewUserTag(value);
                        setTagError('');
                      }}
                      placeholder="your-tag"
                      className={`bg-transparent ${theme.text} text-sm font-light focus:outline-none border-b ${theme.borderSecondary} pb-1`}
                      size={newUserTag.length || 'your-tag'.length}
                      maxLength={15}
                    />
                    <span className={`text-sm ${theme.text}`}>]©</span>
                    <button
                      onClick={handleTagChange}
                      disabled={!newUserTag.trim()}
                      className={`px-2 py-1 dynamic-text-xs font-light ${
                        newUserTag.trim() 
                          ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}` 
                          : theme.textTertiary
                      } transition-colors`}
                    >
                      create
                    </button>
                  </div>
                </div>
              )}
              
              {tagError && (
                <p className={`text-xs text-red-500 font-light`}>
                  {tagError}
                </p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "stream's personality" : "personality"}>
            <button
              onClick={togglePersonality}
              className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
            >
              <div className="dynamic-text-xs font-light">
                {settings.personalityEnabled ? 'turn off personality - give stream a vacation' : 'bring stream back from vacation'}
              </div>
            </button>
          </CollapsibleSection>

          <CollapsibleSection title="onboarding">
            <button
              onClick={handleResetOnboarding}
              className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
            >
              <div className="dynamic-text-xs font-light">
                do it again (for fun)
              </div>
            </button>
          </CollapsibleSection>
        </div>

        <div className={`mt-6 pt-4 border-t ${theme.borderSecondary} space-y-3`}>
          <div className={`dynamic-text-xs ${theme.textTertiary} font-light text-center`}>
            🔒 Your notes never leave your device
          </div>
          <button
            onClick={handleReset}
            className={`dynamic-text-xs font-light ${theme.textTertiary} ${theme.textDestructive} transition-colors block mx-auto`}
          >
            reset preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;