import { retryOnce, type Outcome } from './outcome';

/**
 * Delete the account on the server, then sign out locally. If the sign-out
 * throws after the delete succeeded, the account is gone while the app still
 * holds a token and a user — so the sign-out is retried, and the outcome says
 * the account is deleted either way, so the caller never shows an error for an
 * account that no longer exists.
 */
export interface DeleteAccountDeps {
  deleteAccount: (password?: string) => Promise<unknown>;
  signOut: () => Promise<unknown>;
}

export type DeleteAccountOutcome = Outcome<'delete' | 'signOut'>;

export async function deleteAccountAndSignOut(deps: DeleteAccountDeps, input: { password?: string }): Promise<DeleteAccountOutcome> {
  try {
    await deps.deleteAccount(input.password);
  } catch (error) {
    return { ok: false, failed: 'delete', error, compensated: true };
  }

  try {
    await retryOnce(() => deps.signOut());
  } catch (error) {
    return { ok: false, failed: 'signOut', error, compensated: false };
  }

  return { ok: true };
}
