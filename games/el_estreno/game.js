// ============================================
// EL ESTRENO — game.js
// Checklist de arranque HVAC — S5D4-PM
// ============================================

// --- Haptic helper ---
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    if (pattern) navigator.vibrate(pattern);
    else {
      const durations = { light: 30, medium: 60, heavy: 100, success: 50, error: 80 };
      navigator.vibrate(durations[level] || 50);
    }
  }
}

// --- TASK_COMPLETED ---
function taskCompleted() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

// --- Screen switching ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'results') {
    document.documentElement.classList.add('results');
  } else {
    document.documentElement.classList.remove('results');
  }
}

// ============================================
// CARD DATA — 20 tarjetas
// ============================================
const ALEX = {
  happy:    'https://res.cloudinary.com/kampe/image/upload/v1772704976/Alex_happy_lu9vx2.png',
  worried:  'https://res.cloudinary.com/kampe/image/upload/v1772705008/Alex_worried_bcm52p.png',
  base:     'https://res.cloudinary.com/kampe/image/upload/v1772704991/Alex_base_zathyx.png',
};

const CDN = 'https://res.cloudinary.com/kampe/image/upload/';
const ICONS = {
  nivel:              CDN + 'v1774354398/icon_level_nrxzk4.png',
  tornillo:           CDN + 'v1774354392/icon_tornillo_j0x1il.png',
  muelle:             CDN + 'v1774354392/icon_muelle_hilgk4.png',
  ruta:               CDN + 'v1774354392/icon_ruta_h6jfaf.png',
  pendiente:          CDN + 'v1774354392/icon_pendiente_kkehbb.png',
  sifon:              CDN + 'v1774354387/icon_sifon_nqnuvg.png',
  coquilla:           CDN + 'v1774354387/icon_coquilla_fzr5rd.png',
  pasamuros:          CDN + 'v1774354386/icon_pasamuros_vubkko.png',
  tironcito:          CDN + 'v1774354386/icon_tironcito_easqrj.png',
  colores:            CDN + 'v1774354386/icon_colores_bgafvj.png',
  filtro:             CDN + 'v1774354386/icon_filtro_q247wy.png',
  area:               CDN + 'v1774354382/icon_area_rezegd.png',
  fallo_tornillo:     CDN + 'v1774354381/icon_fallo_tornillo_bimejk.png',
  fallo_nivel:        CDN + 'v1774354381/icon_fallo_nivel_bbkwjm.png',
  fallo_bolsa:        CDN + 'v1774354381/icon_fallo_bolsa_pwjwc0.png',
  fallo_sifon:        CDN + 'v1774354380/icon_fallo_sifon_eakm5j.png',
  fallo_coquilla:     CDN + 'v1774354381/icon_fallo_coquilla_kbzvjn.png',
  fallo_cable:        CDN + 'v1774354380/icon_fallo_cable_qmn6b1.png',
  fallo_filtro:       CDN + 'v1774354381/icon_fallo_filtro_zf4fev.png',
  fallo_herramienta:  CDN + 'v1774354381/icon_fallo_herramienta_rhwep5.png',
};

const CARDS = [
  // ---- FASE 1: solo FIJACIONES activo ----
  {
    id: 'fij_1', bloque: 'fij', tipo: 'check', orden: 0,
    texto: 'Nivelación perfecta', icono: ICONS.nivel,
    feedback: {
      what: 'Pusiste este check en un bloque incorrecto o fuera de orden.',
      why: 'La nivelación es el primer check de Fijaciones. Sin unidad nivelada, el drenaje nunca irá recto.',
      rule: 'Bloque 1 — Fijaciones: primero nivelar.',
    }
  },
  {
    id: 'fij_f1', bloque: 'fij', tipo: 'fallo', orden: null,
    texto: 'Tornillo sin apretar', icono: ICONS.fallo_tornillo,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'Los tornillos sueltos se detectan en el Bloque 1 — Fijaciones. Es lo primero que miras cuando algo vibra.',
      rule: 'Fallo de FIJACIONES — tornillería floja.',
    }
  },
  {
    id: 'fij_2', bloque: 'fij', tipo: 'check', orden: 1,
    texto: 'Anclajes firmes', icono: ICONS.tornillo,
    feedback: {
      what: 'Pusiste este check antes de que el anterior estuviese confirmado.',
      why: 'Los anclajes van después de nivelar. Sin nivel correcto, los anclajes no sirven.',
      rule: 'Fijaciones: nivelar → anclajes.',
    }
  },
  {
    id: 'fij_3', bloque: 'fij', tipo: 'check', orden: 2,
    texto: 'Antivibradores OK', icono: ICONS.muelle,
    feedback: {
      what: 'Pusiste los antivibradores antes de confirmar los anclajes.',
      why: 'Los antivibradores se comprueban después de que los anclajes estén apretados.',
      rule: 'Fijaciones: anclajes → antivibradores.',
    }
  },
  {
    id: 'fij_f2', bloque: 'fij', tipo: 'fallo', orden: null,
    texto: 'Unidad inclinada', icono: ICONS.fallo_nivel,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'La inclinación incorrecta se detecta en el Bloque 1 — Fijaciones, en el check de nivelación.',
      rule: 'Fallo de FIJACIONES — nivelación incorrecta.',
    }
  },
  {
    id: 'fij_4', bloque: 'fij', tipo: 'check', orden: 3,
    texto: 'Rutas sin tensión', icono: ICONS.ruta,
    feedback: {
      what: 'Pusiste las rutas antes de confirmar antivibradores.',
      why: 'Las tensiones en la ruta se detectan con todo fijado.',
      rule: 'Fijaciones: antivibradores → rutas.',
    }
  },
  // ---- FASE 2: DRE + ELE desbloqueados ----
  {
    id: 'dre_1', bloque: 'dre', tipo: 'check', orden: 0,
    texto: 'Pendiente continua 1-2%', icono: ICONS.pendiente,
    feedback: {
      what: 'Pusiste este check en el bloque equivocado o fuera de orden.',
      why: 'La pendiente es el primer check de drenaje. Sin pendiente confirmada, el sifón no tiene sentido.',
      rule: 'Drenaje: primero comprobar pendiente.',
    }
  },
  {
    id: 'dre_f1', bloque: 'dre', tipo: 'fallo', orden: null,
    texto: 'Bolsa de agua en U', icono: ICONS.fallo_bolsa,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'La bolsa de agua en U es un fallo de drenaje — se detecta al comprobar la pendiente continua.',
      rule: 'Fallo de DRENAJE — pendiente incorrecta.',
    }
  },
  {
    id: 'dre_2', bloque: 'dre', tipo: 'check', orden: 1,
    texto: 'Sifón correcto', icono: ICONS.sifon,
    feedback: {
      what: 'Pusiste el sifón antes de confirmar la pendiente.',
      why: 'El sifón se comprueba después de confirmar la pendiente.',
      rule: 'Drenaje: pendiente → sifón.',
    }
  },
  {
    id: 'ele_1', bloque: 'ele', tipo: 'check', orden: 0,
    texto: 'Tironcito a cables', icono: ICONS.tironcito,
    feedback: {
      what: 'Pusiste este check en el bloque equivocado o fuera de orden.',
      why: 'El tironcito a cables es el primer check eléctrico — siempre sin tensión.',
      rule: 'Eléctrico: primero comprobar apriete de bornes.',
    }
  },
  {
    id: 'dre_f2', bloque: 'dre', tipo: 'fallo', orden: null,
    texto: 'Sifón sin sello de agua', icono: ICONS.fallo_sifon,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'El sifón sin sello de agua es un fallo del Bloque 2 — permite que los olores entren.',
      rule: 'Fallo de DRENAJE — sifón defectuoso.',
    }
  },
  {
    id: 'dre_3', bloque: 'dre', tipo: 'check', orden: 2,
    texto: 'Coquilla continua', icono: ICONS.coquilla,
    feedback: {
      what: 'Pusiste la coquilla antes de confirmar el sifón.',
      why: 'La coquilla se revisa después del sifón — es el aislamiento del recorrido ya verificado.',
      rule: 'Drenaje: sifón → coquilla.',
    }
  },
  {
    id: 'ele_2', bloque: 'ele', tipo: 'check', orden: 1,
    texto: 'Colores correctos L/N/PE', icono: ICONS.colores,
    feedback: {
      what: 'Pusiste los colores antes de confirmar el apriete.',
      why: 'Los colores se verifican después de confirmar el apriete — si un cable está flojo, el color no importa.',
      rule: 'Eléctrico: tironcito → colores.',
    }
  },
  {
    id: 'dre_f3', bloque: 'dre', tipo: 'fallo', orden: null,
    texto: 'Coquilla con hueco', icono: ICONS.fallo_coquilla,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'La coquilla con hueco es un fallo del Bloque 2 — sin aislamiento continuo hay condensación.',
      rule: 'Fallo de DRENAJE — coquilla incompleta.',
    }
  },
  {
    id: 'dre_4', bloque: 'dre', tipo: 'check', orden: 3,
    texto: 'Pasamuros sellado', icono: ICONS.pasamuros,
    feedback: {
      what: 'Pusiste el pasamuros antes de confirmar la coquilla.',
      why: 'El pasamuros se sella al final del bloque de drenaje.',
      rule: 'Drenaje: coquilla → pasamuros.',
    }
  },
  // ---- FASE 3: iconos ocultos ----
  {
    id: 'ele_3', bloque: 'ele', tipo: 'check', orden: 2,
    texto: 'Filtros limpios', icono: ICONS.filtro,
    feedback: {
      what: 'Pusiste los filtros antes de verificar colores.',
      why: 'Los filtros se comprueban antes de la limpieza final, después de verificar el cableado.',
      rule: 'Eléctrico: colores → filtros.',
    }
  },
  {
    id: 'ele_f1', bloque: 'ele', tipo: 'fallo', orden: null,
    texto: 'Cable sin identificar', icono: ICONS.fallo_cable,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'Los cables sin identificar son un fallo del Bloque 3 — se detectan al comprobar colores L/N/PE.',
      rule: 'Fallo de ELÉCTRICO — cableado sin marcar.',
    }
  },
  {
    id: 'ele_f2', bloque: 'ele', tipo: 'fallo', orden: null,
    texto: 'Filtro sucio', icono: ICONS.fallo_filtro,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'El filtro sucio es un fallo del Bloque 3 — reduce el caudal desde el primer arranque.',
      rule: 'Fallo de ELÉCTRICO — mantenimiento pendiente.',
    }
  },
  {
    id: 'ele_4', bloque: 'ele', tipo: 'check', orden: 3,
    texto: 'Área despejada', icono: ICONS.area,
    feedback: {
      what: 'Pusiste el área despejada antes de confirmar los filtros.',
      why: 'El área despejada es el último check antes de dar corriente.',
      rule: 'Eléctrico: filtros → área despejada.',
    }
  },
  {
    id: 'ele_f3', bloque: 'ele', tipo: 'fallo', orden: null,
    texto: 'Herramientas dentro', icono: ICONS.fallo_herramienta,
    feedback: {
      what: 'Mandaste este fallo al bloque equivocado.',
      why: 'Herramientas dentro de la unidad — fallo del Bloque 3, área despejada. El error más peligroso.',
      rule: 'Fallo de ELÉCTRICO — área no despejada.',
    }
  },
];

