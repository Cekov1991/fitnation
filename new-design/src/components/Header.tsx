import React from 'react';
import { Activity } from 'lucide-react';
export function Header() {
  return (
    <div className="flex flex-col items-center text-center pt-8 pb-6">
      {/* Logo Badge */}
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center mb-5">
        <div className="flex items-center justify-center text-[#1B4B7A]">
          <Activity size={16} className="mr-1" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[6px] font-bold uppercase tracking-wider">
              Acibadem Sistina
            </span>
            <span className="text-[10px] font-black uppercase tracking-tighter">
              PREMIUM
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 tracking-tight">
        <span className="text-[#1B4B7A]">Premium</span>{' '}
        <span className="text-[#C4D82E]">Sport Center</span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 text-sm font-medium">
        Welcome back, Stefan Cekov
      </p>
    </div>);

}