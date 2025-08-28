import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';

const Onboarding = () => {
  const { theme, switchTheme, themes } = useTheme();
  const { completeOnboarding } = useSettings();
  const [currentStep, setCurrentStep] = useState(-1); // Start with welcome screen
  const [selections, setSelections] = useState({
    theme: 'white',
    fontSize: 16,
    organizationStyle: 'bullets',
    deleteTimer: '24h'
  });

  const steps = [
    {
      title: "first things first - what colors make your brain happy?",
      subtitle: "i'm pretty flexible, but these are my favorites:"
    },
    {
      title: "when your thoughts come rapid-fire, how should i catch them?",
      subtitle: "don't stress about this - i learn your style as we go"
    },
    {
      title: "here's my favorite part - the cleanup!",
      subtitle: "how long should thoughts hang around before i tidy up?"
    },
    {
      title: "check it out! this is us working together",
      subtitle: "you dump thoughts, i organize and clean. perfect partnership!"
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
      <div className="space-y-4">
        <h1 className={`text-xl font-light ${theme.text} mb-4`}>
          hey! i'm stream, your new note buddy
        </h1>
        <div className={`space-y-3 text-sm ${theme.textSecondary} font-light leading-relaxed max-w-sm mx-auto`}>
          <p>i noticed something... your brain moves FAST, but your notes? total chaos, right?</p>
          <p>i get it. i'm the same way. that's why i exist.</p>
          <p>let me show you how i keep brilliant minds like yours flowing freely...</p>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-3">
      {themes.map((themeName) => (
        <button
          key={themeName}
          onClick={() => {
            setSelections({ ...selections, theme: themeName });
            switchTheme(themeName);
          }}
          className={`w-full text-left pb-3 border-b transition-all duration-200 ${
            selections.theme === themeName
              ? `${theme.borderSecondary} ${theme.text}`
              : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
          }`}
        >
          <div className="text-sm font-light">
            [{themeName}]
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
        <button
          key={key}
          onClick={() => setSelections({ ...selections, organizationStyle: key })}
          className={`w-full text-left pb-4 border-b transition-all duration-200 ${
            selections.organizationStyle === key
              ? `${theme.borderSecondary} ${theme.text}`
              : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
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

  const renderStep3 = () => (
    <div className="space-y-3">
      {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
        <button
          key={key}
          onClick={() => setSelections({ ...selections, deleteTimer: key })}
          className={`w-full text-left pb-3 border-b transition-all duration-200 ${
            selections.deleteTimer === key
              ? `${theme.borderSecondary} ${theme.text}`
              : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
          }`}
        >
          <div className="text-sm font-light">
            {timer.name.toLowerCase()}
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep4 = () => {
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
        </div>
        
        <div className={`text-sm ${theme.text} font-light leading-relaxed text-center`}>
          ready to let your mind run wild?
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}
      style={{ fontSize: `${selections.fontSize}px` }}
    >
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
            {currentStep === -1 ? 'let\'s go!' : currentStep === steps.length - 1 ? 'start flowing' : 'next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;