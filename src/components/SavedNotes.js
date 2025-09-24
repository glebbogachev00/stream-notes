import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { handleTextareaChange, handleTextareaKeyDown, setupTextareaForEditing, handleTextareaClick } from '../utils/textareaHelpers';
import { toggleBoldFormatting, toggleListFormatting } from '../utils/formatting';
import { getRandomMessage, LOGGED_OUT_EMPTY_STATE_MESSAGES } from '../utils/messages';
import TagSignature from './TagSignature';
import FullscreenNoteModal from './FullscreenNoteModal';

const SavedNotes = ({ savedNotes, onDeleteNote, onUpdateNote, onUpdateNoteProperties, onToggleSavedNotePin, onTransformToSAMO, onUpdateNoteFolder, isLoggedOut = false }) => {
  const { theme } = useTheme();
  const { settings, formatNote } = useSettings();
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [folderMenuOpenForNoteId, setFolderMenuOpenForNoteId] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [fullscreenNoteId, setFullscreenNoteId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: false });
  const editingTextareaRef = useRef(null);

  const shouldTruncateNote = useCallback((content) => {
    return content.split('\n').length > 3 || content.length > 150;
  }, []);


  // Handle showMoreByDefault setting - expand notes that should be truncated if the setting is enabled
  useEffect(() => {
    if (settings.showMoreByDefault) {
      setExpandedNotes(prev => {
        const newSet = new Set(prev);
        savedNotes.forEach(note => {
          if (shouldTruncateNote(note.content)) {
            newSet.add(note.id);
          }
        });
        return newSet;
      });
    }
  }, [settings.showMoreByDefault, savedNotes, shouldTruncateNote]);

  const handleMenuToggle = useCallback((noteId, event) => {
    if (openMenuId === noteId) {
      setOpenMenuId(null);
      return;
    }

    const buttonRect = event.target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate dynamic menu height based on enabled features
    let menuItemCount = 3; // pin, copy, delete (always present)
    if (settings.foldersEnabled && settings.folders.length > 0) menuItemCount += 1; // move
    if (settings.flowFormattingEnabled) menuItemCount += 1; // format
    if (settings.samoModeEnabled) menuItemCount += 1; // samo
    
    const menuHeight = (menuItemCount * 44) + 16; // ~44px per item + padding
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const shouldShowAbove = spaceBelow < menuHeight && spaceAbove > menuHeight;

    setMenuPosition({ top: shouldShowAbove });
    setOpenMenuId(noteId);
  }, [openMenuId, settings.foldersEnabled, settings.folders.length, settings.flowFormattingEnabled, settings.samoModeEnabled]);

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

  // Handle clicking outside of editing note to close edit mode
  useEffect(() => {
    const handleClickOutsideEdit = (event) => {
      if (editingNoteId && 
          !event.target.closest('textarea') && 
          !event.target.closest('.editing-controls') &&
          !event.target.closest('button') &&
          !event.target.closest('.note-content')) {
        const note = savedNotes.find(n => n.id === editingNoteId);
        if (note) {
          onUpdateNote(editingNoteId, note.content);
        }
        setEditingNoteId(null);
      }
    };

    if (editingNoteId) {
      // Use touchend for better mobile support, click for desktop
      const eventType = 'ontouchstart' in window ? 'touchend' : 'click';
      
      // Add slight delay to prevent immediate closure when entering edit mode
      const timeoutId = setTimeout(() => {
        document.addEventListener(eventType, handleClickOutsideEdit, { passive: true });
      }, 150);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener(eventType, handleClickOutsideEdit);
      };
    }
  }, [editingNoteId, savedNotes, onUpdateNote]);

  const handleContentChange = useCallback((e, noteId) => {
    handleTextareaChange(e, (value) => {
      // Always update content, don't auto-delete on empty
      // User can manually delete if they want to  
      onUpdateNote(noteId, value);
    });
  }, [onUpdateNote]);

  const handleEditingFinished = useCallback((noteId, content) => {
    // Disable auto-formatting - user must explicitly use List control
    onUpdateNote(noteId, content);
    setEditingNoteId(null);
  }, [onUpdateNote]);

  const handleNoteClick = useCallback((noteId, event) => {
    // Prevent triggering when clicking on buttons or controls
    if (event.target.closest('button') || event.target.closest('.editing-controls')) {
      return;
    }
    
    // Prevent default to avoid any mobile touch conflicts
    event.preventDefault();
    event.stopPropagation();
    
    setEditingNoteId(noteId);
    
    // Scroll the note into view after a brief delay to allow edit mode to activate
    setTimeout(() => {
      const noteElement = event.target.closest('article');
      if (noteElement) {
        noteElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      }
    }, 100);
  }, []);

  const handleNoteKeyDown = useCallback((e, noteId) => {
    if (e.key === 'Enter' && editingNoteId !== noteId) {
      e.preventDefault();
      setEditingNoteId(noteId);
    }
  }, [editingNoteId]);

  const toggleNoteExpansion = useCallback((noteId) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const getTruncatedContent = useCallback((content) => {
    const lines = content.split('\n');
    if (lines.length > 3) {
      return lines.slice(0, 3).join('\n') + '...';
    }
    if (content.length > 150) {
      return content.substring(0, 150) + '...';
    }
    return content;
  }, []);

  const renderFormattedText = (content) => {
    // Handle multi-line bold formatting by processing the entire content first
    const boldRegex = /\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = boldRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index);
        parts.push(beforeText);
      }
      
      // Add bold text (preserving line breaks within)
      const boldText = match[1];
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-bold">
          {boldText}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last match
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    // If no bold formatting found, return original content
    if (parts.length === 0) {
      return content;
    }

    // Split into lines while preserving formatting
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        // Split string parts by newlines
        return part.split('\n').map((line, lineIndex, array) => (
          <React.Fragment key={`text-${index}-${lineIndex}`}>
            {line}
            {lineIndex < array.length - 1 && '\n'}
          </React.Fragment>
        ));
      } else {
        // For bold elements, split their content by newlines
        const boldContent = part.props.children;
        if (typeof boldContent === 'string' && boldContent.includes('\n')) {
          return (
            <strong key={part.key} className="font-bold">
              {boldContent.split('\n').map((line, lineIndex, array) => (
                <React.Fragment key={`bold-line-${lineIndex}`}>
                  {line}
                  {lineIndex < array.length - 1 && '\n'}
                </React.Fragment>
              ))}
            </strong>
          );
        }
        return part;
      }
    }).flat();
  };

  const formatSavedDate = useCallback((timestamp) => {
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
  }, []);

  // Separate pinned and unpinned saved notes
  const pinnedSavedNotes = useMemo(() => savedNotes.filter(note => note.isPinned), [savedNotes]);
  const unpinnedSavedNotes = useMemo(() => savedNotes.filter(note => !note.isPinned), [savedNotes]);

  if (savedNotes.length === 0) {
    const emptyMessage = isLoggedOut 
      ? getRandomMessage(LOGGED_OUT_EMPTY_STATE_MESSAGES, settings.personalityEnabled)
      : "no saved notes";
    
    return (
      <div className="text-center py-16">
        <p className={`dynamic-text-base ${theme.textTertiary} font-light`}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  const renderSavedNote = (note) => {
    return (
      <article
        key={note.id}
        tabIndex={0}
        onKeyDown={(e) => handleNoteKeyDown(e, note.id)}
        className={`group pb-6 transition-all duration-200 ${
          note.isPinned ? `${theme.bg} ${theme.border} border rounded-lg p-4 mb-4` : ''
        }`}
        style={{
          borderBottom: `1px solid ${theme.separatorColor.replace('rgb(', 'rgba(').replace(')', ', 0.6)')}`
        }}
          >
            <div className="relative">
              <div>
                {editingNoteId === note.id ? (
                  <>
                    {/* Controls at top for both mobile and desktop */}
                    {settings.enhancedEditingEnabled && (
                      <div className={`sticky top-0 z-20 mb-4 -mx-4 px-4 py-3 ${theme.bg} backdrop-blur-sm`}>
                        <div className={`flex items-center justify-start ${theme.borderSecondary} border-b pb-3`}>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const textarea = editingTextareaRef.current;
                              if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
                                const { text: updatedText, selectionStart: newStart, selectionEnd: newEnd } = toggleBoldFormatting(
                                  textarea.value,
                                  textarea.selectionStart,
                                  textarea.selectionEnd
                                );

                                if (updatedText !== textarea.value) {
                                  onUpdateNote(note.id, updatedText);

                                  setTimeout(() => {
                                    if (editingTextareaRef.current) {
                                      editingTextareaRef.current.focus();
                                      editingTextareaRef.current.setSelectionRange(newStart, newEnd);
                                    }
                                  }, 0);
                                }
                              }
                            }}
                            className={`ml-3 text-xs ${theme.textTertiary} hover:text-yellow-500 transition-colors duration-200 font-light`}
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
                            className={`ml-3 text-xs ${theme.textTertiary} hover:text-purple-500 transition-colors duration-200 font-light`}
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
                                let start = textarea.selectionStart;
                                let end = textarea.selectionEnd;

                                if (start === end) {
                                  start = 0;
                                  end = textarea.value.length;
                                }

                                const textToFormat = textarea.value.substring(start, end);
                                const { text: processedText, changed } = toggleListFormatting(textToFormat, settings.organizationStyle);

                                if (changed) {
                                  const newText = textarea.value.substring(0, start) + processedText + textarea.value.substring(end);
                                  onUpdateNote(note.id, newText);

                                  setTimeout(() => {
                                    if (editingTextareaRef.current) {
                                      const selectionEnd = start + processedText.length;
                                      editingTextareaRef.current.focus();
                                      editingTextareaRef.current.setSelectionRange(start, selectionEnd);
                                    }
                                  }, 0);
                                }
                              }
                          }}
                            className={`ml-3 text-xs ${theme.textTertiary} hover:text-blue-500 transition-colors duration-200 font-light`}
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
                            className={`ml-3 text-xs ${theme.textTertiary} hover:text-green-500 transition-colors duration-200 font-light`}
                          >
                            expand
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      ref={editingTextareaRef}
                      value={note.content}
                      onChange={(e) => handleContentChange(e, note.id)}
                      onBlur={() => {
                        // Small delay to allow button clicks to register before closing edit mode
                        setTimeout(() => handleEditingFinished(note.id, note.content), 50);
                      }}
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
                  <div className="note-content">
                    <p 
                      onClick={(e) => handleNoteClick(note.id, e)}
                      onTouchEnd={(e) => {
                        // Handle touch events for better mobile response
                        e.preventDefault();
                        handleNoteClick(note.id, e);
                      }}
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
                          className={`flex items-center gap-1 dynamic-text-base ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors mb-2 font-light`}
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
                
                <div className="flex items-center gap-3 dynamic-text-base">
                  <TagSignature />
                  <span className={`${theme.textTertiary} font-light`}>
                    {formatSavedDate(note.savedAt)}
                  </span>
                </div>
              </div>
              
              <div className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                <div className="relative" data-menu>
                  <button
                    onClick={(e) => handleMenuToggle(note.id, e)}
                    className={`px-3 py-2 text-lg font-bold ${theme.textTertiary} hover:${theme.text} transition-all duration-200 ${theme.bg}/90 backdrop-blur-sm rounded shadow-sm hover:scale-110 active:scale-95`}
                    title="More actions"
                  >
                    <span className={`inline-block transition-transform duration-200 ${openMenuId === note.id ? 'rotate-90' : ''}`}>⋯</span>
                  </button>
                  
                  {openMenuId === note.id && (
                    <div className={`absolute ${menuPosition.top ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 ${theme.bg} ${theme.border} border rounded shadow-lg py-1 z-10 min-w-20 animate-in slide-in-from-top-2 fade-in duration-200`}>
                      <button
                        onClick={() => {
                          onToggleSavedNotePin(note.id);
                          setOpenMenuId(null);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-orange-500 hover:${theme.bgSecondary} transition-all duration-200 flex items-center gap-2 hover:translate-x-1 active:scale-95`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {note.isPinned ? 'unpin' : 'pin'}
                      </button>

                      {settings.foldersEnabled && settings.folders.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() => setFolderMenuOpenForNoteId(folderMenuOpenForNoteId === note.id ? null : note.id)}
                            className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-blue-500 hover:${theme.bgSecondary} transition-all duration-200 flex items-center gap-2 hover:translate-x-1 active:scale-95`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            move
                          </button>
                          {folderMenuOpenForNoteId === note.id && (
                            <div className={`absolute right-full top-0 mr-1 ${theme.bg} ${theme.border} border rounded shadow-lg py-1 z-20 min-w-max animate-in slide-in-from-left-2 fade-in duration-200`}>
                              {settings.folders.map(folder => (
                                <button
                                  key={folder}
                                  onClick={() => {
                                    onUpdateNoteFolder(note.id, folder, true);
                                    setFolderMenuOpenForNoteId(null);
                                    setOpenMenuId(null);
                                  }}
                                  className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-blue-500 hover:${theme.bgSecondary} transition-all duration-200`}
                                >
                                  {folder}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={async (e) => {
                          const textToCopy = note.content;
                          const button = e.target.closest('button');
                          
                          // Try modern clipboard API first
                          if (navigator.clipboard && window.isSecureContext) {
                            try {
                              await navigator.clipboard.writeText(textToCopy);
                              setOpenMenuId(null);
                              // Enhanced copy feedback animation
                              button.classList.add('animate-bounce', 'text-blue-500');
                              setTimeout(() => {
                                button?.classList.remove('animate-bounce', 'text-blue-500');
                              }, 600);
                              return;
                            } catch (err) {
                              // Fallback silently failed
                            }
                          }
                          
                          // Fallback method for mobile/older browsers
                          try {
                            const textArea = document.createElement('textarea');
                            textArea.value = textToCopy;
                            textArea.style.position = 'fixed';
                            textArea.style.left = '-999999px';
                            textArea.style.top = '-999999px';
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            
                            if (!successful) {
                              throw new Error('execCommand failed');
                            }
                          } catch (err) {
                            // All copy methods failed silently
                          }
                          
                          setOpenMenuId(null);
                          button.classList.add('animate-bounce', 'text-blue-500');
                          setTimeout(() => {
                            button?.classList.remove('animate-bounce', 'text-blue-500');
                          }, 600);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-blue-500 hover:${theme.bgSecondary} transition-all duration-200 flex items-center gap-2 hover:translate-x-1 active:scale-95`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        copy
                      </button>

                      {settings.flowFormattingEnabled && (
                        <button
                          onClick={async (e) => {
                            try {
                              const formattedContent = await formatNote(note.content);
                              onUpdateNote(note.id, formattedContent);
                              setOpenMenuId(null);
                              
                              // Enhanced format animation
                              const button = e.target.closest('button');
                              button.classList.add('animate-pulse', 'text-purple-500');
                              setTimeout(() => {
                                button?.classList.remove('animate-pulse');
                              }, 600);
                            } catch (error) {
                              console.error('Failed to format note:', error);
                              // Show error feedback
                              const button = e.target.closest('button');
                              button.classList.add('text-red-500');
                              setTimeout(() => {
                                button?.classList.remove('text-red-500');
                              }, 1000);
                            }
                          }}
                          className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-purple-500 hover:${theme.bgSecondary} transition-all duration-200 flex items-center gap-2 hover:translate-x-1 active:scale-95`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          format
                        </button>
                      )}

                      {settings.samoModeEnabled && (
                        <button
                          onClick={() => {
                            onTransformToSAMO(note.id, true);
                            setOpenMenuId(null);
                          }}
                          className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-purple-500 hover:${theme.bgSecondary} transition-all duration-200 flex items-center gap-2 hover:translate-x-1 active:scale-95`}
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
                          setOpenMenuId(null);
                          onDeleteNote(note.id);
                        }}
                        className={`w-full px-3 py-2 dynamic-text-base font-light text-left ${theme.textTertiary} hover:text-red-500 hover:${theme.bgSecondary} transition-all duration-200 flex items-center gap-2 hover:translate-x-1 active:scale-95`}
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
      {/* Pinned Saved Notes Section */}
      {pinnedSavedNotes.length > 0 && (
        <>
          <div className="space-y-6">
            <div className={`flex items-center gap-2 ${theme.textTertiary} text-xs font-light`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              pinned
            </div>
            {pinnedSavedNotes.map(renderSavedNote)}
          </div>
          
          {/* Divider */}
          {unpinnedSavedNotes.length > 0 && (
            <div className={`border-t ${theme.borderSecondary} pt-6`}>
              <div className={`text-xs font-light ${theme.textTertiary} mb-6`}>saved</div>
            </div>
          )}
        </>
      )}

      {/* Unpinned Saved Notes Section */}
      <div className="space-y-6">
        {unpinnedSavedNotes.map(renderSavedNote)}
      </div>
        
        <FullscreenNoteModal
          note={savedNotes.find(n => n.id === fullscreenNoteId)}
          isOpen={!!fullscreenNoteId}
          onClose={() => setFullscreenNoteId(null)}
          onUpdateNote={onUpdateNote}
          onUpdateNoteProperties={onUpdateNoteProperties}
          isActiveNote={false}
        />
    </div>
  );
};

export default memo(SavedNotes);
