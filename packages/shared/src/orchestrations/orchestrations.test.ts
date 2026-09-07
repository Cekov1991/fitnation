import { describe, it, expect, vi } from 'vitest';
import { persistedSetLogId } from '../hooks/setLogMutations';
import { removeSet } from './removeSet';
import { submitOnboarding } from './submitOnboarding';
import { startLibraryProgram } from './startLibraryProgram';
import { deleteAccountAndSignOut } from './deleteAccountAndSignOut';
import { setPushEnabled } from './setPushEnabled';
import { swapWorkoutDays } from './swapWorkoutDays';
import { retryOnce } from './outcome';

/**
 * Every sequence, driven with a later write rejecting — the assertion that was
 * impossible while the sequences lived inside components.
 */

const ok = () => vi.fn().mockResolvedValue(undefined);
const fail = (message = 'offline') => vi.fn().mockRejectedValue(new Error(message));
const failThenOk = () => vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);

describe('retryOnce', () => {
  it('returns the first success and gives one more try', async () => {
    const fn = failThenOk();
    await expect(retryOnce(fn)).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(2);
    await expect(retryOnce(fail('still'))).rejects.toThrow('still');
  });
});

describe('removeSet', () => {
  const input = { sessionId: 10, sessionExerciseId: 100, setLogId: persistedSetLogId(2), targetSets: 3 };

  it('deletes the log, then lowers the target by one', async () => {
    const deps = { deleteSet: ok(), updateSessionExercise: ok(), resyncSession: ok() };
    expect(await removeSet(deps, input)).toEqual({ ok: true });
    expect(deps.deleteSet).toHaveBeenCalledWith({ sessionId: 10, setLogId: 2 });
    expect(deps.updateSessionExercise).toHaveBeenCalledWith({ sessionId: 10, exerciseId: 100, data: { target_sets: 2 } });
    expect(deps.resyncSession).not.toHaveBeenCalled();
  });

  it('only lowers the target for a pending slot', async () => {
    const deps = { deleteSet: ok(), updateSessionExercise: ok(), resyncSession: ok() };
    await removeSet(deps, { ...input, setLogId: null });
    expect(deps.deleteSet).not.toHaveBeenCalled();
    expect(deps.updateSessionExercise).toHaveBeenCalledTimes(1);
  });

  it('names the delete when it fails, and touches nothing else', async () => {
    const deps = { deleteSet: fail(), updateSessionExercise: ok(), resyncSession: ok() };
    expect(await removeSet(deps, input)).toMatchObject({ ok: false, failed: 'delete', compensated: true });
    expect(deps.updateSessionExercise).not.toHaveBeenCalled();
  });

  it('retries the target write once and succeeds quietly', async () => {
    const deps = { deleteSet: ok(), updateSessionExercise: failThenOk(), resyncSession: ok() };
    expect(await removeSet(deps, input)).toEqual({ ok: true });
    expect(deps.updateSessionExercise).toHaveBeenCalledTimes(2);
    expect(deps.resyncSession).not.toHaveBeenCalled();
  });

  it('resyncs the session when the target write is lost, and says which write failed', async () => {
    const deps = { deleteSet: ok(), updateSessionExercise: fail(), resyncSession: ok() };
    expect(await removeSet(deps, input)).toMatchObject({ ok: false, failed: 'target', compensated: true });
    expect(deps.updateSessionExercise).toHaveBeenCalledTimes(2);
    expect(deps.resyncSession).toHaveBeenCalledWith(10);
  });

  it('reports an uncompensated failure when even the resync fails', async () => {
    const deps = { deleteSet: ok(), updateSessionExercise: fail(), resyncSession: fail() };
    expect(await removeSet(deps, input)).toMatchObject({ ok: false, failed: 'target', compensated: false });
  });
});

describe('submitOnboarding', () => {
  const profile = { name: 'Ana' };

  it('saves the profile, then finishes, reporting each step', async () => {
    const steps: string[] = [];
    const deps = { saveProfile: ok(), finish: ok(), onStep: (s: string) => steps.push(s) };
    expect(await submitOnboarding(deps, { profile })).toEqual({ ok: true });
    expect(steps).toEqual(['profile', 'finish']);
  });

  it('stops at a failed profile save', async () => {
    const deps = { saveProfile: fail(), finish: ok() };
    expect(await submitOnboarding(deps, { profile })).toMatchObject({ ok: false, failed: 'profile' });
    expect(deps.finish).not.toHaveBeenCalled();
  });

  it('names the finish step when it fails after the profile saved', async () => {
    const deps = { saveProfile: ok(), finish: fail() };
    expect(await submitOnboarding(deps, { profile })).toMatchObject({ ok: false, failed: 'finish', compensated: false });
  });

  it('retries only the finish step when told the profile is already saved', async () => {
    const deps = { saveProfile: ok(), finish: ok() };
    await submitOnboarding(deps, { profile, profileSaved: true });
    expect(deps.saveProfile).not.toHaveBeenCalled();
    expect(deps.finish).toHaveBeenCalledTimes(1);
  });
});

