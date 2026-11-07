// Downloads the Konva stage as a PNG. The dashed selection outline is hidden for the capture.
export function exportStagePng(stage, name) {
  const outlines = stage.find('.outline');
  outlines.forEach((n) => n.hide());
  try {
    const url = stage.toDataURL({ pixelRatio: Math.max(2, 800 / stage.width()), mimeType: 'image/png' });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'outfit'}.png`;
    a.click();
  } finally {
    outlines.forEach((n) => n.show());
  }
}
