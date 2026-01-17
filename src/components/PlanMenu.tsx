import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Power, PowerOff, Trash2, X } from 'lucide-react';
interface PlanMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onAddWorkout?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}
export function PlanMenu({
  isOpen,
  onClose,
  isActive,
  onAddWorkout,
  onEdit,
  onToggleActive,
  onDelete
}: PlanMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const menuItems = [{
    label: 'Add Workout',
    icon: Plus,
    onClick: onAddWorkout,
    color: 'text-blue-400'
  }, {
    label: 'Edit',
    icon: Edit3,
    onClick: onEdit,
    color: 'text-gray-300'
  }, {
    label: isActive ? 'Deactivate' : 'Activate',
    icon: isActive ? PowerOff : Power,
    onClick: onToggleActive,
    color: isActive ? 'text-orange-400' : 'text-green-400'
  }, {
    label: 'Delete',
    icon: Trash2,
    onClick: onDelete,
    color: 'text-red-400'
  }];
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          {/* Bottom Sheet */}
          <motion.div ref={menuRef} initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 30,
        stiffness: 300
      }} className="fixed inset-x-0 bottom-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl max-w-md mx-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-400">
                  Plan Actions
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="text-gray-400 w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-2 mb-6">
                {menuItems.map((item, index) => {
              const Icon = item.icon;
              return <motion.button key={item.label} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: index * 0.05
              }} onClick={() => {
                item.onClick?.();
                onClose();
              }} className="w-full flex items-center gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 rounded-xl transition-colors text-left group">
                      <div className={`p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors`}>
                        <Icon className={`${item.color} w-5 h-5`} />
                      </div>
                      <span className={`text-base font-medium ${item.color}`}>
                        {item.label}
                      </span>
                    </motion.button>;
            })}
              </div>

              {/* Cancel Button */}
              <motion.button initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.3
          }} onClick={onClose} className="w-full py-4 bg-gray-800/60 hover:bg-gray-800/80 rounded-xl font-semibold text-white transition-colors">
                Cancel
              </motion.button>

              {/* Safe area padding for mobile */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}