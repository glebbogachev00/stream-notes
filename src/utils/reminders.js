// Minimal reminder system for notes

const STORAGE_KEY = 'stream-reminders';
const reminders = new Map();

// Load reminders from localStorage
const loadReminders = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const reminderData = JSON.parse(stored);
      Object.entries(reminderData).forEach(([noteId, timestamp]) => {
        reminders.set(noteId, timestamp);
      });
    }
  } catch (error) {
    console.error('Failed to load reminders:', error);
  }
};

// Save reminders to localStorage
const saveReminders = () => {
  try {
    const reminderData = Object.fromEntries(reminders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminderData));
  } catch (error) {
    console.error('Failed to save reminders:', error);
  }
};

// Initialize on load
loadReminders();

// Set a reminder for a note
export const setReminder = (noteId, timestamp) => {
  reminders.set(noteId, timestamp);
  saveReminders();
  
  // Schedule the reminder
  scheduleReminder(noteId, timestamp);
};

// Clear a reminder for a note
export const clearReminder = (noteId) => {
  reminders.delete(noteId);
  saveReminders();
  
  // Clear any existing timeouts
  if (window.reminderTimeouts && window.reminderTimeouts[noteId]) {
    clearTimeout(window.reminderTimeouts[noteId]);
    delete window.reminderTimeouts[noteId];
  }
};

// Check if a note has a reminder
export const hasReminder = (noteId) => {
  return reminders.has(noteId);
};

// Get reminder timestamp for a note
export const getReminderTime = (noteId) => {
  return reminders.get(noteId);
};

// Get all note IDs with reminders
export const getNotesWithReminders = () => {
  return Array.from(reminders.keys());
};

// Schedule a reminder using setTimeout or notifications
const scheduleReminder = (noteId, timestamp) => {
  const now = Date.now();
  const delay = timestamp - now;
  
  if (delay <= 0) {
    // Trigger immediately if time has passed
    onReminderTrigger(noteId);
    return;
  }
  
  // Initialize timeout storage
  if (!window.reminderTimeouts) {
    window.reminderTimeouts = {};
  }
  
  // Clear any existing timeout
  if (window.reminderTimeouts[noteId]) {
    clearTimeout(window.reminderTimeouts[noteId]);
  }
  
  // Set new timeout
  window.reminderTimeouts[noteId] = setTimeout(() => {
    onReminderTrigger(noteId);
  }, delay);
};

// Handle reminder trigger
export const onReminderTrigger = (noteId) => {
  const reminderTime = reminders.get(noteId);
  if (!reminderTime) return;
  
  // Remove the reminder
  clearReminder(noteId);
  
  // Try to show notification
  showReminderNotification(noteId);
  
  // Dispatch custom event for UI updates
  window.dispatchEvent(new CustomEvent('reminderTriggered', { 
    detail: { noteId } 
  }));
};

// Show notification (with fallback)
const showReminderNotification = (noteId) => {
  const title = 'stream reminder';
  const body = 'A note you wanted to be reminded about';
  
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `reminder-${noteId}`
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    // Request permission
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `reminder-${noteId}`
        });
      }
    });
  }
  
  // Always dispatch event for in-app handling
  window.dispatchEvent(new CustomEvent('showReminderAlert', { 
    detail: { noteId, message: 'Reminder: Check your note!' } 
  }));
};

// Initialize all existing reminders on app start
export const initializeReminders = () => {
  loadReminders();
  
  // Schedule all future reminders
  reminders.forEach((timestamp, noteId) => {
    scheduleReminder(noteId, timestamp);
  });
};

// Quick time presets
export const getQuickTimes = () => {
  const now = new Date();
  
  return {
    laterToday: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0).getTime(),
    tomorrow: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0).getTime()
  };
};