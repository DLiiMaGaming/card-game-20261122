[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/DLiiMaGaming/card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/DLiiMaGaming/card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# EMBER COURT — 24 cards, 4 suits, 30 life, 1 duel

A complete original card game for [make.fun's best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826) ($50, 10 places). It runs in a desktop browser from static files only — no network, no build step.

**The duel:** you face the **Ashen Duchess**, both at 30 life. Spend **embers** to play cards from your hand; embers refill each turn (3, then +1, up to 10). Draw 2 cards a turn.

**The four suits** (colour + shape, never text alone):

| Suit | Glyph | Colour | Plays |
|------|-------|--------|-------|
| FLAME | ▲ | red | Damage |
| TIDE | ● | blue | Heal + draw |
| STONE | ■ | amber | Block |
| GALE | ◆ | green | Ember + tempo |

**Court Resonance:** play two cards of the same suit in one turn and that suit wakes — FLAME +4 damage, TIDE +5 life, STONE +6 block, GALE +2 ember. The Duchess announces her intent before she strikes, so you can read her and counter.

**The end of every duel:** from turn 15 the **Ember Storm** burns both fighters for escalating damage, so no duel can stall on heals and block. Win and the court applauds with a full score breakdown; lose and the Duchess keeps her court — for now.

## Play it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

Keys: **1–7** play a card · **Enter** end turn · **M** mute · **R** rematch. Mouse works for everything.

## Layout

- `game/index.html` — the page
- `game/style.css` — the table, the cards, the screens
- `game/src/config.js` — every tuning number + the suit table
- `game/src/cards.js` — the 24-card deck (6 per suit) + seeded shuffle
- `game/src/state.js` — the duel: turns, effects, Resonance, score, Ember Storm
- `game/src/ai.js` — the Ashen Duchess: intent + card picks you can read
- `game/src/audio.js` — WebAudio synth, no sound files
- `game/src/render.js` — title, table, hands, HUD, log, win/loss screens
- `game/src/shots.js` — deterministic staged states for the screenshots
- `game/src/main.js` — boot, keyboard + mouse input, the turn loop
- `smoke-test.mjs` — 61 logic checks (Node, no DOM): deck, effects, Resonance, 20 full simulated duels

## Screenshots

Real renders of this game's own code in headless Chrome, 1280×800:

1. `1-title.jpg` — title screen
2. `2-duel.jpg` — mid-duel table, turn 6
3. `3-win.jpg` — the court is yours
4. `4-loss.jpg` — the Duchess prevails

## License

MIT — see [LICENSE](LICENSE).
