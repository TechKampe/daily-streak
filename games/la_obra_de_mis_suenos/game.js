/* ================================================================
   LA OBRA DE MIS SUEÑOS — Kampe Games — game.js
   S3D2-AM: Rutas, radios, fijación y accesorios para montaje
   ================================================================ */

'use strict';

// ─── CONSTANTES ────────────────────────────────────────────────

const RECORD_KEY        = 'la_obra_de_mis_suenos_record';
const SNAP_MS           = 3000;   // ms para auto-snap
const ZONE_OUTER_PX     = 40;     // px perpendicular para zona exterior
const ZONE_INNER_PX     = 15;     // px perpendicular para zona interior
const ZONE_MARGIN_PX    = 24;     // margen extra en los extremos del segmento
const SMOOTH_FRAMES     = 5;      // frames suavizado acelerómetro
const SENSITIVITY       = 8;      // px por grado
const RING_CIRCUM       = 2 * Math.PI * 34; // r=34 → ≈213.6
const CLIP_SPACING_PX   = 60;     // distancia entre abrazaderas
const CORNER_RADIUS_PX  = 28;     // radio de esquina auto-generada

// ─── NIVELES ───────────────────────────────────────────────────
// Cada segmento: { type: 'H'|'V' }
// La longitud real se calcula en drawGhostRoute() según el viewport.

const LEVELS = [
  {
    id: 1,
    name: 'El Pasillo de Entrada',
    bg: 'assets/bg_nivel1.jpg',
    segments: ['H','H','H','H'],
    briefing: 'La canalización va de A a B. Horizontal. Recta. Sin serpientes. Parece fácil. No lo es.',
  },
  {
    id: 2,
    name: 'El Cuarto Técnico',
    bg: 'assets/bg_nivel2.jpg',
    segments: ['V','V','V'],
    briefing: 'Bajada vertical. De arriba abajo. Misma regla: recta visual, fijaciones constantes. El cuadro eléctrico está mirando.',
  },
  {
    id: 3,
    name: 'El Rincón del Salón',
    bg: 'assets/bg_nivel3.jpg',
    segments: ['H','H','V','V'],
    briefing: 'Aquí hay una esquina. Horizontal primero, luego bajamos. El radio lo pone el sistema — tú pon la recta.',
  },
  {
    id: 4,
    name: 'La Vuelta del Pasillo',
    bg: 'assets/bg_nivel4.jpg',
    segments: ['V','V','H','H','H'],
    briefing: 'Bajamos primero, luego giramos. Si la esquina sale fea, Andrés lo va a notar. Y los espectadores también.',
  },
  {
    id: 5,
    name: 'La Cocina',
    bg: 'assets/bg_nivel5.jpg',
    segments: ['H','H','V','V','H','H'],
    briefing: 'Cocina. Dos esquinas. Si ves que el radio sale solo y queda suave… eso es exactamente lo que debe pasar.',
  },
  {
    id: 6,
    name: 'La Habitación de Sus Sueños',
    bg: 'assets/bg_nivel6.jpg',
    segments: ['H','H','H','H','V','V','V'],
    briefing: 'La habitación principal. La más larga. La más importante. Esto es lo que va en portada del episodio.',
  },
];

// ─── CONTENT ───────────────────────────────────────────────────

const INTRO_TEXT = '¡Bienvenidos a LA OBRA DE MIS SUEÑOS! Esta semana… esta semana es DIFERENTE. Las cámaras lo grabarán TODO. No hay second takes. No hay apaños. Johnny, diles lo que necesitamos.';

const REVEAL_DIALOGS = [
  '¡¿Podéis verlo?! ¡RECTA VISUAL! ¡Abrazaderas a distancia CONSTANTE! ¡Y ese radio… ese radio me hace querer llorar de alegría!',
  '¡ESTO es lo que llamamos instalación PROFESIONAL! ¿Hay serpientes? NO. ¿Hay quiebros? ¡TAMPOCO! ¡IMPRESIONANTE!',
  '¡Primera esquina de la noche y queda PERFECTA! El radio suave, señoras y señores. ESO separa un instalador de un chapucero.',
  '¡Recta, vuelta, recta. Sin UN milímetro de desviación! Johnny, ¿estás viendo esto? ¡¿ESTÁS VIENDO ESTO?!',
  '¡DOS ESQUINAS en la misma habitación y los DOS radios perfectos! Esto no se ve todos los días en La Obra de Mis Sueños.',
  '¡¡LA HABITACIÓN DE SUS SUEÑOS!! ¡¡CON LA INSTALACIÓN DE SUS SUEÑOS!! Recta. Fijación homogénea. Radios suaves. ¡¡ESTO VA DIRECTO AL PRIME TIME!!',
];

const JOHNNY_SNAPS = [
  'Fijado.',
  'Eso es trabajo de profesional.',
  'Bien. Siguiente.',
  'Exactamente ahí.',
];

const NEWS_TICKER = [
  'MÁS DE 200 EMPRESAS CONTRATANDO ALUMNOS DE KÄMPE AHORA MISMO',
  'ELECTRICISTAS FORMADOS EN KÄMPE: EMPLEABILIDAD DEL 94% EN LOS PRIMEROS 3 MESES',
  'ENCARGADOS DE OBRA BUSCAN INSTALADORES QUE SEPAN LO QUE ES UN RADIO SUAVE',
  'FUENTES DEL SECTOR: "LA FIJACIÓN HOMOGÉNEA YA NO ES OPCIONAL — ES EL MÍNIMO"',
].join('   ·   ');

const LOWER_THIRDS = [
  { name: 'JOHNNY',   role: 'Lleva 20 años sin ver un quiebro en radio' },
  { name: 'ANDRÉS',   role: 'Nervioso desde el camerino' },
  { name: 'SISTEMA',  role: 'Radio suave generado automáticamente. Como debe ser.' },
  { name: 'JOHNNY',   role: 'No ha dicho nada. Pero lo ha visto.' },
];

// ─── DOM ───────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const EL = {
  W:            $('W'),
  intro:        $('intro'),
  play:         $('play'),
  credits:      $('credits'),
  tvStatic:     $('tv-static'),
  introLogo:    $('intro-logo'),
  introEpisode: $('intro-episode'),
  introBubble:  $('intro-bubble'),
  introBtn:     $('intro-btn'),
  ltIntro:      $('lt-intro'),
  ltIntroName:  $('lt-intro-name'),
  ltIntroRole:  $('lt-intro-role'),
  hudLevel:     $('hud-level'),
  levelBg:      $('level-bg'),
  routeSvg:     $('route-svg'),
  pieceWrap:    $('piece-wrap'),
  pieceBody:    $('piece-body'),
  ringFill:     $('ring-fill'),
  johnnyImg:    $('johnny-img'),
  johnnyBubble: $('johnny-bubble'),
  ltPlay:       $('lt-play'),
  ltPlayName:   $('lt-play-name'),
  ltPlayRole:   $('lt-play-role'),
  ooooh:        $('ooooh'),
  newsBanner:   $('news-banner'),
  newsTicker:   $('news-ticker'),
  curtainL:     $('curtain-left'),
  curtainR:     $('curtain-right'),
  revealOverlay:$('reveal-overlay'),
  revealAndres: $('reveal-andres'),
  revealBubble: $('reveal-bubble'),
  revealNextBtn:$('reveal-next-btn'),
  creditsText:  $('credits-text'),
  rewindBtn:    $('rewind-btn'),
};

// ─── STATE ─────────────────────────────────────────────────────

const S = {
  levelIdx:     0,      // índice en LEVELS
  pieceIdx:     0,      // pieza actual dentro del nivel
  // Acelerómetro
  calib:        null,   // { beta, gamma } — offset de calibración
  raw:          { beta: 0, gamma: 0 },
  buf:          [],     // buffer suavizado
  // Posición pieza
  px:           0,
  py:           0,
  // Snap
  snapZone:     null,   // null | 'outer' | 'inner'
  snapMs:       0,
  // Ruta calculada
  waypoints:    [],     // [{ x, y }] extremos de cada segmento
  segLengths:   [],     // longitud en px de cada segmento
  // Control de eventos únicos
  newsShown:    false,
  ltIdx:        0,
  rafId:        null,
  lastT:        0,
};

// ─── HELPERS ───────────────────────────────────────────────────

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = arr => arr[Math.floor(Math.random() * arr.length)];

function showScreen(id) {
  ['intro','play','credits'].forEach(s => {
    $(s).classList.toggle('off', s !== id);
  });
}

// ─── ACELERÓMETRO ──────────────────────────────────────────────

async function requestOrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm !== 'granted') return false;
    } catch { return false; }
  }
  return true;
}

function startOrientation() {
  window.addEventListener('deviceorientation', e => {
    S.buf.push({ beta: e.beta || 0, gamma: e.gamma || 0 });
    if (S.buf.length > SMOOTH_FRAMES) S.buf.shift();
    const n = S.buf.length;
    S.raw.beta  = S.buf.reduce((a, v) => a + v.beta,  0) / n;
    S.raw.gamma = S.buf.reduce((a, v) => a + v.gamma, 0) / n;
  });
}

function calibrate() {
  S.calib = { beta: S.raw.beta, gamma: S.raw.gamma };
  S.buf = [];
}

function getOrientationDelta() {
  if (!S.calib) return { dx: 0, dy: 0 };
  return {
    dx: (S.raw.gamma - S.calib.gamma) * SENSITIVITY,
    dy: (S.raw.beta  - S.calib.beta)  * SENSITIVITY,
  };
}

// ─── INTRO SEQUENCE ────────────────────────────────────────────

function runIntro() {
  tvStatic(380, () => {
    EL.introLogo.classList.add('show');
    setTimeout(() => {
      EL.introEpisode.classList.add('show');
      setTimeout(() => lowerThirdIntro('ANDRÉS', 'Presentador', () => {
        setTimeout(() => lowerThirdIntro('JOHNNY', 'Técnico (y el gemelo con criterio)', () => {
          setTimeout(() => {
            EL.introBubble.textContent = INTRO_TEXT;
            EL.introBubble.classList.add('show');
          }, 500);
        }), 800);
      }), 800);
    }, 500);
  });
}

function tvStatic(ms, cb) {
  const cv = EL.tvStatic;
  cv.classList.remove('hidden');
  cv.width  = EL.W.offsetWidth;
  cv.height = EL.W.offsetHeight;
  const ctx = cv.getContext('2d');
  const end = Date.now() + ms;
  const draw = () => {
    const img = ctx.createImageData(cv.width, cv.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      img.data[i] = img.data[i+1] = img.data[i+2] = v;
      img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (Date.now() < end) requestAnimationFrame(draw);
    else { cv.classList.add('hidden'); cb?.(); }
  };
  draw();
}

function lowerThirdIntro(name, role, cb) {
  EL.ltIntroName.textContent = name;
  EL.ltIntroRole.textContent = role;
  EL.ltIntro.classList.remove('hidden');
  requestAnimationFrame(() => EL.ltIntro.classList.add('in'));
  setTimeout(() => {
    EL.ltIntro.classList.remove('in');
    setTimeout(() => { EL.ltIntro.classList.add('hidden'); cb?.(); }, 450);
  }, 2200);
}

// ─── ROUTE GEOMETRY ────────────────────────────────────────────
// Builds waypoints[] from level.segments given current viewport.
// Waypoints are { x, y } pixel positions of each segment endpoint.
// Route starts from a calculated origin so it fills the play area nicely.

function buildWaypoints(level) {
  const W = EL.W.offsetWidth;
  const H = EL.W.offsetHeight;
  const SEG_H = Math.round(W * 0.18);  // length of one horizontal segment
  const SEG_V = Math.round(H * 0.13);  // length of one vertical segment
  const segs = level.segments;

  // Calculate total extent to center the route
  let totalW = 0, totalH = 0, cx = 0, cy = 0;
  segs.forEach(t => { if (t === 'H') totalW += SEG_H; else totalH += SEG_V; });

  // Start point: try to center the route in the usable area
  const usableTop    = H * 0.15;
  const usableBottom = H * 0.75;
  const usableLeft   = W * 0.1;
  let x = usableLeft + (W * 0.8 - totalW) / 2;
  let y = usableTop  + (usableBottom - usableTop - totalH) / 2;
  x = clamp(x, usableLeft, W * 0.5);
  y = clamp(y, usableTop, usableBottom - totalH);

  const pts  = [{ x, y }];
  const lens = [];
  segs.forEach(t => {
    const len = t === 'H' ? SEG_H : SEG_V;
    lens.push(len);
    if (t === 'H') x += len;
    else           y += len;
    pts.push({ x, y });
  });

  S.waypoints  = pts;
  S.segLengths = lens;
}

// ─── GHOST ROUTE SVG ───────────────────────────────────────────

function drawGhostRoute(level) {
  EL.routeSvg.innerHTML = '';
  buildWaypoints(level);
  level.segments.forEach((_, i) => {
    const a = S.waypoints[i], b = S.waypoints[i + 1];
    const line = makeSVG('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      class: 'ghost-seg' + (i === S.pieceIdx ? ' target' : ''),
      id: `ghost-${i}`,
    });
    EL.routeSvg.appendChild(line);
  });
}

function updateTargetSegment() {
  EL.routeSvg.querySelectorAll('.ghost-seg').forEach(el => {
    const segIdx = parseInt(el.id.replace('ghost-', ''));
    el.classList.toggle('target', segIdx === S.pieceIdx);
  });
}

function makeSVG(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// ─── PIECE ─────────────────────────────────────────────────────

function spawnPiece() {
  const W = EL.W.offsetWidth;
  const H = EL.W.offsetHeight;
  // Spawn at screen center
  S.px = W / 2;
  S.py = H / 2;
  S.snapMs  = 0;
  S.snapZone = null;
  setRing(0);
  updatePieceDOM();
  // Rotate piece body to match segment orientation
  const seg = LEVELS[S.levelIdx].segments[S.pieceIdx];
  EL.pieceBody.className = seg === 'V' ? 'vert' : '';
  // Recalibrate orientation so center = current phone angle
  calibrate();
}

function updatePieceDOM() {
  EL.pieceWrap.style.left = (S.px - 40) + 'px';
  EL.pieceWrap.style.top  = (S.py - 40) + 'px';
}

function setRing(fraction) {
  EL.ringFill.style.strokeDashoffset = RING_CIRCUM * (1 - clamp(fraction, 0, 1));
}

// ─── SNAP ZONE DETECTION ───────────────────────────────────────
// Checks perpendicular distance from piece to the target segment LINE,
// and that the piece is within the segment's length range.
// This matches the lesson concept: align the cable tray along the route.

function detectZone() {
  const i = S.pieceIdx;
  if (i >= S.waypoints.length - 1) return null;
  const a   = S.waypoints[i];
  const b   = S.waypoints[i + 1];
  const seg = LEVELS[S.levelIdx].segments[i];

  let perpDist, inRange;
  if (seg === 'H') {
    perpDist = Math.abs(S.py - a.y);
    inRange  = S.px >= Math.min(a.x, b.x) - ZONE_MARGIN_PX &&
               S.px <= Math.max(a.x, b.x) + ZONE_MARGIN_PX;
  } else {
    perpDist = Math.abs(S.px - a.x);
    inRange  = S.py >= Math.min(a.y, b.y) - ZONE_MARGIN_PX &&
               S.py <= Math.max(a.y, b.y) + ZONE_MARGIN_PX;
  }

  if (!inRange) return null;
  if (perpDist <= ZONE_INNER_PX) return 'inner';
  if (perpDist <= ZONE_OUTER_PX) return 'outer';
  return null;
}

// ─── GAME LOOP ─────────────────────────────────────────────────

function gameLoop(ts) {
  const dt = Math.min(ts - S.lastT, 80);
  S.lastT = ts;

  // Move piece
  const { dx, dy } = getOrientationDelta();
  const W = EL.W.offsetWidth;
  const H = EL.W.offsetHeight;
  S.px = clamp(S.px + dx * (dt / 100), 30, W  - 30);
  S.py = clamp(S.py + dy * (dt / 100), 60, H - 100);
  updatePieceDOM();

  // Zone detection
  const zone = detectZone();
  if (zone !== S.snapZone) {
    S.snapZone = zone;
    if (!zone) S.snapMs = 0;
    updatePieceZoneVisuals(zone);
  }

  if (zone) {
    S.snapMs += dt;
    setRing(S.snapMs / SNAP_MS);
    if (S.snapMs >= SNAP_MS) { doSnap(); return; }
  } else if (S.snapMs > 0) {
    S.snapMs = Math.max(0, S.snapMs - dt * 2.5);
    setRing(S.snapMs / SNAP_MS);
  }

  S.rafId = requestAnimationFrame(gameLoop);
}

function updatePieceZoneVisuals(zone) {
  const seg = LEVELS[S.levelIdx].segments[S.pieceIdx];
  EL.pieceBody.className = seg === 'V' ? 'vert' : '';
  EL.ringFill.classList.remove('warn', 'ready');
  if (zone === 'outer') { EL.pieceBody.classList.add('outer'); EL.ringFill.classList.add('warn'); }
  if (zone === 'inner') { EL.pieceBody.classList.add('inner'); EL.ringFill.classList.add('ready'); }
}

// ─── SNAP ──────────────────────────────────────────────────────

function doSnap() {
  cancelAnimationFrame(S.rafId);

  const i    = S.pieceIdx;
  const segs = LEVELS[S.levelIdx].segments;
  const a    = S.waypoints[i];
  const b    = S.waypoints[i + 1];

  // 1. Snap flash
  EL.pieceBody.style.animation = 'snapFlash .35s';
  setTimeout(() => { EL.pieceBody.style.animation = ''; }, 350);

  // 2. OOOOH on inner snap
  if (S.snapZone === 'inner') showOoooh();

  // 3. Draw snapped segment
  const line = makeSVG('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'snapped-seg' });
  EL.routeSvg.appendChild(line);
  // Remove ghost segment
  $(`ghost-${i}`)?.remove();

  // 4. Auto-clips
  addClips(a, b, S.segLengths[i], segs[i]);

  // 5. Auto-corner (when direction changes)
  if (i > 0 && segs[i] !== segs[i - 1]) {
    addCorner(S.waypoints[i], segs[i - 1], segs[i]);
    showJohnnyBubble('¿Ves ese radio? Así se hace una curva. Sin forzar.', 2200);
  } else {
    showJohnnyBubble(rand(JOHNNY_SNAPS), 1500);
  }

  // 6. Lower third (occasional)
  if (Math.random() < 0.4) maybeShowLowerThird();

  // 7. Advance
  S.pieceIdx++;
  if (S.pieceIdx >= segs.length) {
    setTimeout(() => endLevel(), 900);
  } else {
    updateTargetSegment();
    spawnPiece();
    S.lastT = performance.now();
    S.rafId = requestAnimationFrame(gameLoop);
  }
}

// ─── AUTO-CLIPS ────────────────────────────────────────────────

function addClips(a, b, len, type) {
  const n       = Math.max(2, Math.floor(len / CLIP_SPACING_PX));
  const HALF_W  = 6; // half-width of clip perpendicular arm

  for (let k = 1; k <= n; k++) {
    const t  = k / (n + 1);
    const cx = a.x + (b.x - a.x) * t;
    const cy = a.y + (b.y - a.y) * t;
    // Clip line perpendicular to segment
    const clip = type === 'H'
      ? makeSVG('line', { x1: cx, y1: cy - HALF_W, x2: cx, y2: cy + HALF_W, class: 'clip-mark' })
      : makeSVG('line', { x1: cx - HALF_W, y1: cy, x2: cx + HALF_W, y2: cy, class: 'clip-mark' });
    clip.style.animationDelay = `${k * 0.12}s`;
    EL.routeSvg.appendChild(clip);
  }
}

// ─── AUTO-CORNER ───────────────────────────────────────────────

function addCorner(pivot, prevType, nextType) {
  const r = CORNER_RADIUS_PX;
  let x1, y1, x2, y2, sweepFlag;

  // Determine the arc endpoints relative to the pivot (shared waypoint)
  if (prevType === 'H' && nextType === 'V') {
    // Coming from left, turning down: arc from (pivot.x, pivot.y - r) to (pivot.x + r, pivot.y)
    // Adjust based on actual direction — simple version:
    x1 = pivot.x - r; y1 = pivot.y;
    x2 = pivot.x;     y2 = pivot.y + r;
    sweepFlag = 0;
  } else {
    // Coming from top, turning right
    x1 = pivot.x;     y1 = pivot.y - r;
    x2 = pivot.x + r; y2 = pivot.y;
    sweepFlag = 1;
  }

  const arc = makeSVG('path', {
    d: `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweepFlag} ${x2} ${y2}`,
    class: 'corner-arc',
  });
  // Set dasharray length to actual arc length (~πr/2)
  const arcLen = Math.round(Math.PI * r / 2);
  arc.style.strokeDasharray  = arcLen;
  arc.style.strokeDashoffset = arcLen;
  EL.routeSvg.appendChild(arc);
  // Trigger animation
  requestAnimationFrame(() => requestAnimationFrame(() => {
    arc.style.transition = 'stroke-dashoffset .4s ease-out';
    arc.style.strokeDashoffset = 0;
  }));
}

// ─── JOHNNY BUBBLE ─────────────────────────────────────────────

function showJohnnyBubble(text, ms) {
  EL.johnnyBubble.textContent = text;
  EL.johnnyBubble.classList.remove('hidden');
  if (ms) setTimeout(() => EL.johnnyBubble.classList.add('hidden'), ms);
}

// ─── LOWER THIRD ───────────────────────────────────────────────

function showLowerThirdPlay(name, role, ms = 3000) {
  EL.ltPlayName.textContent = name;
  EL.ltPlayRole.textContent = role;
  EL.ltPlay.classList.remove('hidden');
  requestAnimationFrame(() => EL.ltPlay.classList.add('in'));
  setTimeout(() => {
    EL.ltPlay.classList.remove('in');
    setTimeout(() => EL.ltPlay.classList.add('hidden'), 450);
  }, ms);
}

function maybeShowLowerThird() {
  const lt = LOWER_THIRDS[S.ltIdx % LOWER_THIRDS.length];
  S.ltIdx++;
  showLowerThirdPlay(lt.name, lt.role);
}

// ─── OOOOH ─────────────────────────────────────────────────────

function showOoooh() {
  EL.ooooh.classList.remove('hidden');
  // Force re-animation
  EL.ooooh.style.animation = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    EL.ooooh.style.animation = '';
    setTimeout(() => EL.ooooh.classList.add('hidden'), 950);
  }));
}

