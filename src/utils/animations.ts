import { useReducedMotion } from '../hooks/useReducedMotion';

export function useSimpleTransition() {
  const shouldReduce = useReducedMotion();
  return {
    duration: shouldReduce ? 0 : 0.2,
    ease: 'easeOut' as const
  };
}

export function useModalTransition() {
  const shouldReduce = useReducedMotion();
  return {
    initial: { opacity: shouldReduce ? 1 : 0 },
    animate: { opacity: 1 },
    exit: { opacity: shouldReduce ? 1 : 0 },
    transition: { duration: shouldReduce ? 0 : 0.15 }
  };
}
