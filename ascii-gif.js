/* ascii gif */

const ASCII_RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const ASCII_RES = 14;
const ASCII_FONT = '14px ui-monospace, Menlo, Consolas, "Share Tech Mono", monospace';

let _aFrames = [];
let _aFrameIndex = 0;
let _aLastFrameTime = 0;
let _aOff = null;
let _aOffCtx = null;
let _aCanvas = null;
let _aCtx = null;
let _aContainer = null;
let _aCellW = 0;
let _aCellH = 0;
let _aCols = 0;
let _aRows = 0;
let _aReady = false;
let _aFullW = 0;
let _aFullH = 0;
let _aFullCanvas = null;
let _aFullCtx = null;

function initAsciiGif() {
  _aContainer = document.getElementById("ascii-gif");
  if (!_aContainer) {
    console.error('ascii-gif: #ascii-gif element not found');
    return;
  }

  _aContainer.innerHTML = '';
  _aCanvas = document.createElement('canvas');
  _aCanvas.width = 900;
  _aCanvas.height = 500;
  _aCanvas.style.display = 'block';
  _aCanvas.style.margin = '0 auto';
  _aCanvas.style.width = '100%';
  _aCanvas.style.height = 'auto';
  _aCanvas.style.maxWidth = '600px';
  _aContainer.appendChild(_aCanvas);
  _aCtx = _aCanvas.getContext('2d');

  _aCtx.font = ASCII_FONT;
  _aCtx.textBaseline = 'top';
  const metrics = _aCtx.measureText('M');
  _aCellW = metrics.width;
  _aCellH = ASCII_RES;

  _aOff = document.createElement('canvas');
  _aOff.width = 200;
  _aOff.height = 200;
  _aOffCtx = _aOff.getContext('2d', { willReadFrequently: true });

  _aFullCanvas = document.createElement('canvas');
  _aFullCtx = _aFullCanvas.getContext('2d');

  fetch('data/gifs.json')
    .then(r => r.json())
    .then(data => {
      const list = data.gifs || [];
      if (list.length === 0) {
        console.error('No gifs listed in gifs.json');
        return;
      }
      const pick = list[Math.floor(Math.random() * list.length)];
      return loadGifFrames(pick);
    })
    .catch(err => console.error('Failed to load gif:', err));
}

async function loadGifFrames(url) {
  const { parseGIF, decompressFrames } = await import('https://esm.sh/gifuct-js@2.1.2');

  const buf = await fetch(url).then(r => r.arrayBuffer());
  const gif = parseGIF(buf);
  const rawFrames = decompressFrames(gif, true);

  if (rawFrames.length === 0) {
    console.error('ascii-gif: gif has no frames');
    return;
  }

  _aFullW = gif.lsd.width;
  _aFullH = gif.lsd.height;
  _aFullCanvas.width = _aFullW;
  _aFullCanvas.height = _aFullH;

  const composited = [];
  let prevImageData = null;

  for (let i = 0; i < rawFrames.length; i++) {
    const f = rawFrames[i];

    if (i > 0) {
      const prev = rawFrames[i - 1];
      if (prev.disposalType === 2) {
        _aFullCtx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height);
      } else if (prev.disposalType === 3 && prevImageData) {
        _aFullCtx.putImageData(prevImageData, 0, 0);
      }
    }

    if (f.disposalType === 3) {
      prevImageData = _aFullCtx.getImageData(0, 0, _aFullW, _aFullH);
    }

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = f.dims.width;
    patchCanvas.height = f.dims.height;
    const patchCtx = patchCanvas.getContext('2d');
    const patchImage = patchCtx.createImageData(f.dims.width, f.dims.height);
    patchImage.data.set(f.patch);
    patchCtx.putImageData(patchImage, 0, 0);
    _aFullCtx.drawImage(patchCanvas, f.dims.left, f.dims.top);

    const snap = document.createElement('canvas');
    snap.width = _aFullW;
    snap.height = _aFullH;
    snap.getContext('2d').drawImage(_aFullCanvas, 0, 0);

    composited.push({
      canvas: snap,
      delay: Math.max(20, f.delay || 100)
    });
  }

  _aFrames = composited;
  _aFrameIndex = 0;
  _aLastFrameTime = performance.now();

  const charAspect = _aCellH / _aCellW;
  const cols = 90;
  const rows = Math.max(10, Math.floor(cols * (_aFullH / _aFullW) / charAspect));

  _aCanvas.width = Math.ceil(cols * _aCellW);
  _aCanvas.height = Math.ceil(rows * _aCellH);

  _aOff.width = cols;
  _aOff.height = rows;
  _aOffCtx.imageSmoothingEnabled = false;

  _aCols = cols;
  _aRows = rows;

  _aReady = true;
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!_aReady || _aFrames.length === 0) return;

  const now = performance.now();
  const cur = _aFrames[_aFrameIndex];
  if (now - _aLastFrameTime >= cur.delay) {
    _aFrameIndex = (_aFrameIndex + 1) % _aFrames.length;
    _aLastFrameTime = now;
  }
  const frame = _aFrames[_aFrameIndex];

  const cols = _aCols;
  const rows = _aRows;

  _aOffCtx.drawImage(frame.canvas, 0, 0, cols, rows);
  const imgData = _aOffCtx.getImageData(0, 0, cols, rows).data;

  _aCtx.clearRect(0, 0, _aCanvas.width, _aCanvas.height);
  _aCtx.font = ASCII_FONT;
  _aCtx.textBaseline = 'top';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = 4 * (y * cols + x);
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const bright = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const idx = (bright * (ASCII_RAMP.length - 1)) | 0;
      const ch = ASCII_RAMP[idx];
      if (ch === ' ') continue;

      _aCtx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      _aCtx.fillText(ch, x * _aCellW, y * _aCellH);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAsciiGif();
    requestAnimationFrame(renderFrame);
  });
} else {
  initAsciiGif();
  requestAnimationFrame(renderFrame);
}
