// EMBER COURT — game state: one duel, both fighters, the turn flow, the
// Court Resonance combo, and the score. No DOM here: pure rules.
import { CONFIG } from './config.js';
import { shuffleDeck } from './cards.js';

export function newFighter(name, isAi) {
  return {
    name, isAi,
    life: CONFIG.START_LIFE,
    maxLife: CONFIG.MAX_LIFE,
    block: 0,
    ember: 0,
    emberMax: 0,
    deck: [],
    hand: [],
    discard: [],
    playedThisTurn: [],
    suitCountThisTurn: { flame: 0, tide: 0, stone: 0, gale: 0 },
    resonanceFired: { flame: false, tide: false, stone: false, gale: false },
  };
}

export function newGame(seed) {
  const game = {
    seed: seed || (Date.now() % 2147483647),
    turn: 1,
    phase: 'title', // title | player | ai | won | lost
    player: newFighter('You', false),
    enemy: newFighter('Ashen Duchess', true),
    log: [],
    stats: { damageDealt: 0, healingDone: 0, cardsPlayed: 0, resonances: 0, turnsTaken: 0 },
    score: 0,
    lastPlay: null, // {card, by} for the centre-table animation
    aiIntent: null, // 'strike' | 'mend' | 'guard' | 'gather'
    resonanceFlash: null, // suit name flashing right now
    winner: null,
  };
  return game;
}

export function startDuel(game) {
  game.player.deck = shuffleDeck(game.seed);
  game.enemy.deck = shuffleDeck(game.seed + 101);
  drawCards(game.player, CONFIG.START_HAND);
  drawCards(game.enemy, CONFIG.AI_HAND_SIZE);
  // Opening mulligan: the first hand must hold at least one card the
  // player can afford, or turn one is a dead click.
  let tries = 0;
  while (!game.player.hand.some((c) => c.cost <= CONFIG.START_EMBER) && tries++ < 10) {
    game.player.deck.push(...game.player.hand.splice(0));
    game.player.deck.sort(() => Math.random() - 0.5);
    drawCards(game.player, CONFIG.START_HAND);
  }
  game.player.emberMax = CONFIG.START_EMBER;
  game.player.ember = CONFIG.START_EMBER;
  game.enemy.emberMax = CONFIG.START_EMBER;
  game.enemy.ember = CONFIG.START_EMBER;
  game.phase = 'player';
  game.turn = 1;
  addLog(game, 'The duel begins — the Duchess bows. Your move, challenger.');
  return game;
}

