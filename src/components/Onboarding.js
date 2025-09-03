import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import { useStorage } from '../contexts/StorageContext';

const Onboarding = () => {
  const { theme, switchTheme, themes } = useTheme();
  const { completeOnboarding, settings } = useSettings();
  const { isSyncSupported } = useStorage();
  const [currentStep, setCurrentStep] = useState(-1); // Start with welcome screen
  const [selections, setSelections] = useState({
    theme: 'white',
    fontSize: 'base',
    organizationStyle: 'bullets',
    deleteTimer: '24h',
    syncEnabled: false
  });

  const steps = [
    {
      title: settings.personalityEnabled ? "First things first - what colors make your brain happy?" : "Theme Selection",
      subtitle: settings.personalityEnabled ? "I'm pretty flexible, but these are my favorites:" : "Choose your preferred application theme."
    },
    {
      title: settings.personalityEnabled ? "How big should the text be?" : "Font Size",
      subtitle: settings.personalityEnabled ? "You can always change this later in the settings." : "Select your preferred font size."
    },
    {
      title: settings.personalityEnabled ? "Now, when your thoughts come rapid-fire, how should I catch them?" : "Note Organization Style",
      subtitle: settings.personalityEnabled ? "Don't stress about this - I learn your style as we go." : "Select how your notes should be organized."
    },
    {
      title: settings.personalityEnabled ? "Here's my favorite part - the cleanup!" : "Auto-Delete Timer",
      subtitle: settings.personalityEnabled ? "I'm like a helpful roommate who actually does the dishes. How long should thoughts hang around before I tidy up?" : "Set the duration after which notes are automatically deleted."
    },
    {
      title: settings.personalityEnabled ? "How should I store your thoughts?" : "Data Storage",
      subtitle: settings.personalityEnabled ? "I can keep everything on this device, or sync across your browsers if you want." : "Choose whether to store notes locally or sync across devices."
    },
    {
      title: settings.personalityEnabled ? "Check it out! This is us working together." : "Preview and Confirmation",
      subtitle: settings.personalityEnabled ? "You dump thoughts, I organize and clean. Perfect partnership! Ready to let your mind run wild?" : "Review your selections and confirm to start using stream."
    }
  ];

  const handleNext = () => {
    if (currentStep === -1) {
      setCurrentStep(0); // Move from welcome to first step
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Apply theme selection before completing onboarding
      switchTheme(selections.theme);
      completeOnboarding(selections);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      setCurrentStep(-1); // Go back to welcome
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => (
    currentStep >= 0 && (
      <div className="flex items-center gap-2 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 transition-all duration-300 ${
              index <= currentStep ? 'bg-black' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    )
  );

  const renderWelcome = () => (
    <div className="text-center space-y-8">
      <div className="text-6xl mb-4">💧</div>
      <div className="space-y-0">
        <h1 className={`text-xl font-light ${theme.text} mb-4`}>
          {settings.personalityEnabled ? "Hey! I'm stream, your new note buddy" : "Welcome to stream"}
        </h1>
        <div className={`space-y-3 text-sm ${theme.textSecondary} font-light leading-relaxed max-w-sm mx-auto`}>
          {settings.personalityEnabled ? (
            <>
              <p>I noticed something... your brain moves FAST, but your notes? Total chaos, right?</p>
              <p>I get it. I'm the same way. That's why I exist.</p>
              <p>Let me show you how I keep brilliant minds like yours flowing freely...</p>
            </>
          ) : (
            <>
              <p>stream is a self-managing note application designed to help you organize your thoughts efficiently.</p>
              <p>This onboarding process will guide you through the initial setup of your preferences.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-0">
      {themes.map((themeName) => (
        <button
          key={themeName}
          onClick={() => {
            setSelections({ ...selections, theme: themeName });
            switchTheme(themeName);
          }}
          className={`w-full text-left p-4 transition-all duration-200 border-b-2 ${
            selections.theme === themeName
              ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
              : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} border-transparent`
          }`}
        >
          <div className="text-sm font-light">
            {themeName}
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep2 = () => {
    const FONT_SIZES = { sm: 14, base: 16, lg: 18, xl: 20 };
    
    const handleDecrease = () => {
      const sizes = Object.keys(FONT_SIZES);
      const currentIndex = sizes.indexOf(selections.fontSize);
      if (currentIndex > 0) {
        const newSize = sizes[currentIndex - 1];
        setSelections({ ...selections, fontSize: newSize });
        document.documentElement.style.setProperty('--base-font-size', `${FONT_SIZES[newSize]}px`);
      }
    };

    const handleIncrease = () => {
      const sizes = Object.keys(FONT_SIZES);
      const currentIndex = sizes.indexOf(selections.fontSize);
      if (currentIndex < sizes.length - 1) {
        const newSize = sizes[currentIndex + 1];
        setSelections({ ...selections, fontSize: newSize });
        document.documentElement.style.setProperty('--base-font-size', `${FONT_SIZES[newSize]}px`);
      }
    };

    return (
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleDecrease}
          className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
        >
          [-]
        </button>
        <span className={`dynamic-text-base font-light ${theme.text}`}>
          {FONT_SIZES[selections.fontSize]}
        </span>
        <button
          onClick={handleIncrease}
          className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
        >
          [+]
        </button>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-0">
      {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
        <button
          key={key}
          onClick={() => setSelections({ ...selections, organizationStyle: key })}
          className={`w-full text-left p-3 transition-all duration-200 border-b ${
            selections.organizationStyle === key
              ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
              : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} border-transparent`
          }`}
        >
          <div className="text-sm font-light mb-2">
            {style.name.toLowerCase()}
          </div>
          <div className={`text-xs ${theme.textTertiary} font-mono whitespace-pre-line leading-relaxed`}>
            {style.example}
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-0">
      {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
        <button
          key={key}
          onClick={() => setSelections({ ...selections, deleteTimer: key })}
          className={`w-full text-left p-3 transition-all duration-200 border-b ${
            selections.deleteTimer === key
              ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
              : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} border-transparent`
          }`}
        >
          <div className="text-sm font-light">
            {timer.name.toLowerCase()}
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-0">
      <button
        onClick={() => setSelections({ ...selections, syncEnabled: false })}
        className={`w-full text-left p-3 transition-all duration-200 border-b ${
          !selections.syncEnabled
            ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
            : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} border-transparent`
        }`}
      >
        <div className="text-sm font-light mb-1">
          local only (this device only)
        </div>
      </button>
      
      {isSyncSupported() ? (
        <button
          onClick={() => setSelections({ ...selections, syncEnabled: true })}
          className={`w-full text-left p-3 transition-all duration-200 border-b ${
            selections.syncEnabled
              ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
              : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} border-transparent`
          }`}
        >
          <div className="text-sm font-light mb-1">
            browser sync (sync across devices)
          </div>
        </button>
      ) : (
        <div className={`p-3 border-b ${theme.borderSecondary}`}>
          <div className={`text-sm font-light mb-1 ${theme.textTertiary}`}>
            browser sync (not available)
          </div>
        </div>
      )}
      
      <div className={`text-xs ${theme.textTertiary} font-light leading-relaxed p-3`}>
        browser sync uses your existing browser account to sync notes across devices. your data never goes to stream servers.
      </div>
    </div>
  );

  const renderStep6 = () => {
    const sampleText = "Buy groceries\nCall mom\nFinish project";
    const formattedSample = ORGANIZATION_STYLES[selections.organizationStyle].format(
      sampleText.split('\n')
    );
    
    return (
      <div className="space-y-6">
        <div className={`pb-4 border-b ${theme.borderSecondary}`}>
          <div className={`text-xs ${theme.textTertiary} mb-3 font-light`}>
            sample note:
          </div>
          <div className={`${theme.text} font-mono whitespace-pre-line text-sm font-light leading-relaxed`}>
            {formattedSample}
          </div>
          <div className={`text-xs ${theme.textTertiary} mt-3 font-light`}>
            deletes in: {DELETE_TIMERS[selections.deleteTimer].name.toLowerCase()}
          </div>
          <div className={`text-xs ${theme.textTertiary} mt-2 font-light`}>
            storage: {selections.syncEnabled ? 'browser sync' : 'local only'}
          </div>
        </div>
        
        <div className={`text-sm ${theme.text} font-light leading-relaxed text-center`}>
          {settings.personalityEnabled ? "Ready to let your mind run wild?" : "Ready to start using stream?"}
        </div>
      </div>
    );
  };

  const getFontSizeValue = (fontSize) => {
    const sizes = { sm: 14, base: 16, lg: 18, xl: 20 };
    return sizes[fontSize] || 16;
  };

  return (
    <div 
      className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}
      style={{ 
        '--base-font-size': `${getFontSizeValue(selections.fontSize)}px`
      }}>
      <div className="max-w-sm w-full">
        {renderProgressBar()}
        
        {currentStep === -1 ? (
          <div className="mb-12">
            {renderWelcome()}
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className={`text-lg font-light ${theme.text} mb-3`}>
                {steps[currentStep].title}
              </h1>
              <p className={`text-xs ${theme.textTertiary} font-light`}>
                {steps[currentStep].subtitle}
              </p>
            </div>

            <div className="mb-12">
              {currentStep === 0 && renderStep1()}
              {currentStep === 1 && renderStep2()}
              {currentStep === 2 && renderStep3()}
              {currentStep === 3 && renderStep4()}
              {currentStep === 4 && renderStep5()}
              {currentStep === 5 && renderStep6()}
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === -1}
            className={`text-xs font-light transition-all duration-200 ${
              currentStep === -1
                ? `${theme.textTertiary} cursor-not-allowed`
                : `${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
            }`}
          >
            {currentStep > 0 ? 'back' : ''}
          </button>

          <button
            onClick={handleNext}
            className={`text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-all duration-200`}
          >
            {currentStep === -1 ? (settings.personalityEnabled ? 'let\'s go!' : 'Start') : currentStep === steps.length - 1 ? (settings.personalityEnabled ? 'start flowing' : 'Finish') : 'next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;