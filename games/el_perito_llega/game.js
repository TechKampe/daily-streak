'use strict';

// ===== CONSTANTES =====
const RECORD_KEY = 'el_perito_record';
const TASK_THRESHOLD = 400;

// ===== PIEZAS (assets reales) =====
const PIECE_ASSETS = {
  codo:       'assets/pieza_codo.png',
  manguito:   'assets/pieza_manguito.png',
  te:         'assets/pieza_t.png',
  reduccion:  'assets/pieza_reduccion.png',
  abrazadera: 'assets/pieza_abrazadera.png',
};

const PIECE_NAMES = {
  codo: 'Codo 90°',
  manguito: 'Manguito',
  te: 'Te',
  reduccion: 'Reducción',
  abrazadera: 'Abrazadera',
};

// ===== NIVELES =====
const LEVELS = [
  {
    id: 1,
    room: 'Baño',
    timer: 90,
    errors: [
      {
        id: 'e1', type: 'TORCIDO', label: 'TORCIDO',
        hint: 'El cambio de dirección no está a 90° — la tubería sale en diagonal. Necesitas el accesorio que <strong>gira la línea exactamente 90°</strong>.',
        x: 367, y: 83,
        correctPiece: 'codo', correctRotation: 0,
        feedbackOk: 'Eso es. Un codo bien montado queda perpendicular a la tubería. De frente y de perfil.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un codo.',
          why: 'Solo un codo cambia de dirección a 90°. Cualquier otra pieza deja la tubería torcida.',
          rule: 'Para cambiar de dirección se usa un codo. La señal visual es que quede a 90° exactos.',
          do: 'Elige el codo de la cuadrícula.',
        },
      },
    ],
    validPieces: ['codo'],
    distractors: ['manguito', 'te', 'reduccion'],
  },
  {
    id: 2,
    room: 'Cocina',
    timer: 90,
    errors: [
      {
        id: 'e1', type: 'TORCIDO', label: 'TORCIDO',
        hint: 'La unión está torcida — los dos tramos no quedan en el mismo eje. Necesitas el accesorio que <strong>une dos tramos rectos en línea recta</strong>.',
        x: 177, y: 143,
        correctPiece: 'manguito', correctRotation: 0,
        feedbackOk: 'Manguito recto. Ahora se puede repasar sin desmontar nada.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un manguito.',
          why: 'El manguito une dos tramos rectos alineados. Otra pieza no absorbe la desalineación.',
          rule: 'Un manguito bien montado queda en el mismo eje que los dos tramos que conecta.',
          do: 'Espera el manguito y colócalo con la orientación correcta.',
        },
      },
      {
        id: 'e2', type: 'INACCESIBLE', label: 'INACCESIBLE',
        hint: 'El accesorio está pegado a la pared — imposible meter herramienta si hay fuga. Necesitas el que <strong>gira 90° y deja espacio libre</strong> entre el accesorio y el obstáculo.',
        x: 410, y: 222,
        correctPiece: 'codo', correctRotation: 90,
        feedbackOk: 'Con hueco entre el accesorio y la pared, mañana puedes meter la llave sin desmontar el armario.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza que no es un codo con separador.',
          why: 'El accesorio puede ser correcto, pero si está pegado a la pared no puedes tocarlo si hay fuga.',
          rule: 'Una unión mantenible tiene hueco suficiente para meter herramienta. Siempre.',
          do: 'Necesitas el codo orientado para dejar espacio libre entre el accesorio y el obstáculo.',
        },
      },
    ],
    validPieces: ['manguito', 'codo'],
    distractors: ['te', 'reduccion', 'abrazadera'],
  },
  {
    id: 3,
    room: 'Lavandería',
    timer: 75,
    errors: [
      {
        id: 'e1', type: 'FORZADO', label: 'FORZADO',
        hint: 'La tubería está tensionada — tira hacia un lado. Necesitas el accesorio que <strong>une dos tramos rectos sin forzar</strong>, dejando la línea sin tensión.',
        x: 188, y: 162,
        correctPiece: 'manguito', correctRotation: 0,
        feedbackOk: 'Sin tensión. Una unión forzada es la que cede primero cuando hay golpe de ariete.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un manguito recto.',
          why: 'Un codo cambia de dirección, no absorbe tensión en un tramo recto.',
          rule: 'Un tramo forzado se corrige con la longitud correcta de tubería y un manguito bien asentado, sin tensión.',
          do: 'Busca el manguito recto — el que permite presentar en seco sin forzar.',
        },
      },
      {
        id: 'e2', type: 'TORCIDO', label: 'TORCIDO',
        hint: 'La conexión está inclinada — el tramo más grueso no encaja bien con el más fino. Necesitas el accesorio que <strong>conecta tuberías de distinto diámetro en línea recta</strong>.',
        x: 500, y: 121,
        correctPiece: 'reduccion', correctRotation: 0,
        feedbackOk: 'Reducción alineada. Cada accesorio sentado en su eje, sin tensiones.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va una reducción.',
          why: 'La reducción cambia el diámetro de la tubería. Sustituirla por otro accesorio rompe el circuito.',
          rule: 'Cada accesorio tiene una función específica. Una reducción va donde hay cambio de diámetro.',
          do: 'Espera la reducción y colócala con la orientación correcta.',
        },
      },
    ],
    validPieces: ['manguito', 'reduccion'],
    distractors: ['codo', 'te', 'abrazadera'],
  },
  {
    id: 4,
    room: 'Baño principal',
    timer: 75,
    errors: [
      {
        id: 'e1', type: 'TORCIDO', label: 'TORCIDO',
        hint: 'El cambio de dirección sale a 30° en vez de 90° — el tramo vertical queda en diagonal. Necesitas el que <strong>gira la tubería exactamente 90°</strong>.',
        x: 141, y: 128,
        correctPiece: 'codo', correctRotation: 0,
        feedbackOk: 'Codo a 90°. Recta visual de frente y de perfil.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un codo.',
          why: 'Solo el codo cambia de dirección correctamente. Cualquier otra pieza deja el recorrido torcido.',
          rule: 'El codo es el accesorio de cambio de dirección. Tiene que quedar perpendicular a los dos tramos.',
          do: 'Espera el codo y colócalo con la orientación correcta.',
        },
      },
      {
        id: 'e2', type: 'INACCESIBLE', label: 'INACCESIBLE',
        hint: 'La derivación está pegada al suelo — no hay hueco para meter herramienta si hay fuga. Necesitas el accesorio que <strong>crea una salida perpendicular</strong> y queda separado del obstáculo.',
        x: 338, y: 203,
        correctPiece: 'te', correctRotation: 0,
        feedbackOk: 'La te queda separada del suelo. Si hay fuga en esa derivación, puedes acceder sin romper el alicatado.',
        feedbackWrongPiece: {
          what: 'Has colocado una reducción donde va una te.',
          why: 'Una reducción cambia diámetro, no crea derivaciones. El error aquí es que la te está inaccesible.',
          rule: 'Una te mantenible tiene que quedar con hueco libre en sus tres salidas para poder manipularla.',
          do: 'Usa la te con la orientación que deja la derivación a distancia del obstáculo.',
        },
      },
      {
        id: 'e3', type: 'FORZADO', label: 'FORZADO',
        hint: 'El tramo tira hacia la pared — está forzado. Necesitas el accesorio que <strong>une dos tramos rectos</strong> sin tensión, presentado en seco antes de apretar.',
        x: 547, y: 180,
        correctPiece: 'manguito', correctRotation: 0,
        feedbackOk: 'Tramo sin tensión. Presentar en seco antes de apretar — siempre.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un manguito recto.',
          why: 'El tramo está forzado porque la longitud no es la correcta. Solo un manguito bien asentado absorbe esa tensión.',
          rule: 'Presentar en seco, verificar que no hay tensión, luego apretar. En ese orden.',
          do: 'Busca el manguito recto.',
        },
      },
    ],
    validPieces: ['codo', 'te', 'manguito'],
    distractors: ['reduccion', 'abrazadera'],
  },
  {
    id: 5,
    room: 'Galería',
    timer: 60,
    errors: [
      {
        id: 'e1', type: 'SIN FIJAR', label: 'SIN FIJAR',
        hint: 'La tubería no está anclada — cuelga y vibra con el paso del agua. Necesitas el accesorio que <strong>fija la tubería a la pared</strong> y la mantiene recta.',
        x: 303, y: 689,
        correctPiece: 'abrazadera', correctRotation: 0,
        feedbackOk: 'Fijado. Una línea sin fijar vibra con el paso del agua y acaba cediendo. Dos abrazaderas, separación constante.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde van abrazaderas de fijación.',
          why: 'Un codo cambia de dirección. Este tramo ya está en dirección correcta — el problema es que no está fijado.',
          rule: 'Una línea recta se mantiene recta con fijación homogénea. Sin abrazaderas, vibra y se tuerce con el uso.',
          do: 'Usa las abrazaderas — las que mantienen el tramo recto y pegado a la pared.',
        },
      },
      {
        id: 'e2', type: 'TORCIDO', label: 'TORCIDO',
        hint: 'El accesorio de la esquina está girado — la tubería no sale perpendicular. Necesitas el que <strong>gira la línea exactamente 90°</strong> en la orientación correcta.',
        x: 1695, y: 543,
        correctPiece: 'codo', correctRotation: 90,
        feedbackOk: 'Codo recto. El perito lo ha visto — y está bien.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un codo.',
          why: 'Para cambiar de dirección solo vale el codo. Otro accesorio deja la línea torcida.',
          rule: 'El codo a 90° en la orientación correcta es la única solución para un cambio de dirección limpio.',
          do: 'Elige el codo de la cuadrícula.',
        },
      },
      {
        id: 'e3', type: 'INACCESIBLE', label: 'INACCESIBLE',
        hint: 'La unión está pegada a la estructura — sin hueco para actuar si hay fuga. Necesitas el que <strong>une dos tramos rectos</strong> dejando espacio libre alrededor.',
        x: 1795, y: 730,
        correctPiece: 'manguito', correctRotation: 0,
        feedbackOk: 'Manguito con hueco. Si mañana hay fuga, puedes acceder sin desmontar nada.',
        feedbackWrongPiece: {
          what: 'Has colocado una pieza incorrecta donde va un manguito con separación del obstáculo.',
          why: 'El problema no es el tipo de accesorio sino que está pegado a la estructura. Sin hueco no puedes manipularlo.',
          rule: 'Una unión mantenible tiene siempre hueco suficiente para meter herramienta.',
          do: 'Coloca el manguito dejando separación del obstáculo.',
        },
      },
    ],
    validPieces: ['abrazadera', 'codo', 'manguito'],
    distractors: ['te', 'reduccion'],
  },
];

// ===== ESTADO =====
const S = {
  screen: 'intro',
  level: 0,
  score: 0,
  lives: 3,
  tutorialDone: false,
  currentErrors: [],
  pieceQueue: [],
  activeErrorIdx: 0,
  timerInterval: null,
  timerSeconds: 90,
  timerElapsed: 0,
  levelScore: 0,
  levelLivesAtStart: 3,
};

// ===== UTILIDADES =====
function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  S.screen = id;
  if (id === 'results') {
    document.documentElement.classList.add('results');
  } else {
    document.documentElement.classList.remove('results');
  }
}

function postCompleted() {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  } catch (e) { /* desktop testing */ }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== RECORD =====
function getRecord() { return parseInt(localStorage.getItem(RECORD_KEY) || '0'); }
function setRecord(n) { localStorage.setItem(RECORD_KEY, String(n)); }

// ===== VIDAS =====
function updateLivesUI() {
  for (let i = 1; i <= 3; i++) {
    const h = $(`h${i}`);
    if (i <= S.lives) {
      h.classList.remove('lost');
    } else {
      h.classList.add('lost');
      h.classList.add('shake');
      setTimeout(() => h.classList.remove('shake'), 400);
    }
  }
}

function loseLife() {
  S.lives--;
  updateLivesUI();
  if (S.lives <= 0) {
    stopTimer();
    setTimeout(showResults, 800);
  }
}

