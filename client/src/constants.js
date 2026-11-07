export const CATEGORIES = [
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'dress', label: 'Dresses' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'belt', label: 'Belts' },
  { id: 'accessory', label: 'Accessories' },
];

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
// Singular, lowercase form used when auto-naming an item ("Blue top").
export const categoryNoun = (id) => (id === 'accessory' ? 'accessory' : id);

// Optional tags, filled in by the AI tagger and editable by the user. Ids match the server.
export const STYLES = [
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'sporty', label: 'Sporty' },
  { id: 'party', label: 'Party' },
  { id: 'lounge', label: 'Loungewear' },
];
export const PATTERNS = [
  { id: 'solid', label: 'Solid' },
  { id: 'striped', label: 'Striped' },
  { id: 'plaid', label: 'Plaid' },
  { id: 'floral', label: 'Floral' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'graphic', label: 'Graphic / logo' },
  { id: 'animal', label: 'Animal print' },
];
export const SEASONS = [
  { id: 'summer', label: 'Summer' },
  { id: 'winter', label: 'Winter' },
  { id: 'mild', label: 'Spring / autumn' },
  { id: 'all', label: 'All year' },
];

// Avatars. Ranges must match server/src/constants.js.
// Per-item placement tweak. Must match server/src/constants.js.
export const FIT_LIMITS = { offset: 1, scale: [0.3, 3], rot: 180 };
export const DEFAULT_FIT = { dx: 0, dy: 0, scale: 1, rot: 0 };

export const MAX_AVATARS = 10;
export const BODY_TYPES = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
];
// Real measurements in centimetres. Ranges must match server/src/constants.js.
export const AVATAR_RANGES = {
  heightCm: [140, 200],
  shoulderCm: [30, 56],
  bustCm: [70, 140],
  waistCm: [50, 140],
  hipsCm: [76, 150],
  inseamCm: [60, 100],
};
export const AVATAR_DEFAULTS = {
  female: { heightCm: 165, shoulderCm: 38, bustCm: 92, waistCm: 74, hipsCm: 100, inseamCm: 76 },
  male: { heightCm: 178, shoulderCm: 46, bustCm: 100, waistCm: 86, hipsCm: 100, inseamCm: 82 },
};
// Size presets set shoulders, bust, waist and hips (never height or inseam).
export const AVATAR_PRESETS = {
  female: [
    { id: 'slim', label: 'Slim', m: { shoulderCm: 36, bustCm: 84, waistCm: 64, hipsCm: 90 } },
    { id: 'average', label: 'Average', m: { shoulderCm: 38, bustCm: 92, waistCm: 74, hipsCm: 100 } },
    { id: 'curvy', label: 'Curvy', m: { shoulderCm: 39, bustCm: 102, waistCm: 80, hipsCm: 112 } },
    { id: 'plus', label: 'Plus size', m: { shoulderCm: 42, bustCm: 120, waistCm: 104, hipsCm: 126 } },
  ],
  male: [
    { id: 'slim', label: 'Slim', m: { shoulderCm: 43, bustCm: 92, waistCm: 78, hipsCm: 92 } },
    { id: 'average', label: 'Average', m: { shoulderCm: 46, bustCm: 100, waistCm: 86, hipsCm: 100 } },
    { id: 'broad', label: 'Broad', m: { shoulderCm: 50, bustCm: 112, waistCm: 100, hipsCm: 108 } },
  ],
};
export const DEFAULT_AVATAR = { name: 'My avatar', body: 'female', ...AVATAR_DEFAULTS.female };
