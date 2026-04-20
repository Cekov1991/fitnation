import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Home, ClipboardList, BarChart3, Dumbbell, User } from 'lucide-react-native'
import { DashboardScreen } from '../screens/placeholders/DashboardScreen'
import { PlansScreen } from '../screens/placeholders/PlansScreen'
import { ProgressScreen } from '../screens/placeholders/ProgressScreen'
import { ExercisesScreen } from '../screens/placeholders/ExercisesScreen'
import { ProfileScreen } from '../screens/placeholders/ProfileScreen'
import { useTheme } from '../context/ThemeContext'
import type { TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()

export function TabNavigator() {
  const { colors } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.bgElevated,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{ tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: ({ color }) => <BarChart3 color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesScreen}
        options={{ tabBarLabel: 'Catalog', tabBarIcon: ({ color }) => <Dumbbell color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <User color={color} size={22} /> }}
      />
    </Tab.Navigator>
  )
}
