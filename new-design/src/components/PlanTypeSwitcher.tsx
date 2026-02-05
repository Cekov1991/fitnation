import React from 'react';
import { List, Flag } from 'lucide-react';
type PlanType = 'customPlans' | 'programs';
interface PlanTypeSwitcherProps {
  activeType: PlanType;
  onTypeChange: (type: PlanType) => void;
}
export function PlanTypeSwitcher({
  activeType,
  onTypeChange
}: PlanTypeSwitcherProps) {
  return (
    <div className="flex bg-gray-200 p-1 rounded-xl mb-6 relative">
      <button
        onClick={() => onTypeChange('customPlans')}
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeType === 'customPlans' ? 'bg-white text-[#1B4B7A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>

        <List size={16} />
        Custom Plans
      </button>
      <button
        onClick={() => onTypeChange('programs')}
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeType === 'programs' ? 'bg-white text-[#1B4B7A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>

        <Flag size={16} />
        Programs
      </button>
    </div>);

}