// ============================================
// CONSTANTS
// ============================================
const ACIERTO_MSGS = ['Bien.', 'Correcto.', 'Justo ahí.', 'Perfecto.'];
const TIMER_CARD   = 6000; // ms por tarjeta en fases 1 y 3
const TIMER_ORDER  = 45000; // ms para la fase de ordenación

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================
// GAME STATE
// ============================================
// gamePhase:
//   'checks'  — fase 1: clasificar los 12 checks en columnas (sin orden)
//   'order'   — fase 2: reordenar los checks dentro de cada columna (drag vertical)
//   'fallos'  — fase 3: clasificar los 8 fallos en columnas
let state = {
  lives: 3,
  score: 0,
  cardIndex: 0,
  currentCard: null,
  errorCount: 0,
  gamePhase: 'checks',
  checksSeq: [],   // checks barajados
  fallosSeq: [],   // fallos barajados
  placed: { fij: [], dre: [], ele: [] },
  aciertoCycle: 0,
  taskFired: false,
  orderScored: false,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  timerRaf: null,
  timerStart: 0,
  timerDuration: TIMER_CARD,
  timerPaused: false,
  timerElapsedOnPause: 0,
};

// ============================================
// DOM refs
// ============================================
const elCard       = document.getElementById('falling-card');
const elCardIcon   = document.getElementById('card-icon');
const elCardText   = document.getElementById('card-text');
const elHudScore   = document.getElementById('hud-score');
const elHearts     = [
  document.getElementById('heart-1'),
  document.getElementById('heart-2'),
  document.getElementById('heart-3'),
];
const elSplitUnit    = document.getElementById('split-unit');
const elOverlayError = document.getElementById('overlay-error');
const elOverlayGO    = document.getElementById('overlay-gameover');
const elAlexBubble   = document.getElementById('alex-bubble');
const elAvatarPlay   = document.getElementById('avatar-play');
const elOverlayWhat  = document.getElementById('overlay-what');
const elOverlayWhy   = document.getElementById('overlay-why');
const elOverlayRule  = document.getElementById('overlay-rule');
const elTimerBar     = document.getElementById('timer-bar');

// ============================================
// INIT
// ============================================
document.getElementById('btn-start').addEventListener('click', () => showScreen('level-1'));

document.getElementById('btn-level1-start').addEventListener('click', startGame);
document.getElementById('btn-level2-start').addEventListener('click', startOrderPhase);
document.getElementById('btn-level3-start').addEventListener('click', enterFallosPhase);
document.getElementById('btn-retry').addEventListener('click', restartGame);
document.getElementById('btn-retry-gameover').addEventListener('click', restartGame);
document.getElementById('btn-entendido').addEventListener('click', dismissErrorOverlay);

// ============================================
// START / RESTART
// ============================================
function startGame() {
  // Llamado desde btn-level1-start: prepara estado y arranca checks
  showScreen('play');
  resetState();
  updateHUD();
  ['fij', 'dre', 'ele'].forEach(b => document.getElementById(`col-${b}`).classList.remove('locked'));
  document.getElementById('drop-zone').style.display = '';
  document.getElementById('timer-track').style.display = '';
  spawnNextCard();
}

function restartGame() {
  elOverlayGO.classList.add('hidden');
  elOverlayError.classList.add('hidden');
  showScreen('level-1');
}

function resetState() {
  state.lives = 3;
  state.score = 0;
  state.cardIndex = 0;
  state.errorCount = 0;
  state.gamePhase = 'checks';
  state.checksSeq = shuffle(CARDS.filter(c => c.tipo === 'check'));
  state.fallosSeq = shuffle(CARDS.filter(c => c.tipo === 'fallo'));
  state.placed = { fij: [], dre: [], ele: [] };
  state.aciertoCycle = 0;
  state.taskFired = false;
  state.orderScored = false;
  state.dragging = false;
  state.timerPaused = false;
  state.timerElapsedOnPause = 0;

  elSplitUnit.className = 'fij-pending dre-pending ele-pending';
  ['fij', 'dre', 'ele'].forEach(b => { document.getElementById(`slots-${b}`).innerHTML = ''; });
  elHearts.forEach(h => h.classList.remove('empty', 'losing'));
  elAlexBubble.classList.add('hidden');
  setAvatarState('base');
  document.getElementById('drop-zone').style.display = '';
  document.getElementById('timer-track').style.display = '';
  document.getElementById('btn-confirm-order').classList.add('hidden');
}

// ============================================
// CARD SPAWNING (fases checks y fallos)
// ============================================
function spawnNextCard() {
  const seq = state.gamePhase === 'checks' ? state.checksSeq : state.fallosSeq;

  if (state.cardIndex >= seq.length) {
    if (state.gamePhase === 'checks') {
      // Mostrar pantalla nivel-2 antes de entrar a ordenar
      elCard.style.display = 'none';
      stopTimer();
      setTimeout(() => showScreen('level-2'), 400);
    } else {
      // fallos terminados → resultados
      setTimeout(showResults, 800);
    }
    return;
  }

  state.currentCard = seq[state.cardIndex];
  state.errorCount = 0;
  state.dragging = false;
  state.timerDuration = TIMER_CARD;

  elCardIcon.src = state.currentCard.icono;
  elCardIcon.style.display = 'block';
  elCardText.textContent = state.currentCard.texto;
  elCard.classList.toggle('fail-card', state.currentCard.tipo === 'fallo');

  elCard.style.display = 'flex';
  elCard.style.position = 'absolute';
  elCard.style.transform = 'none';
  requestAnimationFrame(() => {
    positionCardInDropZone();
    startTimer();
  });
}

function positionCardInDropZone() {
  const playRect = document.getElementById('play').getBoundingClientRect();
  const dzRect   = document.getElementById('drop-zone').getBoundingClientRect();
  const cardW    = elCard.offsetWidth  || 150;
  const cardH    = elCard.offsetHeight || 100;
  elCard.style.left = (dzRect.left - playRect.left + (dzRect.width  - cardW) / 2) + 'px';
  elCard.style.top  = (dzRect.top  - playRect.top  + (dzRect.height - cardH) / 2) + 'px';
}

// ============================================
// FASE 2 — ORDENAR (drag vertical dentro de columna)
// ============================================
function startOrderPhase() {
  // Llamado desde btn-level2-start: activa el gameplay de reordenar (sin timer)
  state.gamePhase = 'order';
  showScreen('play');
  elCard.style.display = 'none';
  document.getElementById('drop-zone').style.display = 'none';
  document.getElementById('timer-track').style.display = 'none';

  enableColumnReorder();
}

function enableColumnReorder() {
  ['fij', 'dre', 'ele'].forEach(bloque => {
    const slot = document.getElementById(`slots-${bloque}`);
    Array.from(slot.querySelectorAll('.card-placed.check'))
      .forEach(el => makeDraggableInColumn(el, slot));
  });
  // Sin botón confirmar — la fase avanza sola cuando todo esté en verde
}

const colDrag = { el: null, slot: null, startY: 0, ghost: null };

function makeDraggableInColumn(el, slot) {
  el.classList.add('reorderable');
  el.addEventListener('touchstart', startColDrag, { passive: false });
  el.addEventListener('mousedown',  startColDrag);

  function startColDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    colDrag.el    = el;
    colDrag.slot  = slot;
    colDrag.startY = e.touches ? e.touches[0].clientY : e.clientY;

    colDrag.ghost = el.cloneNode(true);
    colDrag.ghost.classList.add('col-drag-ghost');
    const r = el.getBoundingClientRect();
    const pr = document.getElementById('play').getBoundingClientRect();
    colDrag.ghost.style.top   = (r.top  - pr.top)  + 'px';
    colDrag.ghost.style.left  = (r.left - pr.left) + 'px';
    colDrag.ghost.style.width = r.width + 'px';
    document.getElementById('play').appendChild(colDrag.ghost);
    el.classList.add('col-dragging-src');

    document.addEventListener('touchmove', moveColDrag, { passive: false });
    document.addEventListener('touchend',  endColDrag);
    document.addEventListener('mousemove', moveColDrag);
    document.addEventListener('mouseup',   endColDrag);
  }
}

function moveColDrag(e) {
  e.preventDefault();
  if (!colDrag.ghost) return;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const pr = document.getElementById('play').getBoundingClientRect();
  const or = colDrag.el.getBoundingClientRect();
  colDrag.ghost.style.top = (or.top - pr.top + (clientY - colDrag.startY)) + 'px';

  const checks = Array.from(colDrag.slot.querySelectorAll('.card-placed.check'));
  checks.forEach(c => c.classList.remove('col-drop-target'));
  const target = checks.find(c => {
    const r = c.getBoundingClientRect();
    return clientY >= r.top && clientY <= r.bottom;
  });
  if (target && target !== colDrag.el) target.classList.add('col-drop-target');
}

function endColDrag(e) {
  document.removeEventListener('touchmove', moveColDrag);
  document.removeEventListener('touchend',  endColDrag);
  document.removeEventListener('mousemove', moveColDrag);
  document.removeEventListener('mouseup',   endColDrag);
  if (!colDrag.ghost) return;
  colDrag.ghost.remove();
  colDrag.ghost = null;
  colDrag.el.classList.remove('col-dragging-src');

  const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
  const checks = Array.from(colDrag.slot.querySelectorAll('.card-placed.check'));
  checks.forEach(c => c.classList.remove('col-drop-target'));

  const target = checks.find(c => {
    const r = c.getBoundingClientRect();
    return clientY >= r.top && clientY <= r.bottom;
  });
  if (target && target !== colDrag.el) {
    const r = target.getBoundingClientRect();
    colDrag.slot.insertBefore(colDrag.el,
      clientY < r.top + r.height / 2 ? target : target.nextSibling);
    vibrate('light');
  }
  const movedSlot = colDrag.slot;
  colDrag.el = null;

  // Pista inmediata: comprobar posición dentro de la columna tras el drop
  hintOrderAfterDrop(movedSlot);
}

// Actualiza marcas verde/rojo en una columna y comprueba si todo el orden está completo
function hintOrderAfterDrop(slot) {
  if (!slot) return;
  const bloque = slot.id.replace('slots-', '');
  const els = Array.from(slot.querySelectorAll('.card-placed.check'));
  const correct = CARDS.filter(c => c.bloque === bloque && c.tipo === 'check')
                       .sort((a, b) => a.orden - b.orden);

  els.forEach(el => el.classList.remove('ordered', 'order-wrong'));

  let firstWrong = null;
  els.forEach((el, i) => {
    const ok = correct[i] && correct[i].id === el.dataset.id;
    el.classList.add(ok ? 'ordered' : 'order-wrong');
    if (!ok && !firstWrong) firstWrong = CARDS.find(c => c.id === el.dataset.id);
  });

  if (firstWrong) {
    showAlexBubble(firstWrong.feedback.rule, 'worried');
  } else if (els.length > 0) {
    showAlexBubble('¡Esa columna está en orden!', 'happy');
  }

  // Comprobar si las tres columnas están todas en verde
  checkAllOrderComplete();
}

function checkAllOrderComplete() {
  const allCorrect = ['fij', 'dre', 'ele'].every(bloque => {
    const slot = document.getElementById(`slots-${bloque}`);
    const els = Array.from(slot.querySelectorAll('.card-placed.check'));
    const correct = CARDS.filter(c => c.bloque === bloque && c.tipo === 'check')
                         .sort((a, b) => a.orden - b.orden);
    return els.length === correct.length &&
           els.every((el, i) => correct[i] && correct[i].id === el.dataset.id);
  });

  if (!allCorrect) return;

  // Todo en verde — activar split completo y pasar a nivel 3
  elSplitUnit.classList.add('order-complete');
  ['fij', 'dre', 'ele'].forEach(b => {
    elSplitUnit.classList.remove(`${b}-pending`);
    elSplitUnit.classList.add(`${b}-done`);
  });

  if (!state.orderScored) {
    const total = CARDS.filter(c => c.tipo === 'check').length;
    state.score += total * 50;
    state.orderScored = true;
    updateHUD();
  }

  vibrate('success');
  showAlexBubble('¡Perfecto! Todo en orden. ¡Ahora el nivel 3!', 'happy');
  setTimeout(() => showScreen('level-3'), 2000);
}


