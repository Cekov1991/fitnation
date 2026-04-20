import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalsState {
  isStrengthModalOpen: boolean;
  isBalanceModalOpen: boolean;
  isProgressModalOpen: boolean;
  isWorkoutSelectionOpen: boolean;
}

interface ModalsContextType extends ModalsState {
  openStrengthModal: () => void;
  closeStrengthModal: () => void;
  openBalanceModal: () => void;
  closeBalanceModal: () => void;
  openProgressModal: () => void;
  closeProgressModal: () => void;
  openWorkoutSelection: () => void;
  closeWorkoutSelection: () => void;
}

const ModalsContext = createContext<ModalsContextType | undefined>(undefined);

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalsState>({
    isStrengthModalOpen: false,
    isBalanceModalOpen: false,
    isProgressModalOpen: false,
    isWorkoutSelectionOpen: false,
  });

  const value: ModalsContextType = {
    ...state,
    openStrengthModal: () => setState(s => ({ ...s, isStrengthModalOpen: true })),
    closeStrengthModal: () => setState(s => ({ ...s, isStrengthModalOpen: false })),
    openBalanceModal: () => setState(s => ({ ...s, isBalanceModalOpen: true })),
    closeBalanceModal: () => setState(s => ({ ...s, isBalanceModalOpen: false })),
    openProgressModal: () => setState(s => ({ ...s, isProgressModalOpen: true })),
    closeProgressModal: () => setState(s => ({ ...s, isProgressModalOpen: false })),
    openWorkoutSelection: () => setState(s => ({ ...s, isWorkoutSelectionOpen: true })),
    closeWorkoutSelection: () => setState(s => ({ ...s, isWorkoutSelectionOpen: false })),
  };

  return (
    <ModalsContext.Provider value={value}>
      {children}
    </ModalsContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalsContext);
  if (!context) {
    throw new Error('useModals must be used within ModalsProvider');
  }
  return context;
}
