import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CollapsibleSection = ({ title, children }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        onClick={toggleOpen}
        className={`w-full text-left flex justify-between items-center transition-all duration-200 ${theme.text} hover:${theme.text.replace('text-', 'hover:text-')}`}
      >
        <h3 className={`dynamic-text-sm font-light`}>{title}</h3>
        <span className="dynamic-text-sm font-light">
          {isOpen ? '[-]' : '[+]'}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen mt-3' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
