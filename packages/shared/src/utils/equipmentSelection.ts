/**
 * The stored Equipment Selection narrowed to the EquipmentTypes a picker offers.
 * Codes the list does not contain (e.g. not in the Bodybuilding list) are
 * dropped; null/undefined (Full gym) gives an empty selection.
 */
export function selectableEquipment(
  stored: readonly string[] | null | undefined,
  available: ReadonlyArray<{ code: string }>,
): string[] {
  if (!stored || stored.length === 0) return [];
  const codes = new Set(available.map((eq) => eq.code));
  return stored.filter((code) => codes.has(code));
}

/** An empty selection means Full gym, stored as null. */
export function equipmentToStore(selected: readonly string[]): string[] | null {
  return selected.length > 0 ? [...selected] : null;
}

/**
 * What a refresh sheet saves on confirm. Until the sheet has seeded its
 * selection (the EquipmentType list had not loaded), the member has not seen
 * the stored selection, so it is passed through unchanged rather than wiped
 * to Full gym by an empty, never-seeded selection.
 */
export function equipmentToSave(
  stored: readonly string[] | null | undefined,
  seeded: boolean,
  selected: readonly string[],
): string[] | null {
  if (seeded) return equipmentToStore(selected);
  return stored && stored.length > 0 ? [...stored] : null;
}

/** Equality of two selections as sets, treating null/undefined as empty. */
export function sameEquipmentSelection(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined,
): boolean {
  const x = new Set(a ?? []);
  const y = new Set(b ?? []);
  return x.size === y.size && [...x].every((code) => y.has(code));
}
