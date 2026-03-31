/* === La Toma Perfecta === */

// --- Helpers ---
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    const ms = level === 'light' ? 30 : level === 'medium' ? 60 : level === 'heavy' ? 100 : 40;
    navigator.vibrate(pattern || ms);
  }
}
function taskCompleted() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

// --- Image dimensions ---
const IMG_H = 944;

// --- Luca states per phase ---
// Before outfit: pijama assets. After outfit + groom: normal assets.
let lucaPrefix = 'pijama_'; // 'pijama_' or '' (dressed)
let lucaGroomed = false;

function setLuca(state) {
  const img = document.getElementById('luca-img');
  if (!img) return;
  if (state === 'dressed_messy') {
    img.src = 'assets/luca_dressed_messy.png';
  } else {
    img.src = 'assets/luca_' + lucaPrefix + state + '.png';
  }
}

// --- Sequential steps ---
const STEPS = [
  {
    id: 'noise',
    msg: 'Para grabar un buen vídeo currículum, necesito un sitio tranquilo. ¿Ves algo que haga ruido?',
    hotspots: [{ id: 'window', xPct: 24, yPct: 45, icon: 'sound' }],
    onResolve: () => { changeBg('bg_step1.jpg'); },
    resolveMsg: '¡Mejor! Sin ruido de la calle.',
  },
  {
    id: 'light',
    msg: 'Ahora necesito buena iluminación para que se me vea bien la cara. Enciende la luz.',
    hotspots: [{ id: 'switch', xPct: 80, yPct: 60, icon: 'bulb' }],
    onResolve: () => { changeBg('bg_step2.jpg'); },
    resolveMsg: 'Se ve mucho mejor. Buena luz es clave.',
  },
  {
    id: 'tidy',
    msg: 'El recruiter ve todo lo que hay detrás de ti. Ese desorden no puede salir en el vídeo. Arréglalo.',
    hotspots: [{ id: 'clothes', xPct: 80, yPct: 75, icon: 'shirt' }],
    onResolve: () => { changeBg('bg_step3.jpg'); },
    resolveMsg: 'Perfecto. Fondo limpio.',
  },
  {
    id: 'distractions',
    msg: 'Si hay algo que pueda distraerte, mejor cerrar la puerta y mantener las distracciones fuera de tu espacio.',
    hotspots: [
      { id: 'pet', xPct: 70, yPct: 75, icon: 'paw' },
      { id: 'door', xPct: 70, yPct: 45, icon: 'door' },
    ],
    resolveAny: true,
    onResolve: () => {
      changeBg('bg_step5.jpg');
      const pet = document.getElementById('pet-asset');
      if (pet) { pet.style.transition = 'opacity 0.4s'; pet.style.opacity = '0'; setTimeout(() => pet.remove(), 400); }
    },
    resolveMsg: 'Sin distracciones. Puerta cerrada, mascota fuera.',
  },
  {
    id: 'notifications',
    msg: 'Las notificaciones pueden arruinar la toma. Silencia el ordenador y tu móvil.',
    hotspots: [{ id: 'computer', xPct: 55, yPct: 60, icon: 'bell' }],
    onResolve: () => {},
    resolveMsg: 'Silenciado. Nada interrumpirá la grabación.',
  },
  {
    id: 'outfit',
    msg: 'El entorno está listo. Pero no puedo salir así en pijama. ¿Qué me pongo?',
    hotspots: [{ id: 'wardrobe', xPct: 10, yPct: 60, icon: 'hanger' }],
    onResolve: null, // handled by outfit modal
    resolveMsg: 'Limpio, claro y apropiado. No hace falta más.',
  },
  {
    id: 'groom',
    msg: 'Ya está, ya me he cambiado. Pero debo cuidar mi apariencia...',
    hotspots: [], // special: tap on Luca's head
    onResolve: () => {
      lucaPrefix = '';
      lucaGroomed = true;
    },
    resolveMsg: '¡Listo! Ahora sí que estoy presentable.',
  },
  {
    id: 'zone',
    msg: 'Ahora busca un buen fondo para grabar. Pared limpia, sin estanterías ni desorden detrás.',
    hotspots: [],
    onResolve: null,
    resolveMsg: '¡Esta es la zona! Vamos a grabar.',
  },
];

// Background zones (not apt for recording) — mutually exclusive, no overlap
const BAD_ZONES = [
  { id: 'wardrobe', xMin: 0,  xMax: 18, msg: 'El armario abierto al fondo no queda profesional. Busca una pared limpia.' },
  { id: 'bookshelf',xMin: 18, xMax: 25, msg: 'Las estanterías detrás distraen al recruiter — no sabe si mirarte a ti o leer los títulos.' },
  { id: 'bed',      xMin: 25, xMax: 45, msg: 'La cama al fondo da una imagen poco profesional. El recruiter lo nota aunque no lo diga.' },
  { id: 'desk',     xMin: 45, xMax: 65, msg: 'El escritorio al fondo habla antes que tú. Elige un fondo que no cuente nada.' },
  { id: 'door',     xMin: 65, xMax: 80, msg: 'La puerta y la silla al fondo no dan la imagen adecuada. Busca una pared limpia y neutra.' },
];
const NEUTRAL_ZONE = { xMin: 80, xMax: 100 };

// --- Phase 2: Cards (good + bad) ---
const PHASE2_CARDS = [
  { text: '📄 Lee el papel',              bad: true,  failMsg: 'Leer el papel rompe la confianza de inmediato.', rule: 'Graba sin leer. Si te trabas, repite desde ese bloque.' },
  { text: '🎯 "Me llamo ___, soy ___"',   bad: false },
  { text: '"Hola, bueno, pues..."',        bad: true,  failMsg: 'Los primeros 3 segundos son los más importantes. Una coletilla los mata.', rule: 'Empieza directo: "Me llamo ___, soy ___ y soy de ___."' },
  { text: '👁️ Mira a la cámara',          bad: false },
  { text: '🔽 Se encorva',                bad: true,  failMsg: 'La postura encorvada transmite desgana.', rule: 'Espalda recta, mentón arriba, hombros atrás.' },
  { text: '🗣️ Voz clara y firme',         bad: false },
  { text: '👀 Mira hacia abajo',          bad: true,  failMsg: 'Mirar abajo transmite que no te sabes el mensaje.', rule: 'Mira al objetivo del móvil, no al suelo.' },
  { text: '💪 Menciona 2 evidencias',     bad: false },
  { text: '"eeeeeh..."',                   bad: true,  failMsg: 'Las coletillas de relleno alargan el vídeo sin aportar nada.', rule: 'Si no sabes qué decir, para. Un silencio breve es mejor.' },
  { text: '⏱️ Entre 60 y 90 segundos',    bad: false },
  { text: '🔈 Voz baja al final',         bad: true,  failMsg: 'La voz baja al final da sensación de desgana.', rule: 'Mantén el volumen constante hasta el cierre.' },
  { text: '📐 Postura recta',             bad: false },
];

// SVG icons
const ICONS = {
  hanger: '<svg viewBox="0 0 24 24"><path d="M12 4a1.5 1.5 0 011.5 1.5c0 .56-.31 1.05-.76 1.3L12 7.25V9l7.43 4.63A2 2 0 0118.34 17H5.66a2 2 0 01-1.09-3.37L12 9V7.25l-.74-.45A1.5 1.5 0 0112 4z"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.5 8.5 0 0014 3.23z"/></svg>',
  paw: '<svg viewBox="0 0 24 24"><circle cx="4.5" cy="9.5" r="2.5"/><circle cx="9" cy="5.5" r="2.5"/><circle cx="15" cy="5.5" r="2.5"/><circle cx="19.5" cy="9.5" r="2.5"/><path d="M17.34 14.86a4.73 4.73 0 00-2.54-1.66 7.06 7.06 0 00-5.6 0A4.73 4.73 0 006.66 14.86a3.73 3.73 0 00.96 4.57A2.68 2.68 0 009.34 20h5.32a2.68 2.68 0 001.72-.57 3.73 3.73 0 00.96-4.57z"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
  door: '<svg viewBox="0 0 24 24"><path d="M19 19V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14H3v2h18v-2h-2zm-6-8a1 1 0 110 2 1 1 0 010-2z"/></svg>',
  shirt: '<svg viewBox="0 0 24 24"><path d="M15.5 1h-7l-4 4 3 3 1-1V21h7V7l1 1 3-3-4-4z"/></svg>',
  bulb: '<svg viewBox="0 0 24 24"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/></svg>',
};

// Wrong tap messages per step
const WRONG_TAP_MSGS = {
  noise: 'Busca qué está haciendo ruido en la habitación. Mira bien...',
  light: 'Necesitas más luz. ¿Dónde se enciende?',
  tidy: 'Mira el fondo... ¿ves algo desordenado que el recruiter notaría?',
  distractions: 'Busca lo que puede interrumpirte durante la grabación.',
  notifications: 'Las notificaciones pueden arruinar la toma. ¿Dónde salen?',
  outfit: 'Necesitas cambiarte. ¿Dónde está tu ropa?',
  groom: 'Mírame bien... ¿no me falta algo?',
  zone: 'Busca una pared limpia y neutra donde colocarte para grabar.',
};

