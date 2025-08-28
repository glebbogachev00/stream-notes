import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const NoteInput = ({ onAddNote }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const { theme } = useTheme();
  const { formatText } = useSettings();

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
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
            placeholder={isFocused ? "write..." : "new note"}
            className={`w-full p-0 text-base font-light resize-none border-0 focus:outline-none focus:ring-0 ${theme.inputBg} transition-all duration-200 ${theme.text} placeholder:${theme.textTertiary} ${
              isFocused 
                ? 'min-h-[120px]' 
                : `min-h-[40px] border-b ${theme.border} ${theme.borderHover}`
            }`}
            rows={isFocused ? 6 : 1}
          />
          
          {isFocused && content.trim() && (
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs ${theme.textTertiary} font-light`}>
                enter to save, shift+enter for new line
              </span>
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
          notes expire in 24 hours
        </div>
      )}
    </section>
  );
};

export default NoteInput;