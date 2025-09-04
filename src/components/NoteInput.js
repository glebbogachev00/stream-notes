import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { getRotatingMessage, INPUT_PLACEHOLDER_MESSAGES } from '../utils/messages';
import { detectQuotePattern, unlockMatrix, checkMatrixUnlock } from '../utils/quoteDetection';
import { autoResize, handleTextareaChange, handleTextareaKeyDown } from '../utils/textareaHelpers';

const NoteInput = ({ onAddNote, onMatrixUnlock }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { theme, unlockMatrixTheme } = useTheme();
  const { settings } = useSettings();
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      // Disable auto-formatting - user must explicitly use List control
      const formattedContent = content;
      
      // Add save animation
      if (textareaRef.current) {
        textareaRef.current.classList.add('save-animation');
        setTimeout(() => {
          textareaRef.current?.classList.remove('save-animation');
        }, 600);
      }
      
      onAddNote(formattedContent);
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

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    
    if (!checkMatrixUnlock() && detectQuotePattern(pastedText)) {
      unlockMatrix();
      unlockMatrixTheme();
      if (onMatrixUnlock) {
        onMatrixUnlock();
      }
    }
  };

  return (
    <section className="mb-8">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleTextareaChange(e, setContent)}
            onKeyDown={(e) => handleTextareaKeyDown(e)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPaste={handlePaste}
            placeholder={isFocused ? "write..." : placeholder}
            className={`w-full text-base font-light resize-none ${theme.text} placeholder:${theme.textSecondary} focus:outline-none transition-all duration-200 ${
              isFocused 
                ? `min-h-[120px] p-4 rounded-lg ${theme.inputBg} border ${theme.border}` 
                : `min-h-[40px] border-0 border-b ${theme.border} ${theme.borderHover} p-2 bg-transparent`
            }`}
            style={{ height: isFocused ? 'auto' : '40px' }}
            rows={1}
          />
          
          {isFocused && content.trim() && (
            <div className="mt-4 flex items-center justify-end">
              <button
                type="submit"
                className={`px-3 py-2 dynamic-text-base typography-title ${theme.text} border ${theme.border} rounded transition-all duration-200 ${theme.buttonHover} hover:${theme.text.replace('text-', 'hover:text-')}`}
              >
                save
              </button>
            </div>
          )}
        </div>
      </form>
      
      {!isFocused && (
        <div className={`mt-2 dynamic-text-base ${theme.textSecondary} font-light typography-system`}>
          {settings.personalityEnabled ? 
            `Notes expire in ${settings.deleteTimer === '1h' ? '1 hour' : settings.deleteTimer === '6h' ? '6 hours' : '24 hours'}` : 
            `Notes expire in ${settings.deleteTimer === '1h' ? '1 hour' : settings.deleteTimer === '6h' ? '6 hours' : '24 hours'}`
          }
        </div>
      )}
    </section>
  );
};

export default NoteInput;