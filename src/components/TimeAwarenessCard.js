import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateTimeAwareness,
  formatPercentageLabel,
  getMillisecondsInUnit
} from '../utils/timeAwareness';

const DISPLAY_UNITS = ['days', 'weeks', 'months', 'years'];

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 100);
};


const TimeAwarenessCard = ({ config, onConfigure }) => {
  const { theme } = useTheme();
  const [displayUnitIndex, setDisplayUnitIndex] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());
  }, [config]);

  const metrics = useMemo(() => calculateTimeAwareness(config || {}, new Date(nowMs)), [config, nowMs]);

  const basePercentageValue = metrics.percentageComplete;
  const effectivePercentageValue = metrics.effectivePercentageComplete;
  const shouldUseEffective = config?.excludeConditions && Number.isFinite(effectivePercentageValue);
  const displayPercentage = clampPercentage((shouldUseEffective ? effectivePercentageValue : basePercentageValue) ?? 0);
  const accent = theme.themeAccent || '#3b82f6';
  const formatter = useMemo(() => new Intl.NumberFormat(), []);
  const intention = (config?.intention || '').trim();
  const hasData = metrics.hasData;

  const selectedUnit = DISPLAY_UNITS[displayUnitIndex];
  const millisecondsLeft = Math.max(metrics.millisecondsLeft ?? 0, 0);
  const effectiveMillisecondsLeft = Math.max(metrics.effectiveTimeLeft ?? metrics.millisecondsLeft ?? 0, 0);
  const displayMs = config?.excludeConditions ? effectiveMillisecondsLeft : millisecondsLeft;

  const percentageLabel = formatPercentageLabel(shouldUseEffective ? effectivePercentageValue : basePercentageValue);

  const primaryValue = useMemo(() => {
    if (!hasData) {
      return null;
    }

    const unitMs = getMillisecondsInUnit(selectedUnit);
    const raw = displayMs / unitMs;

    if (selectedUnit === 'years') {
      return raw.toFixed(raw >= 10 ? 1 : 2);
    }

    return formatter.format(Math.floor(raw));
  }, [formatter, hasData, displayMs, selectedUnit]);

  const primaryLabel = hasData
    ? `${selectedUnit} left`
    : 'waiting for details';

  const handleCycleUnit = useCallback(() => {
    setDisplayUnitIndex((prev) => (prev + 1) % DISPLAY_UNITS.length);
  }, []);


  return (
    <div className={`mb-4 p-3 ${theme.inputBg} ${theme.border} border rounded-sm`}
      data-testid="time-horizon-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className={`dynamic-text-xs font-light tracking-[0.24em] uppercase ${theme.textTertiary}`}>
            time horizon
          </p>
          <button
            type="button"
            onClick={handleCycleUnit}
            className={`dynamic-text-lg font-light tracking-tight ${theme.text} transition-opacity hover:opacity-80 focus:outline-none`}
            title="cycle between days, weeks, months, and years"
          >
            {primaryValue ?? '—'}
          </button>
          <p className={`dynamic-text-xs font-light ${theme.textSecondary}`}>
            {primaryLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onConfigure}
          className={`dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors rounded-sm px-2 py-1`}
        >
          {hasData ? 'adjust' : 'set horizon'}
        </button>
      </div>

      {hasData && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px rounded-full" style={{ backgroundColor: `${accent}20` }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${displayPercentage}%`, backgroundColor: accent }}
              />
            </div>
            <span className={`dynamic-text-xs font-light ${theme.textSecondary}`}>
              {percentageLabel}
            </span>
          </div>
          {intention && (
            <p className={`dynamic-text-xs font-light italic ${theme.textTertiary}`}>
              "{intention}"
            </p>
          )}
        </div>
      )}

      {!hasData && (
        <div className="mt-2">
          <p className={`dynamic-text-xs font-light ${theme.textSecondary}`}>
            set your horizon to see a gentle countdown.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeAwarenessCard;
