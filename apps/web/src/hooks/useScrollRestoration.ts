import { useEffect, useRef } from 'react';

/**
 * Saves and restores scroll position for a scrollable container,
 * keyed by the current route path in sessionStorage.
 */
export function useScrollRestoration(key: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const storageKey = `scroll:${key}`;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      requestAnimationFrame(() => {
        el.scrollTop = parseInt(saved, 10);
      });
    }

    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(storageKey, String(el.scrollTop));
      }, 100);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [key]);

  return ref;
}
