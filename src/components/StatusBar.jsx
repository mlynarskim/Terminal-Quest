import { Terminal as TerminalIcon } from 'lucide-react';
import { OVERLOAD_BIT_THRESHOLD } from '../game/constants';
import { computeRank } from '../game/ranks';
import { prestigeTitle } from '../game/prestige';

const StatusBar = ({ state }) => {
  const rank = computeRank(state.stats);
  const prestige = state.prestige || 0;
  const stormActive = state.storm?.active;
  const radioOn = state.radio?.on;
  return (
    <div className="flex justify-between items-center px-4 py-1 bg-(--bg-color) border-b border-(--text-secondary) text-[10px] uppercase tracking-[2px] z-50">
      <div className="flex items-center gap-2">
        <TerminalIcon size={12} className="text-(--text-primary)" />
        <span>TERMINAL QUEST v0.1.7</span>
        {stormActive && <span className="text-(--text-error) animate-pulse">[STORM]</span>}
        {radioOn && (
          <span className="text-(--text-bits)">
            [RADIO:{(state.radio?.station || 'lofi').toUpperCase()}]
          </span>
        )}
      </div>
      <div className="hidden md:flex gap-6 items-center">
        <div>
          RANK: <span className="text-(--text-bits)">{rank.current}</span>
        </div>
        {prestige > 0 && (
          <div>
            PRESTIGE:{' '}
            <span className="text-(--text-warning)">
              {prestige} {prestigeTitle(prestige)}
            </span>
          </div>
        )}
        <div>
          USER: <span className="text-(--text-primary)">explorer</span>
        </div>
      </div>
      <div className="flex gap-6 items-center">
        <div
          className={`transition-opacity duration-300 ${state.history.length % 2 === 0 ? 'opacity-100' : 'opacity-50'}`}
        >
          IO_ACTIVITY:{' '}
          <span className="text-(--text-primary)">
            {state.history.length % 2 === 0 ? '[ READY ]' : '[ BUSY ]'}
          </span>
        </div>
        <div>
          BITS: <span className="text-(--text-bits)">{state.bits}</span>
        </div>
        <div className="flex items-center">
          STATUS:{' '}
          <span className="ml-2">
            {state.bits < OVERLOAD_BIT_THRESHOLD ? 'CONNECTED' : 'OVERLOADED'}
          </span>
          <div
            className={`status-online ml-1 ${state.bits < OVERLOAD_BIT_THRESHOLD ? 'bg-(--text-primary)' : 'bg-(--text-error) animate-pulse'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
