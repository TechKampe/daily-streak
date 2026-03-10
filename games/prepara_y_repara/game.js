/* ===== Prepara y Repara — Game Logic ===== */
'use strict';

/* ---------- CONSTANTS ---------- */
var CLD = 'https://res.cloudinary.com/kampe/image/upload/';
var ALEX = {
  base:    CLD + 'v1772704991/Alex_base_zathyx.png',
  happy:   CLD + 'v1772704976/Alex_happy_lu9vx2.png',
  worried: CLD + 'v1772705008/Alex_worried_bcm52p.png'
};
// Scene URLs — TODO: replace with Cloudinary URLs once Nano Banana assets are generated
var SCENES = {
  r1: 'assets/escena_r1_grifo_goteo.jpg',
  r2: 'assets/escena_r2_bano_olor.jpg',
  r3: 'assets/escena_r3_fuga_fregadero.jpg',
  r5: 'assets/escena_r5_cisterna.jpg'
};
var RECORD_KEY = 'prepara_y_repara_record';
var TASK_THRESHOLD = 900;

/* ---------- GAME STATE ---------- */
var S = {
  round: 0,
  lives: 3,
  score: 0,
  phase: 'prep',        // 'prep' | 'carousel' | 'confirm' | 'select'
  prepFilled: 0,
  roundErrors: false,
  tutorialDone: false,
  dragEl: null,
  dragOffsetX: 0,
  dragOffsetY: 0
};

/* ---------- ASSET PATHS ---------- */
var ASSETS = 'assets/';

/* ---------- PIECES ---------- */
var PIECES = {
  teflon:       { name: 'Teflón',          img: ASSETS + 'teflon.svg' },
  junta:        { name: 'Junta',           img: ASSETS + 'junta.svg' },
  sifon:        { name: 'Sifón',           img: ASSETS + 'sifon.svg' },
  llave_corte:  { name: 'Llave de corte',  img: ASSETS + 'llave_corte.svg' },
  latiguillo:   { name: 'Latiguillo',      img: ASSETS + 'latiguillo.svg' },
  llave_inglesa:{ name: 'Llave inglesa',   img: ASSETS + 'llave_inglesa.png' }
};

/* ---------- PREP ITEMS ---------- */
var PREP_CORRECT = [
  { id: 'cubo',    name: 'Cubo',           img: ASSETS + 'cubo.svg' },
  { id: 'trapos',  name: 'Trapos',         img: ASSETS + 'trapos.svg' },
  { id: 'llave',   name: 'Llave inglesa',  img: ASSETS + 'llave_inglesa.png' }
];

var PREP_DISTRACTORS = [
  { id: 'destornillador', name: 'Destornillador', img: ASSETS + 'destornillador.png',
    msg: 'El destornillador no lo necesito aquí. Para fontanería básica: cubo, trapos y llave inglesa.' },
  { id: 'cinta',          name: 'Cinta aislante', img: ASSETS + 'cinta_aislante.png',
    msg: 'La cinta aislante es de electricidad, no de fontanería. Aquí necesito cosas para el agua.' },
  { id: 'multimetro',     name: 'Multímetro',     img: ASSETS + 'multimetro.png',
    msg: 'El multímetro es para medir corriente. Estamos en fontanería — agua, no electricidad.' },
  { id: 'nivel',          name: 'Nivel láser',    img: ASSETS + 'nivel_laser.png',
    msg: 'El nivel láser no hace falta para una reparación básica. Con cubo, trapos y llave inglesa sobra.' },
  { id: 'alicates',       name: 'Alicates',       img: ASSETS + 'alicates.png',
    msg: 'Los alicates son de electricidad. Para preparar una zona de fontanería no los necesitas.' },
  { id: 'taladro',        name: 'Taladro',        img: ASSETS + 'taladro.png',
    msg: 'El taladro no pinta nada aquí. Esto es una reparación, no una instalación.' },
  { id: 'tijera',         name: 'Tijera',         img: ASSETS + 'tijera.png',
    msg: 'La tijera no te va a servir para fontanería. Necesitas herramientas de fontanero.' },
  { id: 'guantes',        name: 'Guantes',        img: ASSETS + 'guantes.png',
    msg: 'Los guantes aislantes son para electricidad. Para agua no hacen falta.' },
  { id: 'pelacables',     name: 'Pelacables',     img: ASSETS + 'pelacables.png',
    msg: 'El pelacables es para quitar el aislante de los cables. Esto es fontanería, no electricidad.' }
];

