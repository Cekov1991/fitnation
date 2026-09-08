import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { dismissToast, useToasts, type ToastKind } from '../lib/toast';
import { useSlideTransition } from '../utils/animations';

const KIND_CLASS: Record<ToastKind, string> = {
  error: 'bg-red-600',
  success: 'bg-green-600',
  info: 'bg-amber-600',
};

// Renders whatever lib/toast holds. Sits just under the NetworkStatusBanner
// (z-[10001]) so a connectivity banner still wins, and the stack itself lets
// clicks through to the page — only the toasts catch them.
export function ToastHost() {
  const toasts = useToasts();
  const slide = useSlideTransition('down');

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[10000] flex flex-col items-center gap-2 px-4 pt-3"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            {...slide}
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${KIND_CLASS[toast.kind]}`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="flex-shrink-0 rounded p-1 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
