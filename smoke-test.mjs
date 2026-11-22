// Smoke test for EMBER COURT logic (Node, no DOM): deck integrity, turn
// flow, card effects, Resonance, AI picks, and full simulated duels.
import { CONFIG } from './game/src/config.js';
import { CARD_DEFS, shuffleDeck, cardById } from './game/src/cards.js';
import { newGame, startDuel, beginPlayerTurn, beginAiTurn, endPlayerTurn, canPlay, applyCard, checkEnd } from './game/src/state.js';
import { chooseIntent, pickAiCard } from './game/src/ai.js';

let pass = 0, fail = 0;
function t(name, cond) { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name); } }

// 1. Deck: 24 unique cards, 6 per suit, costs 1..6 present.
t('deck has 24 cards', CARD_DEFS.length === 24);
t('6 cards per suit', ['flame', 'tide', 'stone', 'gale'].every((s) => CARD_DEFS.filter((c) => c.suit === s).length === 6));
t('all ids unique', new Set(CARD_DEFS.map((c) => c.id)).size === 24);
t('all costs 1..6', CARD_DEFS.every((c) => c.cost >= 1 && c.cost <= 6));
t('shuffle keeps 24', shuffleDeck(7).length === 24);

// 2. Start: hands, embers, phase.
const g = newGame(42);
startDuel(g);
t('phase player after start', g.phase === 'player');
t('player hand 5', g.player.hand.length === CONFIG.START_HAND);
t('enemy hand 4', g.enemy.hand.length === CONFIG.AI_HAND_SIZE);
t('player ember 3/3', g.player.ember === 3 && g.player.emberMax === 3);
t('both life 30', g.player.life === 30 && g.enemy.life === 30);

// 3. Playing a damage card reduces enemy life and costs ember.
const dmg = g.player.hand.find((c) => c.kind === 'damage' && c.cost <= g.player.ember)
  || g.player.hand.find((c) => c.cost <= g.player.ember);
t('opening hand has an affordable card', !!dmg);
const e0 = g.player.ember, l0 = g.enemy.life;
applyCard(g, dmg, true);
t('ember spent', g.player.ember === e0 - dmg.cost);
if (dmg.kind === 'damage') t('enemy life fell by value', g.enemy.life === l0 - dmg.value);
t('card left hand', !g.player.hand.some((c) => c.uid === dmg.uid));
t('card in discard', g.player.discard.some((c) => c.uid === dmg.uid));

// 4. Block absorbs damage.
const g2 = newGame(43);
startDuel(g2);
g2.player.block = 5;
const before = g2.player.life;
applyCard(g2, { ...cardById('flame-lash'), uid: 'x' }, false);
t('block absorbed 5 of 5 dmg', g2.player.life === before && g2.player.block === 0);

// 5. Resonance: two flame cards in one turn fire the bonus.
const g3 = newGame(44);
startDuel(g3);
g3.player.ember = 10;
g3.player.hand = [{ ...cardById('ember-spark'), uid: 'a' }, { ...cardById('flame-lash'), uid: 'b' }];
const l3 = g3.enemy.life;
applyCard(g3, g3.player.hand[0], true);
applyCard(g3, g3.player.hand[0], true);
t('resonance fired once', g3.stats.resonances === 1);
t('resonance added +4 dmg', g3.enemy.life === l3 - 3 - 5 - CONFIG.RESONANCE_FLAME_DAMAGE);

// 6. Heal caps at max life; score grows with damage.
const g4 = newGame(45);
startDuel(g4);
g4.player.life = 28; g4.player.ember = 10;
g4.player.hand = [{ ...cardById('moonwell'), uid: 'h' }];
applyCard(g4, g4.player.hand[0], true);
t('heal caps at 30', g4.player.life === 30);
t('score positive after plays', g4.score > 0);

// 7. AI: intent is one of the four; it picks an affordable card.
const g5 = newGame(46);
startDuel(g5);
beginAiTurn(g5);
const intent = chooseIntent(g5);
t('intent valid', ['strike', 'mend', 'guard', 'gather'].includes(intent));
g5.aiIntent = intent;
const pick = pickAiCard(g5);
t('ai picks affordable card', pick && pick.cost <= g5.enemy.ember);

// 8. Full simulated duels always terminate with a winner.
let winners = { player: 0, enemy: 0 };
for (let s = 100; s < 120; s++) {
  const sim = newGame(s);
  startDuel(sim);
  let guard = 0;
  while (sim.phase !== 'won' && sim.phase !== 'lost' && guard++ < 200) {
    // naive player: play cheapest affordable damage, else any affordable
    let played = false;
    for (const card of [...sim.player.hand].sort((a, b) => a.cost - b.cost)) {
      if (canPlay(sim, card).ok) { applyCard(sim, card, true); played = true; if (sim.phase === 'won' || sim.phase === 'lost') break; }
    }
    if (sim.phase === 'won' || sim.phase === 'lost') break;
    endPlayerTurn(sim);
    beginAiTurn(sim);
    sim.aiIntent = chooseIntent(sim);
    let n = 0;
    while (n++ < 3 && sim.phase === 'ai') {
      const c = pickAiCard(sim);
      if (!c) break;
      applyCard(sim, c, false);
      if (sim.phase === 'won' || sim.phase === 'lost') break;
    }
    if (sim.phase === 'won' || sim.phase === 'lost') break;
    beginPlayerTurn(sim);
  }
  t(`sim duel ${s} ends (guard ${guard})`, sim.phase === 'won' || sim.phase === 'lost');
  if (sim.phase === 'won') winners.player++; else winners.enemy++;
  t(`sim duel ${s} score sane`, sim.score >= 0 && sim.score < 10000);
}
console.log('winners:', winners);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
