export type {
  LegalBlock,
  LegalDocument,
  LegalSection,
  LegalSpan,
} from './types';
import type { LegalDocument } from './types';
import { privacyPolicy } from './generated/privacy-policy';
import { termsOfService } from './generated/terms-of-service';

export { privacyPolicy, termsOfService };

/** Every legal document, so consumers can derive rather than hardcode. */
export const legalDocuments: readonly LegalDocument[] = [privacyPolicy, termsOfService];

/** The other document — the "see also" link, derived instead of passed in by hand. */
export function siblingOf(doc: LegalDocument): LegalDocument {
  const sibling = legalDocuments.find(d => d.slug !== doc.slug);
  if (!sibling) throw new Error(`No sibling document for ${doc.slug}`);
  return sibling;
}
