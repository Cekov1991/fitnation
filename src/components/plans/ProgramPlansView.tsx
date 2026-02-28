import React, { useMemo, useState } from 'react';
import { Info, MoreVertical, ChevronDown, ChevronUp, Plus, Calendar } from 'lucide-react';
import { ProgramWeekCard } from './ProgramWeekCard';
import { LoadingContent, ConfirmDialog } from '../ui';
import { PlanMenu } from '../PlanMenu';
import { usePrograms, useDeleteProgram, useUpdateProgram } from '../../hooks/useApi';
import type { ProgramResource, WorkoutTemplateResource } from '../../types/api';

interface ProgramPlansViewProps {
  onNavigateToBrowseLibrary: () => void;
  onNavigateToWorkout: (templateId: number) => void;
}

export function ProgramPlansView({
  onNavigateToBrowseLibrary,
  onNavigateToWorkout
}: ProgramPlansViewProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Active program expanded by default
  const [expandedInactivePrograms, setExpandedInactivePrograms] = useState<Set<number>>(new Set()); // Inactive programs closed by default
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentProgram, setCurrentProgram] = useState<{
    id: number;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: programs = [],
    isLoading: isProgramsLoading,
    isFetching: isProgramsFetching,
    isError: isProgramsError,
    error: programsError,
    refetch: refetchPrograms
  } = usePrograms();

  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();

  const activeProgram = useMemo(() => {
    return programs.find((program: ProgramResource) => program.is_active) || null;
  }, [programs]);

  const inactivePrograms = useMemo(() => {
    return programs.filter((program: ProgramResource) => !program.is_active);
  }, [programs]);

  // Helper function to group workouts by week for any program
  const getProgramWeeks = (program: ProgramResource) => {
    if (!program?.workout_templates) return [];

    const weekMap = new Map<number, WorkoutTemplateResource[]>();
    
    program.workout_templates.forEach((template: WorkoutTemplateResource) => {
      const weekNum = template.week_number || 1;
      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, []);
      }
      const weekWorkouts = weekMap.get(weekNum);
      if (weekWorkouts) {
        weekWorkouts.push(template);
      }
    });

    // Sort workouts within each week by order_index
    weekMap.forEach((workouts) => {
      workouts.sort((a, b) => a.order_index - b.order_index);
    });

    // Convert to array and sort by week number
    const currentActiveWeek = program.current_active_week ?? 1;
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, workouts]) => ({
        weekNumber,
        workouts,
        isActive: weekNumber === currentActiveWeek && program.is_active
      }));
  };

  // Group workouts by week for the active program
  const programWeeks = useMemo(() => {
    return getProgramWeeks(activeProgram || {} as ProgramResource);
  }, [activeProgram]);

  const handleProgramMenuClick = (event: React.MouseEvent, menuId: string, program: {
    id: number;
    name: string;
    isActive: boolean;
  }) => {
    event.stopPropagation();
    setCurrentProgram(program);
    setOpenMenuId(menuId);
  };

  const handleToggleActive = async () => {
    if (!currentProgram) return;
    try {
      await updateProgram.mutateAsync({
        programId: currentProgram.id,
        data: {
          is_active: !currentProgram.isActive
        }
      });
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDeleteClick = () => {
    setOpenMenuId(null);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentProgram) return;
    try {
      await deleteProgram.mutateAsync(currentProgram.id);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleInactiveProgram = (programId: number) => {
    setExpandedInactivePrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Active Program Section */}
      {(activeProgram || isProgramsLoading || isProgramsError) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Active Program
            </h2>
          </div>

          {isProgramsFetching && !isProgramsLoading && (
            <div className="flex items-center justify-center gap-2 py-2 mb-2">
              <div 
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Updating programs...
              </span>
            </div>
          )}

          <LoadingContent
            isLoading={isProgramsLoading}
            isError={isProgramsError}
            error={programsError}
            onRetry={refetchPrograms}
          >
            {activeProgram ? (
              <div 
                className="relative border rounded-3xl shadow-xl overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                  borderColor: 'var(--color-border)'
                }}
              >
                {activeProgram.cover_image && (
                  <div
                    className="min-h-[140px] w-full bg-cover bg-center rounded-t-3xl"
                    style={{ backgroundImage: `url(${activeProgram.cover_image})` }}
                    aria-hidden
                  />
                )}
                <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {activeProgram.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {activeProgram.description || 'Structured program from your library'}
                    </p>
                  </div>
                  <button 
                    onClick={e => handleProgramMenuClick(e, 'active-program', {
                      id: activeProgram.id,
                      name: activeProgram.name,
                      isActive: activeProgram.is_active
                    })} 
                    className="p-2 rounded-full transition-colors" 
                    style={{ backgroundColor: 'var(--color-border-subtle)' }}
                  >
                    <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {activeProgram.duration_weeks} WEEKS
                    </span>
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: '#4ade80' }}>
                    ACTIVE
                  </span>
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors mb-4"
                  style={{ 
                    backgroundColor: 'var(--color-bg-elevated)',
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {isExpanded ? 'Hide' : 'View'} Program Details
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <ChevronDown size={18} style={{ color: 'var(--color-primary)' }} />
                  )}
                </button>

                {/* Collapsible Timeline with weeks */}
                {isExpanded && programWeeks.length > 0 && (
                  <div className="relative animate-in slide-in-from-top-2 duration-300">
                    {/* Timeline line */}
                    <div 
                      className="absolute left-[9px] top-8 bottom-8 w-0.5" 
                      style={{ backgroundColor: 'var(--color-border)' }}
                    />

                    {/* Week cards */}
                    <div className="space-y-4 relative">
                      {programWeeks.map((week) => (
                        <div key={week.weekNumber} className="flex items-start">
                          {/* Timeline dot */}
                          <div className="relative z-10 mt-6 mr-4">
                            <div
                              className={`w-5 h-5 rounded-full border-2`}
                              style={{
                                backgroundColor: week.isActive ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                borderColor: week.isActive ? 'var(--color-primary)' : 'var(--color-border)'
                              }}
                            />
                          </div>

                          {/* Week card */}
                          <div className="flex-1" style={{ minWidth: 0, maxWidth: '100%' }}>
                            <ProgramWeekCard
                              weekNumber={week.weekNumber}
                              workouts={week.workouts}
                              isActive={week.isActive}
                              accentColor="var(--color-primary)"
                              nextWorkoutId={activeProgram?.next_workout?.id || null}
                              onWorkoutClick={onNavigateToWorkout}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div 
                className="text-center py-12 border rounded-2xl"
                style={{ 
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  No active program. Browse the library to get started.
                </p>
                <button
                  onClick={onNavigateToBrowseLibrary}
                  className="px-6 py-2 rounded-xl font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  Browse Library
                </button>
              </div>
            )}
          </LoadingContent>
        </div>
      )}

      {/* All Programs Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          All Programs
        </h2>

        {isProgramsFetching && !isProgramsLoading && (
          <div className="flex items-center justify-center gap-2 py-2 mb-2">
            <div 
              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Updating programs...
            </span>
          </div>
        )}

        <LoadingContent
          isLoading={isProgramsLoading}
          isError={isProgramsError}
          error={programsError}
          onRetry={refetchPrograms}
        >
          <div className="space-y-4 mb-6">
            {inactivePrograms.length === 0 ? (
              <div className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                No other programs yet.
              </div>
            ) : (
              inactivePrograms.map((program: ProgramResource) => {
                const isProgramExpanded = expandedInactivePrograms.has(program.id);
                const programWeeksData = getProgramWeeks(program);

                return (
                  <div 
                    key={program.id} 
                    className="relative border rounded-2xl overflow-hidden"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    {program.cover_image && (
                      <div
                        className="min-h-[140px] w-full bg-cover bg-center rounded-t-2xl"
                        style={{ backgroundImage: `url(${program.cover_image})` }}
                        aria-hidden
                      />
                    )}
                    <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 
                          className="text-lg font-bold mb-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {program.name}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                          {program.description || 'Structured program from your library'}
                        </p>
                      </div>
                      <button 
                        onClick={e => handleProgramMenuClick(e, `program-${program.id}`, {
                          id: program.id,
                          name: program.name,
                          isActive: program.is_active
                        })} 
                        className="p-2 rounded-full transition-colors" 
                        style={{ backgroundColor: 'var(--color-border-subtle)' }}
                      >
                        <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          {program.duration_weeks} WEEKS
                        </span>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => handleToggleInactiveProgram(program.id)}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors mb-4"
                      style={{ 
                        backgroundColor: 'var(--color-bg-elevated)',
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {isProgramExpanded ? 'Hide' : 'View'} Program Details
                      </span>
                      {isProgramExpanded ? (
                        <ChevronUp size={18} style={{ color: 'var(--color-primary)' }} />
                      ) : (
                        <ChevronDown size={18} style={{ color: 'var(--color-primary)' }} />
                      )}
                    </button>

                    {/* Collapsible Timeline with weeks */}
                    {isProgramExpanded && programWeeksData.length > 0 && (
                      <div className="relative animate-in slide-in-from-top-2 duration-300">
                        {/* Timeline line */}
                        <div 
                          className="absolute left-[9px] top-8 bottom-8 w-0.5" 
                          style={{ backgroundColor: 'var(--color-border)' }}
                        />

                        {/* Week cards */}
                        <div className="space-y-4 relative">
                          {programWeeksData.map((week) => (
                            <div key={week.weekNumber} className="flex items-start">
                              {/* Timeline dot */}
                              <div className="relative z-10 mt-6 mr-4">
                                <div
                                  className={`w-5 h-5 rounded-full border-2`}
                                  style={{
                                    backgroundColor: week.isActive ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                    borderColor: week.isActive ? 'var(--color-primary)' : 'var(--color-border)'
                                  }}
                                />
                              </div>

                              {/* Week card */}
                              <div className="flex-1">
                                <ProgramWeekCard
                                  weekNumber={week.weekNumber}
                                  workouts={week.workouts}
                                  isActive={week.isActive}
                                  accentColor="var(--color-primary)"
                                  nextWorkoutId={program.is_active ? (activeProgram?.next_workout?.id || null) : null}
                                  onWorkoutClick={onNavigateToWorkout}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </LoadingContent>
      </div>

      {/* Browse Library Button */}
      <button 
        onClick={onNavigateToBrowseLibrary} 
        className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group btn-primary"
      >
        <span className="relative z-10 text-white flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          BROWSE LIBRARY
        </span>
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
          style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
        />
      </button>

      {/* Program Menu */}
      {openMenuId && currentProgram && (
        <PlanMenu 
          isOpen={openMenuId !== null} 
          onClose={() => setOpenMenuId(null)} 
          isActive={currentProgram.isActive} 
          onAddWorkout={undefined} 
          onEdit={undefined} 
          onToggleActive={handleToggleActive} 
          onDelete={handleDeleteClick} 
          isToggleLoading={updateProgram.isPending} 
          isDeleteLoading={deleteProgram.isPending} 
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Program"
        message={`Are you sure you want to delete "${currentProgram?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteProgram.isPending}
      />
    </>
  );
}
