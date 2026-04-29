import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
  message?: string
  actions: Action[]
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  actions,
}: ActionSheetProps) {
  const { colors } = useTheme()

  const hasHeader = !!title || !!message

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
            {/* Main card */}
            <View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
              {/* Drag handle */}
              <View
                style={[styles.handle, { backgroundColor: colors.textMuted }]}
              />

              {/* Header (title + message) */}
              {hasHeader && (
                <>
                  <View style={styles.headerSection}>
                    {!!title && (
                      <Text
                        style={[styles.title, { color: colors.textPrimary }]}
                      >
                        {title}
                      </Text>
                    )}
                    {!!message && (
                      <Text
                        style={[
                          styles.message,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {message}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.bgElevated },
                    ]}
                  />
                </>
              )}

              {/* Actions */}
              {actions.map((action, i) => {
                const isLast = i === actions.length - 1
                return (
                  <View key={i}>
                    <TouchableOpacity
                      onPress={() => {
                        action.onPress()
                        onClose()
                      }}
                      activeOpacity={0.6}
                      style={styles.actionRow}
                    >
                      <Text
                        style={[
                          styles.actionLabel,
                          {
                            color: action.destructive
                              ? colors.error
                              : colors.textPrimary,
                            fontWeight: action.destructive ? '600' : '500',
                          },
                        ]}
                      >
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                    {!isLast && (
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: colors.bgElevated },
                        ]}
                      />
                    )}
                  </View>
                )
              })}
            </View>

            {/* Cancel card (separate) */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.6}
              style={[styles.cancelCard, { backgroundColor: colors.bgSurface }]}
            >
              <Text
                style={[styles.cancelLabel, { color: colors.textPrimary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    opacity: 0.4,
    marginBottom: 4,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionRow: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  cancelCard: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
})
