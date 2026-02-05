import React, { useState } from 'react';
import { Info, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgramWeekCard } from './ProgramWeekCard';
export function ProgramPlansView() {
  const [isExpanded, setIsExpanded] = useState(false);
  const weeks = [
  {
    number: 1,
    title: 'Foundations',
    color: '#1B4B7A',
    isActive: true
  },
  {
    number: 2,
    title: 'Load',
    color: '#C4D82E',
    isActive: false
  },
  {
    number: 3,
    title: 'Pre-Peak',
    color: '#EF4444',
    isActive: false
  },
  {
    number: 4,
    title: 'Peak',
    color: '#EF4444',
    isActive: false
  },
  {
    number: 5,
    title: 'Deload',
    color: '#10B981',
    isActive: false
  }];

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
                5 Days, Upper/Lower Split
              </h3>
              <p className="text-gray-500 text-sm">
                Progressive overload program
              </p>
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1B4B7A] transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <span className="px-4 py-1.5 rounded-full bg-[#1B4B7A]/10 text-[#1B4B7A] text-xs font-bold uppercase tracking-wider">
              5 Weeks
            </span>
            <span className="px-4 py-1.5 rounded-full bg-[#C4D82E]/20 text-[#C4D82E] text-xs font-bold uppercase tracking-wider">
              Active
            </span>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors mb-4">

            <span className="text-sm font-semibold text-[#1B4B7A]">
              {isExpanded ? 'Hide' : 'View'} Program Details
            </span>
            {isExpanded ?
            <ChevronUp size={18} className="text-[#1B4B7A]" /> :

            <ChevronDown size={18} className="text-[#1B4B7A]" />
            }
          </button>

          {/* Collapsible Timeline with weeks */}
          {isExpanded &&
          <div className="relative animate-in slide-in-from-top-2 duration-300">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-8 bottom-8 w-0.5 bg-gray-200" />

              {/* Week cards */}
              <div className="space-y-4 relative">
                {weeks.map((week) =>
              <div key={week.number} className="flex items-start">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-6 mr-4">
                      <div
                    className={`w-5 h-5 rounded-full border-2 ${week.isActive ? 'bg-[#1B4B7A] border-[#1B4B7A]' : 'bg-white border-gray-300'}`} />

                    </div>

                    {/* Week card */}
                    <div className="flex-1">
                      <ProgramWeekCard
                    weekNumber={week.number}
                    title={week.title}
                    days={[1, 2, 3, 4, 5]}
                    isActive={week.isActive}
                    accentColor={week.color} />

                    </div>
                  </div>
              )}
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
          <p className="text-gray-400 text-sm">No other programs yet.</p>
        </div>
      </div>

      {/* Create New Button */}
      <button className="w-full h-14 rounded-2xl bg-[#1B4B7A] text-white font-bold text-base shadow-lg active:scale-[0.98] transition-transform uppercase tracking-wide">
        Create New
      </button>
    </>);

}