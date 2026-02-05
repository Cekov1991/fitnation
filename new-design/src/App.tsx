import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { PlanTypeSwitcher } from './components/PlanTypeSwitcher';
import { CustomPlansDashboard } from './components/CustomPlansDashboard';
import { ProgramDashboard } from './components/ProgramDashboard';
import { PlansPage } from './components/PlansPage';
type TabType = 'dashboard' | 'plans' | 'progress' | 'profile';
export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [planType, setPlanType] = useState<'customPlans' | 'programs'>(
    'customPlans'
  );
  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-gray-900 pb-24">
      <div className="max-w-md mx-auto px-5">
        {activeTab === 'dashboard' &&
        <>
            <Header />
            <PlanTypeSwitcher
            activeType={planType}
            onTypeChange={setPlanType} />

            {planType === 'customPlans' ?
          <CustomPlansDashboard /> :

          <ProgramDashboard />
          }
          </>
        }

        {activeTab === 'plans' && <PlansPage />}

        {activeTab === 'progress' &&
        <div className="pt-8">
            <h1 className="text-2xl font-bold text-[#1B4B7A] mb-4">Progress</h1>
            <p className="text-gray-500">Progress tracking coming soon...</p>
          </div>
        }

        {activeTab === 'profile' &&
        <div className="pt-8">
            <h1 className="text-2xl font-bold text-[#1B4B7A] mb-4">Profile</h1>
            <p className="text-gray-500">Profile settings coming soon...</p>
          </div>
        }
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>);

}