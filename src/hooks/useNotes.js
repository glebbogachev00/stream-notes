import { useState, useEffect, useCallback } from 'react';
import { DELETE_TIMERS } from '../contexts/SettingsContext';
import { getRandomMessage, AUTO_DELETE_MESSAGES, SAVE_NOTE_MESSAGES } from '../utils/messages';
import { useStorage } from '../contexts/StorageContext';
import { sanitizeNoteContent } from '../utils/security';
import { useTheme } from '../contexts/ThemeContext';

const NOTES_KEY = 'stream_notes';
const SAVED_NOTES_KEY = 'stream_saved_notes';
const ART_NOTES_KEY = 'stream_art_notes';

export const useNotes = (
  deleteTimer = '24h',
  onToast = null,
  personalityEnabled = true,
  onEdgeUnlock = null,
  activeFolder = 'all',
  knownFolders = []
) => {
  const [notes, setNotes] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [artNotes, setArtNotes] = useState([]);
  const { storage } = useStorage();
  const { unlockEdgeTheme } = useTheme();

  const isValidTimerKey = useCallback((timerKey) => (
    Boolean(timerKey && DELETE_TIMERS[timerKey])
  ), []);

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

      const deletedCount = parsedNotes.length - validNotes.length;

      const sanitizeCollection = (items, { resetExpiry }) => {
        let timersUpdated = false;
        const fallbackHours = DELETE_TIMERS[deleteTimer]?.hours || 24;
        const sourceItems = Array.isArray(items) ? items : [];
        const sanitizedItems = sourceItems.map((item) => {
            if (!item || !item.customTimerKey || isValidTimerKey(item.customTimerKey)) {
              return item;
            }

            timersUpdated = true;

            if (!resetExpiry) {
              return {
                ...item,
                customTimerKey: null,
                hasCustomDeleteTimer: false
              };
            }

            const createdAt = item.createdAt || now;
            const expiresAt = fallbackHours === Infinity
              ? Infinity
              : createdAt + (fallbackHours * 60 * 60 * 1000);

            return {
              ...item,
              customTimerKey: null,
              hasCustomDeleteTimer: false,
              expiresAt,
              updatedAt: now
            };
          });

        return {
          sanitized: sanitizedItems,
          timersUpdated
        };
      };

      const { sanitized: sanitizedNotes, timersUpdated: activeTimersUpdated } = sanitizeCollection(validNotes, { resetExpiry: true });
      const { sanitized: sanitizedSavedNotes, timersUpdated: savedTimersUpdated } = sanitizeCollection(parsedSavedNotes, { resetExpiry: false });
      const { sanitized: sanitizedArtNotes, timersUpdated: artTimersUpdated } = sanitizeCollection(parsedArtNotes, { resetExpiry: false });

      const activeNotesState = activeTimersUpdated ? sanitizedNotes : validNotes;
      const savedNotesState = savedTimersUpdated ? sanitizedSavedNotes : parsedSavedNotes;
      const artNotesState = artTimersUpdated ? sanitizedArtNotes : parsedArtNotes;

      if (deletedCount > 0 || activeTimersUpdated) {
        await storage.set(NOTES_KEY, JSON.stringify(sanitizedNotes));
        if (onToast && deletedCount > 0) {
          onToast(getRandomMessage(AUTO_DELETE_MESSAGES, personalityEnabled));
        }
      }

      if (savedTimersUpdated) {
        await storage.set(SAVED_NOTES_KEY, JSON.stringify(sanitizedSavedNotes));
      }

      if (artTimersUpdated) {
        await storage.set(ART_NOTES_KEY, JSON.stringify(sanitizedArtNotes));
      }

      setNotes(activeNotesState);
      setSavedNotes(savedNotesState);
      setArtNotes(artNotesState);
    } catch (error) {
      // Error loading notes, using empty arrays
      setNotes([]);
      setSavedNotes([]);
      setArtNotes([]);
    }
  }, [deleteTimer, onToast, personalityEnabled, storage, isValidTimerKey]);

  const saveNotes = useCallback(async (newNotes) => {
    const previousNotes = notes;
    setNotes(newNotes);
    try {
      await storage.set(NOTES_KEY, JSON.stringify(newNotes));
    } catch (error) {
      setNotes(previousNotes);
    }
  }, [notes, storage]);

  const saveSavedNotes = useCallback(async (newSavedNotes) => {
    const previousSavedNotes = savedNotes;
    setSavedNotes(newSavedNotes);
    try {
      await storage.set(SAVED_NOTES_KEY, JSON.stringify(newSavedNotes));
    } catch (error) {
      setSavedNotes(previousSavedNotes);
    }
  }, [savedNotes, storage]);

  const saveArtNotes = useCallback(async (newArtNotes) => {
    const previousArtNotes = artNotes;
    setArtNotes(newArtNotes);
    try {
      await storage.set(ART_NOTES_KEY, JSON.stringify(newArtNotes));
    } catch (error) {
      setArtNotes(previousArtNotes);
    }
  }, [artNotes, storage]);

  const addNote = useCallback((content, shouldSaveDirectly = false) => {
    const sanitizedContent = sanitizeNoteContent(content);
    const now = Date.now();
    const maxAgeHours = DELETE_TIMERS[deleteTimer]?.hours || 24;
    const expiresAt = maxAgeHours === Infinity ? Infinity : now + (maxAgeHours * 60 * 60 * 1000);

    const newNote = {
      id: Date.now().toString(),
      content: sanitizedContent,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt,
      isTodo: false,
      isTodoCompleted: false,
      pinnedBecauseTodo: false,
      // Assign current folder if not 'all'
      folder: activeFolder !== 'all' ? activeFolder : null,
    };
    
    if (shouldSaveDirectly) {
      // Add directly to saved notes instead of active notes
      const assignedFolder = newNote.folder || (activeFolder !== 'all' ? activeFolder : undefined);
      
      const savedNote = {
        ...newNote,
        id: `saved_${newNote.id}`,
        savedAt: now,
        folder: assignedFolder,
        expiresAt: Infinity // Saved notes don't expire
      };
      
      const updatedSavedNotes = [savedNote, ...savedNotes];
      saveSavedNotes(updatedSavedNotes);
      
      // Show save toast
      if (onToast) {
        onToast("Note saved directly!");
      }
    } else {
      // Normal flow - add to active notes
      const updatedNotes = [newNote, ...notes];
      saveNotes(updatedNotes);
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes, deleteTimer, activeFolder, onToast]);

  const updateNoteContent = useCallback((id, newContent) => {
    const sanitizedContent = sanitizeNoteContent(newContent);
    const timestamp = Date.now();
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content: sanitizedContent, updatedAt: timestamp } : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const updateNoteProperties = useCallback((id, properties) => {
    const timestamp = Date.now();
    const updatedNotes = notes.map(note => 
      note.id === id ? {
        ...note,
        ...properties,
        updatedAt: properties?.updatedAt ?? timestamp
      } : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const toggleNotePin = useCallback((id) => {
    const timestamp = Date.now();
    const updatedNotes = notes.map(note => {
      if (note.id !== id) {
        return note;
      }

      const nextPinned = !note.isPinned;
      return {
        ...note,
        isPinned: nextPinned,
        pinnedBecauseTodo: note.isTodo ? (nextPinned ? note.pinnedBecauseTodo : false) : false,
        updatedAt: timestamp
      };
    });
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const toggleNoteTodo = useCallback((id) => {
    const timestamp = Date.now();
    const updatedNotes = notes.map(note => {
      if (note.id !== id) {
        return note;
      }

      if (note.isTodo) {
        const shouldUnpin = !!note.pinnedBecauseTodo;
        return {
          ...note,
          isTodo: false,
          isTodoCompleted: false,
          pinnedBecauseTodo: false,
          isPinned: shouldUnpin ? false : note.isPinned,
          updatedAt: timestamp
        };
      }

      const wasPinned = !!note.isPinned;
      return {
        ...note,
        isTodo: true,
        isTodoCompleted: false,
        pinnedBecauseTodo: wasPinned ? false : true,
        isPinned: true,
        updatedAt: timestamp
      };
    });

    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const toggleTodoCompletion = useCallback((id) => {
    const timestamp = Date.now();
    const updatedNotes = notes.map(note => {
      if (note.id !== id || !note.isTodo) {
        return note;
      }

      const nextCompleted = !note.isTodoCompleted;

      return {
        ...note,
        isTodoCompleted: nextCompleted,
        completedAt: nextCompleted ? timestamp : null,
        updatedAt: timestamp
      };
    });

    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const updateNoteDeleteTimer = useCallback((id, newDeleteTimerKey) => {
    const resolvedTimerKey = DELETE_TIMERS[newDeleteTimerKey] ? newDeleteTimerKey : deleteTimer;
    const useCustomTimer = resolvedTimerKey !== deleteTimer;
    const targetTimerKey = useCustomTimer ? resolvedTimerKey : deleteTimer;
    const timestamp = Date.now();
    const maxAgeHours = DELETE_TIMERS[targetTimerKey]?.hours || 24;

    const updatedNotes = notes.map(note => {
      if (note.id !== id) return note;

      const newExpiresAt = maxAgeHours === Infinity
        ? Infinity
        : timestamp + (maxAgeHours * 60 * 60 * 1000);

      return {
        ...note,
        customTimerKey: useCustomTimer ? resolvedTimerKey : null,
        hasCustomDeleteTimer: useCustomTimer,
        expiresAt: newExpiresAt,
        updatedAt: timestamp
      };
    });

    saveNotes(updatedNotes);

    if (useCustomTimer) {
      const hasUsedCustomTimer = localStorage.getItem('stream_quake_unlocked') === 'true';
      if (!hasUsedCustomTimer) {
        localStorage.setItem('stream_quake_unlocked', 'true');
        // Dispatch event to notify ThemeContext
        window.dispatchEvent(new CustomEvent('theme-unlocked', { detail: { theme: 'quake', message: 'Quake theme unlocked!' } }));
      }
    }
  }, [notes, saveNotes, deleteTimer]);

  const deleteNote = useCallback((id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const saveNote = useCallback((id) => {
    const noteToSave = notes.find(note => note.id === id);
    if (!noteToSave) return;

    const assignedFolder = noteToSave.folder || (activeFolder !== 'all' ? activeFolder : undefined);

    const savedTimestamp = Date.now();

    const savedNote = {
      ...noteToSave,
      savedAt: savedTimestamp,
      updatedAt: savedTimestamp,
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

  const deleteAllNotes = useCallback(async () => {
    const count = notes.length;
    if (count === 0) {
      return { deletedCount: 0 };
    }

    await saveNotes([]);
    return { deletedCount: count };
  }, [notes, saveNotes]);

  const deleteAllSavedNotes = useCallback(async () => {
    const count = savedNotes.length;
    if (count === 0) {
      return { deletedCount: 0 };
    }

    await saveSavedNotes([]);
    return { deletedCount: count };
  }, [savedNotes, saveSavedNotes]);

  const deleteAllArtNotes = useCallback(async () => {
    const count = artNotes.length;
    if (count === 0) {
      return { deletedCount: 0 };
    }

    await saveArtNotes([]);
    return { deletedCount: count };
  }, [artNotes, saveArtNotes]);

  const saveAllActiveNotes = useCallback(async () => {
    const totalCount = notes.length;
    if (totalCount === 0) {
      return { savedCount: 0, totalCount: 0 };
    }

    const baseTimestamp = Date.now();
    const savedBatch = notes.map((note, index) => {
      const assignedFolder = note.folder || (activeFolder !== 'all' ? activeFolder : undefined);
      const savedTimestamp = baseTimestamp + index; // Ensure unique timestamps for ordering
      return {
        ...note,
        folder: assignedFolder,
        savedAt: savedTimestamp,
        updatedAt: savedTimestamp
      };
    });

    const updatedSavedNotes = [...savedBatch, ...savedNotes];

    await saveSavedNotes(updatedSavedNotes);
    await saveNotes([]);

    if (onToast) {
      onToast(getRandomMessage(SAVE_NOTE_MESSAGES, personalityEnabled));
    }

    return { savedCount: totalCount, totalCount };
  }, [notes, savedNotes, saveNotes, saveSavedNotes, onToast, personalityEnabled, activeFolder]);

  const deleteSavedNote = useCallback((id) => {
    const updatedSavedNotes = savedNotes.filter(note => note.id !== id);
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateSavedNoteProperties = useCallback((id, properties) => {
    const timestamp = Date.now();
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? {
        ...note,
        ...properties,
        updatedAt: properties?.updatedAt ?? timestamp
      } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const toggleSavedNotePin = useCallback((id) => {
    const timestamp = Date.now();
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned, updatedAt: timestamp } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateSavedNoteContent = useCallback((id, newContent) => {
    const sanitizedContent = sanitizeNoteContent(newContent);
    const timestamp = Date.now();
    const updatedSavedNotes = savedNotes.map(note => 
      note.id === id ? { ...note, content: sanitizedContent, updatedAt: timestamp } : note
    );
    saveSavedNotes(updatedSavedNotes);
  }, [savedNotes, saveSavedNotes]);

  const updateNoteFolder = useCallback((id, folder, isSaved) => {
    if (isSaved) {
      const timestamp = Date.now();
      const updatedSavedNotes = savedNotes.map(note => 
        note.id === id ? { ...note, folder: folder, updatedAt: timestamp } : note
      );
      saveSavedNotes(updatedSavedNotes);
    } else {
      const timestamp = Date.now();
      const updatedNotes = notes.map(note => 
        note.id === id ? { ...note, folder: folder, updatedAt: timestamp } : note
      );
      saveNotes(updatedNotes);
    }
  }, [notes, savedNotes, saveNotes, saveSavedNotes]);

  useEffect(() => {
    if (!Array.isArray(knownFolders)) {
      return;
    }

    const normalizedFolders = new Set(knownFolders.map((folder) => (folder || '').toLowerCase()));

    const normalize = (value) => (value || '').toLowerCase();

    let notesChanged = false;
    const sanitizedNotes = notes.map((note) => {
      if (note.folder && !normalizedFolders.has(normalize(note.folder))) {
        notesChanged = true;
        return { ...note, folder: null, updatedAt: Date.now() };
      }
      return note;
    });

    if (notesChanged) {
      saveNotes(sanitizedNotes);
    }

    let savedChanged = false;
    const sanitizedSavedNotes = savedNotes.map((note) => {
      if (note.folder && !normalizedFolders.has(normalize(note.folder))) {
        savedChanged = true;
        return { ...note, folder: null, updatedAt: Date.now() };
      }
      return note;
    });

    if (savedChanged) {
      saveSavedNotes(sanitizedSavedNotes);
    }
  }, [knownFolders, notes, savedNotes, saveNotes, saveSavedNotes]);

  const transformToArt = useCallback((id, fromSaved = false, artStyle = 'samo') => {
    const sourceNotes = fromSaved ? savedNotes : notes;
    const sourceNote = sourceNotes.find(note => note.id === id);
    if (!sourceNote) return;

    const timestamp = Date.now();

    const artNote = {
      ...sourceNote,
      id: `${sourceNote.id}-art-${timestamp}`, // Create unique ID for art piece
      artStyle: artStyle,
      transformedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updatedArtNotes = [artNote, ...artNotes];
    
    saveArtNotes(updatedArtNotes);
    // Keep original note in source collection
    
    // Check if this unlocks the edge theme
    if (artStyle === 'samo' || artStyle === 'stencil') {
      const artNotes = JSON.parse(localStorage.getItem('stream_art_notes') || '[]');
      const hadArtBefore = artNotes.some(note => note.artStyle === 'samo' || note.artStyle === 'stencil');
      
      unlockEdgeTheme();
      if (onEdgeUnlock && !hadArtBefore) {
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
      note.id === id ? { ...note, content: sanitizedContent, updatedAt: Date.now() } : note
    );
    saveArtNotes(updatedArtNotes);
  }, [artNotes, saveArtNotes]);

  const getTimeInfo = useCallback((note, currentDeleteTimer = deleteTimer) => {
    const now = Date.now();
    const fallbackTimerKey = DELETE_TIMERS[currentDeleteTimer] ? currentDeleteTimer : deleteTimer;
    const timerKey = note.customTimerKey && DELETE_TIMERS[note.customTimerKey]
      ? note.customTimerKey
      : fallbackTimerKey;
    const maxAgeHours = DELETE_TIMERS[timerKey]?.hours || 24;

    if (maxAgeHours === Infinity) {
      return {
        timeText: 'never expires',
        isExpiringSoon: false,
        hoursRemaining: Infinity,
        minutesRemaining: 0,
        deleteTimer: 'Never'
      };
    }

    // Use stored expiration time, fallback to calculated if not available
    const createdAt = note.createdAt || now;
    const expiresAt = note.expiresAt || (createdAt + (maxAgeHours * 60 * 60 * 1000));
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

    const isExpiringSoon = hoursRemaining < (maxAgeHours * 0.2);

    const result = {
      timeText,
      isExpiringSoon,
      hoursRemaining: Math.floor(hoursRemaining),
      minutesRemaining: Math.floor((hoursRemaining % 1) * 60),
      deleteTimer: DELETE_TIMERS[timerKey]?.name || '24 hours'
    };

    return result;
  }, [deleteTimer]); // Note: This function is called frequently for real-time updates

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
    // Check for short timers (under 10 minutes) to use faster cleanup
    const hasShortTimers = notes.some(note => {
      const timerKey = note.customTimerKey && DELETE_TIMERS[note.customTimerKey]
        ? note.customTimerKey
        : deleteTimer;
      const hours = DELETE_TIMERS[timerKey]?.hours || 24;
      return hours < 0.17; // Less than 10 minutes
    });
    
    // Use 5-second cleanup for short timers, 60-second for normal timers
    const cleanupInterval = hasShortTimers ? 5000 : 60000;

    const interval = setInterval(loadNotes, cleanupInterval);
    return () => clearInterval(interval);
  }, [loadNotes, notes, deleteTimer]);

  const updateGlobalDeleteTimer = useCallback((newDeleteTimerKey, oldDeleteTimerKey = deleteTimer) => {
    const targetTimerKey = DELETE_TIMERS[newDeleteTimerKey] ? newDeleteTimerKey : deleteTimer;
    const now = Date.now();
    const maxAgeHours = DELETE_TIMERS[targetTimerKey]?.hours || 24;

    const timestamp = Date.now();
    const updatedNotes = notes.map(note => {
      // Only update notes that haven't been manually customized
      if (note.hasCustomDeleteTimer) {
        return note; // Keep custom timer
      }
      
      // Update with new global timer
      const expiresAt = maxAgeHours === Infinity ? Infinity : now + (maxAgeHours * 60 * 60 * 1000);
      return { ...note, expiresAt: expiresAt, updatedAt: timestamp };
    });
    
    saveNotes(updatedNotes);
  }, [notes, saveNotes, deleteTimer]); // Add deleteTimer dependency

  // Preview functionality
  const saveNoteWithPreview = useCallback((id, formattedContent = null) => {
    const noteToSave = notes.find(note => note.id === id);
    if (!noteToSave) return;

    const contentToSave = formattedContent || noteToSave.content;
    
    const timestamp = Date.now();

    const savedNote = {
      ...noteToSave,
      content: contentToSave,
      savedAt: timestamp,
      updatedAt: timestamp,
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
    const timestamp = Date.now();

    const originalSaved = {
      ...noteToSave,
      savedAt: timestamp,
      updatedAt: timestamp,
      isFormatted: false
    };

    // Save formatted
    const formattedSaved = {
      ...noteToSave,
      id: `${noteToSave.id}-formatted`,
      content: formattedContent,
      savedAt: timestamp,
      updatedAt: timestamp,
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
    toggleNoteTodo,
    toggleTodoCompletion,
    updateGlobalDeleteTimer,
    updateNoteFolder,
    refreshNotes: loadNotes,
    saveNoteWithPreview,
    saveBothVersions,
    saveAllActiveNotes,
    deleteAllNotes,
    deleteAllSavedNotes,
    deleteAllArtNotes
  };
};
