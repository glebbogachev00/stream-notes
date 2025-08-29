import { useState, useEffect, useCallback } from 'react';
import { DELETE_TIMERS } from '../contexts/SettingsContext';
import { getRandomMessage, AUTO_DELETE_MESSAGES, SAVE_NOTE_MESSAGES } from '../utils/messages';

const NOTES_KEY = 'stream_notes';
const SAVED_NOTES_KEY = 'stream_saved_notes';
const ART_NOTES_KEY = 'stream_art_notes';

export const useNotes = (deleteTimer = '24h', onToast = null, personalityEnabled = true) => {
  const [notes, setNotes] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [artNotes, setArtNotes] = useState([]);

  const loadNotes = useCallback(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_KEY);
      const storedSavedNotes = localStorage.getItem(SAVED_NOTES_KEY);
      const storedArtNotes = localStorage.getItem(ART_NOTES_KEY);
      
      const parsedNotes = storedNotes ? JSON.parse(storedNotes) : [];
      const parsedSavedNotes = storedSavedNotes ? JSON.parse(storedSavedNotes) : [];
      const parsedArtNotes = storedArtNotes ? JSON.parse(storedArtNotes) : [];
      
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
        // Show auto-delete toast if notes were removed
        if (onToast && parsedNotes.length - validNotes.length > 0) {
          onToast(getRandomMessage(AUTO_DELETE_MESSAGES, personalityEnabled));
        }
      }
      
      setNotes(validNotes);
      setSavedNotes(parsedSavedNotes);
      setArtNotes(parsedArtNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
      setSavedNotes([]);
      setArtNotes([]);
    }
  }, [deleteTimer, onToast, personalityEnabled]);

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

  const saveArtNotes = useCallback((newArtNotes) => {
    try {
      localStorage.setItem(ART_NOTES_KEY, JSON.stringify(newArtNotes));
      setArtNotes(newArtNotes);
    } catch (error) {
      console.error('Error saving art notes:', error);
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

  const updateNoteContent = useCallback((id, newContent) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content: newContent } : note
    );
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
    
    // Show save toast
    if (onToast) {
      onToast(getRandomMessage(SAVE_NOTE_MESSAGES, personalityEnabled));
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes, onToast, personalityEnabled]);

  const deleteSavedNote = useCallback((id) => {
    const updatedSavedNotes = savedNotes.filter(note => note.id !== id);
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateSavedNoteContent = useCallback((id, newContent) => {
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? { ...note, content: newContent } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const transformToArt = useCallback((id, fromSaved = false) => {
    const sourceNotes = fromSaved ? savedNotes : notes;
    const sourceNote = sourceNotes.find(note => note.id === id);
    if (!sourceNote) return;

    const randomStyle = 'samo';

    const artNote = {
      ...sourceNote,
      artStyle: randomStyle,
      transformedAt: Date.now(),
    };

    const updatedArtNotes = [artNote, ...artNotes];
    const updatedSourceNotes = sourceNotes.filter(note => note.id !== id);
    
    saveArtNotes(updatedArtNotes);
    if (fromSaved) {
      saveSavedNotes(updatedSourceNotes);
    } else {
      saveNotes(updatedSourceNotes);
    }
    
    if (onToast) {
      onToast("Note transformed into art!");
    }
  }, [notes, savedNotes, artNotes, saveNotes, saveSavedNotes, saveArtNotes, onToast]);

  const deleteArtNote = useCallback((id) => {
    const updatedArtNotes = artNotes.filter(note => note.id !== id);
    saveArtNotes(updatedArtNotes);
  }, [artNotes, saveArtNotes]);

  const updateArtNoteContent = useCallback((id, newContent) => {
    const updatedArtNotes = artNotes.map(note => 
      note.id === id ? { ...note, content: newContent } : note
    );
    saveArtNotes(updatedArtNotes);
  }, [artNotes, saveArtNotes]);

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
    artNotes,
    addNote,
    deleteNote,
    saveNote,
    deleteSavedNote,
    updateSavedNoteContent,
    transformToArt,
    deleteArtNote,
    updateArtNoteContent,
    getTimeInfo,
    updateNoteContent,
    refreshNotes: loadNotes
  };
};