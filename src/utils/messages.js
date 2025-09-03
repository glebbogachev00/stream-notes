// Utility functions for rotating messages throughout the app

export const EMPTY_STATE_MESSAGES = {
  personality: [
    "stream here! What chaos should we organize today?",
    "No clutter, no stress - just pure flow",
    "I cleaned up while you were away",
    "Ready to turn brain dump into brain flow?",
    "Fresh start, clear mind - let's capture some thoughts",
    "All tidy here! Ready for your next mental download",
    "Brain space: officially decluttered"
  ],
  professional: [
    "No active notes"
  ]
};

export const INPUT_PLACEHOLDER_MESSAGES = {
  personality: [
    "What's racing through your mind?",
    "Brain dump incoming...",
    "Let it flow...",
    "stream your thoughts here",
    "Quick! Before you forget..."
  ],
  professional: [
    "Enter note..."
  ]
};

export const AUTO_DELETE_MESSAGES = {
  personality: [
    "Quietly cleaning house...",
    "Making space for fresh thoughts",
    "Cleared some mental clutter!",
    "Mental housekeeping complete"
  ],
  professional: [
    "Notes deleted automatically"
  ]
};

export const SAVE_NOTE_MESSAGES = {
  personality: [
    "Found some gold! Keeping this one safe",
    "This one's a keeper!",
    "Rescued from the flow - saved forever"
  ],
  professional: [
    "Note saved successfully"
  ]
};

// Get a random message from an array, personality-aware
export const getRandomMessage = (messageObj, personalityEnabled = true) => {
  const messages = personalityEnabled ? messageObj.personality : messageObj.professional;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Get a rotating message based on a seed, personality-aware
export const getRotatingMessage = (messageObj, personalityEnabled = true, seed = Date.now()) => {
  const messages = personalityEnabled ? messageObj.personality : messageObj.professional;
  const index = Math.floor(seed / (5 * 60 * 1000)) % messages.length; // Rotate every 5 minutes
  return messages[index];
};