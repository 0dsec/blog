document.title = '0';
var _typeI = 1;
var _typeTitle = 'Welcome to 0daze!';
var _typeDir = 1;
var _typeTimer = null;
var _tabHidden = false;
var _hiddenMessages = ['Hey! what are you doing!?', '👀👀👀👀👀👀👀👀👀👀', 'Can I see!?', '👀👀👀👀👀👀👀👀👀👀'];
var _hiddenIndex = 0;
var _hiddenTimer = null;

function _typeStep() {
  if (_tabHidden) return;
  _typeI += _typeDir;
  if (_typeI > _typeTitle.length) {
    _typeI = _typeTitle.length;
    _typeDir = -1;
  } else if (_typeI < 1) {
    _typeI = 1;
    _typeDir = 1;
  }
  document.title = _typeTitle.slice(0, _typeI);
  _typeTimer = setTimeout(_typeStep, _typeDir === 1 ? 200 : 50);
}
_typeTimer = setTimeout(_typeStep, 200);

function _hiddenStep() {
  if (!_tabHidden) return;
  document.title = _hiddenMessages[_hiddenIndex];
  _hiddenIndex = (_hiddenIndex + 1) % _hiddenMessages.length;
  _hiddenTimer = setTimeout(_hiddenStep, 1500);
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    _tabHidden = true;
    clearTimeout(_typeTimer);
    _hiddenIndex = 0;
    document.title = _hiddenMessages[0];
    _hiddenIndex = 1;
    _hiddenTimer = setTimeout(_hiddenStep, 1500);
  } else {
    _tabHidden = false;
    clearTimeout(_hiddenTimer);
    _typeI = 1;
    _typeDir = 1;
    document.title = _typeTitle[0];
    _typeTimer = setTimeout(_typeStep, 200);
  }
});


window.setTabTitle = function(newTitle) {
  _typeTitle = newTitle;
  clearTimeout(_typeTimer);
  _typeI = 1;
  _typeDir = 1;
  document.title = _typeTitle[0];
  _typeTimer = setTimeout(_typeStep, 200);
};


let mx = -9999, my = -9999;
addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

const artCanvas = document.getElementById('c-art');
const artCtx    = artCanvas.getContext('2d');

const ART_FONT_SIZE   = 14;
const ART_LINE_H      = 20;
const ART_FONT        = `${ART_FONT_SIZE}px "Courier New", Courier, monospace`;
const ART_RADIUS      = 40;
const ART_PUSH_RADIUS = 160;
const ART_PAD_TOP     = 40;
const ART_PAD_BOTTOM  = 40;

artCanvas.style.cursor = 'none';

const ART = [
  `   ______         __                               `,
  `  /      \\       |  \\                              `,
  ` |  $$$$$$\\  ____| $$  ______   ________   ______  `,
  ` | $$$\\| $$ /      $$ |      \\ |        \\ /      \\ `,
  ` | $$$$\\ $$|  $$$$$$$  \\$$$$$$\\ \\$$$$$$$$|  $$$$$$\\`,
  ` | $$\\$$\\$$| $$  | $$ /      $$  /    $$ | $$    $$`,
  ` | $$_\\$$$$| $$__| $$|  $$$$$$$ /  $$$$_ | $$$$$$$$`,
  `  \\$$  \\$$$ \\$$    $$ \\$$    $$|  $$    \\ \\$$     \\`,
  `   \\$$$$$$   \\$$$$$$$  \\$$$$$$$ \\$$$$$$$$  \\$$$$$$$`,
  `                                                    `,
  `          _GAMEDEV  _WEBDEV  _CYBERSEC  _ART     `,
  `                                                    `,
  `                      0dze@pm.me`
];

let artW, artH, artDpr, artCharW, artX;


let artCells = null;  
let artBaseYs = null; 
let artRect = null;  

function updateArtRect() {
  artRect = artCanvas.getBoundingClientRect();
}

