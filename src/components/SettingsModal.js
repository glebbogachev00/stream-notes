import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import CollapsibleSection from './CollapsibleSection';
import FontSizeControl from './FontSizeControl';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, switchTheme, themes } = useTheme();
  const { settings, updateSettings, resetSettings, togglePersonality } = useSettings();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleReset = () => {
    if (window.confirm('This will reset all preferences and show onboarding again. Continue?')) {
      resetSettings();
      onClose();
      // Page will reload to show onboarding
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto settings-panel rounded-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              {settings.personalityEnabled ? "Stream's Command Center" : "Application Settings"}
            </h2>
            <p className={`dynamic-text-sm ${theme.textSecondary} font-light mt-1`}>
              {settings.personalityEnabled ? "Let's tweak how I help your brain flow!" : "Adjust application preferences."}
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
          <CollapsibleSection 
            title={
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="typography-title">{settings.personalityEnabled ? "Font Size" : "Font Size"}</span>
              </div>
            }
          >
            <FontSizeControl isAlwaysEditing={true} />
          </CollapsibleSection>

          <CollapsibleSection 
            title={
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="typography-title">{settings.personalityEnabled ? "Spacing" : "Letter Spacing"}</span>
              </div>
            }
          >
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

          <CollapsibleSection 
            title={
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="typography-title">{settings.personalityEnabled ? "Lists" : "List Style"}</span>
              </div>
            }
          >
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

          <CollapsibleSection 
            title={
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="typography-title">{settings.personalityEnabled ? "Cleanup" : "Auto-Delete"}</span>
              </div>
            }
          >
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

          <CollapsibleSection 
            title={
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
                </svg>
                <span className="typography-title">{settings.personalityEnabled ? "Colors" : "Theme"}</span>
              </div>
            }
          >
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

          <CollapsibleSection 
            title={
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="typography-title">{settings.personalityEnabled ? "Stream's Personality" : "Personality"}</span>
              </div>
            }
          >
            <button
              onClick={togglePersonality}
              className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
            >
              <div className="dynamic-text-xs font-light">
                {settings.personalityEnabled ? 'Turn off personality - give Stream a vacation' : 'Bring Stream back from vacation'}
              </div>
            </button>
          </CollapsibleSection>
        </div>

        <div className={`mt-6 pt-4 border-t ${theme.borderSecondary}`}>
          <button
            onClick={handleReset}
            className={`dynamic-text-xs font-light ${theme.textTertiary} ${theme.textDestructive} transition-colors`}
          >
            reset preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;