// ─── BREAKING NEWS ─────────────────────────────────────────────

function showBreakingNews() {
  if (S.newsShown) return;
  S.newsShown = true;
  EL.newsTicker.textContent = NEWS_TICKER;
  EL.newsBanner.classList.remove('hidden');
  setTimeout(() => EL.newsBanner.classList.add('hidden'), 9000);
}

// ─── CURTAINS ──────────────────────────────────────────────────

function closeCurtains(cb) {
  EL.W.classList.add('curtains-closed');
  setTimeout(cb, 550);
}
function openCurtains(cb) {
  EL.W.classList.remove('curtains-closed');
  EL.revealOverlay.classList.add('hidden');
  setTimeout(cb, 550);
}

// ─── REVEAL ────────────────────────────────────────────────────

function showReveal(idx, cb) {
  EL.revealBubble.textContent = REVEAL_DIALOGS[idx] ?? REVEAL_DIALOGS[0];
  EL.revealOverlay.classList.remove('hidden');
  EL.revealNextBtn.classList.remove('hidden');
  EL.revealNextBtn.onclick = () => {
    EL.revealNextBtn.classList.add('hidden');
    cb?.();
  };
}

// ─── LEVEL END ─────────────────────────────────────────────────

function endLevel() {
  closeCurtains(() => {
    showReveal(S.levelIdx, () => {
      if (S.levelIdx >= LEVELS.length - 1) {
        sendTaskCompleted();
        openCurtains(() => showCredits());
      } else {
        openCurtains(() => startLevel(S.levelIdx + 1));
      }
    });
  });
}

