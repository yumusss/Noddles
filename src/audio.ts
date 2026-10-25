// Tiny Web Audio synth: sound effects + a gentle lo-fi loop. No asset files needed.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let sfxOn = true;
let musicOn = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function setSfx(on: boolean) {
  sfxOn = on;
}

export function setMusic(on: boolean) {
  musicOn = on;
  if (!on) stopMusic();
}

function tone(
  freq: number,
  dur: number,
  opts: {
    type?: OscillatorType;
    vol?: number;
    delay?: number;
    slide?: number;
    out?: AudioNode;
  } = {}
) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + (opts.delay ?? 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (opts.slide)
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * opts.slide), t + dur);
  const v = opts.vol ?? 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(opts.out ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(
  dur: number,
  opts: { vol?: number; freq?: number; q?: number; delay?: number } = {}
) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + (opts.delay ?? 0);
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = opts.freq ?? 1200;
  f.Q.value = opts.q ?? 0.8;
  const g = c.createGain();
  g.gain.value = opts.vol ?? 0.25;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
}

export type Sfx =
  | 'tap'
  | 'pop'
  | 'splash'
  | 'drop'
  | 'ding'
  | 'door'
  | 'coins'
  | 'perfect'
  | 'fail'
  | 'phone'
  | 'angry'
  | 'win'
  | 'star'
  | 'bubble'
  | 'whoosh'
  | 'trash';

export function sfx(name: Sfx) {
  if (!sfxOn) return;
  switch (name) {
    case 'tap':
      tone(660, 0.06, { type: 'triangle', vol: 0.15 });
      break;
    case 'pop':
      tone(520, 0.1, { type: 'sine', vol: 0.3, slide: 1.9 });
      break;
    case 'splash':
      noise(0.35, { freq: 900, q: 0.6, vol: 0.35 });
      tone(180, 0.25, { type: 'sine', vol: 0.15, slide: 0.6 });
      break;
    case 'drop':
      noise(0.2, { freq: 400, vol: 0.3 });
      tone(240, 0.15, { type: 'sine', vol: 0.2, slide: 0.5 });
      break;
    case 'bubble':
      tone(300 + Math.random() * 300, 0.08, { type: 'sine', vol: 0.08, slide: 1.6 });
      break;
    case 'ding':
      tone(1318, 0.5, { type: 'sine', vol: 0.25 });
      tone(1760, 0.6, { type: 'sine', vol: 0.12, delay: 0.08 });
      break;
    case 'door':
      tone(1046, 0.35, { type: 'triangle', vol: 0.15 });
      tone(1318, 0.45, { type: 'triangle', vol: 0.12, delay: 0.12 });
      break;
    case 'coins':
      [0, 0.06, 0.12].forEach((d, i) =>
        tone(1500 + i * 300, 0.18, { type: 'square', vol: 0.06, delay: d })
      );
      break;
    case 'perfect':
      [523, 659, 784, 1046].forEach((f, i) =>
        tone(f, 0.25, { type: 'triangle', vol: 0.18, delay: i * 0.07 })
      );
      break;
    case 'fail':
      tone(220, 0.35, { type: 'sawtooth', vol: 0.12, slide: 0.6 });
      break;
    case 'angry':
      tone(160, 0.3, { type: 'square', vol: 0.08 });
      tone(140, 0.35, { type: 'square', vol: 0.08, delay: 0.15 });
      break;
    case 'phone':
      [0, 0.18, 0.5, 0.68].forEach((d) =>
        tone(1180, 0.13, { type: 'square', vol: 0.06, delay: d })
      );
      break;
    case 'win':
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) =>
        tone(f, 0.3, { type: 'triangle', vol: 0.18, delay: i * 0.12 })
      );
      break;
    case 'star':
      tone(1046, 0.3, { type: 'sine', vol: 0.25, slide: 1.5 });
      break;
    case 'whoosh':
      noise(0.4, { freq: 2200, q: 0.4, vol: 0.2 });
      break;
    case 'trash':
      noise(0.25, { freq: 300, vol: 0.3 });
      break;
  }
}

// ---- gentle pentatonic lo-fi loop ----
const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
const CHORDS = [
  [130.8, 196, 329.6],
  [110, 164.8, 261.6],
  [87.3, 130.8, 220],
  [98, 146.8, 246.9],
];

export function startMusic() {
  if (!musicOn || musicTimer !== null) return;
  const c = ac();
  if (!c || !musicGain) return;
  let step = 0;
  const beat = 0.42;
  const tick = () => {
    if (!musicGain) return;
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    if (step % 8 === 0)
      chord.forEach((f) => tone(f, beat * 7.5, { type: 'sine', vol: 0.22, out: musicGain! }));
    if (step % 2 === 0)
      tone(chord[0] / 2, beat * 1.5, { type: 'triangle', vol: 0.25, out: musicGain! });
    if (Math.random() < 0.55) {
      const n = SCALE[Math.floor(Math.random() * SCALE.length)];
      tone(n, beat * 1.2, { type: 'triangle', vol: 0.16, out: musicGain! });
    }
    step++;
  };
  tick();
  musicTimer = window.setInterval(tick, beat * 1000);
}

export function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function buzz(ms = 15) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}
