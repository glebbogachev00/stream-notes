import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatNoteWithAI } from '../services/aiService';

const PreviewModal = ({ 
  isOpen, 
  onClose, 
  noteContent, 
  onSaveOriginal, 
  onSaveFormatted,
  onSaveBoth 
}) => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [formattedContent, setFormattedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatNote = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formatted = await formatNoteWithAI(noteContent, settings);
      setFormattedContent(formatted);
    } catch (err) {
      setError('Failed to format note. You can still save the original.');
      console.error('Formatting error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [noteContent, settings]);

  useEffect(() => {
    if (isOpen && noteContent && settings) {
      formatNote();
    }
  }, [isOpen, noteContent, formatNote, settings]);


  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !settings) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-0 md:p-4"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} w-full h-full md:max-w-4xl md:max-h-[90vh] md:rounded-lg shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 md:p-6 border-b ${theme.borderSecondary}`}>
          <div>
            <h2 className={`dynamic-text-base md:dynamic-text-lg font-light ${theme.text}`}>
              preview & save
            </h2>
            <p className={`dynamic-text-xs ${theme.textTertiary} font-light mt-1`}>
              {settings.personalityEnabled ? "original vs cleaned up" : "choose how to save your note"}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden">
          {/* Mobile: Stack vertically with scroll, Desktop: Side by side */}
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-full">
            
            {/* Original Note */}
            <div className={`p-4 md:p-6 border-b md:border-b-0 md:border-r ${theme.borderSecondary} flex-shrink-0 md:flex-1 md:flex-none`}>
              <div className="mb-3">
                <h3 className={`dynamic-text-sm font-light ${theme.text}`}>original</h3>
              </div>
              <div className={`${theme.textSecondary} font-light dynamic-text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-60 md:max-h-80 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent border rounded ${theme.borderSecondary} p-3`}>
                {noteContent}
              </div>
            </div>

            {/* Formatted Note */}
            <div className="p-4 md:p-6 flex-shrink-0 md:flex-1 md:flex-none">
              <div className="mb-3">
                <h3 className={`dynamic-text-sm font-light ${theme.text}`}>
                  {settings.personalityEnabled ? 'cleaned up' : 'ai formatted'} {isLoading && '...'}
                </h3>
              </div>
              
              <div className={`${theme.textSecondary} font-light dynamic-text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-60 md:max-h-80 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent border rounded ${theme.borderSecondary} p-3`}>
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
        <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-center gap-2 p-3 md:p-6 border-t ${theme.borderSecondary}`}>
          <button
            onClick={onClose}
            className={`px-3 py-2 dynamic-text-sm md:dynamic-text-base font-light ${theme.text} border ${theme.border} rounded transition-all duration-200 hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
          >
            cancel
          </button>
          
          <button
            onClick={() => {
              onSaveOriginal();
              onClose();
            }}
            className={`px-3 py-2 dynamic-text-sm md:dynamic-text-base font-light ${theme.text} border ${theme.border} rounded transition-all duration-200 ${theme.buttonHover} hover:${theme.text.replace('text-', 'hover:text-')}`}
          >
            original
          </button>
          
          <button
            onClick={() => {
              if (formattedContent) {
                onSaveFormatted(formattedContent);
                onClose();
              }
            }}
            disabled={isLoading || !formattedContent || error}
            className={`px-3 py-2 dynamic-text-sm md:dynamic-text-base font-light ${theme.text} border ${theme.border} rounded transition-all duration-200 ${theme.buttonHover} hover:${theme.text.replace('text-', 'hover:text-')} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '...' : (settings.personalityEnabled ? 'cleaned' : 'formatted')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;