import { GROUND } from './mannequin.js';
import { FIT_LIMITS } from '../constants.js';

// Back to front. Shoes sit over trouser hems, outerwear over tops, belts and accessories on top.
export const Z_ORDER = ['dress', 'bottom', 'top', 'shoes', 'outerwear', 'belt', 'accessory'];

const MIN_STRETCH = 0.75; // a sticker is never stretched more than ~33% differently in x and y
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const span = (a, b) => Math.abs(b.x - a.x);
const mean = (a, b) => (a + b) / 2;
const round3 = (n) => Math.round(n * 1000) / 1000;

// Box spanning two anchor heights; the sticker stretches to it.
const stretch = (cx, y0, y1, w) => ({ mode: 'stretch', cx, cy: mean(y0, y1), w, h: y1 - y0, align: 'center' });

/** Target area for a category, derived from the avatar's anchors (viewBox units). */
export function slotBox(category, A) {
  const shoulders = span(A.shoulderL, A.shoulderR);
  const hips = span(A.hipL, A.hipR);
  const kneeY = mean(A.kneeL.y, A.kneeR.y);
  const ankleY = mean(A.ankleL.y, A.ankleR.y);
  const cx = A.neck.x;

  switch (category) {
    case 'top': return stretch(cx, A.neck.y - 3, A.hips.y, Math.max(shoulders * 1.45, hips * 1.1));
    case 'dress': return stretch(cx, A.neck.y - 3, kneeY, Math.max(shoulders * 1.3, hips * 1.25));
    case 'outerwear': return stretch(cx, A.neck.y - 5, A.hips.y + (kneeY - A.hips.y) * 0.3, Math.max(shoulders * 1.6, hips * 1.3));
    case 'bottom': return stretch(cx, A.waist.y - 2, ankleY + 4, hips * 1.25);
    // Width-driven slots keep the sticker's own proportions.
    case 'shoes': return { mode: 'width', cx, cy: GROUND, w: span(A.footL, A.footR) * 1.6, align: 'bottom' };
    case 'belt': return { mode: 'width', cx, cy: A.waist.y, w: span(A.waistL, A.waistR) * 1.15, align: 'center' };
    default: return { mode: 'width', cx, cy: A.neck.y + 6, w: shoulders * 0.5, align: 'center' }; // accessory: user nudges it once
  }
}

/** Centre position, size and rotation of a sticker (iw x ih px) in a box, with the item's saved fit applied. */
export function placeSticker(box, iw, ih, fit) {
  let w;
  let h;
  if (box.mode === 'stretch') {
    const sw = box.w / iw;
    const sh = box.h / ih;
    const r = clamp(sw / sh, MIN_STRETCH, 1 / MIN_STRETCH);
    const m = Math.sqrt(sw * sh);
    w = iw * m * Math.sqrt(r);
    h = (ih * m) / Math.sqrt(r);
  } else {
    w = box.w;
    h = (box.w * ih) / iw;
  }
  w *= fit.scale;
  h *= fit.scale;
  const baseY = box.align === 'bottom' ? box.cy - h / 2 : box.cy;
  const refH = box.h ?? h;
  return { x: box.cx + fit.dx * box.w, y: baseY + fit.dy * refH, w, h, rot: fit.rot, baseY, refH };
}

/** Inverse of the offset part of placeSticker: drag position -> saved dx/dy. */
export function offsetFromPosition(box, placed, x, y) {
  const o = FIT_LIMITS.offset;
  return {
    dx: round3(clamp((x - box.cx) / box.w, -o, o)),
    dy: round3(clamp((y - placed.baseY) / placed.refH, -o, o)),
  };
}
