/* ============================================================
   SUPER DRENAJE — game.js
   S5D4-AM: Drenaje de condensados (split doméstico)
   ============================================================ */

'use strict';

// ─── CONSTANTES ────────────────────────────────────────────

const SANTI = {
  happy:       'assets/Santi_Happy.png',
  celebrating: 'assets/Santi_celebrating.png',
  worried:     'assets/Santi_worried.png',
};

const TASK_COMPLETED_THRESHOLD = 400;
const RECORD_KEY = 'super_drenaje_record';
const MAX_WRONG_TAPS = 2;
const HIT_RADIUS = 40; // px — tolerancia de acierto

// ─── PLACEHOLDERS SVG ───────────────────────────────────────
// Fondos SVG inline como data URIs — se reemplazarán con imágenes reales de Nano Banana
// IMPORTANTE: los paths de agua en INSTALLATIONS deben coincidir EXACTAMENTE con estas coordenadas

function makeSVG(svgContent) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 500" width="430" height="500">
      <rect width="430" height="500" fill="#1a2a3a"/>
      ${svgContent}
    </svg>`
  );
}

const W = `fill="none" stroke="#c8d8e8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;

// Abrazadera correcta — dos mordazas + tornillo
function clamp(cx, cy) {
  return `
    <rect x="${cx-8}" y="${cy-14}" width="16" height="8" rx="2" fill="#5a7a9a" stroke="#3a5a7a" stroke-width="1.5"/>
    <rect x="${cx-8}" y="${cy+6}" width="16" height="8" rx="2" fill="#5a7a9a" stroke="#3a5a7a" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy-6}" x2="${cx}" y2="${cy-14}" stroke="#8aaabb" stroke-width="2"/>
    <line x1="${cx}" y1="${cy+6}" x2="${cx}" y2="${cy+14}" stroke="#8aaabb" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy-14}" r="3" fill="#9abbc0" stroke="#5a7a9a" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy+14}" r="3" fill="#9abbc0" stroke="#5a7a9a" stroke-width="1"/>
  `;
}
// Abrazadera mala — igual pero roja
function clampBad(cx, cy) {
  return `
    <rect x="${cx-8}" y="${cy-14}" width="16" height="8" rx="2" fill="#c0392b" stroke="#922b21" stroke-width="1.5"/>
    <rect x="${cx-8}" y="${cy+6}" width="16" height="8" rx="2" fill="#c0392b" stroke="#922b21" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy-6}" x2="${cx}" y2="${cy-14}" stroke="#e74c3c" stroke-width="2"/>
    <line x1="${cx}" y1="${cy+6}" x2="${cx}" y2="${cy+14}" stroke="#e74c3c" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy-14}" r="3" fill="#e74c3c" stroke="#922b21" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy+14}" r="3" fill="#e74c3c" stroke="#922b21" stroke-width="1"/>
  `;
}
// Desagüe/terminal
function drain(x, y) {
  return `<rect x="${x-10}" y="${y}" width="20" height="14" rx="3" fill="#2a4a6a" stroke="#4a8aaa" stroke-width="2"/>`;
}

// SVGs solo con tuberías — sin assets externos (split y nivel se ponen como HTML overlay)
const PLACEHOLDERS = {
  // ── 1A: Tramo horizontal completamente plano ─────────────
  bg_1a: makeSVG(`
    <line x1="100" y1="210" x2="350" y2="210" ${W}/>
    <line x1="350" y1="210" x2="350" y2="390" ${W}/>
    ${drain(350, 383)}
    ${clamp(175, 210)}
    ${clamp(270, 210)}
  `),

  // ── 1B: Curva en U (menos pronunciada) ──────────────────
  bg_1b: makeSVG(`
    <line x1="100" y1="210" x2="185" y2="210" ${W}/>
    <path d="M185,210 C185,270 245,270 245,210" ${W}/>
    <line x1="245" y1="210" x2="370" y2="210" ${W}/>
    <line x1="370" y1="210" x2="370" y2="390" ${W}/>
    ${drain(370, 383)}
    ${clamp(145, 210)}
    ${clamp(295, 210)}
  `),

  // ── 2A: Canaleta continua con joroba leve en el centro ──
  bg_2a: makeSVG(`
    <polyline points="95,230 175,230 215,210 255,230 350,230" ${W}/>
    <line x1="350" y1="230" x2="350" y2="390" ${W}/>
    ${drain(350, 383)}
    ${clamp(135, 230)}
    ${clampBad(215, 210)}
    ${clamp(302, 230)}
  `),

  // ── 2B: Tramo completamente plano — debería bajar pero no tiene pendiente ──
  bg_2b: makeSVG(`
    <line x1="95" y1="200" x2="320" y2="200" ${W}/>
    <path d="M320,200 Q338,200 338,218 L338,390" ${W}/>
    ${drain(338, 383)}
    ${clamp(148, 200)}
    ${clampBad(230, 200)}
    ${clamp(310, 200)}
  `),

  // ── 3A: 2 cambios de dirección + contrapendiente leve ───
  bg_3a: makeSVG(`
    <line x1="100" y1="180" x2="160" y2="180" ${W}/>
    <path d="M160,180 Q172,180 172,192 L172,280 Q172,292 184,292" ${W}/>
    <line x1="184" y1="292" x2="390" y2="306" ${W}/>
    ${drain(390, 299)}
    ${clamp(256, 295)}
    ${clamp(330, 301)}
  `),

  // ── 3B: U oculta dentro de canaleta ──────────────────────
  bg_3b: makeSVG(`
    <line x1="95" y1="180" x2="175" y2="180" ${W}/>
    <rect x="170" y="166" width="90" height="28" rx="5" fill="#142035" stroke="#2a4060" stroke-width="1.5"/>
    <path d="M175,180 C175,192 195,198 205,198 C215,198 235,192 235,180"
      stroke="#c8d8e8" stroke-width="5" fill="none" stroke-dasharray="5,4" opacity="0.5"/>
    <line x1="235" y1="180" x2="350" y2="180" ${W}/>
    <path d="M350,180 Q362,180 362,192 L362,390" ${W}/>
    ${drain(362, 383)}
    ${clamp(130, 180)}
    ${clamp(295, 180)}
  `),
};

