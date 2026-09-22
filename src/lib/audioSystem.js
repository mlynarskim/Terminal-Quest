let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (freq, duration, type = 'square', volume = 0.1) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const sounds = {
  keypress: () => {
    // High-pitched "click"
    playTone(1500, 0.05, 'sine', 0.05);
  },
  execute: () => {
    // Confirmation chirp
    playTone(800, 0.1, 'square', 0.05);
    setTimeout(() => playTone(1200, 0.1, 'square', 0.05), 50);
  },
  error: () => {
    // Low double buzz
    playTone(150, 0.2, 'sawtooth', 0.1);
    setTimeout(() => playTone(120, 0.2, 'sawtooth', 0.1), 100);
  },
  achievement: () => {
    // Upward arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.1), i * 100);
    });
  },
  boot: () => {
    // Sequence of blips
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(Math.random() * 2000 + 500, 0.05, 'square', 0.03);
      }, i * 150);
    }
  },
  startup: () => {
    // Low hum starting up
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  },
};
