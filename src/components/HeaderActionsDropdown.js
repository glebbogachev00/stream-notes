import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const HeaderActionsDropdown = ({ onFeedback }) => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  const actions = [
    {
      label: 'view updates',
      action: () => window.open('https://gleb-bogachev.notion.site/updates-stream?source=copy_link', '_blank'),
      icon: '↗'
    },
    {
      label: settings.personalityEnabled ? 'help improve stream' : 'feedback',
      action: onFeedback,
      icon: '?'
    },
    {
      label: 'support project',
      action: () => window.open('https://ko-fi.com/banhmii#avatarModal', '_blank'),
      icon: '♡'
    }
  ];

  if (!settings.showHeaderButtons) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors dynamic-text-base`}
        title="More actions"
      >
        •••
      </button>
      
      {isOpen && (
        <div 
          className={`absolute right-0 top-full ${theme.bg} ${theme.border} border shadow-lg z-50 min-w-[140px] rounded-sm`}
          style={{ marginTop: '8px' }}
        >
          {actions.map((item, index) => (
            <button
              key={index}
              onClick={() => handleAction(item.action)}
              className={`w-full text-left px-3 py-2 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors flex items-center gap-2 first:rounded-t-sm last:rounded-b-sm`}
            >
              <span className={`${theme.textTertiary} w-3 text-center`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderActionsDropdown;