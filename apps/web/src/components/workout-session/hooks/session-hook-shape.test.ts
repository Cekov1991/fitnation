import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for spec 0030. The session hook's interface was 63
 * members over one 599-line implementation — a caller learned nearly as much
 * as the module hid. Presentation state and the rest timer now have their own
 * owners; this keeps the hook from growing back into the bag it was, and the
 * 32-prop pass-through from returning.
 */
const HERE = dirname(fileURLToPath(import.meta.url));

describe('the session hook stays split', () => {
  const source = readFileSync(join(HERE, 'useWorkoutSessionState.ts'), 'utf8');
  const iface = source.slice(source.indexOf('interface UseWorkoutSessionStateReturn {'), source.indexOf('\n}\n', source.indexOf('interface UseWorkoutSessionStateReturn {')));
  const members = iface.split('\n').filter(line => /^\s+\w+\??:/.test(line)).length;

  it('returns fewer than 45 members', () => {
    expect(members).toBeGreaterThan(20);
    expect(members).toBeLessThan(45);
  });

  it('owns no dialog open-state or rest-timer state', () => {
    // showSummary is session state (the summary follows a finished session); the dialogs are not.
    expect(source).not.toMatch(
      /const \[(showExerciseMenu|showSetMenu|showExercisePicker|showCancelConfirm|showFinishConfirm|isRestTimerActive|restTimerSeconds)\b/
    );
  });

  it('has no bare setTimeout — the advance is owned and cancelled by useExerciseIndex', () => {
    expect(source).not.toMatch(/\bsetTimeout\(/);
  });

  it('the 32-prop pass-through is gone', () => {
    expect(existsSync(join(HERE, '..', 'WorkoutDialogs.tsx'))).toBe(false);
  });
});
