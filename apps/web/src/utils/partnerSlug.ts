import { getAuthStorage, PARTNER_SLUG_KEY } from '@fit-nation/shared';
import type { UserResource } from '@fit-nation/shared';

/**
 * Persist the Partner slug for `index.html`, which reads it from localStorage
 * before React loads to pick the Partner's PWA manifest and icon. Nothing in
 * `src/` reads it back — the boot script is the only consumer.
 *
 * The invariant is "storage tracks `user.partner.slug`, or is absent", and this
 * is the one place that owns it (0019). Pass `null` on logout and on any
 * failure that ends the session.
 */
export async function persistPartnerSlug(user: UserResource | null): Promise<void> {
  const storage = getAuthStorage();
  const slug = user?.partner?.slug;
  if (slug) {
    await storage.setItem(PARTNER_SLUG_KEY, slug);
  } else {
    await storage.removeItem(PARTNER_SLUG_KEY);
  }
}
