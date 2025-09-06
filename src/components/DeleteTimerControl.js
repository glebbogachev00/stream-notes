import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DELETE_TIMERS } from '../contexts/SettingsContext';

const DeleteTimerControl = ({ note, onUpdateNoteDeleteTimer, textSize = 'text-xs' }) => {
  const { theme } = useTheme();

  const currentTimerKey = (() => {
    // If expiresAt is not set, it means it's using the global default (24h)
    if (note.expiresAt === undefined) return '24h'; 
    
    // Try to match the expiresAt to a predefined timer
    const now = Date.now();
    for (const key in DELETE_TIMERS) {
      const timer = DELETE_TIMERS[key];
      // Only consider specific timers
      if (timer.hours !== null && timer.hours !== Infinity) { 
        const calculatedExpiresAt = now + (timer.hours * 60 * 60 * 1000);
        // Allow a small margin for comparison due to time passing
        if (Math.abs(note.expiresAt - calculatedExpiresAt) < 5000) { // 5 seconds margin
          return key;
        }
      }
    }
    return '24h'; // If no match, assume 24h (the default global setting)
  })();

  return (
    <select
      value={currentTimerKey}
      onChange={(e) => onUpdateNoteDeleteTimer(note.id, e.target.value)}
      className={`appearance-none bg-transparent ${theme.text} ${textSize} font-light focus:outline-none pr-2`}
    >
      {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
        <option key={key} value={key}>
          {timer.name.toLowerCase()}
        </option>
      ))}
    </select>
  );
};

export default DeleteTimerControl;