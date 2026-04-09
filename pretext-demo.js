let _pretextLib = null;
async function loadPretextLib() {
  if (_pretextLib) return _pretextLib;
  _pretextLib = await import('@chenglou/pretext');
  return _pretextLib;
}

async function initPretextDemo(stage) {
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  const { prepareWithSegments, layoutNextLine } = await loadPretextLib();

  const FONT_SIZE = 14;
  const LINE_H = 20;
  const FONT = FONT_SIZE + 'px "Courier New", Courier, monospace';
  const PAD = 10;
  const SPHERE_RADIUS = 50;

  let bodyText = '';
  for (let i = 0; i < 600; i++) bodyText += 'PRETEXT ';

  let W, H, dpr, prepared;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = stage.offsetWidth;
    H = stage.offsetHeight || 380;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT;
    prepared = prepareWithSegments(bodyText, FONT);
  }

  let bx = 120, by = 100;
  let bvx = 2.6, bvy = 1.9;

  function step() {
    if (!canvas.isConnected) return;

    bx += bvx;
    by += bvy;
    if (bx - SPHERE_RADIUS < 0) { bx = SPHERE_RADIUS;     bvx = -bvx; }
    if (bx + SPHERE_RADIUS > W) { bx = W - SPHERE_RADIUS; bvx = -bvx; }
    if (by - SPHERE_RADIUS < 0) { by = SPHERE_RADIUS;     bvy = -bvy; }
    if (by + SPHERE_RADIUS > H) { by = H - SPHERE_RADIUS; bvy = -bvy; }

    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    ctx.fillStyle = '#c8c8d0';
    ctx.textBaseline = 'alphabetic';

    const colStart = PAD;
    const colEnd   = W - PAD;
    const colW     = colEnd - colStart;

    let cursor = { segmentIndex: 0, graphemeIndex: 0 };

    for (let y = PAD; y < H; y += LINE_H) {
      const midY = y + LINE_H * 0.45;
      const dy   = midY - by;
      const textY = y + FONT_SIZE;

      if (Math.abs(dy) < SPHERE_RADIUS) {
        const chord      = Math.sqrt(SPHERE_RADIUS * SPHERE_RADIUS - dy * dy);
        const leftEdge   = bx - chord;
        const rightEdge  = bx + chord;
        const leftWidth  = Math.max(0, leftEdge - colStart);
        const rightStart = Math.min(colEnd, rightEdge);
        const rightWidth = Math.max(0, colEnd - rightStart);

        if (leftWidth >= 8) {
          const line = layoutNextLine(prepared, cursor, leftWidth);
          if (!line) { cursor = { segmentIndex: 0, graphemeIndex: 0 }; continue; }
          ctx.textAlign = 'right';
          ctx.fillText(line.text, colStart + leftWidth, textY);
          cursor = line.end;
        }

        if (rightWidth >= 8) {
          const line = layoutNextLine(prepared, cursor, rightWidth);
          if (!line) { cursor = { segmentIndex: 0, graphemeIndex: 0 }; continue; }
          ctx.textAlign = 'left';
          ctx.fillText(line.text, rightStart, textY);
          cursor = line.end;
        }

      } else {
        ctx.textAlign = 'left';
        const line = layoutNextLine(prepared, cursor, colW);
        if (!line) { cursor = { segmentIndex: 0, graphemeIndex: 0 }; continue; }
        ctx.fillText(line.text, colStart, textY);
        cursor = line.end;
      }
    }

    ctx.textAlign = 'left';
    requestAnimationFrame(step);
  }

  resize();
  window.addEventListener('resize', resize);
  step();
}

window.initPretextDemo = initPretextDemo;
