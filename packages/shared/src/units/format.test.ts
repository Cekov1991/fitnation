import { describe, it, expect } from 'vitest';
import {
  formatWeight,
  formatVolume,
  formatVolumeFull,
  formatDuration,
  minutesBetween,
  formatClock,
  formatRestCountdown,
  formatDate,
  signPrefix,
  formatSignedPercent,
} from './format';

describe('formatWeight', () => {
  it('shows whole weights without a decimal and the rest to one place', () => {
    expect(formatWeight(80)).toBe('80');
    expect(formatWeight(0)).toBe('0');
    expect(formatWeight(82.5)).toBe('82.5');
    expect(formatWeight(82.25)).toBe('82.3');
  });

  it('is lossy — which is why it must never feed an input', () => {
    expect(Number(formatWeight(82.55))).not.toBe(82.55);
  });
});

describe('formatVolume', () => {
  it('compacts from a thousand up and expands in full on demand', () => {
    expect(formatVolume(999)).toBe('999');
    expect(formatVolume(1000)).toBe('1.0k');
    expect(formatVolume(12437)).toBe('12.4k');
    expect(formatVolumeFull(12437)).toBe((12437).toLocaleString());
  });
});

describe('formatDuration', () => {
  it('reads as minutes under an hour and hours and minutes above', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(65)).toBe('1h 5m');
    expect(formatDuration(120)).toBe('2h');
  });

  it('is blank, not N/A, when there is nothing to show', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(undefined)).toBe('');
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(null) || 'N/A').toBe('N/A');
  });
});

describe('minutesBetween', () => {
  it('floors to whole minutes and is null without both ends', () => {
    expect(minutesBetween('2026-08-27T10:00:00Z', '2026-08-27T11:05:59Z')).toBe(65);
    expect(minutesBetween('2026-08-27T10:00:00Z', null)).toBeNull();
    expect(minutesBetween(null, '2026-08-27T10:00:00Z')).toBeNull();
  });
});

describe('formatClock', () => {
  it('reads m:ss, and h:mm:ss once an hour is reached', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(245)).toBe('4:05');
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3845)).toBe('1:04:05');
  });

  it('never shows a negative or fractional second', () => {
    expect(formatClock(-3)).toBe('0:00');
    expect(formatClock(59.9)).toBe('0:59');
  });
});

describe('formatRestCountdown', () => {
  it('counts seconds under a minute and switches to the clock at one', () => {
    expect(formatRestCountdown(45)).toBe('45s');
    expect(formatRestCountdown(60)).toBe('1:00');
    expect(formatRestCountdown(90)).toBe('1:30');
  });
});

describe('formatDate', () => {
  it('has one short and one long form', () => {
    expect(formatDate('2026-08-27T14:30:00', 'short')).toBe('Aug 27');
    expect(formatDate('2026-08-27T14:30:00')).toBe('Aug 27');
    expect(formatDate('2026-08-27T14:30:00', 'long')).toBe('Aug 27, 2026');
  });

  it('treats a date-only value as that calendar day in every timezone', () => {
    // Parsed as-is this is UTC midnight, i.e. Aug 26 in the Americas.
    expect(formatDate('2026-08-27', 'short')).toBe('Aug 27');
    expect(formatDate('2026-08-27', 'long')).toBe('Aug 27, 2026');
  });

  it('names the weekday in the device locale', () => {
    const text = formatDate('2026-08-27', 'weekday');
    expect(text).toMatch(/Thursday/);
    expect(text).toMatch(/27/);
  });
});

describe('signed changes', () => {
  it('prefixes gains and a flat result with +, losses with nothing', () => {
    expect(signPrefix(3)).toBe('+');
    expect(signPrefix(0)).toBe('+');
    expect(signPrefix(-3)).toBe('');
    expect(formatSignedPercent(12.4)).toBe('+12%');
    expect(formatSignedPercent(-5)).toBe('-5%');
    expect(formatSignedPercent(2.25, 1)).toBe('+2.3%');
  });
});