function enterFallosPhase() {
  // Llamado desde btn-level3-start: limpia columnas y arranca fallos
  state.gamePhase = 'fallos';
  state.cardIndex = 0;

  // Limpiar columnas — quitar todas las cards de checks/orden
  ['fij', 'dre', 'ele'].forEach(b => {
    document.getElementById(`slots-${b}`).innerHTML = '';
  });
  // Resetear split unit visual
  elSplitUnit.className = 'fij-pending dre-pending ele-pending';

  showScreen('play');
  document.getElementById('drop-zone').style.display = '';
  document.getElementById('timer-track').style.display = '';
  spawnNextCard();
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function startTimer() {
  stopTimer();
  state.timerPaused = false;
  state.timerElapsedOnPause = 0;
  state.timerStart = performance.now();

  function tick() {
    if (state.timerPaused) return;
    const elapsed = performance.now() - state.timerStart + state.timerElapsedOnPause;
    const remaining = Math.max(0, 1 - elapsed / state.timerDuration);
    setTimerBar(remaining);
    if (remaining <= 0) { onCardTimeout(); return; }
    state.timerRaf = requestAnimationFrame(tick);
  }
  state.timerRaf = requestAnimationFrame(tick);
}

function pauseTimer() {
  if (state.timerPaused) return;
  state.timerPaused = true;
  state.timerElapsedOnPause += performance.now() - state.timerStart;
  if (state.timerRaf) { cancelAnimationFrame(state.timerRaf); state.timerRaf = null; }
}

function resumeTimer() {
  if (!state.timerPaused) return;
  state.timerPaused = false;
  state.timerStart = performance.now();
  function tick() {
    if (state.timerPaused) return;
    const elapsed = performance.now() - state.timerStart + state.timerElapsedOnPause;
    const remaining = Math.max(0, 1 - elapsed / state.timerDuration);
    setTimerBar(remaining);
    if (remaining <= 0) { onCardTimeout(); return; }
    state.timerRaf = requestAnimationFrame(tick);
  }
  state.timerRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  state.timerPaused = true;
  if (state.timerRaf) { cancelAnimationFrame(state.timerRaf); state.timerRaf = null; }
  setTimerBar(1);
}

function setTimerBar(fraction) {
  if (!elTimerBar) return;
  elTimerBar.style.width = (fraction * 100) + '%';
  if (fraction > 0.5) elTimerBar.style.background = 'var(--turq)';
  else if (fraction > 0.25) elTimerBar.style.background = 'var(--lemon)';
  else elTimerBar.style.background = 'var(--rojo)';
}

function onCardTimeout() {
  stopTimer();
  vibrate('error', [0, 150, 80, 150]);
  showErrorOverlay(state.currentCard.feedback, 'Se acabó el tiempo sin clasificarla.', true);
}

// ============================================
// SWIPE HANDLING (solo eje X)
// ============================================
elCard.addEventListener('touchstart', onSwipeStart, { passive: false });
elCard.addEventListener('mousedown',  onSwipeStart);

function onSwipeStart(e) {
  e.preventDefault();
  pauseTimer();
  state.dragging = false;
  const touch = e.touches ? e.touches[0] : e;
  state.dragStartX = touch.clientX;
  state.dragStartY = touch.clientY;
  document.addEventListener('touchmove', onSwipeMove, { passive: false });
  document.addEventListener('touchend',  onSwipeEnd);
  document.addEventListener('mousemove', onSwipeMove);
  document.addEventListener('mouseup',   onSwipeEnd);
}

function onSwipeMove(e) {
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  const deltaX = touch.clientX - state.dragStartX;
  const deltaY = touch.clientY - state.dragStartY;
  if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
    state.dragging = true;
    elCard.classList.add('dragging');
  }
  if (state.dragging) {
    const playRect = document.getElementById('play').getBoundingClientRect();
    const cardW = elCard.offsetWidth;
    const cardH = elCard.offsetHeight;
    elCard.style.left = (touch.clientX - playRect.left - cardW / 2) + 'px';
    elCard.style.top  = (touch.clientY - playRect.top  - cardH / 2) + 'px';
    highlightColumnAtPoint(touch.clientX, touch.clientY);
  }
}

function onSwipeEnd(e) {
  document.removeEventListener('touchmove', onSwipeMove);
  document.removeEventListener('touchend',  onSwipeEnd);
  document.removeEventListener('mousemove', onSwipeMove);
  document.removeEventListener('mouseup',   onSwipeEnd);
  elCard.classList.remove('dragging');
  clearColumnHighlights();

  if (!state.dragging) { resumeTimer(); return; }

  const touch = e.changedTouches ? e.changedTouches[0] : e;
  const col = columnAtPoint(touch.clientX, touch.clientY);
  if (!col) { returnCardToCenter(); resumeTimer(); return; }
  tryPlaceCard(col);
}

function columnAtPoint(clientX, clientY) {
  for (const b of ['fij', 'dre', 'ele']) {
    const r = document.getElementById(`col-${b}`).getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return b;
    }
  }
  // Fallback: columna más cercana en X si el dedo está a la altura de las columnas
  const cols = ['fij', 'dre', 'ele'].map(b => ({
    b, r: document.getElementById(`col-${b}`).getBoundingClientRect()
  }));
  const colsRect = document.getElementById('columns').getBoundingClientRect();
  if (clientY >= colsRect.top && clientY <= colsRect.bottom) {
    let closest = null, minDist = Infinity;
    for (const { b, r } of cols) {
      const cx = (r.left + r.right) / 2;
      const dist = Math.abs(clientX - cx);
      if (dist < minDist) { minDist = dist; closest = b; }
    }
    return closest;
  }
  return null;
}

function highlightColumnAtPoint(clientX, clientY) {
  clearColumnHighlights();
  const col = columnAtPoint(clientX, clientY);
  if (col) document.getElementById(`col-${col}`).classList.add('highlight');
}

function clearColumnHighlights() {
  ['fij', 'dre', 'ele'].forEach(b => document.getElementById(`col-${b}`).classList.remove('highlight'));
}

function returnCardToCenter() {
  const playRect = document.getElementById('play').getBoundingClientRect();
  const dzRect   = document.getElementById('drop-zone').getBoundingClientRect();
  const cardW    = elCard.offsetWidth  || 150;
  const cardH    = elCard.offsetHeight || 100;
  elCard.style.left = (dzRect.left - playRect.left + (dzRect.width  - cardW) / 2) + 'px';
  elCard.style.top  = (dzRect.top  - playRect.top  + (dzRect.height - cardH) / 2) + 'px';
  elCard.style.transform = 'none';
}

// ============================================
// PLACEMENT LOGIC
// ============================================
function tryPlaceCard(targetBloque) {
  if (targetBloque !== state.currentCard.bloque) {
    handleWrongBloque(targetBloque);
  } else {
    placeCardSuccess();
  }
}

function handleWrongBloque(targetBloque) {
  state.errorCount++;
  shakeCard();
  vibrate('error');
  if (state.errorCount < 2) {
    returnCardToCenter();
    showAlexBubble(
      state.gamePhase === 'checks'
        ? 'Ese check no va ahí. ¿Fijación, drenaje o eléctrico?'
        : 'Ese fallo no se detecta en ese bloque.',
      'worried'
    );
    resumeTimer();
  } else {
    loseLife();
    showErrorOverlay(state.currentCard.feedback, `Lo pusiste en ${bloqueLabel(targetBloque)}.`, false);
  }
}

function placeCardSuccess() {
  stopTimer();
  state.dragging = false;
  const c = state.currentCard;
  const pts = state.errorCount === 0 ? 100 : 50;
  state.score += pts;
  state.placed[c.bloque].push(c);
  addCardToSlot(c);
  showFloatingPts(`+${pts}`);
  updateHUD();
  vibrate('success');
  setAvatarState('happy');
  setTimeout(() => setAvatarState('base'), 1000);
  elCard.style.display = 'none';
  returnCardToCenter();

  // Actualizar split: si todos los checks de un bloque ya están clasificados, quitar pending
  updateSplitVisual();

  state.cardIndex++;
  setTimeout(spawnNextCard, 400);
}

function updateSplitVisual() {
  ['fij', 'dre', 'ele'].forEach(b => {
    const totalChecks = CARDS.filter(c => c.bloque === b && c.tipo === 'check').length;
    const placed = state.placed[b].filter(c => c.tipo === 'check').length;
    if (placed >= totalChecks && totalChecks > 0) {
      elSplitUnit.classList.remove(`${b}-pending`);
      // No añadir -done todavía; eso lo hace scoreAndFinishOrder cuando el orden es correcto
    }
  });
}

