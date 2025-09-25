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

    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);

    // Show install link for iOS users who haven't installed
    if (isIOSDevice && !isInStandaloneMode) {
      setShowInstallLink(true);
    }

    // Only show guide automatically for iOS users who haven't dismissed
    if (isIOSDevice && !isInStandaloneMode && !hasBeenDismissed) {
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

  const handleShowGuide = () => {
    setShowGuide(true);
  };

  // Don't render anything if user is not on iOS or app is already installed
  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <>
      {/* Install Button - bottom left corner, same size as StreamAssistant */}
      {showInstallLink && !showGuide && (
        <button
          onClick={handleShowGuide}
          className={`fixed bottom-6 left-6 w-12 h-12 ${theme.bg} ${theme.border} border-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center ${theme.text} hover:${theme.textSecondary} hover:scale-110 active:scale-95`}
          title="Install Stream as PWA (Safari required)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
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
        <p className="mb-2">Add [stream] to your home screen (Safari required):</p>
        <ol className="space-y-1 pl-4">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Open this page in <strong className={theme.text}>Safari</strong></span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Click on <strong className={theme.text}>...</strong></span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Click on <strong className={theme.text}>Share</strong> button</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>Click on <strong className={theme.text}>More (...)</strong></span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">5.</span>
            <span>Click on <strong className={theme.text}>Add to Home Screen</strong></span>
          </li>
        </ol>
      </div>

    </div>
      )}
    </>
  );
};

export default PWAInstallGuide;