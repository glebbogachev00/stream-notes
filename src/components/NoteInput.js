import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { getRotatingMessage, INPUT_PLACEHOLDER_MESSAGES } from '../utils/messages';

const NoteInput = ({ onAddNote }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState(getRotatingMessage(INPUT_PLACEHOLDER_MESSAGES));
  const textareaRef = useRef(null);
  const { theme } = useTheme();
  const { formatText, settings } = useSettings();

  // Rotate placeholder every few seconds when not focused
  useEffect(() => {
    if (!isFocused) {
      const interval = setInterval(() => {
        setPlaceholder(getRotatingMessage(INPUT_PLACEHOLDER_MESSAGES));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isFocused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      const formattedContent = formatText(content);
      onAddNote(formattedContent);
      setContent('');
      textareaRef.current?.blur();
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e) => {
    // No-op
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (!content.trim()) {
      setIsFocused(false);
    }
  };

  return (
    <section className="mb-8">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused ? "write..." : placeholder}
            className={`w-full p-0 text-base font-light resize-none border-0 focus:outline-none focus:ring-0 ${theme.inputBg} transition-all duration-200 ${theme.text} placeholder:${theme.textTertiary} ${
              isFocused 
                ? 'min-h-[120px]' 
                : `min-h-[40px] border-b ${theme.border} ${theme.borderHover}`
            }`}
            rows={isFocused ? 6 : 1}
          />
          
          {isFocused && content.trim() && (
            <div className="mt-4 flex items-center justify-end">
              <button
                type="submit"
                className={`px-3 py-1 text-xs font-light ${theme.text} border ${theme.border} rounded ${theme.buttonHover} transition-all duration-200`}
              >
                save
              </button>
            </div>
          )}
        </div>
      </form>
      
      {!isFocused && (
        <div className={`mt-2 text-xs ${theme.textTertiary} font-light`}>
          notes expire in {settings.deleteTimer === '1h' ? '1 hour' : settings.deleteTimer === '6h' ? '6 hours' : '24 hours'}
        </div>
      )}
    </section>
  );
};

export default NoteInput;