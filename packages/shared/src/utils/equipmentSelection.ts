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

/** Order-insensitive equality of two selections, treating null/undefined as empty. */
export function sameEquipmentSelection(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined,
): boolean {
  const x = a ?? [];
  const y = b ?? [];
  return x.length === y.length && x.every((code) => y.includes(code));
}
