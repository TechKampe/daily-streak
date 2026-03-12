/* ═══════════════════════════════════════════
   EL CONCURSO DEL SELLADO — game.js
   S4D2-PM · Kampe Daily Streak
════════════════════════════════════════════ */

'use strict';

// ── Cloudinary base ──
const CDN = 'https://res.cloudinary.com/kampe/image/upload/';

// ── Assets Irina (existentes en s1d4) ──
const IRINA = {
  happy:       CDN + 'v1772110317/irina_happy_w2nu0c.png',
  celebrating: CDN + 'v1772110324/irina_celebrating_nifggk.png',
  worried:     CDN + 'v1772110324/irina_worried_bx2nzg.png',
};

// ── Assets roscas ──
const ASSETS = {
  bg:                    CDN + 'v1773315052/bg_fondo_uiwl5k.jpg',
  rosca_aerea_limpia:    CDN + 'v1773314888/rosca_aerea_limpia_vlr5yk.png',
  rosca_aerea_teflon:    CDN + 'v1773314889/rosca_aerea_teflon_bx9ej5.png',
  rosca_frontal_limpia:  CDN + 'v1773315605/rosca_frontal_limpia_iw2td9.png',
  rosca_frontal_ok:      CDN + 'v1773315623/rosca_frontal_teflon_correcto_fea7at.png',
  rosca_frontal_orient:  CDN + 'v1773314892/rosca_frontal_defecto_orientacion_cinta_taejq3.png',
  rosca_frontal_exceso:  CDN + 'v1773314890/rosca_frontal_defecto_exceso_r07mjb.png',
  rosca_frontal_insuf:   CDN + 'v1773314891/rosca_frontal_defecto_insuficiente_s5pqj9.png',
};

// ── Casos ──
const CASOS = [
  {
    // Rosca 1 — limpia, rosca directamente
    id: 1,
    tipo: 'limpia',
    imgFrontal: ASSETS.rosca_frontal_limpia,
    imgAerea:   ASSETS.rosca_aerea_limpia,
    minVueltas: 3.0,
    maxVueltas: 5.0,
    fraseAcierto: 'Primera estación. Orientación correcta, cantidad correcta. Así se empieza.',
    feedbackWrap: {
      antihorario: 'Al roscar en sentido horario, el teflón tiene que ir en la misma dirección. Si lo enrollas al revés, se arrastra y pierde el sellado.',
      insuficiente: 'Pocas vueltas. La rosca quedaría al descubierto en parte del recorrido. Mínimo 3 vueltas para sellar bien.',
      exceso: 'Demasiadas vueltas. El exceso de material forma barbas que no aprietan — solo molestan. Entre 3 y 5 es suficiente.',
    },
  },
  {
    // Rosca 2 — sellado correcto ya aplicado → respuesta: 'bien'
    id: 2,
    tipo: 'pre-correcta',
    imgFrontal: ASSETS.rosca_frontal_ok,
    respuestaCorrecta: 'bien',
    fraseAcierto: 'Buen ojo. No todo lo que ves necesita corrección. Reconocer un sellado correcto es tan importante como hacerlo.',
    feedbackInspeccion: {
      falta:   'Eso es teflón bien aplicado — no está vacía. Fíjate: cubre uniformemente, sin rosca metálica visible.',
      defecto: 'No hay defecto. El teflón cubre de forma uniforme, sin barbas en los extremos. Cuando el acabado está limpio, no hay nada que corregir.',
    },
  },
  {
    // Rosca 3 — defecto de orientación (cinta al revés) → respuesta: 'defecto'
    id: 3,
    tipo: 'pre-defectuosa',
    imgFrontal: ASSETS.rosca_frontal_orient,
    respuestaCorrecta: 'defecto',
    minVueltas: 3.0,
    maxVueltas: 5.0,
    fraseAcierto: 'Orientación. La más invisible de las señales y la más crítica. Bien detectada.',
    feedbackInspeccion: {
      bien:  'No está bien. El borde libre del teflón apunta en la dirección contraria al roscado. Al empezar a roscar se arrastraría solo. Hay que retirarlo y reaplicarlo.',
      falta: 'No falta teflón — está aplicado, pero orientado al revés. El borde libre debe apuntar siempre en la dirección del roscado.',
    },
    feedbackWrap: {
      antihorario: 'Al revés. El teflón va en sentido horario — en la misma dirección que vas a roscar. Si lo enrollas al revés, se arrastra solo.',
      insuficiente: 'Faltan vueltas. Sigue enrollando o retira y reintenta.',
      exceso: 'Demasiado. Quedan barbas. Retira y reintenta con menos material.',
    },
  },
  {
    // Rosca 4 — limpia, rosca directamente (rosca más grande, margen más ajustado)
    id: 4,
    tipo: 'limpia',
    imgFrontal: ASSETS.rosca_frontal_limpia,
    imgAerea:   ASSETS.rosca_aerea_limpia,
    minVueltas: 3.5,
    maxVueltas: 4.5,
    fraseAcierto: 'Rosca grande, criterio más fino. Lo has calibrado bien.',
    feedbackWrap: {
      antihorario: 'Al revés. El teflón va en sentido horario.',
      insuficiente: 'Para una rosca de 1 pulgada necesitas al menos 3 vueltas y media. El diámetro mayor exige más cobertura de material.',
      exceso: 'Con 1 pulgada el exceso se nota más. El material sobrante no va a comprimir bien — solo va a quedar fuera.',
    },
  },
  {
    // Rosca 5 — exceso de teflón → respuesta: 'defecto'
    id: 5,
    tipo: 'pre-defectuosa',
    imgFrontal: ASSETS.rosca_frontal_exceso,
    respuestaCorrecta: 'defecto',
    minVueltas: 3.0,
    maxVueltas: 5.0,
    fraseAcierto: 'Exceso detectado y corregido. Acabado limpio. Eso es lo que se evalúa en obra.',
    feedbackInspeccion: {
      bien:  'No está bien. Las barbas que sobresalen en los extremos son la señal de exceso. Ese material no comprime — queda expuesto y puede dar problemas al apretar.',
      falta: 'No falta teflón, sobra. Las barbas visibles en los extremos son el exceso. Hay que retirar y reaplicar con menos material.',
    },
    feedbackWrap: {
      antihorario: 'Al revés. El teflón va en sentido horario.',
      insuficiente: 'Faltan vueltas. Sigue enrollando o retira y reintenta.',
      exceso: 'Demasiado. Quedan barbas. Retira y reintenta con menos material.',
    },
  },
  {
    // Rosca 6 — teflón insuficiente → respuesta: 'defecto'
    id: 6,
    tipo: 'pre-defectuosa',
    imgFrontal: ASSETS.rosca_frontal_insuf,
    respuestaCorrecta: 'defecto',
    minVueltas: 3.0,
    maxVueltas: 5.0,
    fraseAcierto: 'La más difícil de ver. Cobertura completa, zona verde. Sellado pro.',
    feedbackInspeccion: {
      bien:  'No está bien. Hay metal visible bajo el teflón — cobertura parcial. Con ese sellado habrá pérdida en cuanto aprietes.',
      falta: 'No está vacía — hay teflón aplicado, pero no cubre toda la rosca. Hay que retirarlo y reaplicarlo con más vueltas.',
    },
    feedbackWrap: {
      antihorario: 'Al revés. El teflón va en sentido horario.',
      insuficiente: 'Faltan vueltas. Sigue enrollando o retira y reintenta.',
      exceso: 'Demasiado. Quedan barbas. Retira y reintenta con menos material.',
    },
  },
];

// ── Estado global ──
const S = {
  casoIdx: 0,
  vidas: 3,
  score: 0,
  roscasPro: [false, false, false, false, false, false],
  primerIntento: [true, true, true, true, true, true],
  taskCompletedFired: false,
  // Wrap state
  gestureActive: false,
  anguloPrevio: 0,
  vueltasRaw: 0,
  vueltasActuales: 0,
  antihorarioAlertado: false,
  // Hint timeout
  hintTimeout: null,
  // Timer velocidad
  tiempoInicioRosca: 0,
  // Quiz
  quizModo: false,
};

// ── DOM helpers ──
const $ = id => document.getElementById(id);

// ── Preguntas quiz final ──
const PREGUNTAS = [
  {
    pregunta: '¿Qué pasa si enrollas el teflón en sentido antihorario?',
    opciones: [
      'El teflón no sella — al roscar, la cinta se arrastra y queda suelta.',
      'Sella igual, la dirección no importa mientras cubra las roscas.',
      'Solo es un problema si aprietas demasiado fuerte.',
    ],
    correcta: 0,
    feedback: 'El teflón tiene que enrollarse en el mismo sentido que se rosca — sentido horario. Si va al revés, al girar la pieza para apretar, la cinta se arrastra sola y pierde el sellado antes de que termines.',
  },
  {
    pregunta: '¿Qué pasa si pones más teflón del necesario?',
    opciones: [
      'El sellado mejora — más material siempre es más seguro.',
      'El exceso forma barbas que no comprimen y pueden impedir el apriete correcto.',
      'Solo hay problema si el exceso supera las 8 vueltas.',
    ],
    correcta: 1,
    feedback: 'El exceso de teflón forma barbas en los extremos que quedan expuestas y no comprimen. Además, dificultan el apriete progresivo y pueden dañar la rosca. Entre 3 y 5 vueltas es suficiente para sellar bien.',
  },
  {
    pregunta: '¿Qué pasa si te quedas corto de teflón?',
    opciones: [
      'La rosca queda visible bajo el teflón y habrá pérdida al apretar.',
      'No pasa nada si aprietas bien fuerte para compensar.',
      'Solo es problema en roscas de más de media pulgada.',
    ],
    correcta: 0,
    feedback: 'Si el teflón no cubre toda la rosca, queda metal expuesto en parte del recorrido. Por esa zona habrá fuga en cuanto entre presión, sin importar cuánto aprietes. El material tiene que cubrir de extremo a extremo.',
  },
];

// ── Elementos ──
const elScreenIntro   = $('screen-intro');
const elScreenPlay    = $('screen-play');
const elScreenResults = $('screen-results');
const elScreenQuiz    = $('screen-quiz');
const elModalTutorial = $('modal-tutorial');
const elOverlayError  = $('overlay-error');
const elOverlayGameover = $('overlay-gameover');
const elCanvasParticles = $('canvas-particles');
const ctxParticles    = elCanvasParticles.getContext('2d');

