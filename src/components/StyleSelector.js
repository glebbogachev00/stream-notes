import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const StyleSelector = ({ isOpen, onClose, onSelectStyle, noteContent }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-md w-full p-6 rounded-lg shadow-xl`}>
        <div className="mb-6">
          <h2 className={`dynamic-text-lg font-light ${theme.text} mb-2`}>
            Choose Art Style
          </h2>
          <p className={`dynamic-text-base ${theme.textSecondary} font-light`}>
            Transform your note into street art
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => onSelectStyle('samo')}
            className={`w-full p-4 text-left border rounded transition-all duration-200 ${theme.borderSecondary} hover:${theme.borderPrimary} group`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-black text-white p-3 rounded flex-shrink-0">
                <div className="font-bold text-sm tracking-wide">SAMO©</div>
              </div>
              <div>
                <div className={`font-light ${theme.text} mb-1`}>SAMO Style</div>
                <div className={`text-xs ${theme.textTertiary} font-light`}>
                  Raw, hand-painted Basquiat aesthetic
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectStyle('stencil')}
            className={`w-full p-4 text-left border rounded transition-all duration-200 ${theme.borderSecondary} hover:${theme.borderPrimary} group`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white text-black border-2 border-black p-3 rounded flex-shrink-0">
                <div className="font-black text-sm tracking-wider">STENCIL</div>
              </div>
              <div>
                <div className={`font-light ${theme.text} mb-1`}>Stencil Style</div>
                <div className={`text-xs ${theme.textTertiary} font-light`}>
                  Clean, high-contrast block typography
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 dynamic-text-base font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;