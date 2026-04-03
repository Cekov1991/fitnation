import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/**
 * Fixed install app banner matching the design in install-app-design.
 * Shown on all authenticated pages until the app is installed (standalone).
 */
export function InstallAppBanner() {
  const { canInstall, isIOS, promptInstall, setShowIOSOverlay } = useInstallPrompt();
  const showBanner = canInstall || isIOS;

  const handleInstall = () => {
    if (isIOS) {
      setShowIOSOverlay(true);
    } else {
      void promptInstall();
    }
  };

  if (!showBanner) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed left-4 right-4 top-4 z-[9998] overflow-hidden rounded-2xl bg-gradient-to-r from-[#112240] via-[#1a365d] to-[#2563eb] p-4 shadow-2xl shadow-blue-900/20"
    >
      {/* Shimmer animation */}
      <style>
        {`
          @keyframes install-banner-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .install-banner-shimmer {
            animation: install-banner-shimmer 3s infinite linear;
          }
        `}
      </style>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="install-banner-shimmer absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon with pulse */}
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Download className="h-6 w-6 text-white" />
          </motion.div>
          <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-md" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold tracking-wide text-white">
            INSTALL APP
          </h3>
          <p className="text-xs font-medium text-blue-100/80">
            Get the full experience
          </p>
        </div>

        {/* GET button - same gym gradient as START WORKOUT */}
        <button
          type="button"
          onClick={handleInstall}
          className="flex h-8 flex-shrink-0 items-center justify-center rounded-full px-4 text-xs font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
            color: 'var(--color-text-button)',
          }}
        >
          GET
        </button>
      </div>
    </motion.div>
  );
}
