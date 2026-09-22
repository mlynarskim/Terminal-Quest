import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { sounds } from '../lib/audioSystem';

const INITIAL_POOL = [
  'INITIALIZING SYSTEM...',
  'BOOTING OS v0.1.7...',
  'WAKING UP CORES...',
  'LOADING FIRMWARE...',
];
const KERNEL_POOL = [
  '[LOAD] KERNEL... OK',
  '[LOAD] SYSTEM_HEART... STABLE',
  '[LOAD] CORE_MODULES... DONE',
  '[LOAD] MICROCODE... VERIFIED',
];
const WARNING_POOL = [
  'WARNING: UNAUTHORIZED ACCESS DETECTED',
  'ALERT: ANOMALY IN SECTOR 7G',
  'NOTICE: TRACING ACTIVE CONNECTION',
  'CAUTION: UNKNOWN PACKETS DISCOVERED',
];
const SYNC_POOL = [
  'SYNCING... COMPLETE',
  'DECRYPTING PROTOCOLS...',
  'HANDSHAKE... SUCCESSFUL',
  'ESTABLISHING SECURE TUNNEL...',
];
const WELCOME_POOL = [
  'WELCOME USER',
  'IDENTITY RECOGNIZED',
  'ACCESS GRANTED',
  'HELLO AGAIN, EXPLORER',
];
const ERROR_POOL = [
  'ERROR: ADAPTER_NOT_FOUND',
  'CRITICAL_FAILURE: SECTOR_CORRUPTION',
  'FATAL: STACK OVERFLOW AT 0x004F',
  'ERROR: UNRECOVERABLE_MEMORY_LEAK',
  'SYSTEM_HALT: IRQ_CONFLICT',
  'FAULT: SEGMENTATION_VIOLATION',
];

const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];

const buildBootSequence = () => {
  const baseSequence = [
    pick(INITIAL_POOL),
    pick(KERNEL_POOL),
    '[LOAD] FILESYSTEM... OK',
    '[LOAD] NET_DRIVERS... OK',
    pick(WARNING_POOL),
    pick(SYNC_POOL),
    pick(WELCOME_POOL),
  ];

  // Inject random errors at random positions
  const sequenceWithErrors = [...baseSequence];
  const errorCount = Math.floor(Math.random() * 3);
  for (let i = 0; i < errorCount; i++) {
    const error = pick(ERROR_POOL);
    const insertIdx = Math.floor(Math.random() * (sequenceWithErrors.length - 1)) + 1;
    sequenceWithErrors.splice(insertIdx, 0, `!! ${error}`);
  }

  return sequenceWithErrors;
};

const BootSequence = ({ onComplete }) => {
  const [bootLines] = useState(buildBootSequence);
  const [visibleLines, setVisibleLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isBSOD, setIsBSOD] = useState(false);

  useEffect(() => {
    if (bootLines.length === 0) return;

    let currentLine = 0;
    const lineInterval = setInterval(() => {
      if (currentLine < bootLines.length) {
        const line = bootLines[currentLine];
        setVisibleLines((prev) => [...prev, line]);

        // Play blip for normal lines, error sound for !! lines
        if (line.startsWith('!!')) {
          sounds.error();
        } else {
          sounds.boot();
        }

        currentLine++;
      } else {
        clearInterval(lineInterval);
      }
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100));
    }, 50);

    const timeout = setTimeout(onComplete, 8000);

    return () => {
      clearInterval(lineInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onComplete, bootLines]);

  useEffect(() => {
    // Random BSOD chance (20%)
    if (Math.random() >= 0.2) return;

    const bsodTime = 2000 + Math.random() * 4000;
    let recoveryTimer = null;
    const bsodTimer = setTimeout(() => {
      setIsBSOD(true);
      sounds.error();
      recoveryTimer = setTimeout(() => {
        setIsBSOD(false);
        sounds.startup();
        // Restart boot sequence after "recovery"
        setVisibleLines(['RECOVERING FROM CRITICAL FAULT...', 'RESTORE_POINT: 0x01A24B... FOUND']);
      }, 2000);
    }, bsodTime);

    return () => {
      clearTimeout(bsodTimer);
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') onComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div className="h-screen bg-black flex flex-col p-8 font-mono text-[#00ff66] relative overflow-hidden">
      <div className="crt-overlay" />

      {isBSOD ? (
        <div className="absolute inset-0 bg-[#0000ff] text-white p-20 z-50 flex flex-col gap-8">
          <div className="text-8xl">:(</div>
          <div className="text-2xl space-y-4">
            <p>Your system ran into a problem and needs to restart.</p>
            <p>We're just collecting some error info, and then we'll restart for you.</p>
          </div>
          <div className="mt-8">
            <p className="opacity-80">Stop Code: TERMINAL_QUEST_INIT_FAILURE</p>
            <p className="opacity-80">What failed: system_core.sys</p>
          </div>
          <div className="flex-1" />
          <div className="text-sm opacity-60">
            For more information about this issue and possible fixes, visit
            https://terminal.os/stopcode
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-2">
          {visibleLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={
                line?.includes('WARNING') || line?.startsWith('!!') ? 'text-[#ff4d4d]' : ''
              }
            >
              {line}
            </motion.div>
          ))}
          {visibleLines.length < bootLines.length && (
            <div className="mt-4">
              <div className="flex justify-between w-64 text-[10px] mb-1">
                <span>LOADING_OS_CORE</span>
                <span>{progress}%</span>
              </div>
              <div className="w-64 h-1.5 border border-[#00ff66] p-0.5">
                <div className="h-full bg-[#00ff66]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] opacity-40 animate-pulse">
        {!isBSOD && 'PRESS [ENTER] TO SKIP BOOT_SEQUENCE'}
      </div>
    </div>
  );
};

const StartScreen = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen bg-black flex flex-col items-center justify-center font-mono text-[#00ff66] relative"
    >
      <div className="crt-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8">
        <div className="space-y-2 text-center">
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-6xl font-bold tracking-[10px] glitch-text"
          >
            TERMINAL QUEST
          </motion.h1>
          <p className="opacity-60 text-sm tracking-widest">A TERMINAL MYSTERY GAME</p>
        </div>

        <button
          onClick={() => {
            sounds.execute();
            onStart();
          }}
          className="mt-8 border border-[#00ff66] px-8 py-3 hover:bg-[#00ff66] hover:text-black transition-all cursor-pointer text-lg tracking-[4px] relative group"
        >
          <span className="relative z-10">[ ENTER SYSTEM ]</span>
          <div className="absolute inset-0 bg-[#00ff66] opacity-0 group-hover:opacity-10 blur-md transition-opacity" />
        </button>

        <div className="text-[10px] opacity-40 mt-12 text-center space-y-1">
          <p>SOME COMMANDS ARE HIDDEN. CURIOSITY IS MANDATORY.</p>
          <p>FIRST CONTACT? AN INTERACTIVE TUTORIAL GUIDES YOUR FIRST 5 COMMANDS.</p>
        </div>
      </div>
    </motion.div>
  );
};

export { BootSequence, StartScreen };
