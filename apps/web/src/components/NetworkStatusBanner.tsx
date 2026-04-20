import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSlideTransition } from '../utils/animations';

export function NetworkStatusBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const slideTransition = useSlideTransition('down');

  const shouldShow = !isOnline || isSlowConnection;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          {...slideTransition}
          className="fixed top-0 left-0 right-0 z-[10001]"
        >
          <div
            className="px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium"
            style={{
              backgroundColor: !isOnline ? '#dc2626' : '#d97706',
              color: '#ffffff',
            }}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span>No internet connection</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 flex-shrink-0" />
                <span>Slow connection detected</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
