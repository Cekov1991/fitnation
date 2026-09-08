/**
 * How the week measures against the user's training-days goal (0031 #3).
 * Goal-comparison policy plus the copy that states it — domain, not display —
 * and byte-identical in two modals before it lived here.
 */
export function getWeeklyGoalMessage(currentWeekWorkouts: number, trainingDaysGoal: number | null | undefined): string | null {
  if (trainingDaysGoal == null || trainingDaysGoal <= 0) return null;
  if (currentWeekWorkouts > trainingDaysGoal) {
    return `You exceeded your ${trainingDaysGoal}-day goal — great week!`;
  }
  if (currentWeekWorkouts === trainingDaysGoal) {
    return `You hit your ${trainingDaysGoal}-day goal this week`;
  }
  return `${currentWeekWorkouts} of ${trainingDaysGoal} day${trainingDaysGoal !== 1 ? 's' : ''} done — finish strong!`;
}
