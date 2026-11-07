// Parametric 2D mannequin. Pure geometry (no React) so the outfit builder in step 5 can reuse the anchors.
// "L" and "R" are screen-left and screen-right, so the same side names work for any clothing sticker.

export const VIEWBOX = { w: 200, h: 400 };
const CX = 100; // body centre line
export const GROUND = 388; // y of the floor
export const MANNEQUIN_FILL = '#c9b8d3';
const BASE_H = 340; // body height in viewBox units when height = 1

// Silhouette half-widths in base units (width = 1). Simple, smooth shapes with no anatomical detail.
const BODIES = {
  female: { shoulder: 35, waist: 26, hip: 38, waistAt: 0.42, thigh: 19 },
  male: { shoulder: 44, waist: 33, hip: 34, waistAt: 0.46, thigh: 19 },
};

const f = (n) => Math.round(n * 10) / 10;
const p = (...nums) => nums.map(f).join(' ');
const rad = (deg) => (deg * Math.PI) / 180;

/**
 * @param {{ body?: 'female'|'male', height?: number, width?: number, legs?: number }} params
 *   height scales the whole figure, width scales body thickness, legs > 1 means longer legs / shorter torso.
 * @returns {{ anchors: Record<string, {x:number,y:number}>, parts: object[], shadow: object }}
 *   parts are drawn in order: { kind: 'path'|'line'|'ellipse', ... }
 */
export function buildMannequin({ body = 'female', height = 1, width = 1, legs = 1 } = {}) {
  const b = BODIES[body] || BODIES.female;
  const H = BASE_H * height;
  const s = H / BASE_H; // scales lengths
  const k = s * width; // scales thicknesses
  const top = GROUND - H;

  // Vertical landmarks. The legs factor moves the hip joint, which changes the torso-to-leg ratio.
  const shoulderY = top + 0.185 * H;
  const hipJointY = GROUND - 0.47 * H * legs;
  const waistY = shoulderY + (hipJointY - shoulderY) * b.waistAt;
  const hipY = hipJointY - 0.03 * H; // widest part of the hips
  const crotchY = hipJointY + 0.02 * H;

  const sh = b.shoulder * k;
  const wh = b.waist * k;
  const hh = b.hip * k;
  const m1 = (waistY - shoulderY) / 2;
  const m2 = (hipY - waistY) / 2;
  const m3 = (crotchY - hipY) * 0.6;

  const torso =
    `M ${p(CX - sh, shoulderY)} Q ${p(CX, shoulderY - 7, CX + sh, shoulderY)} ` +
    `C ${p(CX + sh, shoulderY + m1, CX + wh, waistY - m1, CX + wh, waistY)} ` +
    `C ${p(CX + wh, waistY + m2, CX + hh, hipY - m2, CX + hh, hipY)} ` +
    `C ${p(CX + hh, hipY + m3, CX + hh * 0.85, crotchY, CX + hh * 0.55, crotchY)} ` +
    `L ${p(CX - hh * 0.55, crotchY)} ` +
    `C ${p(CX - hh * 0.85, crotchY, CX - hh, hipY + m3, CX - hh, hipY)} ` +
    `C ${p(CX - hh, hipY - m2, CX - wh, waistY + m2, CX - wh, waistY)} ` +
    `C ${p(CX - wh, waistY - m1, CX - sh, shoulderY + m1, CX - sh, shoulderY)} Z`;

  const parts = [
    { kind: 'line', x1: CX, y1: top + 0.11 * H, x2: CX, y2: shoulderY + 2 * s, w: 13 * k }, // neck
    { kind: 'path', d: torso },
  ];
  const anchors = {
    head: { x: CX, y: top + 0.065 * H },
    neck: { x: CX, y: top + 0.16 * H },
    waist: { x: CX, y: waistY },
    hips: { x: CX, y: hipY },
  };

  // Legs and feet
  const jointX = hh * 0.5;
  const ankleX = jointX * 0.85;
  const kneeX = (jointX + ankleX) / 2;
  const ankleY = GROUND - 0.035 * H;
  const kneeY = hipJointY + (ankleY - hipJointY) / 2;
  const arm = { upper: 0.175 * H, fore: 0.15 * H };

  const sides = [
    { sign: -1, id: 'L' },
    { sign: 1, id: 'R' },
  ];
  const limbs = [];
  const extras = [];
  for (const { sign, id } of sides) {
    const x = (dx) => CX + sign * dx;

    limbs.push({ kind: 'line', x1: x(jointX), y1: hipJointY, x2: x(kneeX), y2: kneeY, w: b.thigh * k });
    limbs.push({ kind: 'line', x1: x(kneeX), y1: kneeY, x2: x(ankleX), y2: ankleY, w: 13 * k });
    extras.push({ kind: 'ellipse', cx: x(ankleX + 5 * k), cy: GROUND - 5.5 * s, rx: 12 * k, ry: 5.5 * s, rot: 0 });

    // Arms hang slightly away from the body.
    const sx = x(sh - 3 * k);
    const sy = shoulderY + 5 * s;
    const ex = sx + sign * arm.upper * Math.sin(rad(9));
    const ey = sy + arm.upper * Math.cos(rad(9));
    const wx = ex + sign * arm.fore * Math.sin(rad(13));
    const wy = ey + arm.fore * Math.cos(rad(13));
    limbs.push({ kind: 'line', x1: sx, y1: sy, x2: ex, y2: ey, w: 13 * k });
    limbs.push({ kind: 'line', x1: ex, y1: ey, x2: wx, y2: wy, w: 10 * k });
    extras.push({ kind: 'ellipse', cx: wx + sign * 1.5 * s, cy: wy + 6 * s, rx: 5.5 * k, ry: 8 * s, rot: -sign * 13 });

    anchors[`shoulder${id}`] = { x: x(sh), y: shoulderY };
    anchors[`waist${id}`] = { x: x(wh), y: waistY };
    anchors[`hip${id}`] = { x: x(hh), y: hipY };
    anchors[`knee${id}`] = { x: x(kneeX), y: kneeY };
    anchors[`ankle${id}`] = { x: x(ankleX), y: ankleY };
    anchors[`foot${id}`] = { x: x(ankleX + 5 * k), y: GROUND - 5.5 * s };
    anchors[`wrist${id}`] = { x: wx, y: wy };
  }

  parts.push(...limbs, ...extras, {
    kind: 'ellipse', cx: CX, cy: top + 0.065 * H, rx: 0.052 * H, ry: 0.065 * H, rot: 0,
  });

  for (const key of Object.keys(anchors)) anchors[key] = { x: f(anchors[key].x), y: f(anchors[key].y) };
  return { anchors, parts, shadow: { cx: CX, cy: GROUND + 1, rx: 46 * k, ry: 4 * s } };
}
