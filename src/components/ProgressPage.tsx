import { useMemo, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { StrengthScoreModal } from './StrengthScoreModal';
import { BalanceModal } from './BalanceModal';
import { WeeklyProgressModal } from './WeeklyProgressModal';
import { WeeklyCalendar } from './WeeklyCalendar';
import { ProgressMetricsSkeleton } from './ProgressPageSkeleton';
import { useFitnessMetrics } from '../hooks/useApi';
import { useModals } from '../contexts/ModalsContext';
import {
  formatCalendarDateKey,
  getWeekStartMonday,
  resolveCalendarDateFromSearch,
  resolveWeekStartFromSearch,
  isValidCalendarDateKey,
  isDateKeyInWeek,
  pickDefaultDateInWeek,
  calendarDateKeyToDate,
  addDaysToCalendarDateKey,
} from '../utils/calendarWeek';

type ProgressTab = 'calendar' | 'metrics';

export function ProgressPage() {
  const history = useHistory();
  const location = useLocation();

  /** Frozen mount date (“today” for this visit); week grid can move via `week` query */
  const weekAnchor = useMemo(() => new Date(), []);
  const weekStartDisplay = useMemo(
    () => resolveWeekStartFromSearch(location.search, weekAnchor),
    [location.search, weekAnchor]
  );

  const progressTab = useMemo((): ProgressTab => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type === 'metrics' || type === 'calendar') {
      return type;
    }
    return 'calendar';
  }, [location.search]);

  const handleProgressTabChange = (tab: ProgressTab) => {
    const params = new URLSearchParams(location.search);
    params.set('type', tab);
    history.push({ pathname: location.pathname, search: params.toString() });
  };

  const selectedCalendarDate = useMemo(
    () => resolveCalendarDateFromSearch(location.search, weekStartDisplay, weekAnchor),
    [location.search, weekStartDisplay, weekAnchor]
  );

  const isCalendarCurrentWeek = useMemo(
    () =>
      formatCalendarDateKey(getWeekStartMonday(weekAnchor)) ===
      formatCalendarDateKey(weekStartDisplay),
    [weekAnchor, weekStartDisplay]
  );

  /**
   * Canonicalize `week` (Monday YYYY-MM-DD) + `date` (within that week).
   * Ensures first load, week change, and back-navigation always have a consistent query.
   */
  useEffect(() => {
    if (progressTab !== 'calendar') return;
    const weekStartResolved = resolveWeekStartFromSearch(location.search, weekAnchor);
    const weekKey = formatCalendarDateKey(weekStartResolved);
    const rawDate = new URLSearchParams(location.search).get('date');
    const dateKey =
      rawDate && isValidCalendarDateKey(rawDate) && isDateKeyInWeek(rawDate, weekStartResolved)
        ? rawDate
        : pickDefaultDateInWeek(weekStartResolved, weekAnchor);

    const next = new URLSearchParams(location.search);
    let dirty = false;
    if (next.get('week') !== weekKey) {
      next.set('week', weekKey);
      dirty = true;
    }
    if (next.get('date') !== dateKey) {
      next.set('date', dateKey);
      dirty = true;
    }
    if (next.get('type') !== 'calendar') {
      next.set('type', 'calendar');
      dirty = true;
    }
    if (dirty) {
      history.replace({ pathname: location.pathname, search: next.toString() });
    }
  }, [progressTab, location.search, location.pathname, history, weekAnchor]);

  const handleSelectCalendarDate = useCallback(
    (dateKey: string) => {
      const d = calendarDateKeyToDate(dateKey);
      if (!d) return;
      const params = new URLSearchParams(location.search);
      params.set('type', 'calendar');
      params.set('week', formatCalendarDateKey(getWeekStartMonday(d)));
      params.set('date', dateKey);
      history.replace({ pathname: location.pathname, search: params.toString() });
    },
    [history, location.pathname, location.search]
  );

  const handleWeekShift = useCallback(
    (direction: 'prev' | 'next') => {
      const delta = direction === 'prev' ? -7 : 7;
      const monday = new Date(weekStartDisplay);
      monday.setDate(monday.getDate() + delta);
      const newWeekKey = formatCalendarDateKey(monday);
      const newDateKey = addDaysToCalendarDateKey(selectedCalendarDate, delta);
      const params = new URLSearchParams(location.search);
      params.set('type', 'calendar');
      params.set('week', newWeekKey);
      params.set('date', newDateKey);
      history.replace({ pathname: location.pathname, search: params.toString() });
    },
    [history, location.pathname, location.search, weekStartDisplay, selectedCalendarDate]
  );

  const { data: metrics, isLoading: isMetricsLoading } = useFitnessMetrics();
  const {
    isStrengthModalOpen,
    isBalanceModalOpen,
    isProgressModalOpen,
    openStrengthModal,
    openBalanceModal,
    openProgressModal,
    closeStrengthModal,
    closeBalanceModal,
    closeProgressModal,
  } = useModals();

  const strengthScoreValue = useMemo(() => {
    if (!metrics?.strength_score) return '--';
    return `${metrics.strength_score.current}`;
  }, [metrics]);

  const strengthScoreSubtitle = useMemo(() => {
    if (!metrics?.strength_score) return undefined;
    return `${metrics.strength_score.level} • +${metrics.strength_score.recent_gain}`;
  }, [metrics]);

  const balanceValue = useMemo(() => {
    if (!metrics?.strength_balance) return '--';
    return `${metrics.strength_balance.percentage}%`;
  }, [metrics]);

  const balanceSubtitle = useMemo(() => {
    if (!metrics?.strength_balance) return undefined;
    const groups = metrics.strength_balance.muscle_groups ?? {};
    const activeCount = Object.values(groups).filter(v => (v as number) > 0).length;
    const change = metrics.strength_balance.recent_change;
    const sign = change >= 0 ? '+' : '';
    return `${metrics.strength_balance.level} • ${sign}${change}% • ${activeCount} active`;
  }, [metrics]);

  const weeklyValue = useMemo(() => {
    if (!metrics?.weekly_progress) return '--';
    const sign = metrics.weekly_progress.percentage >= 0 ? '+' : '';
    return `${sign}${metrics.weekly_progress.percentage}%`;
  }, [metrics]);

  const weeklySubtitle = useMemo(() => {
    if (!metrics?.weekly_progress) return undefined;
    return `${metrics.weekly_progress.current_week_workouts} workouts`;
  }, [metrics]);

  const handleSessionClick = (sessionId: number) => {
    history.push(`/sessions/${sessionId}`, { navPage: 'progress' });
  };

  return (
    <>
      <div>

        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-4">
            <h1
              className="text-3xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              Progress
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Track your fitness journey
            </p>
          </header>

          <div
            className="mb-6 flex rounded-full p-1"
            style={{ backgroundColor: 'var(--color-segment-track)' }}
            role="tablist"
            aria-label="Progress sections"
          >
            {(
              [
                { id: 'calendar' as const, label: 'Calendar' },
                { id: 'metrics' as const, label: 'Metrics' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={progressTab === id}
                id={`progress-tab-${id}`}
                aria-controls={`progress-panel-${id}`}
                onClick={() => handleProgressTabChange(id)}
                className="flex-1 rounded-full py-3 px-4 text-sm font-medium transition-all"
                style={{
                  color: progressTab === id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: progressTab === id ? 'var(--color-segment-active)' : 'transparent',
                  boxShadow: progressTab === id ? 'var(--color-segment-active-shadow)' : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {progressTab === 'calendar' && (
            <div className="mb-8" id="progress-panel-calendar" role="tabpanel" aria-labelledby="progress-tab-calendar">
              <WeeklyCalendar
                weekAnchor={weekAnchor}
                weekStartMonday={weekStartDisplay}
                isCurrentWeek={isCalendarCurrentWeek}
                selectedDateKey={selectedCalendarDate}
                onSelectDate={handleSelectCalendarDate}
                onWeekShift={handleWeekShift}
                onSessionClick={handleSessionClick}
              />
            </div>
          )}

          {progressTab === 'metrics' && (
            <div className="mb-8 space-y-4" id="progress-panel-metrics" role="tabpanel" aria-labelledby="progress-tab-metrics">
              {isMetricsLoading ? (
                <ProgressMetricsSkeleton />
              ) : (
                <>
                  <MetricCard
                    title="Strength Score"
                    value={strengthScoreValue}
                    icon={Dumbbell}
                    delay={0.1}
                    subtitle={strengthScoreSubtitle}
                    onClick={openStrengthModal}
                  />
                  <MetricCard
                    title="Balance"
                    value={balanceValue}
                    icon={TrendingUp}
                    delay={0.2}
                    subtitle={balanceSubtitle}
                    onClick={openBalanceModal}
                  />
                  <MetricCard
                    title="Weekly Progress"
                    value={weeklyValue}
                    icon={TrendingDown}
                    delay={0.3}
                    subtitle={weeklySubtitle}
                    onClick={openProgressModal}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <StrengthScoreModal isOpen={isStrengthModalOpen} onClose={closeStrengthModal} />
      <BalanceModal isOpen={isBalanceModalOpen} onClose={closeBalanceModal} />
      <WeeklyProgressModal isOpen={isProgressModalOpen} onClose={closeProgressModal} />
    </>
  );
}
