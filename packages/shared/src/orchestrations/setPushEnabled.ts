import type { Outcome } from './outcome';

/**
 * Turn push on or off: obtain the OS permission when it has never been asked,
 * then save the setting. A grant followed by a failed save leaves the phone
 * registered for push while `push_enabled` is false; the outcome names the
 * save so the caller can revert its optimistic flip and say what happened,
 * instead of falling back to a stale query value in silence.
 */
export interface SetPushEnabledDeps {
  /** Ask the OS; resolves with whether permission was granted. */
  requestPermission: () => Promise<boolean>;
  updateSetting: (enabled: boolean) => Promise<unknown>;
}

export interface SetPushEnabledInput {
  enabled: boolean;
  /** The OS has never been asked; enabling must ask first. */
  permissionUndetermined: boolean;
}

export type SetPushEnabledOutcome = Outcome<'permission' | 'setting'>;

export async function setPushEnabled(deps: SetPushEnabledDeps, input: SetPushEnabledInput): Promise<SetPushEnabledOutcome> {
  if (input.enabled && input.permissionUndetermined) {
    let granted = false;
    try {
      granted = await deps.requestPermission();
    } catch (error) {
      return { ok: false, failed: 'permission', error, compensated: true };
    }
    if (!granted) {
      // The user said no; the setting is left as it was.
      return { ok: false, failed: 'permission', error: new Error('Push permission was not granted.'), compensated: true };
    }
  }

  try {
    await deps.updateSetting(input.enabled);
  } catch (error) {
    return { ok: false, failed: 'setting', error, compensated: false };
  }

  return { ok: true };
}
