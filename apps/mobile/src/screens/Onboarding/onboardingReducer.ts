import type { UpdateProfileInput } from '@fit-nation/shared'

export type OnboardingState = Partial<UpdateProfileInput> & {
  currentStep: number
}

type OnboardingAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET'; payload: Partial<UpdateProfileInput> }

// Steps: 0=Welcome, 1=PersonalInfo, 2=Goals, 3=Training, 4=Complete
export const TOTAL_STEPS = 4

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'NEXT':
      return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) }
    case 'BACK':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) }
    case 'SET':
      return { ...state, ...action.payload }
    default:
      return state
  }
}
