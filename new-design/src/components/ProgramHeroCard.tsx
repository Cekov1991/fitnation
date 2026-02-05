import React from 'react';
import { Card } from './ui/Card';
import { ProgressRing } from './ProgressRing';
import { Play } from 'lucide-react';
export function ProgramHeroCard() {
  const currentDay = 12;
  const totalDays = 30;
  const progress = currentDay / totalDays * 100;
  return (
    <Card className="mb-6 flex flex-col items-center text-center">
      <h2 className="text-xl font-bold text-[#1B4B7A] mb-6">
        Summer Shred Program
      </h2>

      <div className="mb-4">
        <ProgressRing progress={progress} size={140} strokeWidth={10} />
      </div>

      <p className="text-gray-500 font-medium mb-8">
        <span className="text-[#1B4B7A] font-bold">{currentDay}</span> of{' '}
        {totalDays} Days
      </p>

      <button className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#1B4B7A] to-[#C4D82E] text-white font-bold text-lg shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-transform flex items-center justify-center">
        <Play size={20} className="mr-2 fill-current" />
        Start Day {currentDay}: Upper Body
      </button>
    </Card>);

}