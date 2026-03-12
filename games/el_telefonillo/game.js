/* ============================================================
   EL TELEFONILLO — game.js
   S4D2-AM · Presión vs Caudal
   ============================================================ */

'use strict';

// ── Casos de juego ──────────────────────────────────────────
const CASOS = [
  {
    vecino: 'Piso 1A',
    avatarColor: '#2E7D32',
    avatarInicial: '1A',
    frase: '"Oye, mira, que abro el grifo del baño a tope y el agua sale como si estuvieras soplando. No tiene fuerza ninguna, ¿eh?"',
    correcto: 'presion',
    feedbackError: 'La vecina dice que el agua no tiene fuerza — eso es presión baja, no poco caudal. El caudal habla de cuánta agua sale, no de con qué fuerza empuja.',
    tipoError: 'presion-caudal',
    confirmacion: 'Revisado. Es de presión. Voy al panel.',
    fraseAcierto: '"Lo que pasaba es que la presión estaba baja. Por eso notaba que el agua salía floja aunque el grifo estuviera abierto del todo."',
  },
  {
    vecino: 'Piso 3B',
    avatarColor: '#1565C0',
    avatarInicial: '3B',
    frase: '"Buenas, que yo lo que noto es que la ducha tarda muchísimo en llenar el cubo ese que tengo. Sale agua, y sale bien, pero poquita. Tardísimo."',
    correcto: 'caudal',
    feedbackError: 'El vecino dice que el agua \'sale bien\' pero en poca cantidad y muy lento. Eso es poco caudal — si fuera presión baja, diría que sale sin fuerza, no que tarda en llenar.',
    tipoError: 'caudal-presion',
    confirmacion: 'Revisado. Es de caudal. Voy al panel.',
    fraseAcierto: '"No era la presión — la presión estaba bien. Lo que tenía bajo era el caudal: salía poca cantidad de agua por minuto."',
  },
  {
    vecino: 'Piso 2C',
    avatarColor: '#BF360C',
    avatarInicial: '2C',
    frase: '"Es que cuando abro el grifo de la cocina, el chorro es muy fino. Pero si abro también el del baño a la vez, el de la cocina casi desaparece."',
    correcto: 'presion',
    feedbackError: 'Que el chorro se reduzca al abrir otro grifo simultáneamente es un síntoma de presión insuficiente en la red — la instalación no tiene fuerza suficiente para mantener ambos. Si fuera caudal, el problema aparecería aunque solo abriera uno.',
    tipoError: 'presion-caudal',
    confirmacion: 'Revisado. Es de presión. Al abrir dos a la vez, la red no aguanta.',
    fraseAcierto: '"Lo que tenía era presión baja en la instalación. Por eso al abrir dos grifos a la vez, la fuerza no daba para los dos."',
  },
  {
    vecino: 'Ático',
    avatarColor: '#F9A825',
    avatarInicial: 'AT',
    frase: '"Mire, la ducha tiene presión, empuja bien, lo noto. Pero en diez minutos se me acaba el agua caliente porque el termo no llena rápido. El grifo del termo sale muy poquito."',
    correcto: 'caudal',
    feedbackError: 'El vecino deja claro que la presión está bien — "empuja bien, lo noto". El problema es que sale poca cantidad de agua al termo. Eso es caudal bajo, no presión baja.',
    tipoError: 'caudal-presion',
    confirmacion: 'Revisado. Presión bien. El problema es el caudal al termo.',
    fraseAcierto: '"La presión estaba perfecta. Lo que tenía bajo era el caudal en esa toma — salía poca cantidad de agua por minuto."',
  },
  {
    vecino: 'Bajo A',
    avatarColor: '#546E7A',
    avatarInicial: 'BA',
    frase: '"Que el agua sale rara. No sé explicarlo bien. Sale, pero como... no me convence. ¿Me entiende?"',
    correcto: 'caudal',
    feedbackError: 'Con una descripción tan vaga hay que buscar la pista más concreta: el parte de revisión indica que el aireador del grifo del bajo está parcialmente obstruido — eso reduce el caudal visible sin afectar la presión. La obstrucción apunta a caudal.',
    tipoError: 'ambiguo',
    confirmacion: 'El aireador obstruido reduce el caudal. No es la presión.',
    fraseAcierto: '"Tenía el aireador del grifo un poco obstruido. Por eso el chorro salía raro — no era la presión, era que el paso de agua estaba reducido."',
  },
  {
    vecino: 'Piso 4D',
    avatarColor: '#6A1B9A',
    avatarInicial: '4D',
    frase: '"Esto ya me tiene harto. El grifo del baño, cuando lo abro, al principio sale bien, pero a los dos segundos baja muchísimo. Como si algo lo cortara. Y luego sube otra vez."',
    correcto: 'presion',
    feedbackError: 'Las fluctuaciones — que suba y baje — son un síntoma de presión inestable en la red, no de caudal bajo constante. Si fuera caudal, el chorro sería siempre escaso, no variable. La variación en el tiempo apunta a presión.',
    tipoError: 'presion-caudal',
    confirmacion: 'Fluctuaciones. Es presión inestable. Al panel.',
    fraseAcierto: '"Lo que tiene es presión inestable — por eso el chorro sube y baja. No es el grifo el problema, es la presión de la instalación que fluctúa."',
  },
];

// ── Mensajes Pedro ──────────────────────────────────────────
const MSG_ACIERTO = [
  'Correcto.',
  'Eso es. Siguiente.',
  'Bien diagnosticado.',
  'Sin precipitarse. Así se hace.',
  'El vecino ya tiene agua. Buen trabajo.',
];

const MSG_ERROR = {
  'presion-caudal': 'No. Si el vecino describe falta de fuerza, es presión. El caudal es cuánta agua sale, no con qué fuerza.',
  'caudal-presion': 'No. Fuerza y cantidad no son lo mismo. Lee el síntoma otra vez.',
  'ambiguo': 'Con síntomas vagos, busca el detalle concreto. Siempre hay uno.',
};

// ── Estado del juego ─────────────────────────────────────────
const S = {
  casoActual: 0,
  vidas: 3,
  score: 0,
  casosResueltos: 0,
  primerIntento: true,
  taskCompleted: false,
  valvulaActiva: 'presion', // 'presion' | 'caudal'
  valorValvula: 30,
  holdInterval: null,
  hintTimeout: null,
  aciertosMsg: 0,
};

// ── Referencias DOM ──────────────────────────────────────────
const $ = id => document.getElementById(id);

const screens = {
  intro:   $('screen-intro'),
  play:    $('screen-play'),
  results: $('screen-results'),
};

// ── Navegación de pantallas ──────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  screens[name].classList.remove('hidden');
  screens[name].classList.add('active');
  if (name === 'results') {
    document.documentElement.classList.add('results');
  } else {
    document.documentElement.classList.remove('results');
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('btn-start').addEventListener('click', onStart);
  $('btn-tut-1').addEventListener('click', () => tutorialStep(2));
  $('btn-tut-2').addEventListener('click', () => tutorialStep(3));
  $('btn-tut-3').addEventListener('click', onTutorialDone);
  $('btn-presion').addEventListener('click', () => onDiagnostico('presion'));
  $('btn-caudal').addEventListener('click',  () => onDiagnostico('caudal'));
  $('btn-entendido').addEventListener('click', onEntendido);
  $('btn-confirmar').addEventListener('click', onConfirmar);
  $('overlay-acierto').addEventListener('click', onAciertoTap);
  $('overlay-acierto').addEventListener('touchend', e => { e.preventDefault(); onAciertoTap(); }, { passive: false });
  $('btn-retry').addEventListener('click', onRetry);
  setupValvulaControls();
});

function onStart() {
  if (!localStorage.getItem('el_telefonillo_tutorial_done')) {
    $('modal-tutorial').classList.remove('hidden');
    tutorialStep(1);
  } else {
    startGame();
  }
}

function tutorialStep(n) {
  [1,2,3].forEach(i => {
    $(`tutorial-step-${i}`).classList.toggle('hidden', i !== n);
  });
}

function onTutorialDone() {
  localStorage.setItem('el_telefonillo_tutorial_done', '1');
  $('modal-tutorial').classList.add('hidden');
  startGame();
}

