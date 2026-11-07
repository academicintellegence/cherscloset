// Prompt building and reply checking for the AI stylist. Pure functions, no I/O.
// Only tags go to the model (category, color, style, pattern, season): no images, names, ids or account data.

/** @param {{items: {id:string,category:string,color:string,style?:string,pattern?:string,season?:string}[], occasion:string, weather?:{bucket:string,rainy:boolean}|null}} input */
export function buildPrompt({ items, occasion, weather }) {
  const refs = new Map(); // short ref the model sees -> real item
  const lines = items.map((item, n) => {
    const ref = `i${n + 1}`;
    refs.set(ref, item);
    return [ref, item.category, item.color, item.style || '-', item.pattern || '-', item.season || '-'].join('|');
  });
  const weatherText = weather ? `${weather.bucket}${weather.rainy ? ' and rainy' : ''}` : 'unknown';
  const prompt = [
    'You are a personal stylist. Create exactly 3 different outfits from the wardrobe below.',
    `Context: occasion = ${occasion}; weather = ${weatherText}.`,
    'Wardrobe (ref|category|color|style|pattern|season; "-" means unknown):',
    ...lines,
    'Rules:',
    '- Use only refs from the wardrobe, at most one item per category.',
    '- Each outfit is either a dress, or a top plus a bottom. Add shoes if the wardrobe has any. Add outerwear if it is cold or rainy. Belt and accessory are optional.',
    '- Pair colors well (neutrals go with anything, otherwise analogous or complementary) and use at most one statement piece (a bold color or a pattern).',
    '- Match formality to the occasion, and the items to the weather and season.',
    '- The 3 outfits must not be identical.',
    'Reply with JSON only, no markdown: {"outfits":[{"items":["i1","i2"],"why":"one short sentence, max 120 characters"}]}',
  ].join('\n');
  return { prompt, refs };
}

// Models sometimes wrap JSON in a markdown fence even when told not to.
export const extractJson = (text) => JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));

const cleanText = (s) => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);

/** Keeps only outfits that use real items, one per category, and are complete (dress, or top + bottom). */
export function pickValid(outfits, refs, limit = 3) {
  const seen = new Set();
  const out = [];
  for (const o of outfits) {
    const picked = [...new Set(o.items)].map((r) => refs.get(r));
    if (picked.some((i) => !i)) continue;
    const cats = picked.map((i) => i.category);
    if (new Set(cats).size !== cats.length) continue;
    const has = (c) => cats.includes(c);
    const complete = has('dress') ? !has('top') && !has('bottom') : has('top') && has('bottom');
    if (!complete) continue;
    const ids = picked.map((i) => i.id);
    const key = [...ids].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ itemIds: ids, why: cleanText(o.why) });
    if (out.length === limit) break;
  }
  return out;
}
