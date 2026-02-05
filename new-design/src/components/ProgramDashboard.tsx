import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Pencil } from 'lucide-react';
import { DaySelector } from './program/DaySelector';
import { WorkoutStats } from './program/WorkoutStats';
import { ProgramExerciseItem } from './program/ProgramExerciseItem';
export function ProgramDashboard() {
  const [selectedDay, setSelectedDay] = useState(1);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Day Selector */}
      <div className="mb-6 -mx-1 px-1">
        <DaySelector selectedDay={selectedDay} onDaySelect={setSelectedDay} />
      </div>

      {/* Main Workout Card */}
      <Card className="relative overflow-visible">
        {/* Week Indicator */}
        <div className="text-center mb-4">
          <p className="text-[#1B4B7A] font-semibold text-xs uppercase tracking-wider">
            Week 1/5 - Foundations
          </p>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          <h2 className="text-2xl font-black italic tracking-wide mb-1">
            <span className="text-[#1B4B7A]">TODAY'S</span>{' '}
            <span className="text-[#C4D82E]">WORKOUT</span>
          </h2>
          <p className="text-gray-500 font-medium">Upper Body</p>

          <button className="absolute right-0 top-2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1B4B7A] transition-colors">
            <Pencil size={14} />
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
          <WorkoutStats />
        </div>

        {/* Exercise List */}
        <div className="space-y-5">
          <ProgramExerciseItem
            name="General Warmup"
            image="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop"
            showMenu={true} />

          <ProgramExerciseItem
            name="Dips"
            details="3 sets x 12 reps"
            image="https://images.unsplash.com/photo-1598971639058-211a74a96dd4?q=80&w=2070&auto=format&fit=crop"
            muscleArea="chest" />

          <ProgramExerciseItem
            name="Plate Loaded Single Arm Chest Supported Row"
            details="3 sets x 10-12 reps x 45 kg"
            image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
            muscleArea="back" />

          <ProgramExerciseItem
            name="Seated Dumbbell Overhead Press"
            details="4 sets x 10-12 reps x 12.5 kg"
            image="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop"
            muscleArea="shoulders" />

          <ProgramExerciseItem
            name="Post-Workout Stretch"
            image="https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=2016&auto=format&fit=crop"
            showMenu={true} />

        </div>
      </Card>

      {/* Fixed Start Button */}
      <div className="fixed bottom-24 left-0 right-0 px-5 max-w-md mx-auto z-10">
        <button className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#1B4B7A] to-[#C4D82E] text-white font-bold text-lg shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-transform flex items-center justify-center tracking-wide">
          START WORKOUT
        </button>
      </div>
    </div>);

}