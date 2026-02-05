import React from 'react';
interface ProgramWeekCardProps {
  weekNumber: number;
  title: string;
  days: number[];
  isActive?: boolean;
  accentColor?: string;
}
export function ProgramWeekCard({
  weekNumber,
  title,
  days,
  isActive = false,
  accentColor = '#1B4B7A'
}: ProgramWeekCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all ${isActive ? 'bg-white border-2 border-[#1B4B7A] shadow-md' : 'bg-white/50 border-2 border-transparent'}`}>

      <div className="flex items-center mb-4">
        <div
          className="w-1 h-6 rounded-full mr-3"
          style={{
            backgroundColor: accentColor
          }} />

        <h3 className="font-bold text-gray-900">
          Week {weekNumber} - {title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((day) =>
        <button
          key={day}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive && day === 1 ? 'bg-[#1B4B7A] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>

            Day {day}
          </button>
        )}
      </div>
    </div>);

}