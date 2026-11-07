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
export const AVATAR_RANGES = { height: [0.9, 1.1], width: [0.85, 1.2], legs: [0.92, 1.08] };
// Size presets only set the body width.
export const AVATAR_PRESETS = [
  { id: 'slim', label: 'Slim', width: 0.88 },
  { id: 'medium', label: 'Medium', width: 1 },
  { id: 'broad', label: 'Broad', width: 1.14 },
];
export const DEFAULT_AVATAR = { name: 'My avatar', body: 'female', height: 1, width: 1, legs: 1 };
