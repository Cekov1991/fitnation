import { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

function parseIds(raw: string | null): Set<number> {
  if (!raw) return new Set();
  return new Set(raw.split(',').filter(Boolean).map(Number).filter(n => !Number.isNaN(n)));
}

function serializeIds(ids: Set<number>): string {
  return [...ids].join(',');
}

export function useFilterParams(initialMuscleGroupIds?: number[]) {
  const history = useHistory();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const searchQuery = params.get('q') || '';
  const selectedMuscleGroupIds = useMemo(
    () => {
      const fromUrl = parseIds(params.get('muscles'));
      if (fromUrl.size > 0) return fromUrl;
      return new Set(initialMuscleGroupIds ?? []);
    },
    [params, initialMuscleGroupIds]
  );
  const selectedEquipmentTypeIds = useMemo(() => parseIds(params.get('equipment')), [params]);

  const replaceParams = useCallback((updater: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(location.search);
    updater(next);
    history.replace({ ...location, search: next.toString() });
  }, [history, location]);

  const setSearchQuery = useCallback((q: string) => {
    replaceParams(p => { q ? p.set('q', q) : p.delete('q'); });
  }, [replaceParams]);

  const toggleMuscleGroup = useCallback((id: number) => {
    replaceParams(p => {
      const current = parseIds(p.get('muscles'));
      current.has(id) ? current.delete(id) : current.add(id);
      const val = serializeIds(current);
      val ? p.set('muscles', val) : p.delete('muscles');
    });
  }, [replaceParams]);

  const toggleEquipmentType = useCallback((id: number) => {
    replaceParams(p => {
      const current = parseIds(p.get('equipment'));
      current.has(id) ? current.delete(id) : current.add(id);
      const val = serializeIds(current);
      val ? p.set('equipment', val) : p.delete('equipment');
    });
  }, [replaceParams]);

  const clearFilters = useCallback(() => {
    replaceParams(p => { p.delete('muscles'); p.delete('equipment'); });
  }, [replaceParams]);

  return {
    searchQuery,
    selectedMuscleGroupIds,
    selectedEquipmentTypeIds,
    setSearchQuery,
    toggleMuscleGroup,
    toggleEquipmentType,
    clearFilters,
  };
}
