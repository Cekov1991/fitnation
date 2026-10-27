import { describe, expect, it } from 'vitest';
import { pickStoreUrl, APP_STORE_URL, PLAY_STORE_URL } from './storeUrl';

describe('pickStoreUrl', () => {
  it('sends iPhone to the App Store', () => {
    expect(pickStoreUrl('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(APP_STORE_URL);
  });

  it('sends a desktop-mode iPad (Macintosh UA + touch) to the App Store', () => {
    expect(pickStoreUrl('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(APP_STORE_URL);
  });

  it('sends Android to the Play Store', () => {
    expect(pickStoreUrl('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5)).toBe(PLAY_STORE_URL);
  });

  it('a real Mac (no touch) is not an iPad — falls through to the Play Store default', () => {
    expect(pickStoreUrl('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(PLAY_STORE_URL);
  });
});
