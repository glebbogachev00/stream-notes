import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const InlineSearch = ({ searchQuery, searchResults, onUpdateQuery, onNavigateToNote }) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim() && isFocused) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
    }, 150);
  };

  const handleResultClick = (note) => {
    onNavigateToNote(note);
    onUpdateQuery('');
    setShowResults(false);
    inputRef.current?.blur();
  };

  const renderSearchResult = (note) => {
    const truncatedContent = note.content.length > 80 
      ? note.content.substring(0, 80) + '...'
      : note.content;

    return (
      <button
        key={`${note.type}-${note.id}`}
        onClick={() => handleResultClick(note)}
        className={`w-full text-left p-3 border-b ${theme.border} ${theme.buttonHover} transition-all duration-200 group flex items-start gap-3`}
      >
        <div className={`text-xs px-2 py-1 rounded ${theme.bgSecondary} ${theme.textTertiary} font-light shrink-0`}>
          {note.type}
        </div>
        <div className="flex-1 min-w-0">
          <div 
            className={`text-sm font-light ${theme.text} leading-relaxed truncate`}
            dangerouslySetInnerHTML={{ __html: note.highlightedContent || truncatedContent }}
          />
        </div>
      </button>
    );
  };

  return (
    <div className="mb-6 relative">
      {/* Search Input */}
      <div className={`relative ${theme.inputBg} border ${theme.border} rounded-lg shadow-sm`}>
        <div className="flex items-center px-4 py-3">
          <svg 
            className={`w-5 h-5 ${theme.textSecondary} mr-3 shrink-0`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onUpdateQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search your notes..."
            className={`flex-1 text-base font-light ${theme.text} placeholder:${theme.textSecondary} focus:outline-none bg-transparent`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                onUpdateQuery('');
                setShowResults(false);
              }}
              className={`ml-2 p-1 ${theme.textSecondary} hover:${theme.text} transition-colors rounded`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className={`absolute top-full left-0 right-0 z-10 mt-1 ${theme.inputBg} border ${theme.border} rounded-lg shadow-lg max-h-96 overflow-y-auto`}>
          {searchQuery.trim() === '' ? (
            <div className={`text-center py-8 ${theme.textSecondary}`}>
              <div className="text-sm font-light">
                Start typing to search your notes
              </div>
            </div>
          ) : searchResults.total === 0 ? (
            <div className={`text-center py-8 ${theme.textSecondary}`}>
              <div className="text-sm font-light">
                No notes found for "{searchQuery}"
              </div>
            </div>
          ) : (
            <div>
              {/* Results Summary */}
              <div className={`px-4 py-2 border-b ${theme.border} ${theme.bgSecondary}`}>
                <div className={`text-xs font-light ${theme.textSecondary}`}>
                  {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found
                </div>
              </div>

              {/* Active Notes Results */}
              {searchResults.active.length > 0 && (
                <div>
                  {searchResults.active.slice(0, 5).map(renderSearchResult)}
                </div>
              )}

              {/* Saved Notes Results */}
              {searchResults.saved.length > 0 && (
                <div>
                  {searchResults.saved.slice(0, 5).map(renderSearchResult)}
                </div>
              )}

              {/* Art Notes Results */}
              {searchResults.art.length > 0 && (
                <div>
                  {searchResults.art.slice(0, 3).map(renderSearchResult)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        mark {
          background-color: ${theme.themeAccent}40;
          color: inherit;
          padding: 0;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default InlineSearch;