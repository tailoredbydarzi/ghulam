
// Copyright (c) 2025 Aashita Verma  
// Do not use this code without permission, created for Darzi
// https://www.aashitaverma.com


// Download button logic
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // Hide input box for screenshot
      const inputContainer = document.getElementById('name-input-container');
      if (inputContainer) inputContainer.style.display = 'none';

      // Create an offscreen canvas for high quality
      const dpr = window.devicePixelRatio || 1;
      const exportW = DESIGN_W * dpr;
      const exportH = DESIGN_H * dpr;
      let exportCanvas = createGraphics(exportW, exportH);
      exportCanvas.pixelDensity(dpr);

      // Draw everything as in draw(), but to exportCanvas
      exportCanvas.push();
      // Background image
      drawImageCover(exportCanvas, bgImg, 0, 0, exportW, exportH);
      // Video backdrop
      const fitBG = fitRect(getVideoW(video), getVideoH(video), cols, rows);
      const vwBG = fitBG.w * VIDEO_SCALE;
      const vhBG = fitBG.h * VIDEO_SCALE;
      const vxBG = (cols - vwBG) / 2 + VIDEO_OFFSET_X;
      const vyBG = (rows - vhBG) / 2 + VIDEO_OFFSET_Y;
      const scaleToExportX = exportW / cols;
      const scaleToExportY = exportH / rows;
      const dx = vxBG * scaleToExportX;
      const dy = vyBG * scaleToExportY;
      const dw = vwBG * scaleToExportX;
      const dh = vhBG * scaleToExportY;
      exportCanvas.push();
      exportCanvas.blendMode(SCREEN);
      if (VIDEO_BG_TINT && VIDEO_BG_TINT.length === 3) {
        exportCanvas.tint(VIDEO_BG_TINT[0], VIDEO_BG_TINT[1], VIDEO_BG_TINT[2], VIDEO_BG_ALPHA * 255);
      } else {
        exportCanvas.tint(255, VIDEO_BG_ALPHA * 255);
      }
      exportCanvas.image(video, dx, dy, dw, dh);
      exportCanvas.pop();

      // Letters (no glow for speed, but can be added if needed)
      exportCanvas.textAlign(CENTER, CENTER);
      const colorMap = {
        'G': color('#F0F0F0'),
        'H': color('#F1F1F1'),
        'U': color('#666666'),
        'L': color('#FFFFFF'),
        'A': color('#6F7C80'),
        'M': color('#666666')
      };
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = x + y * cols;
          const p = idx * 4;
          let r = vidLayer.pixels[p + 0];
          let g = vidLayer.pixels[p + 1];
          let b = vidLayer.pixels[p + 2];
          let br = (r + g + b) / 3;
          br = constrain(br * GAIN, 0, 255);
          const brightness = br;
          if (!onMask[idx]) continue;
          let drawX = x * pixelSize * dpr;
          let drawY = y * pixelSize * dpr;
          const char = letters[(idx + phase) % letters.length];
          const col = colorMap[char] || color('#F1F1F1');
          exportCanvas.fill(col);
          exportCanvas.textSize(pixelSize * dpr);
          exportCanvas.textStyle(BOLD);
          exportCanvas.text(char, drawX + (pixelSize * dpr) / 2, drawY + (pixelSize * dpr) / 2);
        }
      }
      exportCanvas.pop();

      // Download as PNG
      exportCanvas.save('darzi.png');

      // Restore input box
      if (inputContainer) setTimeout(() => { inputContainer.style.display = ''; }, 300);
        // Show Stay Connected popup
        setTimeout(() => {
          const popup = document.getElementById('darzi-popup');
          if (popup) popup.style.display = '';
        }, 400);
    });
  }
// ========================= CONFIG & GLOBALS =========================
// Popup close logic
document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('darzi-popup');
  const closeBtn = document.getElementById('darzi-popup-close');
  if (closeBtn && popup) {
    closeBtn.onclick = () => { popup.style.display = 'none'; };
  }
});

// ========================= CONFIG & GLOBALS =========================

// ---- Fixed design size for phone-first layout
const DESIGN_W = 390;
const DESIGN_H = 844;


// ---- Backdrop video scale/pan (affects ONLY the backdrop)
const VIDEO_SCALE    = 2.2;
const VIDEO_OFFSET_X = 0;
const VIDEO_OFFSET_Y = -13;

// ---- Raw video backdrop (drawn behind letters)
const VIDEO_BG_ALPHA = 0.2;      // 0..1 opacity
const VIDEO_BG_TINT  = null;     // e.g. [255, 230, 200] or null

// Letters size relative to backdrop (uniform; 1.0 = exact overlay)
const LETTER_SCALE_UNIFORM = 1.0;

// Your original controls
let video;
let pixelSize = 8;
let letters = "GHULAM ";
let nameInput;

let glowLayer;   // blurred bloom overlay (design size)
let vidLayer;    // low-res sampling buffer
let ui;          // offscreen full-design canvas
let bgMusic;

// NEW: sfx on click in video area (array) + click padding
let sfxClips = [];
const SFX_FILES = ['sound1.wav', 'sound2.wav', 'sound3.wav', 'sound4.wav','sound5.wav','sound6.wav']; // add/remove files here
const SFX_COOLDOWN = 180; // ms between plays
let lastSfxAt = 0;
let videoRect = { x: 0, y: 0, w: 0, h: 0 }; // in DESIGN coords, updated each frame
const CLICK_PAD_PX = -70; // +/- px added to each side of the clickable area

// --- Tap hint state (NEW) ---
let showHint = true;
let hintStartMs = 0;
const HINT_KEY = 'disco_hint_seen';
const HINT_AUTODISMISS_MS = 6000; // auto-hide after 6s

// anti-flicker controls
let ON_T = 120;
let OFF_T = 90;
const SMOOTH = 0.25;
const GAIN = 1.2;

// grid / state
let cols, rows, N;
let onMask = null;
let ema = null;

// slow letter drift (set to 0 to disable)
const DRIFT_FRAMES = 0;
let phase = 0;

// ---- Filmic bloom controls ----
const BLOOM_THRESH = 150;
const BLOOM_KNEE   = 40;
const BLOOM_ALPHA  = 110;
const BLOOM_SCALE_MIN = 2.2;
const BLOOM_SCALE_MAX = 3.8;
const BLUR_RADIUS  = 3;
const BLUR_PASSES  = 1;
const USE_ADD_BLEND = true;

// ---- Brightness->Palette (light → dark) ----
const PALETTE_HEX = ["#F1F1F1", "#B0B0B0", "#666666", "#484848", "#343434", "#222222"];
let PALETTE = [];

// Mobile-safe canvas scaling
let scaleS = 1;
let cw = 0, ch = 0;

// Optional safe-area (notch) insets (in design units)
let safe = { top: 0, right: 0, bottom: 0, left: 0 };

// Background image
let bgImg;

// ========================= BURST / FLOAT-BACK FX =========================
const BURST_RADIUS     = 20;        // px in DESIGN space (area affected)
const BURST_DURATION   = 2000;      // ms for full out+back cycle
const BURST_NOISE_SP   = 0;         // noise speed (0 = no wobble)
const BURST_AMP_MAX    = 300;       // max px displacement at center
const BURST_COOLDOWN   = 120;       // ms between re-triggers while hovering

let burstStart = null; // Float32Array of ms (start time), -1 = inactive
let burstSeedA = null; // Float32Array random angle seeds
let burstSeedN = null; // Float32Array noise seeds
let lastBurstAt = 0;   // rate-limit “hover”
let lastBurstX = 0;    // last trigger center (for falloff)
let lastBurstY = 0;

// ========================= p5 LIFECYCLE =========================
function preload() {
  // Background image (cover)
  bgImg = loadImage('bg5jpg.jpg');

  // Audio
  soundFormats('mp3', 'ogg', 'wav');
  bgMusic  = loadSound('1.mp3');
  bgMusic.setVolume(0.3); // Lower the volume (0.0 to 1.0)
  sfxClips = SFX_FILES.map(f => loadSound(f));

  // Build p5.Color palette once
  PALETTE = PALETTE_HEX.map(h => color(h));
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function setup() {
  // ONE canvas, hi-DPI enabled (keeps crisp quality without duplicating the sketch)
  const dpr = window.devicePixelRatio || 1;
  const c = createCanvas(10, 10);
  pixelDensity(dpr);
  c.parent('app');

  // Lower frame rate on mobile devices to reduce heat
  if (isMobileDevice()) {
    frameRate(24); // 24fps is cinematic and saves battery
  }

  // Optional: set SFX volume a bit softer than bg
  // Manually set each SFX volume
  if (sfxClips[0] && sfxClips[0].setVolume) sfxClips[0].setVolume(0.7); // sound1.wav
  if (sfxClips[1] && sfxClips[1].setVolume) sfxClips[1].setVolume(0.9); // sound2.wav louder
  if (sfxClips[2] && sfxClips[2].setVolume) sfxClips[2].setVolume(0.4); // sound3.wav less loud
  if (sfxClips[3] && sfxClips[3].setVolume) sfxClips[3].setVolume(0.9); // sound4.wav softer

  // hint: only show if user hasn't seen it before
  // try {
  //   showHint = localStorage.getItem(HINT_KEY) !== '1';
  // } catch (e) {
  //   showHint = true;
  // }
  hintStartMs = millis();

  // Name input
  nameInput = document.getElementById('name-input');
  if (nameInput) {
    nameInput.addEventListener('input', function() {
      const newName = this.value.trim().toUpperCase();
      letters = newName.length > 0 ? newName : "GHULAM";
      this.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      setTimeout(() => { this.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }, 500);
    });
    nameInput.addEventListener('focus', function() { this.style.transform = 'scale(1.05)'; });
    nameInput.addEventListener('blur',  function() { this.style.transform = 'scale(1)'; });
  }

  // Offscreen canvases
  ui = createGraphics(DESIGN_W, DESIGN_H);
  glowLayer = createGraphics(DESIGN_W, DESIGN_H);
  // keep letters crisp on retina
  ui.pixelDensity(dpr);
  glowLayer.pixelDensity(dpr);
  ui.textAlign(CENTER, CENTER);
  ui.noStroke();
  glowLayer.textAlign(CENTER, CENTER);
  glowLayer.noStroke();

  // Video element
  video = createVideo('discoball.mp4');
  video.volume(0);
  if (video.elt) {
    video.elt.muted = true;
    video.elt.setAttribute('playsinline','');
  }
  video.loop();
  video.play();
  video.hide();

  // Grid in DESIGN space
  cols = Math.floor(DESIGN_W / pixelSize);
  rows = Math.floor(DESIGN_H / pixelSize);
  N = cols * rows;

  // Sampling buffer: intentionally low-res (don’t set high DPR here)
  vidLayer  = createGraphics(cols, rows);
  vidLayer.pixelDensity(1);

  // State arrays
  onMask = new Array(N).fill(false);
  ema    = new Array(N).fill(0);

  // Burst arrays
  burstStart = new Float32Array(N);
  burstSeedA = new Float32Array(N);
  burstSeedN = new Float32Array(N);
  for (let i = 0; i < N; i++) { burstStart[i] = -1; }

  // Prevent page scroll during touch
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

  resizeToFit();

  // Play sound button logic
  const playSoundBtn = document.getElementById('play-sound-btn');
  if (playSoundBtn) {
    playSoundBtn.addEventListener('click', () => {
      if (bgMusic.isPlaying()) {
        bgMusic.stop();
        playSoundBtn.classList.remove('active');
      } else {
        bgMusic.loop();
        playSoundBtn.classList.add('active');
      }
    });
  }

  // Download button logic (hi-res export)
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // Hide input box for screenshot
      const inputContainer = document.getElementById('name-input-container');
      if (inputContainer) inputContainer.style.display = 'none';

      // Create an offscreen canvas for high quality
      const dpr = window.devicePixelRatio || 1;
      const exportW = DESIGN_W * dpr;
      const exportH = DESIGN_H * dpr;
      let exportCanvas = createGraphics(exportW, exportH);
      exportCanvas.pixelDensity(dpr);

      // Draw everything (static export—no burst/glow for speed)
      exportCanvas.push();
      // Background image as cover
      drawImageCover(exportCanvas, bgImg, 0, 0, exportW, exportH);

      // Video backdrop
      const fitBG = fitRect(getVideoW(video), getVideoH(video), cols, rows);
      const vwBG = fitBG.w * VIDEO_SCALE;
      const vhBG = fitBG.h * VIDEO_SCALE;
      const vxBG = (cols - vwBG) / 2 + VIDEO_OFFSET_X;
      const vyBG = (rows - vhBG) / 2 + VIDEO_OFFSET_Y;
      const scaleToExportX = exportW / cols;
      const scaleToExportY = exportH / rows;
      const dx = vxBG * scaleToExportX;
      const dy = vyBG * scaleToExportY;
      const dw = vwBG * scaleToExportX;
      const dh = vhBG * scaleToExportY;

      exportCanvas.push();
      exportCanvas.blendMode(SCREEN);
      if (VIDEO_BG_TINT && VIDEO_BG_TINT.length === 3) {
        exportCanvas.tint(VIDEO_BG_TINT[0], VIDEO_BG_TINT[1], VIDEO_BG_TINT[2], VIDEO_BG_ALPHA * 255);
      } else {
        exportCanvas.tint(255, VIDEO_BG_ALPHA * 255);
      }
      exportCanvas.image(video, dx, dy, dw, dh);
      exportCanvas.pop();

      // Letters (sharp only)
      const vwL = vwBG * LETTER_SCALE_UNIFORM;
      const vhL = vhBG * LETTER_SCALE_UNIFORM;
      const vxL = vxBG + (vwBG - vwL) / 2;
      const vyL = vyBG + (vhBG - vhL) / 2;

      // Sample video into a temp low-res buffer at export size
      const tmp = createGraphics(cols, rows);
      tmp.pixelDensity(1);
      tmp.image(video, vxL, vyL, vwL, vhL);
      tmp.loadPixels();

      exportCanvas.textAlign(CENTER, CENTER);
      const colorMap = {
        'G': color('#F0F0F0'),
        'H': color('#F1F1F1'),
        'U': color('#666666'),
        'L': color('#FFFFFF'),
        'A': color('#6F7C80'),
        'M': color('#666666')
      };

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = x + y * cols;
          const p = idx * 4;
          let r = tmp.pixels[p + 0] || 0;
          let g = tmp.pixels[p + 1] || 0;
          let b = tmp.pixels[p + 2] || 0;
          let br = (r + g + b) / 3;
          br = constrain(br * GAIN, 0, 255);
          if (br < ON_T) continue; // simple threshold in export

          const char = letters[(idx + phase) % letters.length];
          const col = colorMap[char] || color('#F1F1F1');
          exportCanvas.fill(col);
          exportCanvas.textSize(pixelSize * dpr);
          exportCanvas.textStyle(BOLD);
          const drawX = (x * pixelSize + pixelSize / 2) * dpr;
          const drawY = (y * pixelSize + pixelSize / 2) * dpr;
          exportCanvas.text(char, drawX, drawY);
        }
      }

      exportCanvas.pop();

      // Save PNG
      saveCanvas(exportCanvas, 'darzi', 'png');

      // Restore input box
      if (inputContainer) setTimeout(() => { inputContainer.style.display = ''; }, 300);
    });
  }
}

function windowResized() { resizeToFit(); }

function resizeToFit() {
  const ww = windowWidth;
  const wh = windowHeight;

  const isMobile = ww <= 600 || wh <= 900 ||
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Edge-to-edge width, allow vertical crop (no stretch)
    scaleS = 1;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      cw = ww; ch = wh;
    } else {
      cw = Math.min(ww, window.innerWidth);
      ch = Math.min(wh, window.innerHeight);
    }
  } else {
    scaleS = Math.min(ww / DESIGN_W, wh / DESIGN_H);
    cw = Math.round(DESIGN_W * scaleS);
    ch = Math.round(DESIGN_H * scaleS);
  }
  resizeCanvas(cw, ch);
  readSafeArea();
}

function readSafeArea() {
  const probe = document.getElementById('safeprobe');
  if (!probe) { safe = { top:0,right:0,bottom:0,left:0 }; return; }
  const cs = getComputedStyle(probe);
  const pxTop    = parseFloat(cs.paddingTop)    || 0;
  const pxRight  = parseFloat(cs.paddingRight)  || 0;
  const pxBottom = parseFloat(cs.paddingBottom) || 0;
  const pxLeft   = parseFloat(cs.paddingLeft)   || 0;
  safe.top    = pxTop    / scaleS;
  safe.right  = pxRight  / scaleS;
  safe.bottom = pxBottom / scaleS;
  safe.left   = pxLeft   / scaleS;
}

