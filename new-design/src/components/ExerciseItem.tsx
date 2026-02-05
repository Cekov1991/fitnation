import React from 'react';
interface ExerciseItemProps {
  name: string;
  details: string;
  image: string;
}
export function ExerciseItem({ name, details, image }: ExerciseItemProps) {
  return (
    <div className="flex items-center bg-white rounded-xl overflow-hidden mb-4 last:mb-0">
      <div className="w-20 h-16 flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-xl" />

      </div>
      <div className="ml-4 flex flex-col justify-center">
        <h4 className="font-bold text-[#1B4B7A] text-sm mb-1">{name}</h4>
        <p className="text-xs text-gray-500 font-medium">{details}</p>
      </div>
    </div>);

}