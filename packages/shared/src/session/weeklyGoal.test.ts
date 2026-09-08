import { describe, expect, it } from 'vitest';
import { getWeeklyGoalMessage } from './weeklyGoal';

describe('getWeeklyGoalMessage', () => {
  it('says nothing without a goal', () => {
    expect(getWeeklyGoalMessage(2, null)).toBeNull();
    expect(getWeeklyGoalMessage(2, 0)).toBeNull();
  });
  it('distinguishes exceeded, met and in progress', () => {
    expect(getWeeklyGoalMessage(4, 3)).toBe('You exceeded your 3-day goal — great week!');
    expect(getWeeklyGoalMessage(3, 3)).toBe('You hit your 3-day goal this week');
    expect(getWeeklyGoalMessage(1, 3)).toBe('1 of 3 days done — finish strong!');
    expect(getWeeklyGoalMessage(0, 1)).toBe('0 of 1 day done — finish strong!');
  });
});
