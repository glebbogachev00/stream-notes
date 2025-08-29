import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const SavedNotes = ({ savedNotes, onDeleteNote, onUpdateNote }) => {
  const { theme } = useTheme();
  const { formatText } = useSettings();
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [fullscreenNoteId, setFullscreenNoteId] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const editingTextareaRef = useRef(null);

  useEffect(() => {
    if (editingNoteId && editingTextareaRef.current) {
      editingTextareaRef.current.focus();
      editingTextareaRef.current.style.height = 'auto';
      editingTextareaRef.current.style.height = `${editingTextareaRef.current.scrollHeight}px`;
    }
  }, [editingNoteId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-menu]')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleContentChange = (e, noteId) => {
    onUpdateNote(noteId, e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleEditingFinished = (noteId, content) => {
    const formattedContent = formatText(content);
    onUpdateNote(noteId, formattedContent);
    setEditingNoteId(null);
  };

  const toggleNoteExpansion = (noteId) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const shouldTruncateNote = (content) => {
    return content.split('\n').length > 3 || content.length > 150;
  };

  const getTruncatedContent = (content) => {
    const lines = content.split('\n');
    if (lines.length > 3) {
      return lines.slice(0, 3).join('\n') + '...';
    }
    if (content.length > 150) {
      return content.substring(0, 150) + '...';
    }
    return content;
  };

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

  const fullscreenNote = savedNotes.find(note => note.id === fullscreenNoteId);

  return (
    <>
      <div className="space-y-6">
        {savedNotes.map((note) => (
          <article
            key={note.id}
            className={`group pb-6 border-b ${theme.borderSecondary} ${theme.borderSecondaryHover} transition-all duration-200`}
          >
            <div className="relative">
              <div>
                {editingNoteId === note.id ? (
                  <textarea
                    ref={editingTextareaRef}
                    value={note.content}
                    onChange={(e) => handleContentChange(e, note.id)}
                    onBlur={() => handleEditingFinished(note.id, note.content)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleEditingFinished(note.id, note.content);
                      }
                    }}
                    className={`${theme.text} text-base font-light leading-relaxed whitespace-pre-wrap break-words mb-3 w-full bg-transparent resize-none focus:outline-none`}
                  />
                ) : (
                  <div>
                    <p 
                      onClick={() => setEditingNoteId(note.id)}
                      className={`${theme.text} text-base font-light leading-relaxed whitespace-pre-wrap break-words mb-3 cursor-pointer transition-smooth hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                    >
                      {shouldTruncateNote(note.content) && !expandedNotes.has(note.id) 
                        ? getTruncatedContent(note.content)
                        : note.content
                      }
                    </p>
                    {shouldTruncateNote(note.content) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleNoteExpansion(note.id)}
                          className={`flex items-center gap-1 text-xs ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors mb-2 font-light`}
                        >
                          <svg 
                            className={`w-3 h-3 transition-transform duration-200 ${expandedNotes.has(note.id) ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {expandedNotes.has(note.id) ? 'Show less' : 'Show more'}
                        </button>
                        <button
                          onClick={() => setFullscreenNoteId(note.id)}
                          className={`flex items-center gap-1 text-xs ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors mb-2 font-light`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          Fullscreen
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-xs">
                  <span className={`${theme.textTertiary} font-light`}>
                    {formatSavedDate(note.savedAt)}
                  </span>
                  <span className={`hidden sm:inline ${theme.textTertiary} font-light`}>
                    created {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                <div className="relative" data-menu>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                    className={`px-3 py-2 text-lg font-bold ${theme.textTertiary} hover:${theme.text} transition-colors duration-200 ${theme.bg}/90 backdrop-blur-sm rounded shadow-sm`}
                    title="More actions"
                  >
                    ⋯
                  </button>
                  
                  {openMenuId === note.id && (
                    <div className={`absolute top-full right-0 mt-1 ${theme.bg} ${theme.borderPrimary} border rounded shadow-lg py-1 z-10 min-w-20`}>
                      <button
                        onClick={() => {
                          onDeleteNote(note.id);
                          setOpenMenuId(null);
                        }}
                        className={`w-full px-3 py-1 text-xs font-light text-left ${theme.textTertiary} hover:text-red-500 hover:${theme.bgSecondary} transition-colors duration-200`}
                      >
                        delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {fullscreenNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className={`${theme.bg} w-full max-w-4xl max-h-[90vh] m-4 rounded-lg shadow-xl overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-4 border-b ${theme.borderSecondary}`}>
              <span className={`text-sm ${theme.textTertiary} font-light`}>
                {formatSavedDate(fullscreenNote.savedAt)}
              </span>
              <button
                onClick={() => setFullscreenNoteId(null)}
                className={`px-2 py-1 text-sm font-light ${theme.textTertiary} hover:${theme.text} transition-colors duration-200`}
                title="Close fullscreen view"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className={`${theme.text} text-lg font-light leading-relaxed whitespace-pre-wrap break-words`}>
                {fullscreenNote.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SavedNotes;