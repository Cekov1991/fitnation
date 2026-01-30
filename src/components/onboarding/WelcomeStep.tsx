import { motion } from 'framer-motion';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';
import { useSlideTransition } from '../../utils/animations';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { logo, partnerName } = useBranding();
  const slideProps = useSlideTransition('up');

  return (
    <div className="flex flex-col h-full justify-between py-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <motion.div {...slideProps} transition={{ ...slideProps.transition, delay: 0 }}>
          {logo ? (
            <img
              src={logo}
              alt={partnerName || 'Fitness App'}
              className="w-24 h-24 object-contain mb-4 rounded-2xl"
            />
          ) : (
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl mb-4"
              style={{ 
                background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))` 
              }}
            >
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          )}
        </motion.div>

        <motion.div {...slideProps} transition={{ ...slideProps.transition, delay: 0.1 }}>
          <h1 
            className="text-3xl font-bold mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Welcome to {partnerName || 'Your Fitness Journey'}
          </h1>
          <p 
            className="text-lg max-w-xs mx-auto leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Let's create your personalized fitness plan. It only takes a minute
            to get started.
          </p>
        </motion.div>
      </div>

      <motion.div {...slideProps} transition={{ ...slideProps.transition, delay: 0.2 }} className="w-full">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all group"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
            color: 'white',
          }}
        >
          <span className="flex items-center justify-center">
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </motion.div>
    </div>
  );
}
