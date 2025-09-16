import { useState, useEffect, useCallback } from 'react';
import { DELETE_TIMERS } from '../contexts/SettingsContext';
import { getRandomMessage, AUTO_DELETE_MESSAGES, SAVE_NOTE_MESSAGES } from '../utils/messages';
import { useStorage } from '../contexts/StorageContext';
import { sanitizeNoteContent } from '../utils/security';
import { useTheme } from '../contexts/ThemeContext';

const NOTES_KEY = 'stream_notes';
const SAVED_NOTES_KEY = 'stream_saved_notes';
const ART_NOTES_KEY = 'stream_art_notes';

export const useNotes = (deleteTimer = '24h', onToast = null, personalityEnabled = true, onEdgeUnlock = null, activeFolder = 'all') => {
  const [notes, setNotes] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [artNotes, setArtNotes] = useState([]);
  const { storage } = useStorage();
  const { unlockEdgeTheme } = useTheme();

  const loadNotes = useCallback(async () => {
    try {
      const storedNotes = await storage.get(NOTES_KEY);
      const storedSavedNotes = await storage.get(SAVED_NOTES_KEY);
      const storedArtNotes = await storage.get(ART_NOTES_KEY);
      
      const parsedNotes = storedNotes ? JSON.parse(storedNotes) : [];
      const parsedSavedNotes = storedSavedNotes ? JSON.parse(storedSavedNotes) : [];
      const parsedArtNotes = storedArtNotes ? JSON.parse(storedArtNotes) : [];
      
      const now = Date.now();
      
      const validNotes = parsedNotes.filter(note => {
        // If expiresAt is Infinity, it never expires
        if (note.expiresAt === Infinity) return true;
        // If expiresAt is not set, use the global deleteTimer (for old notes)
        if (!note.expiresAt) {
          const maxAgeHours = DELETE_TIMERS[deleteTimer]?.hours || 24;
          const ageInHours = (now - note.createdAt) / (1000 * 60 * 60);
          return ageInHours < maxAgeHours;
        }
        // Use individual expiresAt
        return now < note.expiresAt;
      });
      
      if (validNotes.length !== parsedNotes.length) {
        await storage.set(NOTES_KEY, JSON.stringify(validNotes));
        if (onToast && parsedNotes.length - validNotes.length > 0) {
          onToast(getRandomMessage(AUTO_DELETE_MESSAGES, personalityEnabled));
        }
      }
      
      setNotes(validNotes);
      setSavedNotes(parsedSavedNotes);
      setArtNotes(parsedArtNotes);
    } catch (error) {
      // Error loading notes, using empty arrays
      setNotes([]);
      setSavedNotes([]);
      setArtNotes([]);
    }
  }, [deleteTimer, onToast, personalityEnabled, storage]);

  const saveNotes = useCallback(async (newNotes) => {
    try {
      await storage.set(NOTES_KEY, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      // Error saving notes
    }
  }, [storage]);

  const saveSavedNotes = useCallback(async (newSavedNotes) => {
    try {
      await storage.set(SAVED_NOTES_KEY, JSON.stringify(newSavedNotes));
      setSavedNotes(newSavedNotes);
    } catch (error) {
      // Error saving saved notes
    }
  }, [storage]);

  const saveArtNotes = useCallback(async (newArtNotes) => {
    try {
      await storage.set(ART_NOTES_KEY, JSON.stringify(newArtNotes));
      setArtNotes(newArtNotes);
    } catch (error) {
      // Error saving art notes
    }
  }, [storage]);

  const addNote = useCallback((content) => {
    const sanitizedContent = sanitizeNoteContent(content);
    const now = Date.now();
    const maxAgeHours = DELETE_TIMERS[deleteTimer]?.hours || 24;
    const expiresAt = maxAgeHours === Infinity ? Infinity : now + (maxAgeHours * 60 * 60 * 1000);

    const newNote = {
      id: Date.now().toString(),
      content: sanitizedContent,
      createdAt: now,
      expiresAt: expiresAt,
      // Assign current folder if not 'all'
      folder: activeFolder !== 'all' ? activeFolder : null,
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
  }, [notes, saveNotes, deleteTimer, activeFolder]);

  const updateNoteContent = useCallback((id, newContent) => {
    const sanitizedContent = sanitizeNoteContent(newContent);
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content: sanitizedContent } : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const updateNoteProperties = useCallback((id, properties) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, ...properties } : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const toggleNotePin = useCallback((id) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const updateNoteDeleteTimer = useCallback((id, newDeleteTimerKey) => {
    const now = Date.now();
    const maxAgeHours = DELETE_TIMERS[newDeleteTimerKey]?.hours || 24;
    const expiresAt = maxAgeHours === Infinity ? Infinity : now + (maxAgeHours * 60 * 60 * 1000);

    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, expiresAt: expiresAt, hasCustomDeleteTimer: true } : note
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

    const assignedFolder = noteToSave.folder || (activeFolder !== 'all' ? activeFolder : undefined);

    const savedNote = {
      ...noteToSave,
      savedAt: Date.now(),
      // Assign current folder if not 'all' and note doesn't already have a folder
      folder: assignedFolder
    };

    const updatedSavedNotes = [savedNote, ...savedNotes];
    const updatedNotes = notes.filter(note => note.id !== id);
    
    saveNotes(updatedNotes);
    saveSavedNotes(updatedSavedNotes);
    
    // Show save toast
    if (onToast) {
      onToast(getRandomMessage(SAVE_NOTE_MESSAGES, personalityEnabled));
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes, onToast, personalityEnabled, activeFolder]);

  const deleteSavedNote = useCallback((id) => {
    const updatedSavedNotes = savedNotes.filter(note => note.id !== id);
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateSavedNoteProperties = useCallback((id, properties) => {
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? { ...note, ...properties } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const toggleSavedNotePin = useCallback((id) => {
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateSavedNoteContent = useCallback((id, newContent) => {
    const sanitizedContent = sanitizeNoteContent(newContent);
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? { ...note, content: sanitizedContent } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateNoteFolder = useCallback((id, folder, isSaved) => {
    if (isSaved) {
      const updatedSavedNotes = savedNotes.map(note => 
        note.id === id ? { ...note, folder: folder } : note
      );
      saveSavedNotes(updatedSavedNotes);
    } else {
      const updatedNotes = notes.map(note => 
        note.id === id ? { ...note, folder: folder } : note
      );
      saveNotes(updatedNotes);
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes]);

  const transformToArt = useCallback((id, fromSaved = false, artStyle = 'samo') => {
    const sourceNotes = fromSaved ? savedNotes : notes;
    const sourceNote = sourceNotes.find(note => note.id === id);
    if (!sourceNote) return;

    const artNote = {
      ...sourceNote,
      id: `${sourceNote.id}-art-${Date.now()}`, // Create unique ID for art piece
      artStyle: artStyle,
      transformedAt: Date.now(),
    };

    const updatedArtNotes = [artNote, ...artNotes];
    
    saveArtNotes(updatedArtNotes);
    // Keep original note in source collection
    
    // Check if this unlocks the edge theme
    if (artStyle === 'samo' || artStyle === 'stencil') {
      unlockEdgeTheme();
      if (onEdgeUnlock) {
        onEdgeUnlock();
      }
    }
    
    if (onToast) {
      onToast("Note transformed into art!");
    }
  }, [notes, savedNotes, artNotes, saveArtNotes, onToast, unlockEdgeTheme, onEdgeUnlock]);

  const deleteArtNote = useCallback((id) => {
    const updatedArtNotes = artNotes.filter(note => note.id !== id);
    saveArtNotes(updatedArtNotes);
  }, [artNotes, saveArtNotes]);

  const updateArtNoteContent = useCallback((id, newContent) => {
    const sanitizedContent = sanitizeNoteContent(newContent);
    const updatedArtNotes = artNotes.map(note => 
      note.id === id ? { ...note, content: sanitizedContent } : note
    );
    saveArtNotes(updatedArtNotes);
  }, [artNotes, saveArtNotes]);

  const getTimeInfo = useCallback((note) => {
    const now = Date.now();
    const expiresAt = note.expiresAt || (now + (DELETE_TIMERS[deleteTimer]?.hours || 24) * 60 * 60 * 1000); // Fallback for old notes

    if (expiresAt === Infinity) {
      return {
        timeText: 'never expires',
        isExpiringSoon: false,
        hoursRemaining: Infinity,
        minutesRemaining: 0,
        deleteTimer: 'Never'
      };
    }

    const timeRemainingMs = expiresAt - now;
    const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);
    const minutesRemaining = timeRemainingMs / (1000 * 60);

    let timeText;
    if (minutesRemaining < 1) {
      timeText = 'expiring now';
    } else if (minutesRemaining < 60) {
      timeText = `${Math.floor(minutesRemaining)}m left`;
    } else {
      timeText = `${Math.floor(hoursRemaining)}h left`;
    }

    const maxAgeHours = DELETE_TIMERS[deleteTimer]?.hours || 24; // Global setting for comparison
    const isExpiringSoon = hoursRemaining < (maxAgeHours * 0.2); // Expiring soon if less than 20% of global time left

    return {
      timeText,
      isExpiringSoon,
      hoursRemaining: Math.floor(hoursRemaining),
      minutesRemaining: Math.floor((hoursRemaining % 1) * 60),
      deleteTimer: DELETE_TIMERS[deleteTimer]?.name || '24 hours' // Still show global name for context
    };
  }, [deleteTimer]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const handleSyncUpdate = (event) => {
      const updatedKeys = event?.detail?.keys || [];
      const relevantKeys = [NOTES_KEY, SAVED_NOTES_KEY, ART_NOTES_KEY];
      if (updatedKeys.some(key => relevantKeys.includes(key))) {
        loadNotes();
      }
    };

    window.addEventListener('stream-sync-update', handleSyncUpdate);
    return () => {
      window.removeEventListener('stream-sync-update', handleSyncUpdate);
    };
  }, [loadNotes]);

  useEffect(() => {
    const interval = setInterval(loadNotes, 60000);
    return () => clearInterval(interval);
  }, [loadNotes]);

  const updateGlobalDeleteTimer = useCallback((newDeleteTimerKey) => {
    const now = Date.now();
    const maxAgeHours = DELETE_TIMERS[newDeleteTimerKey]?.hours || 24;
    
    const updatedNotes = notes.map(note => {
      // Only update notes that haven't been manually customized
      if (note.hasCustomDeleteTimer) {
        return note; // Keep custom timer
      }
      
      // Update with new global timer
      const expiresAt = maxAgeHours === Infinity ? Infinity : now + (maxAgeHours * 60 * 60 * 1000);
      return { ...note, expiresAt: expiresAt };
    });
    
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  // Preview functionality
  const saveNoteWithPreview = useCallback((id, formattedContent = null) => {
    const noteToSave = notes.find(note => note.id === id);
    if (!noteToSave) return;

    const contentToSave = formattedContent || noteToSave.content;
    
    const savedNote = {
      ...noteToSave,
      content: contentToSave,
      savedAt: Date.now(),
      isFormatted: !!formattedContent
    };

    const updatedSavedNotes = [savedNote, ...savedNotes];
    const updatedNotes = notes.filter(note => note.id !== id);
    
    saveNotes(updatedNotes);
    saveSavedNotes(updatedSavedNotes);
    
    if (onToast) {
      const message = formattedContent ? "Saved formatted note!" : getRandomMessage(SAVE_NOTE_MESSAGES, personalityEnabled);
      onToast(message);
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes, onToast, personalityEnabled]);

  const saveBothVersions = useCallback((id, formattedContent) => {
    const noteToSave = notes.find(note => note.id === id);
    if (!noteToSave) return;

    // Save original
    const originalSaved = {
      ...noteToSave,
      savedAt: Date.now(),
      isFormatted: false
    };

    // Save formatted
    const formattedSaved = {
      ...noteToSave,
      id: `${noteToSave.id}-formatted`,
      content: formattedContent,
      savedAt: Date.now(),
      isFormatted: true
    };

    const updatedSavedNotes = [formattedSaved, originalSaved, ...savedNotes];
    const updatedNotes = notes.filter(note => note.id !== id);
    
    saveNotes(updatedNotes);
    saveSavedNotes(updatedSavedNotes);
    
    if (onToast) {
      onToast("Saved both versions!");
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes, onToast]);

  return {
    notes,
    savedNotes,
    artNotes,
    addNote,
    deleteNote,
    saveNote,
    deleteSavedNote,
    updateSavedNoteContent,
    updateSavedNoteProperties,
    toggleSavedNotePin,
    transformToArt,
    deleteArtNote,
    updateArtNoteContent,
    getTimeInfo,
    updateNoteDeleteTimer,
    updateNoteContent,
    updateNoteProperties,
    toggleNotePin,
    updateGlobalDeleteTimer,
    updateNoteFolder,
    refreshNotes: loadNotes,
    saveNoteWithPreview,
    saveBothVersions
  };
};
