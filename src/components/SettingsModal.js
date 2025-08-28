import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';

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
      className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} max-w-sm w-full p-6`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-lg font-light ${theme.text}`}>settings</h2>
          <button
            onClick={onClose}
            className={`text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            close
          </button>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className={`text-sm font-light ${theme.text} mb-4`}>font size</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 2) })}
                className={`text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                [-]
              </button>
              <span className={`text-xs font-light ${theme.text} min-w-[3rem] text-center`}>
                {settings.fontSize}px
              </span>
              <button
                onClick={() => updateSettings({ fontSize: Math.min(24, settings.fontSize + 2) })}
                className={`text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                [+]
              </button>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-light ${theme.text} mb-4`}>list style</h3>
            <div className="space-y-3">
              {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ organizationStyle: key })}
                  className={`w-full text-left transition-all duration-200 ${
                    settings.organizationStyle === key ? theme.text : theme.textTertiary
                  } hover:${theme.text.replace('text-', 'hover:text-')}`}
                >
                  <div className="text-xs font-light mb-1">
                    {style.name.toLowerCase()}
                  </div>
                  <div className={`text-xs ${theme.textTertiary} font-mono whitespace-pre-line leading-relaxed`}>
                    {style.example}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-light ${theme.text} mb-4`}>auto-delete</h3>
            <div className="space-y-2">
              {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ deleteTimer: key })}
                  className={`w-full text-left text-xs font-light transition-all duration-200 ${
                    settings.deleteTimer === key ? theme.text : theme.textTertiary
                  } hover:${theme.text.replace('text-', 'hover:text-')}`}
                >
                  {timer.name.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`mt-8 pt-6 border-t ${theme.borderSecondary}`}>
          <button
            onClick={handleReset}
            className={`text-xs font-light ${theme.textTertiary} hover:text-red-500 transition-colors`}
          >
            reset preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;