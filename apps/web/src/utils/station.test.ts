import { beforeEach, describe, expect, it } from 'vitest';
import { ApiFailure } from '@fit-nation/shared';
import {
  BENEFITS,
  appGetUrl,
  benefitForScan,
  claimExerciseOpen,
  claimScan,
  guidanceOf,
  mistakesOf,
  parseExerciseId,
  pickBenefit,
  resetScanState,
  stationProblemOf,
} from './station';

describe('stationProblemOf', () => {
  it('reads the backend answers for stale stickers', () => {
    expect(stationProblemOf(new ApiFailure('http', 'Station not found.', { status: 404 }))).toBe('not_found');
    expect(stationProblemOf(new ApiFailure('http', 'No longer available.', { status: 410 }))).toBe('gone');
  });

  it('anything indefinite is a plain error, not a dead sticker', () => {
    expect(stationProblemOf(new ApiFailure('network', 'Could not reach the server.'))).toBe('error');
    expect(stationProblemOf(new ApiFailure('http', 'Server error', { status: 500 }))).toBe('error');
    expect(stationProblemOf(new TypeError('Failed to fetch'))).toBe('error');
  });
});

describe('guidanceOf', () => {
  it('structured instructions win over the description', () => {
    expect(guidanceOf({ instructions: ['Sit back.', ' Press up. '], description: 'ignored' })).toEqual({
      kind: 'steps',
      steps: ['Sit back.', 'Press up.'],
    });
  });

  it('falls back to description paragraphs while the backfill has not run', () => {
    expect(guidanceOf({ instructions: null, description: 'First line.\n\nSecond line.\n' })).toEqual({
      kind: 'paragraphs',
      paragraphs: ['First line.', 'Second line.'],
    });
  });

  it('empty or whitespace-only instructions do not count as structured guidance', () => {
    expect(guidanceOf({ instructions: [], description: 'Plain text.' })).toEqual({
      kind: 'paragraphs',
      paragraphs: ['Plain text.'],
    });
    expect(guidanceOf({ instructions: ['  '], description: null })).toEqual({ kind: 'none' });
  });

  it('nothing at all renders nothing, not an empty list', () => {
    expect(guidanceOf({ instructions: null, description: null })).toEqual({ kind: 'none' });
    expect(guidanceOf({ instructions: null, description: '  \n ' })).toEqual({ kind: 'none' });
  });
});

describe('mistakesOf', () => {
  it('trims and drops empties; null means no section', () => {
    expect(mistakesOf({ common_mistakes: [' Flaring elbows. ', '', 'Bouncing.'] })).toEqual([
      'Flaring elbows.',
      'Bouncing.',
    ]);
    expect(mistakesOf({ common_mistakes: null })).toEqual([]);
  });
});

describe('appGetUrl', () => {
  it('derives the /get redirect from the API base like AppDownloadPage does', () => {
    expect(appGetUrl('https://app.fitnation.mk/api')).toBe('https://app.fitnation.mk/get');
    expect(appGetUrl('https://app.fitnation.mk/api/')).toBe('https://app.fitnation.mk/get');
    expect(appGetUrl('http://localhost:8000/api')).toBe('http://localhost:8000/get');
  });

  it('carries the QR funnel parameters when given a funnel', () => {
    expect(appGetUrl('https://app.fitnation.mk/api', { station: 'abc123', exercise: 7, benefit: 'track_sets' })).toBe(
      'https://app.fitnation.mk/get?funnel=qr&station=abc123&exercise=7&benefit=track_sets'
    );
  });

  it('a chooser-page tap has no exercise; station and benefit still ride along', () => {
    expect(appGetUrl('https://app.fitnation.mk/api', { station: 'abc123', benefit: 'last_weight' })).toBe(
      'https://app.fitnation.mk/get?funnel=qr&station=abc123&benefit=last_weight'
    );
  });

  it('URL-encodes whatever the funnel carries', () => {
    expect(appGetUrl('https://app.fitnation.mk/api', { station: 'a&b=c' })).toBe(
      'https://app.fitnation.mk/get?funnel=qr&station=a%26b%3Dc'
    );
  });
});

describe('benefits', () => {
  it('every benefit has a stable, distinct key and its copy', () => {
    // Pinned on purpose: these keys are what the funnel URLs and recorded
    // events carry — renaming one breaks conversion data continuity.
    expect(BENEFITS.map(b => b.key)).toEqual(['track_sets', 'see_progress', 'personal_plan', 'last_weight']);
    for (const benefit of BENEFITS) {
      expect(benefit.title).toBeTruthy();
      expect(benefit.body).toBeTruthy();
    }
  });

  it('pickBenefit maps the random draw onto the array, edges included', () => {
    expect(pickBenefit(() => 0)).toBe(BENEFITS[0]);
    expect(pickBenefit(() => 0.999999)).toBe(BENEFITS[BENEFITS.length - 1]);
    // Even a rogue random() === 1 never lands out of bounds.
    expect(BENEFITS).toContain(pickBenefit(() => 1));
  });

  it('an undirected pick is always a valid benefit', () => {
    for (let i = 0; i < 50; i++) {
      expect(BENEFITS).toContain(pickBenefit());
    }
  });
});

describe('per-Scan state', () => {
  beforeEach(() => resetScanState());

  it('benefitForScan is chosen once per code and then stable for the page lifetime', () => {
    const first = benefitForScan('abc123');
    expect(BENEFITS).toContain(first);
    expect(benefitForScan('abc123')).toBe(first);
  });

  it('claimExerciseOpen is true exactly once per (code, exercise) — guards StrictMode double effects', () => {
    expect(claimExerciseOpen('abc123', 7)).toBe(true);
    expect(claimExerciseOpen('abc123', 7)).toBe(false);
    // Another exercise on the same station, or the same id elsewhere, is its own open.
    expect(claimExerciseOpen('abc123', 8)).toBe(true);
    expect(claimExerciseOpen('xyz789', 7)).toBe(true);
    resetScanState();
    expect(claimExerciseOpen('abc123', 7)).toBe(true);
  });

  it('claimScan is true exactly once per code — the single-scan-event guarantee', () => {
    expect(claimScan('abc123')).toBe(true);
    expect(claimScan('abc123')).toBe(false);
    expect(claimScan('abc123')).toBe(false);
    // A different Station in the same SPA session is its own Scan.
    expect(claimScan('xyz789')).toBe(true);
  });
});

describe('parseExerciseId', () => {
  it('accepts only a positive integer path segment', () => {
    expect(parseExerciseId('7')).toBe(7);
    expect(parseExerciseId('0')).toBeNull();
    expect(parseExerciseId('-3')).toBeNull();
    expect(parseExerciseId('7abc')).toBeNull();
    expect(parseExerciseId('1.5')).toBeNull();
    expect(parseExerciseId('')).toBeNull();
  });
});
