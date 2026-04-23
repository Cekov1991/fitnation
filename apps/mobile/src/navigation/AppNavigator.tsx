import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { TabNavigator } from './TabNavigator'
import { OnboardingScreen } from '../screens/placeholders/OnboardingScreen'
import { WorkoutSessionScreen } from '../screens/placeholders/WorkoutSessionScreen'
import { WorkoutSessionExerciseDetailScreen } from '../screens/placeholders/WorkoutSessionExerciseDetailScreen'
import { GenerateWorkoutScreen } from '../screens/placeholders/GenerateWorkoutScreen'
import { WorkoutPreviewScreen } from '../screens/placeholders/WorkoutPreviewScreen'
import { ExerciseCatalogScreen } from '../screens/placeholders/ExerciseCatalogScreen'
import { ExerciseDetailScreen } from '../screens/placeholders/ExerciseDetailScreen'
import { ExercisePickerScreen } from '../screens/placeholders/ExercisePickerScreen'
import { WorkoutPreviewExercisePickerScreen } from '../screens/placeholders/WorkoutPreviewExercisePickerScreen'
import { CreatePlanScreen } from '../screens/placeholders/CreatePlanScreen'
import { EditPlanScreen } from '../screens/placeholders/EditPlanScreen'
import { CreateWorkoutScreen } from '../screens/placeholders/CreateWorkoutScreen'
import { EditWorkoutScreen } from '../screens/placeholders/EditWorkoutScreen'
import { ManageExercisesScreen } from '../screens/placeholders/ManageExercisesScreen'
import { ProgramLibraryScreen } from '../screens/placeholders/ProgramLibraryScreen'
import { ProgramDetailScreen } from '../screens/placeholders/ProgramDetailScreen'
import { RoutineDetailScreen } from '../screens/placeholders/RoutineDetailScreen'
import { RoutineWorkoutDetailScreen } from '../screens/placeholders/RoutineWorkoutDetailScreen'
import { SessionDetailScreen } from '../screens/placeholders/SessionDetailScreen'
import type { AppStackParamList } from './types'

const Stack = createNativeStackNavigator<AppStackParamList>()

export function AppNavigator() {
  const { user } = useAuth()
  const needsOnboarding = !user?.onboarding_completed_at

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={needsOnboarding ? 'Onboarding' : 'Tabs'}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="WorkoutSessionExerciseDetail"
        component={WorkoutSessionExerciseDetailScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="GenerateWorkout"
        component={GenerateWorkoutScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="WorkoutPreview" component={WorkoutPreviewScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="WorkoutPreviewExercisePicker"
        component={WorkoutPreviewExercisePickerScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ExercisePicker"
        component={ExercisePickerScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="ExerciseCatalog" component={ExerciseCatalogScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CreatePlan" component={CreatePlanScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="EditPlan" component={EditPlanScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ManageExercises" component={ManageExercisesScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProgramLibrary" component={ProgramLibraryScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="RoutineWorkoutDetail" component={RoutineWorkoutDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  )
}
