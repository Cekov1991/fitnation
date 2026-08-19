/**
 * Normalise in-progress decimal text from a `decimal-pad` keyboard.
 *
 * On a de/fr/nl keyboard the decimal key emits ',' and `parseFloat('154,5')`
 * silently truncates to 154, so the comma is mapped to a dot. Everything other
 * than digits and dots is dropped, and only the first dot is kept.
 *
 * The returned text is deliberately allowed to be mid-typed (e.g. '154.'), so
 * the caller must keep it as a string until the value is committed.
 */
export function sanitizeDecimalText(raw: string): string {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '')
  const [head, ...rest] = normalized.split('.')
  return rest.length ? `${head}.${rest.join('')}` : head
}

/** Parse sanitised decimal text, returning null for empty/garbage rather than NaN. */
export function parseDecimalText(text: string): number | null {
  const n = Number.parseFloat(text)
  return Number.isFinite(n) ? n : null
}
