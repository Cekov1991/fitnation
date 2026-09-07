/**
 * Named orchestrations for the multi-write invariants (spec 0026).
 *
 * Several domain actions are two or more writes that only mean something
 * together, and each was sequenced inside a component where no test could
 * reach it and one `catch` could not say which write failed. Every module in
 * this directory owns one such action end to end: the order, what to retry,
 * what to compensate, and a result that names the step that failed so the
 * caller can tell the user something true.
 *
 * They take their writes as plain functions — a hook's `mutateAsync`, an API
 * call, a fake — so both apps share them and a test can reject the second
 * write, which is the assertion that used to be impossible to write.
 */

export type Outcome<Step extends string, Extra = object> =
  | ({ ok: true } & Extra)
  | ({
      ok: false;
      /** The write that failed; everything before it succeeded. */
      failed: Step;
      error: unknown;
      /** True when the earlier writes were undone or the state was resynced. */
      compensated: boolean;
    } & Partial<Extra>);

/** Run `fn`; on rejection run it once more. Resolves with the first success, rejects with the last error. */
export async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}
