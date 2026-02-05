import React from 'react';
interface DaySelectorProps {
  selectedDay: number;
  onDaySelect: (day: number) => void;
}
export function DaySelector({ selectedDay, onDaySelect }: DaySelectorProps) {
  const days = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((day) =>
      <button
        key={day}
        onClick={() => onDaySelect(day)}
        className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${selectedDay === day ? 'bg-white text-[#1B4B7A] shadow-sm ring-1 ring-gray-100' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>

          Day {day}
        </button>
      )}
    </div>);

}