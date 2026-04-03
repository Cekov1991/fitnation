import { useRef, useEffect } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { WorkoutTemplateResource } from '../../types/api';

interface WorkoutTemplateSelectorProps {
  templates: WorkoutTemplateResource[];
  selectedTemplateId: number | null;
  onTemplateSelect: (templateId: number) => void;
  /** Template that is "next" in the program. Used for next/completed styling. */
  nextWorkout?: WorkoutTemplateResource | null;
  /** Called when a completed day badge is clicked; receives the session ID to show. */
  onCompletedDayClick?: (sessionId: number) => void;
}

export function WorkoutTemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  nextWorkout = null,
  onCompletedDayClick
}: WorkoutTemplateSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selectedButtonRef.current && containerRef.current) {
      const button = selectedButtonRef.current;
      const container = containerRef.current;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [selectedTemplateId]);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
    >
      {templates.map((template, index) => {
        const isNext = nextWorkout != null && template.id === nextWorkout.id;
        const isCompleted = template.last_completed_session_id != null;
        const isSelected = selectedTemplateId === template.id;

        const handleClick = () => {
          if (isCompleted && template.last_completed_session_id && onCompletedDayClick) {
            onCompletedDayClick(template.last_completed_session_id);
          } else {
            onTemplateSelect(template.id);
          }
        };

        return (
          <button
            key={template.id}
            ref={isSelected ? selectedButtonRef : null}
            onClick={handleClick}
            className={`mt-2 flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 relative ${
              isSelected ? 'shadow-sm ring-1' : 'hover:opacity-80'
            }`}
            style={{
              background: isSelected
                ? 'var(--color-bg-surface)'
                : isNext
                  ? 'color-mix(in srgb, var(--color-primary) 14%, var(--color-bg-surface))'
                  : isCompleted
                    ? 'transparent'
                    : 'var(--color-border-subtle)',
              color: isSelected
                ? 'var(--color-primary)'
                : isNext
                  ? 'var(--color-primary)'
                  : isCompleted
                    ? 'var(--color-text-button)'
                    : 'var(--color-text-secondary)',
              border: isSelected || isCompleted
                ? '1px solid var(--color-border-subtle)'
                : '1px solid transparent',
              overflow: 'hidden'
            }}
          >
            {isCompleted && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                  zIndex: 0
                }}
                aria-hidden
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {isNext && <Clock size={14} className="flex-shrink-0" />}
              {isCompleted && <CheckCircle2 size={14} className="flex-shrink-0" />}
              Day {index + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