// Partículas
let asmrParts = [];
let asmrRafId = null;

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
function init() {
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);

  // Irina en intro
  setIrina('intro', 'happy');
  setIrina('gameplay', 'happy');
  setIrina('overlay', 'worried');
  setIrina('gameover', 'worried');
  setIrina('results', 'happy');
  setIrina('quiz', 'happy');

  // Botón start
  $('btn-start').addEventListener('click', onStart);

  // Tutorial
  $('tut-next-1').addEventListener('click', () => tutStep(2));
  $('tut-next-2').addEventListener('click', () => tutStep(3));
  $('tut-next-3').addEventListener('click', tutDone);

  // Inspección (3 opciones)
  $('btn-esta-bien').addEventListener('click',    () => onInspeccion('bien'));
  $('btn-falta-teflon').addEventListener('click', () => onInspeccion('falta'));
  $('btn-hay-defecto').addEventListener('click',  () => onInspeccion('defecto'));

  // Wrap
  $('btn-confirmar').addEventListener('click', onConfirmar);
  $('btn-reintentar').addEventListener('click', onReintentar);
  $('btn-entendido').addEventListener('click', onEntendido);
  $('btn-retry').addEventListener('click', onRetry);
  $('btn-hint').addEventListener('click', () => mostrarHint());

  // Canvas aérea — gesto angular
  const canvasAerea = $('canvas-aerea');
  canvasAerea.addEventListener('touchstart', onTouchStart, { passive: false });
  canvasAerea.addEventListener('touchmove',  onTouchMove,  { passive: false });
  canvasAerea.addEventListener('touchend',   onTouchEnd,   { passive: true });
  canvasAerea.addEventListener('touchcancel',onTouchEnd,   { passive: true });
  // Fallback mouse (testing desktop)
  canvasAerea.addEventListener('mousedown',  onMouseDown);
  canvasAerea.addEventListener('mousemove',  onMouseMove);
  canvasAerea.addEventListener('mouseup',    onMouseUp);
}

// ══════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════
function showScreen(name) {
  [elScreenIntro, elScreenPlay, elScreenResults, elScreenQuiz].forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });

  if (name === 'intro') {
    elScreenIntro.classList.remove('hidden');
    elScreenIntro.classList.add('active');
    document.documentElement.classList.remove('results');
  } else if (name === 'play') {
    elScreenPlay.classList.remove('hidden');
    elScreenPlay.classList.add('active');
    document.documentElement.classList.remove('results');
  } else if (name === 'quiz') {
    elScreenQuiz.classList.remove('hidden');
    elScreenQuiz.classList.add('active');
    document.documentElement.classList.remove('results');
  } else if (name === 'results') {
    elScreenResults.classList.remove('hidden');
    elScreenResults.classList.add('active');
    document.documentElement.classList.add('results');
  }
}

// ══════════════════════════════════════════
// START
// ══════════════════════════════════════════
function onStart() {
  const tutDone = localStorage.getItem('el_concurso_del_sellado_tutorial_done');
  if (!tutDone) {
    elModalTutorial.classList.remove('hidden');
    tutStep(1);
  } else {
    startGame();
  }
}

// ══════════════════════════════════════════
// TUTORIAL
// ══════════════════════════════════════════
function tutStep(n) {
  ['tut-step-1','tut-step-2','tut-step-3'].forEach(id => $( id).classList.add('hidden'));
  $('tut-step-' + n).classList.remove('hidden');
}

function tutDone() {
  localStorage.setItem('el_concurso_del_sellado_tutorial_done', '1');
  elModalTutorial.classList.add('hidden');
  startGame();
}

// ══════════════════════════════════════════
// GAME START / RESET
// ══════════════════════════════════════════
function startGame() {
  S.casoIdx = 0;
  S.vidas = 3;
  S.score = 0;
  S.roscasPro = [false, false, false, false, false, false];
  S.primerIntento = [true, true, true, true, true, true];
  S.taskCompletedFired = false;
  S.quizModo = false;

  actualizarCorazones();
  $('irina-gameplay').classList.remove('celebrating');
  showScreen('play');
  cargarRosca(S.casoIdx);
}

function onRetry() {
  startGame();
}

// ══════════════════════════════════════════
// CARGAR ROSCA
// ══════════════════════════════════════════
function cargarRosca(idx) {
  const caso = CASOS[idx];
  $('hud-counter').textContent = (idx + 1) + '/6';

  // Reset wrap state
  S.vueltasRaw = 0;
  S.vueltasActuales = 0;
  S.gestureActive = false;
  S.antihorarioAlertado = false;
  S.tiempoInicioRosca = Date.now();

  // Imágenes
  $('img-frontal').src = caso.imgFrontal;
  $('img-aerea').src   = caso.imgAerea;

  // Inicializar canvas una vez cargue la imagen
  $('img-frontal').onload = () => initCanvasFrontal();
  $('img-aerea').onload   = () => initCanvasAerea(caso.tipo !== 'limpia' && !esFaseWrap());

  // Ocultar todos los controles
  $('btns-inspeccion').classList.add('hidden');
  $('btns-wrap').classList.add('hidden');
  $('result-card').classList.add('hidden');
  $('hint-wrap').classList.add('hidden');
  $('pregunta-inspeccion').classList.add('hidden');
  // Restaurar vista aérea (puede haber quedado oculta en fase inspección anterior)
  $('vista-aerea-wrap').classList.remove('hidden');
  ocultarBubble();

  // Medidor reset
  actualizarMedidor(0, caso);

  // Según tipo
  if (caso.tipo === 'limpia') {
    // Directo a fase wrap
    setTimeout(() => iniciarFaseWrap(caso), 400);
  } else {
    // Fase inspección — ocultar aérea hasta que pase a wrap
    $('vista-aerea-wrap').classList.add('hidden');
    setTimeout(() => iniciarFaseInspeccion(caso), 400);
  }

  // Hint
  resetHint(caso);
}

