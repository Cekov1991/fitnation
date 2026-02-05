import React from 'react';
import { Zap, Clock, Flame } from 'lucide-react';
export function WorkoutStats() {
  return (
    <div className="flex items-center justify-center space-x-6 text-sm">
      <div className="flex items-center text-gray-600">
        <Zap size={16} className="text-[#1B4B7A] mr-1.5 fill-current" />
        <span className="font-medium">5 Exercises</span>
      </div>
      <div className="flex items-center text-gray-600">
        <Clock size={16} className="text-[#1B4B7A] mr-1.5" />
        <span className="font-medium">37 Min</span>
      </div>
      <div className="flex items-center text-gray-600">
        <Flame size={16} className="text-[#1B4B7A] mr-1.5 fill-current" />
        <span className="font-medium">179 Cal</span>
      </div>
    </div>);

}