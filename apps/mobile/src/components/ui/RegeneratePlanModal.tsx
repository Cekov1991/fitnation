import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { DEFAULT_TRAINING_STYLES, TRAINING_STYLE_OPTIONS, useEquipmentTypes } from '@fit-nation/shared'
import type { EquipmentTypeResource, RegeneratePlanInput } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'

interface RegeneratePlanModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (params: RegeneratePlanInput) => void
  showWarning: boolean
  isLoading: boolean
}

export function RegeneratePlanModal({
  visible,
  onClose,
  onConfirm,
  showWarning,
  isLoading,
}: RegeneratePlanModalProps) {
  const { colors } = useTheme()
  const { data: equipmentTypes = [] } = useEquipmentTypes()

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([...DEFAULT_TRAINING_STYLES])

  useEffect(() => {
    if (visible) {
      setSelectedEquipment([])
      setSelectedStyles([...DEFAULT_TRAINING_STYLES])
    }
  }, [visible])

  const toggleEquipment = (code: string) => {
    setSelectedEquipment(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const toggleStyle = (code: string) => {
    setSelectedStyles(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleConfirm = () => {
    onConfirm({
      equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      training_styles: selectedStyles.length > 0 ? selectedStyles : [...DEFAULT_TRAINING_STYLES],
    })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Refresh Personalized Plan?
            </Text>

            {equipmentTypes.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Equipment
                </Text>
                <View style={styles.chipRow}>
                  {equipmentTypes.map((eq: EquipmentTypeResource) => {
                    const isSelected = selectedEquipment.includes(eq.code)
                    return (
                      <TouchableOpacity
                        key={eq.code}
                        onPress={() => toggleEquipment(eq.code)}
                        activeOpacity={0.7}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.bgElevated,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? '#fff' : colors.textPrimary },
                          ]}
                        >
                          {eq.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Training Style
              </Text>
              <View style={styles.chipRow}>
                {TRAINING_STYLE_OPTIONS.map(style => {
                  const isSelected = selectedStyles.includes(style.code)
                  return (
                    <TouchableOpacity
                      key={style.code}
                      onPress={() => toggleStyle(style.code)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.bgElevated,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#fff' : colors.textPrimary },
                        ]}
                      >
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {showWarning && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: `${colors.warning}26` },
                ]}
              >
                <AlertTriangle size={16} color={colors.warning} style={styles.warningIcon} />
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Your current plan has completed workouts. Refreshing will create a new plan and
                  you will start from scratch.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.75}
              style={[
                styles.confirmButton,
                {
                  backgroundColor: colors.warning,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLabel}>Refresh Plan</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              activeOpacity={0.6}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})
