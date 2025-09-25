export const detectQuotePattern = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const cleanText = text.trim();
  if (cleanText.length < 10) return false;
  
  const quotePatterns = [
    /^["'](.+)["']\s*[-–—]\s*(.+)$/,
    /^["'](.+)["']\s*\((.+)\)$/,
    /^["'](.+)["']\s*by\s+(.+)$/i,
    /^["'](.+)["']\s*-\s*(.+)$/,
    /^["'](.+)["']\s*~\s*(.+)$/,
    /^(.+)\s*[-–—]\s*(.+)$/ 
  ];
  
  for (const pattern of quotePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const [, quote, author] = match;
      if (quote && quote.length > 5 && author && author.length > 1) {
        return true;
      }
    }
  }
  
  const hasQuotes = /["']/.test(cleanText);
  const hasAttribution = /[-–—~]\s*[A-Za-z]/.test(cleanText) || /\([^)]+\)$/.test(cleanText);
  const isReasonableLength = cleanText.length > 15 && cleanText.length < 500;
  
  return hasQuotes && hasAttribution && isReasonableLength;
};

export const checkMatrixUnlock = () => {
  return localStorage.getItem('stream-matrix-unlocked') === 'true';
};

export const unlockMatrix = () => {
  localStorage.setItem('stream-matrix-unlocked', 'true');
};