describe('startLibraryProgram', () => {
  it('clones then activates', async () => {
    const deps = { cloneProgram: vi.fn().mockResolvedValue({ id: 77 }), activateProgram: ok(), deleteProgram: ok() };
    expect(await startLibraryProgram(deps, { programId: 5 })).toEqual({ ok: true, clonedId: 77 });
    expect(deps.activateProgram).toHaveBeenCalledWith(77);
    expect(deps.deleteProgram).not.toHaveBeenCalled();
  });

  it('treats a clone that returns no id as a failed clone', async () => {
    const deps = { cloneProgram: vi.fn().mockResolvedValue(undefined), activateProgram: ok() };
    expect(await startLibraryProgram(deps, { programId: 5 })).toMatchObject({ ok: false, failed: 'clone' });
    expect(deps.activateProgram).not.toHaveBeenCalled();
  });

  it('deletes the clone when the activate fails — no orphan', async () => {
    const deps = { cloneProgram: vi.fn().mockResolvedValue({ id: 77 }), activateProgram: fail(), deleteProgram: ok() };
    expect(await startLibraryProgram(deps, { programId: 5 })).toMatchObject({ ok: false, failed: 'activate', compensated: true, clonedId: 77 });
    expect(deps.deleteProgram).toHaveBeenCalledWith(77);
  });

  it('names the orphan when it cannot be removed', async () => {
    const deps = { cloneProgram: vi.fn().mockResolvedValue({ id: 77 }), activateProgram: fail() };
    expect(await startLibraryProgram(deps, { programId: 5 })).toMatchObject({ ok: false, failed: 'activate', compensated: false, clonedId: 77 });
  });
});

describe('deleteAccountAndSignOut', () => {
  it('deletes, then signs out', async () => {
    const deps = { deleteAccount: ok(), signOut: ok() };
    expect(await deleteAccountAndSignOut(deps, { password: 'pw' })).toEqual({ ok: true });
    expect(deps.deleteAccount).toHaveBeenCalledWith('pw');
  });

  it('leaves the account alone when the delete fails', async () => {
    const deps = { deleteAccount: fail(), signOut: ok() };
    expect(await deleteAccountAndSignOut(deps, {})).toMatchObject({ ok: false, failed: 'delete' });
    expect(deps.signOut).not.toHaveBeenCalled();
  });

  it('retries the sign-out, then reports the account as deleted but still signed in', async () => {
    const deps = { deleteAccount: ok(), signOut: fail() };
    expect(await deleteAccountAndSignOut(deps, {})).toMatchObject({ ok: false, failed: 'signOut', compensated: false });
    expect(deps.signOut).toHaveBeenCalledTimes(2);
  });
});

describe('setPushEnabled', () => {
  it('asks the OS only when enabling with no answer yet', async () => {
    const deps = { requestPermission: vi.fn().mockResolvedValue(true), updateSetting: ok() };
    await setPushEnabled(deps, { enabled: true, permissionUndetermined: true });
    await setPushEnabled(deps, { enabled: true, permissionUndetermined: false });
    await setPushEnabled(deps, { enabled: false, permissionUndetermined: true });
    expect(deps.requestPermission).toHaveBeenCalledTimes(1);
    expect(deps.updateSetting).toHaveBeenCalledTimes(3);
  });

  it('stops without saving when permission is refused', async () => {
    const deps = { requestPermission: vi.fn().mockResolvedValue(false), updateSetting: ok() };
    expect(await setPushEnabled(deps, { enabled: true, permissionUndetermined: true })).toMatchObject({ ok: false, failed: 'permission' });
    expect(deps.updateSetting).not.toHaveBeenCalled();
  });

  it('names the save when it fails after a grant', async () => {
    const deps = { requestPermission: vi.fn().mockResolvedValue(true), updateSetting: fail() };
    expect(await setPushEnabled(deps, { enabled: true, permissionUndetermined: true })).toMatchObject({ ok: false, failed: 'setting', compensated: false });
  });
});

describe('swapWorkoutDays', () => {
  const current = { templateId: 1, name: 'Push', dayOfWeek: 0 };
  const target = { templateId: 2, name: 'Pull', dayOfWeek: 2 };

  it('moves the target onto the current day, then the current onto the target day', async () => {
    const deps = { updateTemplate: ok() };
    expect(await swapWorkoutDays(deps, { current, target })).toEqual({ ok: true });
    expect(deps.updateTemplate.mock.calls).toEqual([
      [{ templateId: 2, data: { name: 'Pull', day_of_week: 0 } }],
      [{ templateId: 1, data: { name: 'Push', day_of_week: 2 } }],
    ]);
  });

  it('moves the target back when the second write fails — never two templates on one day', async () => {
    const deps = { updateTemplate: vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined) };
    expect(await swapWorkoutDays(deps, { current, target })).toMatchObject({ ok: false, failed: 'second', compensated: true });
    expect(deps.updateTemplate.mock.calls[2]).toEqual([{ templateId: 2, data: { name: 'Pull', day_of_week: 2 } }]);
  });

  it('reports the collision when the compensation also fails', async () => {
    const deps = { updateTemplate: vi.fn().mockResolvedValueOnce(undefined).mockRejectedValue(new Error('offline')) };
    expect(await swapWorkoutDays(deps, { current, target })).toMatchObject({ ok: false, failed: 'second', compensated: false });
  });

  it('changes nothing when the first write fails', async () => {
    const deps = { updateTemplate: fail() };
    expect(await swapWorkoutDays(deps, { current, target })).toMatchObject({ ok: false, failed: 'first', compensated: true });
    expect(deps.updateTemplate).toHaveBeenCalledTimes(1);
  });
});
