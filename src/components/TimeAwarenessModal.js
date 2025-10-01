import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateTimeAwareness,
  formatCountdownCopy,
  formatPercentageLabel
} from '../utils/timeAwareness';

const EMPTY_STATE = {
  birthdate: '',
  currentAge: '',
  targetAge: 90,
  intention: 'spend today on what matters',
  lifeConditions: [
    { id: 'sleep', name: 'Sleep', hours: 8, enabled: true },
    { id: 'work', name: 'Work', hours: 8, enabled: false },
    { id: 'screen-time', name: 'Screen Time', hours: 4, enabled: false },
    { id: 'meal-prep', name: 'Meal Prep', hours: 1.5, enabled: false },
    { id: 'commuting', name: 'Commuting', hours: 1, enabled: false },
    { id: 'exercise', name: 'Exercise', hours: 1, enabled: false }
  ],
  excludeConditions: true
};

const TimeAwarenessModal = ({ isOpen, onClose, onSave, config }) => {
  const { theme } = useTheme();
  const [localConfig, setLocalConfig] = useState(() => ({
    ...EMPTY_STATE,
    ...config,
    lifeConditions: config?.lifeConditions || EMPTY_STATE.lifeConditions,
    excludeConditions: config?.excludeConditions !== undefined ? config.excludeConditions : EMPTY_STATE.excludeConditions
  }));
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [newConditionName, setNewConditionName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLocalConfig({
      ...EMPTY_STATE,
      ...config,
      lifeConditions: config?.lifeConditions || EMPTY_STATE.lifeConditions,
      excludeConditions: config?.excludeConditions !== undefined ? config.excludeConditions : EMPTY_STATE.excludeConditions
    });
    setHasAttemptedSave(false);
  }, [isOpen, config]);

  const metrics = useMemo(() => calculateTimeAwareness(localConfig), [localConfig]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConditionToggle = (conditionId) => {
    setLocalConfig((prev) => ({
      ...prev,
      lifeConditions: prev.lifeConditions.map(condition =>
        condition.id === conditionId
          ? { ...condition, enabled: !condition.enabled }
          : condition
      )
    }));
  };

  const handleConditionHoursChange = (conditionId, hours) => {
    const numericHours = parseFloat(hours) || 0;
    setLocalConfig((prev) => ({
      ...prev,
      lifeConditions: prev.lifeConditions.map(condition =>
        condition.id === conditionId
          ? { ...condition, hours: numericHours }
          : condition
      )
    }));
  };

  const handleAddCustomCondition = () => {
    if (!newConditionName.trim()) return;
    
    const newCondition = {
      id: `custom-${Date.now()}`,
      name: newConditionName.trim(),
      hours: 1,
      enabled: false
    };

    setLocalConfig((prev) => ({
      ...prev,
      lifeConditions: [...prev.lifeConditions, newCondition]
    }));

    setNewConditionName('');
  };

  const handleDeleteCondition = (conditionId) => {
    setLocalConfig((prev) => ({
      ...prev,
      lifeConditions: prev.lifeConditions.filter(condition => condition.id !== conditionId)
    }));
  };

  const targetAgeNumber = parseFloat(localConfig.targetAge);
  const hasTargetAge = Number.isFinite(targetAgeNumber) && targetAgeNumber > 0;
  const hasBirthdate = Boolean(localConfig.birthdate?.trim());
  const isValid = hasTargetAge && hasBirthdate;

  const handleSubmit = (event) => {
    event?.preventDefault();
    setHasAttemptedSave(true);

    if (!isValid) {
      return;
    }

    onSave?.(localConfig);
    onClose?.();
  };


  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20">
      <div
        className={`${theme.bg} ${theme.border} border w-full max-w-md shadow-lg p-4 sm:p-5 overflow-y-auto max-h-[85vh]`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
            horizon timer
          </h2>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <div className={`dynamic-text-xs ${theme.text} font-light mb-2`}>Birthdate:</div>
              <input
                type="date"
                value={localConfig.birthdate}
                onChange={handleChange('birthdate')}
                className={`w-full dynamic-text-sm font-light px-3 py-2 rounded-sm ${theme.inputBg} ${theme.border} border focus:outline-none ${theme.text}`}
              />
            </div>

            <div>
              <div className={`dynamic-text-xs ${theme.text} font-light mb-2`}>Life expectancy (years):</div>
              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={localConfig.targetAge}
                onChange={handleChange('targetAge')}
                placeholder="80"
                className={`w-full dynamic-text-sm font-light px-3 py-2 rounded-sm ${theme.inputBg} ${theme.border} border focus:outline-none ${theme.text}`}
                required
              />
            </div>

            <div>
              <div className={`dynamic-text-xs ${theme.text} font-light mb-2`}>Intention (optional):</div>
              <input
                type="text"
                value={localConfig.intention}
                onChange={handleChange('intention')}
                placeholder="spend today on what matters"
                className={`w-full dynamic-text-sm font-light px-3 py-2 rounded-sm ${theme.inputBg} ${theme.border} border focus:outline-none ${theme.text}`}
                maxLength={120}
              />
            </div>

            {hasAttemptedSave && !isValid && (
              <p className="dynamic-text-xs font-light text-red-500">
                Please enter a birthdate and target age.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className={`dynamic-text-xs ${theme.text} font-light`}>
              Life Conditions
            </div>
            <div className={`dynamic-text-xs ${theme.textSecondary} font-light`}>
              Configure activities that take time from your day. Enabled conditions will be excluded when "Exclude Conditions" is active.
            </div>
            
            <div className="space-y-3">
              {localConfig.lifeConditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-sm ${theme.inputBg} ${theme.border} border`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={condition.enabled}
                      onChange={() => handleConditionToggle(condition.id)}
                      className="w-4 h-4"
                    />
                    <span className={`dynamic-text-sm font-light ${theme.text}`}>
                      {condition.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={condition.hours}
                      onChange={(e) => handleConditionHoursChange(condition.id, e.target.value)}
                      className={`w-16 dynamic-text-sm font-light px-3 py-2 rounded-sm ${theme.inputBg} ${theme.borderSecondary} border focus:outline-none ${theme.text}`}
                    />
                    <span className={`dynamic-text-xs font-light ${theme.textSecondary}`}>
                      hrs/day
                    </span>
                    {condition.id.startsWith('custom-') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCondition(condition.id)}
                        className={`dynamic-text-xs font-light ${theme.textTertiary} hover:text-red-500 transition-colors ml-1`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className={`border-2 border-dashed ${theme.borderSecondary} rounded-sm p-4 text-center`}>
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="text"
                    value={newConditionName}
                    onChange={(e) => setNewConditionName(e.target.value)}
                    placeholder="Condition name"
                    className={`flex-1 max-w-40 dynamic-text-sm font-light px-2 py-1 rounded-sm ${theme.inputBg} ${theme.borderSecondary} border focus:outline-none ${theme.text}`}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCondition}
                    disabled={!newConditionName.trim()}
                    className={`dynamic-text-sm font-light px-3 py-1 rounded-sm transition-colors ${
                      newConditionName.trim()
                        ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`
                        : theme.textTertiary
                    }`}
                  >
                    + Add Custom Condition
                  </button>
                </div>
              </div>
            </div>
          </div>


          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
            >
              cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 dynamic-text-xs font-light rounded-sm transition-colors`}
              style={{
                color: theme.themeAccent || undefined,
                backgroundColor: `${theme.themeAccent || '#3b82f6'}15`
              }}
            >
              save horizon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeAwarenessModal;
