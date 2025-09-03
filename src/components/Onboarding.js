import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import { useStorage } from '../contexts/StorageContext';
import { setUserTag, validateUserTag, formatUserTag } from '../utils/tags';
import { sanitizeInput } from '../utils/security';

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
    syncEnabled: false,
    userTag: '',
    securityAcknowledged: false
  });
  const [tagError, setTagError] = useState('');

  const steps = [
    {
      title: settings.personalityEnabled ? "First things first - what colors make your brain happy?" : "Theme Selection",
      subtitle: settings.personalityEnabled ? "I'm pretty flexible, but these are my favorites:" : "Choose your preferred application theme."
    },
    {
      title: "Your privacy matters",
      subtitle: "stream keeps everything local. Your thoughts stay on your device."
    },
    {
      title: settings.personalityEnabled ? "Choose your tag" : "Create Your Signature",
      subtitle: settings.personalityEnabled ? "Like graffiti artists, create your signature" : "This tag will appear on all your notes"
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
    } else if (currentStep === 1) { // Security step
      setSelections({ ...selections, securityAcknowledged: true }); // Acknowledge security automatically
      setCurrentStep(currentStep + 1); // Advance to next step
    } else if (currentStep === 2) { // Tag creation step
      if (!selections.userTag.trim()) {
        setTagError('Please enter a tag name');
        return;
      }
      
      const sanitized = sanitizeInput(selections.userTag);
      if (!validateUserTag(sanitized)) {
        setTagError('Use only letters, numbers, hyphens, and underscores (2-15 characters)');
        return;
      }
      
      try {
        setUserTag(sanitized);
        setTagError('');
        setCurrentStep(currentStep + 1);
      } catch (error) {
        setTagError(error.message);
      }
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
      <div className="text-6xl mb-4">
        <div className={`${theme.bgSecondary} ${theme.text} px-3 py-1 rounded transform -rotate-1`}>
          <span className="font-bold text-4xl tracking-wide" style={{
            textShadow: '1px 1px 2px rgba(255,255,255,0.1)',
            letterSpacing: '1px'
          }}>
            [stream]©
          </span>
        </div>
      </div>
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

  const renderFontSizeStep = () => {
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
              ? `${theme.text} ${theme.text.replace('text-', 'border-')} font-medium bg-opacity-10 ${theme.bg === 'bg-white' ? 'bg-black' : theme.bg === 'bg-amber-50' ? 'bg-amber-900' : 'bg-white'}`
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

  const renderSecurityStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <div className="text-4xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className={`text-sm ${theme.textSecondary} font-light leading-relaxed max-w-xs mx-auto space-y-3`}>
          <p>stream keeps everything local. Your thoughts stay on your device.</p>
          <p>No cloud storage. No data collection. Complete privacy.</p>
        </div>
      </div>
    </div>
  );

  const renderTagStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mx-auto ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div className={`text-xs ${theme.textSecondary} font-light leading-relaxed space-y-2 text-center`}>
            <p>Your tag is your unique signature, inspired by graffiti tagging.</p>
            <p>It's how you sign your notes, like a username.</p>
          </div>
        </div>
        
        <div className="space-y-3 text-center">
          <div className="flex justify-center items-center">
            <span className={`text-sm ${theme.text}`}>[</span>
            <input
              type="text"
              value={selections.userTag}
              onChange={(e) => {
                const value = sanitizeInput(e.target.value);
                setSelections({ ...selections, userTag: value });
                setTagError('');
              }}
              placeholder="your-name"
              className={`bg-transparent ${theme.text} text-sm font-light focus:outline-none text-center`}
              size={selections.userTag.length || 'your-name'.length}
              maxLength={15}
            />
            <span className={`text-sm ${theme.text}`}>]©</span>
          </div>
          
          {selections.userTag && validateUserTag(selections.userTag) && (
            <div className="text-center py-2">
              <span 
                className={`inline-block text-xs font-medium ${theme.text}`}
              >
                {formatUserTag({ name: selections.userTag })}
              </span>
            </div>
          )}
          
          {tagError && (
            <p className={`text-xs text-red-500 font-light text-center`}>
              {tagError}
            </p>
          )}
        </div>
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
          {selections.userTag && validateUserTag(selections.userTag) && (
            <div className="flex items-center justify-between mt-3">
              <div className={`text-xs ${theme.textTertiary} font-light`}>
                your signature:
              </div>
              <span 
                className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${theme.text}`}
                style={{ 
                  backgroundColor: `${theme.text}20`,
                  border: `1px solid ${theme.text}40`
                }}
              >
                {formatUserTag({ name: selections.userTag })}
              </span>
            </div>
          )}
          <div className={`text-xs ${theme.textTertiary} mt-3 font-light`}>
            deletes in: {DELETE_TIMERS[selections.deleteTimer].name.toLowerCase()}
          </div>
          <div className={`text-xs ${theme.textTertiary} mt-2 font-light`}>
            storage: {selections.syncEnabled ? 'browser sync' : 'local only'}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className={`text-xs ${theme.textTertiary} font-light text-center`}>
            Your notes and preferences are saved securely on your device.
          </div>
          <div className={`text-sm ${theme.text} font-light leading-relaxed text-center`}>
            {settings.personalityEnabled ? "Ready to let your mind run wild?" : "Ready to start using stream?"}
          </div>
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
              {currentStep === 1 && renderSecurityStep()}
              {currentStep === 2 && renderTagStep()}
              {currentStep === 3 && renderFontSizeStep()}
              {currentStep === 4 && renderStep3()}
              {currentStep === 5 && renderStep4()}
              {currentStep === 6 && renderStep5()}
              {currentStep === 7 && renderStep6()}
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