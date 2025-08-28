import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SavedNotes = ({ savedNotes, onDeleteNote }) => {
  const { theme } = useTheme();

  if (savedNotes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className={`text-sm ${theme.textTertiary} font-light`}>
          no saved notes
        </p>
      </div>
    );
  }

  const formatSavedDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Saved today';
    } else if (diffInDays === 1) {
      return 'Saved yesterday';
    } else if (diffInDays < 30) {
      return `Saved ${diffInDays} days ago`;
    } else {
      return `Saved ${date.toLocaleDateString()}`;
    }
  };

  return (
    <div className="space-y-6">
      {savedNotes.map((note) => (
        <article
          key={note.id}
          className={`group pb-6 border-b ${theme.borderSecondary} ${theme.borderSecondaryHover} transition-all duration-200`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className={`${theme.text} text-sm font-light leading-relaxed whitespace-pre-wrap break-words mb-3`}>
                {note.content}
              </p>
              
              <div className="flex items-center gap-3 text-xs">
                <span className={`${theme.textTertiary} font-light`}>
                  {formatSavedDate(note.savedAt)}
                </span>
                <span className={`hidden sm:inline ${theme.textTertiary} font-light`}>
                  created {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onDeleteNote(note.id)}
                className={`px-2 py-1 text-xs font-light ${theme.textTertiary} hover:text-red-500 transition-colors duration-200`}
                title="Delete this saved note"
              >
                delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default SavedNotes;