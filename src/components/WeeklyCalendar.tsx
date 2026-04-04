import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useCalendar } from '../hooks/useApi';
import { WEEKDAY_LABELS } from '../constants';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { formatCalendarDateKey, formatWeekRangeLabel } from '../utils/calendarWeek';
import type { WorkoutSessionCalendarResource } from '../types/api';

interface DayStatus {
  day: string;
  date: number;
  dateKey: string;
  progress: number;
  isToday?: boolean;
  isCompleted: boolean;
  sessions: WorkoutSessionCalendarResource[];
}

export interface WeeklyCalendarProps {
  /** Stable “today” for this visit (dot on calendar, default selection) */
  weekAnchor: Date;
  /** Monday 00:00 of the week being shown (from URL `week` + parent) */
  weekStartMonday: Date;
  /** True when `weekStartMonday` is the same week as `weekAnchor` */
  isCurrentWeek: boolean;
  /** Selected day `YYYY-MM-DD` (controlled; synced with URL `date`) */
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onWeekShift: (direction: 'prev' | 'next') => void;
  onSessionClick?: (sessionId: number) => void;
}

function formatDayHeading(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function WeeklyCalendar({
  weekAnchor,
  weekStartMonday,
  isCurrentWeek,
  selectedDateKey,
  onSelectDate,
  onWeekShift,
  onSessionClick,
}: WeeklyCalendarProps) {
  const shouldReduceMotion = useReducedMotion();
  const weekEnd = useMemo(() => {
    const end = new Date(weekStartMonday);
    end.setDate(weekStartMonday.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStartMonday]);

  const { data: calendar } = useCalendar(
    formatCalendarDateKey(weekStartMonday),
    formatCalendarDateKey(weekEnd)
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSessionCalendarResource[]>();
    if (calendar?.sessions) {
      calendar.sessions.forEach((session: WorkoutSessionCalendarResource) => {
        const list = map.get(session.date) ?? [];
        list.push(session);
        map.set(session.date, list);
      });
      map.forEach((list) => {
        list.sort((a, b) => b.id - a.id);
      });
    }
    return map;
  }, [calendar]);

  const todayKey = formatCalendarDateKey(weekAnchor);

  const weekData = useMemo<DayStatus[]>(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(weekStartMonday);
      date.setDate(weekStartMonday.getDate() + index);
      const dateKey = formatCalendarDateKey(date);
      const sessions = sessionsByDate.get(dateKey) ?? [];
      let progress = 0;
      if (sessions.length > 0) {
        const sum = sessions.reduce((acc, s) => acc + (s.completed ? 100 : 50), 0);
        progress = sum / sessions.length;
      }
      const allCompleted = sessions.length > 0 && sessions.every((s) => s.completed);
      return {
        day: WEEKDAY_LABELS[index],
        date: date.getDate(),
        dateKey,
        progress,
        isToday: dateKey === todayKey,
        sessions,
        isCompleted: allCompleted,
      };
    });
  }, [sessionsByDate, todayKey, weekStartMonday]);

  const selectedSessions = sessionsByDate.get(selectedDateKey) ?? [];

  return (
    <div
      className="mb-6 w-full rounded-3xl border p-6"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onWeekShift('prev')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2
          className="min-w-0 flex-1 text-center text-base font-semibold leading-tight sm:text-lg"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {isCurrentWeek ? 'This week' : formatWeekRangeLabel(weekStartMonday)}
        </h2>
        <button
          type="button"
          onClick={() => onWeekShift('next')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Next week"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {weekData.map((item, index) => {
          const hasSession = item.sessions.length > 0;
          const isSelected = selectedDateKey === item.dateKey;
          return (
            <div key={index} className="flex flex-col items-center gap-3">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {item.day}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: item.isToday ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
              >
                {item.date}
              </span>

              <button
                type="button"
                onClick={() => onSelectDate(item.dateKey)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-transform ${
                  hasSession ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-pointer hover:opacity-90'
                } ${
                  isSelected
                    ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                    : ''
                }`}
                aria-label={`${item.day} ${item.date}${hasSession ? `, ${item.sessions.length} workout(s)` : ', no workouts'}`}
                aria-pressed={isSelected}
              >
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    style={{ color: 'var(--color-border-subtle)' }}
                  />
                  {item.progress > 0 && (
                    <motion.circle
                      initial={{ pathLength: shouldReduceMotion ? item.progress / 100 : 0 }}
                      animate={{ pathLength: item.progress / 100 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeLinecap="round"
                      style={{
                        color: item.isCompleted ? 'var(--color-primary)' : '#fbbf24',
                      }}
                    />
                  )}
                </svg>

                {item.isToday && (
                  <div
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      boxShadow: '0 0 10px color-mix(in srgb, var(--color-primary) 50%, transparent)',
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatDayHeading(selectedDateKey)}
        </h3>
        {selectedSessions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No workouts logged on this day.
          </p>
        ) : (
          <ul className="space-y-3">
            {selectedSessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => onSessionClick?.(session.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: session.completed
                        ? 'color-mix(in srgb, var(--color-primary) 18%, transparent)'
                        : 'color-mix(in srgb, #fbbf24 18%, transparent)',
                    }}
                  >
                    {session.completed ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                    ) : (
                      <Circle className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {session.workout_name?.trim() || 'Workout'}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <span>{session.completed ? 'Completed' : 'In progress'}</span>
                      {formatDuration(session.duration_minutes) ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatDuration(session.duration_minutes)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