// Posición y tamaño de los overlays HTML por instalación (coordenadas intrínsecas 430×500)
// split: {x, y, w, h} — nivel: {x, y, w, h} o null
const OVERLAY_CONFIG = [
  { split: { x: 5,  y: 155, w: 100, h: 80 }, nivel: { x: 145, y: 228, w: 130, h: 44 } }, // 1A
  { split: { x: 5,  y: 155, w: 100, h: 80 }, nivel: null },                                // 1B
  { split: { x: 5,  y: 175, w: 100, h: 80 }, nivel: null },                                // 2A
  { split: { x: 5,  y: 145, w: 100, h: 80 }, nivel: null },                                // 2B
  { split: { x: 5,  y: 130, w: 100, h: 80 }, nivel: { x: 200, y: 330, w: 130, h: 44 } },  // 3A
  { split: { x: 5,  y: 125, w: 100, h: 80 }, nivel: null },                                // 3B
];

// ─── DATOS DEL JUEGO ────────────────────────────────────────
// Cada instalación tiene:
//   bgSrc:       imagen de fondo
//   faultCenter: {x, y} en px relativo al área install-area (430×500 intrínseco)
//   faultType:   string identificador del tipo de fallo
//   path:        [{x,y},...] recorrido del agua (coordenadas intrínsecas 430×500)
//   pathFaultIndex: índice del punto en path donde el agua "llega al fallo"
//   edu:         { bubble, quePaso, porQue, senal, obra }

