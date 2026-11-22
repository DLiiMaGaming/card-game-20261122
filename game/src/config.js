// EMBER COURT — tuning constants: one place for every number the duel runs on.
export const CONFIG = {
  START_LIFE: 30,
  MAX_LIFE: 30,
  START_HAND: 5,
  HAND_MAX: 7,
  DRAW_PER_TURN: 2,
  START_EMBER: 3,
  EMBER_PER_TURN: 1,
  EMBER_MAX: 10,
  BLOCK_DECAY_PER_TURN: 0,
  RESONANCE_NEED: 2,
  RESONANCE_FLAME_DAMAGE: 4,
  RESONANCE_TIDE_HEAL: 5,
  RESONANCE_STONE_BLOCK: 6,
  RESONANCE_GALE_EMBER: 2,
  SCORE_PER_DAMAGE: 1,
  SCORE_PER_HEAL: 1,
  SCORE_PER_RESONANCE: 10,
  SCORE_WIN_BONUS: 100,
  AI_HAND_SIZE: 4,
  AI_MIN_PLAYS: 1,
  AI_MAX_PLAYS: 3,
  AI_STEP_MS: 750,
};

// Suit table: colour + shape + name, so a suit is told apart by colour and
// shape, never by text alone.
export const SUITS = {
  flame: { name: 'FLAME', glyph: '▲', color: '#ff5a3c', dark: '#a12712', glow: 'rgba(255,90,60,.55)' },
  tide:  { name: 'TIDE',  glyph: '●', color: '#3fa9ff', dark: '#0d4f8a', glow: 'rgba(63,169,255,.55)' },
  stone: { name: 'STONE', glyph: '■', color: '#ffb347', dark: '#8a5a10', glow: 'rgba(255,179,71,.55)' },
  gale:  { name: 'GALE',  glyph: '◆', color: '#4ade80', dark: '#146c33', glow: 'rgba(74,222,128,.55)' },
};

export function suitOf(card) { return SUITS[card.suit]; }
