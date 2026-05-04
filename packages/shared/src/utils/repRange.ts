export function formatRepRange(minReps: number, maxReps: number): string {
  return minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;
}
