import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import type { NavigationContainerRef } from '@react-navigation/native'
import * as Location from 'expo-location'
import { useQueryClient } from '@tanstack/react-query'
import { failureOf, partnersApi, type JoinPromptDismissalKind, type NearbyPartnerResource } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { canPresentJoinPromptOver, pickNearestPartner, shouldCheckOnForeground } from '../../lib/joinPrompt'
import { markJoinPromptChecked, readJoinPromptLastCheckedAt } from '../../lib/joinPromptThrottle'
import { getLocationFix } from '../../lib/locationFix'
import { showToast } from '../../lib/toast'
import type { AppStackParamList } from '../../navigation/types'
import { JoinGymSheet } from './JoinGymSheet'

interface Props {
  // The EntitlementWatcher pattern: the container ref, to read the focused
  // top-level stack route — the sheet presents only over Tabs.
  navRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null>
  // True once the splash overlay is gone (RootNavigator), so the cold-start
  // check neither races the navigator mounting nor fights the launch animation.
  ready: boolean
}

/** The AppNavigator stack route that currently has focus, undefined before the container is ready. */
function focusedStackRoute(nav: NavigationContainerRef<AppStackParamList> | null): string | undefined {
  if (!nav?.isReady()) return undefined
  const state = nav.getRootState()
  return state?.routes[state.index]?.name
}

/**
 * The foreground re-check (ticket #95, GLOSSARY "Join Prompt"): whenever the
 * app comes to the foreground — the cold start included — an eligible House
 * customer whose location permission is already granted gets a silent location
 * fix + nearby call, at most once per hour, and a non-empty answer presents
 * the Join Prompt sheet with the nearest Partner. This is the "register at
 * home, walk into the gym three days later" moment. It never asks for the
 * permission (that was the post-registration step's job) and never covers
 * anything but the main tab container.
 *
 * Mounted once, beside EntitlementWatcher in RootNavigator; the sheet is a
 * Modal, so it renders above whatever Tabs is showing.
 */
export function ForegroundJoinPrompt({ navRef, ready }: Props) {
  const { user, refreshUser, setUser } = useAuth()
  const queryClient = useQueryClient()

  const [partner, setPartner] = useState<NearbyPartnerResource | null>(null)
  const [joining, setJoining] = useState(false)
  const inFlight = useRef(false)

  // The check reads its inputs at call time through refs so the one AppState
  // subscription below never has to be torn down and re-made per render.
  const userRef = useRef(user)
  userRef.current = user
  const partnerRef = useRef(partner)
  partnerRef.current = partner

  const runCheckRef = useRef(async () => {})
  runCheckRef.current = async () => {
    const u = userRef.current
    if (inFlight.current || partnerRef.current !== null || u == null) return
    if (!canPresentJoinPromptOver(focusedStackRoute(navRef.current))) return
    inFlight.current = true
    try {
      // The re-check never prompts for permission — it only reads it.
      const permission = await Location.getForegroundPermissionsAsync()
      const lastCheckedAt = await readJoinPromptLastCheckedAt(u.id)
      const due = shouldCheckOnForeground({
        userPartnerId: u.partner?.id ?? null,
        permissionStatus: permission.granted ? 'granted' : 'denied',
        lastCheckedAt,
        now: Date.now(),
      })
      if (!due) return
      // Stamped when a check starts, not when it succeeds: the throttle is a
      // courtesy against hammering, so a failed fix must not retry every
      // foreground. The server's dismissal filter is the real gate.
      await markJoinPromptChecked(u.id)
      const fix = await getLocationFix()
      const { data } = await partnersApi.getNearby(fix.coords.latitude, fix.coords.longitude)
      const nearest = pickNearestPartner(data)
      // Re-read the route: the person may have started a workout meanwhile.
      if (nearest && canPresentJoinPromptOver(focusedStackRoute(navRef.current))) {
        setPartner(nearest)
      }
    } catch {
      // No permission read, no store, no fix, no network: silence — the next
      // eligible foreground simply checks again.
    } finally {
      inFlight.current = false
    }
  }

  useEffect(() => {
    if (!ready) return
    // AppState is already 'active' on mount — this is the cold-start check.
    void runCheckRef.current()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runCheckRef.current()
    })
    return () => sub.remove()
  }, [ready])

  const handleDismiss = (kind: JoinPromptDismissalKind) => {
    const dismissed = partner
    setPartner(null)
    // Fire-and-forget: the server's filter is the source of truth, and nearby
    // simply offers the Partner again next time if this write was lost.
    if (dismissed) void partnersApi.dismissJoinPrompt(dismissed.id, kind).catch(() => {})
  }

  const handleJoin = async () => {
    if (!partner || joining) return
    setJoining(true)
    try {
      const joined = await partnersApi.join(partner.id)
      // The Gym Join switches partner, branding and program library — refetch
      // the profile so the identity visibly changes under the closing sheet.
      try {
        await refreshUser()
      } catch {
        setUser(joined.user)
      }
      queryClient.invalidateQueries()
      showToast(`Welcome to ${partner.name}!`, 'success')
      setPartner(null)
    } catch (error) {
      const failure = failureOf(error)
      if (failure.status === 403) {
        // The server declined the Gym Join (one-way rule, inactive, disabled):
        // a verdict, not a user-facing error — the offer quietly withdraws.
        setPartner(null)
        return
      }
      showToast('Could not join right now. Please try again.', 'error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <JoinGymSheet
      visible={partner !== null}
      partnerName={partner?.name ?? ''}
      benefits={partner?.benefits ?? []}
      joining={joining}
      onJoin={handleJoin}
      onDismiss={handleDismiss}
    />
  )
}
