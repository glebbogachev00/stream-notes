import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import CollapsibleSection from './CollapsibleSection';
import FontSizeControl from './FontSizeControl';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();

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
      <div className={`${theme.bg} max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`dynamic-text-lg font-light ${theme.text}`}>settings</h2>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            close
          </button>
        </div>

        <div className="space-y-6">
          <CollapsibleSection title="font size">
            <FontSizeControl isAlwaysEditing={true} />
          </CollapsibleSection>

          <CollapsibleSection title="letter spacing">
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

          <CollapsibleSection title="list style">
            <div className="space-y-2">
              {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ organizationStyle: key })}
                  className={`w-full text-left transition-all duration-200 ${
                    settings.organizationStyle === key ? theme.text : theme.textTertiary
                  } hover:${theme.text.replace('text-', 'hover:text-')}`}
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

          <CollapsibleSection title="auto-delete">
            <div className="relative">
              <select
                value={settings.deleteTimer}
                onChange={(e) => updateSettings({ deleteTimer: e.target.value })}
                className={`w-full appearance-none ${theme.bg} ${theme.border} ${theme.text} dynamic-text-xs font-light border py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-1 focus:${theme.ring}`}
              >
                {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
                  <option key={key} value={key}>
                    {timer.name}
                  </option>
                ))}
              </select>
              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${theme.text}`}>
                <svg className={`fill-current h-4 w-4 ${theme.text}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
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