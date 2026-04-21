import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface SetEditCardProps {
  setNumber: number
  weight: string
  reps: string
  onWeightChange: (v: string) => void
  onRepsChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  allowWeightLogging: boolean
}

export function SetEditCard({
  setNumber,
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  onSave,
  onCancel,
  allowWeightLogging,
}: SetEditCardProps) {
  return (
    <LinearGradient
      colors={['#ea580c', '#f97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 24,
        padding: 20,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: 16,
        }}
      >
        Edit Set {setNumber}
      </Text>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {allowWeightLogging && (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: 8,
              }}
            >
              Weight
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <TextInput
                style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', padding: 0 }}
                value={weight}
                onChangeText={onWeightChange}
                keyboardType="decimal-pad"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                kg
              </Text>
            </View>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 8,
            }}
          >
            Reps
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <TextInput
              style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', padding: 0 }}
              value={reps}
              onChangeText={onRepsChange}
              keyboardType="number-pad"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <Text
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: '600',
                marginLeft: 4,
              }}
            >
              reps
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.85}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          activeOpacity={0.85}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: '#fff',
          }}
        >
          <Text style={{ color: '#ea580c', fontSize: 16, fontWeight: '700' }}>Save</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}
