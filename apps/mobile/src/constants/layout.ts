/**
 * Layout tokens shared by every screen. A screen that wants a different edge
 * gutter or corner radius is asking for a design change to all of them — make
 * it here. `components/ui/ui-standards.test.ts` fails on literals that bypass
 * these.
 */
export const SCREEN = {
  /** Horizontal gutter of every screen's scrollable content. */
  paddingX: 16,
  /** Space above the header on a stacked screen. */
  paddingTop: 16,
  /** Bottom inset of scroll content when nothing is pinned below it. */
  paddingBottom: 24,
  /** Bottom inset of scroll content when a footer CTA is pinned over it. */
  paddingBottomWithFooter: 120,
} as const

export const RADIUS = {
  /** Inputs, chips, small buttons, thumbnails. */
  control: 12,
  /** List rows, full-width buttons. */
  row: 16,
  /** Summary cards, sheets, dialogs. */
  card: 24,
  pill: 999,
} as const

/** Vertical rhythm between stacked blocks (cards, sections). */
export const STACK_GAP = 12
export const SECTION_GAP = 24
