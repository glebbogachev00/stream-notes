import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { CREATIVE_QUOTES } from '../data/quotes';
import { useToast } from '../hooks/useToast';

const QuoteCollection = () => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const cycleQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % CREATIVE_QUOTES.length);
  };

  const currentQuote = CREATIVE_QUOTES[currentQuoteIndex];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-black text-white p-8 rounded-lg shadow-xl max-w-lg mx-auto">
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
          className={`flex items-center gap-2 px-4 py-2 dynamic-text-base font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
        >
          next quote ({currentQuoteIndex + 1}/{CREATIVE_QUOTES.length})
        </button>
        
        <button
          onClick={async () => {
            const textToCopy = `"${currentQuote.text}" — ${currentQuote.author}`;
            
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
              try {
                await navigator.clipboard.writeText(textToCopy);
                showToast('Quote copied to clipboard!', 'success');
                return;
              } catch (err) {
                // Clipboard API failed, using fallback
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
              
              if (successful) {
                showToast('Quote copied to clipboard!', 'success');
                console.log('Copy successful (fallback)!');
              } else {
                throw new Error('execCommand failed');
              }
            } catch (err) {
              console.error('All copy methods failed:', err);
              showToast('Unable to copy. Please select and copy manually.', 'error');
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 dynamic-text-base font-light ${theme.textTertiary} hover:text-green-500 transition-colors`}
        >
          steal this quote
        </button>
      </div>

      <div className={`text-center dynamic-text-base ${theme.textTertiary} font-light max-w-md mx-auto`}>
        {settings.personalityEnabled 
          ? "Creative inspiration for your stream of consciousness. Click the quote to cycle through the collection, or steal it to your clipboard." 
          : "Curated quotes about creativity, influence, and artistic expression."
        }
      </div>
    </div>
  );
};

export default QuoteCollection;