const INSTALLATIONS = [
  // ── NIVEL 1 ─────────────────────────────────────────────
  {
    level: 1,
    bgSrc: PLACEHOLDERS.bg_1a,
    faultType: 'tramo_plano',
    faultCenter: { x: 260, y: 210 }, // mitad del tramo horizontal
    path: [
      { x: 100, y: 210 }, { x: 160, y: 210 }, { x: 220, y: 210 },
      { x: 260, y: 210 },
    ],
    pathFaultIndex: 2,
    quiz: {
      bubble: '¿Por qué se ha parado el agua?',
      question: '¿Por qué el agua no llega a la salida en este tramo?',
      options: [
        { text: 'El tubo tiene demasiada pendiente y el agua va demasiado rápido', correct: false },
        { text: 'El tramo horizontal no tiene pendiente — la gravedad no puede mover el agua', correct: true },
        { text: 'La abrazadera está apretada y bloquea el paso', correct: false },
      ],
    },
    edu: {
      bubble: 'El agua se quedó parada aquí. Tramo sin pendiente: la gravedad no tiene por dónde trabajar. En obra esto se resuelve con nivel antes de cerrar.',
      quePaso: 'El tramo horizontal no tiene pendiente hacia la salida.',
      porQue: 'Sin pendiente, la gravedad no puede mover el agua. Se queda estancada y con el tiempo genera humedad, suciedad y atascos.',
      senal: 'La burbuja del nivel está perfectamente centrada en el tramo horizontal — eso significa pendiente cero.',
      obra: 'Goteo diferido: el agua se acumula hasta que rebosa por la bandeja, normalmente encima del cliente.',
    },
  },
  {
    level: 1,
    bgSrc: PLACEHOLDERS.bg_1b,
    faultType: 'curva_u',
    faultCenter: { x: 215, y: 270 }, // fondo de la U
    path: [
      { x: 100, y: 210 }, { x: 145, y: 210 }, { x: 185, y: 210 },
      { x: 195, y: 230 }, { x: 210, y: 258 }, { x: 215, y: 270 },
      { x: 220, y: 258 }, { x: 230, y: 238 },
    ],
    pathFaultIndex: 6,
    quiz: {
      bubble: '¿Qué ocurre en esa curva?',
      question: '¿Qué problema genera la curva en U en un drenaje de condensados?',
      options: [
        { text: 'Hace que el agua fluya más rápido por efecto sifón', correct: false },
        { text: 'Retiene agua y acumula suciedad — puede cortarse el paso', correct: true },
        { text: 'Solo es un problema estético, no afecta al funcionamiento', correct: false },
      ],
    },
    edu: {
      bubble: 'La U retiene el agua siempre. No importa cuánta presión haya — el sedimento se acumula ahí hasta que corta el paso. Rediseña el recorrido o pon registro de limpieza.',
      quePaso: 'Hay una curva en U que actúa como sifón.',
      porQue: 'La curva en U retiene agua permanentemente. Acumula suciedad, bacterias y puede generar malos olores.',
      senal: 'La forma de U en el recorrido es visible antes de simular. El agua nunca sale de ahí sola.',
      obra: 'Atasco progresivo: el sedimento se acumula en el fondo de la U hasta que corta el paso completamente.',
    },
  },
  // ── NIVEL 2 ─────────────────────────────────────────────
  {
    level: 2,
    bgSrc: PLACEHOLDERS.bg_2a,
    faultType: 'contrapendiente',
    faultCenter: { x: 215, y: 210 }, // cima de la joroba
    path: [
      { x: 95, y: 230 }, { x: 135, y: 230 }, { x: 175, y: 230 },
      { x: 195, y: 220 }, { x: 215, y: 210 },
    ],
    pathFaultIndex: 3,
    quiz: {
      bubble: 'El agua estaba volviendo atrás. ¿Por qué?',
      question: '¿Qué causa que el agua retroceda hacia la unidad interior?',
      options: [
        { text: 'La canaleta es demasiado estrecha para el caudal de condensados', correct: false },
        { text: 'Una fijación mal colocada sube el tubo creando contrapendiente', correct: true },
        { text: 'El split produce demasiada agua y la salida se satura', correct: false },
      ],
    },
    edu: {
      bubble: 'El agua estaba yendo hacia atrás. Una fijación mal puesta fue suficiente para crear una joroba. Revisa cada abrazadera con nivel antes de cerrar la canaleta.',
      quePaso: 'Una fijación intermedia empuja el tubo hacia arriba creando contrapendiente.',
      porQue: 'El agua siempre busca el punto más bajo. Si el tubo sube en algún tramo, el agua no pasa — vuelve al origen.',
      senal: 'En el tramo horizontal se ve una "joroba" — la fijación central está más alta que las dos extremas.',
      obra: 'El agua vuelve a la bandeja y tarde o temprano desborda por la unidad interior.',
    },
  },
  {
    level: 2,
    bgSrc: PLACEHOLDERS.bg_2b,
    faultType: 'stall_lento',
    faultCenter: { x: 320, y: 200 }, // codo — donde el agua se para
    path: [
      { x: 95, y: 200 }, { x: 148, y: 200 }, { x: 230, y: 200 },
      { x: 310, y: 200 }, { x: 320, y: 200 },
    ],
    pathFaultIndex: 4,
    quiz: {
      bubble: 'El agua se paró aquí. ¿Qué está fallando?',
      question: '¿Por qué el agua se acumula justo antes del codo de bajada?',
      options: [
        { text: 'El codo tiene demasiada curvatura y ralentiza el agua', correct: false },
        { text: 'El tramo horizontal previo al codo no baja — está plano o con mala fijación', correct: true },
        { text: 'La canaleta es demasiado ancha y el agua pierde velocidad', correct: false },
      ],
    },
    edu: {
      bubble: 'El agua se paró justo antes del codo. Una fijación mal colocada mantiene el tubo horizontal donde debería bajar. Ajústala para que el tubo descienda.',
      quePaso: 'Una fijación mal colocada mantiene el tubo horizontal donde debería bajar.',
      porQue: 'La gravedad necesita pendiente continua. Un tramo plano en un recorrido largo es suficiente para que el agua se estanque.',
      senal: 'El tubo hace un tramo horizontal visible justo antes del codo. Con nivel, la burbuja estaría centrada en ese punto.',
      obra: 'Acumulación en el punto de transición, goteo desde la canaleta.',
    },
  },
  // ── NIVEL 3 ─────────────────────────────────────────────
  {
    level: 3,
    bgSrc: PLACEHOLDERS.bg_3a,
    faultType: 'stall_lento',
    faultCenter: { x: 370, y: 305 }, // codo — donde el agua pierde la fuerza
    path: [
      { x: 100, y: 180 }, { x: 140, y: 180 },
      { x: 160, y: 186 }, { x: 172, y: 200 },
      { x: 172, y: 260 }, { x: 184, y: 292 },
      { x: 240, y: 296 }, { x: 310, y: 301 }, { x: 370, y: 305 },
    ],
    pathFaultIndex: 8,
    quiz: {
      bubble: 'El agua no llega. ¿Sabes por qué?',
      question: '¿Por qué el agua va cada vez más despacio y no llega al desagüe?',
      options: [
        { text: 'El tubo es demasiado estrecho para el caudal de condensados', correct: false },
        { text: 'El último tramo tiene pendiente insuficiente — la gravedad no puede mover el agua', correct: true },
        { text: 'El número de cambios de dirección reduce demasiado el caudal', correct: false },
      ],
    },
    edu: {
      bubble: '1% de contrapendiente. Casi invisible a ojo. Pero el agua no hace concesiones — no llega a la salida y tarde o temprano gotea. El nivel no miente.',
      quePaso: 'El último tramo tiene 1% de contrapendiente.',
      porQue: 'Incluso 1% de contrapendiente es suficiente para crear acumulación en un tramo de 50cm o más. La gravedad no hace concesiones.',
      senal: 'El agua avanza más despacio de lo normal y nunca llega a la salida limpiamente. Con nivel, la burbuja estaría 1–2mm fuera de centro.',
      obra: 'Goteo progresivo que empieza semanas después — el cliente llama y el técnico no sabe qué pasó.',
    },
  },
  {
    level: 3,
    bgSrc: PLACEHOLDERS.bg_3b,
    faultType: 'u_oculta',
    faultCenter: { x: 205, y: 198 }, // fondo de la U oculta
    path: [
      { x: 95,  y: 180 }, { x: 130, y: 180 }, { x: 175, y: 180 },
      { x: 185, y: 188 }, { x: 195, y: 196 }, { x: 205, y: 198 },
      { x: 215, y: 196 }, { x: 225, y: 188 }, { x: 235, y: 180 },
    ],
    pathFaultIndex: 7,
    quiz: {
      bubble: 'El agua se quedó ahí dentro. ¿Entiendes el problema real?',
      question: '¿Cuál es el mayor problema de una curva en U escondida detrás de la canaleta?',
      options: [
        { text: 'Acumula agua igual que una curva en U visible', correct: false },
        { text: 'Acumula agua Y no se puede acceder para limpiar — el atasco obliga a desmontar todo', correct: true },
        { text: 'Genera ruido al pasar el agua por la curva cerrada', correct: false },
      ],
    },
    edu: {
      bubble: 'El problema no es solo que acumule agua. Es que no puedes limpiarla. Un atasco ahí significa desmontar todo. Siempre pregúntate: ¿puedo acceder si hay un atasco?',
      quePaso: 'El cambio de dirección crea una mini-U inaccesible detrás de la canaleta.',
      porQue: 'El problema no es solo que acumule agua — es que no se puede acceder para limpiar.',
      senal: 'La forma del recorrido en ese codo crea un punto bajo no accesible. ¿Puedo limpiar esto si se atasca?',
      obra: 'Hay que desmontar la instalación entera para limpiar. Coste de mantenimiento innecesario.',
    },
  },
];