// --- State ---
const S = {
  phase: 'INTRO',
  score: 0,
  currentStep: 0,
  stepHotspotsResolved: 0,
  outfitChosen: false,
  panOffsetX: 0,
  panWidth: 0,
  viewW: 0,
  velocity: 0,
  taskFired: false,
  record: parseInt(localStorage.getItem('la_toma_perfecta_record')) || 0,
  // Phase 2
  recResults: [],   // { card, tapped, bad }
  recTimers: [],
  recCardIndex: 0,
  recInterval: null,
};

// --- Screen switching ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.hidden = true;
  });
  const el = document.getElementById(id);
  if (el) { el.hidden = false; el.classList.add('active'); }
  document.documentElement.classList.toggle('results', id === 'results');
}

// --- Score ---
function addScore(pts, x, y) {
  S.score += pts;
  if (S.score < 0) S.score = 0;
  const hud = document.getElementById('hud-score');
  if (hud) {
    hud.textContent = S.score + ' pts';
    hud.style.transform = 'scale(1.2)';
    setTimeout(() => hud.style.transform = 'scale(1)', 200);
  }
  if (x !== undefined && pts > 0) floatingPoints(x, y, pts);
  if (!S.taskFired && S.score >= 600) {
    S.taskFired = true;
    taskCompleted();
  }
}

function colorFlush(color, opacity) {
  const el = document.getElementById('color-flush');
  el.style.transition = 'none';
  el.style.background = color;
  el.style.opacity = opacity;
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.3s linear';
    el.style.opacity = 0;
  });
}

function floatingPoints(x, y, pts) {
  const el = document.createElement('div');
  el.className = 'floating-points';
  el.textContent = '+' + pts;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

// --- Speech ---
let speechTimeout = null;
function showSpeech(text, duration) {
  clearTimeout(speechTimeout);
  const bubble = document.getElementById('speech-bubble');
  document.getElementById('speech-text').textContent = text;
  // Force position at bottom, no arrow
  bubble.style.cssText = 'position:fixed;bottom:20px;top:auto;left:5%;right:5%;width:90%;max-width:none;transform:none;z-index:30;background:#fff;color:#0B214A;border-radius:16px;padding:14px 18px;font-size:14px;font-weight:600;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,0.3);';
  bubble.hidden = false;
  if (duration) speechTimeout = setTimeout(() => { bubble.hidden = true; }, duration);
}
function hideSpeech() {
  clearTimeout(speechTimeout);
  document.getElementById('speech-bubble').hidden = true;
}

function markCheck(index) {
  const dot = document.querySelector('.check-dot[data-index="' + index + '"]');
  if (dot) {
    dot.classList.add('resolved');
    dot.textContent = '✓';
    dot.style.transform = 'scale(1.3)';
    setTimeout(() => dot.style.transform = 'scale(1)', 300);
  }
}

// --- Background change ---
function changeBg(filename) {
  const img = document.querySelector('#panorama img.bg');
  if (img) {
    img.style.transition = 'opacity 0.3s';
    img.style.opacity = '0.5';
    setTimeout(() => {
      img.src = 'assets/' + filename;
      img.onload = () => {
        const panorama = document.getElementById('panorama');
        const panH = panorama.clientHeight;
        const scale = panH / IMG_H;
        S.panWidth = Math.round(img.naturalWidth * scale);
        panorama.style.width = S.panWidth + 'px';
        updatePanorama();
        img.style.opacity = '1';
      };
    }, 150);
  }
}

// --- Hotspots ---
function clearHotspots() {
  document.querySelectorAll('.hotspot').forEach(h => h.remove());
}

function createHotspot(h) {
  const panorama = document.getElementById('panorama');
  const el = document.createElement('div');
  el.className = 'hotspot';
  el.id = 'hotspot-' + h.id;
  el.style.left = h.xPct + '%';
  el.style.top = h.yPct + '%';

  const ring = document.createElement('div');
  ring.className = 'hotspot-ring';
  ring.innerHTML = ICONS[h.icon] || '';
  el.appendChild(ring);
  panorama.appendChild(el);

  let hotspotTouchId = null;
  let hotspotStartX = 0;

  el.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    hotspotTouchId = e.changedTouches[0].identifier;
    hotspotStartX = e.changedTouches[0].clientX;
  }, { passive: false });

  el.addEventListener('touchend', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const t = Array.from(e.changedTouches).find(tt => tt.identifier === hotspotTouchId);
    if (!t) return;
    if (Math.abs(t.clientX - hotspotStartX) < 15) {
      onHotspotTap(h.id, el);
    }
    hotspotTouchId = null;
  });

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    onHotspotTap(h.id, el);
  });
}

function onHotspotTap(hotspotId, el) {
  const step = STEPS[S.currentStep];
  const isCurrentStepHotspot = step.hotspots.some(h => h.id === hotspotId);
  if (!isCurrentStepHotspot) return;

  if (step.id === 'outfit') {
    openOutfitModal();
    return;
  }

  el.remove();
  S.stepHotspotsResolved++;

  if (step.resolveAny || S.stepHotspotsResolved >= step.hotspots.length) {
    advanceStep(window.innerWidth / 2, window.innerHeight / 2);
  } else {
    colorFlush('#4CAF50', '0.15');
    vibrate('light');
    showSpeech('¡Bien! Pero falta algo más...', 1500);
  }
}

// --- Pet asset ---
function createPetAsset() {
  const panorama = document.getElementById('panorama');
  const pet = document.createElement('div');
  pet.id = 'pet-asset';
  // Position: 70% X, 78% Y (bajado 10px respecto al original)
  pet.style.cssText = 'position:absolute; left:70%; top:78%; transform:translate(-50%,-50%); z-index:12; pointer-events:none;';
  const img = document.createElement('img');
  img.src = 'assets/pet_dog.png';
  img.style.cssText = 'width:60px; height:auto; animation: petBounce 0.6s ease-in-out infinite alternate;';
  pet.appendChild(img);
  panorama.appendChild(pet);
}

function createComputerBlink() {
  const panorama = document.getElementById('panorama');
  const blink = document.createElement('div');
  blink.id = 'computer-blink';
  blink.style.cssText = 'position:absolute; left:54%; top:55%; width:12px; height:12px; border-radius:50%; background:#00E6BC; z-index:14; animation: computerBlink 0.8s ease-in-out infinite alternate; pointer-events:none;';
  panorama.appendChild(blink);
}