// ===== PUNTUACIÓN =====
function updateScoreUI() {
  $('score-display').textContent = `${S.score} pts`;
}

// ===== TIMER PERITO =====
function startTimer(seconds) {
  S.timerSeconds = seconds;
  S.timerElapsed = 0;
  const bar = $('perito-bar');
  bar.style.width = '0%';
  bar.classList.remove('warn', 'danger');

  S.timerInterval = setInterval(() => {
    S.timerElapsed++;
    const pct = (S.timerElapsed / S.timerSeconds) * 100;
    bar.style.width = `${Math.min(pct, 100)}%`;

    if (pct >= 90) bar.classList.add('danger');
    else if (pct >= 70) { bar.classList.remove('danger'); bar.classList.add('warn'); }

    if (S.timerElapsed >= S.timerSeconds) {
      stopTimer();
      peritoArrived();
    }
  }, 1000);
}

function stopTimer() {
  if (S.timerInterval) { clearInterval(S.timerInterval); S.timerInterval = null; }
}

function peritoArrived() {
  const pending = S.currentErrors.filter(e => !e.solved).length;
  const penalty = pending * 50;
  S.score = Math.max(0, S.score - penalty);
  updateScoreUI();

  const overlay = $('perito-overlay');
  overlay.classList.remove('hidden');
  showFloatingBubble('Lo ha visto. Esto me va a costar puntos. Pero todavía puedo arreglarlo.', 'worried');
  setTimeout(() => overlay.classList.add('hidden'), 2500);
}

