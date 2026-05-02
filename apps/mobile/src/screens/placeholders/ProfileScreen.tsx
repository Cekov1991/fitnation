import { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import * as Application from 'expo-application'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Mail,
  Target,
  Calendar,
  Ruler,
  Weight,
  Dumbbell,
  LogOut,
  ChevronDown,
  Trash2,
} from 'lucide-react-native'
import {
  useProfile,
  useUpdateProfile,
  useDeleteAccount,
  profileSchema,
  type ProfileFormData,
} from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DeleteAccountDialog } from '../../components/ui/DeleteAccountDialog'
import { showToast } from '../../lib/toast'

const DURATION_OPTIONS = [
  { label: '20-30 min', value: 30 },
  { label: '30-45 min', value: 45 },
  { label: '45-60 min', value: 60 },
  { label: '60-90 min', value: 90 },
  { label: '90+ min', value: 120 },
]

const GOAL_OPTIONS = [
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'strength', label: 'Strength' },
  { value: 'general_fitness', label: 'General Fitness' },
]

interface FieldInputProps {
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'email-address' | 'numeric'
  autoCapitalize?: 'none' | 'words' | 'sentences'
  error?: string
  secureTextEntry?: boolean
}

function FieldInput({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
}: FieldInputProps) {
  const { colors } = useTheme()
  return (
    <View className="mb-4">
      <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
        {label}
      </Text>
      <View
        className="flex-row items-center px-4 rounded-xl"
        style={{
          backgroundColor: colors.bgSurface,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.bgElevated,
          minHeight: 52,
        }}
      >
        <Icon size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="flex-1 ml-3 text-base py-3"
          style={{ color: colors.textPrimary }}
        />
      </View>
      {error && (
        <Text className="text-xs mt-1" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  )
}

export function ProfileScreen() {
  const { colors } = useTheme()
  const { logout } = useAuth()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const updateProfile = useUpdateProfile()
  const deleteAccount = useDeleteAccount()
  const [logoutVisible, setLogoutVisible] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      fitness_goal: 'general_fitness',
      gender: 'other',
      training_experience: 'beginner',
      age: null,
      height: null,
      weight: null,
      training_days_per_week: null,
      workout_duration_minutes: null,
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || '',
        fitness_goal: profile.profile?.fitness_goal || 'general_fitness',
        age: profile.profile?.age || null,
        gender: profile.profile?.gender || 'other',
        height: profile.profile?.height || null,
        weight: profile.profile?.weight ? Math.round(profile.profile.weight) : null,
        training_experience: profile.profile?.training_experience || 'beginner',
        training_days_per_week: profile.profile?.training_days_per_week || null,
        workout_duration_minutes: profile.profile?.workout_duration_minutes || null,
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        name: data.name,
        email: data.email,
        fitness_goal: data.fitness_goal,
        age: data.age ?? undefined,
        gender: data.gender,
        height: data.height ?? undefined,
        weight: data.weight ? Math.round(data.weight) : undefined,
        training_experience: data.training_experience,
        training_days_per_week: data.training_days_per_week ?? undefined,
        workout_duration_minutes: data.workout_duration_minutes ?? undefined,
      })
      showToast('Your profile has been updated.', 'success')
    } catch (e) {
      showToast('Failed to save profile. Please try again.', 'error')
    }
  }

  const handleLogout = () => {
    setLogoutVisible(true)
  }

  const performLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Logout error', e)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-4 pt-8">
          <SkeletonBox height={40} className="mb-4" width="50%" />
          <SkeletonBox height={52} className="mb-4" />
          <SkeletonBox height={52} className="mb-4" />
          <SkeletonBox height={52} className="mb-4" />
          <SkeletonBox height={52} className="mb-4" />
          <SkeletonBox height={200} className="mb-4" />
        </View>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <ErrorState message="Failed to load profile" onRetry={refetch} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="pt-8 mb-8">
            <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
              Profile
            </Text>
          </View>

          {/* Account Information */}
          <View className="mb-8">
            <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
              Account Information
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <FieldInput
                  label="Full Name"
                  icon={User}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Your name"
                  autoCapitalize="words"
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <FieldInput
                  label="Email Address"
                  icon={Mail}
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />
          </View>

          {/* Personal Information */}
          <View className="mb-8">
            <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
              Personal Information
            </Text>
            {/* Age + Gender row */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                  Age
                </Text>
                <Controller
                  control={control}
                  name="age"
                  render={({ field: { value, onChange } }) => (
                    <View
                      className="flex-row items-center px-4 rounded-xl"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderWidth: 1,
                        borderColor: errors.age ? colors.error : colors.bgElevated,
                        minHeight: 52,
                      }}
                    >
                      <Calendar size={16} color={colors.textMuted} />
                      <TextInput
                        value={value != null ? String(value) : ''}
                        onChangeText={(t) => onChange(t ? parseInt(t, 10) : null)}
                        placeholder="25"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        className="flex-1 ml-3 text-base py-3"
                        style={{ color: colors.textPrimary }}
                      />
                    </View>
                  )}
                />
                {errors.age && (
                  <Text className="text-xs mt-1" style={{ color: colors.error }}>
                    {errors.age.message}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                  Gender
                </Text>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { value, onChange } }) => (
                    <View className="flex-row gap-1">
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => onChange(g)}
                          className="flex-1 py-3 rounded-xl items-center"
                          style={{
                            backgroundColor: value === g ? colors.primary : colors.bgSurface,
                            borderWidth: 1,
                            borderColor: value === g ? colors.primary : colors.bgElevated,
                          }}
                        >
                          <Text
                            className="text-xs font-semibold capitalize"
                            style={{ color: value === g ? '#fff' : colors.textSecondary }}
                          >
                            {g === 'other' ? '—' : g.charAt(0).toUpperCase() + g.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>
            </View>

            {/* Height + Weight row */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                  Height (cm)
                </Text>
                <Controller
                  control={control}
                  name="height"
                  render={({ field: { value, onChange } }) => (
                    <View
                      className="flex-row items-center px-4 rounded-xl"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderWidth: 1,
                        borderColor: errors.height ? colors.error : colors.bgElevated,
                        minHeight: 52,
                      }}
                    >
                      <Ruler size={16} color={colors.textMuted} />
                      <TextInput
                        value={value != null ? String(value) : ''}
                        onChangeText={(t) => onChange(t ? parseInt(t, 10) : null)}
                        placeholder="175"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        className="flex-1 ml-3 text-base py-3"
                        style={{ color: colors.textPrimary }}
                      />
                    </View>
                  )}
                />
                {errors.height && (
                  <Text className="text-xs mt-1" style={{ color: colors.error }}>
                    {errors.height.message}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                  Weight (kg)
                </Text>
                <Controller
                  control={control}
                  name="weight"
                  render={({ field: { value, onChange } }) => (
                    <View
                      className="flex-row items-center px-4 rounded-xl"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderWidth: 1,
                        borderColor: errors.weight ? colors.error : colors.bgElevated,
                        minHeight: 52,
                      }}
                    >
                      <Weight size={16} color={colors.textMuted} />
                      <TextInput
                        value={value != null ? String(value) : ''}
                        onChangeText={(t) => onChange(t ? parseInt(t, 10) : null)}
                        placeholder="70"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        className="flex-1 ml-3 text-base py-3"
                        style={{ color: colors.textPrimary }}
                      />
                    </View>
                  )}
                />
                {errors.weight && (
                  <Text className="text-xs mt-1" style={{ color: colors.error }}>
                    {errors.weight.message}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Fitness Profile */}
          <View className="mb-8">
            <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
              Fitness Profile
            </Text>

            {/* Goal */}
            <View className="mb-4">
              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Physical Goal
              </Text>
              <Controller
                control={control}
                name="fitness_goal"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {GOAL_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        className="px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor:
                            value === opt.value
                              ? `${colors.primary}20`
                              : colors.bgSurface,
                          borderWidth: 1,
                          borderColor:
                            value === opt.value ? colors.primary : colors.bgElevated,
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: value === opt.value ? colors.primary : colors.textSecondary,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>

            {/* Experience */}
            <View>
              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Experience Level
              </Text>
              <Controller
                control={control}
                name="training_experience"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row gap-2">
                    {([
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Inter.' },
                      { value: 'advanced', label: 'Advanced' },
                    ] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{
                          backgroundColor:
                            value === opt.value ? `${colors.primary}20` : colors.bgSurface,
                          borderWidth: 1,
                          borderColor: value === opt.value ? colors.primary : colors.bgElevated,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: value === opt.value ? colors.primary : colors.textSecondary,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          </View>

          {/* Training Schedule */}
          <View className="mb-8">
            <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
              Training Schedule
            </Text>

            {/* Days per week */}
            <View className="mb-6">
              <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                Training Days Per Week
              </Text>
              <Controller
                control={control}
                name="training_days_per_week"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => onChange(day)}
                        className="flex-1 aspect-square rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: value === day ? colors.primary : colors.bgSurface,
                          borderWidth: 2,
                          borderColor: value === day ? colors.primary : colors.bgElevated,
                        }}
                      >
                        <Text
                          className="text-base font-semibold"
                          style={{ color: value === day ? '#fff' : colors.textSecondary }}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
                Select how many days you can commit to training.
              </Text>
            </View>

            {/* Duration */}
            <View>
              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Workout Duration
              </Text>
              <Controller
                control={control}
                name="workout_duration_minutes"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        className="px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor:
                            value === opt.value
                              ? `${colors.primary}20`
                              : colors.bgSurface,
                          borderWidth: 1,
                          borderColor:
                            value === opt.value ? colors.primary : colors.bgElevated,
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: value === opt.value ? colors.primary : colors.textSecondary,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.workout_duration_minutes && (
                <Text className="text-xs mt-1" style={{ color: colors.error }}>
                  {errors.workout_duration_minutes.message}
                </Text>
              )}
            </View>
          </View>

          {/* Save Changes */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isDirty}
            className="py-4 rounded-2xl items-center mb-4"
            style={{
              backgroundColor: isDirty ? colors.primary : colors.bgElevated,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                className="font-bold text-lg"
                style={{ color: isDirty ? '#fff' : colors.textMuted }}
              >
                SAVE CHANGES
              </Text>
            )}
          </TouchableOpacity>

          {/* Log Out */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl mb-4"
            style={{
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: `${colors.error}40`,
            }}
          >
            <LogOut size={20} color={colors.error} />
            <Text className="font-bold text-lg" style={{ color: colors.error }}>
              LOG OUT
            </Text>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            onPress={() => setDeleteVisible(true)}
            className="flex-row items-center justify-center gap-2 py-3 rounded-2xl mb-8"
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: `${colors.error}28`,
            }}
          >
            <Trash2 size={16} color={`${colors.error}99`} />
            <Text className="font-semibold text-sm" style={{ color: `${colors.error}99` }}>
              DELETE ACCOUNT
            </Text>
          </TouchableOpacity>

          {/* App version */}
          <Text className="text-xs text-center mb-8" style={{ color: colors.textMuted }}>
            v{Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        destructive
        onConfirm={performLogout}
      />

      <DeleteAccountDialog
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={async (password) => {
          await deleteAccount.mutateAsync(password)
          await logout()
        }}
      />
    </SafeAreaView>
  )
}
