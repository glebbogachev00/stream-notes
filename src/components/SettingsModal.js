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
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto`}>
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
          <CollapsibleSection title={settings.personalityEnabled ? "Font Size" : "Font Size"}>
            <FontSizeControl isAlwaysEditing={true} />
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "Spacing" : "Letter Spacing"}>
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

          <CollapsibleSection title={settings.personalityEnabled ? "Lists" : "List Style"}>
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

          <CollapsibleSection title={settings.personalityEnabled ? "Cleanup" : "Auto-Delete"}>
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

          <CollapsibleSection title={settings.personalityEnabled ? "Colors" : "Theme"}>
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

          <CollapsibleSection title="SAMO Mode">
            <button
              onClick={() => updateSettings({ samoModeEnabled: !settings.samoModeEnabled })}
              className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="dynamic-text-xs font-light mb-1">
                    {settings.samoModeEnabled ? 'SAMO mode enabled' : 'SAMO mode disabled'}
                  </div>
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
                    Transform notes into Basquiat-inspired street art
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full ${settings.samoModeEnabled ? 'bg-blue-500' : theme.borderSecondary} relative transition-colors duration-200`}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${settings.samoModeEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </button>
          </CollapsibleSection>

          <CollapsibleSection title={settings.personalityEnabled ? "Stream's Personality" : "Personality"}>
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