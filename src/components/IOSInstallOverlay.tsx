import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

function IOSShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 4v10M8 8l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="12"
        width="16"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function IOSAddToHomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IOSInstallOverlay() {
  const { showIOSOverlay, setShowIOSOverlay } = useInstallPrompt();

  return (
    <AnimatePresence>
      {showIOSOverlay && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-end bg-black/70 backdrop-blur-sm"
          onClick={() => setShowIOSOverlay(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-gradient-to-b from-[#112240] to-[#1a1a2e] p-6 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIOSOverlay(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h2
              id="ios-install-title"
              className="pr-10 text-xl font-bold tracking-wide text-white"
            >
              Install this app
            </h2>
            <p className="mt-1 text-sm text-blue-100/70">
              Add Fit Nation to your Home Screen for quick access.
            </p>

            <ol className="mt-6 space-y-5">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <IOSShareIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">Step 1</p>
                  <p className="mt-1 text-sm text-blue-100/85">
                    Tap the <strong className="text-white">Share</strong> button in Safari&apos;s
                    bottom toolbar.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <IOSAddToHomeIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">Step 2</p>
                  <p className="mt-1 text-sm text-blue-100/85">
                    Scroll down and tap{' '}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
                  3
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">Step 3</p>
                  <p className="mt-1 text-sm text-blue-100/85">
                    Tap <strong className="text-white">Add</strong> in the top-right corner to
                    confirm.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-8 flex flex-col items-center border-t border-white/10 pt-6">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-blue-200/60">
                Look for Share here
              </p>
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl text-white drop-shadow-lg"
                aria-hidden
              >
                ↓
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
