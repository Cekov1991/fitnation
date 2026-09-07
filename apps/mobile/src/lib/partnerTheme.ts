import type { UserResource } from '@fit-nation/shared'
import type { AppColors } from '../constants/theme'

/**
 * The theme overrides a signed-in user's Partner contributes — and, just as
 * deliberately, the empty set for a user without one. Spec 0017: the previous
 * Partner's colours used to survive a logout because a partnerless user
 * applied nothing, rather than applying "nothing".
 *
 * Mirrors web: only `primary` and `secondary` are Partner-owned. Background,
 * card, text and border stay on the app palette so mobile surfaces match the
 * web light theme.
 */
export function partnerColorOverrides(user: UserResource | null): Partial<AppColors> {
  const identity = user?.partner?.visual_identity
  return {
    ...(identity?.primary_color ? { primary: identity.primary_color } : {}),
    ...(identity?.secondary_color ? { secondary: identity.secondary_color } : {}),
  }
}
