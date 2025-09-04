import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, DELETE_TIMERS } from '../contexts/SettingsContext';
import { getRandomMessage, EMPTY_STATE_MESSAGES } from '../utils/messages';
import { handleTextareaChange, handleTextareaKeyDown, setupTextareaForEditing, handleTextareaClick } from '../utils/textareaHelpers';
import TagSignature from './TagSignature';
import DeleteTimerControl from './DeleteTimerControl';
import FullscreenNoteModal from './FullscreenNoteModal';

const NoteList = ({ 
  notes, 
  onDeleteNote, 
  onSaveNote, 
  onTransformToSAMO,
  getTimeInfo, 
  editingNoteId, 
  onSetEditingNoteId, 
  onUpdateNoteContent,
  onUpdateNoteDeleteTimer,
  onUpdateNoteProperties,
  onTogglePin
}) => {
  const { theme } = useTheme();
  const { settings, formatText, removeListFormatting } = useSettings();
  const editingTextareaRef = useRef(null);
  const deleteTimerControlRef = useRef(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [fullscreenNoteId, setFullscreenNoteId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: false });

  const handleMenuToggle = (noteId, event) => {
    if (openMenuId === noteId) {
      setOpenMenuId(null);
      return;
    }

    const buttonRect = event.target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = 200; // Approximate menu height
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const shouldShowAbove = spaceBelow < menuHeight && buttonRect.top > menuHeight;

    setMenuPosition({ top: shouldShowAbove });
    setOpenMenuId(noteId);
  };

  useEffect(() => {
    if (editingNoteId && editingTextareaRef.current) {
      setupTextareaForEditing(editingTextareaRef.current);
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
    handleTextareaChange(e, (value) => {
      if (value.trim() === '') {
        onDeleteNote(noteId);
      } else {
        onUpdateNoteContent(noteId, value);
      }
    });
  };

  const handleEditingFinished = (noteId, content, event) => {
    if (event && event.relatedTarget && (
      (deleteTimerControlRef.current && deleteTimerControlRef.current.contains(event.relatedTarget)) ||
      event.relatedTarget.closest('.editing-controls')
    )) {
      return; // Don't close if focus moved to controls
    }
    // Disable auto-formatting - user must explicitly use List control
    onUpdateNoteContent(noteId, content);
    onSetEditingNoteId(null);
  };

  const handleNoteKeyDown = (e, noteId) => {
    if (e.key === 'Enter' && editingNoteId !== noteId) {
      e.preventDefault();
      onSetEditingNoteId(noteId);
    }
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

  const renderFormattedText = (content) => {
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      let keyIndex = 0;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        parts.push(<strong key={`bold-${lineIndex}-${keyIndex++}`} className="font-bold">{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      return (
        <span key={`line-${lineIndex}`}>
          {parts.length > 0 ? parts : line}
          {lineIndex < lines.length - 1 && '\n'}
        </span>
      );
    });
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


  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter(note => note.isPinned);
  const unpinnedNotes = notes.filter(note => !note.isPinned);

  const renderNote = (note) => {
          const timeInfo = getTimeInfo(note);
          
          return (
            <article
              key={note.id}
              tabIndex={0}
              onKeyDown={(e) => handleNoteKeyDown(e, note.id)}
              className={`group pb-6 border-b transition-all duration-200 relative ${
                timeInfo.isExpiringSoon 
                  ? 'border-orange-200' 
                  : `${theme.borderSecondary} ${theme.borderSecondaryHover}`
              } ${note.isPinned ? `${theme.bg} ${theme.border} border rounded-lg p-4 mb-4` : ''}`}
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
            <div className="relative">
              <div className="pr-2">
                {editingNoteId === note.id ? (
                  <>
                    {/* Controls at top for both mobile and desktop */}
                    <div className={`sticky top-0 z-20 mb-4 -mx-4 px-4 py-3 ${theme.bg} backdrop-blur-sm`}>
                      <div ref={deleteTimerControlRef} className={`flex items-center justify-start gap-4 editing-controls ${theme.borderSecondary} border-b pb-3`}>
                        <DeleteTimerControl note={note} onUpdateNoteDeleteTimer={onUpdateNoteDeleteTimer} textSize="text-xs" />
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const textarea = editingTextareaRef.current;
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
                              
                              onUpdateNoteContent(note.id, newText);
                              
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(newStart, newEnd);
                              }, 0);
                            }
                          }}
                          className={`text-xs ${theme.textTertiary} hover:text-yellow-500 transition-colors duration-200 font-light`}
                        >
                          bold
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const textarea = editingTextareaRef.current;
                            if (textarea) {
                              textarea.select();
                              textarea.focus();
                            }
                          }}
                          className={`text-xs ${theme.textTertiary} hover:text-purple-500 transition-colors duration-200 font-light`}
                        >
                          select all
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const textarea = editingTextareaRef.current;
                            if (textarea) {
                              let textToFormat;
                              let start, end;
                              
                              if (textarea.selectionStart !== textarea.selectionEnd) {
                                // User has selected text - format only selection
                                start = textarea.selectionStart;
                                end = textarea.selectionEnd;
                                textToFormat = textarea.value.substring(start, end);
                              } else {
                                // No selection - format entire content
                                start = 0;
                                end = textarea.value.length;
                                textToFormat = textarea.value;
                              }
                              
                              // Apply list formatting to the text
                              const formattedText = formatText(textToFormat);
                              const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
                              
                              onUpdateNoteContent(note.id, newText);
                              
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(start, start + formattedText.length);
                              }, 0);
                            }
                          }}
                          className={`text-xs ${theme.textTertiary} hover:text-blue-500 transition-colors duration-200 font-light`}
                        >
                          list
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFullscreenNoteId(note.id);
                          }}
                          className={`text-xs ${theme.textTertiary} hover:text-green-500 transition-colors duration-200 font-light`}
                        >
                          expand
                        </button>
                      </div>
                    </div>

                    <textarea
                      ref={editingTextareaRef}
                      value={note.content}
                      onChange={(e) => handleContentChange(e, note.id)}
                      onBlur={(e) => handleEditingFinished(note.id, note.content, e)}
                      onKeyDown={(e) => handleTextareaKeyDown(e, () => handleEditingFinished(note.id, note.content))}
                      onClick={handleTextareaClick}
                      className={`${theme.text} text-base font-light leading-relaxed whitespace-pre-wrap break-words mb-3 w-full bg-transparent resize-none focus:outline-none`}
                      style={{ 
                        height: 'auto', 
                        minHeight: '1.5em',
                        WebkitAppearance: 'none',
                        WebkitUserSelect: 'text',
                        overflow: 'hidden'
                      }}
                    />
                  </>
                ) : (
                  <div>
                    <p 
                      onClick={() => onSetEditingNoteId(note.id)}
                      className={`${theme.text} text-base font-light leading-relaxed whitespace-pre-wrap break-words mb-3 cursor-pointer transition-smooth hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                    >
                      {renderFormattedText(shouldTruncateNote(note.content) && !expandedNotes.has(note.id) 
                        ? getTruncatedContent(note.content)
                        : note.content
                      )}
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
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-xs">
                  <TagSignature />
                  <span className={`font-light typography-system ${
                    timeInfo.isExpiringSoon ? 'text-orange-500' : theme.textTertiary
                  }`}>
                    {timeInfo.timeText}
                  </span>
                </div>
              </div>
              
              <div className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                <div className="relative" data-menu>
                  <button
                    onClick={(e) => handleMenuToggle(note.id, e)}
                    className={`px-3 py-2 text-lg font-bold ${theme.textTertiary} hover:${theme.text} transition-colors duration-200 ${theme.bg}/90 backdrop-blur-sm rounded shadow-sm`}
                    title="More actions"
                  >
                    ⋯
                  </button>
                  
                  {openMenuId === note.id && (
                    <div className={`absolute ${menuPosition.top ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 ${theme.bg} ${theme.borderPrimary} border rounded shadow-lg py-1 z-10 min-w-20`}>
                      <button
                        onClick={() => {
                          onTogglePin(note.id);
                          setOpenMenuId(null);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-orange-500 hover:${theme.bgSecondary} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {note.isPinned ? 'unpin' : 'pin'}
                      </button>

                      <button
                        onClick={(e) => {
                          navigator.clipboard.writeText(note.content);
                          setOpenMenuId(null);
                          e.target.closest('button').classList.add('animate-pulse');
                          setTimeout(() => {
                            e.target.closest('button')?.classList.remove('animate-pulse');
                          }, 600);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-blue-500 hover:${theme.bgSecondary} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        copy
                      </button>
                      
                      <button
                        onClick={(e) => {
                          onSaveNote(note.id);
                          setOpenMenuId(null);
                          e.target.closest('button').classList.add('animate-bounce');
                          setTimeout(() => {
                            e.target.closest('button')?.classList.remove('animate-bounce');
                          }, 600);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-green-500 hover:${theme.bgSecondary} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        save
                      </button>
                      {settings.samoModeEnabled && (
                        <button
                          onClick={() => {
                            onTransformToSAMO(note.id);
                            setOpenMenuId(null);
                          }}
                          className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-purple-500 hover:${theme.bgSecondary} transition-colors duration-200 flex items-center gap-2`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l8 8-8 8" />
                          </svg>
                          samo
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDeleteNote(note.id);
                          setOpenMenuId(null);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-red-500 hover:${theme.bgSecondary} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
  };

  return (
    <div className="space-y-6">
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <>
          <div className="space-y-6">
            <div className={`flex items-center gap-2 ${theme.textTertiary} text-xs font-light`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              pinned
            </div>
            {pinnedNotes.map(renderNote)}
          </div>
          
          {/* Divider */}
          {unpinnedNotes.length > 0 && (
            <div className={`border-t ${theme.borderSecondary} pt-6`}>
              <div className={`text-xs font-light ${theme.textTertiary} mb-6`}>recent</div>
            </div>
          )}
        </>
      )}

      {/* Unpinned Notes Section */}
      <div className="space-y-6">
        {unpinnedNotes.map(renderNote)}
      </div>
      
      <FullscreenNoteModal
        note={notes.find(n => n.id === fullscreenNoteId)}
        isOpen={!!fullscreenNoteId}
        onClose={() => setFullscreenNoteId(null)}
        onUpdateNote={onUpdateNoteContent}
        onUpdateNoteProperties={onUpdateNoteProperties}
        onUpdateNoteDeleteTimer={onUpdateNoteDeleteTimer}
        isActiveNote={true}
      />
    </div>
  );
};

export default NoteList;