// ─── START LEVEL ───────────────────────────────────────────────

function startLevel(idx) {
  S.levelIdx   = idx;
  S.pieceIdx   = 0;
  S.snapMs     = 0;
  S.snapZone   = null;
  S.waypoints  = [];
  S.segLengths = [];

  const level = LEVELS[idx];
  EL.hudLevel.textContent = `Nivel ${idx + 1}/6`;
  EL.levelBg.src = level.bg;

  drawGhostRoute(level);
  spawnPiece();
  showLowerThirdPlay(`NIVEL ${idx + 1}/6`, level.name, 3000);
  showJohnnyBubble(level.briefing, 4000);

  // Breaking news: once, on level 1 or 2
  if (!S.newsShown && (idx === 1 || idx === 2)) {
    setTimeout(showBreakingNews, 5000);
  }

  S.lastT = performance.now();
  cancelAnimationFrame(S.rafId);
  S.rafId = requestAnimationFrame(gameLoop);
}

// ─── CREDITS ───────────────────────────────────────────────────

function showCredits() {
  showScreen('credits');
  const alreadyDone = localStorage.getItem(RECORD_KEY) === 'completado';
  localStorage.setItem(RECORD_KEY, 'completado');

  EL.creditsText.innerHTML = [
    `<span class="credits-title">LA OBRA DE MIS SUEÑOS</span>`,
    `<span class="credits-sub">Episodio: "Ruta Perfecta"</span>`,
    `Electricista principal ............ TÚ`,
    `Presentador ........................ Andrés`,
    `Técnico (el bueno) ................. Johnny`,
    `Dirección de canalización .......... Recta Visual Productions`,
    `Abrazaderas ........................ AbrazaCable™`,
    `Radios suaves ...................... Generados automáticamente`,
    `<span class="credits-result">— RESULTADO DEL EPISODIO —\nNiveles completados: 6/6</span>`,
    alreadyDone ? '' : `<span class="credits-record">¡PRIMERA VEZ COMPLETADO!</span>`,
    `<span class="credits-fine">Ningún quiebro fue dañado durante la grabación de este episodio.</span>`,
    `<span class="credits-copy">© Canal Kampe · Todos los derechos reservados</span>`,
  ].join('\n');

  // Show rewind button after credits finish (or on tap)
  const showRewind = () => EL.rewindBtn.classList.remove('hidden');
  setTimeout(showRewind, 14500);
  EL.creditsText.addEventListener('animationend', showRewind, { once: true });
  EL.credits.addEventListener('click', showRewind, { once: true });
}

// ─── TASK COMPLETED ────────────────────────────────────────────

function sendTaskCompleted() {
  try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); }
  catch { /* not in RN */ }
}

// ─── REWIND / RESTART ──────────────────────────────────────────

function restart() {
  S.newsShown = false;
  S.ltIdx     = 0;
  EL.rewindBtn.classList.add('hidden');
  EL.routeSvg.innerHTML = '';
  showScreen('play');
  startLevel(0);
}

// ─── INIT ──────────────────────────────────────────────────────

function init() {
  showScreen('intro');
  runIntro();

  EL.introBtn.addEventListener('click', async () => {
    await requestOrientation();
    startOrientation();
    showScreen('play');
    startLevel(0);
  });

  EL.rewindBtn.addEventListener('click', restart);
}

document.addEventListener('DOMContentLoaded', init);
