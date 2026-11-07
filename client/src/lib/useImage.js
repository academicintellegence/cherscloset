import { useEffect, useState } from 'react';

// Loads an image for Konva. crossOrigin keeps the canvas exportable (PNG export in step 6).
export default function useImage(url) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    let live = true;
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => live && setImg(el);
    el.onerror = () => live && setImg(null);
    el.src = url;
    return () => { live = false; };
  }, [url]);
  return img;
}
