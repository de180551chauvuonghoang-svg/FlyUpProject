import { useEffect, useRef } from 'react';

/**
 * Click outside hook — calls handler when clicking outside ref element
 * @param {function} handler - Callback when click outside
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };

    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [handler]);

  return ref;
}
