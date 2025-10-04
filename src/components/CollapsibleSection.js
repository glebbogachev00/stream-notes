import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CollapsibleSection = ({ title, children, showRemove = false, onRemove, isEnabled = false }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={toggleOpen}
          className={`flex-1 text-left transition-all duration-200 ${theme.text} hover:${theme.text.replace('text-', 'hover:text-')}`}
        >
          <h3 className={`dynamic-text-base font-light`}>{title}</h3>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleOpen}
            className={`p-1 dynamic-text-base font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors`}
          >
            {isOpen ? '[-]' : '[+]'}
          </button>
          {showRemove && onRemove && (
            <button
              onClick={onRemove}
              className={`p-1 dynamic-text-base font-light ${theme.textTertiary} hover:text-red-500 transition-colors`}
              title="Remove from settings"
            >
              [x]
            </button>
          )}
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen mt-3' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
