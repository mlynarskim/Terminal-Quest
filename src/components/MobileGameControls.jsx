import { useMobileGameControls } from '../hooks/useMobileGameControls';

const MobileGameControls = () => {
  const { showMobileControls, activeGame } = useMobileGameControls();

  if (!showMobileControls) return null;

  const renderSnakeControls = () => (
    <div className="grid grid-cols-3 gap-2">
      <div className="hidden" />
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('snake-direction', { detail: 'up' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Up"
      >
        ▲
      </button>
      <div className="hidden" />
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('snake-direction', { detail: 'left' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Left"
      >
        ◄
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('snake-direction', { detail: 'right' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Right"
      >
        ►
      </button>
      <div className="hidden" />
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('snake-direction', { detail: 'down' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Down"
      >
        ▼
      </button>
      <div className="hidden" />
    </div>
  );

  const render2048Controls = () => (
    <div className="grid grid-cols-3 gap-2">
      <div className="hidden" />
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('2048-move', { detail: 'up' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Up"
      >
        ▲
      </button>
      <div className="hidden" />
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('2048-move', { detail: 'left' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Left"
      >
        ◄
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('2048-move', { detail: 'right' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Right"
      >
        ►
      </button>
      <div className="hidden" />
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('2048-move', { detail: 'down' }))}
        onTouchStart={(e) => e.preventDefault()}
        className="w-12 h-12 bg-(--text-secondary)/20 border border-(--text-primary)/30 rounded-lg flex items-center justify-center text-(--text-primary) active:bg-(--text-primary) active:text-black touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Move Down"
      >
        ▼
      </button>
      <div className="hidden" />
    </div>
  );

  if (!showMobileControls) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-(--bg-color) border-t border-(--text-secondary) animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="text-[10px] text-(--text-secondary) text-center mb-2">
          {activeGame === 'snake' && 'SNAKE CONTROLS — Swipe or tap arrows'}
          {activeGame === '2048' && '2048 CONTROLS — Swipe or tap arrows'}
          {activeGame === 'memory' && 'MEMORY — Tap cards to flip'}
        </div>
        
        {activeGame === 'snake' && renderSnakeControls()}
        {activeGame === '2048' && render2048Controls()}
        {activeGame === 'memory' && (
          <div className="text-center text-[10px] text-(--text-secondary)">
            Tap cards to flip. Swipe left/right to navigate.
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileGameControls;