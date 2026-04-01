import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PlanGeneratingOverlayProps {
  partnerName?: string | null;
  fullscreen?: boolean;
}

export function PlanGeneratingOverlay({ partnerName, fullscreen = false }: PlanGeneratingOverlayProps) {
  const content = (
    <motion.div className="flex flex-col items-center gap-6 max-w-sm">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles
          className="w-16 h-16"
          style={{ color: 'var(--color-primary)' }}
        />
      </motion.div>
      <div className="space-y-2 text-center">
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Generating your personalized plan
        </h2>
        {partnerName && (
          <p
            className="text-base"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Courtesy of <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{partnerName}</span>
          </p>
        )}
        <p
          className="text-sm mt-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          This may take a moment...
        </p>
      </div>
    </motion.div>
  );

  if (!fullscreen) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{
        zIndex: 10002,
        backgroundColor: 'color-mix(in srgb, var(--color-bg-base) 90%, transparent)'
      }}
    >
      {content}
    </div>
  );
}
