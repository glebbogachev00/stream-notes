import { useState, useEffect, useCallback } from 'react';
import { DELETE_TIMERS } from '../contexts/SettingsContext';

const NOTES_KEY = 'stream_notes';
const SAVED_NOTES_KEY = 'stream_saved_notes';

export const useNotes = (deleteTimer = '24h') => {
  const [notes, setNotes] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);

  const loadNotes = useCallback(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_KEY);
      const storedSavedNotes = localStorage.getItem(SAVED_NOTES_KEY);
      
      const parsedNotes = storedNotes ? JSON.parse(storedNotes) : [];
      const parsedSavedNotes = storedSavedNotes ? JSON.parse(storedSavedNotes) : [];
      
      const now = Date.now();
      const maxAgeHours = DELETE_TIMERS[deleteTimer]?.hours || 24;
      
      const validNotes = maxAgeHours === Infinity ? 
        parsedNotes : 
        parsedNotes.filter(note => {
          const ageInHours = (now - note.createdAt) / (1000 * 60 * 60);
          return ageInHours < maxAgeHours;
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
  }, [deleteTimer]);

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

    const maxAgeHours = DELETE_TIMERS[deleteTimer]?.hours || 24;
    const isExpiringSoon = maxAgeHours !== Infinity && ageInHours > (maxAgeHours * 0.8);
    const hoursRemaining = maxAgeHours === Infinity ? Infinity : Math.max(0, maxAgeHours - ageInHours);
    
    return {
      timeText,
      isExpiringSoon,
      hoursRemaining: hoursRemaining === Infinity ? Infinity : Math.floor(hoursRemaining),
      minutesRemaining: hoursRemaining === Infinity ? 0 : Math.floor((hoursRemaining % 1) * 60),
      deleteTimer: DELETE_TIMERS[deleteTimer]?.name || '24 hours'
    };
  }, [deleteTimer]);

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