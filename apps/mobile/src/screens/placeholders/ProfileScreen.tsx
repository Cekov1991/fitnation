import { useState } from 'react'
import { ScrollView, View, Text } from 'react-native'
import * as Application from 'expo-application'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { User, Ruler, Target, Dumbbell, LogOut, Trash2 } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import {
  useProfile,
  useUpdateNotificationSettings,
  useDeleteAccount,
  useWeightUnit,
  useHeightUnit,
  setPushEnabled,
  deleteAccountAndSignOut,
  labelFor,
  FITNESS_GOAL_OPTIONS,
  TRAINING_EXPERIENCE_OPTIONS,
} from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN } from '../../constants/layout'
import { Button, BUTTON, useButtonContentColor } from '../../components/ui/Button'
import { PageTitle } from '../../components/ui/ScreenHeader'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { Card } from '../../components/ui/Card'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DeleteAccountDialog } from '../../components/ui/DeleteAccountDialog'
import { ProfileSectionRow } from '../../components/profile/ProfileSectionRow'
import { NotificationsCard } from '../../components/profile/NotificationsCard'
import { PROFILE_SECTIONS } from '../../components/profile'
import type { ProfileSectionKey } from '../../components/profile'
import { showToast } from '../../lib/toast'
import { grantPushPermission } from '../../lib/notifications'
import { usePushPermissionStatus } from '../../hooks/usePushPermissionStatus'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>

/** The hub's row order and icons; the copy comes from PROFILE_SECTIONS. */
const SECTION_ROWS: ReadonlyArray<{ key: ProfileSectionKey; icon: LucideIcon }> = [
  { key: 'account', icon: User },
  { key: 'about', icon: Ruler },
  { key: 'goal', icon: Target },
  { key: 'training', icon: Dumbbell },
]

const NOT_SET = 'Not set'

export function ProfileScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const destructiveButtonContent = useButtonContentColor('destructive')
  const { logout, user } = useAuth()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const updateNotificationSettings = useUpdateNotificationSettings()
  const deleteAccount = useDeleteAccount()
  const [logoutVisible, setLogoutVisible] = useState(false)

  // M8: the switch is the server's global `push_enabled`; the OS permission is
  // shown alongside it, read-only, with a way into Settings when denied.
  const pushPermission = usePushPermissionStatus()
  const [optimisticPush, setOptimisticPush] = useState<boolean | null>(null)
  const pushEnabled = optimisticPush ?? profile?.push_enabled ?? true
  const [deleteVisible, setDeleteVisible] = useState(false)

  // The backend formats height/weight for the stored unit_system, so these
  // are label-only. Never convert on the client.
  const weightLabel = useWeightUnit()
  const heightLabel = useHeightUnit()

  // Permission grant then setting save, as one named action (0026). The flip is
  // optimistic while the save runs and reverts if it fails; the failed save
  // itself toasts globally via MutationCache. A refused permission leaves
  // push_enabled untouched — the denied line shows.
  const handlePushToggle = async (next: boolean) => {
    if (updateNotificationSettings.isPending) return
    await setPushEnabled(
      {
        requestPermission: async () => {
          // The user dismissed the onboarding sheet; the OS has never been asked.
          const granted = await grantPushPermission()
          await pushPermission.refresh()
          return granted
        },
        updateSetting: async enabled => {
          setOptimisticPush(enabled)
          try {
            await updateNotificationSettings.mutateAsync({ push_enabled: enabled })
          } finally {
            setOptimisticPush(null)
          }
        },
      },
      { enabled: next, permissionUndetermined: pushPermission.status === 'undetermined' }
    )
  }

  // Grant from the "Allow" line (push_enabled already on, OS never asked).
  const handleAllowPush = async () => {
    await grantPushPermission()
    await pushPermission.refresh()
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
        <View className="pt-8" style={{ paddingHorizontal: SCREEN.paddingX }}>
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

  const details = profile?.profile
  const summaries: Record<ProfileSectionKey, string> = {
    account: profile?.email || NOT_SET,
    about: joinParts([
      details?.age != null ? String(details.age) : null,
      details?.height != null ? `${details.height} ${heightLabel}` : null,
      details?.weight != null ? `${details.weight} ${weightLabel}` : null,
    ]),
    goal: labelFor(FITNESS_GOAL_OPTIONS, details?.fitness_goal) || NOT_SET,
    training: joinParts([
      labelFor(TRAINING_EXPERIENCE_OPTIONS, details?.training_experience) || null,
      details?.training_days_per_week != null ? `${details.training_days_per_week} days` : null,
      details?.workout_duration_minutes != null ? `${details.workout_duration_minutes} min` : null,
    ]),
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle title="Profile" />

        {/* One row per section; each opens its own edit page. */}
        <SectionLabel>Your Details</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {SECTION_ROWS.map(({ key, icon }, index) => (
            <ProfileSectionRow
              key={key}
              icon={icon}
              title={PROFILE_SECTIONS[key].title}
              summary={summaries[key]}
              first={index === 0}
              onPress={() => navigation.navigate('EditProfileSection', { section: key })}
            />
          ))}
        </Card>

        <SectionLabel style={{ marginTop: 8 }}>Notifications</SectionLabel>
        <NotificationsCard
          pushEnabled={pushEnabled}
          onToggle={handlePushToggle}
          disabled={updateNotificationSettings.isPending}
          permissionStatus={pushPermission.status}
          onAllow={handleAllowPush}
        />

        {/* Log Out */}
        <Button
          label="Log Out"
          variant="destructive"
          icon={<LogOut size={BUTTON.md.icon} color={destructiveButtonContent} />}
          onPress={handleLogout}
          style={{ marginTop: 8, marginBottom: 16 }}
        />

        {/* Delete Account */}
        <Button
          label="Delete Account"
          variant="destructive"
          size="sm"
          icon={<Trash2 size={BUTTON.sm.icon} color={destructiveButtonContent} />}
          onPress={() => setDeleteVisible(true)}
          style={{ marginBottom: 32 }}
        />

        {/* App version */}
        <Text className="text-xs text-center mb-8" style={{ color: colors.textMuted }}>
          v{Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
        </Text>
      </ScrollView>

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
        requiresPassword={user?.has_password ?? true}
        onClose={() => setDeleteVisible(false)}
        onConfirm={async (password) => {
          // Delete then sign out as one named action (0026): a sign-out that
          // throws after the delete is retried, and never shown as an error
          // for an account that no longer exists.
          const outcome = await deleteAccountAndSignOut(
            { deleteAccount: pw => deleteAccount.mutateAsync(pw), signOut: () => logout() },
            { password }
          )
          if (!outcome.ok && outcome.failed === 'delete') throw outcome.error
          if (!outcome.ok) showToast('Your account was deleted. Restart the app to finish signing out.', 'error')
        }}
      />
    </SafeAreaView>
  )
}

/** "30 · 180 cm · 80 kg" from whichever parts are set; NOT_SET when none are. */
function joinParts(parts: Array<string | null>): string {
  const set = parts.filter((p): p is string => !!p)
  return set.length > 0 ? set.join(' · ') : NOT_SET
}
