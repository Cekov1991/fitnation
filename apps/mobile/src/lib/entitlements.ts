/**
 * The entitlement identifiers as RevenueCat and `GET /api/user` spell them.
 * Kept free of imports so navigation code and its tests can read them without
 * pulling in the purchases SDK.
 */
export const Entitlement = { AppAccess: 'app_access' } as const
export type Entitlement = (typeof Entitlement)[keyof typeof Entitlement]
