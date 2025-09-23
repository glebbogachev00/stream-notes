import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DELETE_TIMERS, useSettings } from '../contexts/SettingsContext';

const DeleteTimerControl = ({ note, onUpdateNoteDeleteTimer, textSize = 'text-xs' }) => {
  const { theme } = useTheme();
  const { settings } = useSettings();

  const currentTimerKey = note.customTimerKey || settings.deleteTimer;

  const handleChange = (e) => {
    onUpdateNoteDeleteTimer(note.id, e.target.value);
  };

  return (
    <select
      value={currentTimerKey}
      onChange={handleChange}
      onInput={handleChange}
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