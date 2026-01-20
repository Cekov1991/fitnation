import { useReducedMotion } from '../hooks/useReducedMotion';
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function useSimpleTransition() {
  const shouldReduce = useReducedMotion();
  const skipAnimation = shouldReduce || isIOS;
  return {
    duration: skipAnimation ? 0 : 0.2,
    ease: 'easeOut' as const
  };
}

export function useModalTransition() {
  const shouldReduce = useReducedMotion();
  const skipAnimation = shouldReduce || isIOS;

  return {
    initial: { opacity: skipAnimation ? 1 : 0 },
    animate: { opacity: 1 },
    exit: { opacity: skipAnimation ? 1 : 0 },
    transition: { 
      duration: skipAnimation ? 0 : 0.15,
      type: 'tween'
    }
  };
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
      ease: 'easeOut'
    }
  };
}
