import React, { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { handleTextareaChange, setupTextareaForEditing, handleTextareaClick } from '../utils/textareaHelpers';
import DeleteTimerControl from './DeleteTimerControl';

const FullscreenNoteModal = ({ 
  note, 
  isOpen, 
  onClose, 
  onUpdateNote, 
  onUpdateNoteProperties, 
  onUpdateNoteDeleteTimer,
  isActiveNote = false
}) => {
  const { theme } = useTheme();
  const { formatText } = useSettings();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setupTextareaForEditing(textareaRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleContentChange = (e) => {
    handleTextareaChange(e, (value) => {
      if (value.trim() === '') {
        // Don't auto-delete in fullscreen mode, just update
        onUpdateNote(note.id, value);
      } else {
        onUpdateNote(note.id, value);
      }
    });
  };

  const handleBoldClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const textarea = textareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      let newText, newStart, newEnd;
      
      // Check if selected text is already bold (includes ** in selection)
      if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
        // Remove bold formatting from selected text
        const unboldText = selectedText.slice(2, -2);
        newText = textarea.value.substring(0, start) + unboldText + textarea.value.substring(end);
        newStart = start;
        newEnd = start + unboldText.length;
      } else {
        // Check if selection is surrounded by ** (not included in selection)
        const beforeText = textarea.value.substring(Math.max(0, start - 2), start);
        const afterText = textarea.value.substring(end, Math.min(textarea.value.length, end + 2));
        
        if (beforeText === '**' && afterText === '**') {
          // Remove surrounding ** 
          newText = textarea.value.substring(0, start - 2) + selectedText + textarea.value.substring(end + 2);
          newStart = start - 2;
          newEnd = end - 2;
        } else {
          // Add bold formatting
          newText = textarea.value.substring(0, start) + `**${selectedText}**` + textarea.value.substring(end);
          newStart = start + 2;
          newEnd = end + 2;
        }
      }
      
      onUpdateNote(note.id, newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newStart, newEnd);
      }, 0);
    }
  };

  const handleListToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentFormatting = note.autoFormat !== false;
    
    let newContent;
    if (currentFormatting) {
      newContent = note.content
        .split('\n')
        .map(line => line.replace(/^(\d+\.|[•\-*]\s)/, '').trim())
        .join('\n');
    } else {
      newContent = formatText(note.content);
    }
    
    if (onUpdateNoteProperties) {
      onUpdateNoteProperties(note.id, { 
        autoFormat: !currentFormatting,
        content: newContent
      });
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.bg} ${theme.text} rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.borderSecondary}`}>
          <h2 className={`text-lg font-light ${theme.text}`}>Note Editor</h2>
          <button
            onClick={onClose}
            className={`p-2 ${theme.textTertiary} hover:${theme.text} transition-colors duration-200`}
            aria-label="Close fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={handleContentChange}
            onClick={handleTextareaClick}
            className={`${theme.text} text-base font-light leading-relaxed whitespace-pre-wrap break-words w-full bg-transparent resize-none focus:outline-none flex-1`}
            placeholder="Start typing..."
          />
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-start gap-4 p-4 border-t ${theme.borderSecondary}`}>
          {isActiveNote && (
            <DeleteTimerControl 
              note={note} 
              onUpdateNoteDeleteTimer={onUpdateNoteDeleteTimer} 
            />
          )}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleBoldClick}
            className={`text-xs ${theme.textTertiary} hover:text-yellow-500 transition-colors duration-200 font-light`}
          >
            bold
          </button>
          {onUpdateNoteProperties && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleListToggle}
              className={`text-xs ${theme.textTertiary} hover:text-blue-500 transition-colors duration-200 font-light`}
            >
              list
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullscreenNoteModal;