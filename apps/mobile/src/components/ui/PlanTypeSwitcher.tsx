import { View, Text, TouchableOpacity } from 'react-native'
import { Flag, List, type LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

export type PlanType = 'customPlans' | 'programs'

interface Tab {
  id: PlanType
  label: string
  icon: LucideIcon
}

interface PlanTypeSwitcherProps {
  activeType: PlanType
  onTypeChange: (type: PlanType) => void
  showPrograms?: boolean
}

/** Mirrors apps/web/src/components/plans/PlanTypeSwitcher.tsx */
export function PlanTypeSwitcher({
  activeType,
  onTypeChange,
  showPrograms = true,
}: PlanTypeSwitcherProps) {
  const { colors } = useTheme()

  const tabs: Tab[] = showPrograms
    ? [
        { id: 'programs', label: 'My Program', icon: Flag },
        { id: 'customPlans', label: 'Custom Plans', icon: List },
      ]
    : [{ id: 'customPlans', label: 'Custom Plans', icon: List }]

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 9999,
        padding: 4,
        backgroundColor: colors.segmentTrack,
        marginBottom: 24,
      }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeType === id
        return (
          <TouchableOpacity
            key={id}
            activeOpacity={0.8}
            onPress={() => onTypeChange(id)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 9999,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: active ? colors.segmentActive : 'transparent',
              // mimic web's segment-active-shadow
              shadowColor: '#0F172A',
              shadowOpacity: active ? 0.06 : 0,
              shadowRadius: active ? 2 : 0,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}
          >
            <Icon
              size={16}
              strokeWidth={2}
              color={active ? colors.textPrimary : colors.textSecondary}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: active ? colors.textPrimary : colors.textSecondary,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
