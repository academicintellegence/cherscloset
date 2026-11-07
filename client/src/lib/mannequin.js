// Parametric 2D body drawn from real measurements (cm). Pure geometry (no React) so the outfit
// builder can reuse the anchors. "L" and "R" are screen-left and screen-right.
// Height, shoulder width and inseam are straight lengths. Bust, waist and hips are circumferences:
// a body is an oval, so its width seen from the front is about 35.5% of the way round.
import { AVATAR_DEFAULTS } from '../constants.js';

export const VIEWBOX = { w: 200, h: 400 };
const CX = 100; // body centre line
export const GROUND = 388; // y of the floor
export const MANNEQUIN_FILL = '#c9b8d3';
export const PX_PER_CM = 1.9; // one fixed scale, so a taller person really is taller (200 cm = 380 units)
const FRONT_WIDTH = 0.355;

const f = (n) => Math.round(n * 10) / 10;
const P = (x, y) => `${f(x)} ${f(y)}`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rad = (deg) => (deg * Math.PI) / 180;

// Smooth curve through points (Catmull-Rom as cubic beziers). The pen must already be at pts[0].
function smooth(pts) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i - 1] || pts[i];
    const b = pts[i];
    const c = pts[i + 1];
    const e = pts[i + 2] || c;
    d += `C ${P(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6)} ${P(c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6)} ${P(c[0], c[1])} `;
  }
  return d;
}

/**
 * @param {{ body?: 'female'|'male', heightCm?: number, shoulderCm?: number, bustCm?: number,
 *           waistCm?: number, hipsCm?: number, inseamCm?: number }} params
 * @returns {{ anchors: Record<string, {x:number,y:number}>, parts: object[], shadow: object }}
 *   parts are drawn in order: { kind: 'path'|'line'|'ellipse', ... }
 */
export function buildMannequin(params = {}) {
  const body = params.body === 'male' ? 'male' : 'female';
  const v = (k) => (Number.isFinite(params[k]) ? params[k] : AVATAR_DEFAULTS[body][k]);
  const s = PX_PER_CM;
  const Hp = v('heightCm') * s;
  const top = GROUND - Hp;
  const Y = (frac) => top + frac * Hp;

  const hs = (v('shoulderCm') / 2) * s;
  const hb = (v('bustCm') * FRONT_WIDTH * s) / 2;
  const hw = (v('waistCm') * FRONT_WIDTH * s) / 2;
  const hh = (v('hipsCm') * FRONT_WIDTH * s) / 2;
  const neckW = (body === 'male' ? 9.6 : 8.2) * s;
  const crot = clamp(1 - v('inseamCm') / v('heightCm'), 0.5, 0.6); // crotch height, as a fraction of height
  const limb = clamp(v('hipsCm') / 100, 0.85, 1.3) ** 0.6; // fuller hips -> slightly thicker limbs

  // Torso: neck, shoulder slope, shoulder tip, bust, waist, hip, crotch. Offsets are from the centre line.
  const chain = [
    [neckW / 2, 0.162], [hs * 0.62, 0.172], [hs, 0.197], [hb, 0.27],
    [hw, 0.385], [hh * 0.97, 0.45], [hh, 0.49], [hh * 0.95, crot + 0.01],
  ];
  const left = chain.map(([dx, fy]) => [CX - dx, Y(fy)]);
  const right = chain.map(([dx, fy]) => [CX + dx, Y(fy)]).reverse();
  const torso = `M ${P(...left[0])} ${smooth(left)}L ${P(...right[0])} ${smooth(right)}Z`;

  const parts = [
    { kind: 'line', x1: CX, y1: top + 0.11 * Hp, x2: CX, y2: Y(0.19), w: neckW },
    { kind: 'path', d: torso },
  ];

  // Legs: tapered outlines from hip to ankle.
  const ankleF = 0.962;
  const kneeF = crot + (ankleF - crot) * 0.44;
  const calfF = crot + (ankleF - crot) * 0.7;
  const c = { thigh: hh * 0.5, knee: hh * 0.46, calf: hh * 0.44, ankle: hh * 0.4 };
  const w = { knee: 4.4 * s * limb, calf: 4.5 * s * limb, ankle: 2.9 * s * limb };
  const footF = 0.985; // the leg runs down into the foot
  const outer = [[hh * 0.99, 0.5], [hh * 0.92, 0.62], [c.knee + w.knee, kneeF], [c.calf + w.calf, calfF], [c.ankle + w.ankle, ankleF], [c.ankle + w.ankle * 0.9, footF]];
  const inner = [[c.ankle - w.ankle * 0.9, footF], [c.ankle - w.ankle, ankleF], [c.calf - w.calf, calfF], [c.knee - w.knee, kneeF], [hh * 0.06, crot + (kneeF - crot) * 0.5], [hh * 0.01, crot]];

  // Arms hang slightly away from the body; wider hips push them out a little more.
  const upper = 0.175 * Hp;
  const fore = 0.15 * Hp;
  const a1 = 9 + clamp((hh - hs) * 0.4, 0, 8);
  const a2 = a1 + 4;

  const anchors = {
    head: { x: CX, y: top + 0.065 * Hp },
    neck: { x: CX, y: Y(0.16) },
    waist: { x: CX, y: Y(0.385) },
    hips: { x: CX, y: Y(0.49) },
  };
  const limbs = [];
  const extras = [];
  for (const { sign, id } of [{ sign: -1, id: 'L' }, { sign: 1, id: 'R' }]) {
    const x = (dx) => CX + sign * dx;
    const side = (pts) => pts.map(([dx, fy]) => [x(dx), Y(fy)]);
    const o = side(outer);
    const i = side(inner);
    limbs.push({ kind: 'path', d: `M ${P(...o[0])} ${smooth(o)}L ${P(...i[0])} ${smooth(i)}Z` });
    extras.push({ kind: 'ellipse', cx: x(c.ankle + 2.6 * s), cy: GROUND - 2.4 * s, rx: 5.6 * s, ry: 2.4 * s, rot: 0 });

    const sx = x(hs - 2.6 * s);
    const sy = Y(0.185) + 5.2 * s;
    const ex = sx + sign * upper * Math.sin(rad(a1));
    const ey = sy + upper * Math.cos(rad(a1));
    const wx = ex + sign * fore * Math.sin(rad(a2));
    const wy = ey + fore * Math.cos(rad(a2));
    limbs.push({ kind: 'line', x1: sx, y1: sy, x2: ex, y2: ey, w: 6.6 * s * limb });
    limbs.push({ kind: 'line', x1: ex, y1: ey, x2: wx, y2: wy, w: 5 * s * limb });
    extras.push({ kind: 'ellipse', cx: wx + sign * 0.8 * s, cy: wy + 3.2 * s, rx: 2.8 * s, ry: 4.2 * s, rot: -sign * a2 });

    anchors[`shoulder${id}`] = { x: x(hs), y: Y(0.185) };
    anchors[`bust${id}`] = { x: x(hb), y: Y(0.28) };
    anchors[`waist${id}`] = { x: x(hw), y: Y(0.385) };
    anchors[`hip${id}`] = { x: x(hh), y: Y(0.49) };
    anchors[`knee${id}`] = { x: x(c.knee), y: Y(kneeF) };
    anchors[`ankle${id}`] = { x: x(c.ankle), y: Y(ankleF) };
    anchors[`foot${id}`] = { x: x(c.ankle + 2.6 * s), y: GROUND - 2.4 * s };
    anchors[`wrist${id}`] = { x: wx, y: wy };
  }

  parts.push(...limbs, ...extras, { kind: 'ellipse', cx: CX, cy: top + 0.0665 * Hp, rx: 0.052 * Hp, ry: 0.0665 * Hp, rot: 0 });

  for (const key of Object.keys(anchors)) anchors[key] = { x: f(anchors[key].x), y: f(anchors[key].y) };
  return { anchors, parts, shadow: { cx: CX, cy: GROUND + 1, rx: hh * 1.4 + 10, ry: 4 }, top: f(top) };
}