// ===== CUADRÍCULA DE PIEZAS =====
function renderPieceGrid(level) {
  const grid = $('piece-grid');
  grid.innerHTML = '';

  // Por cada error activo: 1 pieza válida + 2 distractores únicos
  const activeError = S.currentErrors[S.activeErrorIdx] || level.errors[0];
  const correct = activeError.correctPiece;
  const allTypes = ['codo', 'manguito', 'te', 'reduccion', 'abrazadera'];
  const candidates = [...new Set([...level.distractors, ...allTypes])].filter(t => t !== correct);
  const distPool = shuffle(candidates);
  const all = shuffle([correct, distPool[0], distPool[1]]);

  for (const type of all) {
    const card = document.createElement('div');
    card.className = 'piece-card';
    card.dataset.type = type;
    card.innerHTML = `
      <img src="${PIECE_ASSETS[type]}" alt="${PIECE_NAMES[type]}" />
      <span class="piece-label">${PIECE_NAMES[type]}</span>
    `;

    function onTap(e) {
      e.preventDefault();
      e.stopPropagation();
      onPieceTap(type);
    }

    card.addEventListener('touchend', onTap, { passive: false });
    card.addEventListener('click', onTap);

    grid.appendChild(card);
  }
}

// ===== INTERACCIÓN CON PIEZAS =====
function onPieceTap(type) {
  const error = S.currentErrors[S.activeErrorIdx];
  if (!error || error.solved) return;

  if (type === error.correctPiece) {
    correctPlacement(S.activeErrorIdx, type);
  } else {
    wrongPiece(S.activeErrorIdx);
  }
}

// ===== HELPER: dibuja flecha en SVG =====
function drawArrow(svg, x, y, color) {
  const [vbW] = IMG_DIMS[S.level];
  const scale = vbW / 600;
  const tail = Math.round(160 * scale);
  const tip  = Math.round(28  * scale);
  const head = Math.round(28  * scale);
  const sw   = Math.round(6   * scale);
  svg.innerHTML = `
    <g class="hotspot-arrow">
      <line x1="${x-tail}" y1="${y-tail}" x2="${x-tip}" y2="${y-tip}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
      <polygon points="${x-tip},${y-tip} ${x-tip-head},${y-tip-4} ${x-tip-4},${y-tip-head}" fill="${color}"/>
    </g>`;
}

// ===== ACTIVAR ERROR =====
function setActiveError(idx) {
  S.activeErrorIdx = idx;
  const error = S.currentErrors[idx];
  if (!error) return;

  // Re-renderizar piezas para el error activo
  const level = LEVELS[S.level];
  renderPieceGrid(level);

  // Flecha apuntando al error desde arriba-izquierda
  const svg = $('hotspot-svg');
  const x = error.x;
  const y = error.y;
  drawArrow(svg, x, y, '#E74C3C');

  // Panel de contexto
  $('ctx-type').textContent = error.label;
  $('ctx-text').innerHTML = error.hint || '';
  $('error-context').classList.remove('hidden');

  // Avatar en estado normal mientras espera
  $('gameplay-avatar').src = avatarSrc('happy');
}

// ===== EVALUACIÓN =====
function correctPlacement(errorIdx, type) {
  const error = S.currentErrors[errorIdx];
  error.solved = true;
  error.attempts = (error.attempts || 0) + 1;

  const pts = error.attempts === 1 ? 150 : error.attempts === 2 ? 80 : 30;
  S.score += pts;
  S.levelScore += pts;
  updateScoreUI();

  // Marcar la piece-card usada
  const cards = $('piece-grid').querySelectorAll('.piece-card');
  for (const card of cards) {
    if (card.dataset.type === type && !card.classList.contains('used')) {
      card.classList.add('used');
      break;
    }
  }

  showFloatingBubble(error.feedbackOk, 'celebrating');

  // Burst ASMR en el punto del error
  (function() {
    const area = $('installation-area');
    const rect = area.getBoundingClientRect();
    const vbW = 430, vbH = 280;
    const scaleX = rect.width  / vbW;
    const scaleY = rect.height / vbH;
    const bx = rect.left + error.x * scaleX;
    const by = rect.top  + error.y * scaleY;
    asmrBurst(bx, by, true);
  })();

  // Buscar siguiente error no resuelto
  const nextIdx = S.currentErrors.findIndex((e, i) => i > errorIdx && !e.solved);
  if (nextIdx !== -1) {
    // Flash verde breve, luego flecha del siguiente
    const svg = $('hotspot-svg');
    const x = error.x; const y = error.y;
    drawArrow(svg, x, y, '#00E6BC');
    setTimeout(() => setActiveError(nextIdx), 500);
  } else {
    const allSolved = S.currentErrors.every(e => e.solved);
    if (allSolved) {
      $('hotspot-svg').innerHTML = '';
      stopTimer();
      setTimeout(levelComplete, 1800);
    } else {
      const anyIdx = S.currentErrors.findIndex(e => !e.solved);
      drawArrow($('hotspot-svg'), error.x, error.y, '#00E6BC');
      setTimeout(() => setActiveError(anyIdx), 500);
    }
  }
}

function wrongPiece(errorIdx) {
  const error = S.currentErrors[errorIdx];
  error.attempts = (error.attempts || 0) + 1;

  loseLife();
  if (S.lives <= 0) return;

  showEduOverlay(error.feedbackWrongPiece);
}

// ===== OVERLAYS =====
function showFloatingBubble(msg, state) {
  const bubble = $('speech-bubble-gameplay');
  $('speech-text-gameplay').textContent = msg;
  $('gameplay-avatar').src = avatarSrc(state);
  bubble.classList.remove('hidden');
  setTimeout(() => bubble.classList.add('hidden'), 3000);
}

