import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';

const Onboarding = () => {
  const { theme } = useTheme();
  const { completeOnboarding } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    organizationStyle: 'bullets',
    deleteTimer: '24h'
  });

  const steps = [
    {
      title: "How do you prefer lists organized?",
      subtitle: "Don't worry - you can change this anytime in settings"
    },
    {
      title: "When should notes disappear?",
      subtitle: "Notes will auto-delete to keep things clean"
    },
    {
      title: "You're all set!",
      subtitle: "Here's how your notes will look"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding(selections);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            index <= currentStep ? theme.text.replace('text-', 'bg-') : theme.borderSecondary.replace('border-', 'bg-')
          }`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
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

  const renderStep2 = () => (
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

  const renderStep3 = () => {
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
        
        <div className={`text-xs ${theme.textTertiary} font-light leading-relaxed`}>
          notes are organized automatically when they look like lists. paragraphs stay as-is.
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
      <div className="max-w-sm w-full">
        {renderProgressBar()}
        
        <div className="text-center mb-12">
          <h1 className={`text-lg font-light ${theme.text} mb-3 lowercase`}>
            {steps[currentStep].title}
          </h1>
          <p className={`text-xs ${theme.textTertiary} font-light`}>
            {steps[currentStep].subtitle.toLowerCase()}
          </p>
        </div>

        <div className="mb-12">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`text-xs font-light transition-all duration-200 ${
              currentStep === 0
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
            {currentStep === steps.length - 1 ? 'get started' : 'next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;