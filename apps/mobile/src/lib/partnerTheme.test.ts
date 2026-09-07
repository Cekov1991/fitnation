import { describe, expect, it } from 'vitest'
import type { UserResource } from '@fit-nation/shared'
import { partnerColorOverrides } from './partnerTheme'

// Only the fields the helper reads; the rest of UserResource is irrelevant here.
function user(partner: unknown): UserResource {
  return { id: 1, partner } as unknown as UserResource
}

const identity = (primary_color: string | null, secondary_color: string | null) => ({
  name: 'Partner', slug: 'partner', visual_identity: { primary_color, secondary_color },
})

const partnerA = user(identity('#111111', '#222222'))
const partnerB = user(identity('#333333', null))
const plain = user(null)

describe('partnerColorOverrides', () => {
  it('takes primary and secondary from the Partner', () => {
    expect(partnerColorOverrides(partnerA)).toEqual({ primary: '#111111', secondary: '#222222' })
  })

  it('omits a colour the Partner leaves unset rather than writing null', () => {
    expect(partnerColorOverrides(partnerB)).toEqual({ primary: '#333333' })
  })

  it('is empty for a Partner without a visual identity', () => {
    expect(partnerColorOverrides(user({ name: 'P', slug: 'p', visual_identity: null }))).toEqual({})
  })

  it('is empty for a plain account and for no account', () => {
    expect(partnerColorOverrides(plain)).toEqual({})
    expect(partnerColorOverrides(null)).toEqual({})
  })

  // The two transitions in the spec's acceptance. The theme *replaces* its
  // overrides with this result, so "empty" means the default palette and
  // Partner B's set carries nothing of Partner A's.
  it('resolves Partner A → plain account to the default palette', () => {
    partnerColorOverrides(partnerA)
    expect(partnerColorOverrides(plain)).toEqual({})
  })

  it('resolves Partner A → Partner B to B alone', () => {
    partnerColorOverrides(partnerA)
    expect(partnerColorOverrides(partnerB)).not.toHaveProperty('secondary')
  })
})
