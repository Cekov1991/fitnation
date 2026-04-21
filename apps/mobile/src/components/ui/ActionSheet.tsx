import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface Action {
  label: string
  onPress: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  actions: Action[]
}

export function ActionSheet({ visible, onClose, title, actions }: ActionSheetProps) {
  const { colors } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: colors.bgSurface }}
          onPress={() => {}}
        >
          {title && (
            <Text
              className="text-sm font-medium text-center mb-4"
              style={{ color: colors.textSecondary }}
            >
              {title}
            </Text>
          )}
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                action.onPress()
                onClose()
              }}
              className="py-4 border-b"
              style={{ borderColor: colors.bgElevated }}
            >
              <Text
                className="text-base text-center font-medium"
                style={{ color: action.destructive ? colors.error : colors.textPrimary }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} className="py-4 mt-1">
            <Text
              className="text-base text-center font-semibold"
              style={{ color: colors.textSecondary }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
