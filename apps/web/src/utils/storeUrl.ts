export const APP_STORE_URL = 'https://apps.apple.com/app/fit-nation-the-movement/id6766201705';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.fitnation.app';

/**
 * Picks the store for the current device client-side, like InstallAppBanner
 * does — unlike the backend /get redirect, this also catches an iPad in its
 * default "desktop website" mode, whose UA says Macintosh but which still
 * reports touch points. Non-iOS falls through to the Play Store, matching
 * the banner; this is only rendered on narrow (phone-sized) viewports.
 */
export function pickStoreUrl(
  userAgent: string = navigator.userAgent,
  maxTouchPoints: number = navigator.maxTouchPoints ?? 0,
): string {
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (userAgent.includes('Macintosh') && maxTouchPoints > 1);
  return isIOS ? APP_STORE_URL : PLAY_STORE_URL;
}
