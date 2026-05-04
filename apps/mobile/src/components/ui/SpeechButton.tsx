import { useEffect, useRef, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import * as Speech from 'expo-speech'
import { Volume2, VolumeX } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface SpeechButtonProps {
  text: string | undefined | null
  size?: number
}

export function SpeechButton({ text, size = 20 }: SpeechButtonProps) {
  const { colors } = useTheme()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speakingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (speakingRef.current) {
        Speech.stop()
      }
    }
  }, [])

  const handlePress = async () => {
    if (isSpeaking) {
      await Speech.stop()
      speakingRef.current = false
      setIsSpeaking(false)
      return
    }

    if (!text) return

    speakingRef.current = true
    setIsSpeaking(true)

    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => {
        speakingRef.current = false
        setIsSpeaking(false)
      },
      onError: () => {
        speakingRef.current = false
        setIsSpeaking(false)
      },
    })
  }

  const Icon = isSpeaking ? VolumeX : Volume2

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!text}
      activeOpacity={0.7}
      style={{
        padding: 6,
        borderRadius: 999,
        backgroundColor: isSpeaking
          ? `${colors.primary}20`
          : `${colors.textPrimary}0D`,
        opacity: text ? 1 : 0.3,
      }}
    >
      <Icon
        size={size}
        color={isSpeaking ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>
  )
}
