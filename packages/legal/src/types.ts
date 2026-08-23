// Shape of the legal documents in ../content, as emitted by scripts/build.mjs.
// Deliberately a block tree rather than an HTML string: each app renders these
// with its own components, so neither needs dangerouslySetInnerHTML nor a
// shared prose stylesheet, and the two apps can look completely different
// while the words stay identical.

/** A run of inline text. At most one emphasis flag applies. */
export type LegalSpan =
  | { text: string }
  | { text: string; bold: true }
  | { text: string; code: true }
  | { text: string; href: string };

export type LegalBlock =
  | { kind: 'p'; spans: LegalSpan[] }
  /** Sub-heading within a section, e.g. "a. Personal Information". */
  | { kind: 'h3'; spans: LegalSpan[] }
  | { kind: 'ul'; items: LegalSpan[][] };

export interface LegalSection {
  /** Stable anchor target. Do not change: external links may point at it. */
  id: string;
  /** 1-based position, for the numbered table of contents. */
  number: number;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  slug: 'privacy-policy' | 'terms-of-service';
  title: string;
  /** Human-readable, as written in the markdown front matter. */
  lastUpdated: string;
  /** Intro paragraphs shown above the first numbered section. */
  lead: LegalBlock[];
  sections: LegalSection[];
}