/* ---------- ROUNDS ---------- */
var ROUNDS = [
  /* R1 — Tutorial */
  {
    title: 'Goteo en el grifo',
    scene: 'r1',
    description: 'El grifo de la cocina gotea por la base. Cada vez que lo abres, sale agua por la rosca.',
    hintPrep: 'Antes de tocar nada: ¿qué necesito para recoger el agua y trabajar seguro?',
    hintPiece: 'Gotea por la rosca. ¿Qué pieza se pone en las roscas para sellarlas?',
    faultPos: { top: '35%', left: '55%' },
    prepDistractors: ['destornillador', 'cinta', 'taladro'],
    mode: 'select',
    selectPieces: ['teflon', 'junta', 'sifon'],
    correctPiece: 'teflon',
    confirm: {
      question: '¿Para qué sirve el teflón?',
      a: { text: 'Sellar roscas para evitar fugas', correct: true },
      b: { text: 'Evacuar olores del desagüe', correct: false }
    },
    errorConfirm: {
      did: 'Has dicho que el teflón evacua olores.',
      why: 'El teflón es una cinta que se enrolla en las roscas. No tiene nada que ver con la evacuación.',
      rule: 'Teflón = sellar roscas. Sifón = evacuar olores.',
      todo: 'Fíjate en qué tipo de problema tiene la avería antes de elegir.'
    },
    familyMsg: '¡¡¡YA NO GOTEA!!! Llevaba 3 semanas con eso 🎉'
  },
  /* R2 — Olor baño */
  {
    title: 'Olor raro en el baño',
    scene: 'r2',
    description: 'Huele fatal en el baño. El olor sube por el desagüe de la ducha.',
    hintPrep: 'Aquí no hay fuga, pero prepara igualmente. El método es siempre el mismo.',
    hintPiece: 'El olor sube por la tubería. ¿Qué pieza retiene agua y bloquea los olores?',
    faultPos: { top: '65%', left: '40%' },
    prepDistractors: ['cinta', 'multimetro', 'alicates'],
    mode: 'carousel',
    carouselPieces: ['sifon', 'teflon', 'latiguillo', 'llave_corte'],
    correctPiece: 'sifon',
    confirm: {
      question: '¿Para qué sirve el sifón?',
      a: { text: 'Conectar el grifo a la toma de agua', correct: false },
      b: { text: 'Evitar que suban olores por la tubería', correct: true }
    },
    errorLeve: [
      { piece: 'teflon', msg: 'El teflón sella roscas, pero aquí el problema es el olor. Piensa: ¿qué pieza atrapa los olores?' }
    ],
    errorGrave: [
      { piece: 'llave_corte', did: 'Has elegido la llave de corte.', why: 'Eso sirve para parar el agua, no para olores.', rule: 'El olor sube porque falta una pieza que hace de tapón hidráulico: el sifón.', todo: 'Piensa en qué pieza tiene forma de U y retiene agua.' }
    ],
    errorConfirm: {
      did: 'Has dicho que el sifón conecta el grifo a la toma.',
      why: 'Eso es el latiguillo.',
      rule: 'El sifón tiene forma de U y retiene agua para que los olores no suban. Sifón = barrera de olores.',
      todo: 'Recuerda: sifón = forma de U = olores.'
    },
    familyMsg: '¡¡Ya no huele!! Pensaba que era la tubería vieja, ¿y era solo el sifón?? 😱'
  },
  /* R3 — Fuga fregadero */
  {
    title: 'Fuga bajo el fregadero',
    scene: 'r3',
    description: 'Hay un charco debajo del fregadero. La fuga sale de la unión entre el tubo y el sifón.',
    hintPrep: 'Hay agua en el suelo. Prepara la zona antes de tocar nada.',
    hintPiece: 'La fuga está en una unión lisa, sin rosca. ¿Qué pieza sella esas uniones?',
    faultPos: { top: '60%', left: '50%' },
    prepDistractors: ['multimetro', 'destornillador', 'pelacables', 'guantes'],
    mode: 'carousel',
    carouselPieces: ['junta', 'teflon', 'sifon', 'latiguillo', 'llave_corte'],
    correctPiece: 'junta',
    confirm: {
      question: '¿Para qué sirve la junta?',
      a: { text: 'Sellar uniones entre piezas sin rosca', correct: true },
      b: { text: 'Sellar roscas para evitar goteos', correct: false }
    },
    errorLeve: [
      { piece: 'teflon', msg: 'El teflón es para roscas, pero esta unión no tiene rosca. ¿Qué sella uniones lisas?' }
    ],
    errorGrave: [
      { piece: 'sifon', did: 'Has elegido el sifón.', why: 'El sifón es para evitar olores, no para sellar fugas.', rule: 'La fuga está en una unión lisa entre tubo y sifón: lo que necesitas es una junta nueva.', todo: 'Junta = aro de goma para uniones sin rosca.' }
    ],
    errorConfirm: {
      did: 'Has dicho que la junta sella roscas.',
      why: 'Eso es el teflón.',
      rule: 'La junta es un aro de goma que sella uniones lisas (sin rosca). Junta = goma + unión lisa. Teflón = cinta + rosca.',
      todo: 'Si no ves rosca, es junta. Si ves rosca, es teflón.'
    },
    familyMsg: 'No me lo puedo creer, ¡el charco ha desaparecido! Yo ya había puesto un trapo y me había olvidado 😂'
  },
  /* R4 — Cisterna */
  {
    title: 'La cisterna no para',
    scene: 'r5',
    description: 'La cisterna no para de correr. El agua no deja de caer al váter. Suena todo el rato.',
    hintPrep: 'Última avería. Prepara la zona como un profesional.',
    hintPiece: 'El agua no para de correr. ¿Qué es lo primero que hay que hacer siempre?',
    faultPos: { top: '25%', left: '45%' },
    prepDistractors: ['multimetro', 'nivel', 'alicates', 'destornillador'],
    mode: 'carousel',
    carouselPieces: ['llave_corte', 'teflon', 'junta', 'sifon', 'latiguillo', 'llave_inglesa'],
    correctPiece: 'llave_corte',
    confirm: {
      question: 'La cisterna no para. ¿Qué es lo primero que haces?',
      a: { text: 'Cortar el agua con la llave de corte', correct: true },
      b: { text: 'Abrir la cisterna y tocar el flotador', correct: false }
    },
    errorLeve: [
      { piece: 'junta', msg: 'La junta sella uniones, pero primero necesitas parar el agua. ¿Qué pieza controla el paso del agua?' }
    ],
    errorGrave: [
      { piece: 'sifon', did: 'Has elegido el sifón.', why: 'El sifón no tiene nada que ver con la cisterna.', rule: 'La cisterna no para porque el agua sigue entrando. Lo primero: cortar el paso del agua con la llave de corte.', todo: 'Después ya puedes mirar el mecanismo.' }
    ],
    errorConfirm: {
      did: 'Has elegido abrir la cisterna sin cortar el agua.',
      why: 'El agua sigue entrando y no puedes trabajar.',
      rule: 'Siempre corta el agua antes de tocar el mecanismo.',
      todo: 'Primero llave de corte, después cisterna.'
    },
    familyMsg: '¡¡POR FIN SILENCIO!! Llevaba 2 meses oyendo eso. Te mereces una croqueta de las de la abuela 🏆'
  }
];

var TRANSITIONS = [
  '',
  'Oye que ya que estás... el baño huele raro. Como a alcantarilla. ¿Puedes mirar? 🤢',
  'Perdona que te diga otra cosa... hay un charquito debajo del fregadero. Poquito, ¿eh? Bueno, regular 💧💧',
  'Última cosa, ¡te lo juro! La cisterna no para de sonar. Es como tener una cascada en casa 🌊'
];

var ACIERTO_MSGS = [
  'Bien. Eso es saber lo que haces.',
  'Correcto. La teoría sirve de algo.',
  'Eso es. Pieza correcta, función correcta.'
];

var ERROR_LEVE_MSGS = [
  'Esa no es. Piensa en el tipo de avería.',
  'Vas cerca pero no es esa pieza. ¿Qué problema tienes delante?',
  'No, esa pieza resuelve otro tipo de problema. Vuelve a intentar.'
];

/* ---------- DOM HELPERS ---------- */
function $(id) { return document.getElementById(id); }
function show(id) { $(id).classList.add('active'); }
function hide(id) { $(id).classList.remove('active'); }
function setScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  $(id).classList.add('active');
  if (id === 'results') {
    document.documentElement.classList.add('results');
  } else {
    document.documentElement.classList.remove('results');
  }
}

/* ---------- INIT ---------- */
function init() {
  $('intro-avatar').src = ALEX.base;
  $('howto-avatar').src = ALEX.happy;
  $('btn-start').onclick = showHowto;
  $('btn-howto-start').onclick = startGame;
  $('btn-help').onclick = function() {
    var r = ROUNDS[S.round];
    var hint = '';
    if (S.phase === 'prep') hint = r ? r.hintPrep : '';
    else if (S.phase === 'select' || S.phase === 'carousel') hint = r ? r.hintPiece : '';
    else if (S.phase === 'confirm') hint = r ? r.hintPiece : '';
    $('help-avatar').src = ALEX.base;
    $('help-body').textContent = hint || '¿Necesitas ayuda? Sigue los pasos: prepara, elige y confirma.';
    show('overlay-help');
  };
  $('btn-help-close').onclick = function() { hide('overlay-help'); };
  $('btn-retry').onclick = startGame;
}

