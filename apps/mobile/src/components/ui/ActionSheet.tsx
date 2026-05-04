import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, type LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

export interface Action {
  label: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  onPress: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  actions: Action[]
}

export function ActionSheet({
  visible,
  onClose,
  title,
  actions,
}: ActionSheetProps) {
  const { colors } = useTheme()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView edges={['bottom']}>
          <Pressable onPress={() => {}} style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border }]}>
              {/* Header row — title left, X button right */}
              {!!title && (
                <View style={styles.headerRow}>
                  <Text
                    style={[styles.title, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[styles.closeBtn, { backgroundColor: colors.bgElevated }]}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Action rows */}
              <View style={styles.actionsContainer}>
                {actions.map((action, i) => {
                  const Icon = action.icon
                  const iconBg = action.iconColor
                    ? `${action.iconColor}22`
                    : action.destructive
                      ? `${colors.error}22`
                      : `${colors.primary}22`
                  const iconColor = action.iconColor
                    ? action.iconColor
                    : action.destructive
                      ? colors.error
                      : colors.primary

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        action.onPress()
                        onClose()
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.actionRow,
                        {
                          backgroundColor: colors.bgElevated,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {Icon && (
                        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                          <Icon size={20} color={iconColor} />
                        </View>
                      )}
                      <View style={styles.actionText}>
                        <Text
                          style={[
                            styles.actionLabel,
                            {
                              color: action.destructive ? colors.error : colors.textPrimary,
                            },
                          ]}
                        >
                          {action.label}
                        </Text>
                        {!!action.description && (
                          <Text
                            style={[styles.actionDesc, { color: colors.textSecondary }]}
                          >
                            {action.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Cancel row inside the card */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.6}
                style={styles.cancelRow}
              >
                <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>
                  Cancel
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 2,
  },

  // Cancel
  cancelRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})
