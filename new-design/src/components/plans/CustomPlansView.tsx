import React, { useState } from 'react';
import {
  Info,
  MoreVertical,
  Dumbbell,
  ChevronDown,
  ChevronUp } from
'lucide-react';
import { Card } from '../ui/Card';
export function CustomPlansView() {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      {/* Active Plan Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-[#1B4B7A] font-bold text-sm uppercase tracking-wider">
            Active Plan
          </h2>
          <button className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <Info size={14} />
          </button>
        </div>

        <Card className="relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                My first custom plan
              </h3>
              <p className="text-gray-500 text-sm">
                Create a plan to get started.
              </p>
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1B4B7A] transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <span className="px-4 py-1.5 rounded-full bg-[#1B4B7A]/10 text-[#1B4B7A] text-xs font-bold uppercase tracking-wider">
              1 Workout
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#C4D82E]/20 text-[#C4D82E] text-xs font-bold uppercase tracking-wider">
              Active
            </span>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">

            <span className="text-sm font-semibold text-[#1B4B7A]">
              {isExpanded ? 'Hide' : 'View'} Workouts
            </span>
            {isExpanded ?
            <ChevronUp size={18} className="text-[#1B4B7A]" /> :

            <ChevronDown size={18} className="text-[#1B4B7A]" />
            }
          </button>

          {/* Collapsible Workout List */}
          {isExpanded &&
          <div className="border-t border-gray-100 pt-4 mt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1B4B7A] mr-4">
                  <Dumbbell size={18} />
                </div>
                <span className="font-semibold text-gray-900">Push day</span>
                <button className="ml-auto w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          }
        </Card>
      </div>

      {/* All Plans Section */}
      <div className="mb-6">
        <h2 className="text-[#1B4B7A] font-bold text-sm uppercase tracking-wider mb-4">
          All Plans
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No other custom plans yet.</p>
        </div>
      </div>

      {/* Create New Button */}
      <button className="w-full h-14 rounded-2xl bg-[#1B4B7A] text-white font-bold text-base shadow-lg active:scale-[0.98] transition-transform uppercase tracking-wide">
        Create New
      </button>
    </>);

}