// ── Inicio de partida ────────────────────────────────────────
function startGame() {
  S.casoActual = 0;
  S.vidas = 3;
  S.score = 0;
  S.casosResueltos = 0;
  S.primerIntento = true;
  S.taskCompleted = false;
  S.aciertosMsg = 0;
  showScreen('play');
  renderHUD();
  loadCaso(0);
}

// ── Cargar caso ───────────────────────────────────────────────
function loadCaso(idx) {
  const caso = CASOS[idx];
  S.primerIntento = true;

  // Reset fase 2
  S.valorValvula = 30;

  // Avatar vecino
  const avatar = $('vecino-avatar');
  avatar.textContent = caso.avatarInicial;
  avatar.style.background = caso.avatarColor;
  $('vecino-nombre').textContent = caso.vecino;
  $('vecino-frase').textContent = caso.frase;

  // Actualizar contador de rondas
  $('hud-round').textContent = `${idx + 1}/${CASOS.length}`;

  // Mostrar fase 1, ocultar fase 2
  showFase('diagnostico');
  clearHint();

  // Indicador de último caso
  if (idx === CASOS.length - 1) {
    showPedroBubble('Último vecino.');
  } else if (idx > 0) {
    showPedroBubble('Siguiente llamada.');
  }
}

// ── Diagnóstico ───────────────────────────────────────────────
function onDiagnostico(eleccion) {
  const caso = CASOS[S.casoActual];
  const correcto = eleccion === caso.correcto;
  const btn = $(eleccion === 'presion' ? 'btn-presion' : 'btn-caudal');
  const r = btn.getBoundingClientRect();
  const bx = r.left + r.width / 2;
  const by = r.top  + r.height / 2;

  if (correcto) {
    btn.classList.add('flash-ok');
    setTimeout(() => btn.classList.remove('flash-ok'), 200);
    asmrBurst(bx, by, true);
    if (!S.primerIntento) S.primerIntento = false; // ya marcado en el error
    transicionFase2(caso);
  } else {
    btn.classList.add('shake', 'flash-err');
    setTimeout(() => { btn.classList.remove('shake', 'flash-err'); }, 400);
    asmrBurst(bx, by, false);
    S.primerIntento = false;
    mostrarOverlayError(eleccion, caso);
  }
}

function mostrarOverlayError(eleccion, caso) {
  const eleccionLabel = eleccion === 'presion' ? 'problema de PRESIÓN' : 'problema de CAUDAL';
  $('edu-que-hiciste').textContent = `Elegiste ${eleccionLabel}.`;
  $('edu-por-que').textContent = caso.feedbackError;
  setPedroState('worried');
  $('overlay-educativo').classList.remove('hidden');
}

function onEntendido() {
  $('overlay-educativo').classList.add('hidden');
  perderVida();
  if (S.vidas > 0) {
    loadCaso(S.casoActual);
  } else {
    gameOver();
  }
}

// ── Perder vida ───────────────────────────────────────────────
function perderVida() {
  S.vidas = Math.max(0, S.vidas - 1);
  const heartEl = $(`heart-${S.vidas + 1}`);
  if (heartEl) {
    heartEl.classList.add('lost');
  }
}

// ── Transición a fase 2 ──────────────────────────────────────
function transicionFase2(caso) {
  S.valvulaActiva = caso.correcto;
  S.valorValvula = 30;
  actualizarBarra();
  actualizarPorcentajes();

  // Configurar qué válvula está bloqueada
  const activa   = caso.correcto;
  const bloqueada = activa === 'presion' ? 'caudal' : 'presion';

  $(`valvula-${activa}-wrap`).classList.remove('bloqueada');
  $(`candado-${activa}`).classList.add('hidden');
  $(`valvula-${bloqueada}-wrap`).classList.add('bloqueada');
  $(`candado-${bloqueada}`).classList.remove('hidden');

  $('valvula-activa-label').textContent = activa === 'presion' ? 'Presión' : 'Caudal';

  // Ocultar confirmar y en-zona
  $('btn-confirmar').classList.add('hidden');
  $('en-zona').classList.add('hidden');
  $('barra-fill').classList.remove('en-zona');

  // Hint timeout
  S.hintTimeout = setTimeout(() => {
    showPedroBubble('La zona verde. Ni más ni menos.');
  }, 20000);

  showFase('ajuste');
}

