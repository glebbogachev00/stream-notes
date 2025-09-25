import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PWAInstallGuide = () => {
  const { theme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);
  const [showInstallLink, setShowInstallLink] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

    // Show install link for iOS users who haven't installed
    if (isIOSDevice && !isInStandaloneMode) {
      setShowInstallLink(true);
    }

    // Only show guide automatically for iOS users who haven't dismissed and remind later expired
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
    localStorage.setItem('pwa-guide-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowGuide(false);
    // Set a temporary dismiss that expires after 24 hours
    const expires = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-guide-remind-later', expires.toString());
  };

  const handleShowGuide = () => {
    setShowGuide(true);
  };

  // Don't render anything if user is not on iOS or app is already installed
  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <>
      {/* Install Button - positioned above StreamAssistant on right side */}
      {showInstallLink && !showGuide && (
        <button
          onClick={handleShowGuide}
          className={`fixed bottom-20 right-6 flex items-center gap-2 px-3 py-2 ${theme.bg} ${theme.border} border rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 ${theme.text} hover:${theme.textSecondary} text-sm hover:scale-105 active:scale-95`}
          title="Install Stream as PWA"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          install
        </button>
      )}

      {/* Install Guide Modal */}
      {showGuide && (
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
      )}
    </>
  );
};

export default PWAInstallGuide;