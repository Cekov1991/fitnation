import { useRef, useEffect } from 'react';
import type { WorkoutTemplateResource } from '../../types/api';

interface WorkoutTemplateSelectorProps {
  templates: WorkoutTemplateResource[];
  selectedTemplateId: number | null;
  onTemplateSelect: (templateId: number) => void;
}

export function WorkoutTemplateSelector({ 
  templates, 
  selectedTemplateId, 
  onTemplateSelect 
}: WorkoutTemplateSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);

  // Scroll to selected button when selection changes
  useEffect(() => {
    if (selectedButtonRef.current && containerRef.current) {
      const button = selectedButtonRef.current;
      const container = containerRef.current;
      
      // Calculate scroll position to center the button
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
      {templates.map((template, index) => (
        <button
          key={template.id}
          ref={selectedTemplateId === template.id ? selectedButtonRef : null}
          onClick={() => onTemplateSelect(template.id)}
          className={`mt-2 flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            selectedTemplateId === template.id
              ? 'shadow-sm ring-1'
              : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: selectedTemplateId === template.id 
              ? 'var(--color-bg-surface)' 
              : 'var(--color-border-subtle)',
            color: selectedTemplateId === template.id
              ? 'var(--color-primary)'
              : 'var(--color-text-secondary)',
            borderColor: selectedTemplateId === template.id
              ? 'var(--color-border-subtle)'
              : 'transparent'
          }}
        >
          Day {index + 1}
        </button>
      ))}
    </div>
  );
}