// ── Control válvula ───────────────────────────────────────────
function setupValvulaControls() {
  const btnMas  = $('btn-mas');
  const btnMenos = $('btn-menos');

  let holdTimeout = null;
  let holdInterval = null;

  function startHold(delta) {
    stopHold();
    cambiarValor(delta);
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(() => cambiarValor(delta), 120);
    }, 300);
  }

  function stopHold() {
    if (holdTimeout)  { clearTimeout(holdTimeout);   holdTimeout  = null; }
    if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
  }

  // Touch
  btnMas.addEventListener('touchstart',  e => { e.preventDefault(); startHold(5); }, { passive: false });
  btnMas.addEventListener('touchend',    stopHold);
  btnMas.addEventListener('touchcancel', stopHold);
  btnMenos.addEventListener('touchstart',  e => { e.preventDefault(); startHold(-5); }, { passive: false });
  btnMenos.addEventListener('touchend',    stopHold);
  btnMenos.addEventListener('touchcancel', stopHold);

  // Mouse fallback
  btnMas.addEventListener('mousedown',  e => { e.preventDefault(); startHold(5); });
  btnMenos.addEventListener('mousedown', e => { e.preventDefault(); startHold(-5); });
  document.addEventListener('mouseup', stopHold);

  // Drag rotacional en la válvula activa
  setupDragRotacional('valvula-presion-wrap');
  setupDragRotacional('valvula-caudal-wrap');

  // Drag sobre la barra de progreso
  setupDragBarra();

  // Tap en válvula bloqueada
  ['valvula-presion-wrap', 'valvula-caudal-wrap'].forEach(id => {
    $(id).addEventListener('touchstart', e => {
      if ($(id).classList.contains('bloqueada')) {
        e.preventDefault();
        $(id).classList.add('shake');
        setTimeout(() => $(id).classList.remove('shake'), 300);
      }
    }, { passive: false });
  });
}

function setupDragRotacional(wrapId) {
  const wrap = $(wrapId);
  let startAngle = null;
  let startValor = null;
  let startX = null;
  let startY = null;

  function getCenter() {
    const r = wrap.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  wrap.addEventListener('touchstart', e => {
    if (wrap.classList.contains('bloqueada')) return;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    const { cx, cy } = getCenter();
    startAngle = Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI;
    startValor = S.valorValvula;
  }, { passive: true });

  wrap.addEventListener('touchmove', e => {
    if (startAngle === null) return;
    if (wrap.classList.contains('bloqueada')) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.sqrt(dx*dx + dy*dy) < 8) return;
    const { cx, cy } = getCenter();
    const angle = Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI;
    let delta = angle - startAngle;
    // Normalizar delta para evitar saltos en el cruce de ±180°
    if (delta > 180)  delta -= 360;
    if (delta < -180) delta += 360;
    const nuevoValor = Math.round(Math.min(100, Math.max(0, startValor + delta)));
    if (nuevoValor !== S.valorValvula) {
      S.valorValvula = nuevoValor;
      actualizarBarra();
      actualizarPorcentajes();
    }
    e.preventDefault();
  }, { passive: false });

  wrap.addEventListener('touchend', () => { startAngle = null; });
}

function cambiarValor(delta) {
  S.valorValvula = Math.min(100, Math.max(0, S.valorValvula + delta));
  actualizarBarra();
  actualizarPorcentajes();
}

function actualizarBarra() {
  const v = S.valorValvula;
  const fill = $('barra-fill');
  fill.style.width = `${v}%`;

  const enZona   = v >= 60 && v <= 80;
  const pasado   = v > 80;
  const bajo     = v < 60;

  fill.classList.toggle('en-zona', enZona);
  fill.classList.toggle('pasado-zona', pasado);
  fill.classList.toggle('bajo-zona', bajo);
  $('en-zona').classList.toggle('hidden', !enZona);

  const confirmar = $('btn-confirmar');
  if (enZona) {
    confirmar.classList.remove('hidden');
  } else {
    confirmar.classList.add('hidden');
  }

  // Deshabilitar botones en límites
  $('btn-menos').disabled = v <= 0;
  $('btn-mas').disabled   = v >= 100;
}

