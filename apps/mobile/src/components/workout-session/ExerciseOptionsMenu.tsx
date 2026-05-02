import { Modal, View, Text, TouchableOpacity, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, Eye, RefreshCw, Trash2 } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface ExerciseOptionsMenuProps {
  visible: boolean
  onClose: () => void
  onView: () => void
  onSwap: () => void
  onRemove: () => void
  isRemoveLoading?: boolean
  canRemove: boolean
}

export function ExerciseOptionsMenu({
  visible,
  onClose,
  onView,
  onSwap,
  onRemove,
  isRemoveLoading = false,
  canRemove,
}: ExerciseOptionsMenuProps) {
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
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Exercise Options
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

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <MenuButton
                  title="View Exercise"
                  subtitle="See instructions and video"
                  icon={<Eye size={20} color={colors.primary} />}
                  iconBg={`${colors.primary}25`}
                  borderColor={colors.border}
                  bgColor={colors.bgElevated}
                  onPress={onView}
                />
                <MenuButton
                  title="Swap Exercise"
                  subtitle="Replace with another exercise"
                  icon={<RefreshCw size={20} color={colors.secondary} />}
                  iconBg={`${colors.secondary}25`}
                  borderColor={colors.border}
                  bgColor={colors.bgElevated}
                  onPress={onSwap}
                />
                {canRemove && (
                  <MenuButton
                    title={isRemoveLoading ? 'Removing...' : 'Remove Exercise'}
                    subtitle="Delete from workout"
                    icon={<Trash2 size={20} color={colors.error} />}
                    iconBg={`${colors.error}25`}
                    borderColor={`${colors.error}30`}
                    bgColor={`${colors.error}0D`}
                    onPress={onRemove}
                    isDanger
                    isLoading={isRemoveLoading}
                  />
                )}
              </View>

              {/* Cancel */}
              <TouchableOpacity onPress={onClose} activeOpacity={0.6} style={styles.cancelRow}>
                <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

interface MenuButtonProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  borderColor: string
  bgColor: string
  onPress: () => void
  isDanger?: boolean
  isLoading?: boolean
}

function MenuButton({
  title,
  subtitle,
  icon,
  iconBg,
  borderColor,
  bgColor,
  onPress,
  isDanger = false,
  isLoading = false,
}: MenuButtonProps) {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.75}
      style={[
        styles.actionRow,
        { backgroundColor: bgColor, borderColor, opacity: isLoading ? 0.5 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isDanger ? colors.error : colors.primary} />
        ) : (
          icon
        )}
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, { color: isDanger ? colors.error : colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.actionDesc, { color: isDanger ? `${colors.error}B3` : colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
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
    borderWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    borderWidth: 1,
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
  cancelRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})
