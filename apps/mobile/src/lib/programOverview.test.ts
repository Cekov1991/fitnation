import { describe, expect, it } from 'vitest'
import type { ProgramResource, WorkoutTemplateResource } from '@fit-nation/shared'
import {
  daysPerWeek,
  groupProgramWeeks,
  programMetaLine,
  shortWorkoutName,
  weekSummary,
  workoutMetaLine,
} from './programOverview'

let nextId = 1
function template(
  name: string,
  week: number,
  order: number,
  completed = false,
): WorkoutTemplateResource {
  const id = nextId++
  return {
    id,
    plan_id: 1,
    name,
    description: null,
    day_of_week: null,
    week_number: week,
    order_index: order,
    last_completed_session_id: completed ? 100 + id : null,
    plan: null,
    exercises: null,
    created_at: '',
    updated_at: '',
  }
}

function program(overrides: Partial<ProgramResource> = {}): ProgramResource {
  return {
    id: 1,
    user_id: 1,
    partner_id: null,
    name: 'Your Personalized Plan',
    description: null,
    cover_image: null,
    is_active: true,
    is_auto_generated: true,
    type: 'program',
    duration_weeks: 5,
    is_library_plan: false,
    progress_percentage: 0,
    next_workout: null,
    current_active_week: 1,
    workout_templates: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('groupProgramWeeks', () => {
  it('is empty for a program with no templates', () => {
    expect(groupProgramWeeks(program())).toEqual([])
    expect(groupProgramWeeks(program({ workout_templates: [] }))).toEqual([])
  })

  it('groups by week in week order and sorts each week by order_index', () => {
    const weeks = groupProgramWeeks(
      program({
        workout_templates: [
          template('Legs Day', 2, 5),
          template('Pull Day', 1, 2),
          template('Push Day', 2, 4),
          template('Push Day', 1, 0),
          template('Legs Day', 1, 1),
        ],
      }),
    )
    expect(weeks.map((w) => w.weekNumber)).toEqual([1, 2])
    expect(weeks[0].workouts.map((w) => w.name)).toEqual(['Push Day', 'Legs Day', 'Pull Day'])
    expect(weeks[1].workouts.map((w) => w.name)).toEqual(['Push Day', 'Legs Day'])
  })

  it('marks the server\'s current week, fully completed weeks as done, the rest upcoming', () => {
    const weeks = groupProgramWeeks(
      program({
        current_active_week: 2,
        workout_templates: [
          template('Push Day', 1, 0, true),
          template('Legs Day', 1, 1, true),
          template('Push Day', 2, 2, true),
          template('Legs Day', 2, 3),
          template('Push Day', 3, 4),
          template('Legs Day', 3, 5),
        ],
      }),
    )
    expect(weeks.map((w) => w.status)).toEqual(['done', 'current', 'upcoming'])
    expect(weeks.map((w) => w.completedCount)).toEqual([2, 1, 0])
  })

  it('has no current week when the program is not active', () => {
    const weeks = groupProgramWeeks(
      program({
        is_active: false,
        current_active_week: 1,
        workout_templates: [template('Push Day', 1, 0), template('Legs Day', 2, 1)],
      }),
    )
    expect(weeks.map((w) => w.status)).toEqual(['upcoming', 'upcoming'])
  })

  it('treats a missing week_number as week 1', () => {
    const t = template('Push Day', 0, 0)
    const weeks = groupProgramWeeks(program({ workout_templates: [t] }))
    expect(weeks[0].weekNumber).toBe(1)
  })
})

describe('labels', () => {
  it('shortens the generated "… Day" names and leaves others alone', () => {
    expect(shortWorkoutName('Push Day')).toBe('Push')
    expect(shortWorkoutName('Chest & Triceps Day')).toBe('Chest & Triceps')
    expect(shortWorkoutName('legs DAY')).toBe('legs')
    expect(shortWorkoutName('Day')).toBe('Day')
    expect(shortWorkoutName('Monday Session')).toBe('Monday Session')
  })

  it('summarises a collapsed week with middle dots', () => {
    const week = {
      workouts: [template('Push Day', 2, 0), template('Legs Day', 2, 1), template('Pull Day', 2, 2)],
    }
    expect(weekSummary(week)).toBe('Push · Legs · Pull')
  })

  it('reads days per week off the fullest week', () => {
    expect(daysPerWeek([])).toBe(0)
    expect(
      daysPerWeek([{ workouts: [template('a', 1, 0)] }, { workouts: [template('b', 2, 1), template('c', 2, 2)] }]),
    ).toBe(2)
  })

  it('leads the meta line with the week while active and with the length otherwise', () => {
    const weeks = groupProgramWeeks(
      program({
        current_active_week: 2,
        workout_templates: [
          template('Push Day', 1, 0),
          template('Legs Day', 1, 1),
          template('Push Day', 2, 2),
          template('Legs Day', 2, 3),
        ],
      }),
    )
    expect(programMetaLine(program({ current_active_week: 2 }), weeks)).toBe(
      'Week 2 of 5 · 4 workouts · 2 days per week',
    )
    expect(programMetaLine(program({ is_active: false }), weeks)).toBe('5 weeks · 4 workouts · 2 days per week')
    expect(programMetaLine(program({ is_active: false, duration_weeks: 1 }), [weeks[0]])).toBe(
      '1 week · 2 workouts · 2 days per week',
    )
    expect(programMetaLine(program({ is_active: false }), [])).toBe('5 weeks · 0 workouts')
  })

  it('formats a workout row and drops a zero duration', () => {
    expect(workoutMetaLine(6, 45)).toBe('6 exercises · 45 min')
    expect(workoutMetaLine(1, 0)).toBe('1 exercise')
  })
})
