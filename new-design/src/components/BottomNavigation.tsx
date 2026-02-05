import React from 'react';
import { Home, ClipboardList, BarChart2, User } from 'lucide-react';
type TabType = 'dashboard' | 'plans' | 'progress' | 'profile';
interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}
export function BottomNavigation({
  activeTab,
  onTabChange
}: BottomNavigationProps) {
  const tabs = [
  {
    id: 'dashboard' as TabType,
    icon: Home,
    label: 'Dashboard'
  },
  {
    id: 'plans' as TabType,
    icon: ClipboardList,
    label: 'Plans'
  },
  {
    id: 'progress' as TabType,
    icon: BarChart2,
    label: 'Progress'
  },
  {
    id: 'profile' as TabType,
    icon: User,
    label: 'Profile'
  }];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#F0F0F0] rounded-t-[24px] pb-6 pt-4 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) =>
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex flex-col items-center">

            <tab.icon
            size={24}
            className={`mb-1 ${activeTab === tab.id ? 'text-[#1B4B7A]' : 'text-gray-400'}`}
            strokeWidth={activeTab === tab.id ? 2.5 : 2} />

            <span
            className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-[#1B4B7A]' : 'text-gray-400'}`}>

              {tab.label}
            </span>
          </button>
        )}
      </div>
    </div>);

}