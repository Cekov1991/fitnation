import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PlanTypeSwitcher } from './PlanTypeSwitcher';
import { CustomPlansView } from './plans/CustomPlansView';
import { ProgramPlansView } from './plans/ProgramPlansView';
export function PlansPage() {
  const [planType, setPlanType] = useState<'customPlans' | 'programs'>(
    'customPlans'
  );
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center pt-8 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-[#1B4B7A]">Pl</span>
          <span className="text-[#C4D82E]">ans</span>
        </h1>
        <button className="w-12 h-12 rounded-full bg-[#1B4B7A]/10 flex items-center justify-center text-[#1B4B7A] hover:bg-[#1B4B7A]/20 transition-colors">
          <Plus size={24} />
        </button>
      </div>

      {/* Plan Type Switcher */}
      <PlanTypeSwitcher activeType={planType} onTypeChange={setPlanType} />

      {/* Conditional content based on plan type */}
      {planType === 'customPlans' ? <CustomPlansView /> : <ProgramPlansView />}
    </div>);

}