import React from 'react';
import { Plus, Play } from 'lucide-react';
import { Card } from './ui/Card';
export function QuickStartCard() {
  return (
    <Card className="mb-8 relative overflow-hidden">
      {/* Background decoration - subtle gradient or shape if needed, keeping it clean for now */}

      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-bold text-[#1B4B7A]">Quick Start</h2>
          <p className="text-gray-500 text-sm mt-1">
            Start a blank session without a plan
          </p>
        </div>
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
          <Plus size={18} />
        </button>
      </div>

      <button className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-[#F4D03F] to-[#C4D82E] flex items-center justify-center text-[#1B4B7A] font-bold text-base shadow-sm active:scale-[0.98] transition-transform">
        <Play size={18} className="mr-2 fill-[#1B4B7A]" />
        Start Blank Session
      </button>
    </Card>);

}