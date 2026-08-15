import type { LinkingOptions } from '@react-navigation/native'
import type { AppStackParamList, AuthStackParamList } from '../navigation/types'

// Paths and hosts here must stay in sync with:
//  - android.intentFilters + ios.associatedDomains in apps/mobile/app.json
//  - apps/web/public/.well-known/ (assetlinks.json + apple-app-site-association)
//  - the backend VerifyEmail notification, which points the email at the web app host
type LinkableParamList = Pick<AuthStackParamList, 'ResetPassword'> &
  Pick<AppStackParamList, 'VerifyEmailLink'>

export const linking: LinkingOptions<LinkableParamList> = {
  prefixes: ['https://app.fitnation.mk', 'fitnation://', 'com.fitnation.app://'],
  config: {
    screens: {
      // Auth stack — mounted while logged out. token/email arrive as query params.
      ResetPassword: 'reset-password',
      // App stack — mounted while logged in. expires/signature arrive as query
      // params and land in route.params automatically.
      VerifyEmailLink: 'verify-email/:id/:hash',
    },
  },
}
