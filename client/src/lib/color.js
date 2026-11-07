export const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export function hexToHsl(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

// Rough human-friendly color name, good enough for auto-naming and (later) color pairing.
export function colorName(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.12) return 'black';
  if (l > 0.93) return 'white';
  if (s < 0.12) return 'grey';
  if (h >= 20 && h < 50 && l < 0.4) return 'brown';
  if (h >= 25 && h < 55 && s < 0.5 && l > 0.7) return 'beige';
  if (h >= 200 && h < 255 && l < 0.3) return 'navy';
  if (h < 15 || h >= 340) return l > 0.75 ? 'pink' : 'red';
  if (h < 40) return 'orange';
  if (h < 65) return 'yellow';
  if (h < 165) return 'green';
  if (h < 200) return 'teal';
  if (h < 255) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}
