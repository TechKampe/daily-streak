/* ============================================================
   El Último Centímetro — game.js
   Kampe Daily Streak · vanilla HTML5/CSS3/JS
   Mecánica: destrenzado controlado + check de norma
   Estados: INTRO → NORM_CHECK → STRIP → RESULTS (loop por planta)
   ============================================================ */

'use strict';

/* ---------- Haptics helper ---------- */
function vibrate(level, pattern) {
  try {
    if (window.ReactNativeWebView) {
      const msg = { action: 'VIBRATE', level };
      if (pattern) msg.pattern = pattern;
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      return;
    }
  } catch (e) { /* noop */ }
  // Web fallback
  if (navigator.vibrate) {
    if (pattern) navigator.vibrate(pattern);
    else {
      const ms = { light: 15, medium: 30, heavy: 50, success: 40, error: 60 }[level] || 20;
      navigator.vibrate(ms);
    }
  }
}

function taskCompleted() {
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    }
  } catch (e) { /* noop */ }
}

/* ---------- Config: 7 plantas (ver GDD §5.1) ---------- */
// kind: 'strip' (destrenzar) | 'report' (fuera de norma → NO)
// greenHalfMM: tolerancia en mm de la zona verde (modulador por distancia).
//   Centro objetivo = 7 mm de par abierto. Más distancia = menos tolerancia.
const FLOORS = [
  { n: 1, label: 'Roseta → equipo: 6 m',  segment: 'roseta-equipo', dist: 6,   norm: true,  kind: 'strip',  greenHalfMM: 5,   tutorial: true },
  { n: 2, label: 'Panel → roseta: 45 m',  segment: 'panel-roseta',  dist: 45,  norm: true,  kind: 'strip',  greenHalfMM: 3.5 },
  { n: 3, label: 'Panel → roseta: 88 m',  segment: 'panel-roseta',  dist: 88,  norm: true,  kind: 'strip',  greenHalfMM: 2.5 },
  { n: 4, label: 'Panel → roseta: 110 m', segment: 'panel-roseta',  dist: 110, norm: false, kind: 'report' },
  { n: 5, label: 'Roseta → equipo: 6 m',  segment: 'roseta-equipo', dist: 6,   norm: true,  kind: 'strip',  greenHalfMM: 5 },
  { n: 6, label: 'Panel → roseta: 90 m',  segment: 'panel-roseta',  dist: 90,  norm: true,  kind: 'strip',  greenHalfMM: 2.5 },
  { n: 7, label: 'Roseta → equipo: 8 m',  segment: 'roseta-equipo', dist: 8,   norm: false, kind: 'report' },
];

const RECORD_KEY = 'el_ultimo_centimetro_record';
const TASK_THRESHOLD = 470;
const MAX_SCORE = 720;

/* ---------- Game state ---------- */
const S = {
  floorIdx: 0,
  score: 0,
  state: 'INTRO',
  retried: false,       // si la planta actual ya tuvo un fallo de destrenzado
  fails: [],            // {floor, reason} para panel educativo en resultados
  acceptedBonusPending: 0, // +20 por SÍ correcto, se suma al rematar
};

/* ---------- DOM refs ---------- */
const $ = (id) => document.getElementById(id);
const screens = { intro: $('intro'), play: $('play'), results: $('results') };

/* ---------- Screen switching ---------- */
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
  document.documentElement.classList.toggle('results', name === 'results');
  document.documentElement.classList.toggle('gameplay', name !== 'results');
}

/* ---------- HUD ---------- */
function buildSegBar() {
  const bar = $('hud-progress');
  bar.innerHTML = '';
  FLOORS.forEach(() => {
    const seg = document.createElement('div');
    seg.className = 'seg';
    bar.appendChild(seg);
  });
}
function markSegDone(idx) {
  const segs = $('hud-progress').children;
  if (segs[idx]) { segs[idx].classList.add('done'); segs[idx].classList.add('pop'); }
}
function updateHud() {
  const f = FLOORS[S.floorIdx];
  $('hud-floor').textContent = `Planta ${f.n}/${FLOORS.length}`;
  $('hud-score').textContent = `${S.score} pts`;
}
function addScore(pts, x, y) {
  S.score += pts;
  $('hud-score').textContent = `${S.score} pts`;
  if (x != null) floatPts(pts, x, y);
}
function floatPts(pts, x, y) {
  const el = document.createElement('div');
  el.className = 'float-pts';
  el.textContent = `+${pts}`;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 520);
}

/* ---------- Asset URLs (Cloudinary) ---------- */
const MARINA_SRC = {
  happy:       'https://res.cloudinary.com/kampe/image/upload/v1780568563/Marina_happy_ptratz.png',
  celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1780568562/Maina_celebrating_souxjb.png',
  worried:     'https://res.cloudinary.com/kampe/image/upload/v1780568563/Marina_worried_cgvj4r.png',
};

/* ---------- Marina avatar + bubble ---------- */
function setMarina(state) {
  $('marina').src = MARINA_SRC[state] || MARINA_SRC.happy;
}
function marinaSay(text, ms) {
  const b = $('marina-bubble');
  b.textContent = text;
  b.classList.remove('hidden');
  if (ms) setTimeout(() => b.classList.add('hidden'), ms);
}

/* ---------- Color flush ---------- */
function flushRed() {
  const f = $('color-flush');
  f.classList.remove('flush'); void f.offsetWidth; f.classList.add('flush');
}

/* ============================================================
   FLOW
   ============================================================ */
function startGame() {
  S.floorIdx = 0; S.score = 0; S.fails = []; S.retried = false; S.acceptedBonusPending = 0;
  buildSegBar();
  showScreen('play');
  beginFloor();
}

function beginFloor() {
  const f = FLOORS[S.floorIdx];
  S.retried = false;
  S.acceptedBonusPending = 0;
  S.state = 'NORM_CHECK';
  updateHud();
  resetSignal();
  showNormCheck(f);
}

/* ---------- NORM CHECK ---------- */
function showNormCheck(f) {
  $('norm-floor-title').textContent = `PLANTA ${f.n}`;
  drawRouteSchema(f);
  $('btn-si').classList.toggle('highlight', !!f.tutorial && f.norm);
  $('btn-no').classList.remove('highlight');
  setMarina('happy');
  if (f.tutorial) marinaSay('Primero compruebo la tirada. 6 metros hasta el equipo — por debajo del máximo. Esta cumple. Dale a SÍ.', 0);
  else $('marina-bubble').classList.add('hidden');
  $('norm-check').classList.remove('hidden');
}

function onNorm(decisionYes) {
  const f = FLOORS[S.floorIdx];
  const correct = (decisionYes && f.norm) || (!decisionYes && !f.norm);
  if (!correct) {
    vibrate('error');
    let reason;
    if (decisionYes && !f.norm) {
      reason = f.segment === 'panel-roseta'
        ? { que: 'Aceptaste una tirada que pasa de 90 m en cableado fijo.',
            porque: 'El estándar es el límite: por bien que remates la roseta, una tirada panel→roseta de más de 90 m no certifica.',
            regla: 'Panel → roseta: máximo 90 m (cableado fijo).',
            hacer: 'Esta tirada se reporta, no se destrenza.' }
        : { que: 'Aceptaste una tirada roseta→equipo de más de 6 m.',
            porque: 'El tramo roseta→equipo tiene tope en 6 m. Parece poco, pero también está fuera de norma.',
            regla: 'Roseta → equipo: máximo 6 m.',
            hacer: 'Esta tirada se reporta, no se destrenza.' };
    } else {
      reason = { que: 'Reportaste una tirada que sí cumple norma.',
                 porque: 'Está dentro de los máximos (≤90 m panel→roseta / ≤6 m roseta→equipo).',
                 regla: 'Si la tirada cumple, es certificable.',
                 hacer: 'Dale a SÍ y remata la roseta.' };
    }
    showEdu(reason, () => showNormCheck(f));
    return;
  }
  // correct
  vibrate('success');
  $('norm-check').classList.add('hidden');
  $('marina-bubble').classList.add('hidden');
  if (!f.norm) {
    // report correctly → +60, skip strip
    vibrate('success', [0, 60, 40, 120]);
    addScore(60, window.innerWidth / 2, window.innerHeight / 2);
    setMarina('celebrating');
    marinaSay('Bien visto. Esta tirada se reporta, no se certifica. La distancia también es parte de la instalación.', 1400);
    markSegDone(S.floorIdx);
    setTimeout(nextFloor, 1500);
  } else {
    S.acceptedBonusPending = 20;
    startStrip(f);
  }
}

/* ---------- STRIP (destrenzado) ---------- */
let strip = null; // active strip session

function startStrip(f) {
  S.state = 'STRIP';
  $('tirada-recordatorio').textContent = f.label;
  setMarina('happy');
  drawIDC();
  if (f.tutorial) {
    marinaSay('Apoya el dedo en el cable y arrástralo hacia el IDC. Mantén el trenzado hasta justo antes del borne.', 0);
  } else {
    $('marina-bubble').classList.add('hidden');
  }
  setupStripGeometry(f);
  drawCable(mmToSplitX(MAX_OPEN_MM));  // arranca con el par abierto del todo
  resetPunch();
}

/* ===========================================================
   MODELO HORIZONTAL — unidad única: MILÍMETROS de par abierto.
   El cable entra trenzado por la IZQUIERDA; el IDC está a la DERECHA.
   El jugador arrastra el punto de destrenzado: cuanto más cerca del
   IDC lo deja, MENOS par queda abierto (mejor).
     openMM = milímetros de par destrenzado (lo que la etiqueta muestra).
       0 mm  → split pegado al IDC (pasado: conductores no asientan)
       objetivo: ≤ ~10 mm, trenzado hasta el borne  ✅
       > ~20 mm → par abierto (mal) ✗
   La zona verde y el texto usan el MISMO openMM → no hay desalineación.
   =========================================================== */
const VB_W = 360, VB_H = 200;
const CABLE_Y = 100;          // eje del cable
const IDC_X = 250;            // x donde empiezan los contactos del IDC
const ENTRY_X = 14;           // x donde entra el cable por la izquierda
// Escala: el tramo entre el IDC y la entrada del cable representa 0..MAX_MM
const MAX_OPEN_MM = 30;                       // par totalmente abierto
const PX_PER_MM = (IDC_X - ENTRY_X) / MAX_OPEN_MM; // px viewBox por mm

// Centro de la zona verde, en mm de par abierto (objetivo de calidad)
const GREEN_CENTER_MM = 7;    // ~7 mm = "trenzado hasta el borne, <1cm"
// pasarse: si deja < MIN_OPEN_MM, los conductores no abren para asentar
const MIN_OPEN_MM = 2;

// split (x viewBox) ↔ openMM
function mmToSplitX(mm) { return IDC_X - mm * PX_PER_MM; }
function splitXtoMM(x)  { return (IDC_X - x) / PX_PER_MM; }

function setupStripGeometry(f) {
  const halfMM = f.greenHalfMM;   // tolerancia en mm por planta
  strip = {
    floor: f,
    startX: null,
    openMM: MAX_OPEN_MM,          // arranca abierto del todo
    enteredGreen: false,
    lastHapticMM: MAX_OPEN_MM,
    dragging: false,
    greenLoMM: GREEN_CENTER_MM - halfMM,   // borde "más abierto" aún válido
    greenHiMM: GREEN_CENTER_MM + halfMM,   // borde "más cerrado" aún válido
    minMM: MIN_OPEN_MM,
  };
  positionAnchor(mmToSplitX(MAX_OPEN_MM));
  // guía verde SOLO en la ronda tutorial (planta 1). El resto, a ojo.
  const guide = $('green-guide');
  if (f.tutorial) {
    const xHi = mmToSplitX(strip.greenHiMM); // más cerca del IDC
    const xLo = mmToSplitX(strip.greenLoMM); // más lejos
    guide.classList.remove('hidden');
    guide.setAttribute('x', xHi);
    guide.setAttribute('y', CABLE_Y - 40);
    guide.setAttribute('width', Math.max(6, xLo - xHi));
    guide.setAttribute('height', 80);
    guide.setAttribute('rx', 6);
  } else {
    guide.classList.add('hidden');
  }
}

// Convierte una x del viewBox a px de pantalla (para el anchor/label en DOM)
function vbToScreenX(vx) {
  const r = $('strip-svg').getBoundingClientRect();
  return r.left + (vx / VB_W) * r.width;
}
function vbToScreenY(vy) {
  const r = $('strip-svg').getBoundingClientRect();
  return r.top + (vy / VB_H) * r.height;
}
function positionAnchor(splitVx) {
  const a = $('finger-anchor');
  const r = $('strip-area').getBoundingClientRect();
  a.style.left = ((splitVx / VB_W) * r.width) + 'px';
  a.style.top = ((CABLE_Y / VB_H) * r.height) + 'px';
}

/* ---------- Dibujo del bloque IDC (roseta de perfil) ---------- */
function drawIDC() {
  const g = $('idc-layer');
  const colors = ['#E67E22','#FFFFFF','#27AE60','#2E86C1','#FFFFFF','#2E86C1','#27AE60','#E67E22'];
  let slots = '';
  const n = 8, top = CABLE_Y - 56, gap = 14;
  for (let i = 0; i < n; i++) {
    const y = top + i * gap;
    // ranura IDC
    slots += `<rect x="${IDC_X}" y="${y-3}" width="48" height="6" rx="2" fill="#c7ced6" stroke="#8a93a0" stroke-width="1"/>`;
    slots += `<rect x="${IDC_X+2}" y="${y-1.5}" width="6" height="3" fill="#5b6b86"/>`;
  }
  g.innerHTML = `
    <rect x="${IDC_X-6}" y="${top-14}" width="78" height="${n*gap+16}" rx="8" fill="#eef2f7" stroke="#b9c3d2" stroke-width="2"/>
    <text x="${IDC_X+34}" y="${top-20}" font-family="Baloo 2,sans-serif" font-size="13" font-weight="700" fill="#C5FFDF" text-anchor="middle">IDC</text>
    ${slots}`;
}

