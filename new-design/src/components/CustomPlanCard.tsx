import React from 'react';
import { Clock, Dumbbell } from 'lucide-react';
interface CustomPlanCardProps {
  name: string;
  duration: string;
  exerciseCount: number;
  icon?: React.ReactNode;
}
export function CustomPlanCard({
  name,
  duration,
  exerciseCount,
  icon
}: CustomPlanCardProps) {
  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm flex flex-col h-full">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1B4B7A] mb-4">
        {icon || <Dumbbell size={18} />}
      </div>

      <h3 className="text-lg font-bold text-[#1B4B7A] mb-3">{name}</h3>

      <div className="flex items-center text-gray-500 text-xs font-medium space-x-3 mt-auto">
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          <span>{duration}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center">
          <span>{exerciseCount} Ex</span>
        </div>
      </div>
    </div>);

}