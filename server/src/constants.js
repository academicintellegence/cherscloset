export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'belt', 'accessory'];
export const MAX_ITEMS = 150;
export const STYLES = ['casual', 'formal', 'sporty', 'party', 'lounge'];
export const PATTERNS = ['solid', 'striped', 'plaid', 'floral', 'dotted', 'graphic', 'animal'];
export const SEASONS = ['summer', 'winter', 'mild', 'all']; // mild = spring/autumn
// Per-item placement tweak saved once and reused in every outfit. dx/dy are fractions of the slot size.
export const FIT_LIMITS = { offset: 1, scale: [0.3, 3], rot: 180 };
export const AI_USER_DAILY_LIMIT = 5;
export const OCCASIONS = ['everyday', 'work', 'formal', 'party', 'sport', 'home']; // same ids as the client recommender
export const WEATHER_BUCKETS = ['cold', 'cool', 'mild', 'warm', 'hot'];
export const MAX_OUTFITS = 100;
export const MAX_AVATARS = 10;
export const BODIES = ['female', 'male'];
// Real measurements in centimetres (the client UI uses the same numbers).
export const AVATAR_RANGES = {
  heightCm: [140, 200],
  shoulderCm: [30, 56], // straight-line width across the shoulders
  bustCm: [70, 140], // circumferences: bust, waist, hips
  waistCm: [50, 140],
  hipsCm: [76, 150],
  inseamCm: [60, 100],
};
export const AVATAR_DEFAULTS = {
  female: { heightCm: 165, shoulderCm: 38, bustCm: 92, waistCm: 74, hipsCm: 100, inseamCm: 76 },
  male: { heightCm: 178, shoulderCm: 46, bustCm: 100, waistCm: 86, hipsCm: 100, inseamCm: 82 },
};
