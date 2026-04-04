import { AnimatePresence, motion } from 'framer-motion';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useModalTransition } from '../utils/animations';

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

function SafariInstallSteps({ onDismiss }: { onDismiss: () => void }) {
  return (
    <>
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

      <button
        type="button"
        onClick={onDismiss}
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 active:scale-[0.98]"
      >
        Got it
      </button>
    </>
  );
}

function OpenInSafariSteps() {
  const [copied, setCopied] = useState(false);

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return (
    <div className="mt-6 space-y-5">
      <div className="flex gap-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
          <ExternalLink className="h-5 w-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-white">
            Open in Safari to install
          </p>
          <p className="mt-1 text-sm text-blue-100/85">
            Adding to Home Screen is only available in{' '}
            <strong className="text-white">Safari</strong>. Copy the link below
            and paste it in Safari.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={copyUrl}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 active:scale-[0.98]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-400" />
            Link copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy link
          </>
        )}
      </button>
    </div>
  );
}

export function IOSInstallOverlay() {
  const { showIOSOverlay, setShowIOSOverlay, isIOSSafari } = useInstallPrompt();
  const { backdrop, panel } = useModalTransition();

  return (
    <AnimatePresence>
      {showIOSOverlay && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          {...backdrop}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          onClick={() => setShowIOSOverlay(false)}
        >
          <motion.div
            {...panel}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#112240] to-[#1a1a2e] p-6 pb-8 shadow-2xl"
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

            {isIOSSafari ? <SafariInstallSteps onDismiss={() => setShowIOSOverlay(false)} /> : <OpenInSafariSteps />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
