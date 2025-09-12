import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatNoteWithGemini } from '../services/geminiService';

const PreviewModal = ({ 
  isOpen, 
  onClose, 
  noteContent, 
  onSaveOriginal, 
  onSaveFormatted,
  onSaveBoth 
}) => {
  const { theme } = useTheme();
  const [formattedContent, setFormattedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('formatted'); // 'original' | 'formatted'

  useEffect(() => {
    if (isOpen && noteContent) {
      formatNote();
    }
  }, [isOpen, noteContent]);

  const formatNote = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formatted = await formatNoteWithGemini(noteContent);
      setFormattedContent(formatted);
    } catch (err) {
      setError('Failed to format note. You can still save the original.');
      console.error('Formatting error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedVersion === 'original') {
      onSaveOriginal();
    } else if (selectedVersion === 'formatted' && formattedContent) {
      onSaveFormatted(formattedContent);
    }
    onClose();
  };

  const handleSaveBoth = () => {
    if (formattedContent) {
      onSaveBoth(formattedContent);
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.borderSecondary}`}>
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              ✨ Preview & Save
            </h2>
            <p className={`dynamic-text-xs ${theme.textTertiary} font-light mt-1`}>
              Choose how to save your note
            </p>
          </div>
          <button
            onClick={onClose}
            className={`px-3 py-2 dynamic-text-base font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid md:grid-cols-2 h-full">
            
            {/* Original Note */}
            <div className={`p-6 border-r ${theme.borderSecondary}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`dynamic-text-sm font-medium ${theme.text}`}>Original</h3>
                <button
                  onClick={() => setSelectedVersion('original')}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    selectedVersion === 'original' 
                      ? `${theme.text.replace('text-', 'border-')} border-current` 
                      : `${theme.borderSecondary}`
                  }`}
                >
                  {selectedVersion === 'original' && (
                    <div className={`w-2 h-2 rounded-full ${theme.text.replace('text-', 'bg-')} mx-auto mt-0.5`} />
                  )}
                </button>
              </div>
              <div className={`${theme.textSecondary} font-light dynamic-text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-80`}>
                {noteContent}
              </div>
            </div>

            {/* Formatted Note */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`dynamic-text-sm font-medium ${theme.text}`}>
                  AI Formatted {isLoading && '...'}
                </h3>
                <button
                  onClick={() => setSelectedVersion('formatted')}
                  disabled={isLoading || error}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    selectedVersion === 'formatted' && !isLoading && !error
                      ? `${theme.text.replace('text-', 'border-')} border-current` 
                      : `${theme.borderSecondary}`
                  } ${(isLoading || error) ? 'opacity-50' : ''}`}
                >
                  {selectedVersion === 'formatted' && !isLoading && !error && (
                    <div className={`w-2 h-2 rounded-full ${theme.text.replace('text-', 'bg-')} mx-auto mt-0.5`} />
                  )}
                </button>
              </div>
              
              <div className={`${theme.textSecondary} font-light dynamic-text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-80`}>
                {isLoading ? (
                  <div className={`flex items-center gap-2 ${theme.textTertiary}`}>
                    <div className={`animate-spin w-4 h-4 border-2 ${theme.borderSecondary} ${theme.text.replace('text-', 'border-t-')} rounded-full`}></div>
                    Formatting your note...
                  </div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : (
                  formattedContent
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-between p-6 border-t ${theme.borderSecondary}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 dynamic-text-sm font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            {formattedContent && !error && (
              <button
                onClick={handleSaveBoth}
                className={`px-4 py-2 dynamic-text-sm font-light ${theme.textSecondary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors border ${theme.borderSecondary} rounded`}
              >
                Save Both
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isLoading || (selectedVersion === 'formatted' && (!formattedContent || error))}
              className={`px-6 py-2 dynamic-text-sm font-medium ${theme.text} ${theme.buttonHover} transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Save {selectedVersion === 'original' ? 'Original' : 'Formatted'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;