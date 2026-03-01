import { useState, useEffect } from 'react';

/**
 * Debounce hook — delays value updates
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in ms (default 400)
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
