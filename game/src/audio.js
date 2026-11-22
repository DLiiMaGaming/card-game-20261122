// EMBER COURT — sound: tiny WebAudio synth, no files. A blip for a play,
// a thud for damage, a chime for healing, a swell for Resonance, and a
// short fanfare for the win. Everything is guarded: no AudioContext, no
// crash, and the mute toggle survives the session.
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (e) { return null; }
}

function tone(freq, dur, type, gain, when) {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + (when || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch (e) { /* sound is decoration, never a blocker */ }
}

export function sfxPlay() { tone(520, 0.09, 'triangle', 0.10); tone(780, 0.12, 'triangle', 0.07, 0.05); }
export function sfxDamage() { tone(140, 0.18, 'sawtooth', 0.14); tone(90, 0.22, 'square', 0.10, 0.03); }
export function sfxHeal() { tone(660, 0.14, 'sine', 0.10); tone(880, 0.2, 'sine', 0.09, 0.08); }
export function sfxBlock() { tone(240, 0.12, 'square', 0.07); }
export function sfxDraw() { tone(440, 0.07, 'triangle', 0.08); }
export function sfxResonance() { tone(523, 0.1, 'triangle', 0.11); tone(659, 0.1, 'triangle', 0.11, 0.09); tone(784, 0.22, 'triangle', 0.12, 0.18); }
export function sfxWin() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.13)); }
export function sfxLose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sine', 0.10, i * 0.16)); }
export function sfxClick() { tone(700, 0.05, 'triangle', 0.06); }
