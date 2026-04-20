// Default palette — matches the web light theme at apps/web/src/index.css
// ([data-theme="light"]). Gets overridden per partner from the API response
// (see AuthContext.applyPartnerColors).
export const defaultColors = {
  // Backgrounds
  bgBase: '#F2F2F2',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',

  // Text
  textPrimary: '#111827', // gray-900
  textSecondary: '#4B5563', // gray-600
  textMuted: '#9CA3AF', // gray-400
  textButton: '#FFFFFF', // text on primary buttons

  // Borders
  border: 'rgba(0, 0, 0, 0.1)',
  borderSubtle: 'rgba(0, 0, 0, 0.05)',

  // Brand (Fit Nation defaults — overridden per partner)
  primary: '#2563EB', // blue-600
  secondary: '#9333EA', // purple-600

  // Segment control
  segmentTrack: '#E5E7EB',
  segmentActive: '#FFFFFF',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
}

export type AppColors = typeof defaultColors
