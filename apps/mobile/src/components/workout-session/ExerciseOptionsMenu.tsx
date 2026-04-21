import { Modal, View, Text, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native'
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.bgSurface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={{ padding: 20 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}
                >
                  Exercise Options
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.75}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: colors.bgElevated,
                  }}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                <MenuButton
                  title="View Exercise"
                  subtitle="See instructions and video"
                  icon={<Eye size={20} color={colors.primary} />}
                  iconBg={`${colors.primary}25`}
                  onPress={onView}
                />
                <MenuButton
                  title="Swap Exercise"
                  subtitle="Replace with another exercise"
                  icon={<RefreshCw size={20} color={colors.secondary} />}
                  iconBg={`${colors.secondary}25`}
                  onPress={onSwap}
                />
                {canRemove && (
                  <MenuButton
                    title={isRemoveLoading ? 'Removing...' : 'Remove Exercise'}
                    subtitle="Delete from workout"
                    icon={<Trash2 size={20} color={colors.error} />}
                    iconBg={`${colors.error}25`}
                    onPress={onRemove}
                    variant="danger"
                    isLoading={isRemoveLoading}
                  />
                )}
              </View>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

interface MenuButtonProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  onPress: () => void
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

function MenuButton({
  title,
  subtitle,
  icon,
  iconBg,
  onPress,
  variant = 'default',
  isLoading = false,
}: MenuButtonProps) {
  const { colors } = useTheme()
  const isDanger = variant === 'danger'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDanger ? `${colors.error}30` : colors.borderSubtle,
        backgroundColor: isDanger ? `${colors.error}0D` : colors.bgElevated,
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isDanger ? colors.error : colors.primary} />
        ) : (
          icon
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: isDanger ? colors.error : colors.textPrimary,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: isDanger ? `${colors.error}B3` : colors.textSecondary,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
