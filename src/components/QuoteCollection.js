import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { CREATIVE_QUOTES } from '../data/quotes';

const QuoteCollection = () => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const cycleQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % CREATIVE_QUOTES.length);
  };

  const currentQuote = CREATIVE_QUOTES[currentQuoteIndex];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div 
          className="bg-black text-white p-8 rounded-lg shadow-xl max-w-lg mx-auto cursor-pointer transition-all hover:bg-gray-800"
          onClick={cycleQuote}
        >
          <div className="font-bold text-xl mb-4 leading-tight tracking-wide">
            "{currentQuote.text}"
          </div>
          <div className="text-sm opacity-70 font-light">
            — {currentQuote.author}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={cycleQuote}
          className={`flex items-center gap-2 px-4 py-2 dynamic-text-sm font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          next quote ({currentQuoteIndex + 1}/{CREATIVE_QUOTES.length})
        </button>
        
        <button
          onClick={() => navigator.clipboard.writeText(`"${currentQuote.text}" — ${currentQuote.author}`)}
          className={`flex items-center gap-2 px-4 py-2 dynamic-text-sm font-light ${theme.textTertiary} hover:text-green-500 transition-colors`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          steal this quote
        </button>
      </div>

      <div className={`text-center dynamic-text-sm ${theme.textTertiary} font-light max-w-md mx-auto`}>
        {settings.personalityEnabled 
          ? "Creative inspiration for your stream of consciousness. Click the quote to cycle through the collection, or steal it to your clipboard." 
          : "Curated quotes about creativity, influence, and artistic expression."
        }
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
        {CREATIVE_QUOTES.map((quote, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuoteIndex(index)}
            className={`p-2 rounded text-xs transition-all duration-200 ${
              index === currentQuoteIndex
                ? `${theme.bgSecondary} ${theme.text}`
                : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} hover:${theme.bgSecondary}`
            }`}
          >
            {quote.category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuoteCollection;