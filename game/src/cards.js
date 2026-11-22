// EMBER COURT — the deck: 24 original cards, 6 per suit.
// A card: id, name, suit, cost (embers), kind, value, text, flavor.
// kind: damage | heal | block | ember | draw | hybrid (two effects, value = [a, b])
export const CARD_DEFS = [
  // ---- FLAME ▲ — damage ----
  { id: 'ember-spark',   name: 'Ember Spark',   suit: 'flame', cost: 1, kind: 'damage', value: 3,  text: 'Deal 3 damage.', flavor: 'Every court begins with one spark.' },
  { id: 'flame-lash',    name: 'Flame Lash',    suit: 'flame', cost: 2, kind: 'damage', value: 5,  text: 'Deal 5 damage.', flavor: 'A whip of cinders, quick as gossip.' },
  { id: 'cinder-fan',    name: 'Cinder Fan',    suit: 'flame', cost: 3, kind: 'damage', value: 7,  text: 'Deal 7 damage.', flavor: 'Seven coals, fanned at once.' },
  { id: 'pyre-burst',    name: 'Pyre Burst',    suit: 'flame', cost: 4, kind: 'damage', value: 9,  text: 'Deal 9 damage.', flavor: 'The bonfire answers its name.' },
  { id: 'ashen-rain',    name: 'Ashen Rain',    suit: 'flame', cost: 5, kind: 'hybrid', value: [6, 1], text: 'Deal 6 damage. Draw 1 card.', flavor: 'Hot ash falls; new plans rise.' },
  { id: 'phoenix-brand', name: 'Phoenix Brand', suit: 'flame', cost: 6, kind: 'damage', value: 12, text: 'Deal 12 damage.', flavor: 'The mark that never cools.' },
  // ---- TIDE ● — heal + draw ----
  { id: 'spring-sip',    name: 'Spring Sip',    suit: 'tide', cost: 1, kind: 'heal', value: 4,  text: 'Restore 4 life.', flavor: 'Cold water, warm throat.' },
  { id: 'moonwell',      name: 'Moonwell',      suit: 'tide', cost: 2, kind: 'heal', value: 7,  text: 'Restore 7 life.', flavor: 'Drink by moonlight, heal by morning.' },
  { id: 'deep-current',  name: 'Deep Current',  suit: 'tide', cost: 3, kind: 'draw', value: 2,  text: 'Draw 2 cards.', flavor: 'The river keeps what it owes you.' },
  { id: 'tidecaller',    name: 'Tidecaller',    suit: 'tide', cost: 2, kind: 'hybrid', value: [4, 1], text: 'Restore 4 life. Draw 1 card.', flavor: 'She hums; the tide brings gifts.' },
  { id: 'coral-ward',    name: 'Coral Ward',    suit: 'tide', cost: 3, kind: 'hybrid', value: [5, 4], text: 'Restore 5 life. Gain 4 block.', flavor: 'A reef grows around the heart.' },
  { id: 'leviathan-gift',name: 'Leviathan Gift',suit: 'tide', cost: 4, kind: 'hybrid', value: [8, 1], text: 'Restore 8 life. Draw 1 card.', flavor: 'The old whale pays its debts.' },
  // ---- STONE ■ — block ----
  { id: 'pebble-guard',  name: 'Pebble Guard',  suit: 'stone', cost: 1, kind: 'block', value: 4,  text: 'Gain 4 block.', flavor: 'One small stone, well placed.' },
  { id: 'granite-wall',  name: 'Granite Wall',  suit: 'stone', cost: 2, kind: 'block', value: 8,  text: 'Gain 8 block.', flavor: 'The wall does not argue.' },
  { id: 'bastion',       name: 'Bastion',       suit: 'stone', cost: 3, kind: 'block', value: 12, text: 'Gain 12 block.', flavor: 'A fortress with a doorbell.' },
  { id: 'quarry-hymn',   name: 'Quarry Hymn',   suit: 'stone', cost: 2, kind: 'hybrid', value: [5, 1], text: 'Gain 5 block. Gain 1 ember.', flavor: 'The miners sing; the lamps burn brighter.' },
  { id: 'iron-oath',     name: 'Iron Oath',     suit: 'stone', cost: 3, kind: 'hybrid', value: [7, 3], text: 'Gain 7 block. Restore 3 life.', flavor: 'Sworn on cold iron, kept warm.' },
  { id: 'mountain-stand',name: 'Mountain Stand',suit: 'stone', cost: 4, kind: 'block', value: 14, text: 'Gain 14 block.', flavor: 'Mountains do not flinch.' },
  // ---- GALE ◆ — ember + tempo ----
  { id: 'zephyr',        name: 'Zephyr',        suit: 'gale', cost: 1, kind: 'ember', value: 2,  text: 'Gain 2 ember.', flavor: 'A breeze with somewhere to be.' },
  { id: 'sky-courier',   name: 'Sky Courier',   suit: 'gale', cost: 1, kind: 'hybrid', value: [1, 1], text: 'Draw 1 card. Gain 1 ember.', flavor: 'Fast wings, faster news.' },
  { id: 'swift-gale',    name: 'Swift Gale',    suit: 'gale', cost: 2, kind: 'hybrid', value: [2, 1], text: 'Draw 2 cards. Gain 1 ember.', flavor: 'The wind reads your hand first.' },
  { id: 'storm-step',    name: 'Storm Step',    suit: 'gale', cost: 2, kind: 'ember', value: 3,  text: 'Gain 3 ember.', flavor: 'Step between the lightning.' },
  { id: 'windfall',      name: 'Windfall',      suit: 'gale', cost: 3, kind: 'draw', value: 3,  text: 'Draw 3 cards.', flavor: 'The sky drops its pockets.' },
  { id: 'tempest-call',  name: 'Tempest Call',  suit: 'gale', cost: 4, kind: 'hybrid', value: [4, 1], text: 'Gain 4 ember. Draw 1 card.', flavor: 'Call the storm by its first name.' },
];

export const DECK_SIZE = CARD_DEFS.length;

// A tiny seeded RNG so staged screenshots and playtests are reproducible.
export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shuffleDeck(seed) {
  const rng = makeRng(seed);
  const deck = CARD_DEFS.map((def) => ({ ...def, uid: def.id + '#' + Math.floor(rng() * 1e6) }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardById(id) {
  return CARD_DEFS.find((c) => c.id === id);
}

export function describeEffect(card) {
  return card.text;
}