// ============================================
// ERROR OVERLAY
// ============================================
function showErrorOverlay(feedback, whatStr, loseLifeFlag) {
  if (loseLifeFlag) loseLife();
  stopTimer();
  elOverlayWhat.textContent = whatStr || feedback.what;
  elOverlayWhy.textContent  = feedback.why;
  elOverlayRule.textContent = feedback.rule;
  elOverlayError.classList.remove('hidden');
  setAvatarState('worried');
  returnCardToCenter();
}

function dismissErrorOverlay() {
  elOverlayError.classList.add('hidden');
  setAvatarState('base');

  // Fases checks / fallos
  if (state.lives <= 0) { elOverlayGO.classList.remove('hidden'); return; }
  const c = state.currentCard;
  state.placed[c.bloque].push(c);
  addCardToSlot(c);
  updateSplitVisual();
  state.cardIndex++;
  elCard.style.display = 'none';
  returnCardToCenter();
  setTimeout(spawnNextCard, 400);
}

// ============================================
// LIVES
// ============================================
function loseLife() {
  state.lives = Math.max(0, state.lives - 1);
  const h = elHearts[state.lives];
  h.classList.add('losing');
  vibrate('heavy', [0, 200]);
  setTimeout(() => { h.classList.remove('losing'); h.classList.add('empty'); }, 400);
}

// ============================================
// UI HELPERS
// ============================================
function updateHUD() {
  elHudScore.textContent = state.score;
}

function addCardToSlot(c) {
  const slot = document.getElementById(`slots-${c.bloque}`);
  const el = document.createElement('div');
  el.className = `card-placed ${c.tipo}`;
  el.dataset.id = c.id;
  el.innerHTML = `<img src="${c.icono}" alt="" /><span>${c.texto}</span>`;
  slot.appendChild(el);
}

function shakeCard() {
  elCard.classList.remove('shake');
  void elCard.offsetWidth;
  elCard.classList.add('shake');
  elCard.addEventListener('animationend', () => elCard.classList.remove('shake'), { once: true });
}

function showFloatingPts(text) {
  const el = document.createElement('div');
  el.className = 'float-pts';
  el.textContent = text;
  const rect = elCard.getBoundingClientRect();
  const pr   = document.getElementById('play').getBoundingClientRect();
  el.style.left = (rect.left - pr.left + rect.width / 2) + 'px';
  el.style.top  = (rect.top  - pr.top) + 'px';
  document.getElementById('play').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function showAlexBubble(text, avatarSt) {
  elAlexBubble.textContent = text;
  elAlexBubble.classList.remove('hidden');
  if (avatarSt) setAvatarState(avatarSt);
  clearTimeout(window._bubbleTimer);
  window._bubbleTimer = setTimeout(() => {
    elAlexBubble.classList.add('hidden');
    setAvatarState('base');
  }, 2200);
}

function setAvatarState(s) {
  elAvatarPlay.src = s === 'worried' ? ALEX.worried : s === 'happy' ? ALEX.happy : ALEX.base;
}

function bloqueLabel(b) {
  return { fij: 'FIJACIONES', dre: 'DRENAJE', ele: 'ELÉCTRICO' }[b] || b;
}

// ============================================
// RESULTS
// ============================================
function showResults() {
  stopTimer();
  showScreen('results');
  const score = state.score;
  const record = parseInt(localStorage.getItem('el_estreno_record') || '0');

  const elScore = document.getElementById('results-score');
  let current = 0;
  const step = Math.ceil(score / 40) || 1;
  const iv = setInterval(() => {
    current = Math.min(current + step, score);
    elScore.textContent = current;
    if (current >= score) clearInterval(iv);
  }, 30);

  const elRecord = document.getElementById('results-record');
  if (score > record) {
    localStorage.setItem('el_estreno_record', score);
    elRecord.textContent = `Nuevo record: ${score} pts`;
    elRecord.classList.remove('hidden');
  } else {
    elRecord.classList.add('hidden');
  }

  let msg, avatarSrc;
  if (score >= 1400) {
    msg = 'Dominas el checklist de arranque. Ya puedes arrancar un split sin que nadie te mire.';
    avatarSrc = ALEX.happy;
  } else if (score >= 700) {
    msg = 'Vas bien. Repasa el orden dentro de Drenaje — ahí está el truco.';
    avatarSrc = ALEX.happy;
  } else {
    msg = 'El checklist tiene lógica. Vuélvelo a intentar fijándote en por qué cada punto va donde va.';
    avatarSrc = ALEX.worried;
  }
  document.getElementById('avatar-results').src = avatarSrc;
  document.getElementById('results-message').textContent = msg;

  if (score >= 700 && !state.taskFired) {
    state.taskFired = true;
    taskCompleted();
  }
}
