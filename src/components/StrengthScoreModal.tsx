import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp } from 'lucide-react'
import { useFitnessMetrics } from '../hooks/useApi'

interface StrengthScoreModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StrengthScoreModal({
  isOpen,
  onClose,
}: StrengthScoreModalProps) {
  const { data: metrics } = useFitnessMetrics()
  
  const strengthScore = metrics?.strength_score
  const current = strengthScore?.current ?? 0
  const level = strengthScore?.level ?? 'INTERMEDIATE'
  const recentGain = strengthScore?.recent_gain ?? 0
  const muscleGroups = strengthScore?.muscle_groups ?? {}
  
  // Optional fields that may come from backend
  const percentile = 'percentile' in (strengthScore || {}) ? (strengthScore as { percentile?: number }).percentile : undefined
  const ranking = 'ranking' in (strengthScore || {}) ? (strengthScore as { ranking?: string }).ranking : undefined

  const isPositive = recentGain >= 0

  // Calculate ranking display
  const rankingDisplay = ranking || (percentile !== undefined ? `Top ${100 - Math.round(percentile)}%` : null)

  // Map level to color classes
  const getLevelColorClasses = (level: string) => {
    switch (level) {
      case 'ADVANCED':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
        }
      case 'INTERMEDIATE':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
        }
      case 'BEGINNER':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
        }
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
        }
    }
  }

  const levelColors = getLevelColorClasses(level)

  // Map muscle group names to colors
  const getMuscleGroupColor = (name: string): string => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('chest')) return 'from-blue-500 to-blue-400'
    if (nameLower.includes('back')) return 'from-purple-500 to-purple-400'
    if (nameLower.includes('legs') || nameLower.includes('quad') || nameLower.includes('hamstring') || nameLower.includes('glute') || nameLower.includes('calve')) return 'from-green-500 to-green-400'
    if (nameLower.includes('shoulder') || nameLower.includes('delt')) return 'from-orange-500 to-orange-400'
    if (nameLower.includes('arm') || nameLower.includes('bicep') || nameLower.includes('tricep') || nameLower.includes('forearm')) return 'from-cyan-500 to-cyan-400'
    return 'from-blue-500 to-blue-400'
  }

  // Sort muscle groups by score
  const sortedMuscleGroups = Object.entries(muscleGroups)
    .map(([name, score]) => ({ name, score: score as number }))
    .sort((a, b) => b.score - a.score)

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
            <div className="bg-[#0f1419] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-[#0f1419] border-b border-white/10 p-6 flex items-center justify-between rounded-t-3xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Strength Score Details
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="text-gray-400 w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Main Score Card */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="text-blue-400 w-8 h-8" />
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-black text-white">{Math.round(current)}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Strength Score
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
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Recent Change</p>
                    <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{Math.round(recentGain)}
                    </p>
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Ranking</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {rankingDisplay || '--'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-800/40 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-2">
                    What This Means
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your strength score of {Math.round(current)} indicates {level.toLowerCase()} overall
                    strength development. {recentGain >= 0 ? `You've gained ${Math.round(recentGain)} points in the last 30 days. ` : `Your score has decreased by ${Math.round(Math.abs(recentGain))} points recently. `}
                    {rankingDisplay && `You're performing in the ${rankingDisplay.toLowerCase()} of users with similar profiles. `}
                    Keep up the consistent training to maintain and improve this score.
                  </p>
                </div>

                {/* Muscle Groups */}
                {sortedMuscleGroups.length > 0 && (
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-3">
                      Strength by Muscle Group
                    </h3>
                    <div className="space-y-3">
                      {sortedMuscleGroups.map((group) => {
                        const displayName = group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
                        const maxScore = Math.max(...sortedMuscleGroups.map(g => g.score))
                        const percentage = maxScore > 0 ? (group.score / maxScore) * 100 : 0
                        return (
                          <div key={group.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-300">
                                {displayName}
                              </span>
                              <span className="text-sm font-bold text-white">
                                {Math.round(group.score)}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${getMuscleGroupColor(group.name)}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, percentage))}%`,
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
