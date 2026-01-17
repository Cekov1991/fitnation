import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, BoxIcon } from 'lucide-react';
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: BoxIcon;
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delay = 0,
  onClick
}: MetricCardProps) {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5,
    delay,
    type: 'spring',
    stiffness: 100
  }} whileHover={{
    y: -5,
    scale: 1.02
  }} onClick={onClick} className="relative group overflow-hidden rounded-2xl bg-gray-900/40 backdrop-blur-md border border-white/5 p-5 cursor-pointer hover:bg-gray-800/40 transition-colors">
      {/* Gradient glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: `linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 10%, transparent), color-mix(in srgb, var(--color-secondary) 10%, transparent))` 
        }}
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div 
            className="p-2 rounded-xl transition-colors"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)'
            }}
          >
            <Icon size={20} className="group-hover:opacity-80 transition-opacity" />
          </div>
          <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
        </div>

        <div>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-1">
            {value}
          </h3>
          <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
            {title}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>;
}