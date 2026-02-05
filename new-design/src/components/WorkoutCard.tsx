import React from 'react';
import { Activity, Pencil, Clock, Dumbbell } from 'lucide-react';
import { Card } from './ui/Card';
import { ExerciseItem } from './ExerciseItem';
export function WorkoutCard() {
  return (
    <Card className="mb-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <Activity size={20} className="text-[#1B4B7A] mr-2" />
          <span className="text-sm font-bold tracking-wide">
            <span className="text-[#1B4B7A]">TODAY'S</span>{' '}
            <span className="text-[#C4D82E]">WORKOUT</span>
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          <Pencil size={14} />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-[#1B4B7A] mb-4">Push day</h2>

      {/* Stats */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="flex items-center text-gray-600">
          <Clock size={16} className="mr-2" />
          <span className="text-sm font-medium">13 min</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Dumbbell size={16} className="mr-2" />
          <span className="text-sm font-medium">2 exercises</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 w-full mb-6" />

      {/* Plan Section */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
          Workout Plan
        </h3>

        <div className="space-y-2">
          <ExerciseItem
            name="Leg Press"
            details="3 sets × 10 reps × 0 kg"
            image="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop" />

          <ExerciseItem
            name="Goblet Squat"
            details="3 sets × 10 reps × 0 kg"
            image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" />

        </div>
      </div>
    </Card>);

}