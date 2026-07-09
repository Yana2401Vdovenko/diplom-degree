const SEARCH_HISTORY_KEY = 'academic-workload-admin:search-history';
const SEARCH_HISTORY_EVENT = 'academic-workload-admin:search-history-updated';
const MAX_SEARCH_HISTORY_ITEMS = 8;

export interface SearchHistoryItem {
  query: string;
  source: string;
  searchedAt: string;
}

function readSearchHistory(): SearchHistoryItem[] {
  try {
    const rawValue = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    return rawValue ? (JSON.parse(rawValue) as SearchHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeSearchHistory(items: SearchHistoryItem[]) {
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(SEARCH_HISTORY_EVENT));
  } catch {
    // Search history is helpful, but the app should not depend on localStorage.
  }
}

export function getSearchHistory() {
  return readSearchHistory();
}

export function recordSearchQuery(query: string, source: string) {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return;
  }

  const nextItem: SearchHistoryItem = {
    query: normalizedQuery,
    source,
    searchedAt: new Date().toISOString(),
  };

  const existingItems = readSearchHistory().filter(
    (item) =>
      item.query.toLowerCase() !== normalizedQuery.toLowerCase() || item.source !== source,
  );

  writeSearchHistory([nextItem, ...existingItems].slice(0, MAX_SEARCH_HISTORY_ITEMS));
}

export function subscribeToSearchHistory(callback: () => void) {
  window.addEventListener(SEARCH_HISTORY_EVENT, callback);

  return () => {
    window.removeEventListener(SEARCH_HISTORY_EVENT, callback);
  };
}
