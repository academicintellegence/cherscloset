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
// Slider limits (the client UI uses the same numbers). Narrow on purpose so the mannequin never looks broken.
export const AVATAR_RANGES = { height: [0.9, 1.1], width: [0.85, 1.2], legs: [0.92, 1.08] };
