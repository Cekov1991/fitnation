import { useRef, useEffect } from 'react'
import { ScrollView, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface FilterChipsProps {
  options: { value: string; label: string }[]
  selected: string | null
  onSelect: (value: string | null) => void
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  const { colors } = useTheme()
  const scrollRef = useRef<ScrollView>(null)
  const chipXRef = useRef<Record<string, number>>({})

  // Scroll to the selected chip whenever selection changes (covers initial pre-selection too).
  useEffect(() => {
    if (!selected) return
    const x = chipXRef.current[selected]
    if (x != null) {
      scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true })
    }
  }, [selected])

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexShrink: 0, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: 'center' }}
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
          onLayout={e => {
            const x = e.nativeEvent.layout.x
            chipXRef.current[opt.value] = x
            // Guard: if the useEffect ran before this layout was ready, scroll now.
            if (opt.value === selected) {
              scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: false })
            }
          }}
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