// --- Preload all Luca images ---
const LUCA_IMAGES = [
  'assets/luca_pijama_happy.png',
  'assets/luca_pijama_worried.png',
  'assets/luca_happy.png',
  'assets/luca_worried.png',
  'assets/luca_celebrating.png',
  'assets/luca_dressed_messy.png',
];
const preloadedImages = {};
function preloadImages() {
  LUCA_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
    preloadedImages[src] = img;
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  preloadImages();
  document.getElementById('btn-start').addEventListener('click', startPhase1);
  document.getElementById('btn-retry').addEventListener('click', () => { resetGame(); showScreen('intro'); });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes petBounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
    @keyframes computerBlink { from { opacity: 1; transform: scale(1); } to { opacity: 0.3; transform: scale(0.7); } }
  `;
  document.head.appendChild(style);
});

function startPhase1() {
  S.phase = 'PHASE1';
  S.currentStep = 0;
  S.stepHotspotsResolved = 0;
  lucaPrefix = 'pijama_';
  lucaGroomed = false;
  showScreen('play');
  setLuca('worried');
  buildPanorama();
}

// --- Panorama ---
function buildPanorama() {
  const container = document.getElementById('panorama-container');
  const panorama = document.getElementById('panorama');
  panorama.innerHTML = '';

  const img = document.createElement('img');
  img.className = 'bg';
  img.src = 'assets/bg_panorama.jpg';
  panorama.appendChild(img);

  img.onload = () => {
    const panH = panorama.clientHeight;
    const scale = panH / IMG_H;
    S.panWidth = Math.round(img.naturalWidth * scale);
    S.viewW = container.clientWidth;
    panorama.style.width = S.panWidth + 'px';
    S.panOffsetX = -(S.panWidth - S.viewW) / 2;
    updatePanorama();
    createPetAsset();
    // Computer blink NOT created at start — only when notifications step begins
    initDrag();
    setTimeout(() => showStep(0), 500);
  };
  if (img.complete && img.naturalWidth) img.onload();
}

function updatePanorama() {
  const minX = -(S.panWidth - S.viewW);
  S.panOffsetX = Math.max(minX, Math.min(0, S.panOffsetX));
  document.getElementById('panorama').style.transform = 'translateX(' + S.panOffsetX + 'px)';
}

// --- Steps ---
function showStep(index) {
  if (index >= STEPS.length) return;
  S.currentStep = index;
  S.stepHotspotsResolved = 0;
  const step = STEPS[index];

  clearHotspots();
  setLuca('happy');
  showSpeech(step.msg);

  // Run onStart if defined
  if (step.onStart) step.onStart();

  // Groom step: enable tap on Luca with arrow on head
  if (step.id === 'groom') {
    setLuca('dressed_messy');
    enableLucaTap();
    return;
  }

  setTimeout(() => {
    step.hotspots.forEach(h => createHotspot(h));
  }, 1200);
}

function advanceStep(screenX, screenY) {
  const step = STEPS[S.currentStep];
  clearHotspots();
  disableLucaTap();
  colorFlush('#4CAF50', '0.25');
  addScore(100, screenX, screenY);
  markCheck(S.currentStep);
  vibrate('success');
  setLuca('celebrating');
  showSpeech(step.resolveMsg, 2000);
  if (step.onResolve) step.onResolve();

  setTimeout(() => {
    if (S.currentStep + 1 < STEPS.length) {
      showStep(S.currentStep + 1);
    }
  }, 2200);
}

// --- Luca tap (for groom step) ---
let lucaTapEnabled = false;
function enableLucaTap() {
  lucaTapEnabled = true;
  const luca = document.getElementById('luca');
  luca.style.pointerEvents = 'auto';
  luca.style.cursor = 'pointer';
  // Add pulsing ring on Luca's head
  let ring = document.getElementById('luca-groom-ring');
  if (!ring) {
    ring = document.createElement('div');
    ring.id = 'luca-groom-ring';
    ring.className = 'hotspot-ring';
    // Arrow pointing down at the hair
    ring.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2l-5 9h3v7h4v-7h3z" fill="currentColor" transform="rotate(180 12 12)"/></svg>';
    ring.style.cssText = 'position:absolute; top:-15px; left:50%; transform:translateX(-50%); z-index:25;';
    luca.appendChild(ring);
  }

  const handler = (e) => {
    if (!lucaTapEnabled) return;
    e.stopPropagation();
    lucaTapEnabled = false;
    const ringEl = document.getElementById('luca-groom-ring');
    if (ringEl) ringEl.remove();
    luca.style.pointerEvents = 'none';
    luca.style.cursor = '';
    advanceStep(window.innerWidth / 2, window.innerHeight / 3);
  };
  luca.onclick = handler;
  luca.ontouchend = (e) => { e.preventDefault(); handler(e); };
}

function disableLucaTap() {
  lucaTapEnabled = false;
  const luca = document.getElementById('luca');
  if (luca) {
    luca.style.pointerEvents = 'none';
    luca.style.cursor = '';
    luca.onclick = null;
    luca.ontouchend = null;
  }
  const ring = document.getElementById('luca-groom-ring');
  if (ring) ring.remove();
}

// --- Drag handling ---
function initDrag() {
  const container = document.getElementById('panorama-container');
  let touchId = null, startX = 0, startOff = 0, lastX = 0, lastT = 0, isDrag = false;

  container.addEventListener('touchstart', e => {
    if (S.phase !== 'PHASE1') return;
    if (touchId !== null) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    startX = lastX = t.clientX;
    startOff = S.panOffsetX;
    lastT = Date.now();
    isDrag = false;
    S.velocity = 0;
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (S.phase !== 'PHASE1') return;
    const t = Array.from(e.changedTouches).find(tt => tt.identifier === touchId);
    if (!t) return;
    const dx = t.clientX - startX;
    if (!isDrag && Math.abs(dx) > 8) isDrag = true;
    if (!isDrag) return;
    const now = Date.now(), dt = now - lastT || 16;
    S.velocity = (t.clientX - lastX) / dt * 16;
    lastX = t.clientX; lastT = now;
    S.panOffsetX = startOff + dx;
    updatePanorama();
  }, { passive: true });

  container.addEventListener('touchend', e => {
    if (S.phase !== 'PHASE1') return;
    const t = Array.from(e.changedTouches).find(tt => tt.identifier === touchId);
    if (!t) return;
    touchId = null;
    if (!isDrag) handlePhase1Tap(t.clientX, t.clientY);
    else startInertia();
  });

  let mDown = false;
  container.addEventListener('mousedown', e => {
    if (S.phase !== 'PHASE1') return;
    mDown = true; startX = lastX = e.clientX; startOff = S.panOffsetX; lastT = Date.now(); isDrag = false; S.velocity = 0;
  });
  container.addEventListener('mousemove', e => {
    if (!mDown || S.phase !== 'PHASE1') return;
    const dx = e.clientX - startX;
    if (!isDrag && Math.abs(dx) > 8) isDrag = true;
    if (!isDrag) return;
    const now = Date.now(), dt = now - lastT || 16;
    S.velocity = (e.clientX - lastX) / dt * 16;
    lastX = e.clientX; lastT = now;
    S.panOffsetX = startOff + dx;
    updatePanorama();
  });
  container.addEventListener('mouseup', e => {
    if (!mDown || S.phase !== 'PHASE1') return;
    mDown = false;
    if (!isDrag) handlePhase1Tap(e.clientX, e.clientY);
    else startInertia();
  });
}

function startInertia() {
  (function frame() {
    if (Math.abs(S.velocity) < 0.5) return;
    S.velocity *= 0.92;
    S.panOffsetX += S.velocity;
    updatePanorama();
    requestAnimationFrame(frame);
  })();
}

// --- Phase 1 tap (background, not hotspot) ---
function handlePhase1Tap(screenX, screenY) {
  const step = STEPS[S.currentStep];
  const panX = screenX - S.panOffsetX;
  const pctX = (panX / S.panWidth) * 100;

  // Zone step
  if (step.id === 'zone') {
    if (pctX >= NEUTRAL_ZONE.xMin) {
      setLuca('celebrating');
      showSpeech(step.resolveMsg, 1500);
      clearHotspots();
      colorFlush('#4CAF50', '0.25');
      addScore(100, screenX, screenY);
      markCheck(S.currentStep);
      vibrate('success', [0, 80, 40, 80, 40, 200]);
      setTimeout(() => startPhase2(), 1500);
      return;
    }
    for (const z of BAD_ZONES) {
      if (pctX >= z.xMin && pctX < z.xMax) {
        colorFlush('#E53935', '0.2');
        setLuca('worried');
        showSpeech(z.msg, 2500);
        vibrate('error');
        setTimeout(() => setLuca('happy'), 800);
        return;
      }
    }
    // Tap on any other area
    showSpeech('Busca una pared limpia y neutra. Desliza hacia la derecha del todo.', 2500);
    vibrate('light');
    return;
  }

  // Groom step: hint
  if (step.id === 'groom') {
    showSpeech(WRONG_TAP_MSGS.groom, 2000);
    vibrate('light');
    return;
  }

  // Default: wrong tap hint
  const msg = WRONG_TAP_MSGS[step.id] || 'Busca lo que está parpadeando...';
  setLuca('worried');
  showSpeech(msg, 2000);
  vibrate('light');
  setTimeout(() => setLuca('happy'), 600);
}

// --- Outfit modal ---
function openOutfitModal() {
  S.phase = 'OUTFIT_MODAL';
  const modal = document.getElementById('outfit-modal');
  modal.hidden = false;
  modal.classList.add('active');
  document.getElementById('outfit-feedback').hidden = true;

  modal.querySelectorAll('.outfit-card').forEach(card => {
    card.onclick = () => handleOutfitChoice(card.dataset.outfit);
  });
  document.getElementById('btn-outfit-understood').onclick = () => {
    document.getElementById('outfit-feedback').hidden = true;
  };
}

function handleOutfitChoice(choice) {
  if (choice === 'a') {
    S.outfitChosen = true;
    const modal = document.getElementById('outfit-modal');
    modal.hidden = true;
    modal.classList.remove('active');
    S.phase = 'PHASE1';

    // Dressed but messy hair
    lucaPrefix = '';
    setLuca('dressed_messy');
    clearHotspots();
    colorFlush('#4CAF50', '0.25');
    addScore(100, window.innerWidth / 2, window.innerHeight / 2);
    markCheck(S.currentStep);
    vibrate('success');
    showSpeech(STEPS[S.currentStep].resolveMsg, 2000);

    setTimeout(() => {
      if (S.currentStep + 1 < STEPS.length) {
        showStep(S.currentStep + 1);
      }
    }, 2200);
  } else {
    vibrate('error');
    const fb = document.getElementById('outfit-feedback');
    const fbText = document.getElementById('outfit-feedback-text');
    fb.hidden = false;
    fbText.textContent = choice === 'b'
      ? 'El pijama a cámara transmite que no te tomaste en serio la candidatura. El recruiter también lo verá así.'
      : 'El traje y corbata puede sonar impostado en un vídeo grabado en casa. Ropa limpia y apropiada para el sector ya es suficiente.';
  }
}

// ===========================
// PHASE 2: Cards in groups of 3
// ===========================

function buildRounds() {
  const bads = [...PHASE2_CARDS.filter(c => c.bad)].sort(() => Math.random() - 0.5);
  const goods = [...PHASE2_CARDS.filter(c => !c.bad)].sort(() => Math.random() - 0.5);
  const rounds = [];
  const badPerRound = [1, 2, 1, 2]; // 6 bads across 4 rounds
  let bi = 0, gi = 0;
  for (let r = 0; r < 4; r++) {
    const round = [];
    for (let j = 0; j < badPerRound[r] && bi < bads.length; j++) round.push(bads[bi++]);
    while (round.length < 3 && gi < goods.length) round.push(goods[gi++]);
    round.sort(() => Math.random() - 0.5);
    rounds.push(round);
  }
  return rounds;
}

function startPhase2() {
  S.phase = 'PHASE2';
  S.recResults = [];
  S.recRoundIndex = 0;
  S.recRounds = buildRounds();
  showScreen('recording');
  hideSpeech();
  setLuca('celebrating');

  const sidebar = document.getElementById('error-sidebar');
  sidebar.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('div');
    slot.className = 'error-slot';
    slot.dataset.slot = i;
    sidebar.appendChild(slot);
  }

  // Intro — use #rec-content (above camera-frame, z-index 140)
  const container = document.getElementById('rec-content');
  container.innerHTML = '';

  const intro = document.createElement('div');
  intro.style.cssText = 'text-align:center;';
  intro.innerHTML =
    '<p style="font-size:18px;font-weight:800;margin-bottom:12px;color:#FFFFAB;">La grabación</p>' +
    '<p style="font-size:15px;font-weight:600;line-height:1.6;margin-bottom:20px;">' +
    'Aparecerán 3 frases en cada ronda.<br>' +
    'Toca <span style="color:#E74C3C;font-weight:800;">las que están MAL</span> para eliminarlas.<br>' +
    'No toques las que están bien.<br>' +
    'Cuando hayas terminado, pulsa Siguiente.</p>' +
    '<button class="btn-primary" id="btn-rec-start" style="max-width:220px;font-size:16px;padding:12px;">¡Grabar!</button>';
  container.appendChild(intro);

  document.getElementById('btn-rec-start').addEventListener('click', () => {
    intro.remove();
    showRound();
  });
}

function showRound() {
  if (S.recRoundIndex >= S.recRounds.length) {
    endPhase2();
    return;
  }

  const round = S.recRounds[S.recRoundIndex];
  const container = document.getElementById('rec-content');
  container.innerHTML = '';

  // Update HUD
  const timer = document.getElementById('rec-timer');
  if (timer) timer.textContent = 'Ronda ' + (S.recRoundIndex + 1) + '/4';

  // Round label
  const label = document.createElement('div');
  label.textContent = 'Elimina lo que está mal:';
  label.style.cssText = 'font-size:14px;font-weight:700;color:#FFFFAB;margin-bottom:12px;';
  container.appendChild(label);

  // 3 cards
  const tapped = new Set();

  round.forEach((card, i) => {
    const el = document.createElement('div');
    el.style.cssText = 'width:100%;background:rgba(11,33,74,0.92);border:3px solid rgba(255,255,255,0.4);border-radius:12px;padding:12px 16px;color:#fff;font-weight:700;font-size:14px;text-align:center;cursor:pointer;margin-bottom:8px;transition:background 0.3s,border-color 0.3s,color 0.3s;';
    el.textContent = card.text;
    container.appendChild(el);

    el.addEventListener('click', () => {
      if (tapped.has(i)) return;
      tapped.add(i);

      if (card.bad) {
        el.style.background = 'rgba(76, 175, 80, 0.35)';
        el.style.borderColor = '#4CAF50';
        el.style.color = '#4CAF50';
        el.textContent = '✓ Eliminado';
        el.style.pointerEvents = 'none';
        addScore(50, window.innerWidth / 2, el.getBoundingClientRect().top);
        vibrate('success');
        colorFlush('#4CAF50', '0.1');
      } else {
        el.style.background = 'rgba(231, 76, 60, 0.35)';
        el.style.borderColor = '#E74C3C';
        el.style.color = '#E74C3C';
        el.textContent = '✗ ¡Eso estaba bien!';
        el.style.pointerEvents = 'none';
        addScore(-25);
        vibrate('error');
        colorFlush('#E53935', '0.1');
      }
    });
  });

  // "Siguiente" button
  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.textContent = S.recRoundIndex < 3 ? 'Siguiente ›' : 'Ver resultado';
  btn.style.cssText = 'max-width:200px;font-size:15px;padding:10px 20px;margin-top:12px;';
  container.appendChild(btn);

  btn.addEventListener('click', () => {
    resolveRound(round, tapped);
  });
}

function resolveRound(round, tapped) {
  const roundIdx = S.recRoundIndex;
  let hasMistake = false;

  round.forEach((card, i) => {
    if (tapped.has(i)) {
      // Was tapped
      if (card.bad) {
        S.recResults.push({ card, tapped: true, bad: true }); // correct
      } else {
        S.recResults.push({ card, tapped: true, bad: false }); // mistake
        hasMistake = true;
      }
    } else {
      // Was NOT tapped
      if (card.bad) {
        S.recResults.push({ card, tapped: false, bad: true }); // missed — mistake
        hasMistake = true;
      } else {
        S.recResults.push({ card, tapped: false, bad: false }); // correct
        addScore(25);
      }
    }
  });

  // Update round slot
  const slot = document.querySelector('.error-slot[data-slot="' + roundIdx + '"]');
  if (slot) {
    slot.textContent = hasMistake ? '✗' : '✓';
    slot.className = 'error-slot ' + (hasMistake ? 'fail' : 'success');
  }

  S.recRoundIndex++;

  // Brief pause then next round
  const frame = document.getElementById('camera-frame');
  frame.querySelectorAll('.rec-btn-next').forEach(e => e.remove());

  setTimeout(() => showRound(), 500);
}

function endPhase2() {
  S.recTimers.forEach(clearTimeout);
  S.recTimers = [];
  vibrate('medium', [0, 100, 50, 100]);
  setTimeout(() => showResults(), 800);
}

// --- Results ---
function showResults() {
  S.phase = 'RESULTS';
  showScreen('results');

  const tier = S.score >= 800 ? 'high' : S.score >= 600 ? 'mid' : 'low';

  document.getElementById('results-avatar').src =
    tier === 'high' ? 'assets/luca_celebrating.png' :
    tier === 'mid' ? 'assets/luca_happy.png' :
    'assets/luca_worried.png';

  document.getElementById('results-title').textContent =
    tier === 'high' ? 'Vídeo currículum grabado' :
    tier === 'mid' ? 'Primera toma completada' :
    'Hay margen de mejora';

  document.getElementById('results-score').textContent = S.score + ' pts';

  document.getElementById('results-speech-text').textContent =
    tier === 'high' ? '¡Esto sí es un vídeo currículum! Fondo limpio, sin errores, sin papel. Así se genera una llamada.' :
    tier === 'mid' ? 'Buena toma. El entorno está bien preparado — repasa los errores de grabación para que la siguiente toma sea perfecta.' :
    'Queda trabajo. Revisa los errores que se colaron — cada uno es una razón menos para que el recruiter llame.';

  const recordEl = document.getElementById('results-record');
  if (S.score > S.record) {
    S.record = S.score;
    localStorage.setItem('la_toma_perfecta_record', S.record);
    recordEl.textContent = 'Nuevo récord: ' + S.record + ' pts';
    recordEl.hidden = false;
  } else {
    recordEl.hidden = true;
  }

  // Error panels — show mistakes
  const panel = document.getElementById('results-errors-panel');
  panel.innerHTML = '';

  S.recResults.forEach((r, i) => {
    if (!r) return;
    // Show: missed bad cards + tapped good cards
    const isMistake = (r.bad && !r.tapped) || (!r.bad && r.tapped);
    if (!isMistake) return;

    const item = document.createElement('div');
    item.className = 'error-panel-item';

    if (r.bad && !r.tapped) {
      // Missed a bad thing
      item.innerHTML =
        '<div class="error-panel-header"><span>No detectaste: ' + r.card.text + '</span><span>▼</span></div>' +
        '<div class="error-panel-body">' +
        '<p><strong>Por qué está mal:</strong> ' + r.card.failMsg + '</p>' +
        '<p style="margin-top:6px"><strong>La regla:</strong> ' + r.card.rule + '</p></div>';
    } else {
      // Tapped a good thing
      item.innerHTML =
        '<div class="error-panel-header"><span>Quitaste algo bueno: ' + r.card.text + '</span><span>▼</span></div>' +
        '<div class="error-panel-body"><p>Eso era correcto — no había que tocarlo. Recuerda: solo quita lo que está mal.</p></div>';
    }

    item.querySelector('.error-panel-header').addEventListener('click', () => {
      item.querySelector('.error-panel-body').classList.toggle('open');
    });
    panel.appendChild(item);
  });
}

// --- Reset ---
function resetGame() {
  S.score = 0;
  S.currentStep = 0;
  S.stepHotspotsResolved = 0;
  S.outfitChosen = false;
  S.recResults = [];
  S.recCardIndex = 0;
  S.velocity = 0;
  S.taskFired = false;
  lucaPrefix = 'pijama_';
  lucaGroomed = false;
  S.recTimers.forEach(clearTimeout);
  S.recTimers = [];
  clearInterval(S.recInterval);
  disableLucaTap();
  document.querySelectorAll('.check-dot').forEach(d => {
    d.classList.remove('resolved');
    d.textContent = '○';
  });
  const hud = document.getElementById('hud-score');
  if (hud) hud.textContent = '0 pts';
}
