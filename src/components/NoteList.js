import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, DELETE_TIMERS } from '../contexts/SettingsContext';
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
  const { settings, formatText } = useSettings();
  const editingTextareaRef = useRef(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

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

  const handleEditingFinished = (noteId, content) => {
    const formattedContent = formatText(content);
    onUpdateNoteContent(noteId, formattedContent);
    onSetEditingNoteId(null);
  };

  const getEmptyStateIcon = () => {
    const icons = ['·', '—', '~', '∘', '∙', '–', '○'];
    return icons[Math.floor(Math.random() * icons.length)];
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
            className={`group pb-6 border-b transition-all duration-200 relative ${
              timeInfo.isExpiringSoon 
                ? 'border-orange-200' 
                : `${theme.borderSecondary} ${theme.borderSecondaryHover}`
            }`}
          >
            {/* Expiration progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
              <div 
                className={`h-full transition-all duration-1000 ${
                  timeInfo.isExpiringSoon ? 'bg-orange-400' : 'bg-gray-300'
                }`}
                style={{
                  width: `${timeInfo.hoursRemaining === Infinity ? 100 : Math.max(0, (timeInfo.hoursRemaining / (DELETE_TIMERS[settings.deleteTimer]?.hours || 24)) * 100)}%`
                }}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
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
                    className={`${theme.text} text-sm font-light leading-relaxed whitespace-pre-wrap break-words mb-3 w-full bg-transparent resize-none focus:outline-none`}
                  />
                ) : (
                  <div>
                    <p 
                      onClick={() => onSetEditingNoteId(note.id)}
                      className={`${theme.text} text-sm font-light leading-relaxed whitespace-pre-wrap break-words mb-3 cursor-pointer transition-smooth hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                    >
                      {shouldTruncateNote(note.content) && !expandedNotes.has(note.id) 
                        ? getTruncatedContent(note.content)
                        : note.content
                      }
                    </p>
                    {shouldTruncateNote(note.content) && (
                      <button
                        onClick={() => toggleNoteExpansion(note.id)}
                        className={`text-xs ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors mb-2 font-light`}
                      >
                        {expandedNotes.has(note.id) ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
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
                  onClick={(e) => {
                    navigator.clipboard.writeText(note.content);
                    e.target.closest('button').classList.add('animate-pulse');
                    setTimeout(() => {
                      e.target.closest('button')?.classList.remove('animate-pulse');
                    }, 600);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-xs typography-title ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-all duration-200 micro-hover icon-hover active:scale-95`}
                  title="Copy this note"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  copy
                </button>
                <button
                  onClick={(e) => {
                    onSaveNote(note.id);
                    e.target.closest('button').classList.add('animate-bounce');
                    setTimeout(() => {
                      e.target.closest('button')?.classList.remove('animate-bounce');
                    }, 600);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-xs typography-title ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-all duration-200 micro-hover icon-hover active:scale-95`}
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