function showHowto() {
  setScreen('howto');
}

function startGame() {
  S.round = 0;
  S.lives = 3;
  S.score = 0;
  S.roundErrors = false;
  updateLives();
  setScreen('play');
  $('char-avatar').src = ALEX.base;
  startRound();
}

/* ---------- ROUND FLOW ---------- */
function startRound() {
  var r = ROUNDS[S.round];
  S.phase = 'prep';
  $('play').classList.remove('phase-confirm');
  S.prepFilled = 0;
  S.roundErrors = false;

  $('hud-round').textContent = 'Ronda ' + (S.round + 1) + '/' + ROUNDS.length + ' — ' + r.title;
  $('fault-desc').textContent = r.description;
  setPhaseHint('Paso 1: Arrastra los materiales necesarios');
  $('scene-img').src = SCENES[r.scene];

  // Fault point
  var fp = $('fault-point');
  fp.style.top = r.faultPos.top;
  fp.style.left = r.faultPos.left;
  fp.classList.remove('resolved');
  fp.classList.add('pulse');

  // Clear slots
  $('prep-slots').innerHTML = '';
  setupPrepSlots(r);

  // Character msg — hint for prep phase
  say(r.hintPrep, 'base');

  // Setup prep tray
  setupPrepTray(r);
}


/* ---------- PREPARATION PHASE ---------- */
function setupPrepSlots(r) {
  var container = $('prep-slots');
  var labels = ['Cubo', 'Trapos', 'Herram.'];

  PREP_CORRECT.forEach(function(item, i) {
    var slot = document.createElement('div');
    slot.className = 'prep-slot';
    slot.dataset.accept = item.id;

    var label = document.createElement('span');
    label.className = 'slot-label';
    label.textContent = labels[i];
    slot.appendChild(label);

    container.appendChild(slot);
  });
}

function setupPrepTray(r) {
  var bottom = $('bottom-area');
  bottom.innerHTML = '';

  var tray = document.createElement('div');
  tray.className = 'prep-tray';

  // Build items: correct + distractors, shuffled
  var items = PREP_CORRECT.map(function(p) { return { id: p.id, name: p.name, img: p.img, correct: true }; });
  r.prepDistractors.forEach(function(did) {
    var d = PREP_DISTRACTORS.find(function(x) { return x.id === did; });
    if (d) items.push({ id: d.id, name: d.name, img: d.img, correct: false, msg: d.msg });
  });
  shuffle(items);

  items.forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'prep-card';
    card.dataset.id = item.id;
    card.dataset.correct = item.correct;
    if (!item.correct) card.dataset.msg = item.msg;
    card.innerHTML = '<img class="card-img" src="' + item.img + '" alt="' + item.name + '">';
    card.title = item.name;
    setupDrag(card);
    tray.appendChild(card);
  });

  bottom.appendChild(tray);

}

/* ---------- DRAG & DROP ---------- */
function setupDrag(el) {
  el.addEventListener('touchstart', onDragStart, { passive: false });
  el.addEventListener('mousedown', onDragStart);
}

function onDragStart(e) {
  if (S.phase !== 'prep' || S.dragEl) return;
  e.preventDefault();

  var card = e.currentTarget;
  var touch = e.touches ? e.touches[0] : e;
  var rect = card.getBoundingClientRect();

  S.dragEl = card;
  S.dragStartX = touch.clientX;
  S.dragStartY = touch.clientY;
  S.dragOffsetX = touch.clientX - rect.left - rect.width / 2;
  S.dragOffsetY = touch.clientY - rect.top - rect.height / 2;
  S.dragStarted = false;

  // Ghost
  card.classList.add('ghost');

  // Create clone for dragging
  var clone = card.cloneNode(true);
  clone.classList.add('dragging');
  clone.id = 'drag-clone';
  clone.style.left = (touch.clientX - rect.width / 2) + 'px';
  clone.style.top = (touch.clientY - rect.height / 2) + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  document.body.appendChild(clone);

  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(e) {
  if (!S.dragEl) return;
  e.preventDefault();
  var touch = e.touches ? e.touches[0] : e;
  var clone = document.getElementById('drag-clone');
  if (!clone) return;

  var dx = touch.clientX - S.dragStartX;
  var dy = touch.clientY - S.dragStartY;
  if (!S.dragStarted && Math.sqrt(dx * dx + dy * dy) < 10) return;
  S.dragStarted = true;

  clone.style.left = (touch.clientX - 36) + 'px';
  clone.style.top = (touch.clientY - 32) + 'px';

  // Highlight slots
  var slots = document.querySelectorAll('.prep-slot:not(.filled)');
  slots.forEach(function(slot) {
    var sr = slot.getBoundingClientRect();
    var cx = sr.left + sr.width / 2;
    var cy = sr.top + sr.height / 2;
    var dist = Math.sqrt(Math.pow(touch.clientX - cx, 2) + Math.pow(touch.clientY - cy, 2));
    slot.classList.toggle('highlight', dist < 58);
  });
}

function onDragEnd(e) {
  if (!S.dragEl) return;
  var touch = e.changedTouches ? e.changedTouches[0] : e;
  var card = S.dragEl;
  var clone = document.getElementById('drag-clone');

  // Remove listeners
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);

  // Clear highlights
  document.querySelectorAll('.prep-slot').forEach(function(s) { s.classList.remove('highlight'); });

  // Find closest slot
  var bestSlot = null;
  var bestDist = Infinity;
  document.querySelectorAll('.prep-slot:not(.filled)').forEach(function(slot) {
    var sr = slot.getBoundingClientRect();
    var cx = sr.left + sr.width / 2;
    var cy = sr.top + sr.height / 2;
    var dist = Math.sqrt(Math.pow(touch.clientX - cx, 2) + Math.pow(touch.clientY - cy, 2));
    if (dist < 58 && dist < bestDist) {
      bestDist = dist;
      bestSlot = slot;
    }
  });

  if (clone) clone.remove();
  card.classList.remove('ghost');

  if (!bestSlot || !S.dragStarted) {
    S.dragEl = null;
    return;
  }

  var isCorrect = card.dataset.correct === 'true';
  var acceptId = bestSlot.dataset.accept;
  var cardId = card.dataset.id;

  if (isCorrect && cardId === acceptId) {
    // Correct placement
    bestSlot.classList.add('filled');
    bestSlot.innerHTML = '<img class="card-img" src="' + (PREP_CORRECT.find(function(p) { return p.id === cardId; }) || {}).img + '" alt="' + cardId + '">';
    card.style.display = 'none';
    S.prepFilled++;

    if (S.prepFilled >= 3) {
      S.score += 100;
      say('Zona lista. Vamos a ver qué necesito.', 'happy');
      setTimeout(function() { startPiecePhase(); }, 1000);
    }
  } else if (!isCorrect) {
    // Distractor
    card.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(function() { card.style.animation = ''; }, 300);
    say(card.dataset.msg || 'Eso no lo necesito aquí.', 'base');
    S.roundErrors = true;
  } else {
    // Correct item but wrong slot
    card.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(function() { card.style.animation = ''; }, 300);
  }

  S.dragEl = null;
}

/* ---------- PIECE SELECTION / CAROUSEL ---------- */
function startPiecePhase() {
  var r = ROUNDS[S.round];
  setPhaseHint('');
  say(r.hintPiece, 'base');

  if (r.mode === 'select') {
    S.phase = 'select';
    setupSelectTray(r);
  } else {
    S.phase = 'carousel';
    setupCarousel(r);
  }
}

/* Direct selection (R1 tutorial) */
function setupSelectTray(r) {
  var bottom = $('bottom-area');
  bottom.innerHTML = '';

  // Title above pieces
  var title = document.createElement('div');
  title.className = 'bottom-title';
  title.textContent = 'Paso 2: Elige la pieza correcta';
  bottom.appendChild(title);

  var tray = document.createElement('div');
  tray.className = 'piece-tray';

  r.selectPieces.forEach(function(pid) {
    var p = PIECES[pid];
    var card = document.createElement('div');
    card.className = 'piece-card';
    card.dataset.piece = pid;
    card.innerHTML = '<img class="card-img" src="' + p.img + '" alt="' + p.name + '"><span class="card-name">' + p.name + '</span>';
    card.onclick = function() {
      if (S.phase !== 'select') return;
      S.phase = 'select-locked'; // prevent double-tap
      document.querySelectorAll('.piece-card').forEach(function(c) { c.classList.remove('selected', 'flash-correct', 'flash-wrong'); });
      card.classList.add('selected');
      lockPieceTray();
      onPieceSelected(pid);
    };
    tray.appendChild(card);
  });

  bottom.appendChild(tray);
}

/* Carousel — horizontal scrollable tray */
function setupCarousel(r) {
  var bottom = $('bottom-area');
  bottom.innerHTML = '';

  // Title above pieces
  var title = document.createElement('div');
  title.className = 'bottom-title';
  title.textContent = 'Paso 2: Elige la pieza correcta';
  bottom.appendChild(title);

  var pieces = r.carouselPieces;
  var shuffled = shuffle(pieces.slice()); // shuffle a copy

  var carousel = document.createElement('div');
  carousel.className = 'carousel';

  shuffled.forEach(function(pid) {
    var p = PIECES[pid];
    var card = document.createElement('div');
    card.className = 'carousel-piece';
    card.dataset.piece = pid;
    card.innerHTML = '<img class="card-img" src="' + p.img + '" alt="' + p.name + '"><span class="card-name">' + p.name + '</span>';

    // Track touch to distinguish scroll vs tap
    var startX = 0;
    card.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    card.addEventListener('touchend', function(e) {
      var dx = Math.abs(e.changedTouches[0].clientX - startX);
      if (dx < 10) onCarouselTap(pid, card);
    });
    card.addEventListener('click', function() { onCarouselTap(pid, card); });

    carousel.appendChild(card);
  });

  bottom.appendChild(carousel);
}

function reopenPieceTray(r) {
  document.querySelectorAll('.carousel-piece, .piece-card').forEach(function(c) { c.classList.remove('selected', 'flash-correct', 'flash-wrong'); });
  S.phase = r.mode === 'select' ? 'select' : 'carousel';
  unlockPieceTray();
}

function lockPieceTray() {
  document.querySelectorAll('.carousel-piece, .piece-card').forEach(function(c) {
    c.style.pointerEvents = 'none';
  });
}

function unlockPieceTray() {
  document.querySelectorAll('.carousel-piece, .piece-card').forEach(function(c) {
    c.style.pointerEvents = '';
  });
}

function onCarouselTap(pieceId, cardEl) {
  if (S.phase !== 'carousel') return;
  S.phase = 'carousel-locked'; // prevent double-tap (touchend + click)

  document.querySelectorAll('.carousel-piece').forEach(function(c) { c.classList.remove('selected', 'flash-correct', 'flash-wrong'); });
  cardEl.classList.add('selected');
  lockPieceTray();

  setTimeout(function() { onPieceSelected(pieceId); }, 300);
}

function onPieceSelected(pieceId) {
  var r = ROUNDS[S.round];
  var correct = r.correctPiece;

  var selectedCard = document.querySelector('.carousel-piece.selected, .piece-card.selected');

  if (pieceId === correct) {
    // Correct piece — green border
    if (selectedCard) selectedCard.classList.add('flash-correct');
    S.score += 100;
    say('¡Esa es!', 'happy');
    setTimeout(function() { showConfirmation(); }, 800);
  } else {
    // Wrong piece — red border
    if (selectedCard) selectedCard.classList.add('flash-wrong');

    var errorLeve = r.errorLeve || [];
    var errorGrave = r.errorGrave || [];
    var leveMatch = errorLeve.find(function(e) { return e.piece === pieceId; });
    var graveMatch = errorGrave.find(function(e) { return e.piece === pieceId; });

    S.roundErrors = true;

    if (graveMatch) {
      loseLife();
      setTimeout(function() {
        showEduOverlay(graveMatch, function() {
          if (S.lives <= 0) return;
          reopenPieceTray(r);
        });
      }, 600);
    } else {
      var msg = leveMatch ? leveMatch.msg : ERROR_LEVE_MSGS[Math.floor(Math.random() * ERROR_LEVE_MSGS.length)];
      say(msg, 'base');
      setTimeout(function() {
        reopenPieceTray(r);
      }, 600);
    }
  }
}

