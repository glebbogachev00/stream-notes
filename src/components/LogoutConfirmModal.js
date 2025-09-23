import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  const { theme } = useTheme();
  const { settings } = useSettings();

  if (!isOpen) return null;

  const personalityMessage = {
    title: "taking a break from the flow?",
    message: `no worries! your notes are safely stored in your account.\n\nwhen you sign out, this device goes back to a clean slate - but everything you've saved lives securely in the cloud, waiting for you to return.\n\nsign back in anytime to pick up exactly where you left off.`,
    confirmButton: "yes, sign me out",
    cancelButton: "stay signed in"
  };

  const professionalMessage = {
    title: "Confirm sign out",
    message: `Your notes are safely stored in your account.\n\nSigning out will clear this device's view, but all your data remains secure in your account. Sign back in anytime to access your notes.`,
    confirmButton: "Sign out",
    cancelButton: "Cancel"
  };

  const message = settings.personalityEnabled ? personalityMessage : professionalMessage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.bg} ${theme.border} border rounded-lg shadow-xl max-w-md w-full`}>
        <div className="p-6">
          <h3 className={`dynamic-text-lg font-medium ${theme.text} mb-4`}>
            {message.title}
          </h3>
          
          <div className={`dynamic-text-sm ${theme.textSecondary} mb-6 whitespace-pre-line leading-relaxed`}>
            {message.message}
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 dynamic-text-sm font-medium ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
            >
              {message.cancelButton}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 dynamic-text-sm font-medium ${theme.bg === 'bg-white' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-100'} rounded transition-colors`}
            >
              {message.confirmButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;