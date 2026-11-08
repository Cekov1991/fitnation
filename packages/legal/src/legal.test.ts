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

/**
 * Ticket #96 (Gym Join spec, user story 14): the Join Prompt reads the device's
 * location — in the foreground only, with permission, solely to find nearby
 * partner gyms — and the coordinates are sent for that one lookup and never
 * stored. The privacy policy must say so, and must no longer claim that
 * precise location is never collected.
 */
describe('the privacy policy covers the nearby-gym location lookup', () => {
  const location = privacyPolicy.sections.find(s => s.id === 'location');
  const text = (blocks: unknown) => JSON.stringify(blocks);

  it('has a #location section stating the lookup is foreground-only, permission-gated and never stored', () => {
    expect(location).toBeDefined();
    const body = text(location!.blocks);
    expect(body).toContain('foreground');
    expect(body).toContain('permission');
    expect(body).toContain('nearby partner gyms');
    expect(body).toMatch(/never stored|not stored/);
  });

  it('states that declining permission disables only this feature', () => {
    const body = text(location!.blocks);
    expect(body).toMatch(/only th(is|at) feature|disables only/);
  });

  it('no longer lists precise location under what is not collected', () => {
    expect(text(privacyPolicy.sections)).not.toContain('Precise location data');
  });
});
