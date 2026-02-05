import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-[24px] shadow-sm p-6 ${className}`}>
      {children}
    </div>);

}