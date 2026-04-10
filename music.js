/* playlist */
const playlist = [
   { title: 'IDK', artist: '0daze', file: 'music/IDK.wav' },
   { title: 'level one', artist: '0daze', file: 'music/level1.wav' },
   { title: 'level two', artist: '0daze', file: 'music/level2.wav' },
   { title: 'Boss 1', artist: '0daze', file: 'music/Boss1.wav' },
   { title: 'Character Select', artist: '0daze', file: 'music/Character Select.wav' },
   { title: 'Continue Screen', artist: '0daze', file: 'music/Continue Screen.wav' },
];

let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();

const btnPrev = document.getElementById('m-prev');
const btnPlay = document.getElementById('m-play');
const btnNext = document.getElementById('m-next');
const trackLink = document.getElementById('m-track');
const trackText = document.getElementById('m-track-text');

function updateTrackDisplay() {
  var t = playlist[currentTrack];
  var label = t.artist + ' \u2014 ' + t.title;
  var spacer = '\u00A0\u00A0\u00A0\u2022\u00A0\u00A0\u00A0';
  trackText.textContent = label + spacer + label + spacer;
  if (t.url) {
    trackLink.href = t.url;
    trackLink.style.pointerEvents = 'auto';
  } else {
    trackLink.removeAttribute('href');
    trackLink.style.pointerEvents = 'none';
  }
}

function loadTrack(index) {
  if (playlist.length === 0) return;
  currentTrack = ((index % playlist.length) + playlist.length) % playlist.length;
  audio.src = playlist[currentTrack].file;
  updateTrackDisplay();
}

/* play / pause */

function togglePlay() {
  if (playlist.length === 0) return;
  if (!audio.src) loadTrack(0);
  initEQ();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    btnPlay.innerHTML = '&#9654;';
    btnPlay.classList.remove('playing');
  } else {
    audio.play();
    isPlaying = true;
    btnPlay.innerHTML = '&#10074;&#10074;';
    btnPlay.classList.add('playing');
    startEQ();
  }
}

function nextTrack() {
  if (playlist.length === 0) return;
  loadTrack(currentTrack + 1);
  if (isPlaying) audio.play();
}

function prevTrack() {
  if (playlist.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadTrack(currentTrack - 1);
    if (isPlaying) audio.play();
  }
}

audio.addEventListener('ended', function() {
  nextTrack();
});

btnPlay.addEventListener('click', togglePlay);
btnNext.addEventListener('click', nextTrack);
btnPrev.addEventListener('click', prevTrack);

/* volume bar */

const volBar = document.getElementById('vol-bar');
const volFill = document.getElementById('vol-fill');
audio.volume = 0.25;

function setVolumeFromY(clientY) {
  const rect = volBar.getBoundingClientRect();
  const y = rect.bottom - clientY;
  const pct = Math.max(0, Math.min(1, y / rect.height));
  audio.volume = pct;
  var insetTop = ((1 - pct) * 100);
  volFill.style.clipPath = 'inset(' + insetTop + '% 0 0 0)';
}

var volDragging = false;

volBar.addEventListener('mousedown', function(e) {
  volDragging = true;
  setVolumeFromY(e.clientY);
  e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
  if (volDragging) setVolumeFromY(e.clientY);
});

document.addEventListener('mouseup', function() {
  volDragging = false;
});

/* progress bar */

var progressBar = document.getElementById('m-progress');
var progressFill = document.getElementById('m-progress-fill');

audio.addEventListener('timeupdate', function() {
  if (audio.duration) {
    progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
  }
});

progressBar.addEventListener('click', function(e) {
  if (!audio.duration) return;
  var rect = progressBar.getBoundingClientRect();
  var pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

/* eq visualizer */

var eqCanvas = document.getElementById('eq-canvas');
var eqCtx = eqCanvas.getContext('2d');
var audioCtx = null;
var analyser = null;
var eqSource = null;
var freqData = null;
var eqReady = false;

function initEQ() {
  if (eqReady) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  var compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
  compressor.knee.setValueAtTime(12, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(8, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0.005, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.15, audioCtx.currentTime);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.5;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  eqSource = audioCtx.createMediaElementSource(audio);
  eqSource.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(audioCtx.destination);
  freqData = new Uint8Array(analyser.frequencyBinCount);
  eqReady = true;
}

function resizeEQ() {
  var dpr = window.devicePixelRatio || 1;
  eqCanvas.width = Math.round(window.innerWidth * dpr);
  eqCanvas.height = Math.round(60 * dpr);
  eqCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeEQ();
addEventListener('resize', resizeEQ);

var eqRunning = false;

function drawEQ() {
  if (!eqReady || !isPlaying) {
    eqRunning = false;
    var w0 = window.innerWidth;
    eqCtx.clearRect(0, 0, w0, 60);
    return;
  }

  var w = window.innerWidth;
  var h = 60;
  eqCtx.clearRect(0, 0, w, h);

  analyser.getByteFrequencyData(freqData);

  var barCount = 80;
  var gap = 2;
  var barW = (w / barCount) - gap;
  var step = Math.floor(freqData.length / barCount);

  for (var i = 0; i < barCount; i++) {
    var raw = freqData[i * step] / 255;
    var val = Math.pow(raw, 0.6);
    var barH = val * h;

    var r, g, b;
    if (val < 0.5) {
      r = Math.floor(val * 2 * 255);
      g = 255;
      b = 50;
    } else {
      r = 255;
      g = Math.floor((1 - (val - 0.5) * 2) * 255);
      b = 50;
    }

    eqCtx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.55)';
    eqCtx.fillRect(i * (barW + gap), 0, barW, barH);
  }

  requestAnimationFrame(drawEQ);
}

function startEQ() {
  if (eqRunning) return;
  eqRunning = true;
  requestAnimationFrame(drawEQ);
}

/* autoplay */
if (playlist.length > 0) {
  loadTrack(0);
  initEQ();
  audio.play().then(function() {
    isPlaying = true;
    btnPlay.innerHTML = '&#10074;&#10074;';
    btnPlay.classList.add('playing');
    startEQ();
  }).catch(function() {
    document.addEventListener('click', function autoplayRetry() {
      if (!isPlaying && playlist.length > 0) {
        initEQ();
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        audio.play().then(function() {
          isPlaying = true;
          btnPlay.innerHTML = '&#10074;&#10074;';
          btnPlay.classList.add('playing');
          startEQ();
        });
      }
      document.removeEventListener('click', autoplayRetry);
    });
  });
}

