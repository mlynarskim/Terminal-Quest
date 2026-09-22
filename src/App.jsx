import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameState } from './hooks/useGameState';
import { resolvePath, getEntry } from './game/fileSystem';
import { Search, ShieldAlert, Award } from 'lucide-react';
import { BootSequence, StartScreen } from './components/Onboarding';
import StatusBar from './components/StatusBar';
import TerminalPanel from './components/TerminalPanel';
import FileIcon from './components/FileIcon';
import { createCommandProcessor } from './game/commandProcessor';
import { createGlitchedWriter } from './game/glitchedHistory';
import { getContextualHint } from './game/hintEngine';
import { repairStatus, endingInfo } from './game/story';
import { getTutorialIntro } from './game/tutorial';
import { getObjective } from './game/objective';
import { mergedBestiary, discoveryPercent, totalEntries, discoveredCount } from './game/bestiary';
import { getWeeklyChallenge, scoreWeekly } from './game/weekly';
import { prestigeTitle } from './game/prestige';
import { isDangerous } from './game/processes';
import { sounds } from './lib/audioSystem';
import {
  HINT_CHECK_INTERVAL_MS,
  SPECIAL_COMMENTARY_MIN_MS,
  SPECIAL_COMMENTARY_MAX_MS,
  IDLE_HINT_THRESHOLD_MS,
  GLITCH_DURATION_MS,
  EARLY_GLITCH_DELAY_MS,
  GLITCH_CHECK_INTERVAL_MS,
  CAT_ABSENCE_CHECK_INTERVAL_MS,
  CAT_ABSENCE_THRESHOLD_MS,
  CAT_ABSENCE_CHANCE,
  CAT_RETURN_CHANCE,
  COMMAND_LATENCY_MIN_MS,
  COMMAND_LATENCY_MAX_MS,
  DELAY_SHORT_MS,
  DELAY_MEDIUM_MS,
} from './game/constants';

