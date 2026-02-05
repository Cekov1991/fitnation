import React from 'react';
import { MoreHorizontal, User } from 'lucide-react';
interface ProgramExerciseItemProps {
  name: string;
  details?: string;
  image: string;
  showMenu?: boolean;
  muscleArea?: string;
}
export function ProgramExerciseItem({
  name,
  details,
  image,
  showMenu = false,
  muscleArea
}: ProgramExerciseItemProps) {
  return (
    <div className="flex items-center bg-white rounded-xl overflow-hidden py-1">
      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="ml-4 flex-1 min-w-0 pr-2">
        <h4 className="font-bold text-[#1B4B7A] text-sm mb-1 leading-tight line-clamp-2">
          {name}
        </h4>
        {details &&
        <p className="text-xs text-gray-500 font-medium">{details}</p>
        }
      </div>
      <div className="flex-shrink-0 ml-2">
        {showMenu ?
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#1B4B7A]">
            <MoreHorizontal size={20} />
          </button> :

        <div className="w-8 h-8 rounded-full bg-[#1B4B7A]/10 flex items-center justify-center text-[#1B4B7A]">
            <User size={14} />
          </div>
        }
      </div>
    </div>);

}