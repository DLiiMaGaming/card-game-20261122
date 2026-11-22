// EMBER COURT — rendering: the table, the hands, the HUD and every screen.
// Cards are DOM, so they stay legible at thumbnail size; suits are told
// apart by colour AND shape. Played cards slide to the centre table and
// snap; hovered cards lift and tilt; the win lands with a flourish.
import { CONFIG, SUITS } from './config.js';
import { INTENT_LABEL } from './ai.js';
import { scoreBreakdown } from './state.js';

const $ = (id) => document.getElementById(id);

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function emberPips(n, max) {
  let s = '';
  for (let i = 0; i < max; i++) s += `<span class="pip${i < n ? ' on' : ''}">●</span>`;
  return s;
}

function lifeBar(fighter) {
  const pct = Math.round((fighter.life / fighter.maxLife) * 100);
  return `<div class="lifebar"><div class="lifefill" style="width:${pct}%"></div><span class="lifetext">♥ ${fighter.life} / ${fighter.maxLife}</span></div>`;
}

function cardElement(card, opts) {
  const suit = SUITS[card.suit];
  const n = el('div', 'card suit-' + card.suit + (opts && opts.playable === false ? ' unaffordable' : '') + (opts && opts.faceDown ? ' facedown' : ''));
  if (opts && opts.faceDown) {
    n.innerHTML = `<div class="card-back"><div class="back-glyph">♛</div><div class="back-name">EMBER COURT</div></div>`;
    return n;
  }
  const val = Array.isArray(card.value) ? card.value.join(' + ') : String(card.value);
  n.innerHTML =
    `<div class="cost">${card.cost}</div>` +
    `<div class="suit-glyph" style="color:${suit.color}">${suit.glyph}</div>` +
    `<div class="card-name">${card.name}</div>` +
    `<div class="card-suit">${suit.name}</div>` +
    `<div class="card-value">${val}</div>` +
    `<div class="card-text">${card.text}</div>` +
    `<div class="card-flavor">${card.flavor}</div>`;
  if (opts && opts.index != null) n.dataset.index = opts.index;
  if (opts && opts.onPlay) n.addEventListener('click', () => opts.onPlay(card));
  return n;
}

function resonanceTrack(fighter, label) {
  const suits = ['flame', 'tide', 'stone', 'gale'];
  const chips = suits.map((s) => {
    const count = fighter.suitCountThisTurn[s];
    const fired = fighter.resonanceFired[s];
    return `<span class="res-chip${fired ? ' fired' : ''}" style="--sc:${SUITS[s].color}">${SUITS[s].glyph} ${count}/2${fired ? ' ✓' : ''}</span>`;
  }).join('');
  return `<div class="res-track"><span class="res-label">${label} RESONANCE</span>${chips}</div>`;
}

export function renderTitle(game) {
  const t = $('screen-title');
  t.innerHTML = '';
  const wrap = el('div', 'title-wrap');
  wrap.innerHTML =
    `<div class="title-kicker">A DUEL OF 24 CARDS · 4 SUITS · 30 LIFE · 1 COURT</div>` +
    `<h1 class="title-main">EMBER<br>COURT</h1>` +
    `<p class="title-sub">Outwit the Ashen Duchess. Spend embers, play your hand,<br>` +
    `and chain two cards of one suit to wake its <b>Resonance</b>.</p>` +
    `<div class="title-suits">` +
    ['flame', 'tide', 'stone', 'gale'].map((s) =>
      `<div class="suit-card suit-${s}"><div class="suit-glyph big" style="color:${SUITS[s].color}">${SUITS[s].glyph}</div><div class="suit-name">${SUITS[s].name}</div><div class="suit-desc">${{ flame: 'Damage', tide: 'Heal + draw', stone: 'Block', gale: 'Ember + tempo' }[s]}</div></div>`).join('') +
    `</div>` +
    `<button class="big-btn" id="btn-start">▶ &nbsp;ENTER THE COURT</button>` +
    `<div class="title-keys">Keys: <b>1–7</b> play a card · <b>Enter</b> end turn · <b>M</b> mute · <b>R</b> rematch</div>` +
    `<div class="title-foot">24 original cards · no luck but the draw · the Duchess shows her intent before she strikes</div>`;
  t.appendChild(wrap);
}

