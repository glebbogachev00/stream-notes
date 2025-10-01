const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = MS_IN_SECOND * 60;
const MS_IN_HOUR = MS_IN_MINUTE * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;
const MS_IN_YEAR = MS_IN_DAY * 365.25;
const MS_IN_MONTH = MS_IN_YEAR / 12;
const MS_IN_WEEK = MS_IN_DAY * 7;

const safeParseNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAgeFromBirthdate = (birthdate, nowMs) => {
  if (!birthdate) {
    return null;
  }

  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const diffMs = nowMs - birth.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return null;
  }

  return diffMs / MS_IN_YEAR;
};

export const calculateTimeAwareness = ({ birthdate, currentAge, targetAge, lifeConditions = [], excludeConditions = true }, nowDate = new Date()) => {
  const nowMs = nowDate instanceof Date ? nowDate.getTime() : Date.now();

  const currentAgeFromBirthdate = getAgeFromBirthdate(birthdate, nowMs);
  const currentAgeFromInput = safeParseNumber(currentAge);
  const effectiveCurrentAge = currentAgeFromBirthdate ?? currentAgeFromInput ?? null;

  const targetAgeNumber = safeParseNumber(targetAge);

  if (effectiveCurrentAge === null || targetAgeNumber === null) {
    return {
      hasData: false,
      currentAgeYears: currentAgeFromBirthdate ?? currentAgeFromInput ?? null,
      targetAgeYears: targetAgeNumber,
      yearsLeft: null,
      monthsLeft: null,
      weeksLeft: null,
      daysLeft: null,
      percentageComplete: null,
      effectiveYearsLeft: null,
      effectiveMonthsLeft: null,
      effectiveWeeksLeft: null,
      effectiveDaysLeft: null,
      effectivePercentageComplete: null,
      targetYear: null,
      targetTimestamp: null,
      nowTimestamp: nowMs,
      hasPreciseTarget: Boolean(currentAgeFromBirthdate),
      millisecondsLeft: null,
      effectiveTimeLeft: null,
      dailyConditionHours: 0,
      conditionRatio: 0,
      excludeConditions,
      lifeConditions
    };
  }

  const yearsLeftRaw = Math.max(targetAgeNumber - effectiveCurrentAge, 0);
  const monthsLeft = Math.round(yearsLeftRaw * 12);
  const daysLeft = Math.max(Math.round(yearsLeftRaw * 365.25), 0);
  const weeksLeft = Math.round(daysLeft / 7);
  const percentageComplete = Math.min((effectiveCurrentAge / targetAgeNumber) * 100, 100);

  let targetTimestamp;
  let targetYear = null;
  if (birthdate) {
    const birth = new Date(birthdate);
    if (!Number.isNaN(birth.getTime())) {
      targetTimestamp = birth.getTime() + (targetAgeNumber * MS_IN_YEAR);
      targetYear = new Date(targetTimestamp).getFullYear();
    }
  } else {
    targetTimestamp = nowMs + (yearsLeftRaw * MS_IN_YEAR);
    targetYear = new Date(nowMs).getFullYear() + Math.round(yearsLeftRaw);
  }

  const millisecondsLeft = Math.max(targetTimestamp - nowMs, 0);

  // Calculate effective time left after excluding conditions
  let effectiveTimeLeft = millisecondsLeft;
  let dailyConditionHours = 0;
  let conditionRatio = 0;

  if (excludeConditions && lifeConditions.length > 0) {
    dailyConditionHours = lifeConditions
      .filter(condition => condition.enabled)
      .reduce((total, condition) => total + (condition.hours || 0), 0);

    conditionRatio = Math.max(0, Math.min(1, dailyConditionHours / 24));
    effectiveTimeLeft = millisecondsLeft * (1 - conditionRatio);
  }

  const ratioMultiplier = excludeConditions ? (1 - conditionRatio) : 1;
  const safeMultiplier = Math.max(0, ratioMultiplier);
  const effectiveYearsLeft = yearsLeftRaw * safeMultiplier;
  const effectiveMonthsLeft = Math.round(monthsLeft * safeMultiplier);
  const effectiveWeeksLeft = Math.round(weeksLeft * safeMultiplier);
  const effectiveDaysLeft = Math.round(daysLeft * safeMultiplier);

  const totalLifetimeMs = targetAgeNumber * MS_IN_YEAR;
  const millisecondsLived = Math.max(totalLifetimeMs - millisecondsLeft, 0);
  const effectiveMillisecondsLived = excludeConditions ? millisecondsLived * ratioMultiplier : millisecondsLived;
  const effectiveRemainingMs = excludeConditions ? effectiveTimeLeft : millisecondsLeft;
  const effectiveTotalMs = effectiveMillisecondsLived + effectiveRemainingMs;
  const effectivePercentageComplete = effectiveTotalMs > 0
    ? Math.min((effectiveMillisecondsLived / effectiveTotalMs) * 100, 100)
    : percentageComplete;

  return {
    hasData: true,
    currentAgeYears: effectiveCurrentAge,
    targetAgeYears: targetAgeNumber,
    yearsLeft: yearsLeftRaw,
    monthsLeft,
    weeksLeft,
    daysLeft,
    percentageComplete,
    effectiveYearsLeft,
    effectiveMonthsLeft,
    effectiveWeeksLeft,
    effectiveDaysLeft,
    effectivePercentageComplete,
    targetYear,
    targetTimestamp,
    nowTimestamp: nowMs,
    hasPreciseTarget: Boolean(birthdate),
    millisecondsLeft,
    effectiveTimeLeft,
    dailyConditionHours,
    conditionRatio,
    excludeConditions,
    lifeConditions
  };
};

