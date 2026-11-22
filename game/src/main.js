// EMBER COURT — boot: input (mouse + keyboard), the turn loop, and the
// handoff between your turn and the Duchess's. The staged ?shot= states
// render through the same path as a live duel.
import { CONFIG } from './config.js';
import { newGame, startDuel, beginPlayerTurn, beginAiTurn, endPlayerTurn, canPlay, applyCard, checkEnd } from './state.js';
import { runAiTurn } from './ai.js';
import { renderTitle, renderDuel, renderEnd, showScreen, toast } from './render.js';
import { stageShot } from './shots.js';
import * as sfx from './audio.js';

let game = newGame();
let muted = false;

function refresh() {
  game.resonanceFlash = null;
  if (game.phase === 'title') {
    showScreen('title');
    renderTitle(game);
    const btn = document.getElementById('btn-start');
    if (btn) btn.addEventListener('click', startPlaying);
  } else if (game.phase === 'won' || game.phase === 'lost') {
    showScreen('end');
    renderEnd(game, { onRematch });
    if (game.phase === 'won') sfx.sfxWin(); else sfx.sfxLose();
  } else {
    showScreen('duel');
    renderDuel(game, { onPlayCard, onEndTurn, onMute, muted });
  }
}

function startPlaying() {
  sfx.sfxClick();
  startDuel(game);
  refresh();
}

function onRematch() {
  sfx.sfxClick();
  game = newGame();
  game.phase = 'title';
  refresh();
}

function onMute() {
  muted = !muted;
  sfx.setMuted(muted);
  refresh();
}

function onPlayCard(card) {
  const check = canPlay(game, card);
  if (!check.ok) { toast(check.why); return; }
  const before = { life: game.enemy.life, block: game.enemy.block, pLife: game.player.life };
  applyCard(game, card, true);
  if (card.kind === 'damage' || card.kind === 'hybrid') sfx.sfxDamage();
  else if (card.kind === 'heal') sfx.sfxHeal();
  else if (card.kind === 'block') sfx.sfxBlock();
  else sfx.sfxPlay();
  if (game.resonanceFlash) sfx.sfxResonance();
  if (game.enemy.life < before.life || game.player.life > before.pLife) {
    // visual hit is in the lifebar transition; nothing else needed
  }
  refresh();
  if (game.phase === 'won' || game.phase === 'lost') return;
}

function onEndTurn() {
  if (game.phase !== 'player') return;
  sfx.sfxClick();
  endPlayerTurn(game);
  refresh();
  beginAiTurn(game);
  runAiTurn(
    game,
    () => { refresh(); },
    () => {
      if (game.phase === 'won' || game.phase === 'lost') { refresh(); return; }
      beginPlayerTurn(game);
      refresh();
    },
  );
}

function onKey(e) {
  if (e.key === 'm' || e.key === 'M') { onMute(); return; }
  if (game.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) { startPlaying(); return; }
  if ((game.phase === 'won' || game.phase === 'lost') && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) { onRematch(); return; }
  if (game.phase === 'player') {
    if (e.key === 'Enter' || e.key === ' ') { onEndTurn(); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= game.player.hand.length) onPlayCard(game.player.hand[n - 1]);
  }
}

function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    game = stageShot(shot);
    // Staged states render once, no timers, no sound.
    if (game.phase === 'title') { showScreen('title'); renderTitle(game); }
    else if (game.phase === 'won' || game.phase === 'lost') { showScreen('end'); renderEnd(game, { onRematch }); }
    else { showScreen('duel'); renderDuel(game, { onPlayCard: () => {}, onEndTurn: () => {}, onMute: () => {}, muted: false }); }
    document.title = 'EMBER COURT — ' + shot;
    return;
  }
  document.addEventListener('keydown', onKey);
  refresh();
}

boot();
