import { useState, useEffect } from 'react';

/**
 * Debounce a value by a given delay.
 * Useful for search inputs — prevents API calls on every keystroke.
 *
 * Usage:
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *   useEffect(() => { fetchData(debouncedSearch) }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