export const formatCountdownCopy = ({
  daysLeft,
  weeksLeft,
  yearsLeft,
  effectiveDaysLeft,
  effectiveWeeksLeft,
  effectiveYearsLeft,
  excludeConditions
}) => {
  const useEffective = excludeConditions &&
    Number.isFinite(effectiveYearsLeft) &&
    Number.isFinite(effectiveWeeksLeft) &&
    Number.isFinite(effectiveDaysLeft);
  const displayYears = useEffective ? effectiveYearsLeft : yearsLeft;
  const displayWeeks = useEffective ? effectiveWeeksLeft : weeksLeft;
  const displayDays = useEffective ? effectiveDaysLeft : daysLeft;

  if (displayYears === null || displayYears === undefined) {
    return 'set your timeline to see the countdown';
  }

  if (displayYears === 0) {
    return "you're at your target horizon—celebrate today.";
  }

  const formatter = new Intl.NumberFormat();
  const yearsText = `${displayYears < 1 ? displayYears.toFixed(1) : displayYears.toFixed(0)} year${displayYears === 1 ? '' : 's'}`;
  const weeksText = `${formatter.format(displayWeeks)} week${displayWeeks === 1 ? '' : 's'}`;
  const daysText = `${formatter.format(displayDays)} day${displayDays === 1 ? '' : 's'}`;

  return `roughly ${yearsText} • ${weeksText} • ${daysText}`;
};

export const formatPercentageLabel = (percentage) => {
  if (percentage === null || percentage === undefined) {
    return 'waiting for details';
  }

  const clamped = Math.min(Math.max(percentage, 0), 100);
  return `${clamped.toFixed(1)}% of your horizon lived`;
};

export const countdownBreakdown = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }

  let remaining = ms;
  const years = Math.floor(remaining / MS_IN_YEAR);
  remaining -= years * MS_IN_YEAR;

  const months = Math.floor(remaining / MS_IN_MONTH);
  remaining -= months * MS_IN_MONTH;

  const days = Math.floor(remaining / MS_IN_DAY);
  remaining -= days * MS_IN_DAY;

  const hours = Math.floor(remaining / MS_IN_HOUR);
  remaining -= hours * MS_IN_HOUR;

  const minutes = Math.floor(remaining / MS_IN_MINUTE);
  remaining -= minutes * MS_IN_MINUTE;

  const seconds = Math.floor(remaining / MS_IN_SECOND);

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds
  };
};

export const getMillisecondsInUnit = (unit) => {
  switch (unit) {
    case 'years':
      return MS_IN_YEAR;
    case 'months':
      return MS_IN_MONTH;
    case 'weeks':
      return MS_IN_WEEK;
    case 'days':
    default:
      return MS_IN_DAY;
  }
};
