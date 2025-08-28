import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const FontSizeControl = () => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [tempFontSize, setTempFontSize] = useState(settings.fontSize);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 24;

  useEffect(() => {
    setTempFontSize(settings.fontSize);
  }, [settings.fontSize]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleSave = () => {
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, tempFontSize));
    updateSettings({ fontSize: clampedSize });
    setTempFontSize(clampedSize);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTempFontSize(settings.fontSize);
      setIsEditing(false);
    }
  };

  const handleIncrement = () => {
    const newSize = Math.min(MAX_FONT_SIZE, tempFontSize + 2);
    setTempFontSize(newSize);
    updateSettings({ fontSize: newSize });
  };

  const handleDecrement = () => {
    const newSize = Math.max(MIN_FONT_SIZE, tempFontSize - 2);
    setTempFontSize(newSize);
    updateSettings({ fontSize: newSize });
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || MIN_FONT_SIZE;
    setTempFontSize(value);
  };

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-1"
      >
        <button
          onClick={handleDecrement}
          className={`text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
        >
          [-]
        </button>
        <input
          ref={inputRef}
          type="number"
          value={tempFontSize}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          className={`w-8 text-xs font-light text-center ${theme.text} bg-transparent border-0 outline-none`}
        />
        <button
          onClick={handleIncrement}
          className={`text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
        >
          [+]
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
      title="Click to adjust font size"
    >
      [font: {settings.fontSize}px]
    </button>
  );
};

export default FontSizeControl;