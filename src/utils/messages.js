// Utility functions for rotating messages throughout the app

export const EMPTY_STATE_MESSAGES = {
  personality: [
    "Stream here! What chaos should we organize today?",
    "No clutter, no stress - just pure flow",
    "I cleaned up while you were away",
    "Ready to turn brain dump into brain flow?",
    "Fresh start, clear mind - let's capture some thoughts",
    "All tidy here! Ready for your next mental download",
    "Brain space: officially decluttered",
    "Brain squeaky clean. What's next?",
    "No notes hanging around—start fresh.",
    "I'm all ears—throw me something to chew on.",
    "Mental whiteboard cleared and ready",
    "Your thoughts have expired—time for new ones",
    "Zero notes, infinite possibilities",
    "Clean slate, fresh mind—let's flow"
  ],
  professional: [
    "No active notes",
    "No notes to display",
    "Your active notes list is empty"
  ]
};

export const INPUT_PLACEHOLDER_MESSAGES = {
  personality: [
    "What's racing through your mind?",
    "Brain dump incoming...",
    "Let it flow...",
    "Stream your thoughts here",
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