import { colorName } from './color.js';
import { isNeutral, isVivid, pairKind } from './colorTheory.js';
import { Z_ORDER } from './fit.js';

// Rules-based outfit recommender. Free, runs in the browser, and is also the fallback for the LLM in step 8.
// Idea: sample many complete outfits, score them with simple style rules, return the best few that differ from each other.

// styles = how well each style tag suits the occasion (0 = never, 1 = ideal).
export const OCCASIONS = [
  { id: 'everyday', label: 'Everyday', phrase: 'everyday wear', styles: { casual: 1, sporty: 0.5, lounge: 0.2, party: 0.3, formal: 0.2 } },
  { id: 'work', label: 'Work', phrase: 'work', styles: { formal: 1, casual: 0.6, party: 0.1, sporty: 0, lounge: 0 } },
  { id: 'formal', label: 'Formal event', phrase: 'a formal event', styles: { formal: 1, party: 0.5, casual: 0.1, sporty: 0, lounge: 0 } },
  { id: 'party', label: 'Night out', phrase: 'a night out', styles: { party: 1, formal: 0.5, casual: 0.4, sporty: 0, lounge: 0 } },
  { id: 'sport', label: 'Sport', phrase: 'sport', styles: { sporty: 1, casual: 0.3, lounge: 0.2, party: 0, formal: 0 } },
  { id: 'home', label: 'At home', phrase: 'a day at home', styles: { lounge: 1, casual: 0.5, sporty: 0.4, party: 0, formal: 0 } },
];

const LEVEL = { lounge: 0, sporty: 1, casual: 2, party: 3, formal: 4 }; // for spotting mismatches like formal + loungewear
const TARGET_SEASON = { cold: 'winter', cool: 'mild', mild: 'mild', warm: 'summer', hot: 'summer' };
const NEAR_SEASONS = { winter: ['mild'], mild: ['winter', 'summer'], summer: ['mild'] };
const NOUN = { top: 'top', bottom: 'bottoms', dress: 'dress', outerwear: 'jacket', shoes: 'shoes', belt: 'belt', accessory: 'accessory' };
const SAMPLES = 300;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const styleWeight = (occ, item) => (item.style ? occ.styles[item.style] : 0.5);
const needsOuter = (w) => Boolean(w) && (w.bucket === 'cold' || w.bucket === 'cool' || (w.rainy && w.bucket !== 'hot'));
const allowsOuter = (w) => !w || !(w.bucket === 'hot' || (w.bucket === 'warm' && !w.rainy));
const isStatement = (item) => Boolean(item.pattern && item.pattern !== 'solid') || isVivid(item.color);

function seasonFit(item, bucket) {
  const target = TARGET_SEASON[bucket];
  if (!item.season) return 0.6;
  if (item.season === 'all') return 0.8;
  if (item.season === target) return 1;
  return NEAR_SEASONS[target].includes(item.season) ? 0.45 : 0;
}

// Per category, drop pieces that clearly do not suit the occasion or weather (unless that would empty the category).
function buildPools(items, occ, weather) {
  const pools = {};
  for (const c of Z_ORDER) {
    const all = items.filter((i) => i.category === c);
    const ok = all.filter((i) => styleWeight(occ, i) > 0 && (!weather || seasonFit(i, weather.bucket) > 0));
    pools[c] = ok.length ? ok : all;
  }
  return pools;
}

// One random but complete outfit: dress or top + bottom, shoes, outerwear when needed, optional belt and accessory.
function sample(pools, weather, rng) {
  const pick = (c) => (pools[c].length ? pools[c][Math.floor(rng() * pools[c].length)] : null);
  const out = {};
  const hasSeparates = pools.top.length > 0 && pools.bottom.length > 0;
  if (pools.dress.length && (!hasSeparates || rng() < 0.3)) {
    out.dress = pick('dress');
  } else {
    out.top = pick('top');
    out.bottom = pick('bottom');
  }
  out.shoes = pick('shoes');
  if (needsOuter(weather) || (allowsOuter(weather) && rng() < 0.3)) out.outerwear = pick('outerwear');
  if (out.bottom && rng() < 0.4) out.belt = pick('belt');
  if (rng() < 0.4) out.accessory = pick('accessory');
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
}

