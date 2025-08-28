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
    <div className="space-y-6">
      {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
        <button
          key={key}
          onClick={() => setSelections({ ...selections, organizationStyle: key })}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
            selections.organizationStyle === key
              ? `${theme.border} ${theme.buttonHover}`
              : `${theme.borderSecondary} ${theme.borderSecondaryHover}`
          }`}
        >
          <div className={`font-medium ${theme.text} mb-2`}>
            {style.name}
          </div>
          <div className={`text-sm ${theme.textSecondary} font-mono whitespace-pre-line`}>
            {style.example}
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
        <button
          key={key}
          onClick={() => setSelections({ ...selections, deleteTimer: key })}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
            selections.deleteTimer === key
              ? `${theme.border} ${theme.buttonHover}`
              : `${theme.borderSecondary} ${theme.borderSecondaryHover}`
          }`}
        >
          <div className={`font-medium ${theme.text}`}>
            {timer.name}
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
        <div className={`p-6 rounded-lg ${theme.borderSecondary} border`}>
          <div className={`text-sm ${theme.textTertiary} mb-3`}>
            Sample note with your preferences:
          </div>
          <div className={`${theme.text} font-mono whitespace-pre-line text-sm leading-relaxed`}>
            {formattedSample}
          </div>
          <div className={`text-xs ${theme.textTertiary} mt-3`}>
            Auto-deletes in: {DELETE_TIMERS[selections.deleteTimer].name.toLowerCase()}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${theme.bg === 'bg-white' ? 'bg-blue-50' : theme.buttonHover} border ${theme.borderSecondary}`}>
          <div className={`text-sm ${theme.textSecondary}`}>
            <strong>Smart formatting:</strong> Notes will only be organized when they look like lists. 
            Long paragraphs and detailed thoughts stay as-is.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        {renderProgressBar()}
        
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-light ${theme.text} mb-2`}>
            {steps[currentStep].title}
          </h1>
          <p className={`text-sm ${theme.textSecondary}`}>
            {steps[currentStep].subtitle}
          </p>
        </div>

        <div className="mb-8">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm font-light transition-all duration-200 ${
              currentStep === 0
                ? `${theme.textTertiary} cursor-not-allowed`
                : `${theme.textSecondary} hover:${theme.text.replace('text-', 'hover:text-')} ${theme.buttonHover}`
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className={`px-6 py-2 text-sm font-light ${theme.text} border ${theme.border} rounded ${theme.buttonHover} transition-all duration-200`}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;