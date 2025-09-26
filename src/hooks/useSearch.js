import { useState, useCallback, useMemo } from 'react';

export const useSearch = (notes = [], savedNotes = [], artNotes = []) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const updateQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Function to highlight search terms in text
  const highlightText = useCallback((text, query) => {
    if (!query.trim()) return text;
    
    const normalizedQuery = query.toLowerCase().trim();
    const regex = new RegExp(`(${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  // Search function that looks for query in note content
  const searchNotes = useCallback((notesList, query, type) => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return notesList
      .filter(note => note.content.toLowerCase().includes(normalizedQuery))
      .map(note => ({
        ...note,
        type,
        // Add highlighted content for display
        highlightedContent: highlightText(note.content, query)
      }));
  }, [highlightText]);

  // Combined search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        active: [],
        saved: [],
        art: [],
        total: 0
      };
    }

    const activeResults = searchNotes(notes, searchQuery, 'active');
    const savedResults = searchNotes(savedNotes, searchQuery, 'saved');
    const artResults = searchNotes(artNotes, searchQuery, 'art');

    return {
      active: activeResults,
      saved: savedResults,
      art: artResults,
      total: activeResults.length + savedResults.length + artResults.length
    };
  }, [notes, savedNotes, artNotes, searchQuery, searchNotes]);

  return {
    isSearchOpen,
    searchQuery,
    searchResults,
    openSearch,
    closeSearch,
    updateQuery
  };
};