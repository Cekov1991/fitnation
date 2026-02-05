import React from 'react';
import { Plus } from 'lucide-react';
export function CreateCustomPlanCard() {
  return (
    <button className="bg-white rounded-[24px] p-5 shadow-sm flex flex-col items-center justify-center h-full min-h-[140px] w-full border-2 border-dashed border-gray-100 hover:border-[#C4D82E] hover:bg-gray-50 transition-all group">
      <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center text-gray-400 group-hover:text-[#C4D82E] mb-3 transition-colors">
        <Plus size={24} />
      </div>
      <span className="text-gray-400 font-medium text-sm group-hover:text-gray-600">
        Create New
      </span>
    </button>);

}