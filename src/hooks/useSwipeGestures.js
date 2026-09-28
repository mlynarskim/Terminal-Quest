import { useEffect, useRef, useCallback } from 'react';

export const useSwipeGestures = (onSwipe, options = {}) => {
  const {
    threshold = 50,
    preventDefault = true,
    enabled = true,
  } = options;

  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled) return;
    if (preventDefault) e.preventDefault();
  }, [enabled, preventDefault]);

  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Minimum distance and time threshold
    if (Math.max(absX, absY) < threshold || dt > 500) return;

    const direction = absX > absY ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

    onSwipe(direction, { dx, dy, distance: Math.max(absX, absY), duration: dt });
  }, [enabled, threshold, onSwipe, preventDefault]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    el.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
};

export default useSwipeGestures;