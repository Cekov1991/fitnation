import { motion, AnimatePresence } from 'framer-motion'
import { X, Scale } from 'lucide-react'
import { useFitnessMetrics } from '../hooks/useApi'

interface BalanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BalanceModal({
  isOpen,
  onClose,
}: BalanceModalProps) {
  const { data: metrics } = useFitnessMetrics()
  
  const balance = metrics?.strength_balance
  const percentage = balance?.percentage ?? 0
  const level = balance?.level ?? 'FAIR'
  const recentChange = balance?.recent_change ?? 0
  const muscleGroups = balance?.muscle_groups ?? {}

  const isPositive = recentChange > 0
  const isNeutral = recentChange === 0

  // Map balance level to color classes
  const getLevelColorClasses = (level: string) => {
    switch (level) {
      case 'EXCELLENT':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          iconBg: 'bg-green-500/20',
          iconText: 'text-green-400',
        }
      case 'GOOD':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          iconText: 'text-blue-400',
        }
      case 'FAIR':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          iconText: 'text-yellow-400',
        }
      case 'NEEDS_IMPROVEMENT':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          iconBg: 'bg-red-500/20',
          iconText: 'text-red-400',
        }
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          iconText: 'text-blue-400',
        }
    }
  }

  const levelColors = getLevelColorClasses(level)

  // Map muscle group names to colors
  const getMuscleGroupColor = (name: string): string => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('chest')) return 'var(--color-primary)'
    if (nameLower.includes('lats') || nameLower.includes('upper back') || nameLower.includes('lower back')) return 'var(--color-secondary)'
    if (nameLower.includes('quad') || nameLower.includes('hamstring') || nameLower.includes('glute') || nameLower.includes('calve')) return '#10b981'
    if (nameLower.includes('delt') || nameLower.includes('shoulder') || nameLower.includes('trap')) return '#f97316'
    if (nameLower.includes('bicep') || nameLower.includes('tricep') || nameLower.includes('forearm')) return '#06b6d4'
    if (nameLower.includes('abs') || nameLower.includes('oblique') || nameLower.includes('core')) return '#eab308'
    return 'var(--color-primary)'
  }

  // Sort muscle groups by percentage
  const sortedMuscleGroups = Object.entries(muscleGroups)
    .map(([name, value]) => ({ name, percentage: value as number }))
    .sort((a, b) => b.percentage - a.percentage)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{
              y: '100%',
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: '100%',
      }}
      transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div 
              className="rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
            >
              {/* Header */}
              <div 
                className="sticky top-0 border-b p-6 flex items-center justify-between rounded-t-3xl"
                style={{ 
                  backgroundColor: 'var(--color-bg-modal)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <h2 
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
                >
                  Strength Balance Details
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--color-border-subtle)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                  }}
                >
                  <X className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Main Balance Card */}
                <div 
                  className="bg-gradient-to-br rounded-2xl p-6 border"
                  style={{ 
                    background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 ${levelColors.iconBg} rounded-full flex items-center justify-center`}>
                      <Scale className={`${levelColors.iconText} w-8 h-8`} />
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-black" style={{ color: 'var(--color-text-primary)' }}>{Math.round(percentage)}%</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Balance Score
                      </p>
                    </div>
                  </div>
                  <div className={`inline-block px-4 py-2 ${levelColors.bg} border ${levelColors.border} rounded-full`}>
                    <span className={`text-sm font-bold ${levelColors.text}`}>
                      {level}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Recent Change</p>
                    <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : isNeutral ? 'text-blue-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{Math.round(recentChange)}%
                    </p>
                  </div>
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Muscle Balance</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                      {sortedMuscleGroups.length} Groups
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div 
                  className="rounded-xl p-4 border"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    What This Means
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Your strength balance of {Math.round(percentage)}% indicates {level.toLowerCase()} muscle group distribution. 
                    {isPositive && ' You\'re improving your balance over time.'}
                    {isNeutral && ' Your balance has remained steady.'}
                    {!isPositive && !isNeutral && ' Consider focusing on underdeveloped muscle groups to improve balance.'}
                  </p>
                </div>

                {/* Muscle Groups Distribution */}
                {sortedMuscleGroups.length > 0 && (
                  <div 
                  className="rounded-xl p-4 border"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Muscle Group Distribution
                    </h3>
                    <div className="space-y-3">
                      {sortedMuscleGroups.map((group) => {
                        const displayName = group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
                        return (
                          <div key={group.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                                {displayName}
                              </span>
                              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {Math.round(group.percentage)}%
                              </span>
                            </div>
                            <div 
                              className="h-2 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                            >
                              <div
                                className="h-full"
                                style={{
                                  width: `${Math.min(100, Math.max(0, group.percentage))}%`,
                                  background: `linear-gradient(to right, ${getMuscleGroupColor(group.name)}, color-mix(in srgb, ${getMuscleGroupColor(group.name)} 80%, transparent))`
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
      </div>
      </div>
    </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
