import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { GradientText } from '../ui/GradientText'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface ProgressDetailModalProps {
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function ProgressDetailModal({ visible, onClose, title, children }: ProgressDetailModalProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [isModalVisible, setIsModalVisible] = useState(visible)
  const slideAnim = useRef(new Animated.Value(visible ? 0 : SCREEN_WIDTH)).current

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setIsModalVisible(false))
    }
  }, [visible, slideAnim])

  return (
    <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.bgBase,
          transform: [{ translateX: slideAnim }],
        }}
      >
        {/* Fixed header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
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

        {/* Scrollable body */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 20 + insets.bottom,
          }}
        >
          {children}
        </ScrollView>
      </Animated.View>
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