export function drawCards(fighter, n) {
  for (let i = 0; i < n; i++) {
    if (fighter.hand.length >= CONFIG.HAND_MAX) break;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) break;
      fighter.deck = fighter.discard.splice(0).reverse();
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

export function beginPlayerTurn(game) {
  const p = game.player;
  p.emberMax = Math.min(CONFIG.EMBER_MAX, p.emberMax + CONFIG.EMBER_PER_TURN);
  p.ember = p.emberMax;
  p.playedThisTurn = [];
  p.suitCountThisTurn = { flame: 0, tide: 0, stone: 0, gale: 0 };
  p.resonanceFired = { flame: false, tide: false, stone: false, gale: false };
  p.block = 0;
  drawCards(p, CONFIG.DRAW_PER_TURN);
  game.turn += 1;
  game.stats.turnsTaken = game.turn;
  // Ember Storm: from turn 15 the court itself burns — escalating damage
  // to both fighters, so no duel can stall forever on heals and block.
  if (game.turn >= 15) {
    const storm = game.turn - 14;
    game.player.life = Math.max(0, game.player.life - storm);
    game.enemy.life = Math.max(0, game.enemy.life - storm);
    addLog(game, `⚡ EMBER STORM — the court burns both fighters for ${storm}.`);
    checkEnd(game);
  }
  game.phase = 'player';
  addLog(game, `Turn ${game.turn} — you draw ${CONFIG.DRAW_PER_TURN}, embers refill to ${p.ember}.`);
}

export function canPlay(game, card) {
  if (game.phase !== 'player') return { ok: false, why: 'Not your turn.' };
  if (card.cost > game.player.ember) return { ok: false, why: `Need ${card.cost} ember, have ${game.player.ember}.` };
  return { ok: true };
}

// Apply one card's effect. Returns a list of human-readable event lines.
export function applyCard(game, card, byPlayer) {
  const me = byPlayer ? game.player : game.enemy;
  const foe = byPlayer ? game.enemy : game.player;
  const lines = [];
  const verb = me.isAi ? me.name + ' plays' : 'You play';
  me.ember -= card.cost;
  me.playedThisTurn.push(card);
  me.suitCountThisTurn[card.suit] += 1;
  game.stats.cardsPlayed += 1;
  game.lastPlay = { card, by: me.name };

  const v = card.value;
  switch (card.kind) {
    case 'damage': {
      const dealt = dealDamage(game, foe, v, byPlayer);
      lines.push(`${verb} ${card.name} — ${dealt} damage to ${foe.name}.`);
      break;
    }
    case 'heal': {
      const healed = heal(game, me, v, byPlayer);
      lines.push(`${verb} ${card.name} — restores ${healed} life.`);
      break;
    }
    case 'block': {
      me.block += v;
      lines.push(`${verb} ${card.name} — gains ${v} block.`);
      break;
    }
    case 'ember': {
      me.ember = Math.min(CONFIG.EMBER_MAX, me.ember + v);
      lines.push(`${verb} ${card.name} — gains ${v} ember.`);
      break;
    }
    case 'draw': {
      drawCards(me, v);
      lines.push(`${verb} ${card.name} — draws ${v} card${v > 1 ? 's' : ''}.`);
      break;
    }
    case 'hybrid': {
      const [a, b] = v;
      if (card.suit === 'flame') { const d = dealDamage(game, foe, a, byPlayer); drawCards(me, b); lines.push(`${verb} ${card.name} — ${d} damage, draws ${b}.`); }
      if (card.suit === 'tide' && card.id === 'tidecaller') { const h = heal(game, me, a, byPlayer); drawCards(me, b); lines.push(`${verb} ${card.name} — restores ${h}, draws ${b}.`); }
      if (card.suit === 'tide' && card.id === 'coral-ward') { const h = heal(game, me, a, byPlayer); me.block += b; lines.push(`${verb} ${card.name} — restores ${h}, gains ${b} block.`); }
      if (card.suit === 'tide' && card.id === 'leviathan-gift') { const h = heal(game, me, a, byPlayer); drawCards(me, b); lines.push(`${verb} ${card.name} — restores ${h}, draws ${b}.`); }
      if (card.suit === 'stone' && card.id === 'quarry-hymn') { me.block += a; me.ember = Math.min(CONFIG.EMBER_MAX, me.ember + b); lines.push(`${verb} ${card.name} — gains ${a} block and ${b} ember.`); }
      if (card.suit === 'stone' && card.id === 'iron-oath') { me.block += a; const h = heal(game, me, b, byPlayer); lines.push(`${verb} ${card.name} — gains ${a} block, restores ${h}.`); }
      if (card.suit === 'gale' && card.id === 'sky-courier') { drawCards(me, a); me.ember = Math.min(CONFIG.EMBER_MAX, me.ember + b); lines.push(`${verb} ${card.name} — draws ${a}, gains ${b} ember.`); }
      if (card.suit === 'gale' && card.id === 'swift-gale') { drawCards(me, a); me.ember = Math.min(CONFIG.EMBER_MAX, me.ember + b); lines.push(`${verb} ${card.name} — draws ${a}, gains ${b} ember.`); }
      if (card.suit === 'gale' && card.id === 'tempest-call') { me.ember = Math.min(CONFIG.EMBER_MAX, me.ember + a); drawCards(me, b); lines.push(`${verb} ${card.name} — gains ${a} ember, draws ${b}.`); }
      break;
    }
  }

  // Court Resonance: second card of the same suit in one turn.
  const count = me.suitCountThisTurn[card.suit];
  if (count === CONFIG.RESONANCE_NEED && !me.resonanceFired[card.suit]) {
    me.resonanceFired[card.suit] = true;
    game.stats.resonances += 1;
    game.score += CONFIG.SCORE_PER_RESONANCE;
    game.resonanceFlash = card.suit;
    if (card.suit === 'flame') { const d = dealDamage(game, foe, CONFIG.RESONANCE_FLAME_DAMAGE, byPlayer); lines.push(`RESONANCE — FLAME! +${d} damage.`); }
    if (card.suit === 'tide') { const h = heal(game, me, CONFIG.RESONANCE_TIDE_HEAL, byPlayer); lines.push(`RESONANCE — TIDE! +${h} life.`); }
    if (card.suit === 'stone') { me.block += CONFIG.RESONANCE_STONE_BLOCK; lines.push(`RESONANCE — STONE! +${CONFIG.RESONANCE_STONE_BLOCK} block.`); }
    if (card.suit === 'gale') { me.ember = Math.min(CONFIG.EMBER_MAX, me.ember + CONFIG.RESONANCE_GALE_EMBER); lines.push(`RESONANCE — GALE! +${CONFIG.RESONANCE_GALE_EMBER} ember.`); }
  }

  // Move the card to the discard pile.
  const idx = me.hand.findIndex((c) => c.uid === card.uid);
  if (idx >= 0) me.hand.splice(idx, 1);
  me.discard.push(card);

  for (const line of lines) addLog(game, line);
  checkEnd(game);
  return lines;
}

export function dealDamage(game, target, amount, byPlayer) {
  let rest = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, rest);
    target.block -= absorbed;
    rest -= absorbed;
  }
  target.life = Math.max(0, target.life - rest);
  if (byPlayer) {
    game.stats.damageDealt += rest;
    game.score += rest * CONFIG.SCORE_PER_DAMAGE;
  }
  return rest;
}