function actualizarPorcentajes() {
  const activa   = S.valvulaActiva;
  const bloqueada = activa === 'presion' ? 'caudal' : 'presion';
  $(`pct-${activa}`).textContent    = `${S.valorValvula}%`;
  $(`pct-${bloqueada}`).textContent = `45%`; // valor fijo de la bloqueada
}

// ── Confirmar ajuste ──────────────────────────────────────────
function onConfirmar() {
  clearHint();
  const bonus = S.primerIntento ? 50 : 0;
  S.score += 150 + bonus;
  S.casosResueltos++;

  // Partículas desde el botón confirmar
  const btnRect = $('btn-confirmar').getBoundingClientRect();
  asmrBurst(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2, true);

  if (S.score >= 600 && !S.taskCompleted) {
    S.taskCompleted = true;
    postTaskCompleted();
  }

  // Mostrar overlay de acierto con fondo cuarto
  const caso = CASOS[S.casoActual];
  $('acierto-frase').textContent = caso.fraseAcierto;
  $('overlay-acierto').classList.remove('hidden');
}

// ── Tap en overlay acierto → siguiente caso ───────────────────
function onAciertoTap() {
  $('overlay-acierto').classList.add('hidden');
  S.casoActual++;
  if (S.casoActual >= CASOS.length) {
    showResults();
  } else {
    loadCaso(S.casoActual);
  }
}

// ── Game over (0 vidas) ───────────────────────────────────────
function gameOver() {
  setPedroState('worried');
  showPedroBubble('La guardia no ha ido bien. Presión y caudal no son lo mismo. Vuelve a intentarlo.');
  setTimeout(() => showResults(), 2000);
}

// ── Resultados ────────────────────────────────────────────────
function showResults() {
  showScreen('results');

  const record = parseInt(localStorage.getItem('el_telefonillo_record') || '0', 10);
  const esRecord = S.score > record;
  if (esRecord) {
    localStorage.setItem('el_telefonillo_record', String(S.score));
  }

  // Avatar y mensaje según tier
  let avatarSrc, msg;
  if (S.score >= 900) {
    avatarSrc = 'assets/pedro_celebrating.png';
    msg = 'Guardia limpia. Seis casos, criterio claro. Eso es diagnóstico, no suerte.';
  } else if (S.score >= 600) {
    avatarSrc = 'assets/pedro_happy.png';
    msg = 'Hecho. Algún error en el diagnóstico — repasa la diferencia entre fuerza y cantidad.';
  } else {
    avatarSrc = 'assets/pedro_worried.png';
    msg = 'La guardia no ha ido bien. Presión y caudal no son lo mismo. Vuelve a intentarlo.';
  }

  if (esRecord && S.score >= 600) {
    msg = 'Nuevo récord. El café ya está frío pero ha merecido la pena.';
    avatarSrc = 'assets/pedro_celebrating.png';
  }

  $('results-avatar').src = avatarSrc;
  $('results-bubble').textContent = `"${msg}"`;

  // Counter-roll puntuación
  animateScoreEl($('results-score'), 0, S.score, 1200, v => `${v} pts`);
  $('results-casos').textContent = `${S.casosResueltos}/6 vecinos atendidos`;

  // Vidas restantes
  const vidasEl = $('results-vidas');
  vidasEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    span.textContent = i < S.vidas ? '❤' : '🖤';
    vidasEl.appendChild(span);
  }

  // Record
  const recordEl = $('results-record');
  if (esRecord && S.score > 0) {
    recordEl.classList.remove('hidden');
  } else {
    recordEl.classList.add('hidden');
  }
}

function onRetry() {
  startGame();
}

// ── Helpers ───────────────────────────────────────────────────
function showFase(nombre) {
  $('fase-diagnostico').classList.toggle('hidden', nombre !== 'diagnostico');
  $('fase-ajuste').classList.toggle('hidden', nombre !== 'ajuste');
}

