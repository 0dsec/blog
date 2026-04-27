/* wavy ascii logo — shared across pages */

const ART_FONT_SIZE  = 14;
const ART_LINE_H     = 20;
const ART_FONT       = `${ART_FONT_SIZE}px "Courier New", Courier, monospace`;
const ART_PAD_TOP    = 40;
const ART_PAD_BOTTOM = 40;

const WAVE_AMP_Y     = 5;
const WAVE_AMP_X     = 1.2;
const WAVE_FREQ      = 0.055;
const WAVE_SPEED     = 1.3;
const REPEL_RADIUS   = 80;
const REPEL_STRENGTH = 28;
const SPRING_EASE    = 0.12;

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
  `          _CYBERSEC  _WEBDEV  _GAMEDEV  _ART     `,
  `                                                    `,
  `                      0dze@pm.me`
];

(function () {
  const artCanvas = document.getElementById('c-art');
  if (!artCanvas) return;
  const artCtx = artCanvas.getContext('2d');

  let artW, artH, artDpr, artCharW, artX;
  let artCells = null;
  let artBaseYs = null;
  let artTime = 0;
  let artMouseX = -9999;
  let artMouseY = -9999;

  artCanvas.addEventListener('mousemove', function (e) {
    const rect = artCanvas.getBoundingClientRect();
    artMouseX = e.clientX - rect.left;
    artMouseY = e.clientY - rect.top;
  });

  artCanvas.addEventListener('mouseleave', function () {
    artMouseX = -9999;
    artMouseY = -9999;
  });

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

    const cells  = [];
    const baseYs = [];
    for (let i = 0; i < ART.length; i++) {
      baseYs.push(ART_PAD_TOP + i * ART_LINE_H + ART_FONT_SIZE);
      const line = ART[i];
      for (let ci = 0; ci < line.length; ci++) {
        cells.push(
          artX + ci * artCharW, // 0: baseX
          i,                    // 1: lineIdx
          ci,                   // 2: charIdx
          0,                    // 3: curDX
          0                     // 4: curDY
        );
      }
    }
    artCells  = cells;
    artBaseYs = baseYs;
  }

  function drawArt(timestamp) {
    artTime = timestamp * 0.001;
    artCtx.clearRect(0, 0, artW, artH);
    artCtx.font      = ART_FONT;
    artCtx.fillStyle = '#ffffff';
    artCtx.textAlign = 'left';

    const cells    = artCells;
    const baseYs   = artBaseYs;
    const cellsLen = cells.length;
    const STRIDE   = 5;

    for (let k = 0; k < cellsLen; k += STRIDE) {
      const baseX   = cells[k];
      const lineIdx = cells[k + 1];
      const charIdx = cells[k + 2];
      const ch      = ART[lineIdx][charIdx];
      if (ch === ' ') continue;

      const baseY = baseYs[lineIdx];

      const phase   = baseX * WAVE_FREQ - artTime * WAVE_SPEED;
      const targetDX = Math.sin(phase + 1.3) * WAVE_AMP_X;
      const targetDY = Math.sin(phase)       * WAVE_AMP_Y;

      const dx   = baseX - artMouseX;
      const dy   = baseY - artMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let repelDX = 0;
      let repelDY = 0;
      if (dist < REPEL_RADIUS && dist > 0.5) {
        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
        repelDX = (dx / dist) * force;
        repelDY = (dy / dist) * force;
      }

      const wantDX = targetDX + repelDX;
      const wantDY = targetDY + repelDY;

      cells[k + 3] += (wantDX - cells[k + 3]) * SPRING_EASE;
      cells[k + 4] += (wantDY - cells[k + 4]) * SPRING_EASE;

      artCtx.fillText(ch, baseX + cells[k + 3], baseY + cells[k + 4]);
    }

    requestAnimationFrame(drawArt);
  }

  addEventListener('resize', resizeArt);

  requestAnimationFrame(() => {
    resizeArt();
    requestAnimationFrame(drawArt);
  });
}());
