import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Check, X } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'

export interface OptionSheetOption<T> {
  value: T
  label: string
  detail?: string
}

interface OptionSheetProps<T> {
  visible: boolean
  onClose: () => void
  title: string
  options: ReadonlyArray<OptionSheetOption<T>>
  /** The current value (single choice) or values (multi). */
  selected: T | T[] | null
  /** Single choice: the pick, and the sheet closes. Multi: one value to toggle; the sheet stays open until Done. */
  onSelect: (value: T) => void
  multi?: boolean
}

/**
 * A picker for one setting: a bottom card listing the options with a check on
 * the current one(s). A native Modal, so it also sits above a bottom sheet.
 */
export function OptionSheet<T extends string | number>({
  visible,
  onClose,
  title,
  options,
  selected,
  onSelect,
  multi = false,
}: OptionSheetProps<T>) {
  const { colors } = useTheme()
  const selectedValues: T[] = Array.isArray(selected) ? selected : selected == null ? [] : [selected]

  const handlePress = (value: T) => {
    if (multi) {
      onSelect(value)
      return
    }
    onSelect(value)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView edges={['bottom']}>
          <Pressable onPress={() => {}} style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.closeBtn, { backgroundColor: withAlpha(colors.textPrimary, 0.06) }]}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView bounces={false} style={styles.list} contentContainerStyle={styles.listContent}>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      onPress={() => handlePress(option.value)}
                      activeOpacity={0.7}
                      accessibilityRole={multi ? 'checkbox' : 'radio'}
                      accessibilityState={{ checked: isSelected }}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected ? withAlpha(colors.primary, 0.1) : withAlpha(colors.textPrimary, 0.04),
                          borderColor: isSelected ? withAlpha(colors.primary, 0.4) : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.optionText}>
                        <Text style={[styles.optionLabel, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                          {option.label}
                        </Text>
                        {!!option.detail && (
                          <Text style={[styles.optionDetail, { color: colors.textSecondary }]}>{option.detail}</Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.checkWrap,
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {isSelected && <Check size={14} color={colors.textButton} strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.footerBtn, multi && { backgroundColor: colors.primary, marginHorizontal: 12, borderRadius: 14 }]}
              >
                <Text style={[styles.footerLabel, { color: multi ? colors.textButton : colors.textSecondary }]}>
                  {multi ? 'Done' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  container: { paddingHorizontal: 12, paddingBottom: 8 },
  card: { borderRadius: 20, borderWidth: 1, paddingTop: 8, paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 12 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  list: { maxHeight: 520 },
  listContent: { paddingHorizontal: 12, gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDetail: { fontSize: 12, marginTop: 2 },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  footerLabel: { fontSize: 15, fontWeight: '600' },
})
