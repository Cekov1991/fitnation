import { useEffect, useCallback, useRef } from 'react';

/**
 * Pushes a synthetic history entry when an overlay is open so the
 * browser/system back gesture closes the overlay instead of navigating away.
 *
 * Returns a `close` function that should be used by in-app back/close buttons
 * instead of calling the raw `onClose` directly.
 */
export function useBackGesture(isOpen: boolean, onClose: () => void) {
  const pushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      pushedRef.current = false;
      return;
    }

    window.history.pushState({ overlay: true }, '');
    pushedRef.current = true;

    const onPopState = () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (pushedRef.current) {
        window.history.back();
        pushedRef.current = false;
      }
    };
  }, [isOpen]);

  const close = useCallback(() => {
    if (pushedRef.current) {
      window.history.back();
    } else {
      onCloseRef.current();
    }
  }, []);

  return close;
}