/* ---------- CONFIRMATION ---------- */
function showConfirmation() {
  var r = ROUNDS[S.round];
  var confirm = r.confirm;
  var correct = r.correctPiece;
  var piece = PIECES[correct];

  S.phase = 'confirm';
  $('play').classList.add('phase-confirm');
  setPhaseHint('');
  $('char-avatar').src = ALEX.base;
  var bottom = $('bottom-area');
  bottom.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'confirm-wrap';

  // Title
  var title = document.createElement('div');
  title.className = 'bottom-title';
  title.textContent = 'Paso 3: Confirma para qué sirve';
  wrap.appendChild(title);

  // Question
  var q = document.createElement('div');
  q.className = 'confirm-question';
  q.textContent = confirm.question;
  wrap.appendChild(q);

  // Piece display
  var pCard = document.createElement('div');
  pCard.className = 'confirm-piece';
  pCard.innerHTML = '<img class="card-img" src="' + piece.img + '" alt="' + piece.name + '"><span class="card-name">' + piece.name + '</span>';
  wrap.appendChild(pCard);

  // Options
  var opts = document.createElement('div');
  opts.className = 'confirm-options';

  // Shuffle options
  var options = [confirm.a, confirm.b];
  if (Math.random() > 0.5) options.reverse();

  options.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'confirm-btn';
    btn.textContent = opt.text;
    btn.onclick = function() { onConfirmAnswer(opt.correct, btn); };
    opts.appendChild(btn);
  });

  wrap.appendChild(opts);
  bottom.appendChild(wrap);
}

function onConfirmAnswer(correct, btnEl) {
  var r = ROUNDS[S.round];

  // Disable all buttons
  document.querySelectorAll('.confirm-btn').forEach(function(b) { b.onclick = null; });

  if (correct) {
    btnEl.classList.add('flash-green');
    S.score += 100;

    // Bonus if no errors this round
    if (!S.roundErrors) S.score += 50;

    say(ACIERTO_MSGS[Math.floor(Math.random() * ACIERTO_MSGS.length)], 'happy');

    // Short pause so green border is visible, then animate
    setTimeout(function() {
    animateFaultLine(function() {
      // Clear bottom and show Alex celebrating
      $('bottom-area').innerHTML = '';
      $('char-avatar').src = ALEX.happy;
      $('char-avatar').classList.add('celebrating');

      // Brief celebration before overlay
      var nextIdx = S.round + 1;
      setTimeout(function() {
        $('char-avatar').classList.remove('celebrating');

        showFamilyWA(r.familyMsg, function() {
          if (nextIdx < ROUNDS.length) {
            showTransition(nextIdx, function() {
              S.round = nextIdx;
              startRound();
            });
          } else {
            showResults();
          }
        });
      }, 1500);
    });
    }, 600); // pause for green border
  } else {
    btnEl.classList.add('flash-red');
    S.roundErrors = true;
    loseLife();

    var errConf = r.errorConfirm;
    setTimeout(function() {
      showEduOverlay(errConf, function() {
        if (S.lives <= 0) return;
        showConfirmation();
      });
    }, 600); // pause for red border
  }
}

/* ---------- FAULT LINE ANIMATION ---------- */
function animateFaultLine(cb) {
  var fp = $('fault-point');
  fp.classList.remove('pulse');
  fp.classList.add('resolved');
  setTimeout(cb, 400);
}

/* ---------- LIVES ---------- */
function loseLife() {
  S.lives--;
  updateLives();
  flashRed();

  if (S.lives <= 0) {
    setTimeout(gameOver, 600);
  }
}

function updateLives() {
  var str = '';
  for (var i = 0; i < 3; i++) {
    str += i < S.lives ? '♥' : '<span class="heart-lost">♥</span>';
  }
  $('hud-lives').innerHTML = str;
}

function flashRed() {
  var el = $('red-flash');
  el.classList.add('active');
  setTimeout(function() { el.classList.remove('active'); }, 250);
}

/* ---------- GAME OVER ---------- */
function gameOver() {
  say('Se acabaron las oportunidades. Pero tranquilo, lo importante es que has preparado la zona cada vez. Eso ya es método.', 'worried');
  setTimeout(function() {
    showResults();
  }, 2000);
}

