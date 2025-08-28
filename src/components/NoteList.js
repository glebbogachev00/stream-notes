import React, { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className={`text-sm ${theme.textTertiary} font-light`}>
          no notes yet
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
                  <span className={`font-light ${
                    timeInfo.isExpiringSoon ? 'text-orange-500' : theme.textTertiary
                  }`}>
                    {timeInfo.timeText}
                  </span>
                  
                  {timeInfo.isExpiringSoon && (
                    <span className="text-orange-500 font-light">
                      expires in {timeInfo.hoursRemaining}h {timeInfo.minutesRemaining}m
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onSaveNote(note.id)}
                  className={`px-2 py-1 text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors duration-200`}
                  title="Save this note permanently"
                >
                  save
                </button>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className={`px-2 py-1 text-xs font-light ${theme.textTertiary} hover:text-red-500 transition-colors duration-200`}
                  title="Delete this note"
                >
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