export function renderDuel(game, handlers) {
  const p = game.player;
  const e = game.enemy;
  const duel = $('screen-duel');

  // --- top bar: life, score, turn ---
  const top = $('topbar');
  top.innerHTML =
    `<div class="top-side"><span class="top-name">YOU</span>${lifeBar(p)}<span class="block-badge">🛡 ${p.block} block</span></div>` +
    `<div class="top-mid"><div class="turn-pill">TURN ${game.turn}</div><div class="score-pill">SCORE ${game.score}</div></div>` +
    `<div class="top-side right"><span class="block-badge">🛡 ${e.block} block</span>${lifeBar(e)}<span class="top-name">ASHEN DUCHESS</span></div>`;

  // --- opponent row: face-down hand + intent ---
  const opp = $('opponent-row');
  opp.innerHTML = '';
  const oppHand = el('div', 'opp-hand');
  e.hand.forEach(() => oppHand.appendChild(cardElement({}, { faceDown: true })));
  const oppInfo = el('div', 'opp-info');
  oppInfo.innerHTML =
    `<div class="opp-name">♛ ASHEN DUCHESS</div>` +
    `<div class="opp-deck">Deck ${e.deck.length} · Discard ${e.discard.length} · Hand ${e.hand.length}</div>` +
    `<div class="opp-intent">${game.phase === 'ai' && game.aiIntent ? INTENT_LABEL[game.aiIntent] : '— watching your hand —'}</div>` +
    resonanceTrack(e, 'DUCHESS');
  opp.appendChild(oppHand);
  opp.appendChild(oppInfo);

  // --- middle row: last played card + log ---
  const mid = $('mid-row');
  mid.innerHTML = '';
  const table = el('div', 'centre-table');
  if (game.lastPlay) {
    const lp = el('div', 'last-play');
    lp.appendChild(el('div', 'last-play-label', game.lastPlay.by === 'You' ? 'YOU PLAYED' : 'DUCHESS PLAYED'));
    lp.appendChild(cardElement(game.lastPlay.card, {}));
    table.appendChild(lp);
  } else {
    table.appendChild(el('div', 'table-empty', '— the table waits for the first card —'));
  }
  if (game.resonanceFlash) {
    const s = SUITS[game.resonanceFlash];
    table.appendChild(el('div', 'res-flash', `<span style="color:${s.color}">${s.glyph} RESONANCE — ${s.name}! ${s.glyph}</span>`));
  }
  const logBox = el('div', 'log-box');
  logBox.appendChild(el('div', 'log-title', 'COURT LOG'));
  const last = game.log.slice(-6);
  last.forEach((line) => logBox.appendChild(el('div', 'log-line', line)));
  mid.appendChild(table);
  mid.appendChild(logBox);

  // --- player row: embers, hand, end-turn ---
  const prow = $('player-row');
  prow.innerHTML = '';
  const pinfo = el('div', 'player-info');
  pinfo.innerHTML =
    `<div class="ember-row"><span class="ember-label">🔥 EMBERS</span><span class="ember-pips">${emberPips(p.ember, p.emberMax)}</span><span class="ember-num">${p.ember}/${p.emberMax}</span></div>` +
    `<div class="deck-row">Deck ${p.deck.length} · Discard ${p.discard.length} · Hand ${p.hand.length}/${CONFIG.HAND_MAX}</div>` +
    resonanceTrack(p, 'YOUR');
  const hand = el('div', 'player-hand');
  p.hand.forEach((card, i) => {
    const playable = game.phase === 'player' && card.cost <= p.ember;
    const node = cardElement(card, { index: i, playable, onPlay: handlers.onPlayCard });
    node.style.setProperty('--tilt', ((i - (p.hand.length - 1) / 2) * 2.2) + 'deg');
    node.style.setProperty('--lift', (Math.abs(i - (p.hand.length - 1) / 2) * 7) + 'px');
    hand.appendChild(node);
  });
  const controls = el('div', 'controls');
  const endBtn = el('button', 'end-btn', game.phase === 'player' ? 'END TURN ⏎' : (game.phase === 'ai' ? 'DUCHESS PLAYS…' : '…'));
  endBtn.disabled = game.phase !== 'player';
  endBtn.addEventListener('click', handlers.onEndTurn);
  const muteBtn = el('button', 'mute-btn', handlers.muted ? '🔇 MUTED' : '🔊 SOUND');
  muteBtn.addEventListener('click', handlers.onMute);
  controls.appendChild(endBtn);
  controls.appendChild(muteBtn);
  prow.appendChild(pinfo);
  prow.appendChild(hand);
  prow.appendChild(controls);

  // --- bottom bar: hint ---
  const bot = $('bottombar');
  const hint = game.phase === 'player'
    ? 'Your turn — click a card or press 1–7 to play it. Two of one suit wakes Resonance.'
    : game.phase === 'ai'
      ? 'The Duchess is playing… watch her cards land on the table.'
      : '';
  bot.innerHTML = `<span class="hint">${hint}</span><span class="hint-right">EMBER COURT · 24 cards · 4 suits</span>`;
  duel.classList.remove('hidden');
}

export function renderEnd(game, handlers) {
  const end = $('screen-end');
  end.innerHTML = '';
  const won = game.winner === 'player';
  const wrap = el('div', won ? 'end-wrap win' : 'end-wrap lose');
  const rows = scoreBreakdown(game).map((r) =>
    `<div class="score-row"><span>${r.label}</span><b>${r.value}</b></div>`).join('');
  wrap.innerHTML =
    `<div class="end-kicker">${won ? '👑 THE COURT APPLAUDS' : '🥀 THE EMBERS FADE'}</div>` +
    `<h1 class="end-title">${won ? 'THE COURT<br>IS YOURS!' : 'THE DUCHESS<br>PREVAILS'}</h1>` +
    `<p class="end-sub">${won
      ? 'The Ashen Duchess bows, her crown of cinders yours. The court remembers this duel.'
      : 'Your embers gutter out on the cold stone. The Duchess keeps her court — for now.'}</p>` +
    `<div class="score-card"><div class="score-total">FINAL SCORE <b>${game.score}</b></div>${rows}</div>` +
    `<div class="end-life"><span>YOU ♥ ${game.player.life}</span><span class="vs">VS</span><span>DUCHESS ♥ ${game.enemy.life}</span><span class="turns">· ${game.stats.turnsTaken} turns · ${game.stats.cardsPlayed} cards played · ${game.stats.resonances} resonances</span></div>` +
    `<button class="big-btn" id="btn-rematch">↻ &nbsp;REMATCH (R)</button>`;
  end.appendChild(wrap);
  const btn = $('btn-rematch');
  if (btn) btn.addEventListener('click', handlers.onRematch);
}

export function showScreen(name) {
  $('screen-title').classList.toggle('hidden', name !== 'title');
  $('screen-duel').classList.toggle('hidden', name !== 'duel');
  $('screen-end').classList.toggle('hidden', name !== 'end');
}

export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
}
