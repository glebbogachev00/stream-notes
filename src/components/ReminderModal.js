import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getQuickTimes } from '../utils/reminders';

const ReminderModal = ({ isOpen, onClose, onSetReminder }) => {
  const { theme } = useTheme();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDate, setCustomDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('09:00');

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const quickTimes = getQuickTimes();

  const handleQuickTime = (time) => {
    onSetReminder(time);
    onClose();
  };

  const handleCustomTime = () => {
    if (!customDate || !customTime) return;
    
    const reminderTime = new Date(`${customDate}T${customTime}`).getTime();
    if (reminderTime > Date.now()) {
      onSetReminder(reminderTime);
      onClose();
    }
  };

  const formatQuickTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
            Set reminder
          </h2>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            close
          </button>
        </div>

        {!showCustomPicker ? (
          <div className="space-y-2">
            <button
              onClick={() => handleQuickTime(quickTimes.laterToday)}
              className={`w-full p-3 text-left ${theme.text} hover:${theme.bgSecondary} transition-colors dynamic-text-base font-light border ${theme.border} rounded`}
            >
              {formatQuickTime(quickTimes.laterToday)}
            </button>
            
            <button
              onClick={() => handleQuickTime(quickTimes.tomorrow)}
              className={`w-full p-3 text-left ${theme.text} hover:${theme.bgSecondary} transition-colors dynamic-text-base font-light border ${theme.border} rounded`}
            >
              {formatQuickTime(quickTimes.tomorrow)}
            </button>
            
            <button
              onClick={() => setShowCustomPicker(true)}
              className={`w-full p-3 text-left ${theme.text} hover:${theme.bgSecondary} transition-colors dynamic-text-base font-light border ${theme.border} rounded`}
            >
              Custom time...
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowCustomPicker(false)}
                className={`${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                ←
              </button>
              <span className={`dynamic-text-base font-light ${theme.text}`}>Custom time</span>
            </div>
            
            <div className="space-y-3">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className={`w-full p-2 dynamic-text-base ${theme.text} ${theme.inputBg} border ${theme.border} rounded`}
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className={`w-full p-2 dynamic-text-base ${theme.text} ${theme.inputBg} border ${theme.border} rounded`}
              />
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCustomPicker(false)}
                className={`px-4 py-2 dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleCustomTime}
                disabled={!customDate || !customTime}
                className={`px-4 py-2 dynamic-text-xs font-light ${
                  customDate && customTime 
                    ? `${theme.text} ${theme.buttonHover}` 
                    : theme.textTertiary
                } transition-colors disabled:cursor-not-allowed`}
              >
                Set reminder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderModal;