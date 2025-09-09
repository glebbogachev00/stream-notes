import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const FontSizeControl = ({ isAlwaysEditing = false }) => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();

  const FONT_SIZES = {
    lg: 18,
    xl: 20,
    xxl: 22,
  };

  const handleDecrease = () => {
    const sizes = Object.keys(FONT_SIZES);
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSettings({ fontSize: sizes[currentIndex - 1] });
    }
  };

  const handleIncrease = () => {
    const sizes = Object.keys(FONT_SIZES);
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      updateSettings({ fontSize: sizes[currentIndex + 1] });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDecrease}
        className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
      >
        [-]
      </button>
      <span className={`dynamic-text-xs font-light ${theme.text}`}>
        {FONT_SIZES[settings.fontSize]}
      </span>
      <button
        onClick={handleIncrease}
        className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
      >
        [+]
      </button>
    </div>
  );
};

export default FontSizeControl;