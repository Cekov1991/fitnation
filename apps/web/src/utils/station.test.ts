import { describe, expect, it } from 'vitest';
import { ApiFailure } from '@fit-nation/shared';
import { appGetUrl, guidanceOf, mistakesOf, parseExerciseId, stationProblemOf } from './station';

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