let paused = false;
document.addEventListener('visibilitychange', function() {
  paused = document.visibilityState !== 'visible';
});

function draw() {
  if (paused) return;
  ui.push();

  // 1) Background image (cover)
  drawImageCover(ui, bgImg, 0, 0, DESIGN_W, DESIGN_H);

  // 2) Backdrop video rect (in grid space), from VIDEO_* (unchanged)
  const fitBG = fitRect(getVideoW(video), getVideoH(video), cols, rows);
  const vwBG = fitBG.w * VIDEO_SCALE;
  const vhBG = fitBG.h * VIDEO_SCALE;
  const vxBG = (cols - vwBG) / 2 + VIDEO_OFFSET_X;
  const vyBG = (rows - vhBG) / 2 + VIDEO_OFFSET_Y;

  // Map that rect into DESIGN px for drawing on 'ui'
  const scaleToDesignX = DESIGN_W / cols;
  const scaleToDesignY = DESIGN_H / rows;
  const dx = vxBG * scaleToDesignX;
  const dy = vyBG * scaleToDesignY;
  const dw = vwBG * scaleToDesignX;
  const dh = vhBG * scaleToDesignY;

  // Update global videoRect (used for click hit-test in DESIGN coords)
  videoRect.x = dx; videoRect.y = dy; videoRect.w = dw; videoRect.h = dh;

  // 2a) Draw subtle backdrop
  ui.push();
  ui.blendMode(SCREEN);
  if (VIDEO_BG_TINT && VIDEO_BG_TINT.length === 3) {
    ui.tint(VIDEO_BG_TINT[0], VIDEO_BG_TINT[1], VIDEO_BG_TINT[2], VIDEO_BG_ALPHA * 255);
  } else {
    ui.tint(255, VIDEO_BG_ALPHA * 255);
  }
  ui.image(video, dx, dy, dw, dh);
  ui.pop();

  // --- Tap hint (NEW) ---
  if (showHint && millis() - hintStartMs > HINT_AUTODISMISS_MS) {
    showHint = false;
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
  }
  if (showHint) {
    // match the clickable area (with padding)
    drawTapHint(ui, getClickRect(videoRect));
  }

  // 3) Prepare glow layer
  glowLayer.clear();

  // 4) Letters sampling — EXACT center as backdrop, uniform scale (no stretch)
  vidLayer.push();
  vidLayer.clear();
  const vwL = vwBG * LETTER_SCALE_UNIFORM;
  const vhL = vhBG * LETTER_SCALE_UNIFORM;
  const vxL = vxBG + (vwBG - vwL) / 2;
  const vyL = vyBG + (vhBG - vhL) / 2;
  vidLayer.image(video, vxL, vyL, vwL, vhL);
  vidLayer.loadPixels();
  vidLayer.pop();

  if (!vidLayer.pixels || vidLayer.pixels.length === 0) {
    ui.pop();
    image(ui, 0, 0, width, height);
    return;
  }

  // slow drift
  if (DRIFT_FRAMES > 0 && frameCount % DRIFT_FRAMES === 0) {
    phase = (phase + 1) % letters.length;
  }

  // 5) Draw letters & bloom (ONLY letters move; glow stays anchored)
  ui.textAlign(CENTER, CENTER);
  const colorMap = {
    'G': color('#F0F0F0'),
    'H': color('#F1F1F1'),
    'U': color('#666666'),
    'L': color('#FFFFFF'),
    'A': color('#6F7C80'),
    'M': color('#666666')
  };

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = x + y * cols;
      const p = idx * 4;

      // sample video
      let r = vidLayer.pixels[p + 0];
      let g = vidLayer.pixels[p + 1];
      let b = vidLayer.pixels[p + 2];

      // brightness + gain + smoothing
      let br = (r + g + b) / 3;
      br = constrain(br * GAIN, 0, 255);
      ema[idx] = lerp(ema[idx], br, SMOOTH);
      const brightness = ema[idx];

      // hysteresis on/off
      if (onMask[idx]) {
        if (brightness < OFF_T) onMask[idx] = false;
      } else {
        if (brightness > ON_T) onMask[idx] = true;
      }
      if (!onMask[idx]) continue;

      // --- base position in DESIGN space (for GLOW; stays put) ---
      const baseX = x * pixelSize;
      const baseY = y * pixelSize;

      // --- moved position (for SHARP letters; follows burst) ---
      let movedX = baseX;
      let movedY = baseY;

      // Disperse/return animation (affects ONLY movedX/movedY)
      const start = burstStart[idx];
      if (start >= 0) {
        const now = millis();
        const t = (now - start) / BURST_DURATION; // 0..1
        if (t >= 1) {
          burstStart[idx] = -1; // finished
        } else if (t >= 0) {
          const ease = t * t * (3 - 2 * t);          // smoothstep 0..1
          const bell = 1.0 - Math.abs(2 * ease - 1); // 0->1->0
          const cx = baseX + pixelSize * 0.5;
          const cy = baseY + pixelSize * 0.5;
          const d  = dist(cx, cy, lastBurstX, lastBurstY);
          const fall = constrain(1.0 - (d / BURST_RADIUS), 0, 1);

          const n = noise(burstSeedN[idx], now * BURST_NOISE_SP);
          const theta = burstSeedA[idx] + map(n, 0, 1, -0.7, 0.7);
          const amp = BURST_AMP_MAX * bell * fall;

          movedX += Math.cos(theta) * amp;
          movedY += Math.sin(theta) * amp;
        }
      }

      // letter + color
      const char = letters[(idx + phase) % letters.length];
      const col = colorMap[char] || color('#F1F1F1');

      // --- GLOW stays at base (anchored) ---
      const w = smoothKnee(brightness, BLOOM_THRESH, BLOOM_KNEE); // 0..1
      if (w > 0.0) {
        const a = BLOOM_ALPHA * w;
        const scale = lerp(BLOOM_SCALE_MIN, BLOOM_SCALE_MAX, w);
        glowLayer.fill(red(col), green(col), blue(col), a);
        glowLayer.textSize(pixelSize * scale);
        glowLayer.textStyle(BOLD);
        glowLayer.text(char, baseX + pixelSize / 2, baseY + pixelSize / 2);
      }

      // --- SHARP letter uses moved position (only this moves) ---
      ui.fill(col);
      ui.textSize(pixelSize);
      ui.textStyle(BOLD);
      ui.text(char, movedX + pixelSize / 2, movedY + pixelSize / 2);
    }
  }

  // 6) Glow blur
  for (let i = 0; i < BLUR_PASSES; i++) {
    glowLayer.filter(BLUR, BLUR_RADIUS);
  }

  // 7) Composite bloom
  ui.push();
  if (USE_ADD_BLEND) ui.blendMode(ADD);
  ui.image(glowLayer, 0, 0);
  ui.pop();

  ui.pop();

  // --- Blit design -> visible canvas (edge-to-edge width on mobile; perfect aspect on desktop)
  const isMobile = width <= 600 || height <= 900;
  if (isMobile) {
    // fit-to-width; crop top/bottom a bit (no stretch)
    const scale = width / DESIGN_W;
    const MOBILE_HEIGHT_TWEAK = 1 / 1.15; // crop to avoid stretch
    const scaledH = DESIGN_H * scale * MOBILE_HEIGHT_TWEAK;
    const offsetY = (height - scaledH) / 2;
    background(0);
    image(ui, 0, offsetY, width, scaledH);
  } else {
    // Desktop: maintain perfect aspect ratio
    const scaleX = width / DESIGN_W;
    const scaleY = height / DESIGN_H;
    const scale = Math.min(scaleX, scaleY);
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;
    const offsetX = (width - scaledW) / 2;
    const offsetY = (height - scaledH) / 2;
    background(0);
    image(ui, offsetX, offsetY, scaledW, scaledH);
  }
}

// ========================= INPUT: HOVER / TOUCH =========================
// Desktop “hover”
function mouseMoved() {
  const p = toDesign(mouseX, mouseY);
  triggerBurstAt(p.x, p.y);
}

// Click / touch => also check for SFX trigger in video area
function mousePressed() {
  const p = toDesign(mouseX, mouseY);
  triggerBurstAt(p.x, p.y);
  tryPlayClickSfx(p.x, p.y);

  if (showHint) { showHint = false; try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {} }
}

// Mobile finger-hover: retrigger as finger moves; play on touch start
function touchStarted()  {
  const p = toDesign(mouseX, mouseY);
  triggerBurstAt(p.x, p.y);
  tryPlayClickSfx(p.x, p.y);

  if (showHint) { showHint = false; try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {} }
  // Optional haptics:
  // if (navigator.vibrate) navigator.vibrate(15);
}
function touchMoved()    {
  const p = toDesign(mouseX, mouseY);
  triggerBurstAt(p.x, p.y);
}

// ========================= BURST & SFX HELPERS =========================
function triggerBurstAt(designX, designY) {
  const now = millis();
  if (now - lastBurstAt < BURST_COOLDOWN) return;
  lastBurstAt = now;
  lastBurstX = designX;
  lastBurstY = designY;

  // Find grid coords around the point to keep this fast
  const gx = Math.round(designX / pixelSize);
  const gy = Math.round(designY / pixelSize);
  const rCells = Math.ceil(BURST_RADIUS / pixelSize);

  for (let yy = Math.max(0, gy - rCells); yy <= Math.min(rows - 1, gy + rCells); yy++) {
    for (let xx = Math.max(0, gx - rCells); xx <= Math.min(cols - 1, gx + rCells); xx++) {
      const idx = xx + yy * cols;
      // center of this cell in DESIGN space
      const cx = xx * pixelSize + pixelSize * 0.5;
      const cy = yy * pixelSize + pixelSize * 0.5;
      const d  = Math.hypot(cx - designX, cy - designY);
      if (d <= BURST_RADIUS) {
        // jittered starts for organic motion
        burstStart[idx] = now + random(-60, 60);
        burstSeedA[idx] = random(TWO_PI);
        burstSeedN[idx] = random(1000);
      }
    }
  }
}

function tryPlayClickSfx(designX, designY) {
  const now = millis();
  if ((now - lastSfxAt) < SFX_COOLDOWN) return;

  const r = getClickRect(videoRect);
  if (pointInRect(designX, designY, r)) {
    const loaded = sfxClips.filter(s => s && s.isLoaded && s.isLoaded());
    if (loaded.length === 0) return;
    lastSfxAt = now;
    // Track last played sound
    window._lastSfxIdx = window._lastSfxIdx || -1;
    let idxs = loaded.map((_, i) => i);
    // Remove last played index if possible
    if (window._lastSfxIdx >= 0 && loaded.length > 1) {
      idxs = idxs.filter(i => i !== window._lastSfxIdx);
    }
    const pickIdx = idxs[Math.floor(Math.random() * idxs.length)];
    window._lastSfxIdx = pickIdx;
    const s = loaded[pickIdx];
    // if (s.isPlaying()) s.stop(); // optional to avoid overlap
    s.play();
  }
}

function getClickRect(r) {
  // Inflate the video rectangle by CLICK_PAD_PX on each side
  return { x: r.x - CLICK_PAD_PX, y: r.y - CLICK_PAD_PX, w: r.w + CLICK_PAD_PX * 2, h: r.h + CLICK_PAD_PX * 2 };
}

