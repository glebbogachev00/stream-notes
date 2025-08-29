import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const FontSizeControl = ({ isAlwaysEditing = false }) => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();

  const FONT_SIZES = {
    s: "sm",
    m: "base",
    l: "lg",
  };

  const handleSizeChange = (size) => {
    updateSettings({ fontSize: FONT_SIZES[size] });
  };

  return (
    <div className="flex items-center gap-1">
      {Object.keys(FONT_SIZES).map((size) => (
        <button
          key={size}
          onClick={() => handleSizeChange(size)}
          className={`px-2 py-1 dynamic-text-xs font-light transition-colors border-b ${
            settings.fontSize === FONT_SIZES[size]
              ? `${theme.text} ${theme.border}`
              : `${theme.textTertiary} border-transparent hover:${theme.text.replace('text-', 'hover:text-')}`
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
};

export default FontSizeControl;