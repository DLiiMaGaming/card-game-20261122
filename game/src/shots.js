// EMBER COURT — staging: deterministic table states for the screenshots.
// ?shot=title | duel | win | loss. The same game code renders them, so
// every screenshot is a real render of the shipped game.
import { CONFIG } from './config.js';
import { cardById } from './cards.js';
import { newGame, startDuel, applyCard } from './state.js';

function handFromIds(fighter, ids) {
  fighter.hand = ids.map((id) => ({ ...cardById(id), uid: id + '#stage' }));
}

export function stageShot(shot) {
  const game = newGame(20261122);
  if (shot === 'title') {
    game.phase = 'title';
    return game;
  }
  startDuel(game);
  if (shot === 'duel') {
    // Mid-duel, turn 6: a dense table — full hand, low-ish life on both
    // sides, embers half spent, one Resonance already fired, log full.
    game.turn = 6;
    game.player.life = 24;
    game.enemy.life = 17;
    game.player.block = 5;
    game.enemy.block = 3;
    game.player.emberMax = 7;
    game.player.ember = 4;
    game.player.deck = game.player.deck.slice(0, 9);
    game.player.discard = [cardById('ember-spark'), cardById('pebble-guard')].map((c) => ({ ...c, uid: c.id + '#disc' }));
    game.enemy.deck = game.enemy.deck.slice(0, 11);
    handFromIds(game.player, ['flame-lash', 'pyre-burst', 'tidecaller', 'granite-wall', 'swift-gale']);
    handFromIds(game.enemy, ['ember-spark', 'flame-lash', 'moonwell', 'bastion']);
    game.player.suitCountThisTurn = { flame: 1, tide: 0, stone: 0, gale: 0 };
    game.player.playedThisTurn = [];
    game.enemy.suitCountThisTurn = { flame: 0, tide: 1, stone: 0, gale: 0 };
    game.score = 84;
    game.stats = { damageDealt: 13, healingDone: 7, cardsPlayed: 9, resonances: 1, turnsTaken: 6 };
    game.lastPlay = { card: { ...cardById('flame-lash'), uid: 'flame-lash#stage' }, by: 'You' };
    game.log = [
      'Turn 6 — you draw 2, embers refill to 7.',
      'You play Flame Lash — 5 damage to Ashen Duchess.',
      'RESONANCE — FLAME! +4 damage.',
      'Duchess plays Moonwell — restores 7 life.',
      'You play Granite Wall — gains 8 block.',
      'Duchess plots: ⚔ STRIKE — she means to hurt you',
    ];
    game.aiIntent = 'strike';
    game.phase = 'player';
    return game;
  }
  if (shot === 'win') {
    game.player.life = 11;
    game.enemy.life = 0;
    game.player.block = 2;
    game.score = 100 + 21 + 9 + 30;
    game.stats = { damageDealt: 31, healingDone: 9, cardsPlayed: 14, resonances: 3, turnsTaken: 8 };
    game.phase = 'won';
    game.winner = 'player';
    game.log = ['You play Phoenix Brand — 12 damage to Ashen Duchess.', 'The Duchess falls — THE COURT IS YOURS!'];
    return game;
  }
  if (shot === 'loss') {
    game.player.life = 0;
    game.enemy.life = 9;
    game.score = 46;
    game.stats = { damageDealt: 18, healingDone: 4, cardsPlayed: 11, resonances: 2, turnsTaken: 7 };
    game.phase = 'lost';
    game.winner = 'enemy';
    game.log = ['Duchess plays Pyre Burst — 9 damage to You.', 'Your embers gutter out — the Duchess prevails.'];
    return game;
  }
  game.phase = 'title';
  return game;
}

export { applyCard, CONFIG };
