import { useEffect, useRef, useState } from 'react'
import { Animated, Modal, StyleSheet, Text, View } from 'react-native'
import { labelFor, withAlpha, TRAINING_DAYS_OPTIONS } from '@fit-nation/shared'
import { Check } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

/**
 * The plan-building moment, shared by onboarding's last step and the dashboard's
 * plan refresh. It is a full-bleed moment rather than a themed surface: the navy
 * holds in both colour schemes, and only the ticks take the partner colour.
 */
export const PLAN_BUILD_BG = '#12233E'
const TEXT = '#FFFFFF'
const TEXT_DIM = '#8C9BB3'

// The generator writes a fixed five-week program
// (backend WelcomePlanGenerationService::DURATION_WEEKS).
const PLAN_WEEKS = 5
const ROW_COUNT = 4

/**
 * 'preparing' — the request has not started (onboarding saves the profile first).
 * 'building'  — the plan request is in flight.
 * 'done'      — every row ticked.
 */
export type PlanBuildStage = 'preparing' | 'building' | 'done'

export interface PlanBuildingContentProps {
  stage: PlanBuildStage
  /** 'Building your plan' on first run; 'Refreshing your plan' on a refresh. */
  title: string
  subtitle: string
  /** Named in the first row, so the list reads as this user's plan. */
  goalLabel: string
  daysPerWeek: number
}

export function PlanBuildingContent({ stage, title, subtitle, goalLabel, daysPerWeek }: PlanBuildingContentProps) {
  const { colors } = useTheme()

  const rows = [
    `Matching exercises to ${goalLabel}`,
    `Splitting ${labelFor(TRAINING_DAYS_OPTIONS, daysPerWeek)} across the week`,
    'Setting starting weights',
    `Scheduling ${PLAN_WEEKS} weeks of progression`,
  ]

  // Only the ends of this list are real: the first row ticks when the request
  // starts, the last when it returns. The two in between are the one opaque
  // request, so they tick on a timer — capped below the final row so the list
  // never claims to be finished before the plan exists.
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (stage === 'done') { setDone(ROW_COUNT); return }
    if (stage === 'preparing') { setDone(0); return }
    setDone(1)
    const timers = [
      setTimeout(() => setDone(2), 1100),
      setTimeout(() => setDone(3), 2400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [stage])

  const progress = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(progress, {
      toValue: done / ROW_COUNT,
      duration: 400,
      useNativeDriver: false,
    }).start()
  }, [done, progress])

  return (
    <View style={styles.body}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.rows}>
        {rows.map((row, i) => {
          const isDone = i < done
          const isActive = i === done
          return (
            <View key={row} style={styles.row}>
              <View
                style={[
                  styles.tick,
                  isDone
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { borderColor: isActive ? colors.primary : withAlpha(TEXT, 0.25) },
                ]}
              >
                {isDone && <Check size={13} color={colors.textButton} strokeWidth={3} />}
              </View>
              <Text style={[styles.rowText, { color: isDone || isActive ? TEXT : TEXT_DIM }]}>
                {row}
              </Text>
            </View>
          )
        })}
      </View>

      <View style={[styles.track, { backgroundColor: withAlpha(TEXT, 0.15) }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </View>
  )
}

interface PlanGeneratingOverlayProps extends PlanBuildingContentProps {
  visible: boolean
}

/** The same moment over an existing screen — the dashboard's plan refresh. */
export function PlanGeneratingOverlay({ visible, ...contentProps }: PlanGeneratingOverlayProps) {
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: PLAN_BUILD_BG }]}>
        <PlanBuildingContent {...contentProps} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34, color: TEXT },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: 24, lineHeight: 21, color: TEXT_DIM },
  rows: { gap: 18, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tick: { width: 26, height: 26, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '600' },
  track: { height: 4, borderRadius: 999, marginTop: 36, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 999 },
})
