import React, { useState, useRef, useEffect, memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, DELETE_TIMERS } from '../contexts/SettingsContext';
import { getRotatingMessage, INPUT_PLACEHOLDER_MESSAGES } from '../utils/messages';
import { autoResize, handleTextareaChange, handleTextareaKeyDown } from '../utils/textareaHelpers';
import FullscreenNoteModal from './FullscreenNoteModal';

const NoteInput = ({ onAddNote, onSaveNote, showToast, isPermanent = false, helperText }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const { theme } = useTheme();
  const { settings, formatText } = useSettings();
  const [placeholder, setPlaceholder] = useState(() => 
    getRotatingMessage(INPUT_PLACEHOLDER_MESSAGES, settings?.personalityEnabled ?? true)
  );
  const textareaRef = useRef(null);

  // Update placeholder when personality setting changes
  useEffect(() => {
    setPlaceholder(getRotatingMessage(INPUT_PLACEHOLDER_MESSAGES, settings.personalityEnabled));
  }, [settings.personalityEnabled]);

  // Rotate placeholder every few seconds when not focused and personality is enabled
  useEffect(() => {
    if (!isFocused && settings.personalityEnabled) {
      const interval = setInterval(() => {
        setPlaceholder(getRotatingMessage(INPUT_PLACEHOLDER_MESSAGES, settings.personalityEnabled));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isFocused, settings.personalityEnabled]);

  const handleSubmit = async (e, saveDirectly = false) => {
    e.preventDefault();
    if (content.trim()) {
      // Apply auto-sorting if enabled
      let formattedContent = content;
      if (settings.autoSortingEnabled) {
        formattedContent = formatText(content);
      }
      
      // Add save animation
      if (textareaRef.current) {
        textareaRef.current.classList.add('save-animation');
        setTimeout(() => {
          textareaRef.current?.classList.remove('save-animation');
        }, 600);
      }
      
      onAddNote(formattedContent, isPermanent || saveDirectly);
      
      setContent('');
      textareaRef.current?.blur();
      setIsFocused(false);
    }
  };


  const handleFocus = () => {
    setIsFocused(true);
    // Auto-resize when focused
    setTimeout(() => {
      if (textareaRef.current) {
        autoResize(textareaRef.current);
      }
    }, 0);
  };

  const handleBlur = () => {
    if (!content.trim()) {
      setIsFocused(false);
    }
  };



  const defaultHelper = isPermanent ? null : `Notes expire in ${DELETE_TIMERS[settings.deleteTimer]?.name.toLowerCase() || '24 hours'}`;
  const helper = helperText !== undefined ? helperText : defaultHelper;

  return (
    <section className="mb-8">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          {/* Expand button - only show when focused and writing mode enabled */}
          {settings.writingModeEnabled && isFocused && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFullscreenOpen(true);
              }}
              className={`absolute top-2 right-2 z-10 px-2 py-1 text-xs ${theme.textTertiary} hover:text-green-500 transition-colors duration-200 font-light`}
            >
              [expand]
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleTextareaChange(e, setContent)}
            onKeyDown={(e) => handleTextareaKeyDown(e)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused ? "write..." : placeholder}
            className={`w-full text-base font-light resize-none ${theme.text} placeholder:${theme.textSecondary} focus:outline-none transition-all duration-200 ${
              isFocused
                ? `min-h-[120px] p-4 rounded-lg ${theme.inputBg} border ${theme.border}` 
                : `min-h-[40px] border-0 border-b ${theme.border} ${theme.borderHover} p-2 bg-transparent`
            }`}
            style={{ 
              height: isFocused ? 'auto' : '40px',
              willChange: 'height',
              transform: 'translateZ(0)',
              paddingRight: (isFocused && settings.writingModeEnabled) ? '48px' : '8px'
            }}
            rows={1}
            autoComplete="off"
            spellCheck="false"
          />
          
          {isFocused && content.trim() && !isPermanent && (
            <div className="mt-4 flex items-center justify-between">
              {settings.writingModeEnabled ? (
                <div className="flex items-center justify-between w-full">
                  <div className={`dynamic-text-sm ${theme.textSecondary} font-light`}>
                    writing mode
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, false)}
                      className={`px-3 py-2 dynamic-text-base typography-title ${theme.text} border ${theme.border} rounded transition-all duration-200 hover:text-orange-500`}
                    >
                      active
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      className={`px-3 py-2 dynamic-text-base typography-title ${theme.text} border ${theme.border} rounded transition-all duration-200 hover:text-green-500`}
                    >
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end w-full">
                  <button
                    type="submit"
                    className={`px-3 py-2 dynamic-text-base typography-title ${theme.text} border ${theme.border} rounded transition-all duration-200 hover:text-green-500`}
                  >
                    save
                  </button>
                </div>
              )}
            </div>
          )}

          {isFocused && content.trim() && isPermanent && (
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className={`px-3 py-2 dynamic-text-base typography-title ${theme.text} border ${theme.border} rounded transition-all duration-200 hover:text-green-500`}
              >
                save
              </button>
            </div>
          )}
        </div>
      </form>
      
      {!isFocused && helper && (
        <div className={`mt-2 dynamic-text-base ${theme.textSecondary} font-light typography-system`}>
          {helper}
        </div>
      )}

      {/* Use existing FullscreenNoteModal */}
      <FullscreenNoteModal
        note={{
          id: 'new-note',
          content: content,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        onUpdateNote={(id, newContent) => {
          setContent(newContent);
        }}
        onUpdateNoteProperties={() => {}}
      />
    </section>
  );
};

export default memo(NoteInput);
