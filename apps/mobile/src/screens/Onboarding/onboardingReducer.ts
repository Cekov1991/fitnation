import type { UpdateProfileInput } from '@fit-nation/shared'

export type OnboardingState = Partial<UpdateProfileInput> & {
  currentStep: number
}

type OnboardingAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET'; payload: Partial<UpdateProfileInput> }

// Steps: 1=Goal, 2=About you, 3=How you train, 4=Building your plan.
// The flow opens on the first question — there is no welcome step to go back to,
// so BACK clamps at FIRST_STEP rather than at zero.
export const FIRST_STEP = 1
export const TOTAL_STEPS = 4

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'NEXT':
      return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) }
    case 'BACK':
      return { ...state, currentStep: Math.max(state.currentStep - 1, FIRST_STEP) }
    case 'SET':
      return { ...state, ...action.payload }
    default:
      return state
  }
}