function setPedroState(state) {
  const el = $('pedro-gameplay');
  el.src = `assets/pedro_${state}.png`;
}

function showPedroBubble(msg) {
  const b = $('pedro-bubble');
  b.textContent = `"${msg}"`;
  b.classList.remove('hidden');
  setTimeout(() => hidePedroBubble(), 3000);
}

function hidePedroBubble() {
  $('pedro-bubble').classList.add('hidden');
}

function clearHint() {
  if (S.hintTimeout) { clearTimeout(S.hintTimeout); S.hintTimeout = null; }
}

function renderHUD() {
  $('hud-score').textContent = '';
  for (let i = 1; i <= 3; i++) {
    $(`heart-${i}`).classList.remove('lost');
  }
  $('hud-round').textContent = `${S.casoActual + 1}/${CASOS.length}`;
}

function animateScoreEl(el, from, to, duration, format) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const val = Math.round(from + (to - from) * t);
    el.textContent = format(val);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function postTaskCompleted() {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  } catch (e) {
    // Desktop testing — no RN context
  }
}

// ── Drag sobre la barra de progreso ──────────────────────────
function setupDragBarra() {
  const track = document.querySelector('.barra-track');
  if (!track) return;

  function valorDesdeTouch(clientX) {
    const r = track.getBoundingClientRect();
    const pct = Math.round(Math.min(100, Math.max(0, (clientX - r.left) / r.width * 100)));
    return pct;
  }

  function onMove(clientX) {
    const v = valorDesdeTouch(clientX);
    if (v !== S.valorValvula) {
      S.valorValvula = v;
      actualizarBarra();
      actualizarPorcentajes();
    }
  }

  track.addEventListener('touchstart', e => {
    e.preventDefault();
    onMove(e.touches[0].clientX);
  }, { passive: false });

  track.addEventListener('touchmove', e => {
    e.preventDefault();
    onMove(e.touches[0].clientX);
  }, { passive: false });

  // Mouse fallback para desktop
  let dragging = false;
  track.addEventListener('mousedown', e => { e.preventDefault(); dragging = true; onMove(e.clientX); });
  document.addEventListener('mousemove', e => { if (dragging) onMove(e.clientX); });
  document.addEventListener('mouseup',   () => { dragging = false; });
}

// ── Partículas de acierto (canvas) ───────────────────────────
const asmrCv    = document.createElement('canvas');
const asmrCtx   = asmrCv.getContext('2d');
let   asmrParts = [];
let   asmrRafId = null;

asmrCv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:260;';
document.body.appendChild(asmrCv);

function asmrResize() {
  asmrCv.width  = window.innerWidth;
  asmrCv.height = window.innerHeight;
}
asmrResize();
window.addEventListener('resize', asmrResize);

function asmrBurst(x, y, isCorrect) {
  const colors = isCorrect ? ['#04FFB4', '#00E6BC', '#FFFFAB'] : ['#E74C3C', '#FF7675', '#FFFFAB'];
  const count  = isCorrect ? 22 : 14;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
    const speed = isCorrect ? 2.8 + Math.random() * 3.2 : 2 + Math.random() * 2.5;
    asmrParts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r:  isCorrect ? 3.5 + Math.random() * 2.5 : 2.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: isCorrect ? 0.025 + Math.random() * 0.02 : 0.035 + Math.random() * 0.02,
    });
  }
  if (!asmrRafId) asmrLoop();
}

function asmrLoop() {
  asmrCtx.clearRect(0, 0, asmrCv.width, asmrCv.height);
  asmrParts = asmrParts.filter(p => p.alpha > 0.02);
  asmrParts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.12;
    p.alpha -= p.decay;
    asmrCtx.globalAlpha = Math.max(0, p.alpha);
    asmrCtx.beginPath();
    asmrCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    asmrCtx.fillStyle = p.color;
    asmrCtx.fill();
  });
  asmrCtx.globalAlpha = 1;
  asmrRafId = asmrParts.length ? requestAnimationFrame(asmrLoop) : null;
}