export default function App() {
  const {
    state,
    addHistory,
    addBits,
    setDir,
    addItem,
    solvePuzzle,
    addUnlockedFile,
    incrementFailures,
    resetFailures,
    clearHistory,
    resetGame,
    loadState,
    updateCat,
    removeItem,
    recordCommand,
    recordVisit,
    recordCatInteraction,
    ensureNewDay,
    setMemo,
    removeMemo,
    updateStory,
    updateDaily,
    updateSkins,
    unlockSkin,
    setProcesses,
    setCronJobs,
    setMacros,
    setMacroRecording,
    setBestiary,
    setPrestige,
    updateRadio,
    updateStorm,
    setEncrypted,
    updateWeekly,
    updateTutorial,
  } = useGameState();

  // Safety check for invalid directory (e.g. from old saves)
  useEffect(() => {
    if (!getEntry(state.currentDir)) {
      setDir('/home');
    }
  }, [state.currentDir, setDir]);

  const [phase, setPhase] = useState('boot'); // boot, start, game
  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isGlitching, setIsGlitching] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null); // { cmd: 'reset', message: '...' }
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingConfirmationRef = useRef(null);
  const stateRef = useRef(state);

  // Reflect latest state/confirmation into refs outside of render
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    pendingConfirmationRef.current = pendingConfirmation;
  }, [pendingConfirmation]);

  const addGlitchedHistory = useMemo(
    () =>
      createGlitchedWriter(
        addHistory,
        () => sounds.error(),
        () => sounds.achievement()
      ),
    [addHistory]
  );

  // Initialize the command processor once. The processor reads all dynamic
  // values (current state, pending confirmation) through refs, so it never
  // needs to be re-created.
  const processCommandRef = useRef(null);
  useEffect(() => {
    processCommandRef.current = createCommandProcessor({
      getState: () => stateRef.current,
      getPendingConfirmation: () => pendingConfirmationRef.current,
      addHistory,
      addGlitchedHistoryRaw: addHistory,
      setIsGlitching,
      setPendingConfirmation,
      playError: () => sounds.error(),
      playAchievement: () => sounds.achievement(),
      addBits,
      addItem,
      setDir,
      solvePuzzle,
      addUnlockedFile,
      incrementFailures,
      resetFailures,
      clearHistory,
      resetGame,
      updateCat,
      removeItem,
      recordCommand,
      recordVisit,
      recordCatInteraction,
      ensureNewDay,
      setMemo,
      removeMemo,
      updateStory,
      updateDaily,
      updateSkins,
      unlockSkin,
      setProcesses,
      setCronJobs,
      setMacros,
      setMacroRecording,
      setBestiary,
      setPrestige,
      updateRadio,
      updateStorm,
      setEncrypted,
      updateWeekly,
      updateTutorial,
      triggerFileSelect: () => fileInputRef.current?.click(),
      onRestart: () => setPhase('boot'),
    });
  }, [
    addBits,
    addItem,
    addUnlockedFile,
    setDir,
    solvePuzzle,
    incrementFailures,
    resetFailures,
    clearHistory,
    resetGame,
    updateCat,
    removeItem,
    addHistory,
    recordCommand,
    recordVisit,
    recordCatInteraction,
    ensureNewDay,
    setMemo,
    removeMemo,
    updateStory,
    updateDaily,
    updateSkins,
    unlockSkin,
    setProcesses,
    setCronJobs,
    setMacros,
    setMacroRecording,
    setBestiary,
    setPrestige,
    updateRadio,
    updateStorm,
    setEncrypted,
    updateWeekly,
    updateTutorial,
  ]);

  const processCommand = (cmdStr) => processCommandRef.current(cmdStr);

  useEffect(() => {
    if (phase === 'game') {
      const timers = [];
      sounds.startup();
      if (state.history.length <= 2) {
        timers.push(
          setTimeout(() => {
            addHistory({ type: 'system', text: 'WELCOME USER.' });
            timers.push(
              setTimeout(() => {
                addHistory({
                  type: 'output',
                  text: 'You are connected to a partially corrupted system. Your job: repair it.',
                });
                timers.push(
                  setTimeout(() => {
                    addHistory({
                      type: 'output',
                      text: 'GOAL: find the cat → collect 3 fragments → repair 4 sectors → restore. `story` always shows the current objective.',
                    });
                    timers.push(
                      setTimeout(() => {
                        addHistory({ type: 'output', text: 'Curiosity is rewarded.' });
                        timers.push(
                          setTimeout(() => {
                            const tut = stateRef.current.tutorial;
                            if (!tut?.started && !tut?.done) {
                              updateTutorial({ started: true, step: 0 });
                              for (const entry of getTutorialIntro()) addHistory(entry);
                            } else {
                              addHistory({ type: 'output', text: 'Type "help" to begin.' });
                            }
                          }, DELAY_MEDIUM_MS)
                        );
                      }, DELAY_MEDIUM_MS)
                    );
                  }, DELAY_MEDIUM_MS)
                );
              }, DELAY_MEDIUM_MS)
            );
          }, DELAY_SHORT_MS)
        );
      }
      return () => timers.forEach(clearTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once per 'game' phase entry
  }, [phase]);

  // Idle Hint System
  useEffect(() => {
    if (phase !== 'game') return;
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivity;

      // Special 3-minute commentary check
      if (idleTime >= SPECIAL_COMMENTARY_MIN_MS && idleTime < SPECIAL_COMMENTARY_MAX_MS) {
        addGlitchedHistory({ type: 'system', text: 'SYSTEM: some files are still unexplored' });
      } else if (idleTime > IDLE_HINT_THRESHOLD_MS) {
        const hint = getContextualHint(stateRef.current, idleTime);
        addGlitchedHistory({ type: 'system', text: hint });
        setLastActivity(Date.now());
      }
    }, HINT_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase, lastActivity, addGlitchedHistory]);

  // Early Glitch Event
  useEffect(() => {
    if (phase !== 'game') return;

    const earlyGlitch = setTimeout(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS);
    }, EARLY_GLITCH_DELAY_MS);

    const triggerGlitch = () => {
      if (Math.random() < 0.05) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS);
      }
    };
    const interval = setInterval(triggerGlitch, GLITCH_CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(earlyGlitch);
      clearInterval(interval);
    };
  }, [phase]);

  // Cat presence events
  useEffect(() => {
    if (phase !== 'game' || !state.cat.unlocked) return;

    const catEvent = setInterval(() => {
      const now = Date.now();
      const timeSinceLast = now - state.cat.lastInteractionAt;

      // Cat absence event (rare)
      if (
        state.cat.isPresent &&
        Math.random() < CAT_ABSENCE_CHANCE &&
        timeSinceLast > CAT_ABSENCE_THRESHOLD_MS
      ) {
        updateCat({ isPresent: false, lastInteractionAt: now });
        addGlitchedHistory({
          type: 'system',
          text: 'SYSTEM: internal biometric signal lost. [CAT_MODULE_OFFLINE]',
        });
      } else if (!state.cat.isPresent && Math.random() < CAT_RETURN_CHANCE) {
        updateCat({ isPresent: true, lastInteractionAt: now });
        addGlitchedHistory({
          type: 'system',
          text: 'SYSTEM: internal biometric signal restored. carrying static dust.',
        });
      }
    }, CAT_ABSENCE_CHECK_INTERVAL_MS);

    return () => clearInterval(catEvent);
  }, [phase, state.cat, updateCat, addGlitchedHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.history]);

  useEffect(() => {
    const handleGlobalClick = () => inputRef.current?.focus();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const updateCursorPos = () => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart || 0);
    }
  };

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      sounds.execute();
      const trimmedCmd = input.trim();
      if (!trimmedCmd) return;

      addHistory({ type: 'input', text: `${state.currentDir}> ${trimmedCmd}` });
      setLastActivity(Date.now());
      setIsProcessing(true);
      setTimeout(
        () => {
          processCommand(trimmedCmd);
          setIsProcessing(false);
        },
        COMMAND_LATENCY_MIN_MS + Math.random() * (COMMAND_LATENCY_MAX_MS - COMMAND_LATENCY_MIN_MS)
      );
      setCmdHistory([trimmedCmd, ...cmdHistory]);
      setHistoryIndex(-1);
      setInput('');
      setCursorPos(0);
    } else if (e.key === 'ArrowUp') {
      const nextIndex = historyIndex + 1;
      if (nextIndex < cmdHistory.length) {
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedState = JSON.parse(event.target.result);
        // Basic validation
        if (loadedState.history && loadedState.currentDir) {
          loadState(loadedState);
          addGlitchedHistory({
            type: 'system',
            text: 'PROGRESS LOADED. RE-ESTABLISHING SESSION...',
          });
        } else {
          addGlitchedHistory({ type: 'error', text: 'FAILED: Invalid backup format.' });
        }
      } catch {
        addGlitchedHistory({ type: 'error', text: 'FAILED: Could not parse backup file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset for same file re-selection
  };

  const secondsAgo = Math.floor((Date.now() - lastActivity) / 1000);
  const activeSkin =
    state.skins?.active && state.skins.active !== 'default' ? `skin-${state.skins.active}` : '';
  const arc = repairStatus(state);
  const arcEnding = endingInfo(state);
  const activeProcs = (state.processes || []).filter((p) => !p.terminated);
  const bestiaryView = mergedBestiary(state);
  const bestiaryPct = discoveryPercent(bestiaryView);
  const bestiaryFound = discoveredCount(bestiaryView);
  const bestiaryTotal = totalEntries(bestiaryView);
  const weeklyInfo = getWeeklyChallenge();
  const weeklyScore = scoreWeekly(state, weeklyInfo.challenge);
  const radioStation = (state.radio?.station || 'lofi').toUpperCase();
  const objective = getObjective(state);

  return (
    <AnimatePresence mode="wait">
      {phase === 'boot' && <BootSequence key="boot" onComplete={() => setPhase('start')} />}
      {phase === 'start' && <StartScreen key="start" onStart={() => setPhase('game')} />}
      {phase === 'game' && (
        <motion.div
          key="game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`crt-container h-screen flex flex-col font-mono selection:bg-(--text-primary) selection:text-black overflow-hidden relative ${isGlitching ? 'glitch-line opacity-80' : ''} ${activeSkin}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileLoad}
            accept=".json"
            className="hidden"
          />
          <div className="crt-overlay" />
          <div className="crt-scanlines" />
          <div className="crt-flicker" />
          <div className="screen-noise" />

          {isGlitching && (
            <div className="absolute inset-0 flex items-center justify-center z-[2000] pointer-events-none">
              <div className="bg-[#050505] text-(--text-error) p-4 text-2xl font-bold glitch-text">
                DON'T TRUST EVERYTHING
              </div>
            </div>
          )}

          <StatusBar state={state} />

          <div className="flex-1 flex overflow-hidden p-2 gap-2">
            {/* Main Terminal Window */}
            <div className="flex-[3] flex flex-col terminal-window border-(--text-secondary)">
              <div className="terminal-window-header border-(--text-secondary) flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Search size={10} /> PRIMARY_TERMINAL_SESSION
                </span>
                <span className="text-[9px]">PID: 4882</span>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 scroll-smooth terminal-area relative z-10"
              >
                {state.history.map((line, i) => (
                  <div
                    key={i}
                    className={`terminal-line mb-1 leading-relaxed ${
                      line?.type === 'error'
                        ? 'text-(--text-error)'
                        : line?.type === 'system'
                          ? 'text-(--text-secondary)'
                          : line?.type === 'achievement'
                            ? 'text-(--text-warning) font-bold py-2 border-y border-(--text-warning)/20 my-2'
                            : line?.type === 'input'
                              ? 'text-(--text-primary) opacity-70'
                              : 'text-(--text-primary)'
                    } ${line?.glitch ? 'glitch-line' : ''}`}
                  >
                    {line?.text}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-(--text-secondary) bg-(--bg-color) relative z-20">
                <div className="flex items-center relative overflow-hidden">
                  <span className="text-(--text-secondary) mr-2 font-bold whitespace-nowrap">
                    {state.currentDir}&gt;
                  </span>
                  <div className="flex-1 relative font-mono">
                    <input
                      ref={inputRef}
                      autoFocus
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-(--text-primary) caret-transparent absolute inset-0 z-10"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        updateCursorPos();
                        sounds.keypress();
                      }}
                      onKeyDown={(e) => {
                        handleCommand(e);
                        setTimeout(updateCursorPos, 10);
                      }}
                      onKeyUp={updateCursorPos}
                      onClick={updateCursorPos}
                      spellCheck="false"
                      autoComplete="off"
                    />
                    <div className="pointer-events-none relative flex whitespace-pre">
                      <span>{input.slice(0, cursorPos)}</span>
                      <div className="cursor-blink inline-block w-2" />
                      <span>{input.slice(cursorPos)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-1 h-0.5 w-full bg-(--text-primary) opacity-20" />
              </div>
            </div>

            {/* Right Side Panels */}
            <div className="hidden lg:flex flex-1 flex-col gap-2 overflow-y-auto scrollbar-hide">
              <TerminalPanel title="OBJECTIVE">
                <div className="text-[10px] space-y-1">
                  <div className="text-(--text-warning) font-bold">{objective.title}</div>
                  <div className="opacity-90">{objective.detail}</div>
                  {objective.progress && (
                    <div className="w-full bg-(--text-secondary)/30 h-1 mt-2">
                      <div
                        className="h-full bg-(--text-warning)"
                        style={{
                          width: `${(objective.progress.current / objective.progress.total) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                  {objective.progress && (
                    <div className="opacity-60">
                      {objective.progress.current}/{objective.progress.total}
                    </div>
                  )}
                </div>
              </TerminalPanel>

              <TerminalPanel title="UI_ELEMENTS">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span>BITS_DISPLAY</span>
                    <span className="text-(--text-bits)">{state.bits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CURSOR_POS</span>
                    <span className="text-(--text-primary)">{cursorPos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>INPUT_LEN</span>
                    <span className="text-(--text-primary)">{input.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BUSY_SIGNAL</span>
                    <span
                      className={isProcessing ? 'text-(--text-error)' : 'text-(--text-primary)'}
                    >
                      {isProcessing ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] opacity-60">
                    <span>LAST_ACT_T</span>
                    <span>{secondsAgo}s AGO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IO_PORT</span>
                    <div className="cursor-blink" />
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-(--text-secondary)/30">
                    {state.cat.unlocked && (
                      <div className="flex flex-col gap-1 p-2 bg-(--text-secondary)/15 border border-(--text-primary)/30 rounded mb-2">
                        <div className="flex justify-between items-center text-[8px]">
                          <span className="text-(--text-primary)">
                            CAT_UNIT: {state.cat.isPresent ? '[ PRESENT ]' : '[ ABSENT ]'}
                          </span>
                          <span className="text-(--text-bits)">TRUST: {state.cat.trust}%</span>
                        </div>
                        <div className="w-full bg-(--bg-color) h-1">
                          <div
                            className="h-full bg-(--text-primary)"
                            style={{ width: `${state.cat.trust}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[7px] opacity-60">
                          <span>HUNGER: {state.cat.hunger}%</span>
                          <span>FRAGMENTS: {state.cat.fragmentsFound}/3</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        sounds.execute();
                        processCommand('save');
                      }}
                      className="w-full py-1 border border-(--text-primary) text-[9px] hover:bg-(--text-primary) hover:text-black transition-colors"
                    >
                      EXPORT_BACKUP.EXE
                    </button>
                    <button
                      onClick={() => {
                        sounds.execute();
                        processCommand('load');
                      }}
                      className="w-full py-1 border border-(--text-bits) text-[9px] text-(--text-bits) hover:bg-(--text-bits) hover:text-black transition-colors"
                    >
                      IMPORT_BACKUP.SYS
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>LOAD_STT</span>
                    <div className="w-full bg-(--text-secondary)/30 h-1.5 border border-(--text-secondary)/60">
                      <div className="h-full bg-(--text-primary) w-2/3 animate-pulse" />
                    </div>
                  </div>
                </div>
              </TerminalPanel>

              <TerminalPanel title="DAEMON_DAILY">
                <div className="text-[10px] space-y-1">
                  <div>
                    STREAK:{' '}
                    <span className="text-(--text-warning)">{state.daily?.streak || 0}d</span>
                    <span className="opacity-60">
                      {' '}
                      LAST: {state.daily?.completedDate || 'NONE'}
                    </span>
                  </div>
                  {(state.daily?.quests || []).map((q, i) => (
                    <div key={i} className="opacity-90">
                      [{q.type}] {q.description}{' '}
                      <span className="text-(--text-bits)">+{q.reward}B</span>
                    </div>
                  ))}
                  <div className="mt-1 italic opacity-50">
                    Run "daily" in the terminal to claim.
                  </div>
                </div>
              </TerminalPanel>

              <TerminalPanel title="ARC_LOG">
                <div className="text-[10px]">
                  <div>
                    STAGE: <span className="text-(--text-bits)">{arc.stageName}</span>
                  </div>
                  <div className="w-full bg-(--text-secondary)/30 h-1 mt-2">
                    <div
                      className="h-full bg-(--text-primary)"
                      style={{ width: `${arc.total ? (arc.repaired / arc.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>
                      SECTORS: {arc.repaired}/{arc.total}
                    </span>
                    <span className="opacity-50">"story"</span>
                  </div>
                  {arcEnding && (
                    <div className="mt-1 text-(--text-warning)">
                      ENDING: {arcEnding.name} ({arcEnding.title})
                    </div>
                  )}
                </div>
              </TerminalPanel>

              <TerminalPanel title="PROCESSES">
                <div className="text-[10px] space-y-1">
                  {activeProcs.length === 0 ? (
                    <span className="opacity-40 italic">No active processes. "ps"</span>
                  ) : (
                    activeProcs.slice(0, 5).map((p) => (
                      <div key={p.pid} className="flex justify-between">
                        <span className={isDangerous(p) ? 'text-(--text-error)' : ''}>
                          {p.pid} {p.name}
                        </span>
                        <span className="opacity-60">age {p.age}</span>
                      </div>
                    ))
                  )}
                  {activeProcs.length > 0 && (
                    <div className="mt-1 italic opacity-50">"kill &lt;pid&gt;" pays Bits.</div>
                  )}
                </div>
              </TerminalPanel>

              <TerminalPanel title="RADIO_NET">
                <div className="text-[10px] space-y-1">
                  <div>
                    SIGNAL:{' '}
                    <span className={state.radio?.on ? 'text-(--text-primary)' : 'opacity-40'}>
                      {state.radio?.on ? `ON [${radioStation}]` : 'OFF'}
                    </span>
                  </div>
                  {state.storm?.active ? (
                    <div className="text-(--text-error) animate-pulse">STORM ACTIVE — hold on</div>
                  ) : (
                    <div className="opacity-60">skies clear</div>
                  )}
                  <div className="mt-1 italic opacity-50">"radio tune", "storm"</div>
                </div>
              </TerminalPanel>

              <TerminalPanel title="WEEKLY_OPS">
                <div className="text-[10px] space-y-1">
                  <div className="opacity-90">{weeklyInfo.challenge}</div>
                  <div>
                    YOU: <span className="text-(--text-bits)">{weeklyScore}</span>
                    <span className="opacity-60"> [{weeklyInfo.weekStart}]</span>
                  </div>
                  {(state.prestige || 0) > 0 && (
                    <div className="text-(--text-warning)">
                      PRESTIGE {state.prestige}: {prestigeTitle(state.prestige)}
                    </div>
                  )}
                  <div className="mt-1 italic opacity-50">"weekly", "recompile"</div>
                </div>
              </TerminalPanel>

              <TerminalPanel title="BESTIARY">
                <div className="text-[10px]">
                  <div>
                    DISCOVERED:{' '}
                    <span className="text-(--text-bits)">
                      {bestiaryFound}/{bestiaryTotal} ({bestiaryPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-(--text-secondary)/30 h-1 mt-2">
                    <div
                      className="h-full bg-(--text-primary)"
                      style={{ width: `${bestiaryPct}%` }}
                    />
                  </div>
                  <div className="mt-1 italic opacity-50">"bestiary" opens the gallery</div>
                </div>
              </TerminalPanel>

              <TerminalPanel title="ACHIEVEMENTS">
                <div className="max-h-[150px] overflow-y-auto pr-1">
                  {state.achievements.length > 0 ? (
                    state.achievements.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center text-(--text-warning) mb-1">
                        <Award size={12} />
                        <span className="text-[10px]">{a}</span>
                      </div>
                    ))
                  ) : (
                    <span className="opacity-40 italic">No achievements detected.</span>
                  )}
                </div>
              </TerminalPanel>

              <TerminalPanel title="SYSTEM_LOGS">
                <div className="text-[10px] space-y-1">
                  <div className="text-(--text-warning)">WARN: UNKNOWN SIGNAL</div>
                  <div className="text-(--text-error)">ERR: MEM_LEAK_0X</div>
                  <div className="text-(--text-primary)">LOG: ENCRYPTION ACTIVE</div>
                  <div className="flex items-center gap-1 text-(--text-error)">
                    <ShieldAlert size={10} />
                    <span>RESTRICTED_ACCESS</span>
                  </div>
                </div>
              </TerminalPanel>

              <TerminalPanel title="GLITCH_EXP">
                <div className="glitch-text text-[10px]">CORRUPTED_SECTOR_7</div>
                <div className="glitch-text text-[10px] ml-4 text-(--text-error)">AUTH_FAIL</div>
              </TerminalPanel>
            </div>
          </div>

          {/* Bottom Layout Utilities */}
          <div className="hidden md:flex p-2 gap-2 min-h-[120px]">
            <TerminalPanel title="FILE_SYSTEM_VISUALIZER" className="flex-[2]">
              <div className="flex gap-6 overflow-x-auto py-2 px-4 scrollbar-hide">
                {getEntry(state.currentDir)?.children.map((name, i) => {
                  const childPath = resolvePath(state.currentDir, name);
                  const entry = getEntry(childPath);
                  const type = entry?.type || 'file';

                  return (
                    <FileIcon
                      key={i}
                      type={type}
                      name={name}
                      isHidden={entry?.isHidden}
                      onClick={() => {
                        sounds.execute();
                        const cmd = type === 'dir' ? `cd ${childPath}` : `cat ${childPath}`;
                        addHistory({ type: 'input', text: `${state.currentDir}> ${cmd}` });
                        setLastActivity(Date.now());
                        setIsProcessing(true);
                        setTimeout(
                          () => {
                            processCommand(cmd);
                            setIsProcessing(false);
                          },
                          COMMAND_LATENCY_MIN_MS +
                            Math.random() * (COMMAND_LATENCY_MAX_MS - COMMAND_LATENCY_MIN_MS)
                        );
                      }}
                    />
                  );
                })}
              </div>
            </TerminalPanel>

            <TerminalPanel title="STORE_PREVIEW" className="flex-1">
              <div className="text-[10px] flex flex-col gap-1">
                <div className="flex justify-between text-(--text-warning)">
                  <span>☕ BUY COFFEE (support dev)</span>
                  <span>→ buycoffee.to</span>
                </div>
                <div className="flex justify-between">
                  <span>[1] BOX</span>
                  <span>50B</span>
                </div>
                <div className="flex justify-between">
                  <span>[2] DECODER</span>
                  <span>150B</span>
                </div>
                <div className="flex justify-between">
                  <span>[3] KEY</span>
                  <span>200B</span>
                </div>
                <div className="flex justify-between opacity-80">
                  <span>theme amber</span>
                  <span className="text-(--text-warning)">300B</span>
                </div>
                <div className="flex justify-between opacity-80">
                  <span>theme cyan</span>
                  <span className="text-(--text-warning)">250B</span>
                </div>
                <div className="flex justify-between opacity-80">
                  <span>theme violet</span>
                  <span className="text-(--text-warning)">400B</span>
                </div>
                <div className="mt-2 opacity-50 italic">
                  Try "play crash", "play leak", "daily", "stats".
                </div>
              </div>
            </TerminalPanel>

            <TerminalPanel title="ITEM_PREVIEW" className="flex-1">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="wireframe-cube" />
                <div className="text-[8px] text-center mt-2 opacity-60">ACTIVE_ITEM_SCANNER</div>
              </div>
            </TerminalPanel>
          </div>

          {/* Mobile Input (Sticky) */}
          <div className="md:hidden border-t border-(--text-secondary) p-2 bg-(--bg-color)">
            <div className="flex items-center text-[12px]">
              <span className="text-(--text-secondary) mr-2">{state.currentDir}&gt;</span>
              <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-(--text-primary)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  updateCursorPos();
                  sounds.keypress();
                }}
                onKeyDown={handleCommand}
                enterKeyHint="send"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
