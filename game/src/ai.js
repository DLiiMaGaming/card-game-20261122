// EMBER COURT — the Ashen Duchess: an opponent whose choices you can read
// and counter. Before her turn she announces an intent (strike / mend /
// guard / gather); during it she plays 1–3 cards, one at a time, so every
// move is visible. Her taste: finish a wounded challenger, mend herself
// when hurt, guard when you are about to hit hard, and always chase a
// second card of the same suit for Resonance.
import { CONFIG } from './config.js';
import { applyCard } from './state.js';

export function chooseIntent(game) {
  const me = game.enemy;
  const you = game.player;
  if (you.life <= 8 && me.hand.some((c) => c.kind === 'damage' || c.kind === 'hybrid')) return 'strike';
  if (me.life <= 12 && me.hand.some((c) => c.kind === 'heal' || c.kind === 'hybrid')) return 'mend';
  if (you.hand.some((c) => c.kind === 'damage' && c.value >= 7)) return 'guard';
  if (me.hand.some((c) => c.kind === 'ember' || c.kind === 'draw')) return 'gather';
  return 'strike';
}

export const INTENT_LABEL = {
  strike: '⚔ STRIKE — she means to hurt you',
  mend: '✚ MEND — she will heal herself',
  guard: '■ GUARD — she will raise block',
  gather: '◆ GATHER — she will draw and stock embers',
};

// Pick the Duchess's next card. Scores each affordable card by how well it
// fits her intent, with a bonus for completing a Resonance pair.
export function pickAiCard(game) {
  const me = game.enemy;
  const you = game.player;
  const intent = game.aiIntent || 'strike';
  let best = null;
  let bestScore = -1;
  for (const card of me.hand) {
    if (card.cost > me.ember) continue;
    let s = 0;
    const v = Array.isArray(card.value) ? card.value[0] : card.value;
    if (intent === 'strike' && (card.kind === 'damage' || (card.kind === 'hybrid' && card.suit === 'flame'))) s += 30 + v;
    if (intent === 'mend' && (card.kind === 'heal' || (card.kind === 'hybrid' && card.suit === 'tide'))) s += 30 + v;
    if (intent === 'guard' && (card.kind === 'block' || (card.kind === 'hybrid' && card.suit === 'stone'))) s += 30 + v;
    if (intent === 'gather' && (card.kind === 'ember' || card.kind === 'draw' || (card.kind === 'hybrid' && card.suit === 'gale'))) s += 30 + v;
    if (card.kind === 'damage') s += v * 2 + (you.life - v <= 0 ? 50 : 0);
    if (card.kind === 'heal') s += Math.min(v, me.maxLife - me.life) * 2;
    if (card.kind === 'block') s += v;
    if (card.kind === 'ember' || card.kind === 'draw') s += v * 3;
    if (me.suitCountThisTurn[card.suit] === 1) s += 25; // completes Resonance
    s -= card.cost * 2; // prefer cheap, efficient plays
    if (s > bestScore) { bestScore = s; best = card; }
  }
  return best;
}

// Run the Duchess's turn as a timed sequence of visible plays. Calls
// onStep after each card (so the table re-renders) and onDone at the end.
export function runAiTurn(game, onStep, onDone) {
  game.aiIntent = chooseIntent(game);
  const plays = CONFIG.AI_MIN_PLAYS + Math.floor(Math.random() * (CONFIG.AI_MAX_PLAYS - CONFIG.AI_MIN_PLAYS + 1));
  let done = 0;
  const step = () => {
    if (game.phase !== 'ai' || done >= plays) { onDone(); return; }
    const card = pickAiCard(game);
    if (!card) { onDone(); return; }
    applyCard(game, card, false);
    done += 1;
    onStep();
    if (game.phase === 'won' || game.phase === 'lost') { onDone(); return; }
    setTimeout(step, CONFIG.AI_STEP_MS);
  };
  setTimeout(step, CONFIG.AI_STEP_MS);
}
