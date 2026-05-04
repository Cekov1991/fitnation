import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/placeholders/LoginScreen'
import { RegisterScreen } from '../screens/placeholders/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/placeholders/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/placeholders/ResetPasswordScreen'
import type { AuthStackParamList } from './types'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  )
}
