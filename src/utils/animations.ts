import { useReducedMotion } from '../hooks/useReducedMotion';

const isIOS = false;//typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function useSimpleTransition() {
  const shouldReduce = useReducedMotion();
  const skipAnimation = shouldReduce || isIOS;
  return {
    duration: skipAnimation ? 0 : 0.2,
    ease: 'easeOut' as const,
  };
}

/** Backdrop: opacity fade (0.2s). Use on the dimmed overlay behind modals. */
const buildBackdrop = (skip: boolean) => ({
  initial: { opacity: skip ? 1 : 0 },
  animate: { opacity: 1 },
  exit: { opacity: skip ? 1 : 0 },
  transition: {
    duration: skip ? 0 : 0.2,
    type: 'tween' as const,
  },
});

/**
 * Panel / sheet: spring + slight scale (matches IOSInstallOverlay snappiness).
 * For bottom sheets add Tailwind `origin-bottom` on the same element.
 */
const buildPanel = (skip: boolean) => ({
  initial: { opacity: skip ? 1 : 0, scale: skip ? 1 : 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: skip ? 1 : 0, scale: skip ? 1 : 0.9 },
  transition: skip
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 25, stiffness: 350 },
});

/**
 * Modal / overlay motion presets.
 * - `backdrop` — dimmed layer (opacity tween ~0.2s)
 * - `panel` — dialog or bottom sheet (spring + scale; add `origin-bottom` for sheets)
 * - `fade` — opacity-only for staggered sections / non-modal blocks (same as backdrop)
 */
export function useModalTransition() {
  const shouldReduce = useReducedMotion();
  const skip = shouldReduce || isIOS;

  const backdrop = buildBackdrop(skip);
  const panel = buildPanel(skip);
  const fade = backdrop;

  return { backdrop, panel, fade };
}

export function useSlideTransition(direction: 'up' | 'down' = 'down') {
  const shouldReduce = useReducedMotion();
  const skipAnimation = shouldReduce || isIOS;
  const yOffset = direction === 'down' ? -20 : 20;

  return {
    initial: { opacity: skipAnimation ? 1 : 0, y: skipAnimation ? 0 : yOffset },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: skipAnimation ? 1 : 0, y: skipAnimation ? 0 : yOffset },
    transition: {
      duration: skipAnimation ? 0 : 0.2,
      type: 'tween',
      ease: 'easeOut',
    },
  };
}
