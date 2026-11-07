// CLIP zero-shot prompts. Several wordings per value make the score more robust.
// Values match the ids in constants.js / the server enums.
export const TEMPLATE = 'a product photo of {}.';

const GROUPS = {
  category: {
    top: ['a t-shirt', 'a blouse', 'a shirt', 'a sweater', 'a hoodie', 'a tank top'],
    bottom: ['a pair of jeans', 'a pair of trousers', 'a skirt', 'a pair of shorts'],
    dress: ['a dress', 'a jumpsuit'],
    outerwear: ['a jacket', 'a coat', 'a blazer', 'a cardigan'],
    shoes: ['a pair of shoes', 'sneakers', 'boots', 'sandals', 'high heels'],
    belt: ['a belt'],
    accessory: ['a handbag', 'a hat', 'a scarf', 'sunglasses', 'jewelry'],
  },
  style: {
    casual: ['casual everyday clothes'],
    formal: ['formal business clothes'],
    sporty: ['sporty athletic clothes'],
    party: ['glamorous party clothes'],
    lounge: ['cozy loungewear'],
  },
  pattern: {
    solid: ['a plain solid colored item'],
    striped: ['a striped item'],
    plaid: ['a plaid checkered item'],
    floral: ['a floral patterned item'],
    dotted: ['a polka dot item'],
    graphic: ['an item with a graphic print or logo'],
    animal: ['an animal print item'],
  },
  season: {
    summer: ['light summer clothing', 'beachwear'],
    winter: ['thick warm winter clothing'],
    mild: ['light spring or autumn clothing'],
  },
};

const ALL_SEASON_BELOW = 0.5; // CLIP has no "all year" prompt: unsure season => all year

// [{ group, value, prompt }] for every candidate label sent to CLIP.
const ENTRIES = Object.entries(GROUPS).flatMap(([group, values]) =>
  Object.entries(values).flatMap(([value, prompts]) => prompts.map((prompt) => ({ group, value, prompt })))
);
export const PROMPTS = ENTRIES.map((e) => e.prompt);

/**
 * `scores` = [{ label, score }] from one CLIP call over all PROMPTS (softmax over everything).
 * Softmax over all labels, renormalized inside one group, equals a softmax over that group alone,
 * so a single image pass yields all four tags.
 */
export function pickTags(scores) {
  const byPrompt = new Map(scores.map((s) => [s.label, s.score]));
  const tags = {};
  for (const group of Object.keys(GROUPS)) {
    const sums = {};
    let total = 0;
    for (const e of ENTRIES) {
      if (e.group !== group) continue;
      const s = byPrompt.get(e.prompt) ?? 0;
      sums[e.value] = (sums[e.value] ?? 0) + s;
      total += s;
    }
    const [value, sum] = Object.entries(sums).sort((a, b) => b[1] - a[1])[0];
    tags[group] = group === 'season' && sum / (total || 1) < ALL_SEASON_BELOW ? 'all' : value;
  }
  return tags;
}
