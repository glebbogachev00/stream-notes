// Utility functions for rotating messages throughout the app

export const EMPTY_STATE_MESSAGES = [
  "Stream here! What chaos should we organize today?",
  "No clutter, no stress - just pure flow",
  "I cleaned up while you were away",
  "Ready to turn brain dump into brain flow?",
  "Fresh start, clear mind - let's capture some thoughts",
  "All tidy here! Ready for your next mental download",
  "Brain space: officially decluttered"
];

export const INPUT_PLACEHOLDER_MESSAGES = [
  "What's racing through your mind?",
  "Brain dump incoming...",
  "Let it flow...",
  "Stream your thoughts here",
  "Quick! Before you forget..."
];

export const AUTO_DELETE_MESSAGES = [
  "Quietly cleaning house...",
  "Making space for fresh thoughts",
  "Cleared some mental clutter!",
  "Mental housekeeping complete"
];

export const SAVE_NOTE_MESSAGES = [
  "Found some gold! Keeping this one safe",
  "This one's a keeper!",
  "Rescued from the flow - saved forever"
];

// Get a random message from an array
export const getRandomMessage = (messages) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Get a rotating message based on a seed (for consistent rotation)
export const getRotatingMessage = (messages, seed = Date.now()) => {
  const index = Math.floor(seed / (5 * 60 * 1000)) % messages.length; // Rotate every 5 minutes
  return messages[index];
};