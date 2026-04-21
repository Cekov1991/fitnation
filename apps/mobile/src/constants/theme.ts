export const lightColors = {
  // Backgrounds
  bgBase: '#F2F2F2',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',

  // Text
  textPrimary: '#111827',    // gray-900
  textSecondary: '#4B5563',  // gray-600
  textMuted: '#9CA3AF',      // gray-400
  textButton: '#FFFFFF',

  // Borders
  border: 'rgba(0, 0, 0, 0.1)',
  borderSubtle: 'rgba(0, 0, 0, 0.05)',

  // Brand (overridden per partner)
  primary: '#2563EB',   // blue-600
  secondary: '#9333EA', // purple-600

  // Segment control
  segmentTrack: '#E5E7EB',
  segmentActive: '#FFFFFF',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
}

export const darkColors: AppColors = {
  // Backgrounds
  bgBase: '#0A0A0A',
  bgSurface: 'rgba(31, 41, 55, 0.4)',   // gray-800/40
  bgElevated: 'rgba(17, 24, 39, 0.5)',  // gray-900/50

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF', // gray-400
  textMuted: '#6B7280',     // gray-500
  textButton: '#FFFFFF',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',

  // Brand (overridden per partner)
  primary: '#2563EB',
  secondary: '#9333EA',

  // Segment control
  segmentTrack: 'rgba(17, 24, 39, 0.5)',
  segmentActive: 'rgba(31, 41, 55, 0.4)',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
}

export const defaultColors = lightColors
export type AppColors = typeof lightColors
