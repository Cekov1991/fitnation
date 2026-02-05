import React from 'react';
import { Card } from './ui/Card';
import { Map } from 'lucide-react';
import { RoadmapItem } from './RoadmapItem';
export function ProgramRoadmap() {
  const roadmapData = [
  {
    day: 13,
    title: 'Rest Day',
    status: 'upcoming' as const
  },
  {
    day: 14,
    title: 'Lower Body Power',
    status: 'upcoming' as const
  },
  {
    day: 15,
    title: 'Core & Cardio',
    status: 'upcoming' as const
  }];

  return (
    <Card className="mb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1B4B7A]">Roadmap</h2>
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          <Map size={20} />
        </div>
      </div>

      <div className="pl-2">
        {roadmapData.map((item, index) =>
        <RoadmapItem
          key={item.day}
          dayNumber={item.day}
          title={item.title}
          status={item.status}
          isLast={index === roadmapData.length - 1} />

        )}
      </div>
    </Card>);

}