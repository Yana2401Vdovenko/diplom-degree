import { useMemo, useState } from 'react';

export function useSearch<T>(items: T[], selector: (item: T) => string) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => selector(item).toLowerCase().includes(normalizedQuery));
  }, [items, query, selector]);

  return {
    query,
    setQuery,
    filteredItems,
  };
}
