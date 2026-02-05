import React from 'react';
import { Dumbbell } from 'lucide-react';
import { QuickStartCard } from './QuickStartCard';
import { CustomPlanCard } from './CustomPlanCard';
import { CreateCustomPlanCard } from './CreateCustomPlanCard';
import { AIGeneratorCard } from './AIGeneratorCard';
export function CustomPlansDashboard() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="space-y-8">
        <QuickStartCard />

        {/* My Custom Plans Section */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-[#1B4B7A] font-bold text-lg">
              My Custom Plans
            </h2>
            <button className="text-gray-400 text-sm hover:text-[#1B4B7A] transition-colors">
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <CustomPlanCard
              name="Push Day"
              duration="45 min"
              exerciseCount={6}
              icon={<Dumbbell size={18} className="transform -rotate-45" />} />

            <CustomPlanCard
              name="Leg Day"
              duration="60 min"
              exerciseCount={8}
              icon={<Dumbbell size={18} />} />

          </div>

          <div className="grid grid-cols-2 gap-4">
            <CreateCustomPlanCard />
            {/* Placeholder for alignment or empty slot */}
            <div />
          </div>
        </div>

        <AIGeneratorCard />
      </div>
    </div>);

}