const LEVEL_TRANSITIONS = [
  { title: 'NIVEL 1 — Recorrido corto', subtitle: 'Recorrido corto y directo.', bubble: 'Escenario 1: recorrido corto y directo. Parece sencillo. Los fallos sencillos son los que más dan guerra.' },
  { title: 'NIVEL 2 — Recorrido largo', subtitle: 'Recorrido largo con canaleta.', bubble: 'Escenario 2: recorrido largo con canaleta. Aquí la estética engaña. Un recorrido bonito puede esconder un problema muy feo.' },
  { title: 'NIVEL 3 — Con cambios',     subtitle: 'Recorrido con cambios de dirección.', bubble: 'Escenario 3: cambios de dirección. Esto es lo que te encontrarás en obra real. Cada giro es un punto crítico potencial.' },
];

const SANTI_TIMES = { 1: 5, 2: 4, 3: 3 }; // segundos por nivel

const CORRECT_MSGS_FAST = [
  '¡Eso es! Viste exactamente dónde el agua perdía la batalla contra la gravedad.',
  'Ojo clínico. Eso no se finge — o lo ves o no lo ves. Tú lo has visto.',
  'Más rápido que yo. No pasa a menudo. Apúntalo.',
];
const CORRECT_MSGS_NORMAL = [
  'Correcto. Lo encontraste. La próxima vez, confía antes en lo que te dice el agua.',
  'Bien. El fallo estaba justo ahí. Cada vez que lo ves, lo verás más rápido en obra.',
];

// ─── ESTADO ─────────────────────────────────────────────────

let state = {
  score: 0,
  lives: 3,
  currentInstallIndex: 0,
  wrongTaps: 0,
  santiInterval: null,
  santiTimeLeft: 5000, // ms
  santiTotalTime: 5000,
  waterAnimFrame: null,
  waterPathIndex: 0,
  waterProgress: 0,
  simulationRunning: false,
  faultReached: false,
  correctMsgFastIdx: 0,
  correctMsgNormalIdx: 0,
  lastLevelShown: 0,
};

// ─── UTILIDADES ─────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
  if (id === 'results') {
    document.documentElement.classList.add('results');
  } else {
    document.documentElement.classList.remove('results');
  }
}

function setSantiAvatar(stateKey) {
  [$('intro-avatar'), $('gameplay-avatar'), $('edu-avatar'), $('results-avatar')].forEach(img => {
    if (img) img.src = SANTI[stateKey];
  });
}

function getSantiAvatar(stateKey) { return SANTI[stateKey]; }

function getRecord() {
  return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
}

function saveRecord(score) {
  const prev = getRecord();
  if (score > prev) localStorage.setItem(RECORD_KEY, score);
}

function postTaskCompleted() {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  } catch (e) {
    console.log('TASK_COMPLETED (no RN context)');
  }
}

