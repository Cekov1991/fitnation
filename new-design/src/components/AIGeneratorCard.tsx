import React from 'react';
import { Zap, ChevronRight } from 'lucide-react';
export function AIGeneratorCard() {
  return (
    <div className="bg-[#1B4B7A] rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden mb-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-3">
          <Zap size={16} className="text-[#C4D82E] fill-[#C4D82E]" />
          <span className="text-[#C4D82E] text-xs font-bold tracking-wider uppercase">
            Fit Nation Engine
          </span>
        </div>

        <h3 className="text-xl font-bold mb-2">Not sure what to do?</h3>
        <p className="text-blue-100/80 text-sm mb-6 leading-relaxed">
          Let our AI generate a perfect workout based on your recovery and
          goals.
        </p>

        <button className="w-full py-3 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-between transition-colors group">
          <span className="font-semibold text-sm">Generate Smart Workout</span>
          <ChevronRight
            size={16}
            className="text-white/70 group-hover:translate-x-1 transition-transform" />

        </button>
      </div>
    </div>);

}