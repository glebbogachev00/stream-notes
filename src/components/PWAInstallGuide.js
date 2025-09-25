import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PWAInstallGuide = () => {
  const { theme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if app is already installed (running in standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                              window.navigator.standalone || 
                              document.referrer.includes('android-app://');

    // Check if user has dismissed the guide before
    const hasBeenDismissed = localStorage.getItem('pwa-guide-dismissed') === 'true';
    
    // Check if user chose "remind later" and it hasn't expired
    const remindLaterTime = localStorage.getItem('pwa-guide-remind-later');
    const remindLaterExpired = !remindLaterTime || new Date().getTime() > parseInt(remindLaterTime);

    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);
    setDismissed(hasBeenDismissed);

    // Only show guide for iOS users who haven't installed and haven't dismissed
    if (isIOSDevice && !isInStandaloneMode && !hasBeenDismissed && remindLaterExpired) {
      // Show after a delay to not interrupt initial app load
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowGuide(false);
    setDismissed(true);
    localStorage.setItem('pwa-guide-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowGuide(false);
    // Set a temporary dismiss that expires after 24 hours
    const expires = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-guide-remind-later', expires.toString());
  };

  // Don't render anything if conditions aren't met
  if (!isIOS || isStandalone || dismissed || !showGuide) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 ${theme.bg} ${theme.border} border rounded-lg p-4 shadow-lg z-50 max-w-sm mx-auto`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`${theme.text} text-sm font-medium`}>
          Install Stream
        </div>
        <button 
          onClick={handleDismiss}
          className={`${theme.textSecondary} hover:${theme.text} text-sm p-1`}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      
      <div className={`${theme.textSecondary} text-xs leading-relaxed mb-4`}>
        <p className="mb-2">Add Stream to your home screen for the best experience:</p>
        <ol className="space-y-1 pl-4">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Tap <strong className={theme.text}>Share</strong> button below</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Scroll down and tap <strong className={theme.text}>"Add to Home Screen"</strong></span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Tap <strong className={theme.text}>"Add"</strong></span>
          </li>
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleRemindLater}
          className={`flex-1 px-3 py-2 text-xs ${theme.textSecondary} hover:${theme.text} border ${theme.border} rounded transition-colors`}
        >
          Remind Later
        </button>
        <button
          onClick={handleDismiss}
          className={`flex-1 px-3 py-2 text-xs ${theme.text} border ${theme.border} rounded transition-colors ${theme.buttonHover}`}
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default PWAInstallGuide;