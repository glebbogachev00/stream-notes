import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const FolderFilter = ({ activeFolder, setActiveFolder }) => {
  const { theme } = useTheme();
  const { settings } = useSettings();

  if (!settings.foldersEnabled || settings.folders.length === 0) {
    return null;
  }

  const FolderIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );

  const AllNotesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 12h14M5 16h14" />
    </svg>
  );

  return (
    <div className="mb-4 overflow-x-auto whitespace-nowrap pb-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveFolder('all')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-light transition-colors duration-200 ${
            activeFolder === 'all'
              ? `${theme.bg} ${theme.text} shadow-sm`
              : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
          }`}
        >
          <AllNotesIcon />
          <span>All</span>
        </button>
        {settings.folders.map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-light transition-colors duration-200 ${
              activeFolder === folder
                ? `${theme.bg} ${theme.text} shadow-sm`
                : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
            }`}
          >
            <FolderIcon />
            <span>{folder}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FolderFilter;