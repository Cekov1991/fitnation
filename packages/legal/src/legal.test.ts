import { describe, expect, it } from 'vitest';
import { legalDocuments, privacyPolicy, siblingOf, termsOfService } from './index';

/**
 * Spec 0021. Contact, copyright, description and canonical URL are legally
 * relevant text; they live in the markdown front matter and nowhere else, and
 * the two renderers read them from here. The canonical host is
 * joinfitnation.com (decided 2026-09-08); mobile links there too.
 */
describe('legal documents carry their own metadata', () => {
  it.each(legalDocuments)('$slug is canonical on joinfitnation.com at its path', doc => {
    expect(doc.canonicalUrl).toBe(`https://joinfitnation.com${doc.path}`);
    expect(doc.description.length).toBeGreaterThan(20);
    expect(doc.copyrightHolder).toBe('Stefan Cekov');
  });

  it('both documents name the same contact address, and their text agrees', () => {
    expect(privacyPolicy.contactEmail).toBe(termsOfService.contactEmail);
    for (const doc of legalDocuments) {
      const text = JSON.stringify(doc.sections);
      expect(text).toContain(doc.contactEmail);
    }
  });

  it('derives the sibling link instead of taking it by hand', () => {
    expect(siblingOf(privacyPolicy)).toBe(termsOfService);
    expect(siblingOf(termsOfService)).toBe(privacyPolicy);
    expect(siblingOf(privacyPolicy).path).toBe('/terms');
  });
});
