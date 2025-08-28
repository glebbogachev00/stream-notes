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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} rounded-lg border ${theme.border} max-w-md w-full max-h-[80vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${theme.borderSecondary}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-light ${theme.text}`}>Settings</h2>
            <button
              onClick={onClose}
              className={`p-1 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Organization Style */}
          <div>
            <h3 className={`font-medium ${theme.text} mb-4`}>List Organization</h3>
            <div className="space-y-3">
              {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    settings.organizationStyle === key
                      ? `${theme.buttonHover} border ${theme.border}`
                      : `hover:${theme.buttonHover}`
                  }`}
                >
                  <input
                    type="radio"
                    name="organizationStyle"
                    value={key}
                    checked={settings.organizationStyle === key}
                    onChange={(e) => updateSettings({ organizationStyle: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${theme.text} text-sm mb-1`}>
                      {style.name}
                    </div>
                    <div className={`text-xs ${theme.textSecondary} font-mono whitespace-pre-line`}>
                      {style.example}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Delete Timer */}
          <div>
            <h3 className={`font-medium ${theme.text} mb-4`}>Auto-Delete Timer</h3>
            <div className="space-y-2">
              {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    settings.deleteTimer === key
                      ? `${theme.buttonHover} border ${theme.border}`
                      : `hover:${theme.buttonHover}`
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteTimer"
                    value={key}
                    checked={settings.deleteTimer === key}
                    onChange={(e) => updateSettings({ deleteTimer: e.target.value })}
                  />
                  <span className={`${theme.text} text-sm`}>
                    {timer.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Smart Formatting Info */}
          <div className={`p-4 rounded-lg border ${theme.borderSecondary}`}>
            <h4 className={`font-medium ${theme.text} text-sm mb-2`}>
              Smart Formatting
            </h4>
            <p className={`text-xs ${theme.textSecondary} leading-relaxed`}>
              Notes are automatically organized when they look like lists (short lines or multiple tasks). 
              Long paragraphs and detailed thoughts remain unformatted.
            </p>
          </div>
        </div>

        <div className={`p-6 border-t ${theme.borderSecondary} flex items-center justify-between`}>
          <button
            onClick={handleReset}
            className={`px-4 py-2 text-sm font-light ${theme.textTertiary} hover:text-red-500 transition-colors`}
          >
            Reset Preferences
          </button>
          <button
            onClick={onClose}
            className={`px-6 py-2 text-sm font-light ${theme.text} border ${theme.border} rounded ${theme.buttonHover} transition-all duration-200`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;