function esFaseWrap() { return !$('btns-inspeccion').classList.contains('hidden') === false; }

// ══════════════════════════════════════════
// CANVAS — VISTA FRONTAL
// ══════════════════════════════════════════
function initCanvasFrontal() {
  // Canvas frontal solo se usa para limpiar — la barra la reemplaza el trazo aéreo
  const canvas = $('canvas-frontal');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ══════════════════════════════════════════
// CANVAS — VISTA AÉREA
// ══════════════════════════════════════════
function initCanvasAerea(grisado) {
  const img = $('img-aerea');
  const canvas = $('canvas-aerea');
  canvas.width  = img.offsetWidth  || 220;
  canvas.height = img.offsetHeight || 220;
  canvas.style.width  = canvas.width  + 'px';
  canvas.style.height = canvas.height + 'px';
  dibujarAnilloAereo(grisado);
}

function dibujarAnilloAereo(grisado) {
  const canvas = $('canvas-aerea');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (grisado) {
    // Overlay gris cuando no está activo
    ctx.fillStyle = 'rgba(11,33,74,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r1 = 60; // radio interior del anillo
  const r2 = 100; // radio exterior del anillo

  // Anillo de gesto (zona activa)
  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.arc(cx, cy, r1, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(197,255,223,0.18)'; // mint semitransparente
  ctx.fill();

  // Borde del anillo
  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(197,255,223,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(197,255,223,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function dibujarHintFlecha() {
  // Solo redibujar el anillo (sin texto encima) y mostrar el hint DOM
  initCanvasAerea(false);
  $('hint-wrap').classList.remove('hidden');
}

function pararHintFlecha() {
  $('hint-wrap').classList.add('hidden');
}

// Dibuja el anillo base sin limpiar el canvas (para reusar desde la flecha animada)
function dibujarAnilloAereoSinLimpiar(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r1 = 60;
  const r2 = 100;

  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.arc(cx, cy, r1, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(197,255,223,0.18)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(197,255,223,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(197,255,223,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Trazo circular en el canvas aérea — avanza vuelta a vuelta con el dedo
function dibujarTrazoAereo(vueltasRaw, caso) {
  const canvas = $('canvas-aerea');
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r  = 80; // radio medio del anillo

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarAnilloAereoSinLimpiar(ctx, canvas);

  if (vueltasRaw <= 0) return;

  const min = caso.minVueltas || 3.0;
  const max = caso.maxVueltas || 5.0;

  // Color según zona
  let color;
  if (S.vueltasActuales < min)        color = '#E74C3C'; // rojo
  else if (S.vueltasActuales <= max)  color = '#00C896'; // verde
  else                                 color = '#E67E22'; // naranja

  const vueltasCompletas = Math.floor(vueltasRaw);
  const fraccionActual   = vueltasRaw % 1; // 0..1 de la vuelta en curso

  // Dibujar vueltas completas (más opacas cuanto más recientes)
  for (let i = 0; i < Math.min(vueltasCompletas, 6); i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.25 + (i / Math.max(vueltasCompletas, 1)) * 0.35;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Dibujar la vuelta en curso (arco parcial, opacidad plena)
  if (fraccionActual > 0.01 || vueltasRaw < 1) {
    const anguloFin = -Math.PI / 2 + (vueltasRaw < 1 ? vueltasRaw : fraccionActual) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, anguloFin);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Punto de inicio fijo en las 12h
  ctx.beginPath();
  ctx.arc(cx, cy - r, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFAB'; // lemon — siempre visible como referencia
  ctx.fill();

  // Puntos de vueltas completadas en el radio exterior (r2=100), distribuidos
  const maxPuntos = Math.min(vueltasCompletas, 6);
  for (let i = 0; i < maxPuntos; i++) {
    const ang = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    const px  = cx + 112 * Math.cos(ang);
    const py  = cy + 112 * Math.sin(ang);
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ══════════════════════════════════════════
// FASE INSPECCIÓN
// ══════════════════════════════════════════
function iniciarFaseInspeccion(_caso) {
  // Ocultar vista aérea en fase inspección — solo imagen frontal grande
  $('vista-aerea-wrap').classList.add('hidden');
  $('canvas-aerea').style.pointerEvents = 'none';

  // Ocultar medidor — no tiene sentido en inspección
  $('medidor-label').classList.add('hidden');

  // Mostrar pregunta encima del asset
  $('pregunta-inspeccion').classList.remove('hidden');

  // Mostrar siempre las 3 opciones (sin bubble de Irina — la pregunta ya está arriba)
  $('btns-inspeccion').classList.remove('hidden');
  $('btns-wrap').classList.add('hidden');
}

function onInspeccion(respuesta) {
  const caso = CASOS[S.casoIdx];
  const esCorrecta = respuesta === caso.respuestaCorrecta;

  const btnMap = { bien: $('btn-esta-bien'), falta: $('btn-falta-teflon'), defecto: $('btn-hay-defecto') };
  const btn = btnMap[respuesta];

  clearHint();

  if (esCorrecta) {
    btn.classList.add('flash-ok');
    setTimeout(() => btn.classList.remove('flash-ok'), 200);
    asmrBurst(...btnCenter(btn), true);

    $('btns-inspeccion').classList.add('hidden');
    $('pregunta-inspeccion').classList.add('hidden');
    ocultarBubble();

    if (caso.tipo === 'pre-correcta') {
      // Sellado correcto → resultado sin wrap
      setTimeout(() => mostrarResultadoRosca(caso), 300);
    } else {
      // Defectuosa → quitar y reenrollar
      setTimeout(() => {
        $('vista-aerea-wrap').classList.remove('hidden');
        iniciarFaseWrap(caso);
      }, 300);
    }
  } else {
    btn.classList.add('flash-err', 'shake');
    setTimeout(() => btn.classList.remove('flash-err', 'shake'), 400);
    asmrBurst(...btnCenter(btn), false);

    S.vidas--;
    S.primerIntento[S.casoIdx] = false;
    actualizarCorazones();

    // El feedback es específico según qué respondió mal
    const textoFeedback = caso.feedbackInspeccion
      ? (caso.feedbackInspeccion[respuesta] || caso.feedbackInspeccion.bien || '')
      : '';

    if (S.vidas <= 0) {
      setTimeout(() => gameOver(), 600);
    } else {
      mostrarOverlayError(textoFeedback);
    }
  }
}

function btnCenter(btn) {
  const r = btn.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

// ══════════════════════════════════════════
// FASE WRAP
// ══════════════════════════════════════════
function iniciarFaseWrap(caso) {
  // Frontal limpia
  $('img-frontal').src = ASSETS.rosca_frontal_limpia;
  $('img-frontal').onload = () => { initCanvasFrontal(); };

  // Aérea activa
  $('img-aerea').src = ASSETS.rosca_aerea_limpia;
  $('img-aerea').onload = () => {
    initCanvasAerea(false);
    // Hint flecha siempre al entrar en fase wrap
    setTimeout(dibujarHintFlecha, 500);
  };

  $('canvas-aerea').style.pointerEvents = 'all';

  S.vueltasRaw = 0;
  S.vueltasActuales = 0;
  S.gestureActive = false;

  $('medidor-label').classList.remove('hidden');
  actualizarMedidor(0, caso);
  ocultarBubble();
  $('hint-wrap').classList.add('hidden');
  $('btns-wrap').classList.remove('hidden');
  $('btn-confirmar').classList.add('hidden');
  $('btns-inspeccion').classList.add('hidden');

  resetHint(caso);
}

// ══════════════════════════════════════════
// GESTO ANGULAR
// ══════════════════════════════════════════
function getCenter() {
  const canvas = $('canvas-aerea');
  return { x: canvas.width / 2, y: canvas.height / 2 };
}

function getCanvasPos(clientX, clientY) {
  const canvas = $('canvas-aerea');
  const rect   = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width  / rect.width),
    y: (clientY - rect.top)  * (canvas.height / rect.height),
  };
}

function distFromCenter(px, py) {
  const c = getCenter();
  return Math.sqrt((px - c.x) ** 2 + (py - c.y) ** 2);
}

function enAnillo(px, py) {
  const d = distFromCenter(px, py);
  return d >= 60 && d <= 100;
}

function normalizaDelta(d) {
  if (d > 180)  d -= 360;
  if (d < -180) d += 360;
  return d;
}

function onTouchStart(e) {
  e.preventDefault();
  const t = e.touches[0];
  const pos = getCanvasPos(t.clientX, t.clientY);
  if (!enAnillo(pos.x, pos.y)) return;
  const c = getCenter();
  S.anguloPrevio  = Math.atan2(pos.y - c.y, pos.x - c.x) * (180 / Math.PI);
  S.gestureActive = true;
  clearHint();
  pararHintFlecha();
}

function onTouchMove(e) {
  e.preventDefault();
  if (!S.gestureActive) return;
  const t = e.touches[0];
  procesarGesto(t.clientX, t.clientY);
}

function onTouchEnd() {
  if (!S.gestureActive) return;
  S.gestureActive = false;
  evaluarAlLevantar();
}

// Mouse fallback
function onMouseDown(e) {
  const pos = getCanvasPos(e.clientX, e.clientY);
  if (!enAnillo(pos.x, pos.y)) return;
  const c = getCenter();
  S.anguloPrevio  = Math.atan2(pos.y - c.y, pos.x - c.x) * (180 / Math.PI);
  S.gestureActive = true;
  clearHint();
  pararHintFlecha();
}
function onMouseMove(e) {
  if (!S.gestureActive) return;
  procesarGesto(e.clientX, e.clientY);
}
function onMouseUp() {
  if (!S.gestureActive) return;
  S.gestureActive = false;
  evaluarAlLevantar();
}

function procesarGesto(clientX, clientY) {
  const pos = getCanvasPos(clientX, clientY);
  const c   = getCenter();
  const anguloActual = Math.atan2(pos.y - c.y, pos.x - c.x) * (180 / Math.PI);
  let delta = normalizaDelta(anguloActual - S.anguloPrevio);
  S.anguloPrevio = anguloActual;

  const caso = CASOS[S.casoIdx];

  if (delta > 0) {
    // Horario — correcto
    S.vueltasRaw += delta / 360;
    S.vueltasActuales = Math.round(S.vueltasRaw * 2) / 2; // franjas de 0.5
    S.antihorarioAlertado = false;
  } else if (delta < 0) {
    // Antihorario — deshace
    S.vueltasRaw = Math.max(0, S.vueltasRaw + delta / 360);
    S.vueltasActuales = Math.round(S.vueltasRaw * 2) / 2;
    if (!S.antihorarioAlertado) {
      mostrarBubble('¡Dirección incorrecta! Gira en sentido horario — igual que al roscar.');
      S.antihorarioAlertado = true;
      setTimeout(() => { S.antihorarioAlertado = false; }, 3000);
    }
  }

  dibujarTrazoAereo(S.vueltasRaw, caso);
  actualizarMedidor(S.vueltasActuales, caso);

  const enVerde = S.vueltasActuales >= caso.minVueltas && S.vueltasActuales <= caso.maxVueltas;
  if (enVerde) {
    $('btn-confirmar').classList.remove('hidden');
  } else {
    $('btn-confirmar').classList.add('hidden');
  }
}

function evaluarAlLevantar() {
  const caso = CASOS[S.casoIdx];
  if (S.vueltasActuales < caso.minVueltas && S.vueltasActuales > 0.1) {
    mostrarBubble('Faltan vueltas. Sigue enrollando o retira y reintenta.');
  } else if (S.vueltasActuales > caso.maxVueltas) {
    mostrarBubble('Demasiado. Quedan barbas. Retira y reintenta con menos material.');
  }
}

function onConfirmar() {
  const caso = CASOS[S.casoIdx];
  const enVerde = S.vueltasActuales >= caso.minVueltas && S.vueltasActuales <= caso.maxVueltas;
  if (!enVerde) return;
  // Mostrar asset con teflón correcto aplicado
  $('img-frontal').src = ASSETS.rosca_frontal_ok;
  $('btns-wrap').classList.add('hidden');
  ocultarBubble();
  mostrarResultadoRosca(caso);
}

function onReintentar() {
  const caso = CASOS[S.casoIdx];
  S.vueltasRaw = 0;
  S.vueltasActuales = 0;
  S.gestureActive = false;
  S.antihorarioAlertado = false;
  pararHintFlecha(); // también oculta hint-wrap
  actualizarMedidor(0, caso);
  $('btn-confirmar').classList.add('hidden');
  ocultarBubble();
  // Redibujar aérea — esperar onload por si la imagen aún no tiene dimensiones
  const imgAerea = $('img-aerea');
  if (imgAerea.complete && imgAerea.naturalWidth > 0) {
    initCanvasAerea(false);
  } else {
    imgAerea.onload = () => initCanvasAerea(false);
  }
}

// ══════════════════════════════════════════
// RESULTADO ROSCA
// ══════════════════════════════════════════
function mostrarResultadoRosca(caso) {
  const elapsed = (Date.now() - S.tiempoInicioRosca) / 1000;
  const bonusVelocidad = elapsed <= 12 ? 50 : 0;
  const puntos = 150 + bonusVelocidad;
  S.score += puntos;
  S.roscasPro[S.casoIdx] = true;

  setIrina('gameplay', 'celebrating');
  $('irina-gameplay').classList.add('celebrating');

  const card = $('result-card');
  const bonusEl = $('result-bonus');
  if (bonusVelocidad > 0) {
    bonusEl.textContent = '+50 BONUS velocidad';
    bonusEl.classList.remove('hidden');
  } else {
    bonusEl.classList.add('hidden');
  }
  $('result-frase').textContent = caso.fraseAcierto;
  card.classList.remove('hidden');

  // Partículas desde centro de la vista frontal
  const wrapFrontal = $('vista-frontal-wrap');
  const rect = wrapFrontal.getBoundingClientRect();
  asmrBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, true);

  // TASK_COMPLETED
  if (S.score >= 700 && !S.taskCompletedFired) {
    S.taskCompletedFired = true;
    postTaskCompleted();
  }

  // Auto-avance tras 2.5s o tap en cualquier parte de la pantalla
  const screen = $('screen-play');
  const avanzar = () => {
    screen.removeEventListener('click', avanzar);
    clearTimeout(autoTimer);
    siguienteRosca();
  };
  screen.addEventListener('click', avanzar);
  const autoTimer = setTimeout(avanzar, 2500);
}

function siguienteRosca() {
  setIrina('gameplay', 'happy');
  $('irina-gameplay').classList.remove('celebrating');
  $('result-card').classList.add('hidden');

  S.casoIdx++;
  if (S.casoIdx >= CASOS.length) {
    mostrarQuiz();
  } else {
    cargarRosca(S.casoIdx);
  }
}

// ══════════════════════════════════════════
// QUIZ FINAL
// ══════════════════════════════════════════
let quizIdx = 0;
let quizBloqueado = false;

function mostrarQuiz() {
  quizIdx = 0;
  quizBloqueado = false;
  setIrina('quiz', 'happy');
  // Sincronizar corazones con las vidas al acabar las roscas
  for (let i = 1; i <= 3; i++) {
    const h = $('quiz-heart-' + i);
    if (h) h.className = 'heart' + (i > S.vidas ? ' lost' : '');
  }
  showScreen('quiz');
  mostrarPreguntaQuiz();
}

function mostrarPreguntaQuiz() {
  const p = PREGUNTAS[quizIdx];
  quizBloqueado = false;

  $('quiz-progreso').textContent = 'Pregunta ' + (quizIdx + 1) + '/3';
  $('quiz-pregunta').textContent = p.pregunta;

  const contenedor = $('quiz-opciones');
  contenedor.innerHTML = '';
  p.opciones.forEach((texto, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn-quiz';
    btn.textContent = texto;
    btn.addEventListener('click', () => onRespuestaQuiz(i, btn));
    contenedor.appendChild(btn);
  });
}

function onRespuestaQuiz(idx, btn) {
  if (quizBloqueado) return;
  quizBloqueado = true;

  const p = PREGUNTAS[quizIdx];
  const esCorrecta = idx === p.correcta;

  // Marcar opción seleccionada
  btn.classList.add(esCorrecta ? 'correcta' : 'incorrecta');
  // Marcar correcta si erraron
  if (!esCorrecta) {
    const btns = $('quiz-opciones').querySelectorAll('.btn-quiz');
    btns[p.correcta].classList.add('correcta');
  }

  if (esCorrecta) {
    S.score += 50;
    setIrina('quiz', 'celebrating');
    asmrBurst(window.innerWidth / 2, window.innerHeight / 2, true);
  } else {
    setIrina('quiz', 'worried');
  }

  // Mostrar feedback tras un pequeño delay
  setTimeout(() => {
    S.quizModo = true; // flag para onEntendido
    $('overlay-text').textContent = p.feedback;
    setIrina('overlay', esCorrecta ? 'celebrating' : 'worried');
    elOverlayError.classList.remove('hidden');
  }, 600);
}

function avanzarQuiz() {
  quizIdx++;
  if (quizIdx >= PREGUNTAS.length) {
    mostrarResultados();
  } else {
    setIrina('quiz', 'happy');
    mostrarPreguntaQuiz();
  }
}

// ══════════════════════════════════════════
// MEDIDOR
// ══════════════════════════════════════════
function actualizarMedidor(vueltas, caso) {
  const label = $('medidor-label');
  const min = caso ? caso.minVueltas : 3.0;
  const max = caso ? caso.maxVueltas : 5.0;

  if (vueltas <= 0) {
    label.textContent = '0 vueltas';
    label.className = 'medidor-label';
    return;
  }

  const v = vueltas % 1 === 0 ? vueltas.toFixed(0) : vueltas.toFixed(1);
  if (vueltas < min) {
    label.textContent = v + ' vueltas — Insuficiente';
    label.className = 'medidor-label';
  } else if (vueltas <= max) {
    label.textContent = v + ' vueltas — Correcto ✓';
    label.className = 'medidor-label verde';
  } else {
    label.textContent = v + ' vueltas — Exceso';
    label.className = 'medidor-label naranja';
  }
}

// ══════════════════════════════════════════
// OVERLAY ERROR
// ══════════════════════════════════════════
function mostrarOverlayError(texto) {
  $('overlay-text').textContent = texto;
  elOverlayError.classList.remove('hidden');
}

function onEntendido() {
  elOverlayError.classList.add('hidden');
  setIrina('overlay', 'worried'); // restaurar estado overlay por defecto
  if (S.quizModo) {
    S.quizModo = false;
    avanzarQuiz();
  } else {
    // Reiniciar misma rosca
    cargarRosca(S.casoIdx);
  }
}

// ══════════════════════════════════════════
// GAME OVER
// ══════════════════════════════════════════
function gameOver() {
  elOverlayGameover.classList.remove('hidden');
  setTimeout(() => {
    elOverlayGameover.classList.add('hidden');
    mostrarResultados();
  }, 2500);
}

// ══════════════════════════════════════════
// RESULTADOS
// ══════════════════════════════════════════
function mostrarResultados() {
  const record = parseInt(localStorage.getItem('el_concurso_del_sellado_record') || '0', 10);
  const esNuevoRecord = S.score > record;
  if (esNuevoRecord) localStorage.setItem('el_concurso_del_sellado_record', String(S.score));

  // Tier
  let irina = 'happy';
  let msg = 'Concurso superado. Algún detalle por pulir — vuelve a las que fallaste.';
  if (S.score >= 900) {
    irina = 'celebrating';
    msg = esNuevoRecord ? 'Nuevo récord. Cada vez más fino.' : 'Sellado pro. Las seis. Eso es método, no suerte.';
  } else if (S.score < 700) {
    irina = 'worried';
    msg = 'Necesitas más práctica con el teflón. El ojo y la mano van juntos.';
  }

  setIrina('results', irina);
  $('bubble-results').textContent = msg;

  // Score animado
  animateScore($('results-score'), 0, S.score, 1200);

  // Record
  const recEl = $('results-record');
  if (esNuevoRecord && record > 0) {
    recEl.textContent = 'Récord anterior: ' + record + ' pts → Nuevo récord: ' + S.score + ' pts';
    recEl.classList.add('new-record');
  } else if (esNuevoRecord && record === 0) {
    recEl.textContent = 'Primer récord: ' + S.score + ' pts';
    recEl.classList.add('new-record');
  } else {
    recEl.textContent = 'Récord: ' + record + ' pts';
    recEl.classList.remove('new-record');
  }

  // Roscas
  const roscasEl = $('results-roscas');
  const proCount = S.roscasPro.filter(Boolean).length;
  let html = '<span>' + proCount + '/6 roscas perfectas</span> ';
  S.roscasPro.forEach(pro => {
    html += '<span class="rosca-icon ' + (pro ? 'pro' : 'nopro') + '">⬤</span>';
  });
  roscasEl.innerHTML = html;

  $('results-vidas').textContent = S.vidas + ' vidas sobrantes';

  showScreen('results');
}

function animateScore(el, from, to, dur) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = Math.round(from + (to - from) * t) + ' pts';
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════
// CORAZONES
// ══════════════════════════════════════════
function actualizarCorazones() {
  for (let i = 1; i <= 3; i++) {
    const h = $('heart-' + i);
    if (i > S.vidas) {
      h.classList.add('lost');
    } else {
      h.classList.remove('lost');
    }
  }
}

// ══════════════════════════════════════════
// IRINA
// ══════════════════════════════════════════
function setIrina(context, state) {
  const src = IRINA[state] || IRINA.happy;
  const el = $('irina-' + context);
  if (el) el.src = src;
}

// ══════════════════════════════════════════
// SPEECH BUBBLE
// ══════════════════════════════════════════
let bubbleTimeout = null;

function mostrarBubble(texto, duracion) {
  clearTimeout(bubbleTimeout);
  const el = $('bubble-gameplay');
  el.textContent = texto;
  el.classList.remove('hidden');
  el.style.opacity = '1';

  if (duracion !== 0) {
    bubbleTimeout = setTimeout(() => ocultarBubble(), duracion || 3000);
  }
}

function ocultarBubble() {
  const el = $('bubble-gameplay');
  el.style.opacity = '0';
  setTimeout(() => el.classList.add('hidden'), 200);
}

// ══════════════════════════════════════════
// HINT
// ══════════════════════════════════════════
function resetHint(_caso) {
  clearHint();
  S.hintTimeout = setTimeout(() => {
    mostrarHint();
  }, 5000); // 5s de inactividad
}

function clearHint() {
  clearTimeout(S.hintTimeout);
  S.hintTimeout = null;
}

function mostrarHint() {
  // No mostrar hint en fase inspección
  if (!$('btns-inspeccion').classList.contains('hidden')) return;
  const caso = CASOS[S.casoIdx];
  if (caso.tipo === 'limpia' || S.vueltasActuales === 0) {
    mostrarBubble('Desliza el dedo circularmente alrededor de la rosca.');
    initCanvasAerea(false);
    setTimeout(dibujarHintFlecha, 100);
  }
}

// ══════════════════════════════════════════
// PARTÍCULAS
// ══════════════════════════════════════════
function resizeParticleCanvas() {
  elCanvasParticles.width  = window.innerWidth;
  elCanvasParticles.height = window.innerHeight;
}

function asmrBurst(x, y, isCorrect) {
  const colors = isCorrect
    ? ['#04FFB4', '#00E6BC', '#FFFFAB', '#C5FFDF']
    : ['#E74C3C', '#FF7675', '#FFFFAB'];
  const count = isCorrect ? 22 : 14;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
    const speed = isCorrect ? 2.8 + Math.random() * 3.2 : 2 + Math.random() * 2.5;
    asmrParts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: isCorrect ? 3.5 + Math.random() * 2.5 : 2.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: isCorrect ? 0.025 + Math.random() * 0.02 : 0.035 + Math.random() * 0.02,
    });
  }

  if (!asmrRafId) asmrLoop();
}

function asmrLoop() {
  ctxParticles.clearRect(0, 0, elCanvasParticles.width, elCanvasParticles.height);
  asmrParts = asmrParts.filter(p => p.alpha > 0);

  asmrParts.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // gravedad suave
    p.alpha -= p.decay;
    ctxParticles.globalAlpha = Math.max(0, p.alpha);
    ctxParticles.fillStyle = p.color;
    ctxParticles.beginPath();
    ctxParticles.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctxParticles.fill();
  });

  ctxParticles.globalAlpha = 1;

  if (asmrParts.length > 0) {
    asmrRafId = requestAnimationFrame(asmrLoop);
  } else {
    asmrRafId = null;
  }
}

// ══════════════════════════════════════════
// TASK COMPLETED
// ══════════════════════════════════════════
function postTaskCompleted() {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  } catch (e) {
    // No RN context (testing en desktop)
  }
}

// ══════════════════════════════════════════
// ARRANQUE
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', init);
