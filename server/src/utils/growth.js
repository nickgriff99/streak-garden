const GROWTH_STAGES = ['seed', 'sprout', 'sapling', 'bloom', 'flourishing'];

const STREAK_THRESHOLDS = {
  sprout: 2,
  sapling: 5,
  bloom: 10,
  flourishing: 21,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(earlierDate, laterDate) {
  const earlierStart = Date.UTC(
    earlierDate.getUTCFullYear(),
    earlierDate.getUTCMonth(),
    earlierDate.getUTCDate()
  );
  const laterStart = Date.UTC(
    laterDate.getUTCFullYear(),
    laterDate.getUTCMonth(),
    laterDate.getUTCDate()
  );
  return Math.round((laterStart - earlierStart) / MS_PER_DAY);
}

// Checkin dates must be sorted ascending (oldest first) before calling this.
function computeCurrentStreak(sortedCheckinDates, today) {
  if (sortedCheckinDates.length === 0) return 0;

  const mostRecent = sortedCheckinDates[sortedCheckinDates.length - 1];
  const staleDays = daysBetween(mostRecent, today);

  // More than one day since the last checkin means the streak already broke.
  if (staleDays > 1) return 0;

  let streak = 1;
  for (let i = sortedCheckinDates.length - 1; i > 0; i--) {
    const gap = daysBetween(sortedCheckinDates[i - 1], sortedCheckinDates[i]);
    if (gap === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function stageForStreak(streak) {
  if (streak >= STREAK_THRESHOLDS.flourishing) return 'flourishing';
  if (streak >= STREAK_THRESHOLDS.bloom) return 'bloom';
  if (streak >= STREAK_THRESHOLDS.sapling) return 'sapling';
  if (streak >= STREAK_THRESHOLDS.sprout) return 'sprout';
  return 'seed';
}

// Growth stage is always derived from checkin history, never stored on the
// habit row. Storing it would mean two sources of truth that can drift
// (e.g. a habit sits untouched for a week and its stored stage silently
// lies). Recomputing on read keeps the checkins table the single source
// of truth, at the cost of a bit of CPU per request.
function computeGrowth(checkinDates, now = new Date()) {
  const sorted = [...checkinDates].sort((a, b) => a - b);

  if (sorted.length === 0) {
    return { streak: 0, stage: 'seed', isWilted: false };
  }

  const streak = computeCurrentStreak(sorted, now);
  const mostRecent = sorted[sorted.length - 1];
  const isWilted = daysBetween(mostRecent, now) > 1;

  return { streak, stage: stageForStreak(streak), isWilted };
}

export { GROWTH_STAGES, STREAK_THRESHOLDS, computeGrowth, computeCurrentStreak, stageForStreak };
