/* ═══════════════════════════════════════════════════════
   PENDIENTE DE NOTA — game.js
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── Constants ────────────────────────────────────────────
const RECORD_KEY     = 'pendiente_de_nota_record';
const TASK_THRESHOLD = 400;

// SVG geometry — 3 segments filling ~500 of 560 SVG units
const SVG_W   = 560;
const SVG_H   = 160;
const SVG_CY  = 80;
const SEG_LEN = 160;   // 3 × 160 = 480, + 30 pad = 510 → fills viewBox
const SEG_PAD = 30;

const SCORE = {
  CORRECT:      150,
  ROUND_BONUS:  100,
  QUESTION_BONUS: 50,
};

// ── Difficulty config per round (0-indexed) ───────────────
const DIFFICULTY = [
  { correctMin: 2, correctMax: 8, hideLabels: false },
  { correctMin: 2, correctMax: 8, hideLabels: false },
  { correctMin: 2, correctMax: 6, hideLabels: true  },
  { correctMin: 2, correctMax: 5, hideLabels: true  },
];

// ── Round data ────────────────────────────────────────────
const ROUNDS = [
  {
    label: 'BAÑO',
    intro: 'Primer baño del episodio. Simple, directo. No lo compliques.',
    pipes: [
      { label: 'Del lavabo al sifón',          target: 5 },
      { label: 'Del sifón al codo de pared',   target: 4 },
      { label: 'Tramo final hasta la bajante', target: 6 },
    ],
    question: {
      prompt: '¿Qué pasa si la tubería tiene poca inclinación?',
      options: [
        { text: 'El agua va lenta, se queda sucia y acaba atascando',          correct: true  },
        { text: 'El agua corre demasiado rápido y erosiona la tubería',         correct: false },
        { text: 'El sifón pierde el agua del cierre hidráulico',                correct: false },
      ],
      feedbackOk:  '¡Exacto! Con pendiente insuficiente el agua no tiene impulso suficiente y los sólidos se depositan en el fondo del tubo.',
      feedbackErr: 'No. La poca inclinación hace que el agua vaya lenta y deje los residuos pegados — acaba en atasco.',
    },
  },
  {
    label: 'COCINA',
    intro: 'La cocina. Las pendientes son más delicadas. Ojo con quedarte corto.',
    pipes: [
      { label: 'Del fregadero al sifón',        target: 3   },
      { label: 'Del sifón a la curva de pared', target: 2.5 },
      { label: 'Tramo final hasta la bajante',  target: 4   },
    ],
    question: {
      prompt: '¿Qué pasa si la inclinación va al revés?',
      options: [
        { text: 'El agua retorna al punto de origen — no puede salir', correct: true  },
        { text: 'El agua drena igual pero más despacio',                correct: false },
        { text: 'El sifón pierde eficacia pero el agua sigue saliendo', correct: false },
      ],
      feedbackOk:  '¡Correcto! La pendiente al revés crea un retorno: el agua no puede ir hacia la bajante y vuelve al fregadero.',
      feedbackErr: 'No. Con pendiente al revés el agua no puede vencer la gravedad — retorna al fregadero. Es el error más grave.',
    },
  },
  {
    label: 'DUCHA',
    intro: 'Zona válida más estrecha: 2° a 6°. Mantén el ojo.',
    pipes: [
      { label: 'Salida del plato de ducha',    target: 3 },
      { label: 'Tramo horizontal',             target: 4 },
      { label: 'Giro final hacia la bajante',  target: 5 },
    ],
    question: {
      prompt: '¿Por qué no puede ser la pendiente excesiva?',
      options: [
        { text: 'El agua arrastra los sólidos pero deja las grasas pegadas, generando atasco', correct: true  },
        { text: 'El agua corre tan rápido que el sifón pierde el cierre hidráulico',           correct: false },
        { text: 'La normativa lo prohíbe pero no hay razón técnica concreta',                  correct: false },
      ],
      feedbackOk:  '¡Así es! Con pendiente exagerada el líquido se escapa rápido pero las grasas y sólidos quedan adheridos. A largo plazo, atasco seguro.',
      feedbackErr: 'No. El problema real es que el agua arrastra el líquido pero deja las grasas y sólidos pegados en la pared del tubo.',
    },
  },
  {
    label: 'LAVANDERÍA',
    intro: 'Modo experto: zona válida 2°–5°. Sin etiquetas. A ojo, como en obra.',
    pipes: [
      { label: 'Salida lavadora',                  target: 2 },
      { label: 'Tramo intermedio hacia la pared',  target: 3 },
      { label: 'Tramo final — no te pases',        target: 5 },
    ],
    question: {
      prompt: 'En una obra terminas y al día siguiente huele mal. ¿Qué es lo primero que revisas?',
      options: [
        { text: 'El sifón — es el que evita que suban los gases de la bajante', correct: true  },
        { text: 'La pendiente — puede que el agua no esté evacuando bien',      correct: false },
        { text: 'Las juntas — puede haber una fuga en algún empalme',           correct: false },
      ],
      feedbackOk:  '¡Exacto! El sifón retiene una columna de agua que actúa como barrera contra los gases. Si huele, el sifón está seco, mal colocado o directamente no está.',
      feedbackErr: 'El olor casi siempre es el sifón. Es el único elemento que bloquea físicamente los gases de la bajante. Sin él, o seco, siempre huele.',
    },
  },
];

// ── Educational feedback (pipe angles) ───────────────────
const EDU = {
  insuficiente: {
    what:   'La pendiente es casi plana — el agua no tiene suficiente impulso para llegar a la bajante.',
    why:    'Con pendiente insuficiente el agua va lenta, se queda sucia y acaba atascando la tubería.',
    rule:   'La pendiente de evacuación tiene que ser visible a ojo: el tubo baja claramente hacia la salida.',
    action: 'Baja más el extremo libre. Tiene que verse claramente que cae hacia la bajante.',
  },
  al_reves: {
    what:   'El tubo sube hacia la bajante — la pendiente va al revés.',
    why:    'Con pendiente al revés el agua no puede salir — retorna al punto de origen. Es el error más grave.',
    rule:   'La evacuación siempre baja hacia la bajante. Nunca sube.',
    action: 'El extremo libre tiene que quedar más bajo que el extremo anclado. Baja el handle.',
  },
  exceso: {
    what:   'La pendiente es demasiado pronunciada.',
    why:    'Con pendiente excesiva el agua arrastra los sólidos pero deja las grasas pegadas. A largo plazo, atasca.',
    rule:   'La pendiente correcta está entre 2° y el máximo de esta ronda. Visible pero no exagerada.',
    action: 'Sube ligeramente el handle. El tubo tiene que bajar con suavidad, no en picado.',
  },
};

// ── Pablo messages ────────────────────────────────────────
const MSG_CORRECT = [
  '¡AHÍ ESTÁ! ¡El agua fluye! ¡Eso es una pendiente correcta, señoras y señores!',
  '¡PERFECTA! Del origen a la bajante sin dudar. ¡Así se hace!',
  '¡OTRA VEZ! ¡Pendiente positiva y dentro de rango! ¡El concursante sabe!',
];

const MSG = {
  insuficiente: 'El agua no llega… La pendiente es casi plana. Eso se atasca en tres meses.',
  al_reves:     '¡NO! ¡El agua vuelve para atrás! ¡La pendiente está al revés! Esto es… un retorno en directo.',
  exceso:       'Demasiado inclinado. El agua corre pero las grasas se quedan. Esto atasca igual.',
  round_perfect:'¡Ronda perfecta! Pendiente correcta en todos los tramos. Esto va a nota.',
  round_errors: 'Habitación terminada. Algunos tramos fallaron, pero lo esencial está. Sigamos.',
  result_high:  '¡ESTO ES INSTALACIÓN DE CATÁLOGO! Pendiente perfecta en todas las habitaciones… ¡te mereces el trofeo del gremio!',
  result_mid:   'Superado. Pero hay tramos que necesitan más criterio — sobre todo los cortos de pendiente. Ojo con el insuficiente.',
  result_low:   'Hay retornos en esta bajante. Practica el ojo: el tubo tiene que bajar claramente hacia la salida.',
};

// ── State ─────────────────────────────────────────────────
const S = {
  lives:               3,
  score:               0,
  roundIdx:            0,
  pipeIdx:             0,
  roundErrors:         0,
  correctMsgIdx:       0,
  inputEnabled:        false,
  dragging:            false,
  currentAngle:        0,
  eduAnsweredCorrect:  false,
  chainPoints:         [],
};

// ── DOM refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

const screens = {
  intro:   $('intro'),
  play:    $('play'),
  results: $('results'),
};

// ── Screen switching ──────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => {
    el.classList.toggle('active', k === name);
    el.classList.toggle('hidden', k !== name);
  });
  if (name === 'results') document.documentElement.classList.add('results');
  else                    document.documentElement.classList.remove('results');
}

// ── Record ────────────────────────────────────────────────
function getRecord()    { return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10); }
function saveRecord(sc) { if (sc > getRecord()) localStorage.setItem(RECORD_KEY, sc); }

// ── TASK_COMPLETED ────────────────────────────────────────
function sendTaskCompleted() {
  try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); }
  catch(e) {}
}

// ── HUD ───────────────────────────────────────────────────
function updateHUD() {
  $('hud-score').textContent = S.score + ' pts';
  $('hud-round').textContent = 'Ronda ' + (S.roundIdx + 1) + '/4';
  [1,2,3].forEach(i => $('h' + i).classList.toggle('lost', i > S.lives));
}

function shakeHeart(lifeNum) {
  const el = $('h' + lifeNum);
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// ── Pablo ─────────────────────────────────────────────────
const AVATARS = {
  happy:       'https://res.cloudinary.com/kampe/image/upload/v1773664970/Pablo_happy_rtnvol.png',
  celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1773664966/Pablo_celebrating_mrmefy.png',
  worried:     'https://res.cloudinary.com/kampe/image/upload/v1773664967/Pablo_worried_uevq5g.png',
};

function setPablo(state, msg) {
  $('pablo-avatar').src = AVATARS[state] || AVATARS.happy;
  const bubble = $('pablo-bubble');
  if (msg) {
    bubble.textContent = msg;
    bubble.classList.remove('hidden');
  } else {
    bubble.classList.add('hidden');
  }
}

// ── Chain geometry ────────────────────────────────────────
function currentAnchor() {
  if (S.chainPoints.length === 0) return { x: SEG_PAD, y: SVG_CY };
  return S.chainPoints[S.chainPoints.length - 1];
}

// ── SVG drawing ───────────────────────────────────────────
// buildPipeSVG: creates all elements from scratch (call on pipe load / after commit)
function buildPipeSVG(activeDeg) {
  const svg = $('pipe-svg');
  const NS  = 'http://www.w3.org/2000/svg';

  Array.from(svg.children).forEach(el => {
    if (el.id !== 'water-particles') el.remove();
  });

  // Bajante marker — fixed vertical pipe on the right edge
  const bx = SEG_PAD + SEG_LEN * 3 + 10; // right end of 3 segments
  const bajanteLine = document.createElementNS(NS, 'line');
  bajanteLine.setAttribute('x1', bx); bajanteLine.setAttribute('y1', 20);
  bajanteLine.setAttribute('x2', bx); bajanteLine.setAttribute('y2', SVG_H - 10);
  bajanteLine.setAttribute('stroke', '#00E6BC');
  bajanteLine.setAttribute('stroke-width', '6');
  bajanteLine.setAttribute('stroke-dasharray', '6 4');
  bajanteLine.setAttribute('opacity', '0.5');
  svg.insertBefore(bajanteLine, $('water-particles'));
  // Arrow pointing down on bajante
  const arr = document.createElementNS(NS, 'polygon');
  arr.setAttribute('points', `${bx-8},${SVG_H-24} ${bx+8},${SVG_H-24} ${bx},${SVG_H-10}`);
  arr.setAttribute('fill', '#00E6BC');
  arr.setAttribute('opacity', '0.7');
  svg.insertBefore(arr, $('water-particles'));

  // Past segments
  S.chainPoints.forEach((pt, i) => {
    const prev = i === 0 ? { x: SEG_PAD, y: SVG_CY } : S.chainPoints[i - 1];
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', prev.x); line.setAttribute('y1', prev.y);
    line.setAttribute('x2', pt.x);   line.setAttribute('y2', pt.y);
    line.setAttribute('stroke', '#3a5060');
    line.setAttribute('stroke-width', '12');
    line.setAttribute('stroke-linecap', 'round');
    svg.insertBefore(line, $('water-particles'));

    const joint = document.createElementNS(NS, 'circle');
    joint.setAttribute('cx', pt.x); joint.setAttribute('cy', pt.y);
    joint.setAttribute('r', '7'); joint.setAttribute('fill', '#3a5060');
    svg.insertBefore(joint, $('water-particles'));
  });

  // Active segment elements (persistent — updated in updateActivePipe)
  const a   = currentAnchor();
  const rad = activeDeg * Math.PI / 180;
  const ex  = a.x + SEG_LEN * Math.cos(rad);
  const ey  = a.y + SEG_LEN * Math.sin(rad);

  const activeLine = document.createElementNS(NS, 'line');
  activeLine.id = 'pipe-line';
  activeLine.setAttribute('x1', a.x); activeLine.setAttribute('y1', a.y);
  activeLine.setAttribute('x2', ex);  activeLine.setAttribute('y2', ey);
  activeLine.setAttribute('stroke', '#8899aa');
  activeLine.setAttribute('stroke-width', '14');
  activeLine.setAttribute('stroke-linecap', 'round');
  svg.insertBefore(activeLine, $('water-particles'));

  const anchorDot = document.createElementNS(NS, 'circle');
  anchorDot.id = 'anchor-dot';
  anchorDot.setAttribute('cx', a.x); anchorDot.setAttribute('cy', a.y);
  anchorDot.setAttribute('r', '10');
  anchorDot.setAttribute('fill', S.chainPoints.length === 0 ? '#00E6BC' : '#3a5060');
  svg.insertBefore(anchorDot, $('water-particles'));

  const touch = document.createElementNS(NS, 'circle');
  touch.id = 'pipe-handle-touch';
  touch.setAttribute('cx', ex); touch.setAttribute('cy', ey);
  touch.setAttribute('r', '40'); touch.setAttribute('fill', 'transparent');
  svg.insertBefore(touch, $('water-particles'));

  const handle = document.createElementNS(NS, 'circle');
  handle.id = 'pipe-handle';
  handle.setAttribute('cx', ex); handle.setAttribute('cy', ey);
  handle.setAttribute('r', '20'); handle.setAttribute('fill', '#00E6BC');
  handle.style.filter = 'drop-shadow(0 0 6px rgba(0,230,188,0.6))';
  svg.appendChild(handle);
}

// updateActivePipe: only moves the active line + handle — no DOM creation, smooth on every frame
function updateActivePipe(activeDeg) {
  const a   = currentAnchor();
  const rad = activeDeg * Math.PI / 180;
  const ex  = a.x + SEG_LEN * Math.cos(rad);
  const ey  = a.y + SEG_LEN * Math.sin(rad);

  const line   = $('pipe-line');
  const handle = $('pipe-handle');
  const touch  = $('pipe-handle-touch');

  if (!line || !handle) { buildPipeSVG(activeDeg); return; }

  line.setAttribute('x2', ex); line.setAttribute('y2', ey);
  handle.setAttribute('cx', ex); handle.setAttribute('cy', ey);
  if (touch) { touch.setAttribute('cx', ex); touch.setAttribute('cy', ey); }
}

// ── Instructions UI ───────────────────────────────────────
function setInstruction(step) {
  // step 1: "Arrastra el punto verde"  step 2: "Haz clic para confirmar"
  const hint = $('drag-hint');
  if (!hint) return;
  const arrow = hint.querySelector('.hint-arrow');
  const text  = hint.querySelector('.hint-text');
  if (step === 1) {
    arrow.textContent = '☝';
    text.textContent  = 'Arrastra el punto verde hacia la bajante';
    hint.classList.remove('hint-step2');
  } else {
    arrow.textContent = '✔';
    text.textContent  = 'Suelta para confirmar la pendiente';
    hint.classList.add('hint-step2');
  }
  hint.style.display = '';
}

// ── Drag ─────────────────────────────────────────────────
function initDrag() {
  const svg = $('pipe-svg');

  function getAngle(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const svgX = (clientX - rect.left) * (SVG_W / rect.width);
    const svgY = (clientY - rect.top)  * (SVG_H / rect.height);
    const a    = currentAnchor();
    const raw  = Math.atan2(svgY - a.y, svgX - a.x) * 180 / Math.PI;
    return Math.max(-30, Math.min(30, raw));
  }

  function onStart(cx, cy) {
    if (!S.inputEnabled) return;
    const handle = $('pipe-handle');
    if (!handle) return;
    const rect = svg.getBoundingClientRect();
    const hx   = parseFloat(handle.getAttribute('cx')) * (rect.width  / SVG_W) + rect.left;
    const hy   = parseFloat(handle.getAttribute('cy')) * (rect.height / SVG_H) + rect.top;
    if (Math.hypot(cx - hx, cy - hy) > 50) return;
    S.dragging = true;
    setPablo('happy', null);  // hide bubble while dragging
    setInstruction(2);
  }

  function onMove(cx, cy) {
    if (!S.dragging) return;
    S.currentAngle = getAngle(cx, cy);
    updateActivePipe(S.currentAngle);

    // Show live angle feedback in Pablo's bubble
    const diff  = DIFFICULTY[S.roundIdx];
    const angle = S.currentAngle;
    const deg   = angle.toFixed(1) + '°';
    let hint;
    if (angle <= 0)                                              hint = `${deg} — ¡Al revés! El agua no puede salir`;
    else if (angle > 0 && angle < diff.correctMin)              hint = `${deg} — Insuficiente. Necesitas al menos ${diff.correctMin}°`;
    else if (angle >= diff.correctMin && angle <= diff.correctMax) hint = `${deg} ✓ Zona correcta (${diff.correctMin}°–${diff.correctMax}°)`;
    else                                                         hint = `${deg} — Demasiado. Máximo ${diff.correctMax}°`;

    const bubble = $('pablo-bubble');
    bubble.textContent = hint;
    bubble.classList.remove('hidden');
  }

  function onEnd() {
    if (!S.dragging) return;
    S.dragging = false;
    evaluatePipe(S.currentAngle);
  }

  svg.addEventListener('touchstart', e => {
    onStart(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });
  svg.addEventListener('touchmove', e => {
    e.preventDefault();
    onMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: false });
  svg.addEventListener('touchend', () => onEnd());

  svg.addEventListener('mousedown',    e => onStart(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => { if (S.dragging) onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup',   () => { if (S.dragging) onEnd(); });
}

// ── Evaluate ──────────────────────────────────────────────
function evaluatePipe(angle) {
  S.inputEnabled = false;
  const diff = DIFFICULTY[S.roundIdx];

  let result;
  if      (angle >= diff.correctMin && angle <= diff.correctMax) result = 'correct';
  else if (angle > 0 && angle < diff.correctMin)                 result = 'insuficiente';
  else if (angle <= 0)                                           result = 'al_reves';
  else                                                           result = 'exceso';

  animateWater(result, () => handleResult(result));
}

// ── Water animation ───────────────────────────────────────
function animateWater(result, cb) {
  const particles = $('water-particles');
  particles.innerHTML = '';
  const line = $('pipe-line');
  if (!line) { setTimeout(cb, 500); return; }

  const x1 = parseFloat(line.getAttribute('x1'));
  const y1 = parseFloat(line.getAttribute('y1'));
  const x2 = parseFloat(line.getAttribute('x2'));
  const y2 = parseFloat(line.getAttribute('y2'));
  const color = result === 'correct' ? '#00E6BC' : result === 'al_reves' ? '#E74C3C' : '#FFFFAB';

  for (let i = 0; i < 5; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', color);
    circle.classList.add('water-bubble');

    let sT, eT;
    if      (result === 'correct')  { sT = i / 5;       eT = sT + 0.3; }
    else if (result === 'al_reves') { sT = 1 - i / 5;   eT = sT - 0.3; }
    else                            { sT = i / 5 * 0.5; eT = sT + 0.15; }

    const clamp = v => Math.min(Math.max(v, 0), 1);
    const sX = x1 + (x2 - x1) * clamp(sT), sY = y1 + (y2 - y1) * clamp(sT);
    const eX = x1 + (x2 - x1) * clamp(eT), eY = y1 + (y2 - y1) * clamp(eT);

    circle.setAttribute('cx', sX); circle.setAttribute('cy', sY);
    const delay = (i / 5) * 800;
    circle.style.animationDelay = delay + 'ms';
    circle.animate(
      [{ transform: 'translate(0,0)' }, { transform: `translate(${eX-sX}px,${eY-sY}px)` }],
      { duration: 1200, delay, fill: 'forwards', easing: 'ease-in-out' }
    );
    particles.appendChild(circle);
  }
  setTimeout(() => { particles.innerHTML = ''; cb(); }, 1500);
}

// ── Handle result ─────────────────────────────────────────
function handleResult(result) {
  if (result === 'correct') {
    const a   = currentAnchor();
    const rad = S.currentAngle * Math.PI / 180;
    S.chainPoints.push({ x: a.x + SEG_LEN * Math.cos(rad), y: a.y + SEG_LEN * Math.sin(rad) });

    S.score += SCORE.CORRECT;
    S.correctMsgIdx = (S.correctMsgIdx + 1) % MSG_CORRECT.length;
    setPablo('celebrating', MSG_CORRECT[S.correctMsgIdx]);
    updateHUD();
    burstParticles();
    // Rebuild SVG to show committed segment before loading next pipe
    buildPipeSVG(0);
    setTimeout(nextPipe, 1800);
  } else {
    setPablo('worried', MSG[result]);
    S.lives--;
    S.roundErrors++;
    updateHUD();
    shakeHeart(S.lives + 1);
    if (S.lives <= 0) { setTimeout(showResults, 800); return; }
    showEduOverlay(result, () => { S.inputEnabled = true; setPablo('happy', null); });
  }
}

// ── Edu overlay (pipe errors) ─────────────────────────────
function showEduOverlay(type, onClose) {
  const data = EDU[type];
  $('edu-what').textContent   = data.what;
  $('edu-why').textContent    = data.why;
  $('edu-rule').textContent   = data.rule;
  $('edu-action').textContent = data.action;

  const overlay = $('edu-overlay');
  overlay.classList.remove('hidden');
  $('btn-edu-ok').onclick = () => { overlay.classList.add('hidden'); if (onClose) onClose(); };
}

// ── Next pipe ─────────────────────────────────────────────
function nextPipe() {
  S.pipeIdx++;
  if (S.pipeIdx >= ROUNDS[S.roundIdx].pipes.length) showEduQuestion();
  else loadPipe();
}

// ── Load pipe ─────────────────────────────────────────────
function loadPipe() {
  const round = ROUNDS[S.roundIdx];
  const pipe  = round.pipes[S.pipeIdx];
  const diff  = DIFFICULTY[S.roundIdx];

  $('round-label').textContent = round.label + ' — Tramo ' + (S.pipeIdx + 1) + '/' + round.pipes.length;
  $('round-label').style.visibility = 'visible';
  $('siphon-step').classList.add('hidden');
  $('pipe-svg').classList.remove('hidden');

  $('pipe-origin-label').style.visibility = 'visible';
  $('pipe-dest-label').style.visibility   = 'visible';

  const hint = $('drag-hint');
  if (hint) hint.style.display = '';

  S.currentAngle = 0;
  buildPipeSVG(0);
  setInstruction(1);
  setPablo('happy', pipe.label);
  setTimeout(() => { S.inputEnabled = true; }, 400);
}

// ── Completed chain (no active handle) ───────────────────
function buildCompletedSVG() {
  const svg = $('pipe-svg');
  const NS  = 'http://www.w3.org/2000/svg';
  Array.from(svg.children).forEach(el => { if (el.id !== 'water-particles') el.remove(); });

  S.chainPoints.forEach((pt, i) => {
    const prev = i === 0 ? { x: SEG_PAD, y: SVG_CY } : S.chainPoints[i - 1];
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', prev.x); line.setAttribute('y1', prev.y);
    line.setAttribute('x2', pt.x);   line.setAttribute('y2', pt.y);
    line.setAttribute('stroke', '#00E6BC');
    line.setAttribute('stroke-width', '12');
    line.setAttribute('stroke-linecap', 'round');
    svg.insertBefore(line, $('water-particles'));

    const joint = document.createElementNS(NS, 'circle');
    joint.setAttribute('cx', pt.x); joint.setAttribute('cy', pt.y);
    joint.setAttribute('r', '7'); joint.setAttribute('fill', '#00E6BC');
    svg.insertBefore(joint, $('water-particles'));
  });

  // Origin dot
  const origin = document.createElementNS(NS, 'circle');
  origin.setAttribute('cx', SEG_PAD); origin.setAttribute('cy', SVG_CY);
  origin.setAttribute('r', '10'); origin.setAttribute('fill', '#00E6BC');
  svg.insertBefore(origin, $('water-particles'));
}

// ── Educational question (end of round) ───────────────────
function showEduQuestion() {
  S.inputEnabled = false;
  S.eduAnsweredCorrect = false;

  $('pipe-svg').classList.add('hidden');
  $('pipe-origin-label').style.visibility = 'hidden';
  $('pipe-dest-label').style.visibility   = 'hidden';
  $('round-label').style.visibility       = 'hidden';
  const hint = $('drag-hint');
  if (hint) hint.style.display = 'none';

  const q       = ROUNDS[S.roundIdx].question;
  const step    = $('siphon-step');
  const prompt  = $('edu-question-prompt');
  const optsDiv = $('edu-question-options');
  const fb      = $('edu-question-feedback');

  step.classList.remove('hidden');
  prompt.textContent    = q.prompt;
  optsDiv.innerHTML     = '';
  fb.textContent        = '';
  fb.classList.add('hidden');

  // Remove leftover next button if any
  const oldBtn = $('siphon-next-btn');
  if (oldBtn) oldBtn.remove();

  // Shuffle options (Fisher-Yates)
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }

  // Build option buttons
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'edu-option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      // Disable all buttons
      optsDiv.querySelectorAll('.edu-option-btn').forEach(b => { b.disabled = true; });
      btn.classList.add(opt.correct ? 'correct' : 'wrong');
      // Highlight correct answer if wrong was chosen
      if (!opt.correct) {
        optsDiv.querySelectorAll('.edu-option-btn').forEach(b => {
          const match = opts.find(o => o.text === b.textContent);
          if (match && match.correct) b.classList.add('correct');
        });
      }

      // Feedback
      fb.textContent = opt.correct ? q.feedbackOk : q.feedbackErr;
      fb.classList.remove('hidden');
      fb.style.color = opt.correct ? 'var(--turq)' : 'var(--lemon)';

      if (opt.correct) {
        S.eduAnsweredCorrect = true;
        S.score += SCORE.QUESTION_BONUS;
        updateHUD();
        setPablo('celebrating', '¡Correcto! +' + SCORE.QUESTION_BONUS + ' pts');
        burstParticles();
      } else {
        setPablo('worried', 'Casi. Recuerda esto para la siguiente instalación.');
      }

      // Show next button after short pause
      setTimeout(() => {
        const nextBtn = document.createElement('button');
        nextBtn.id        = 'siphon-next-btn';
        nextBtn.className = 'btn-primary';
        nextBtn.style.marginTop = '16px';
        nextBtn.textContent = S.roundIdx < ROUNDS.length - 1 ? 'Siguiente habitación →' : 'Ver resultado →';
        nextBtn.onclick = () => finishRound();
        step.appendChild(nextBtn);
      }, 800);
    };
    optsDiv.appendChild(btn);
  });

  setPablo('happy', '¡Pregunta de conocimiento! Demuestra lo que sabes.');
}

// ── Finish round ──────────────────────────────────────────
function finishRound() {
  if (S.roundErrors === 0 && S.eduAnsweredCorrect) {
    S.score += SCORE.ROUND_BONUS;
    updateHUD();
  }

  const perfect    = S.roundErrors === 0 && S.eduAnsweredCorrect;
  const pabloState = perfect ? 'celebrating' : 'happy';
  const roundMsg   = perfect ? MSG.round_perfect : MSG.round_errors;

  $('round-avatar').src       = AVATARS[pabloState];
  $('round-pts').textContent  = S.score + ' pts';
  $('round-msg').textContent  = roundMsg;

  const overlay = $('round-overlay');
  overlay.classList.remove('hidden');

  $('btn-next-round').onclick = () => {
    overlay.classList.add('hidden');
    S.roundIdx++;
    if (S.roundIdx >= ROUNDS.length) showResults();
    else startRound();
  };
}

// ── Start round ───────────────────────────────────────────
function startRound() {
  S.pipeIdx           = 0;
  S.roundErrors       = 0;
  S.eduAnsweredCorrect = false;
  S.chainPoints        = [];

  const round = ROUNDS[S.roundIdx];
  setPablo('happy', round.intro);
  loadPipe();
}

// ── Results ───────────────────────────────────────────────
function showResults() {
  const score  = S.score;
  const record = getRecord();
  saveRecord(score);

  let state, msg;
  if      (score >= 1500)           { state = 'celebrating'; msg = MSG.result_high; }
  else if (score >= TASK_THRESHOLD) { state = 'happy';       msg = MSG.result_mid;  }
  else                              { state = 'worried';     msg = MSG.result_low;  }

  $('results-avatar').src        = AVATARS[state] || AVATARS.happy;
  $('results-score').textContent = score + ' pts';
  $('results-msg').textContent   = msg;
  $('results-record').textContent =
    score > record ? '¡Nuevo récord! ' + score + ' pts' :
    record > 0     ? 'Récord: ' + record + ' pts'        : '';

  if (score >= TASK_THRESHOLD) sendTaskCompleted();
  showScreen('results');
}

// ── ASMR particles ────────────────────────────────────────
function burstParticles() {
  const canvas  = $('asmr-canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx    = canvas.getContext('2d');
  const colors = ['#00E6BC', '#04FFB4', '#FFFFAB', '#C5FFDF'];
  const cx = window.innerWidth  * 0.7;
  const cy = window.innerHeight * 0.4;
  const pts = Array.from({ length: 40 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 1.2) * 6,
    r:  Math.random() * 5 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: 1,
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.025;
      if (p.alpha <= 0) return;
      alive = true;
      ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ── Init ──────────────────────────────────────────────────
function resetGame() {
  Object.assign(S, {
    lives: 3, score: 0, roundIdx: 0, pipeIdx: 0,
    roundErrors: 0, correctMsgIdx: 0,
    inputEnabled: false, dragging: false, currentAngle: 0,
    eduAnsweredCorrect: false, chainPoints: [],
  });
}

function startGame() {
  resetGame();
  updateHUD();
  showScreen('play');
  const done = localStorage.getItem('pendiente_de_nota_tutorial');
  if (!done) {
    $('tutorial-modal').classList.remove('hidden');
    $('btn-tutorial-ok').onclick = () => {
      localStorage.setItem('pendiente_de_nota_tutorial', '1');
      $('tutorial-modal').classList.add('hidden');
      startRound();
    };
  } else {
    startRound();
  }
}

// ── Event listeners ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDrag();
  $('btn-start').addEventListener('click', startGame);
  $('btn-retry').addEventListener('click', () => {
    showScreen('intro');
    document.documentElement.classList.remove('results');
  });
});
