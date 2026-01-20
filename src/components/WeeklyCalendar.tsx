import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useCalendar } from '../hooks/useApi';
import { WEEKDAY_LABELS } from '../constants';
import { useReducedMotion } from '../hooks/useReducedMotion';
interface DayStatus {
  day: string;
  date: number;
  progress: number; // 0-100
  isToday?: boolean;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}
export function WeeklyCalendar() {
  const shouldReduceMotion = useReducedMotion();
  // Calculate today only once when component mounts
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => getWeekStart(today), [today]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const {
    data: calendar
  } = useCalendar(formatDate(weekStart), formatDate(weekEnd));

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, {
      completed: boolean;
    }>();
    if (calendar?.sessions) {
      calendar.sessions.forEach(session => {
        map.set(session.date, {
          completed: session.completed
        });
      });
    }
    return map;
  }, [calendar]);

  const weekData = useMemo<DayStatus[]>(() => {
    return Array.from({
      length: 7
    }).map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const formatted = formatDate(date);
      const session = sessionsByDate.get(formatted);
      const progress = session ? session.completed ? 100 : 50 : 0;
      return {
        day: WEEKDAY_LABELS[index],
        date: date.getDate(),
        progress,
        isToday: formatDate(date) === formatDate(today)
      };
    });
  }, [sessionsByDate, today, weekStart]);
  return <div 
    className="w-full   border rounded-3xl p-6 mb-6"
    style={{ 
      backgroundColor: 'var(--color-bg-surface)',
      borderColor: 'var(--color-border-subtle)'
    }}
  >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>This Week</h2>
        <button className="btn-icon">
          <CalendarIcon size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {weekData.map((item, index) => <div key={index} className="flex flex-col items-center gap-3">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {item.day}
            </span>
            <span 
              className="text-sm font-bold"
              style={{ color: item.isToday ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
            >
              {item.date}
            </span>

            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Background Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="20" 
                  cy="20" 
                  r="16" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  fill="transparent"
                  style={{ color: 'var(--color-border-subtle)' }}
                />
                {/* Progress Ring */}
                {item.progress > 0 && <motion.circle 
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
                  style={{ color: 'var(--color-primary)' }}
                />}
              </svg>

              {/* Today Indicator or Empty State */}
              {item.isToday && <div 
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 0 10px color-mix(in srgb, var(--color-primary) 50%, transparent)'
            }}
          />}
            </div>
          </div>)}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Ready to crush this week?{' '}
          <span style={{ color: 'var(--color-primary)' }}>Start your first workout!</span>
        </p>
      </div>
    </div>;
}