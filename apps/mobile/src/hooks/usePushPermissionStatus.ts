import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { getPermissionStatus, type PermissionStatus } from '../lib/notifications'

// OS permission state, re-read on foreground so a trip to Settings shows up.
// `null` until the first read resolves.
export function usePushPermissionStatus() {
  const [status, setStatus] = useState<PermissionStatus | null>(null)

  const refresh = useCallback(async () => {
    setStatus(await getPermissionStatus())
  }, [])

  useEffect(() => {
    refresh()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh()
    })
    return () => sub.remove()
  }, [refresh])

  return { status, refresh }
}
