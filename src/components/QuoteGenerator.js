
import React, { useState, useEffect } from 'react';
import { CREATIVE_QUOTES as quotes } from '../data/quotes';
import { useTheme } from '../contexts/ThemeContext';

const QuoteGenerator = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [quote, setQuote] = useState('');
  const [artist, setArtist] = useState('');

  const getRandomQuote = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote.text);
    setArtist(randomQuote.author);
  };

  useEffect(() => {
    if (isOpen) {
      getRandomQuote();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={onClose}
    >
      <div 
        className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>steal this quote</h2>
          </div>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            close
          </button>
        </div>
        <div className="text-center">
          <p className={`dynamic-text-xl font-light mb-4 ${theme.text}`}>"{quote}"</p>
          <p className={`dynamic-text-md font-light italic ${theme.textSecondary}`}>- {artist}</p>
          <button
            onClick={getRandomQuote}
            className={`mt-6 ${theme.bg} ${theme.border} border ${theme.text} py-2 px-4 rounded-full hover:${theme.bg.replace('bg-', 'hover:bg-')} transition-colors`}
          >
            new quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;
