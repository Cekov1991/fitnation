import { useCallback, useMemo, useState } from 'react';

export type ExercisePickerMode = 'add' | 'swap';

/**
 * The session screen's presentation state — which menu, picker or confirm is
 * open, and which set a menu is about (0030). It used to share one object
 * with the session's domain state and travel through a 32-prop pass-through
 * component; now it belongs to the page that renders the dialogs.
 */
export function useSessionDialogs() {
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [showSetMenu, setShowSetMenu] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercisePickerMode, setExercisePickerMode] = useState<ExercisePickerMode>('add');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const openSetMenu = useCallback((setId: string) => {
    setSelectedSetId(setId);
    setShowSetMenu(true);
  }, []);
  const closeSetMenu = useCallback(() => {
    setShowSetMenu(false);
    setSelectedSetId(null);
  }, []);
  const openExercisePicker = useCallback((mode: ExercisePickerMode) => {
    setShowExerciseMenu(false);
    setExercisePickerMode(mode);
    setShowExercisePicker(true);
  }, []);

  return useMemo(
    () => ({
      showExerciseMenu,
      setShowExerciseMenu,
      showSetMenu,
      selectedSetId,
      openSetMenu,
      closeSetMenu,
      showExercisePicker,
      setShowExercisePicker,
      exercisePickerMode,
      openExercisePicker,
      showCancelConfirm,
      setShowCancelConfirm,
      showFinishConfirm,
      setShowFinishConfirm,
    }),
    [showExerciseMenu, showSetMenu, selectedSetId, openSetMenu, closeSetMenu, showExercisePicker, exercisePickerMode, openExercisePicker, showCancelConfirm, showFinishConfirm]
  );
}

export type SessionDialogs = ReturnType<typeof useSessionDialogs>;