function showEduOverlay(feedback) {
  $('edu-what').textContent = feedback.what;
  $('edu-why').textContent = feedback.why;
  $('edu-rule').textContent = feedback.rule;
  $('edu-do').textContent = feedback.do;
  $('edu-overlay').classList.remove('hidden');
}

function hideEduOverlay() {
  $('edu-overlay').classList.add('hidden');
}

// ===== NIVEL COMPLETADO =====
function levelComplete() {
  const livesNow = S.lives;
  if (livesNow === S.levelLivesAtStart) {
    S.score += 100;
    S.levelScore += 100;
    updateScoreUI();
  }

  // Si era el último nivel, ir directo a resultados
  if (S.level >= LEVELS.length - 1) {
    setTimeout(showResults, 800);
    return;
  }

  const overlay = $('level-overlay');
  $('level-points').textContent = `+${S.levelScore} pts`;

  const timerDone = S.timerElapsed >= S.timerSeconds;
  const msg = timerDone
    ? 'Arreglado. Aunque el perito ya había visto algo, lo que queda está bien hecho.'
    : 'Terminado antes de que llegara. Eso se llama trabajar bien.';
  $('level-message').textContent = msg;
  $('level-avatar').src = timerDone ? avatarSrc('happy') : avatarSrc('celebrating');

  overlay.classList.remove('hidden');
}

function nextLevel() {
  $('level-overlay').classList.add('hidden');
  S.level++;
  if (S.level >= LEVELS.length) {
    showResults();
    return;
  }
  startLevel(S.level);
}

// ===== RESULTADOS =====
function showResults() {
  stopTimer();

  const prev = getRecord();
  if (S.score > prev) setRecord(S.score);
  if (S.score >= TASK_THRESHOLD) postCompleted();

  $('final-score').textContent = `${S.score} pts`;

  if (S.score > prev) {
    $('record-display').textContent = `¡Nuevo récord! ${S.score} pts`;
  } else {
    $('record-display').textContent = `Récord: ${prev} pts`;
  }

  let msg, state;
  if (S.score >= 1200) {
    msg = 'El perito no ha visto nada. Instalación de profesional. Recta, alineada, accesible — los tres.';
    state = 'celebrating';
  } else if (S.score >= 400) {
    msg = 'Superado. Pero hay margen — repasa los accesorios inaccesibles. Son los que más se pasan por alto.';
    state = 'happy';
  } else {
    msg = 'El perito ha cobrado. Practica el criterio: antes de cerrar, pregúntate si puedes acceder si mañana hay fuga.';
    state = 'worried';
  }

  $('results-message').textContent = msg;
  $('results-avatar').src = avatarSrc(state);

  showScreen('results');
}

// ===== INSTALACIÓN: IMAGEN PNG =====
// Dimensiones reales de cada PNG (width x height en píxeles)
const IMG_DIMS = [
  [600, 174],   // n1
  [600, 360],   // n2
  [600, 333],   // n3
  [600, 341],   // n4
  [1944, 1277], // n5
];

function renderInstallation(levelIdx) {
  const img = $('installation-img');
  img.src = `assets/instalacion_n${levelIdx + 1}.png`;
  // Ajustar viewBox del SVG a las dimensiones reales del PNG
  const [w, h] = IMG_DIMS[levelIdx];
  $('hotspot-svg').setAttribute('viewBox', `0 0 ${w} ${h}`);
}

