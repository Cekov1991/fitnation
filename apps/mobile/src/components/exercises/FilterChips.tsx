import { ScrollView, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface FilterChipsProps {
  options: { value: string; label: string }[]
  selected: string | null
  onSelect: (value: string | null) => void
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  const { colors } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexShrink: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, gap: 8 }}
    >
      <TouchableOpacity
        onPress={() => onSelect(null)}
        className="px-4 py-2 rounded-full"
        style={{ backgroundColor: !selected ? colors.primary : colors.bgSurface }}
        activeOpacity={0.7}
      >
        <Text
          className="text-sm font-medium"
          style={{ color: !selected ? '#fff' : colors.textSecondary }}
        >
          All
        </Text>
      </TouchableOpacity>

      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onSelect(selected === opt.value ? null : opt.value)}
          className="px-4 py-2 rounded-full"
          style={{
            backgroundColor: selected === opt.value ? colors.primary : colors.bgSurface,
          }}
          activeOpacity={0.7}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: selected === opt.value ? '#fff' : colors.textSecondary }}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}
