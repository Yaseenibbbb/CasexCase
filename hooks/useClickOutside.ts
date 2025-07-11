import { useEffect, useRef } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Hook that alerts clicks outside of the passed ref.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-run if ref or handler changes

  return ref;
} 