// ===== MODO CALIBRACIÓN =====
// Actívalo desde consola: enableCalib()
// Al hacer clic en la imagen muestra las coordenadas relativas (0–430 x 0–280)
function enableCalib() {
  const area = $('installation-area');
  const img = $('installation-img');
  const tooltip = $('calib-tooltip');
  tooltip.classList.remove('hidden');

  area.addEventListener('click', function onCalibClick(e) {
    const rect = img.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const [w, h] = IMG_DIMS[S.level];
    const lx = Math.round(relX * w);
    const ly = Math.round(relY * h);

    // Posicionar tooltip
    const areaRect = area.getBoundingClientRect();
    tooltip.style.left = `${e.clientX - areaRect.left}px`;
    tooltip.style.top = `${e.clientY - areaRect.top}px`;
    tooltip.textContent = `x:${lx} y:${ly}`;

    console.log(`Error coords → x: ${lx}, y: ${ly}`);
  });

  console.log('Modo calibración ON — haz clic en la imagen para obtener coordenadas.');
}
window.enableCalib = enableCalib;

// ===== INICIO DE NIVEL =====
function startLevel(idx) {
  const level = LEVELS[idx];
  S.currentErrors = level.errors.map(e => ({ ...e, solved: false, attempts: 0 }));
  S.levelScore = 0;
  S.levelLivesAtStart = S.lives;

  renderInstallation(idx);
  setActiveError(0);

  $('perito-bar').style.width = '0%';
  $('perito-bar').classList.remove('warn', 'danger');
  startTimer(level.timer);
}

// ===== AVATAR =====
function avatarSrc(state) {
  switch (state) {
    case 'celebrating': return 'assets/yaiza_celebrating.png';
    case 'worried':     return 'assets/yaiza_worried.png';
    default:            return 'assets/yaiza_happy.png';
  }
}

// ===== ASMR — canvas partículas =====
const asmrCv  = document.getElementById('asmr-canvas');
const asmrCtx = asmrCv.getContext('2d');
let asmrParts = [];
let asmrRafId = null;

function asmrResize() {
  asmrCv.width  = window.innerWidth;
  asmrCv.height = window.innerHeight;
}
asmrResize();
window.addEventListener('resize', asmrResize);

function asmrBurst(x, y, isCorrect) {
  const color = isCorrect ? ['#04FFB4', '#00E6BC', '#FFFFAB'] : ['#E74C3C', '#FF7675', '#FFFFAB'];
  const count = isCorrect ? 22 : 14;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .4;
    const speed = isCorrect ? 2.8 + Math.random() * 3.2 : 2 + Math.random() * 2.5;
    asmrParts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: isCorrect ? 3.5 + Math.random() * 2.5 : 2.5 + Math.random() * 2,
      color: color[Math.floor(Math.random() * color.length)],
      alpha: 1,
      decay: isCorrect ? .025 + Math.random() * .02 : .035 + Math.random() * .02,
    });
  }
  if (!asmrRafId) asmrLoop();
}

function asmrLoop() {
  asmrCtx.clearRect(0, 0, asmrCv.width, asmrCv.height);
  asmrParts = asmrParts.filter(p => p.alpha > 0.02);
  asmrParts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += .12;
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

// ===== INIT =====
function init() {
  $('btn-start').addEventListener('click', () => {
    if (!S.tutorialDone && !sessionStorage.getItem('tutorialDone')) {
      showScreen('tutorial');
    } else {
      startGame();
    }
  });

  $('btn-tutorial-ok').addEventListener('click', () => {
    S.tutorialDone = true;
    sessionStorage.setItem('tutorialDone', '1');
    startGame();
  });

  $('btn-entendido').addEventListener('click', hideEduOverlay);

  $('btn-next-level').addEventListener('click', nextLevel);

  $('btn-retry').addEventListener('click', () => {
    S.score = 0;
    S.lives = 3;
    S.level = 0;
    updateScoreUI();
    updateLivesUI();
    showScreen('play');
    startLevel(0);
  });
}

function startGame() {
  S.score = 0;
  S.lives = 3;
  S.level = 0;
  updateScoreUI();
  updateLivesUI();
  showScreen('play');
  startLevel(0);
}

document.addEventListener('DOMContentLoaded', init);
