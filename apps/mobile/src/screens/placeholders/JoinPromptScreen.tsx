import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { MapPin } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { failureOf, partnersApi, withAlpha, type NearbyPartnerResource } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useEntitlements, Entitlement } from '../../hooks/useEntitlements'
import { entryRoute } from '../../navigation/gate'
import { Button } from '../../components/ui/Button'
import { JoinGymSheet, type JoinPromptDismissalKind } from '../../components/partners/JoinGymSheet'
import { pickNearestPartner, shouldRunJoinPrompt, type LocationPermissionStatus } from '../../lib/joinPrompt'
import { markJoinPromptAsked, wasJoinPromptAsked } from '../../lib/joinPromptSession'
import { markJoinPromptChecked } from '../../lib/joinPromptThrottle'
import { getLocationFix } from '../../lib/locationFix'
import { showToast } from '../../lib/toast'
import { RADIUS, SCREEN, STACK_GAP } from '../../constants/layout'
import type { AppScreenProps } from '../../navigation/types'

const RATIONALE = { tile: 64, icon: 30 } as const

// 'deciding' renders nothing — the step is invisible until it knows it should
// run. 'rationale' asks for the location in context; 'locating' is the one fix
// plus the nearby call; 'offer' is the bottom sheet.
type Phase = 'deciding' | 'rationale' | 'locating' | 'offer'

/**
 * expo-location's enum, folded to the module's literals. Any earlier denial
 * counts as 'denied' — even Android's soft one with canAskAgain still true —
 * because the spec wants the step invisible for someone who already said no,
 * not re-asked every session.
 */
function permissionStatusOf(permission: Location.LocationPermissionResponse): LocationPermissionStatus {
  if (permission.granted) return 'granted'
  return permission.status === Location.PermissionStatus.UNDETERMINED ? 'undetermined' : 'denied'
}

/**
 * The Join Prompt step (ticket #94, GLOSSARY "Join Prompt"): a dedicated,
 * skippable moment between registration and Onboarding. It asks for the
 * while-in-use location permission with a "find your gym" rationale, takes one
 * fix, and offers the nearest Partner in a bottom sheet. Whenever anything
 * says no — rules (lib/joinPrompt.ts), permission, location, an empty nearby
 * answer, a 403 on the join — it hands over to Onboarding as if it never
 * existed. Dismissals post their kind to `/join-prompt/dismissals` (#95), and
 * the check stamps the throttle the foreground re-check shares.
 */
export function JoinPromptScreen({ navigation }: AppScreenProps<'JoinPrompt'>) {
  const { user, refreshUser, setUser } = useAuth()
  const { colors } = useTheme()
  const { has } = useEntitlements()
  const queryClient = useQueryClient()

  const [phase, setPhase] = useState<Phase>('deciding')
  const [partner, setPartner] = useState<NearbyPartnerResource | null>(null)
  const [joining, setJoining] = useState(false)
  // The step leaves exactly once, however many async branches try.
  const leftRef = useRef(false)

  const continueToOnboarding = useCallback(() => {
    if (leftRef.current) return
    leftRef.current = true
    // Through the gate, like every hand-over: with the offer over, this is
    // Onboarding for anyone who can reach this screen.
    navigation.replace(entryRoute(user, has(Entitlement.AppAccess)))
  }, [navigation, user, has])

  const locate = useCallback(async () => {
    setPhase('locating')
    // The step's check stamps the shared throttle (#95), so the foreground
    // re-check stays quiet for the hour after registration.
    if (user) void markJoinPromptChecked(user.id)
    try {
      const fix = await getLocationFix()
      if (leftRef.current) return
      const { data } = await partnersApi.getNearby(fix.coords.latitude, fix.coords.longitude)
      if (leftRef.current) return
      const nearest = pickNearestPartner(data)
      if (!nearest) {
        // [] is the server's "no gym here / not eligible" — no prompt, no error.
        continueToOnboarding()
        return
      }
      setPartner(nearest)
      setPhase('offer')
    } catch {
      // No fix, no network, a 422, the throttle: the step stays invisible.
      continueToOnboarding()
    }
  }, [continueToOnboarding, user])

  // Decide once, on arrival: the pure rules plus the real permission state.
  useEffect(() => {
    let cancelled = false
    async function decide() {
      const permission = await Location.getForegroundPermissionsAsync().catch(() => null)
      if (cancelled || leftRef.current) return
      const runs =
        user != null &&
        permission != null &&
        shouldRunJoinPrompt({
          userPartnerId: user.partner?.id ?? null,
          alreadyAsked: wasJoinPromptAsked(user.id),
          permissionStatus: permissionStatusOf(permission),
        })
      if (!runs || user == null) {
        continueToOnboarding()
        return
      }
      markJoinPromptAsked(user.id)
      if (permission.granted) void locate()
      else setPhase('rationale')
    }
    void decide()
    return () => {
      cancelled = true
    }
    // Once on mount: the inputs are fixed the moment the step is entered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShareLocation = async () => {
    if (phase !== 'rationale') return
    const permission = await Location.requestForegroundPermissionsAsync().catch(() => null)
    if (leftRef.current) return
    if (permission?.granted) void locate()
    else continueToOnboarding() // denied on the OS prompt: the step ends silently
  }

  const handleJoin = async () => {
    if (!partner || joining) return
    setJoining(true)
    try {
      const joined = await partnersApi.join(partner.id)
      // The Gym Join changes the partner, and with it branding and the program
      // library — refetch the profile so the identity visibly switches before
      // Onboarding generates the welcome program. The join already echoed the
      // full user, so a failed refetch falls back to that payload.
      try {
        await refreshUser()
      } catch {
        setUser(joined.user)
      }
      queryClient.invalidateQueries()
      continueToOnboarding()
    } catch (error) {
      const failure = failureOf(error)
      if (failure.status === 403) {
        // The server declined the Gym Join (one-way rule, inactive, disabled):
        // a verdict, not a user-facing error — continue as if never offered.
        continueToOnboarding()
        return
      }
      showToast('Could not join right now. Please try again.', 'error')
      setJoining(false)
    }
  }

  const handleDismiss = (kind: JoinPromptDismissalKind) => {
    // Fire-and-forget (#95): the server's dismissal filter is the source of
    // truth, and nearby simply offers the Partner again if this write is lost.
    if (partner) void partnersApi.dismissJoinPrompt(partner.id, kind).catch(() => {})
    continueToOnboarding()
  }

  const busy = phase === 'locating' || phase === 'offer'

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
      {phase !== 'deciding' && (
        <>
          <View style={styles.body}>
            <View style={[styles.tile, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
              <MapPin size={RATIONALE.icon} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Find your gym</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              Training at a partner gym? Share your location once and we'll check — joining unlocks your gym's
              programs and member benefits.
            </Text>
          </View>
          <View style={styles.footer}>
            <Button label="Share Location" loading={busy} onPress={handleShareLocation} />
            <Button label="Skip" variant="ghost" size="sm" disabled={busy} onPress={continueToOnboarding} style={styles.skip} />
          </View>
        </>
      )}
      <JoinGymSheet
        visible={phase === 'offer' && partner !== null}
        partnerName={partner?.name ?? ''}
        benefits={partner?.benefits ?? []}
        joining={joining}
        onJoin={handleJoin}
        onDismiss={handleDismiss}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: SCREEN.paddingX },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tile: {
    width: RATIONALE.tile,
    height: RATIONALE.tile,
    borderRadius: RADIUS.row,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16 },
  footer: { paddingBottom: SCREEN.paddingBottom },
  skip: { marginTop: STACK_GAP },
})
