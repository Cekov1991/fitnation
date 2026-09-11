import type { ProgramResource, WorkoutTemplateResource } from '@fit-nation/shared'

/**
 * The pure view-model behind the Program Details screen: a program's templates
 * grouped into weeks, each week's standing, and the strings the collapsed
 * week rows and the summary card show. Kept out of the component so the
 * grouping and the labels can be tested under node.
 */

export type WeekStatus = 'current' | 'done' | 'upcoming'

export interface ProgramWeek {
  weekNumber: number
  workouts: WorkoutTemplateResource[]
  status: WeekStatus
  completedCount: number
}

export function isWorkoutCompleted(workout: Pick<WorkoutTemplateResource, 'last_completed_session_id'>): boolean {
  return workout.last_completed_session_id != null
}

/**
 * Group a program's templates by week, in week order, each week's workouts in
 * order_index order. The current week is the server's `current_active_week`
 * (only while the program is active); a week is `done` when every workout in
 * it has a completed session; everything else is `upcoming`.
 */
export function groupProgramWeeks(program: ProgramResource): ProgramWeek[] {
  const templates = program.workout_templates ?? []
  if (templates.length === 0) return []

  const byWeek = new Map<number, WorkoutTemplateResource[]>()
  for (const template of templates) {
    const week = template.week_number || 1
    const list = byWeek.get(week)
    if (list) list.push(template)
    else byWeek.set(week, [template])
  }

  const currentWeek = program.is_active ? program.current_active_week ?? 1 : null

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, workouts]) => {
      const sorted = [...workouts].sort((a, b) => a.order_index - b.order_index)
      const completedCount = sorted.filter(isWorkoutCompleted).length
      const status: WeekStatus =
        weekNumber === currentWeek
          ? 'current'
          : completedCount === sorted.length
          ? 'done'
          : 'upcoming'
      return { weekNumber, workouts: sorted, status, completedCount }
    })
}

/**
 * "Push Day" → "Push": the generated names all end in " Day", which reads as
 * noise when four of them sit on one line. Any other name is left alone.
 */
export function shortWorkoutName(name: string): string {
  const trimmed = name.trim()
  return trimmed.replace(/\s+day$/i, '') || trimmed
}

/** The one-line summary of a collapsed week: "Push · Legs · Pull · Legs". */
export function weekSummary(week: Pick<ProgramWeek, 'workouts'>): string {
  return week.workouts.map((w) => shortWorkoutName(w.name || 'Workout')).join(' · ')
}

/** The largest number of workouts in any one week — what "days per week" means for a program. */
export function daysPerWeek(weeks: Array<Pick<ProgramWeek, 'workouts'>>): number {
  return weeks.reduce((max, week) => Math.max(max, week.workouts.length), 0)
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/**
 * The summary card's meta line. An active program leads with where the user
 * is ("Week 2 of 5"); one that is not running leads with its length.
 */
export function programMetaLine(
  program: Pick<ProgramResource, 'is_active' | 'duration_weeks' | 'current_active_week'>,
  weeks: Array<Pick<ProgramWeek, 'workouts'>>,
): string {
  const totalWeeks = program.duration_weeks ?? weeks.length
  const workoutCount = weeks.reduce((sum, week) => sum + week.workouts.length, 0)
  const days = daysPerWeek(weeks)

  const parts = [
    program.is_active ? `Week ${program.current_active_week ?? 1} of ${totalWeeks}` : plural(totalWeeks, 'week'),
    plural(workoutCount, 'workout'),
  ]
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'} per week`)
  return parts.join(' · ')
}

/** "6 exercises · 45 min", dropping the duration when there is nothing to estimate from. */
export function workoutMetaLine(exerciseCount: number, minutes: number): string {
  const parts = [plural(exerciseCount, 'exercise')]
  if (minutes > 0) parts.push(`${minutes} min`)
  return parts.join(' · ')
}
