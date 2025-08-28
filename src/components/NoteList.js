import React, { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { getRandomMessage, EMPTY_STATE_MESSAGES } from '../utils/messages';

const NoteList = ({ 
  notes, 
  onDeleteNote, 
  onSaveNote, 
  getTimeInfo, 
  editingNoteId, 
  onSetEditingNoteId, 
  onUpdateNoteContent 
}) => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const editingTextareaRef = useRef(null);

  useEffect(() => {
    if (editingNoteId && editingTextareaRef.current) {
      editingTextareaRef.current.focus();
      editingTextareaRef.current.style.height = 'auto';
      editingTextareaRef.current.style.height = `${editingTextareaRef.current.scrollHeight}px`;
    }
  }, [editingNoteId]);

  const handleContentChange = (e, noteId) => {
    onUpdateNoteContent(noteId, e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const getEmptyStateIcon = () => {
    const icons = ['·', '—', '~', '∘', '∙', '–', '○'];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className={`text-sm ${theme.textTertiary} font-light`}>
          <span className="empty-state-icon">{getEmptyStateIcon()}</span>
          {getRandomMessage(EMPTY_STATE_MESSAGES, settings.personalityEnabled)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notes.map((note) => {
        const timeInfo = getTimeInfo(note.createdAt);
        
        return (
          <article
            key={note.id}
            className={`group pb-6 border-b transition-all duration-200 ${
              timeInfo.isExpiringSoon 
                ? 'border-orange-200' 
                : `${theme.borderSecondary} ${theme.borderSecondaryHover}`
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {editingNoteId === note.id ? (
                  <textarea
                    ref={editingTextareaRef}
                    value={note.content}
                    onChange={(e) => handleContentChange(e, note.id)}
                    onBlur={() => onSetEditingNoteId(null)}
                    className={`${theme.text} text-sm font-light leading-relaxed whitespace-pre-wrap break-words mb-3 w-full bg-transparent resize-none focus:outline-none`}
                  />
                ) : (
                  <p 
                    onClick={() => onSetEditingNoteId(note.id)}
                    className={`${theme.text} text-sm font-light leading-relaxed whitespace-pre-wrap break-words mb-3 cursor-pointer`}
                  >
                    {note.content}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-light typography-system ${
                    timeInfo.isExpiringSoon ? 'text-orange-500' : theme.textTertiary
                  }`}>
                    {timeInfo.timeText}
                  </span>
                  
                  {timeInfo.isExpiringSoon && (
                    <span className="text-orange-500 font-light typography-system">
                      expires in {timeInfo.hoursRemaining}h {timeInfo.minutesRemaining}m
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  onClick={() => onSaveNote(note.id)}
                  className={`flex items-center gap-1 px-3 py-1 text-xs typography-title ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-all duration-200 micro-hover icon-hover`}
                  title="Save this note permanently"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  save
                </button>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className={`flex items-center gap-1 px-3 py-1 text-xs typography-title ${theme.textTertiary} hover:text-red-500 transition-all duration-200 micro-hover icon-hover`}
                  title="Delete this note"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default NoteList;