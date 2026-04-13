/* tab title typewriter */
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

/* ascii art displacement */
const artCanvas = document.getElementById('c-art');
const artCtx    = artCanvas.getContext('2d');

const ART_FONT_SIZE   = 14;
const ART_LINE_H      = 20;
const ART_FONT        = `${ART_FONT_SIZE}px "Courier New", Courier, monospace`;
const ART_PAD_TOP     = 40;
const ART_PAD_BOTTOM  = 40;

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
    for (let ci = 0; ci < line.length; ci++) {
      const normalX = artX + ci * artCharW;
      cells.push(normalX, 0, 0, i, ci);
    }
  }
  artCells = cells;
  artBaseYs = baseYs;
}

function drawArt() {
  artCtx.clearRect(0, 0, artW, artH);
  artCtx.font      = ART_FONT;
  artCtx.fillStyle = '#ffffff';
  artCtx.textAlign = 'left';

  const cells = artCells;
  const baseYs = artBaseYs;
  const cellsLen = cells.length;

  for (let k = 0; k < cellsLen; k += 5) {
    const normalX = cells[k];
    const lineIdx = cells[k + 3];
    const charIdx = cells[k + 4];
    artCtx.fillText(ART[lineIdx][charIdx], normalX, baseYs[lineIdx]);
  }
}

addEventListener('resize', () => {
  resizeArt();
  drawArt();
});

requestAnimationFrame(() => {
  resizeArt();
  drawArt();
});
