import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { FITNESS_GOAL_OPTIONS } from '@fit-nation/shared'
import type { UpdateProfileInput } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'

type Goal = NonNullable<UpdateProfileInput['fitness_goal']>

/** "What do you want to train for?" — one card per goal, single choice. Headline is the shell's. */
export function GoalSection({ value, onChange }: { value: Goal | undefined; onChange: (v: Goal) => void }) {
  const { colors } = useTheme()
  return (
    <View style={styles.list}>
      {FITNESS_GOAL_OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: selected ? colors.primary : 'transparent' }]}
          >
            <View style={styles.text}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{option.label}</Text>
              <Text style={[styles.desc, { color: selected ? colors.primary : colors.textSecondary }]}>{option.description}</Text>
            </View>
            {selected && (
              <View style={[styles.tick, { backgroundColor: colors.primary }]}>
                <Check size={14} color={colors.textButton} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: RADIUS.row, borderWidth: 2 },
  text: { flex: 1, minWidth: 0 },
  label: { fontSize: 17, fontWeight: '700' },
  desc: { fontSize: 14, marginTop: 3 },
  tick: { width: 24, height: 24, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
})
