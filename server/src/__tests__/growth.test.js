import { describe, expect, it } from 'vitest';
import { computeGrowth } from '../utils/growth.js';

function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

describe('computeGrowth', () => {
  it('counts a consecutive run of daily checkins ending today', () => {
    const today = utcDate(2024, 6, 15);
    const checkinDates = [
      utcDate(2024, 6, 11),
      utcDate(2024, 6, 12),
      utcDate(2024, 6, 13),
      utcDate(2024, 6, 14),
      utcDate(2024, 6, 15),
    ];

    const growth = computeGrowth(checkinDates, today);

    expect(growth).toEqual({ streak: 5, stage: 'sapling', isWilted: false });
  });

  it('resets the streak and marks the habit wilted after a multi-day gap', () => {
    const today = utcDate(2024, 6, 15);
    // Checked in five days straight, then stopped. Today is 3 days past
    // the last checkin, well past the one-day grace period.
    const checkinDates = [
      utcDate(2024, 6, 8),
      utcDate(2024, 6, 9),
      utcDate(2024, 6, 10),
      utcDate(2024, 6, 11),
      utcDate(2024, 6, 12),
    ];

    const growth = computeGrowth(checkinDates, today);

    expect(growth).toEqual({ streak: 0, stage: 'seed', isWilted: true });
  });

  it('edge case: grants a one-day grace period, not wilted the day after a checkin', () => {
    // Most recent checkin was exactly yesterday. The habit has not had a
    // chance to check in again today yet, so this must not read as wilted,
    // and the existing streak must carry forward rather than reset to 0.
    const today = utcDate(2024, 6, 15);
    const checkinDates = [
      utcDate(2024, 6, 12),
      utcDate(2024, 6, 13),
      utcDate(2024, 6, 14),
    ];

    const growth = computeGrowth(checkinDates, today);

    expect(growth).toEqual({ streak: 3, stage: 'sprout', isWilted: false });
  });

  it('edge case: counts a streak correctly across a year boundary', () => {
    // Guards against a naive day-of-month-only diff (no month/year carry)
    // miscounting the gap between Dec 31 and Jan 1 as anything but 1 day.
    const today = utcDate(2025, 1, 1);
    const checkinDates = [utcDate(2024, 12, 30), utcDate(2024, 12, 31), utcDate(2025, 1, 1)];

    const growth = computeGrowth(checkinDates, today);

    expect(growth).toEqual({ streak: 3, stage: 'sprout', isWilted: false });
  });
});