function score(pieces, occ, weather) {
  const list = Z_ORDER.map((c) => pieces[c]).filter(Boolean);
  const pairs = [];
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) pairs.push(pairKind(list[a].color, list[b].color).score);
  }
  const color = pairs.length ? mean(pairs) : 1;
  const stmt = [0.6, 1, 0.3, 0][Math.min(list.filter(isStatement).length, 3)]; // exactly one statement piece is ideal
  const occasion = mean(list.map((i) => styleWeight(occ, i)));
  const levels = list.filter((i) => i.style).map((i) => LEVEL[i.style]);
  const spread = levels.length ? Math.max(...levels) - Math.min(...levels) : 0;
  const consistency = 1 - Math.min(1, Math.max(0, spread - 1) / 3);
  const season = weather ? mean(list.map((i) => seasonFit(i, weather.bucket))) : 1;
  const complete =
    0.5 * (pieces.shoes ? 1 : 0) +
    0.3 * (needsOuter(weather) ? (pieces.outerwear ? 1 : 0) : 1) +
    0.1 * (pieces.belt ? 1 : 0) +
    0.1 * (pieces.accessory ? 1 : 0);
  const covered = pieces.dress || (pieces.top && pieces.bottom);
  const total = (0.3 * color + 0.15 * stmt + 0.15 * occasion + 0.1 * consistency + 0.2 * season + 0.1 * complete) * (covered ? 1 : 0.6);
  return Math.round(total * 100);
}

const describe = (item) => {
  const look = item.pattern && item.pattern !== 'solid' ? item.pattern : colorName(item.color);
  return `${look} ${NOUN[item.category]}`;
};
const unique = (xs) => [...new Set(xs)];
const joinWords = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);

function explain(pieces, occ, weather) {
  const list = Z_ORDER.map((c) => pieces[c]).filter(Boolean);
  const chromatic = list.filter((i) => !isNeutral(i.color));
  const statements = list.filter(isStatement);
  const parts = [];

  if (chromatic.length === 0) {
    parts.push(`A neutral palette of ${joinWords(unique(list.map((i) => colorName(i.color))).slice(0, 3))}`);
  } else if (chromatic.length === 1 && statements.length === 1 && statements[0] === chromatic[0]) {
    parts.push(`Neutrals let the ${describe(chromatic[0])} be the one statement piece`);
  } else {
    if (chromatic.length === 1) {
      parts.push(`Neutrals let the ${describe(chromatic[0])} stand out`);
    } else {
      const [a, b] = chromatic.map((i) => colorName(i.color));
      const { kind } = pairKind(chromatic[0].color, chromatic[1].color);
      if (kind === 'analogous') parts.push(`${a} and ${b} sit next to each other on the color wheel`);
      else if (kind === 'complementary') parts.push(`${a} and ${b} make a bold complementary pair`);
      else parts.push(`${a} and ${b} are a playful mix`);
    }
    if (statements.length === 1) parts.push(`The ${describe(statements[0])} is the one statement piece`);
    else if (statements.length === 0) parts.push('Everything is calm and solid');
  }
  const when = weather ? `${weather.bucket}${weather.rainy ? ', rainy' : ''} weather and ${occ.phrase}` : occ.phrase;
  parts.push(`Suits ${when}`);
  return `${parts.join('. ')}.`;
}

function missingSlots(pieces, weather) {
  const m = [];
  if (!pieces.dress && !pieces.top) m.push('a top');
  if (!pieces.dress && !pieces.bottom) m.push('bottoms');
  if (!pieces.shoes) m.push('shoes');
  if (needsOuter(weather) && !pieces.outerwear) m.push('a jacket');
  return m;
}

/**
 * @param {{ items: object[], weather?: {bucket:string, rainy:boolean}|null, occasion?: string, rng?: () => number, count?: number }} opts
 * @returns {{ key, itemIds, items, score, why, missing }[]} best outfits, different from each other
 */
export function suggest({ items, weather = null, occasion = 'everyday', rng = Math.random, count = 3 }) {
  const occ = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
  const pools = buildPools(items, occ, weather);
  if (!pools.dress.length && !pools.top.length && !pools.bottom.length) return [];

  const seen = new Map();
  for (let n = 0; n < SAMPLES; n++) {
    const pieces = sample(pools, weather, rng);
    const key = Z_ORDER.map((c) => pieces[c]?.id).filter(Boolean).join('|');
    if (!seen.has(key)) seen.set(key, { key, pieces, score: score(pieces, occ, weather) });
  }

  // Greedy pick: best first, then penalise reusing the same pieces so the three ideas feel different.
  const pool = [...seen.values()];
  const chosen = [];
  while (chosen.length < count && chosen.length < pool.length) {
    let best = null;
    for (const c of pool) {
      if (chosen.includes(c)) continue;
      const ids = Object.values(c.pieces).map((i) => i.id);
      const overlap = chosen.reduce((s, ch) => s + Object.values(ch.pieces).filter((i) => ids.includes(i.id)).length, 0);
      const adjusted = c.score - 8 * overlap;
      if (!best || adjusted > best.adjusted) best = { c, adjusted };
    }
    chosen.push(best.c);
  }

  return chosen.map(({ key, pieces, score: s }) => {
    const list = Z_ORDER.map((c) => pieces[c]).filter(Boolean);
    return { key, itemIds: list.map((i) => i.id), items: list, score: s, why: explain(pieces, occ, weather), missing: missingSlots(pieces, weather) };
  });
}
