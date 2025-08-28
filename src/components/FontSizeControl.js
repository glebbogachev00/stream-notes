import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const FontSizeControl = ({ isAlwaysEditing = false }) => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();

  const FONT_SIZES = {
    S: 14,
    M: 16,
    L: 18
  };

  const getCurrentSize = () => {
    const currentSize = settings.fontSize;
    if (currentSize <= 14) return 'S';
    if (currentSize <= 16) return 'M';
    return 'L';
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
            getCurrentSize() === size
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