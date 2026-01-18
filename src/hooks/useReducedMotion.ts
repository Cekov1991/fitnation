import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export function useReducedMotion() {
  const shouldReduceMotion = useFramerReducedMotion();
  return shouldReduceMotion ?? false;
}