/* ---------- EDUCATIONAL OVERLAY ---------- */
function showEduOverlay(data, cb) {
  $('overlay-avatar').src = ALEX.worried;
  $('char-avatar').src = ALEX.worried;

  var body = $('overlay-body');
  body.innerHTML =
    '<div class="edu-label">Qué hiciste</div><p>' + data.did + '</p>' +
    '<div class="edu-label" style="margin-top:10px">Por qué está mal</div><p>' + data.why + '</p>' +
    '<div class="edu-label edu-rule" style="margin-top:10px">La regla</div><p>' + data.rule + '</p>' +
    '<div class="edu-label" style="margin-top:10px">Qué hacer</div><p>' + data.todo + '</p>';

  show('overlay-edu');
  $('btn-understood').onclick = function() {
    hide('overlay-edu');
    $('char-avatar').src = ALEX.base;
    if (cb) cb();
  };
}

/* ---------- WHATSAPP OVERLAYS ---------- */
var waOverlayLocked = false;

function showWaOverlay(msg, btnText, cb) {
  $('wa-transition-text').textContent = msg;
  $('btn-next-round').textContent = btnText;
  $('btn-next-round').onclick = null; // clear first
  waOverlayLocked = true;
  show('overlay-wa');

  // Small delay so the previous click event can't trigger the new handler
  setTimeout(function() {
    waOverlayLocked = false;
    $('btn-next-round').onclick = function() {
      if (waOverlayLocked) return;
      waOverlayLocked = true;
      $('btn-next-round').onclick = null; // prevent double-fire
      hide('overlay-wa');
      if (cb) cb();
    };
  }, 100);
}

function showFamilyWA(msg, cb) {
  showWaOverlay(msg, 'Siguiente avería', cb);
}

function showTransition(nextRound, cb) {
  showWaOverlay(TRANSITIONS[nextRound], 'Siguiente avería', cb);
}

/* ---------- RESULTS ---------- */
function showResults() {
  setScreen('results');

  var score = S.score;
  var record = parseInt(localStorage.getItem(RECORD_KEY)) || 0;
  var newRecord = score > record;
  if (newRecord) localStorage.setItem(RECORD_KEY, score);

  // Tier
  var tier = score >= 1200 ? 'high' : score >= 900 ? 'mid' : 'low';

  var avatarEl = $('results-avatar');
  avatarEl.src = tier === 'low' ? ALEX.worried : ALEX.happy;
  avatarEl.classList.toggle('celebrating', tier !== 'low');
  $('results-score').textContent = score + ' pts';

  var recEl = $('results-record');
  if (newRecord && record > 0) {
    recEl.textContent = 'Récord: ' + record + ' → ' + score;
    recEl.classList.add('new-record');
  } else {
    recEl.textContent = 'Récord: ' + Math.max(score, record);
    recEl.classList.remove('new-record');
  }

  var msgs = {
    high: { alex: 'Cuatro averías, cuatro soluciones. Nada mal para un domingo.', family: '¡¡¡ERES MEJOR QUE EL FONTANERO DE SIEMPRE!!! Le voy a decir a tu tía Paqui que ya no hace falta llamar al señor Manolo 🎉🎉🎉' },
    mid:  { alex: 'No ha salido perfecto, pero el método funciona. Preparar, identificar, actuar.', family: 'Oye pues no está mal para ser tu primer día eh. Algún susto pero bueno, la cocina no se ha inundado 😂' },
    low:  { alex: 'Toca repasar las piezas. Cada una resuelve un problema concreto.', family: 'Ehhh bueno... igual llamo al fontanero de verdad 😬 Pero oye, por lo menos has puesto el cubo, eso ya es más de lo que hago yo' }
  };

  $('results-msg').textContent = msgs[tier].alex;
  $('results-wa-text').textContent = msgs[tier].family;

  // TASK_COMPLETED
  if (score >= TASK_THRESHOLD) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    } catch (e) { /* not in RN */ }
  }
}

/* ---------- CHARACTER BUBBLE ---------- */
function say(msg, state) {
  if (state) {
    $('char-avatar').src = ALEX[state] || ALEX.base;
  }
  var bubble = $('char-bubble');
  bubble.textContent = msg;
  bubble.classList.add('visible');

  clearTimeout(S.bubbleTimer);
  S.bubbleTimer = setTimeout(function() {
    bubble.classList.remove('visible');
  }, 5000);
}

/* ---------- PHASE HINT ---------- */
function setPhaseHint(text) {
  var el = $('phase-bar');
  el.textContent = text;
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.style.animation = 'popIn 0.3s ease-out';
}

/* ---------- UTILS ---------- */
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

/* ---------- START ---------- */
init();
