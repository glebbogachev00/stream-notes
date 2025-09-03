import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DELETE_TIMERS } from '../contexts/SettingsContext';

const DeleteTimerControl = ({ note, onUpdateNoteDeleteTimer }) => {
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
    <div className="flex items-center gap-2">
      <span className={`text-xs ${theme.textTertiary} font-light`}>
        expires:
      </span>
      <div className="relative">
        <select
          value={currentTimerKey}
          onChange={(e) => onUpdateNoteDeleteTimer(note.id, e.target.value)}
          className={`appearance-none bg-transparent ${theme.text} text-xs font-light focus:outline-none border ${theme.borderPrimary} rounded px-2 py-1 pr-6 transition-colors duration-200 hover:${theme.bgSecondary}`}
        >
          {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
            <option key={key} value={key}>
              {timer.name.toLowerCase()}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
};

export default DeleteTimerControl;