import { Group, Image as KImage, Rect } from 'react-konva';
import useImage from '../lib/useImage.js';
import { offsetFromPosition, placeSticker } from '../lib/fit.js';

// One clothing piece. Position is the centre of the sticker (group offset = half its size), so rotation pivots there.
export default function Sticker({ item, box, fit, selected, onSelect, onMove }) {
  const img = useImage(item.imageUrl);
  if (!img) return null;
  const pl = placeSticker(box, img.naturalWidth, img.naturalHeight, fit);
  return (
    <Group
      x={pl.x} y={pl.y} offsetX={pl.w / 2} offsetY={pl.h / 2} rotation={pl.rot}
      draggable
      onClick={() => onSelect(item.id)}
      onTap={() => onSelect(item.id)}
      onDragStart={() => onSelect(item.id)}
      onDragEnd={(e) => onMove(item.id, offsetFromPosition(box, pl, e.target.x(), e.target.y()))}
    >
      <KImage image={img} width={pl.w} height={pl.h} />
      {selected && <Rect name="outline" width={pl.w} height={pl.h} stroke="#ff6fae" strokeWidth={1.2} dash={[4, 3]} listening={false} />}
    </Group>
  );
}
