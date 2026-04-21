import type { ReactNode } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { GradientText } from '../ui/GradientText'

const SCREEN_HEIGHT = Dimensions.get('window').height
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.90
const HEADER_HEIGHT = 76 // paddingTop 20 + content ~40 + paddingBottom 16

interface ProgressDetailModalProps {
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function ProgressDetailModal({ visible, onClose, title, children }: ProgressDetailModalProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Outer wrapper — fills screen, pushes sheet to bottom */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Sheet — explicit max height so ScrollView can flex inside it */}
        <View
          style={{
            backgroundColor: colors.bgBase,
            maxHeight: SHEET_MAX_HEIGHT,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {/* Fixed header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <GradientText
              style={{ fontSize: 20, fontWeight: '700', flex: 1 }}
              numberOfLines={1}
            >
              {title}
            </GradientText>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 12,
                backgroundColor: colors.bgElevated,
              }}
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable body — explicit maxHeight so it grows with content but caps */}
          <ScrollView
            style={{ maxHeight: SHEET_MAX_HEIGHT - HEADER_HEIGHT }}
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 20 + insets.bottom,
            }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

interface InfoBlockProps {
  children: ReactNode
  style?: object
}

export function InfoBlock({ children, style }: InfoBlockProps) {
  const { colors } = useTheme()
  return (
    <View
      className="rounded-2xl p-4"
      style={[
        {
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

interface PillProps {
  label: string
  color: string
  bgColor: string
  borderColor?: string
}

export function Pill({ label, color, bgColor, borderColor }: PillProps) {
  return (
    <View
      className="self-start px-4 py-2 rounded-full"
      style={{
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor ?? bgColor,
      }}
    >
      <Text className="text-xs font-bold tracking-wide" style={{ color }}>
        {label}
      </Text>
    </View>
  )
}
