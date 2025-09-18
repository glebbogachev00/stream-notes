import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const FolderFilter = ({ activeFolder, setActiveFolder }) => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAddingFolder && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingFolder]);

  const handleAddFolder = (event) => {
    event.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      return;
    }

    const existingMatch = settings.folders.find((folder) => folder.toLowerCase() === trimmed.toLowerCase());
    if (existingMatch) {
      setActiveFolder(existingMatch);
      setNewFolderName('');
      setIsAddingFolder(false);
      return;
    }

    updateSettings({ folders: [...settings.folders, trimmed] });
    setActiveFolder(trimmed);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleCancelAdd = () => {
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelAdd();
    }
  };

  if (!settings.foldersEnabled) {
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
        {settings.foldersEnabled && (
          isAddingFolder ? (
            <form
              onSubmit={handleAddFolder}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-light ${theme.bg} ${theme.text} shadow-sm`}
            >
              <input
                ref={inputRef}
                type="text"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="folder name"
                className={`bg-transparent focus:outline-none border-b ${theme.borderSecondary} pb-1 min-w-[120px]`}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className={`dynamic-text-xs font-light ${
                  newFolderName.trim()
                    ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`
                    : theme.textTertiary
                } transition-colors`}
              >
                add
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingFolder(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors duration-200 border border-dashed ${theme.borderSecondary}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>new folder</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default FolderFilter;
