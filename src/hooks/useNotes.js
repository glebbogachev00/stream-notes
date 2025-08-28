import { useState, useEffect, useCallback } from 'react';

const NOTES_KEY = 'stream_notes';
const SAVED_NOTES_KEY = 'stream_saved_notes';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);

  const loadNotes = useCallback(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_KEY);
      const storedSavedNotes = localStorage.getItem(SAVED_NOTES_KEY);
      
      const parsedNotes = storedNotes ? JSON.parse(storedNotes) : [];
      const parsedSavedNotes = storedSavedNotes ? JSON.parse(storedSavedNotes) : [];
      
      const now = Date.now();
      const validNotes = parsedNotes.filter(note => {
        const ageInHours = (now - note.createdAt) / (1000 * 60 * 60);
        return ageInHours < 24;
      });
      
      if (validNotes.length !== parsedNotes.length) {
        localStorage.setItem(NOTES_KEY, JSON.stringify(validNotes));
      }
      
      setNotes(validNotes);
      setSavedNotes(parsedSavedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
      setSavedNotes([]);
    }
  }, []);

  const saveNotes = useCallback((newNotes) => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, []);

  const saveSavedNotes = useCallback((newSavedNotes) => {
    try {
      localStorage.setItem(SAVED_NOTES_KEY, JSON.stringify(newSavedNotes));
      setSavedNotes(newSavedNotes);
    } catch (error) {
      console.error('Error saving saved notes:', error);
    }
  }, []);

  const addNote = useCallback((content) => {
    const newNote = {
      id: Date.now().toString(),
      content: content.trim(),
      createdAt: Date.now(),
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const deleteNote = useCallback((id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const saveNote = useCallback((id) => {
    const noteToSave = notes.find(note => note.id === id);
    if (!noteToSave) return;

    const savedNote = {
      ...noteToSave,
      savedAt: Date.now(),
    };

    const updatedSavedNotes = [savedNote, ...savedNotes];
    const updatedNotes = notes.filter(note => note.id !== id);
    
    saveNotes(updatedNotes);
    saveSavedNotes(updatedSavedNotes);
  }, [notes, savedNotes, saveNotes, saveSavedNotes]);

  const deleteSavedNote = useCallback((id) => {
    const updatedSavedNotes = savedNotes.filter(note => note.id !== id);
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const getTimeInfo = useCallback((createdAt) => {
    const now = Date.now();
    const ageInMs = now - createdAt;
    const ageInHours = ageInMs / (1000 * 60 * 60);
    const ageInMinutes = ageInMs / (1000 * 60);
    
    let timeText;
    if (ageInMinutes < 1) {
      timeText = 'just now';
    } else if (ageInMinutes < 60) {
      timeText = `${Math.floor(ageInMinutes)}m ago`;
    } else {
      timeText = `${Math.floor(ageInHours)}h ago`;
    }

    const isExpiringSoon = ageInHours > 20;
    const hoursRemaining = Math.max(0, 24 - ageInHours);
    
    return {
      timeText,
      isExpiringSoon,
      hoursRemaining: Math.floor(hoursRemaining),
      minutesRemaining: Math.floor((hoursRemaining % 1) * 60)
    };
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const interval = setInterval(loadNotes, 60000);
    return () => clearInterval(interval);
  }, [loadNotes]);

  return {
    notes,
    savedNotes,
    addNote,
    deleteNote,
    saveNote,
    deleteSavedNote,
    getTimeInfo,
    refreshNotes: loadNotes
  };
};