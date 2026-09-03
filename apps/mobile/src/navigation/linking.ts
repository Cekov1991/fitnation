// M5: custom scheme only; universal links are phase two.
//
// Only `dashboard` is sent in phase one (the Inactivity Nudge). The other
// routes cost nothing and keep phase two out of this file. A tap while logged
// out lands on the auth stack and the URL is dropped — by design; no
// "resume after login" yet.
import { Linking } from 'react-native'
import * as Notifications from 'expo-notifications'
import type { LinkingOptions } from '@react-navigation/native'
import type { AppStackParamList } from './types'

export const URL_SCHEME = 'fitnation://'

function urlFromResponse(response: Notifications.NotificationResponse | null | undefined): string | null {
  const url = response?.notification.request.content.data?.url
  return typeof url === 'string' ? url : null
}

export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [URL_SCHEME],
  config: {
    screens: {
      Tabs: {
        screens: { Dashboard: 'dashboard', Progress: 'progress', Plans: 'plans', Profile: 'profile' },
      },
      // Params arrive as strings, matching `{ sessionId: string }`.
      WorkoutSession: 'workout-session/:sessionId',
      SessionDetail: 'session/:sessionId',
      // `{ programId: number }` — parse it, or the screen gets "123".
      ProgramDetail: { path: 'program/:programId', parse: { programId: Number } },
    },
  },
  // Cold start: an OS-delivered URL wins; otherwise the notification the user
  // tapped to launch the app.
  async getInitialURL() {
    const url = await Linking.getInitialURL()
    if (url) return url
    return urlFromResponse(await Notifications.getLastNotificationResponseAsync())
  },
  // Warm: OS URL events plus taps on a notification while running/backgrounded.
  subscribe(listener) {
    const linkingSub = Linking.addEventListener('url', ({ url }) => listener(url))
    const notifSub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = urlFromResponse(r)
      if (url) listener(url)
    })
    return () => {
      linkingSub.remove()
      notifSub.remove()
    }
  },
}
