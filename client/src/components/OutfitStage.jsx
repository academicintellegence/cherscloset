import { useEffect, useMemo, useRef, useState } from 'react';
import { Ellipse, Layer, Line, Path, Rect, Stage } from 'react-konva';
import { MANNEQUIN_FILL, VIEWBOX, buildMannequin } from '../lib/mannequin.js';
import Sticker from './Sticker.jsx';

function MannequinShapes({ avatar }) {
  const { parts, shadow } = useMemo(() => buildMannequin(avatar), [avatar]);
  return (
    <>
      <Rect width={VIEWBOX.w} height={VIEWBOX.h} fill="#ffe3f0" />
      <Ellipse x={shadow.cx} y={shadow.cy} radiusX={shadow.rx} radiusY={shadow.ry} fill="rgba(43,34,48,0.12)" />
      {parts.map((p, i) => {
        if (p.kind === 'path') return <Path key={i} data={p.d} fill={MANNEQUIN_FILL} />;
        if (p.kind === 'line') {
          return <Line key={i} points={[p.x1, p.y1, p.x2, p.y2]} stroke={MANNEQUIN_FILL} strokeWidth={p.w} lineCap="round" />;
        }
        return <Ellipse key={i} x={p.cx} y={p.cy} radiusX={p.rx} radiusY={p.ry} rotation={p.rot} fill={MANNEQUIN_FILL} />;
      })}
    </>
  );
}

// All drawing happens in mannequin units (200 x 400); the layers are scaled to the screen.
export default function OutfitStage({ avatar, layers, selectedId, onSelect, onMove, onSwipe, stageRef, readOnly = false }) {
  const wrap = useRef(null);
  const swipeStart = useRef(null);
  const [width, setWidth] = useState(240);

  useEffect(() => {
    const el = wrap.current;
    const measure = () => {
      const maxHeight = Math.min(window.innerHeight * 0.58, 560);
      setWidth(Math.max(120, Math.min(el.clientWidth - 16, maxHeight / 2)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = width / VIEWBOX.w;
  // Pressing the empty background deselects, and a sideways drag from there is a swipe.
  const clientX = (e) => (e.evt.changedTouches ? e.evt.changedTouches[0].clientX : e.evt.clientX);
  const down = (e) => {
    const onBackground = e.target === e.target.getStage();
    if (onBackground) onSelect(null);
    swipeStart.current = onBackground ? clientX(e) : null;
  };
  const up = (e) => {
    if (swipeStart.current == null) return;
    const dx = clientX(e) - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1);
  };

  return (
    <div className="outfit-stage" ref={wrap}>
      <Stage ref={stageRef} width={width} height={width * 2} onMouseDown={down} onTouchStart={down} onMouseUp={up} onTouchEnd={up}>
        <Layer scaleX={scale} scaleY={scale} listening={false}>
          <MannequinShapes avatar={avatar} />
        </Layer>
        <Layer scaleX={scale} scaleY={scale}>
          {layers.map(({ item, box, fit }) => (
            <Sticker key={item.id} item={item} box={box} fit={fit} selected={item.id === selectedId} onSelect={onSelect} onMove={onMove} readOnly={readOnly} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
