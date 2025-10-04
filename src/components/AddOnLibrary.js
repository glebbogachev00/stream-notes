import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const AddOnLibrary = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { settings, addAddOnToSettings } = useSettings();
  const [expandedAddOns, setExpandedAddOns] = useState({});

  // Available add-ons that can be added to settings
  const availableAddOns = [
    {
      id: 'timer',
      name: 'timer',
      description: 'minimal focus timer above your notes. supports formats like 5m, 1h30m, 25:00',
      settingKey: 'timerEnabled'
    },
    {
      id: 'writingMode',
      name: 'writing mode',
      description: 'adds expand button and active/save note options for initial note creation',
      settingKey: 'writingModeEnabled'
    },
    {
      id: 'streamAssistant',
      name: 'talk to stream',
      description: 'AI assistant to help with notes and settings',
      settingKey: 'streamAssistantEnabled'
    },
    {
      id: 'search',
      name: 'search',
      description: 'search through all your notes quickly',
      settingKey: 'searchEnabled'
    },
    {
      id: 'folders',
      name: 'folders',
      description: 'organize notes into custom folders',
      settingKey: 'foldersEnabled'
    },
    {
      id: 'enhancedEditing',
      name: 'note controls',
      description: 'enhanced editing controls for all your notes',
      settingKey: 'enhancedEditingEnabled'
    },
    {
      id: 'autoSorting',
      name: 'auto-sorting',
      description: 'smart formatting and organization for lists',
      settingKey: 'autoSortingEnabled'
    },
    {
      id: 'flowFormatting',
      name: 'flow formatting',
      description: 'automatic text flow formatting as you type',
      settingKey: 'flowFormattingEnabled'
    }
  ];

  const toggleExpanded = (addOnId) => {
    setExpandedAddOns(prev => ({
      ...prev,
      [addOnId]: !prev[addOnId]
    }));
  };

  const addToSettings = (addOn) => {
    // Only add if not already in settings
    if (!settings.addOnsInSettings.includes(addOn.id)) {
      addAddOnToSettings(addOn.id);
    }
  };

  const isInSettings = (addOn) => {
    return settings.addOnsInSettings.includes(addOn.id);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              add-on library
            </h2>
            <p className={`dynamic-text-xs ${theme.textTertiary} font-light mt-1`}>
              browse and add features to your settings
            </p>
          </div>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        <div className="space-y-4">
          {availableAddOns.map((addOn) => (
            <div key={addOn.id}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleExpanded(addOn.id)}
                  className={`flex-1 text-left transition-all duration-200 ${theme.text} hover:${theme.text.replace('text-', 'hover:text-')}`}
                >
                  <h3 className={`dynamic-text-base font-light`}>{addOn.name}</h3>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleExpanded(addOn.id)}
                    className={`p-1 dynamic-text-base font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors`}
                  >
                    {expandedAddOns[addOn.id] ? '[-]' : '[+]'}
                  </button>
                  <button
                    onClick={() => addToSettings(addOn)}
                    disabled={isInSettings(addOn)}
                    className={`p-1 dynamic-text-base font-light transition-colors ${
                      isInSettings(addOn)
                        ? `${theme.textTertiary} cursor-not-allowed`
                        : `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} cursor-pointer`
                    }`}
                    title={isInSettings(addOn) ? 'Already in settings' : 'Add to settings'}
                  >
                    [✓]
                  </button>
                </div>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedAddOns[addOn.id] ? 'max-h-screen mt-3' : 'max-h-0'}`}>
                <p className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
                  {addOn.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 pt-4 border-t ${theme.borderSecondary}`}>
          <p className={`dynamic-text-xs ${theme.textTertiary} font-light text-center`}>
            Use [+] to see more info and [✓] to add to settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddOnLibrary;