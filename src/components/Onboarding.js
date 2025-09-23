import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, DELETE_TIMERS } from '../contexts/SettingsContext';
import { setUserTag, validateUserTag, formatUserTag } from '../utils/tags';
import { sanitizeInput } from '../utils/security';

const Onboarding = () => {
  const { theme, switchTheme, themes } = useTheme();
  const { completeOnboarding, settings } = useSettings();
  const [currentStep, setCurrentStep] = useState(-1); // Start with welcome screen
  const [selections, setSelections] = useState({
    theme: 'white',
    fontSize: 'xl',
    organizationStyle: 'bullets',
    autoSortingEnabled: false,
    deleteTimer: '24h',
    userTag: '',
    securityAcknowledged: false,
    enhancedEditingEnabled: false,
    personalityEnabled: false,
    foldersEnabled: false
  });
  const [tagError, setTagError] = useState('');

  const steps = [
    {
      title: settings.personalityEnabled ? "Pick your colors" : "Theme Selection",
      subtitle: settings.personalityEnabled ? "What feels right?" : "Choose your preferred theme."
    },
    {
      title: settings.personalityEnabled ? "Your signature" : "Create Your Signature",
      subtitle: settings.personalityEnabled ? "Make your mark" : "This tag appears on your notes"
    },
    {
      title: "Text size",
      subtitle: settings.personalityEnabled ? "Whatever works" : "Select your font size."
    },
    {
      title: settings.personalityEnabled ? "Auto-cleanup" : "Auto-Delete Timer",
      subtitle: settings.personalityEnabled ? "When should old notes disappear?" : "Set auto-delete duration."
    }
  ];

  const handleNext = () => {
    if (currentStep === -1) {
      setCurrentStep(0); // Move from welcome to first step
    } else if (currentStep === 1) { // Tag creation step
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
      
      // Set final values with sensible defaults
      const finalSelections = {
        ...selections,
        securityAcknowledged: true,
        organizationStyle: 'bullets',
        autoSortingEnabled: false,
        enhancedEditingEnabled: false,
        personalityEnabled: false,
        foldersEnabled: false
      };
      completeOnboarding(finalSelections);
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
          {settings.personalityEnabled ? "Hey! I'm stream" : "Welcome to stream"}
        </h1>
        <div className={`space-y-3 text-sm ${theme.textSecondary} font-light leading-relaxed max-w-sm mx-auto`}>
          {settings.personalityEnabled ? (
            <>
              <p>Fast thoughts, organized notes.</p>
              <p>Let's get you set up.</p>
            </>
          ) : (
            <>
              <p>For fast thinkers.</p>
              <p>Quick setup ahead.</p>
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
    const FONT_SIZES = { lg: 18, xl: 20, xxl: 22 };
    
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
            <p>Your unique signature for notes.</p>
          </div>
        </div>
        
        <div className="space-y-3 text-center">
          <div className={`text-sm ${theme.text} inline-flex items-center justify-center`}>
            [<input
              type="text"
              value={selections.userTag}
              onChange={(e) => {
                const value = sanitizeInput(e.target.value);
                setSelections({ ...selections, userTag: value });
                setTagError('');
              }}
              placeholder="your-name"
              className={`bg-transparent ${theme.text} text-sm font-light focus:outline-none text-center`}
              style={{ width: `${Math.max((selections.userTag || 'your-name').length, 1)}ch`, minWidth: '1ch' }}
              maxLength={15}
            />]©
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



  const getFontSizeValue = (fontSize) => {
    const sizes = { lg: 18, xl: 20, xxl: 22 };
    return sizes[fontSize] || 20;
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
              {currentStep === 1 && renderTagStep()}
              {currentStep === 2 && renderFontSizeStep()}
              {currentStep === 3 && renderStep4()}
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
            {currentStep === -1 ? 'let\'s go!' : currentStep === steps.length - 1 ? (settings.personalityEnabled ? 'start flowing' : 'start') : 'next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;