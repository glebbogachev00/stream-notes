import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(feedback);
      setFeedback('');
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              improve stream
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="your thoughts help stream grow…"
            className={`w-full h-32 p-3 ${theme.inputBg} ${theme.text} ${theme.border} border transition-all duration-200 font-light dynamic-text-base resize-none`}
            style={{
              outline: 'none',
              boxShadow: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.focusBorder;
              e.target.style.boxShadow = `0 0 0 1px ${theme.focusColor}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              disabled={isSubmitting}
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim() || isSubmitting}
              className={`px-4 py-2 dynamic-text-xs font-light ${
                !feedback.trim() || isSubmitting 
                  ? theme.textTertiary 
                  : `${theme.text} ${theme.buttonHover}`
              } transition-colors disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'sending...' : 'send feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;