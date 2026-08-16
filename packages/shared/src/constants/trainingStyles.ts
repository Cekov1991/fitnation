export const TRAINING_STYLE_OPTIONS = [
  { code: 'BODYBUILDING', label: 'Bodybuilding' },
  { code: 'FUNCTIONAL', label: 'Functional' },
  { code: 'OLYMPIC', label: 'Olympic' },
  { code: 'CALISTHENICS', label: 'Calisthenics' },
] as const

export type TrainingStyleCode = (typeof TRAINING_STYLE_OPTIONS)[number]['code']

export const DEFAULT_TRAINING_STYLES: TrainingStyleCode[] = ['BODYBUILDING']
