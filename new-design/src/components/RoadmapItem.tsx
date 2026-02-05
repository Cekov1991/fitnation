import React from 'react';
import { Check, Lock, Circle } from 'lucide-react';
export type RoadmapStatus = 'completed' | 'current' | 'upcoming';
interface RoadmapItemProps {
  dayNumber: number;
  title: string;
  status: RoadmapStatus;
  isLast?: boolean;
}
export function RoadmapItem({
  dayNumber,
  title,
  status,
  isLast
}: RoadmapItemProps) {
  return (
    <div className="flex relative">
      {/* Timeline Line */}
      {!isLast &&
      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100" />
      }

      {/* Indicator */}
      <div className="flex-shrink-0 mr-4 relative z-10">
        {status === 'completed' &&
        <div className="w-8 h-8 rounded-full bg-[#C4D82E] flex items-center justify-center text-[#1B4B7A]">
            <Check size={16} strokeWidth={3} />
          </div>
        }
        {status === 'current' &&
        <div className="w-8 h-8 rounded-full border-[3px] border-[#1B4B7A] bg-white flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1B4B7A]" />
          </div>
        }
        {status === 'upcoming' &&
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-300">
            <span className="text-[10px] font-bold">{dayNumber}</span>
          </div>
        }
      </div>

      {/* Content */}
      <div className="pb-8 pt-1">
        <h4
          className={`text-sm font-bold mb-0.5 ${status === 'upcoming' ? 'text-gray-400' : 'text-[#1B4B7A]'}`}>

          Day {dayNumber}
        </h4>
        <p
          className={`text-base font-medium ${status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'}`}>

          {title}
        </p>
      </div>
    </div>);

}