// ─── ARRANQUE ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Intro
  $('btn-start').addEventListener('click', () => showScreen('howto'));

  // Howto
  $('btn-howto-next').addEventListener('click', () => {
    $('howto-step-1').classList.remove('active-step');
    $('howto-step-2').classList.add('active-step');
  });
  $('btn-howto-start').addEventListener('click', () => {
    resetGame();
    showScreen('play');
    showLevelTransition(0);
  });

  // Simular
  $('btn-simular').addEventListener('click', startSimulation);

  // Tap en área de instalación
  $('install-area').addEventListener('touchstart', handleTap, { passive: false });
  $('install-area').addEventListener('click', handleTap);

  // Overlay educativo
  $('btn-entendido').addEventListener('click', onEntendido);

  // Retry
  $('btn-retry').addEventListener('click', () => {
    resetGame();
    showScreen('play');
    showLevelTransition(0);
  });
});

// ─── RESET ───────────────────────────────────────────────────

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.currentInstallIndex = 0;
  state.lastLevelShown = 0;
  state.correctMsgFastIdx = 0;
  state.correctMsgNormalIdx = 0;
  updateHUD();
}

// ─── TRANSICIÓN DE NIVEL ─────────────────────────────────────

function showLevelTransition(installIndex) {
  const inst = INSTALLATIONS[installIndex];
  const lvl = inst.level;
  if (lvl === state.lastLevelShown) {
    loadInstallation(installIndex);
    return;
  }
  state.lastLevelShown = lvl;
  const t = LEVEL_TRANSITIONS[lvl - 1];
  $('transition-title').textContent = t.title;
  $('transition-subtitle').textContent = t.subtitle;
  $('transition-bubble').textContent = t.bubble;
  $('level-transition').classList.add('visible');
  setTimeout(() => {
    $('level-transition').classList.remove('visible');
    loadInstallation(installIndex);
  }, 2500);
}

// ─── CARGAR INSTALACIÓN ──────────────────────────────────────

function loadInstallation(index) {
  clearWaterAnimation();
  clearSantiTimer();

  state.currentInstallIndex = index;
  state.wrongTaps = 0;
  state.simulationRunning = false;
  state.faultReached = false;

  const inst = INSTALLATIONS[index];

  // Fondo
  $('install-bg').src = inst.bgSrc;

  // Botón Simular visible
  $('btn-simular').classList.remove('hidden');

  // Barra Santi oculta
  $('santi-bar-panel').classList.remove('visible');
  $('santi-bar-fill').style.width = '100%';
  $('santi-bar-fill').style.transition = 'none';

  // Avatar gameplay
  setGameplayAvatar('happy');

  // Limpiar feedback anterior
  document.querySelectorAll('.tap-correct, .tap-wrong, .floating-pts').forEach(el => el.remove());
  const prevSvg = $('install-area') && $('install-area').querySelector('.water-svg');
  if (prevSvg) prevSvg.innerHTML = '';

  // Posicionar overlays de split y nivel
  positionOverlays(index);

  updateHUD();
}

function positionOverlays(index) {
  const area = $('install-area');
  const rect = area.getBoundingClientRect();
  const scaleX = rect.width  / 430;
  const scaleY = rect.height / 500;
  const cfg = OVERLAY_CONFIG[index];

  const splitEl = $('overlay-split');
  const nivelEl = $('overlay-nivel');

  function applyOverlay(el, c) {
    if (!c) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.left   = (c.x * scaleX) + 'px';
    el.style.top    = (c.y * scaleY) + 'px';
    el.style.width  = (c.w * scaleX) + 'px';
    el.style.height = 'auto';
  }

  applyOverlay(splitEl, cfg.split);
  applyOverlay(nivelEl, cfg.nivel);
}

function setGameplayAvatar(stateKey) {
  $('gameplay-avatar').src = SANTI[stateKey];
}

// ─── HUD ─────────────────────────────────────────────────────

function updateHUD() {
  const inst = INSTALLATIONS[state.currentInstallIndex];
  $('hud-level').textContent = `Nivel ${inst.level}/3`;
  $('hud-score').textContent = `${state.score} pts`;
  $('hud-lives').textContent = '♥'.repeat(state.lives) + '♡'.repeat(3 - state.lives);
}

function popScore() {
  $('hud-score').classList.remove('pop');
  void $('hud-score').offsetWidth; // reflow
  $('hud-score').classList.add('pop');
  setTimeout(() => $('hud-score').classList.remove('pop'), 300);
}

// ─── SIMULACIÓN DE AGUA ──────────────────────────────────────

// Calcula la longitud total del path hasta el índice faultIdx
function pathLengthUpTo(path, endIdx) {
  let len = 0;
  for (let i = 0; i < endIdx && i < path.length - 1; i++) {
    const dx = path[i+1].x - path[i].x;
    const dy = path[i+1].y - path[i].y;
    len += Math.sqrt(dx*dx + dy*dy);
  }
  return len;
}

// Interpola una posición a distancia `dist` a lo largo del path
function posAtDist(path, dist) {
  let remaining = dist;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i+1].x - path[i].x;
    const dy = path[i+1].y - path[i].y;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (remaining <= len) {
      const t = remaining / len;
      return { x: path[i].x + dx*t, y: path[i].y + dy*t };
    }
    remaining -= len;
  }
  return path[path.length - 1];
}