export function heal(game, target, amount, byPlayer) {
  const healed = Math.min(amount, target.maxLife - target.life);
  target.life += healed;
  if (byPlayer) {
    game.stats.healingDone += healed;
    game.score += healed * CONFIG.SCORE_PER_HEAL;
  }
  return healed;
}

export function endPlayerTurn(game) {
  if (game.phase !== 'player') return;
  game.player.block = Math.max(0, game.player.block);
  game.phase = 'ai';
  addLog(game, 'You end your turn. The Duchess takes the table…');
}

export function beginAiTurn(game) {
  const e = game.enemy;
  e.emberMax = Math.min(CONFIG.EMBER_MAX, e.emberMax + CONFIG.EMBER_PER_TURN);
  e.ember = e.emberMax;
  e.playedThisTurn = [];
  e.suitCountThisTurn = { flame: 0, tide: 0, stone: 0, gale: 0 };
  e.resonanceFired = { flame: false, tide: false, stone: false, gale: false };
  e.block = 0;
  drawCards(e, CONFIG.DRAW_PER_TURN);
}

export function checkEnd(game) {
  if (game.enemy.life <= 0 && game.phase !== 'won') {
    game.phase = 'won';
    game.winner = 'player';
    game.score += CONFIG.SCORE_WIN_BONUS;
    addLog(game, 'The Duchess falls — THE COURT IS YOURS!');
  } else if (game.player.life <= 0 && game.phase !== 'lost') {
    game.phase = 'lost';
    game.winner = 'enemy';
    addLog(game, 'Your embers gutter out — the Duchess prevails.');
  }
}

export function addLog(game, line) {
  game.log.push(line);
  if (game.log.length > 40) game.log.shift();
}

export function scoreBreakdown(game) {
  return [
    { label: 'Damage dealt', value: game.stats.damageDealt },
    { label: 'Life restored', value: game.stats.healingDone },
    { label: 'Resonances', value: game.stats.resonances + ' × ' + CONFIG.SCORE_PER_RESONANCE },
    { label: 'Win bonus', value: game.winner === 'player' ? CONFIG.SCORE_WIN_BONUS : 0 },
    { label: 'Turns taken', value: game.stats.turnsTaken },
    { label: 'Cards played', value: game.stats.cardsPlayed },
  ];
}
