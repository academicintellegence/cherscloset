import { hexToHsl } from './color.js';

// Black, white, greys, beige/tan/cream and navy all go with everything.
export function isNeutral(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (s < 0.14 || l < 0.12 || l > 0.92) return true;
  if (h >= 20 && h < 55 && s < 0.45 && l > 0.5) return true;
  return h >= 200 && h < 255 && l < 0.28;
}

// A bright, saturated color that draws the eye.
export function isVivid(hex) {
  const [, s, l] = hexToHsl(hex);
  return !isNeutral(hex) && s > 0.55 && l > 0.25 && l < 0.85;
}

const hueGap = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** How well two colors go together: { kind, score 0..1 }. */
export function pairKind(a, b) {
  const na = isNeutral(a);
  const nb = isNeutral(b);
  if (na && nb) return { kind: 'neutral', score: 1 };
  if (na || nb) return { kind: 'accent', score: 0.9 };
  const d = hueGap(hexToHsl(a)[0], hexToHsl(b)[0]);
  if (d <= 40) return { kind: 'analogous', score: 0.85 };
  if (d >= 150) return { kind: 'complementary', score: 0.75 };
  if (d >= 100 && d < 140) return { kind: 'triadic', score: 0.45 };
  return { kind: 'clash', score: 0.3 };
}
