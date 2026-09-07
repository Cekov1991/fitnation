// R10–R11: once per cold start, after auth resolves and only when the app
// opened straight onto Tabs, check OS notification permission and decide
// whether the explainer sheet is due (at most once every 7 days). Best
// effort: any permission or SecureStore error means "don't show".
//
// Mounted once, in AppNavigator, which renders the sheet above the stack.
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPermissionStatus } from '../lib/notifications'
import {
  permissionSheetVariant,
  readPushPromptLastShownAt,
  shouldShowPermissionSheet,
  type PermissionSheetVariant,
} from '../lib/pushPrompt'

// Module-level so a logout/login within one process does not ask twice.
let ranThisLaunch = false

interface Options {
  // The stack's initial route at mount. Captured on first render: the value
  // recomputes once onboarding refreshes the user, and that launch belongs to
  // onboarding's own sheet.
  initialRoute: string
  // True once the splash overlay is gone, so the sheet does not fight the
  // launch animation.
  ready: boolean
}

export function useLaunchPermissionCheck({ initialRoute, ready }: Options) {
  const routeAtLaunch = useRef(initialRoute).current
  const [variant, setVariant] = useState<PermissionSheetVariant | null>(null)

  useEffect(() => {
    if (!ready || ranThisLaunch || routeAtLaunch !== 'Tabs') return
    ranThisLaunch = true
    let cancelled = false
    ;(async () => {
      try {
        const [status, lastShownAt] = await Promise.all([
          getPermissionStatus(),
          readPushPromptLastShownAt(),
        ])
        if (cancelled) return
        if (shouldShowPermissionSheet(status, lastShownAt, Date.now())) {
          setVariant(permissionSheetVariant(status))
        }
      } catch (e) {
        console.warn('[push]', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, routeAtLaunch])

  const onClose = useCallback(() => setVariant(null), [])

  return { visible: variant !== null, variant: variant ?? 'ask', onClose }
}