function pointInRect(x, y, r) {
  return (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

// --- Tap hint drawing (NEW) ---
function drawTapHint(g, r) {
  const t = millis() * 0.003; // time
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 1.2;

  const base = Math.min(r.w, r.h) * 0.45;
  //const pulse = base * (1 + 0.05 * Math.sin(t * TWO_PI)); // +/-5%
  const alpha = 180 + 60 * Math.sin(t * TWO_PI);

  g.push();
  //g.noFill();
  // g.stroke(255, alpha);
  // g.strokeWeight(2);
  // g.ellipse(cx, cy, pulse * 2, pulse * 2);

  // g.stroke(255, 80);
  // g.ellipse(cx, cy, pulse * 2.25, pulse * 2.25);

  g.textAlign(CENTER, CENTER);
  //g.textStyle(ITALIC);
  g.textSize(16);
  g.fill(0, 140);
  //g.text('Tap the disco ball', cx + 1, cy + r.h * 0.36 + 1);
  g.fill(255,100);
  g.text('Tap the disco ball', cx,     cy + r.h * 0.36);
  g.pop();
}

// ========================= UTILS =========================

// Map 0..255 brightness → palette index (0 = lightest, last = darkest)
function colorFromBrightness(br) {
  const n = PALETTE.length;
  const idx = constrain(Math.floor(map(br, 0, 255, n - 1, 0)), 0, n - 1);
  return PALETTE[idx];
}

// soft knee (filmic style) remap: returns 0..1
function smoothKnee(v, t, k) {
  if (k <= 0) return v > t ? 1 : 0;
  const lo = t, hi = t + k;
  if (v <= lo) return 0;
  if (v >= hi) return 1;
  const x = (v - lo) / (hi - lo); // smoothstep
  return x * x * (3 - 2 * x);
}

// Size a source (sw×sh) to fit inside a dest (dw×dh) with aspect preserved;
// returns coords in dest space {x,y,w,h}
function fitRect(sw, sh, dw, dh) {
  if (!sw || !sh) return { x:0, y:0, w:dw, h:dh };
  const s = Math.min(dw / sw, dh / sh);
  const w = Math.round(sw * s);
  const h = Math.round(sh * s);
  const x = Math.floor((dw - w) / 2);
  const y = Math.floor((dh - h) / 2);
  return { x, y, w, h };
}

// Draw an image as CSS background-size: cover
function drawImageCover(g, img, x, y, w, h) {
  if (!img || !img.width || !img.height) {
    g.background(0); // fallback
    return;
  }
  const s = Math.max(w / img.width, h / img.height);
  const dw = Math.ceil(img.width * s);
  const dh = Math.ceil(img.height * s);
  const dx = x + Math.floor((w - dw) / 2);
  const dy = y + Math.floor((h - dh) / 2);
  g.image(img, dx, dy, dw, dh);
}

// Safely get intrinsic video dimensions
function getVideoW(vid) {
  return (vid && vid.elt && vid.elt.videoWidth) ? vid.elt.videoWidth : (vid?.width || 0);
}
function getVideoH(vid) {
  return (vid && vid.elt && vid.elt.videoHeight) ? vid.elt.videoHeight : (vid?.height || 0);
}

// Touch / mouse in DESIGN coordinates
function toDesign(x, y) {
  const isMobile = width <= 600 || height <= 900;
  if (isMobile) {
    const scaleX = width / DESIGN_W;
    const scaleY = height / DESIGN_H;
    const scale = Math.max(scaleX, scaleY);
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;
    const offsetX = (width - scaledW) / 2;
    const offsetY = (height - scaledH) / 2;
    const designX = (x - offsetX) / scale;
    const designY = (y - offsetY) / scale;
    return { x: constrain(designX, 0, DESIGN_W), y: constrain(designY, 0, DESIGN_H) };
  } else {
    return { x: constrain(x / scaleS, 0, DESIGN_W), y: constrain(y / scaleS, 0, DESIGN_H) };
  }
}