/* ---------- Dibujo del cable trenzado horizontal ---------- */
// splitX: a la izquierda del split el cable está trenzado; a la derecha,
// los 8 conductores se abren en abanico para entrar en los contactos del IDC.
function drawCable(splitX) {
  const g = $('cable-layer');
  splitX = Math.max(ENTRY_X, Math.min(IDC_X, splitX));
  // 1) tramo trenzado: dos hebras seno-desfasado desde ENTRY_X hasta splitX
  const amp = 7, period = 20, steps = 50;
  let p1 = '', p2 = '';
  for (let i = 0; i <= steps; i++) {
    const x = ENTRY_X + (splitX - ENTRY_X) * (i / steps);
    const phase = (x / period) * Math.PI * 2;
    const y1 = CABLE_Y + Math.sin(phase) * amp;
    const y2 = CABLE_Y - Math.sin(phase) * amp;
    p1 += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y1.toFixed(1) + ' ';
    p2 += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y2.toFixed(1) + ' ';
  }
  // 2) funda exterior del cable (gris) hasta el split
  const sheath = `<path d="M${ENTRY_X} ${CABLE_Y} L${splitX} ${CABLE_Y}" stroke="#7f8c9b" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  // 3) abanico de 8 conductores desde el split hasta los 8 contactos del IDC
  //    (tonos claros/saturados para destacar sobre el fondo navy)
  const colors = ['#FF8C42','#ECECEC','#3DDC84','#4FC3F7','#B388FF','#FFD166','#26C6DA','#FF6B6B'];
  const top = CABLE_Y - 56, gap = 14;
  let fan = '';
  for (let i = 0; i < 8; i++) {
    const ty = top + i * gap;
    fan += `<path d="M${splitX} ${CABLE_Y} C ${(splitX+IDC_X)/2} ${CABLE_Y}, ${(splitX+IDC_X)/2} ${ty}, ${IDC_X} ${ty}" stroke="${colors[i]}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
  // las dos hebras del trenzado: naranja + azul CLARO (destaca sobre el navy)
  g.innerHTML = sheath +
    `<path d="${p1}" stroke="#FF8C42" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="${p2}" stroke="#4FC3F7" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    fan;
}

function resetPunch() {
  const t = $('punch-tool');
  t.setAttribute('opacity', '0');
  t.innerHTML = '';
}

/* ---------- Touch handling for strip ---------- */
function getY(e) {
  if (e.touches && e.touches[0]) return e.touches[0].clientY;
  if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientY;
  return e.clientY;
}
function getX(e) {
  if (e.touches && e.touches[0]) return e.touches[0].clientX;
  if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
  return e.clientX;
}

function onStripStart(e) {
  if (S.state !== 'STRIP' || !strip) return;
  strip.startX = getX(e);
  strip.dragging = true;
  $('mm-label').style.display = 'block';
  // mover el split inmediatamente a donde toca el dedo
  onStripMove(e);
  e.preventDefault();
}

// Convierte la x de pantalla del dedo a x del viewBox (split)
function screenXtoVb(clientX) {
  const r = $('strip-svg').getBoundingClientRect();
  return ((clientX - r.left) / r.width) * VB_W;
}

function onStripMove(e) {
  if (!strip || !strip.dragging) return;
  // el dedo define openMM; limitado a [MIN_OPEN_MM .. MAX_OPEN_MM]
  let openMM = splitXtoMM(screenXtoVb(getX(e)));
  openMM = Math.max(strip.minMM, Math.min(MAX_OPEN_MM, openMM));
  strip.openMM = openMM;
  const splitVx = mmToSplitX(openMM);
  drawCable(splitVx);
  positionAnchor(splitVx);
  updateSignalFromMM(openMM);          // la señal varía en vivo (punto 5)
  // etiqueta: MISMA fuente que la clasificación
  const lbl = $('mm-label');
  lbl.textContent = openMM.toFixed(0) + ' mm abierto';
  lbl.style.display = 'block';
  const areaR = $('strip-area').getBoundingClientRect();
  lbl.style.left = (vbToScreenX(splitVx) - areaR.left) + 'px';
  lbl.style.top = ((CABLE_Y / VB_H) * areaR.height) + 'px';
  // haptic de avance cada ~2mm
  if (Math.abs(openMM - strip.lastHapticMM) >= 2) { vibrate('light'); strip.lastHapticMM = openMM; }
  // haptic de entrada en zona verde
  const inGreen = openMM <= strip.greenHiMM && openMM >= strip.greenLoMM;
  if (inGreen && !strip.enteredGreen) { strip.enteredGreen = true; vibrate('medium'); }
  if (!inGreen) strip.enteredGreen = false;
  e.preventDefault();
}

function onStripEnd(e) {
  if (!strip || !strip.dragging) return;
  strip.dragging = false;
  $('mm-label').style.display = 'none';
  const moved = Math.abs(getX(e) - strip.startX);
  if (moved < 6 && strip.openMM >= MAX_OPEN_MM - 0.5) {
    marinaSay('Arrastra el cable hacia el IDC para controlar el destrenzado.', 1800);
    return;
  }
  const mm = strip.openMM;
  if (mm <= strip.greenHiMM && mm >= strip.greenLoMM) {
    stripSuccess();
  } else if (mm > strip.greenHiMM) {
    stripOpenPair();        // dejó demasiado par abierto → mal
  } else {
    stripInsufficient();    // pasó del IDC (muy poco abierto) → no asienta
  }
}

function stripSuccess() {
  const f = strip.floor;
  vibrate('success');
  punchDownAnim(() => {
    fillSignal(100);
    const pts = (S.retried ? 40 : 100) + S.acceptedBonusPending;
    S.acceptedBonusPending = 0;
    addScore(pts, window.innerWidth / 2, window.innerHeight / 2);
    setMarina('celebrating');
    marinaSay(stripSuccessMsg(f), 1400);
    if (f.tutorial) {
      setTimeout(() => marinaSay('Eso es el último centímetro. La franja verde te marca dónde dejar el trenzado.', 1600), 1400);
    }
    markSegDone(S.floorIdx);
    setTimeout(nextFloor, f.tutorial ? 3200 : 1300);
  });
}
function stripSuccessMsg(f) {
  if (f.dist >= 90 && f.segment === 'panel-roseta') return 'Y en 90 metros, que es donde más se nota. Bien hilado.';
  const rot = ['Limpio. Trenzado hasta el IDC. Así no hay diafonía que valga.',
               'Perfecto. Esta roseta certifica sin pestañear.',
               'Eso es acabado profesional. El tester ni se inmuta.'];
  return rot[f.n % rot.length];
}

function stripOpenPair() {
  vibrate('error');
  flushRed();
  badSignal(25);
  setMarina('worried');
  S.fails.push({ floor: strip.floor.n, reason: 'par abierto' });
  showEdu({
    que: 'Dejaste el trenzado demasiado lejos del IDC: el par quedó abierto casi 3 cm.',
    porque: 'Con el par abierto se pierde el trenzado que protege la señal — aparece diafonía y la red degrada, sobre todo en tiradas largas.',
    regla: 'El trenzado debe mantenerse hasta el IDC: menos de 1 cm de par abierto.',
    hacer: 'Arrastra el cable más cerca del IDC antes de soltar.'
  }, () => { S.retried = true; startStrip(strip.floor); });
}

function stripInsufficient() {
  vibrate('error', [0, 40]);
  setMarina('worried');
  showEdu({
    que: 'Pasaste del IDC: los conductores no asientan en los contactos.',
    porque: 'Si el cable llega entero hasta el borne sin abrir los pares, el cobre no entra en las ranuras IDC y no hay conexión.',
    regla: 'Hay que abrir los pares justo antes del IDC para que cada conductor entre en su contacto.',
    hacer: 'Deja el trenzado un pelín antes del borne, no encima.'
  }, () => { S.retried = true; startStrip(strip.floor); });
}

/* ---------- Remate: partículas de éxito (en vez de la herramienta) ---------- */
function punchDownAnim(done) {
  // cable rematado limpio en el IDC
  drawCableClean();
  // burst de partículas saliendo del punto de remate (sobre la zona verde, visible)
  const r = $('strip-svg').getBoundingClientRect();
  const ox = r.left + (mmToSplitX(GREEN_CENTER_MM) / VB_W) * r.width;
  const oy = r.top + (CABLE_Y / VB_H) * r.height;
  successBurst(ox, oy);
  // un destello breve en el punto de remate
  flashAt(ox, oy);
  setTimeout(() => { if (done) done(); }, 520);
}

// cable rematado: trenzado hasta el IDC, conductores asentados
function drawCableClean() { drawCable(mmToSplitX(GREEN_CENTER_MM)); }

// Sistema de partículas reutilizable: chispas que estallan desde (x,y)
function successBurst(x, y) {
  const N = 20;
  const colors = ['#04FFB4', '#00E6BC', '#C5FFDF', '#FFFFAB', '#FFFFFF'];
  const frag = document.createDocumentFragment();
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const ang = (Math.PI * 2 * i) / N + (i % 2 ? 0.3 : 0);
    const dist = 60 + (i % 5) * 20;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
    p.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(0) + 'px');
    frag.appendChild(p);
    nodes.push(p);
  }
  document.body.appendChild(frag);
  // doble rAF para garantizar que se aplica el estado inicial antes de la transición
  requestAnimationFrame(() => requestAnimationFrame(() => {
    nodes.forEach(p => p.classList.add('go'));
  }));
  setTimeout(() => nodes.forEach(p => p.remove()), 800);
}

// Destello radial breve en (x,y)
function flashAt(x, y) {
  const f = document.createElement('div');
  f.className = 'success-flash';
  f.style.left = x + 'px';
  f.style.top = y + 'px';
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add('go')));
  setTimeout(() => f.remove(), 500);
}

/* ---------- Signal meter (Wi-Fi: verde/naranja/rojo, varía en vivo) ---------- */
// Mapea openMM → calidad 0..100. Centro verde = 100; muy abierto = bajo.
function signalQualityFromMM(openMM) {
  if (!strip) return 0;
  const center = GREEN_CENTER_MM;
  const d = Math.abs(openMM - center);
  // dentro de la zona verde → ~100; se degrada al alejarse
  const half = strip.greenHiMM - center;
  if (d <= half) return 100 - (d / half) * 8;        // 92..100 dentro de verde
  // fuera: cae más rápido según cuánto se aleja (hasta MAX_OPEN_MM)
  const q = 92 - ((d - half) / (MAX_OPEN_MM - center)) * 92;
  return Math.max(4, q);
}
function setSignal(pct) {
  pct = Math.max(0, Math.min(100, pct));
  const fill = $('signal-fill');
  fill.style.width = pct + '%';
  let tier;
  if (pct >= 75) tier = 'good';
  else if (pct >= 45) tier = 'mid';
  else tier = 'bad';
  fill.dataset.tier = tier;
  $('signal-meter').dataset.tier = tier;
}
function updateSignalFromMM(openMM) { setSignal(signalQualityFromMM(openMM)); }
function resetSignal() { setSignal(0); }
function fillSignal(pct) { setSignal(pct); }
function badSignal(pct) { setSignal(pct); }

/* ---------- Edu overlay ---------- */
let eduCallback = null;
function showEdu(r, cb) {
  $('edu-que').textContent = r.que;
  $('edu-porque').textContent = r.porque;
  $('edu-regla').textContent = r.regla;
  $('edu-hacer').textContent = r.hacer;
  // ocultar bloque "por qué" si no aplica
  $('edu-porque').parentElement.style.display = r.porque ? '' : 'none';
  eduCallback = cb;
  $('edu-overlay').classList.remove('hidden');
}
function dismissEdu() {
  $('edu-overlay').classList.add('hidden');
  const cb = eduCallback; eduCallback = null;
  if (cb) cb();
}

/* ---------- Route schema (SVG) for norm check ---------- */
function drawRouteSchema(f) {
  const svg = $('route-schema');
  const hi = '#00B894', dim = '#9bb0cc', red = '#E74C3C';
  const isPR = f.segment === 'panel-roseta';
  const isRE = f.segment === 'roseta-equipo';
  // color del tramo activo: verde si cumple, rojo si excede
  const activeColor = f.norm ? hi : red;
  const prColor = isPR ? activeColor : dim;
  const reColor = isRE ? activeColor : dim;
  const prLabel = isPR ? f.dist + 'm' : '≤90m';
  const reLabel = isRE ? f.dist + 'm' : '≤6m';
  svg.innerHTML = `
    <g font-family="Baloo 2, sans-serif" font-size="11" font-weight="700" fill="#0B214A" text-anchor="middle">
      <rect x="6"   y="40" width="46" height="30" rx="5" fill="#dde6f2"/>
      <text x="29" y="59">Switch</text>
      <rect x="92"  y="40" width="56" height="30" rx="5" fill="#dde6f2"/>
      <text x="120" y="59">Panel</text>
      <rect x="200" y="40" width="56" height="30" rx="5" fill="#dde6f2"/>
      <text x="228" y="59">Roseta</text>
      <rect x="300" y="40" width="54" height="30" rx="5" fill="#dde6f2"/>
      <text x="327" y="59">Equipo</text>
      <line x1="52"  y1="55" x2="92"  y2="55" stroke="${dim}" stroke-width="3"/>
      <text x="72" y="34" fill="${dim}">≤3m</text>
      <line x1="148" y1="55" x2="200" y2="55" stroke="${prColor}" stroke-width="${isPR ? 6 : 3}"/>
      <text x="174" y="32" fill="${prColor}">${prLabel}</text>
      ${isPR && !f.norm ? `<text x="174" y="88" fill="${red}" font-size="10">máx 90m · ¡${f.dist - 90}m de más!</text>` : ''}
      <line x1="256" y1="55" x2="300" y2="55" stroke="${reColor}" stroke-width="${isRE ? 6 : 3}"/>
      <text x="278" y="32" fill="${reColor}">${reLabel}</text>
      ${isRE && !f.norm ? `<text x="278" y="88" fill="${red}" font-size="10">máx 6m · ¡${f.dist - 6}m de más!</text>` : ''}
    </g>`;
}

/* ---------- Floor progression ---------- */
function nextFloor() {
  if (S.score >= TASK_THRESHOLD && !S._taskFired) { S._taskFired = true; taskCompleted(); vibrate('success', [0,100,30,100,30,300]); }
  S.floorIdx++;
  if (S.floorIdx >= FLOORS.length) { showResults(); return; }
  // slide-up transición simple
  beginFloor();
}

/* ---------- Results ---------- */
function showResults() {
  if (S.score >= TASK_THRESHOLD && !S._taskFired) { S._taskFired = true; taskCompleted(); }
  let tier, title, state, bubble;
  if (S.score >= 576) { tier='alto'; title='Edificio certificado'; state='celebrating';
    bubble='Edificio certificado. Cada roseta trenzada hasta el IDC, cada tirada dentro de norma. Esto es una red que no falla en la terminación.'; }
  else if (S.score >= 432) { tier='medio'; title='Certificación con incidencias'; state='happy';
    bubble='Certificación con incidencias. La mayoría pasa, pero repasa el último centímetro: el trenzado tiene que llegar al borne siempre.'; }
  else { tier='bajo'; title='No pasa la certificación'; state='worried';
    bubble='Así no pasa la certificación. El fallo está en la terminación, no en el switch. Practica el destrenzado: para antes de abrir el par.'; }

  $('results-title').textContent = title;
  $('marina-results').src = MARINA_SRC[state] || MARINA_SRC.happy;
  $('results-bubble').textContent = bubble;

  // record
  let rec = parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
  if (S.score > rec) {
    localStorage.setItem(RECORD_KEY, String(S.score));
    $('results-record').textContent = `Nuevo récord: ${S.score} pts`;
    $('results-record').classList.remove('hidden');
  } else {
    $('results-record').textContent = `Récord: ${rec} pts`;
    $('results-record').classList.remove('hidden');
  }

  // edu panel por fallos
  const eduWrap = $('results-edu');
  eduWrap.innerHTML = '';
  if (S.fails.length) {
    const seen = new Set();
    S.fails.forEach((fl) => {
      const key = fl.reason;
      if (seen.has(key)) return; seen.add(key);
      const item = document.createElement('div');
      item.className = 'results-edu-item';
      item.innerHTML = `<strong>Planta ${fl.floor} · ${fl.reason}</strong><br>El trenzado debe llegar al IDC: menos de 1 cm de par abierto.`;
      eduWrap.appendChild(item);
    });
  }

  // count up
  showScreen('results');
  animateCount($('results-score'), 0, S.score, 800);
}

function animateCount(el, from, to, dur) {
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const val = Math.round(from + (to - from) * p);
    el.textContent = `${val} pts`;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   EVENT WIRING
   ============================================================ */
$('btn-start').addEventListener('click', startGame);
$('btn-retry').addEventListener('click', () => { S._taskFired = false; startGame(); });
$('btn-si').addEventListener('click', () => onNorm(true));
$('btn-no').addEventListener('click', () => onNorm(false));
$('btn-entendido').addEventListener('click', dismissEdu);

// strip drag (touch + mouse)
const stripArea = $('strip-area');
stripArea.addEventListener('touchstart', onStripStart, { passive: false });
stripArea.addEventListener('touchmove', onStripMove, { passive: false });
stripArea.addEventListener('touchend', onStripEnd);
stripArea.addEventListener('mousedown', onStripStart);
window.addEventListener('mousemove', (e) => { if (strip && strip.dragging) onStripMove(e); });
window.addEventListener('mouseup', (e) => { if (strip && strip.dragging) onStripEnd(e); });

// init
showScreen('intro');

// expose state for debugging / automated testing
window.S = S;
window.FLOORS = FLOORS;
Object.defineProperty(window, 'strip', { get: () => strip });