function startSimulation() {
  if (state.simulationRunning) return;
  state.simulationRunning = true;

  $('btn-simular').classList.add('hidden');

  const inst   = INSTALLATIONS[state.currentInstallIndex];
  const area   = $('install-area');
  const rect   = area.getBoundingClientRect();
  const scaleX = rect.width  / 430;
  const scaleY = rect.height / 500;

  const totalDist  = pathLengthUpTo(inst.path, inst.pathFaultIndex);
  const SPEED      = 55;   // px intrínsecas / s
  const N_BUBBLES  = 6;
  const GAP        = 18;   // px intrínsecos entre burbujas

  // SVG superpuesto para dibujar las burbujas
  let svgEl = area.querySelector('.water-svg');
  if (!svgEl) {
    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'water-svg');
    svgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:12;overflow:visible';
    area.appendChild(svgEl);
  }
  svgEl.innerHTML = '';

  // Crear los círculos
  const circles = Array.from({ length: N_BUBBLES }, (_, i) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', i === 0 ? '7' : String(7 - i * 0.7));
    c.setAttribute('fill', '#00E6BC');
    c.setAttribute('opacity', String(1 - i * 0.13));
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('r', i === 0 ? '13' : '0');
    glow.setAttribute('fill', 'rgba(0,230,188,0.18)');
    glow.setAttribute('class', 'bubble-glow-' + i);
    svgEl.appendChild(glow);
    svgEl.appendChild(c);
    return { dot: c, glow };
  });

  const isReturn    = inst.faultType === 'contrapendiente';
  const isSlowStall = inst.faultType === 'stall_lento';
  const isUOculta   = inst.faultType === 'u_oculta';
  // Para u_oculta: el path incluye la bajada + subida parcial
  // El faultIndex apunta al punto donde empieza a subir — ahí se para


  // Fase: 'advance' → 'pause' → 'return' (solo contrapendiente) | 'advance' → 'stall' (resto)
  let phase     = 'advance';
  let leadDist  = 0;
  let pauseMs   = 0;
  let lastTime  = null;

  function positionBubbles(dist, colorOverride) {
    circles.forEach((c, i) => {
      const d = Math.max(0, dist - i * GAP);
      const p = posAtDist(inst.path, d);
      c.dot.setAttribute('cx', p.x * scaleX);
      c.dot.setAttribute('cy', p.y * scaleY);
      c.glow.setAttribute('cx', p.x * scaleX);
      c.glow.setAttribute('cy', p.y * scaleY);
      if (colorOverride) c.dot.setAttribute('fill', colorOverride);
    });
  }

  function animStep(ts) {
    if (!lastTime) lastTime = ts;
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;

    if (phase === 'advance') {
      // stall_lento: va frenando en el último 40% del recorrido hasta casi parar
      let speed = SPEED;
      if (isSlowStall && totalDist > 0) {
        const progress = leadDist / totalDist;
        if (progress > 0.6) {
          speed = SPEED * Math.max(0.08, 1 - (progress - 0.6) / 0.4 * 0.92);
        }
      }
      leadDist += speed * dt;
      if (leadDist >= totalDist) {
        leadDist = totalDist;
        positionBubbles(leadDist);
        if (isReturn) {
          // Pausa breve antes de retroceder
          phase = 'pause';
          pauseMs = 0;
          // Cambiar color a naranja-amarillo para indicar que algo falla
          circles.forEach(c => c.dot.setAttribute('fill', '#FFFFAB'));
        } else {
          // Fallo de tipo estancamiento: pulsar glow y activar timer
          phase = 'stall';
          if (!state.faultReached) {
            state.faultReached = true;
            onWaterReachesFault(inst);
          }
          return;
        }
      } else {
        positionBubbles(leadDist);
      }

    } else if (phase === 'pause') {
      pauseMs += dt * 1000;
      if (pauseMs >= 400) {
        phase = 'return';
        // Cambiar a rojo para indicar retroceso
        circles.forEach(c => c.dot.setAttribute('fill', '#E74C3C'));
      }

    } else if (phase === 'return') {
      leadDist -= SPEED * 1.4 * dt; // retrocede más rápido
      positionBubbles(leadDist);
      if (leadDist <= 0) {
        // Llegó al inicio — activar timer
        if (!state.faultReached) {
          state.faultReached = true;
          onWaterReachesFault(inst);
        }
        return;
      }
    }

    state.waterAnimFrame = requestAnimationFrame(animStep);
  }

  state.waterAnimFrame = requestAnimationFrame(animStep);
}

function createParticle(area, type) {
  const div = document.createElement('div');
  div.className = 'water-particle' + (type === 'trail' ? ' trail' : '');
  area.appendChild(div);
  return div;
}

function setParticlePos(el, area, intrinsicX, intrinsicY) {
  // Escalar de coordenadas intrínsecas (430×500) a tamaño real del área
  const rect = area.getBoundingClientRect();
  const scaleX = rect.width  / 430;
  const scaleY = rect.height / 500;
  el.style.left = (intrinsicX * scaleX) + 'px';
  el.style.top  = (intrinsicY * scaleY) + 'px';
}

function clearWaterAnimation() {
  if (state.waterAnimFrame) {
    cancelAnimationFrame(state.waterAnimFrame);
    state.waterAnimFrame = null;
  }
  const svgEl = $('install-area') && $('install-area').querySelector('.water-svg');
  if (svgEl) svgEl.innerHTML = '';
}

function onWaterReachesFault(inst) {
  // Pulsa el glow de la burbuja líder para indicar el fallo
  const svgEl = $('install-area').querySelector('.water-svg');
  if (svgEl) {
    const glow = svgEl.querySelector('.bubble-glow-0');
    if (glow) {
      glow.setAttribute('r', '18');
      glow.style.transition = 'r 0.4s ease-out';
    }
  }
  // Iniciar contador de Santi
  startSantiTimer(inst);
}

// ─── CONTADOR DE SANTI ───────────────────────────────────────

function startSantiTimer(inst) {
  const totalMs = SANTI_TIMES[inst.level] * 1000;
  state.santiTotalTime = totalMs;
  state.santiTimeLeft  = totalMs;

  $('santi-bar-panel').classList.add('visible');
  $('santi-bar-fill').style.transition = 'none';
  $('santi-bar-fill').style.width = '100%';

  // Forzar reflow para que la transición arranque limpia
  void $('santi-bar-fill').offsetWidth;
  $('santi-bar-fill').style.transition = `width ${totalMs}ms linear`;
  $('santi-bar-fill').style.width = '0%';

  state.santiInterval = setInterval(() => {
    state.santiTimeLeft -= 50;
    if (state.santiTimeLeft <= 0) {
      clearSantiTimer();
      onSantiWins(inst);
    }
  }, 50);
}

function addSantiTime(ms) {
  // Penalización por tap incorrecto: Santi gana 1 segundo
  state.santiTimeLeft = Math.max(0, state.santiTimeLeft - ms);
  // Actualizar visualmente la barra
  const pct = (state.santiTimeLeft / state.santiTotalTime) * 100;
  $('santi-bar-fill').style.transition = 'none';
  $('santi-bar-fill').style.width = pct + '%';
}

function clearSantiTimer() {
  if (state.santiInterval) {
    clearInterval(state.santiInterval);
    state.santiInterval = null;
  }
}

// ─── TAP DEL JUGADOR ─────────────────────────────────────────

function handleTap(e) {
  if (!state.faultReached) return; // agua aún no llegó al fallo
  if ($('edu-overlay').classList.contains('visible')) return;
  if ($('quiz-overlay').classList.contains('visible')) return;

  e.preventDefault();
  const area = $('install-area');
  const rect = area.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const tapX = clientX - rect.left;
  const tapY = clientY - rect.top;

  const inst = INSTALLATIONS[state.currentInstallIndex];

  // Escalar faultCenter de coordenadas intrínsecas a reales
  const scaleX = rect.width  / 430;
  const scaleY = rect.height / 500;
  const fcX = inst.faultCenter.x * scaleX;
  const fcY = inst.faultCenter.y * scaleY;

  const dist = Math.sqrt((tapX - fcX) ** 2 + (tapY - fcY) ** 2);

  if (dist <= HIT_RADIUS) {
    onPlayerWins(inst, tapX, tapY);
  } else {
    onWrongTap(inst, tapX, tapY);
  }
}

// ─── ACIERTO DEL JUGADOR ─────────────────────────────────────

function onPlayerWins(inst, tapX, tapY) {
  clearSantiTimer();
  clearWaterAnimation();

  // Calcular puntos según timing
  const elapsed = inst.level <= 1 ? 5000 : inst.level === 2 ? 4000 : 3000;
  const halfTime = (inst.level === 1 ? 5 : inst.level === 2 ? 4 : 3) * 500;
  const timeUsed = (inst.level === 1 ? 5000 : inst.level === 2 ? 4000 : 3000) - state.santiTimeLeft;
  const pts = timeUsed < halfTime ? 150 : 100;

  state.score += pts;
  updateHUD();
  popScore();

  // Feedback visual
  showTapCorrect($('install-area'), tapX, tapY);
  showFloatingPts($('install-area'), tapX, tapY, pts);

  // Santi celebrating
  setGameplayAvatar('celebrating');
  $('gameplay-avatar').classList.add('highlight');

  // Mostrar quiz (refuerzo) tras breve pausa
  setTimeout(() => {
    $('gameplay-avatar').classList.remove('highlight');
    setGameplayAvatar('happy');
    showQuizOverlay(inst);
  }, 1200);
}

// ─── SANTI GANA ──────────────────────────────────────────────

function onSantiWins(inst) {
  clearWaterAnimation();

  // Perder una vida
  state.lives = Math.max(0, state.lives - 1);
  updateHUD();

  // Quiz → educativo
  setTimeout(() => showQuizOverlay(inst), 600);
}

function showFaultMarker(area, x, y) {
  // eliminado — la partícula de agua ya indica la posición del fallo
}

// ─── TAP INCORRECTO ──────────────────────────────────────────

function onWrongTap(inst, tapX, tapY) {
  state.wrongTaps++;
  showTapWrong($('install-area'), tapX, tapY);

  // Mostrar hint
  const hint = document.createElement('p');
  hint.style.cssText = `
    position: absolute; bottom: 4px; left: 0; right: 0;
    text-align: center; font-size: 12px; color: #FFFFAB;
    font-family: 'Baloo 2', cursive; pointer-events: none; z-index: 15;
  `;
  hint.textContent = 'Busca dónde el agua cambia de comportamiento';
  $('install-area').appendChild(hint);
  setTimeout(() => hint.remove(), 1200);

  // Penalizar a Santi +1s
  addSantiTime(1000);

  // Si ya agotó los intentos, Santi gana automáticamente
  if (state.wrongTaps >= MAX_WRONG_TAPS) {
    clearSantiTimer();
    onSantiWins(inst);
  }
}

// ─── OVERLAY QUIZ ────────────────────────────────────────────

function showQuizOverlay(inst) {
  const quiz = inst.quiz;
  $('quiz-question').textContent = quiz.question;

  const container = $('quiz-options');
  container.innerHTML = '';
  quiz.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => onQuizAnswer(btn, opt.correct, inst), { once: true });
    container.appendChild(btn);
  });

  $('quiz-overlay').classList.add('visible');
}

function onQuizAnswer(btn, isCorrect, inst) {
  const allBtns = Array.from($('quiz-options').querySelectorAll('.quiz-option'));
  allBtns.forEach(b => { b.disabled = true; });

  btn.classList.add(isCorrect ? 'correct' : 'wrong');

  // If wrong, also reveal the correct option
  if (!isCorrect) {
    allBtns.forEach((b, i) => {
      if (inst.quiz.options[i] && inst.quiz.options[i].correct) b.classList.add('correct');
    });
  }

  setTimeout(() => {
    $('quiz-overlay').classList.remove('visible');
    showEduOverlay(inst, isCorrect);
  }, 1200);
}

// ─── OVERLAY EDUCATIVO ───────────────────────────────────────

function showEduOverlay(inst, isCorrect) {
  $('edu-que-paso').textContent = inst.edu.quePaso;
  $('edu-por-que').textContent = inst.edu.porQue;
  $('edu-senal').textContent = inst.edu.senal;
  $('edu-obra').textContent = inst.edu.obra;
  $('edu-avatar').src = isCorrect ? SANTI.happy : SANTI.worried;
  $('edu-overlay').classList.add('visible');
}

function onEntendido() {
  $('edu-overlay').classList.remove('visible');
  if (state.lives <= 0) {
    showResults();
  } else {
    advanceGame();
  }
}

// ─── AVANZAR ─────────────────────────────────────────────────

function advanceGame() {
  const nextIndex = state.currentInstallIndex + 1;
  if (nextIndex >= INSTALLATIONS.length) {
    showResults();
    return;
  }
  const fadeEl = $('install-area');
  fadeEl.style.transition = 'opacity 0.3s';
  fadeEl.style.opacity = '0';
  setTimeout(() => {
    fadeEl.style.opacity = '1';
    showLevelTransition(nextIndex);
  }, 300);
}

// ─── RESULTADOS ──────────────────────────────────────────────

function showResults() {
  clearWaterAnimation();
  clearSantiTimer();

  const score = state.score;
  saveRecord(score);
  const record = getRecord();

  $('results-score').textContent = `${score} pts`;

  if (score >= record && score > 0) {
    $('results-record').textContent = 'Nuevo récord';
    $('results-record').classList.add('new-record');
  } else {
    $('results-record').textContent = `Récord: ${record} pts`;
    $('results-record').classList.remove('new-record');
  }

  // Tier
  let avatarState, bubble;
  if (score >= 700) {
    avatarState = 'celebrating';
    bubble = '900 puntos posibles y tú has estado cerca. Eso es criterio técnico real, no suerte. El drenaje ya no va a darte sorpresas.';
  } else if (score >= 400) {
    avatarState = 'happy';
    bubble = 'Buen concurso. Los recorridos largos y los cambios de dirección todavía te cuestan un poco. Repasa la pendiente en esos tramos y vuelve.';
  } else {
    avatarState = 'worried';
    bubble = 'El drenaje tiene su lógica y es siempre la misma: la gravedad manda. Vuelta a empezar — esta vez, deja que el agua te enseñe antes de tocar.';
  }

  $('results-avatar').src = SANTI[avatarState];
  $('results-bubble').textContent = bubble;

  // Progreso
  $('results-progress-text').textContent = `${Math.round(score / 150)} de 6 instalaciones detectadas antes que Santi`;

  showScreen('results');

  if (score >= TASK_COMPLETED_THRESHOLD) {
    postTaskCompleted();
  }
}

// ─── FEEDBACK VISUAL HELPERS ─────────────────────────────────

function showTapCorrect(area, x, y) {
  const el = document.createElement('div');
  el.className = 'tap-correct';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  area.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function showTapWrong(area, x, y) {
  const el = document.createElement('div');
  el.className = 'tap-wrong';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  area.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

function showFloatingPts(area, x, y, pts) {
  const el = document.createElement('div');
  el.className = 'floating-pts';
  el.textContent = `+${pts}`;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  area.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
