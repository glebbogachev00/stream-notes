import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ConfirmModal = ({
  isOpen,
  title = 'are you sure?',
  message = '',
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}) => {
  const { theme } = useTheme();

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onCancel?.();
    }
  };

  const confirmButtonClasses = isDestructive
    ? `px-4 py-2 dynamic-text-xs font-light text-red-500 hover:text-red-600 transition-colors`
    : `px-4 py-2 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-5 sm:p-6 shadow-lg`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              {title}
            </h2>
            {message && (
              <p className={`mt-2 dynamic-text-sm font-light ${theme.textTertiary}`}>
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmButtonClasses}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
