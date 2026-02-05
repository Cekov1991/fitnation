import React from 'react';
import { Calendar } from 'lucide-react';
import { Card } from './ui/Card';
export function WeekCalendar() {
  const days = [
  {
    day: 'M',
    date: 2
  },
  {
    day: 'T',
    date: 3,
    active: true
  },
  {
    day: 'W',
    date: 4
  },
  {
    day: 'T',
    date: 5
  },
  {
    day: 'F',
    date: 6
  },
  {
    day: 'S',
    date: 7
  },
  {
    day: 'S',
    date: 8
  }];

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1B4B7A]">This Week</h2>
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          <Calendar size={20} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {/* Days Row */}
        {days.map((item, index) =>
        <div
          key={`day-${index}`}
          className="text-xs font-medium text-gray-400 mb-2">

            {item.day}
          </div>
        )}

        {/* Dates Row */}
        {days.map((item, index) =>
        <div
          key={`date-${index}`}
          className="text-sm font-bold text-gray-800 mb-3">

            {item.date}
          </div>
        )}

        {/* Indicators Row */}
        {days.map((item, index) =>
        <div
          key={`indicator-${index}`}
          className="flex justify-center items-center h-8">

            {item.active ?
          <div className="w-8 h-8 rounded-full border-[3px] border-[#1B4B7A] flex items-center justify-center">
                <div className="w-2 h-2 bg-[#1B4B7A] rounded-full" />
              </div> :

          <div className="w-8 h-8 rounded-full border border-gray-100 bg-gray-50" />
          }
          </div>
        )}
      </div>
    </Card>);

}