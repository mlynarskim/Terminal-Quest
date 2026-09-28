import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useGameState } from './useGameState';

export const useMobileGameControls = () => {
  const { state } = useGameState();
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const activeGameRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Detect active minigame
  useLayoutEffect(() => {
    const game = state.activeGame;
    if (game) {
      activeGameRef.current = game.type;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowMobileControls(['snake', '2048', 'memory'].includes(game.type));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveGame(game.type);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowMobileControls(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveGame(null);
    }
  }, [state.activeGame]);

  const handleTouchStart = useCallback((e) => {
    if (window.innerWidth >= 768) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (window.innerWidth >= 768) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    
    if (Math.max(absX, absY) < 50) return; // Minimum swipe distance
    
    const direction = absX > absY ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

    const activeGame = activeGameRef.current;
    if (activeGame === 'snake') {
      window.dispatchEvent(new CustomEvent('snake-direction', { detail: direction }));
    } else if (activeGame === '2048') {
      window.dispatchEvent(new CustomEvent('2048-move', { detail: direction }));
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) return;
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // Keyboard fallback for desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeGame === 'snake') {
        const dirMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
        if (dirMap[e.key]) {
          window.dispatchEvent(new CustomEvent('snake-direction', { detail: dirMap[e.key] }));
        }
      }
      if (activeGame === '2048') {
        const dirMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
        if (dirMap[e.key]) {
          window.dispatchEvent(new CustomEvent('2048-move', { detail: dirMap[e.key] }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame]);

  return {
    showMobileControls,
    activeGame,
  };
};

export default useMobileGameControls;