function resizeArt() {
  artDpr = window.devicePixelRatio || 1;
  artCtx.font = ART_FONT;
  artCharW = artCtx.measureText('X').width;
  const maxLen = Math.max(...ART.map(l => l.length));
  artW = maxLen * artCharW + 80;
  artH = ART_PAD_TOP + ART.length * ART_LINE_H + ART_PAD_BOTTOM;
  artCanvas.width  = Math.round(artW * artDpr);
  artCanvas.height = Math.round(artH * artDpr);
  artCanvas.style.width  = artW + 'px';
  artCanvas.style.height = artH + 'px';
  artCtx.setTransform(artDpr, 0, 0, artDpr, 0, 0);
  artCtx.font = ART_FONT;
  artX = Math.floor((artW - maxLen * artCharW) / 2);

  
  const cells = [];
  const baseYs = [];
  for (let i = 0; i < ART.length; i++) {
    baseYs.push(ART_PAD_TOP + i * ART_LINE_H + ART_FONT_SIZE);
    const line = ART[i];
    const cy = ART_PAD_TOP + i * ART_LINE_H + ART_LINE_H * 0.5;
    for (let ci = 0; ci < line.length; ci++) {
      const normalX = artX + ci * artCharW;
      const cx = normalX + artCharW * 0.5;
      cells.push(normalX, cx, cy, i, ci);
    }
  }
  artCells = cells;
  artBaseYs = baseYs;

  updateArtRect();
}

function drawArt() {
  artCtx.clearRect(0, 0, artW, artH);
  artCtx.font      = ART_FONT;
  artCtx.fillStyle = '#ffffff';
  artCtx.textAlign = 'left';

  const lmx = mx - artRect.left;
  const lmy = my - artRect.top;

  const cells = artCells;
  const baseYs = artBaseYs;
  const cellsLen = cells.length;

  for (let k = 0; k < cellsLen; k += 5) {
    const normalX = cells[k];
    const cx = cells[k + 1];
    const cy = cells[k + 2];
    const lineIdx = cells[k + 3];
    const charIdx = cells[k + 4];

    const dx = cx - lmx;
    const dy = cy - lmy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < ART_RADIUS) continue;

    let offsetX = 0;
    if (dist < ART_PUSH_RADIUS) {
      const strength = (ART_PUSH_RADIUS - dist) / (ART_PUSH_RADIUS - ART_RADIUS);
      offsetX = (dx / dist) * strength * ART_RADIUS * 0.8;
    }
    artCtx.fillText(ART[lineIdx][charIdx], normalX + offsetX, baseYs[lineIdx]);
  }
}


var cubeAngle = 0;
var cubeSpeed = 20;           
var cubeTargetSpeed = 20;     
var cubePaused = false;
var cubeLastTime = performance.now();
var cubeEl = document.getElementById('cube');


window.setCubeReversed = function(reversed) {
  cubeTargetSpeed = reversed ? -20 : 20;
};

function updateCubeRotation() {
  var now = performance.now();
  var dt = (now - cubeLastTime) / 1000;
  cubeLastTime = now;


  cubeSpeed += (cubeTargetSpeed - cubeSpeed) * 0.03;

  if (!cubePaused) {
    cubeAngle += cubeSpeed * dt;
  }

  cubeEl.style.transform = 'rotateX(-20deg) rotateY(' + cubeAngle + 'deg)';
}


cubeEl.addEventListener('mouseenter', function() { cubePaused = true; });
cubeEl.addEventListener('mouseleave', function() { cubePaused = false; });


(function() {
  const CELL = 14;
  const FONT_SIZE = 11;
  const VOID_RADIUS = 45;
  const PUSH_FORCE = 120;
  const RETURN_SPEED = 0.08;
  const FRICTION = 0.88;

  const faces = document.querySelectorAll('.face');
  const cursorEl = document.getElementById('cursor');
  const faceData = [];

  class Particle {
    constructor(x, y) {
      this.homeX = x;
      this.homeY = y;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.char = Math.random() > 0.5 ? '1' : '0';
      this.brightness = 0.4 + Math.random() * 0.5;
      this.flickerSpeed = 0.002 + Math.random() * 0.008;
      this.flickerOffset = Math.random() * Math.PI * 2;
      this.charTimer = Math.random() * 300;
    }

    update(mouseX, mouseY, hasPointer, time) {
      this.brightness = 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(time * this.flickerSpeed + this.flickerOffset));

      this.charTimer--;
      if (this.charTimer <= 0) {
        this.char = Math.random() > 0.5 ? '1' : '0';
        this.charTimer = 50 + Math.random() * 400;
      }

      if (hasPointer) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < VOID_RADIUS && dist > 0) {
          const force = (1 - dist / VOID_RADIUS) * PUSH_FORCE;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force * 0.15;
          this.vy += Math.sin(angle) * force * 0.15;
          this.brightness = Math.min(1, this.brightness + (1 - dist / VOID_RADIUS) * 0.6);
        }
      }

      this.vx += (this.homeX - this.x) * RETURN_SPEED;
      this.vy += (this.homeY - this.y) * RETURN_SPEED;

      this.vx *= FRICTION;
      this.vy *= FRICTION;

      this.x += this.vx;
      this.y += this.vy;
    }
  }

  for (let fi = 0; fi < faces.length; fi++) {
    const face = faces[fi];
    const canvas = face.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const W = 180;
    const H = 180;
    canvas.width = W;
    canvas.height = H;

    const cols = Math.floor(W / CELL);
    const rows = Math.floor(H / CELL);
    const offsetX = (W - cols * CELL) / 2;
    const offsetY = (H - rows * CELL) / 2;
    const particles = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = offsetX + c * CELL + CELL / 2;
        const py = offsetY + r * CELL + CELL / 2;
        particles.push(new Particle(px, py));
      }
    }

    faceData.push({
      canvas, ctx, particles,
      mouseX: -999, mouseY: -999,
      hasPointer: false,
      w: W, h: H
    });


    const idx = fi;
    face.addEventListener('mousemove', (e) => {
      faceData[idx].mouseX = e.offsetX;
      faceData[idx].mouseY = e.offsetY;
      faceData[idx].hasPointer = true;
    });

    face.addEventListener('mouseleave', () => {
      faceData[idx].hasPointer = false;
    });
  }

  const sceneEl = document.querySelector('.scene');
  document.addEventListener('mousemove', (e) => {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top = e.clientY + 'px';
  });
  sceneEl.addEventListener('mouseenter', () => {
    cursorEl.style.display = 'block';
  });
  sceneEl.addEventListener('mouseleave', () => {
    cursorEl.style.display = 'none';
  });

  const COLOR_BUCKETS = 32;
  const restingColors = new Array(COLOR_BUCKETS);
  for (let i = 0; i < COLOR_BUCKETS; i++) {
    const b = i / (COLOR_BUCKETS - 1);
    const g = Math.floor(180 + 75 * b);
    restingColors[i] = 'rgba(0,' + g + ',50,' + b.toFixed(2) + ')';
  }

  let time = 0;

  function drawCubeFrame() {
    time++;
    updateCubeRotation();

    const fdLen = faceData.length;
    for (let f = 0; f < fdLen; f++) {
      const fd = faceData[f];
      const ctx = fd.ctx;
      const particles = fd.particles;
      const mouseX = fd.mouseX;
      const mouseY = fd.mouseY;
      const hasPointer = fd.hasPointer;
      const w = fd.w;
      const h = fd.h;

      ctx.clearRect(0, 0, w, h);
      ctx.font = `${FONT_SIZE}px 'Share Tech Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (hasPointer) {
        const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, VOID_RADIUS * 1.2);
        grad.addColorStop(0, 'rgba(0, 255, 70, 0.04)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      const pLen = particles.length;
      for (let i = 0; i < pLen; i++) {
        const p = particles[i];
        p.update(mouseX, mouseY, hasPointer, time);

        const ddx = p.x - p.homeX;
        const ddy = p.y - p.homeY;
        const displacement = Math.sqrt(ddx * ddx + ddy * ddy);
        const displaceFactor = Math.min(1, displacement / 60);

        
        if (displacement < 0.5) {
          const bIdx = (p.brightness * (COLOR_BUCKETS - 1)) | 0;
          ctx.fillStyle = restingColors[bIdx];
        } else {
          const g = Math.floor(180 + 75 * p.brightness);
          const r = Math.floor(displaceFactor * 80);
          const alpha = p.brightness + displaceFactor * 0.3;
          ctx.fillStyle = `rgba(${r}, ${g}, 50, ${alpha.toFixed(2)})`;
        }

        if (displacement > 5) {
          ctx.shadowColor = `rgba(0, 255, 70, ${(displaceFactor * 0.6).toFixed(2)})`;
          ctx.shadowBlur = 6 + displaceFactor * 10;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.fillText(p.char, p.x, p.y);
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }


  window._drawCubeFrame = drawCubeFrame;
})();


function drawMain() {
  drawArt();
  if (window._drawCubeFrame) window._drawCubeFrame();
  requestAnimationFrame(drawMain);
}

addEventListener('resize', resizeArt);
addEventListener('scroll', updateArtRect, { passive: true });

requestAnimationFrame(() => {
  resizeArt();
  drawMain();
});
