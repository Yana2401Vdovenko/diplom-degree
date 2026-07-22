import { useCallback, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export function useSort<T>(
  items: T[],
  initialKey: keyof T,
  initialDirection: SortDirection = 'asc',
) {
  const [sortKey, setSortKey] = useState<keyof T>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const sortedItems = useMemo(() => {
    const copy = [...items];

    copy.sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (leftValue == null && rightValue == null) {
        return 0;
      }

      if (leftValue == null) {
        return 1;
      }

      if (rightValue == null) {
        return -1;
      }

      const comparison =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), 'uk', { sensitivity: 'base' });

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return copy;
  }, [items, sortDirection, sortKey]);

  const toggleSort = useCallback((key: keyof T) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  }, [sortKey]);

  return {
    sortKey,
    sortDirection,
    sortedItems,
    toggleSort,
  };
}
