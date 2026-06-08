/* ════════════════ El Edificio Embrujado — game logic ════════════════
 * Mecánica: linterna de inspección. Observar (drag) → marcar defectos (tap)
 * → tester (desbloqueo ≥85%) → veredicto. 3 plantas. Ver GDD_EL_EDIFICIO_EMBRUJADO.md
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Haptic helper ── */
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    const ms = { light: 10, medium: 25, heavy: 50, success: 30, error: 60 }[level] || 20;
    navigator.vibrate(pattern || ms);
  }
}

/* ── Record (localStorage) ── */
const RECORD_KEY = 'el_edificio_embrujado_record';
function getRecord() { return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10); }
function setRecord(v) { localStorage.setItem(RECORD_KEY, String(v)); }

/* ── TASK_COMPLETED ── */
const TASK_THRESHOLD = 900;
let taskFired = false;
function fireTaskCompleted() {
  if (taskFired) return;
  taskFired = true;
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

/* ════════════════ Pool de datos de plantas (ver GDD §5) ════════════════
 * state: 'culprit' | 'secondary' | 'sane'
 * marcable = (state !== 'sane'): culprit y secondary son defectos reales (+100)
 * x/y/w/h = posición del tramo dentro del stage en % (para hitbox y dibujo)
 * sym = etiqueta corta del defecto pintada al revelar
 * eduSane = overlay si marcan un tramo sano (falso positivo)
 */
const FLOORS = [
  {
    name: '🏢 Oficina 2º',
    symptom: 'Solo va a 100Mb',
    culprit: 'destrenzado',
    hint: 'Si solo sincroniza a 100Mb, sospecha de pares mal terminados. Alumbra bien la roseta: ahí es donde se destrenza de más.',
    segments: [
      { id: 'roseta', label: 'Roseta',           state: 'culprit',   defect: 'destrenzado', img: 'roseta_destrenzado', variant: 'destrenzado', x: 12, y: 18, w: 30, h: 22 },
      { id: 'cable',  label: 'Cable en madeja',  state: 'sane',  img: 'cable_madeja',  variant: 'madeja',   x: 50, y: 14, w: 38, h: 26,
        eduSane: { mark: 'un cable recogido en madeja', why: 'Está enrollado con holgura, sin tensión ni curvas cerradas; recogerlo no degrada la señal.', rule: 'El aspecto no es el problema; el problema es la mala terminación.', do: 'Mira cómo están rematados los pares en la roseta.' } },
      { id: 'panel',  label: 'Patch panel',      state: 'sane',  img: 'panel_ok',      variant: 'ok',       x: 14, y: 50, w: 32, h: 20 },
      { id: 'switch', label: 'Switch',           state: 'sane',  img: 'switch_ok',     variant: 'ok',       x: 56, y: 50, w: 30, h: 20 },
      { id: 'latig',  label: 'Latiguillo rojo',  state: 'sane',  img: 'latiguillo_rojo', variant: 'latrojo', x: 32, y: 76, w: 36, h: 18,
        eduSane: { mark: 'un latiguillo de otro color', why: 'El color no afecta al rendimiento; es un patch cord correcto.', rule: '«El problema era el patch cord» es el error clásico — no lo asumas sin observar.', do: 'Busca un defecto físico real en la terminación.' } },
    ],
  },
  {
    name: '🏬 Local (baja)',
    symptom: 'Falla cuando arranca la maquinaria de al lado',
    culprit: 'potencia',
    hint: 'Si falla cuando arranca la maquinaria, piensa en interferencias. Alumbra los tramos que van pegados a un cable de fuerza.',
    segments: [
      { id: 'roseta', label: 'Roseta',           state: 'sane',  img: 'roseta_ok',     variant: 'ok',       x: 12, y: 16, w: 30, h: 22 },
      { id: 'cable',  label: 'Cable + fuerza',   state: 'culprit',   defect: 'potencia',  img: 'cable_potencia', variant: 'potencia', x: 48, y: 14, w: 40, h: 28 },
      { id: 'panel',  label: 'Patch panel',      state: 'secondary', defect: 'curva',     img: 'curva_cerrada',  variant: 'curva',    x: 14, y: 50, w: 32, h: 20 },
      { id: 'switch', label: 'Switch',           state: 'sane',  img: 'switch_ok',     variant: 'ok',       x: 56, y: 50, w: 30, h: 20 },
      { id: 'latig',  label: 'Latiguillo',       state: 'secondary', defect: 'latiguillo', img: 'latiguillo_gastado', variant: 'latiguillo', x: 32, y: 76, w: 36, h: 18 },
    ],
  },
  {
    name: '🏠 Piso 3º',
    symptom: 'Hoy va y ayer no',
    culprit: 'aplastado',
    hint: 'Si hoy va y ayer no, es intermitente: huele a daño físico o tensión mecánica. Busca un cable aplastado o pisado.',
    segments: [
      { id: 'roseta', label: 'Roseta',           state: 'secondary', defect: 'destrenzado', img: 'roseta_destrenzado', variant: 'destrenzado', x: 12, y: 16, w: 30, h: 22 },
      { id: 'cable',  label: 'Cable aplastado',  state: 'culprit',   defect: 'aplastado',   img: 'cable_aplastado', variant: 'aplastado', x: 48, y: 14, w: 40, h: 28 },
      { id: 'panel',  label: 'Patch panel',      state: 'secondary', defect: 'curva',       img: 'curva_cerrada',  variant: 'curva',    x: 14, y: 50, w: 32, h: 20 },
      { id: 'switch', label: 'Switch',           state: 'sane',  img: 'switch_ok',     variant: 'ok',         x: 56, y: 50, w: 30, h: 20 },
      { id: 'latig',  label: 'Latiguillo',       state: 'sane',  img: 'latiguillo_ok', variant: 'ok',         x: 32, y: 76, w: 36, h: 18 },
    ],
  },
];

/* Etiquetas legibles de cada defecto (botones de veredicto) */
const DEFECT_LABELS = {
  destrenzado: 'Par destrenzado',
  potencia:    'Mezcla con potencia',
  aplastado:   'Cable aplastado',
  curva:       'Curva cerrada',
  latiguillo:  'Latiguillo gastado',
};

/* Veredicto: por qué un defecto NO explica el síntoma de cada planta (GDD §5) */
const VERDICT_EDU = {
  // floorIdx -> { defect -> {why, rule, do} }   (correcto no necesita edu)
  1: {
    curva:      { why: 'Una curva cerrada degrada poco a poco y de forma constante, no «cuando arranca una máquina».', rule: 'El síntoma manda — «falla con la maquinaria» = interferencia.', do: 'Busca el tramo que corre pegado a un cable de fuerza.' },
    latiguillo: { why: 'Un latiguillo gastado daría fallos al moverlo o cortes aleatorios, no sincronizados con la maquinaria.', rule: 'Correlación con la máquina = ruido eléctrico.', do: 'Mira qué cable de datos comparte recorrido con la fuerza.' },
  },
  2: {
    destrenzado: { why: 'Un destrenzado da pérdida de rendimiento constante (típico «solo 100Mb»), no un fallo que aparece y desaparece.', rule: 'Intermitente ≠ constante.', do: 'Busca algo que cambie con el movimiento o la presión.' },
    curva:       { why: 'Una curva cerrada degrada siempre, de forma estable, no «un día sí y otro no».', rule: '«Hoy va y ayer no» = tensión mecánica o humedad.', do: 'Busca un cable aplastado o pisado.' },
  },
};

/* Mensajes del personaje (GDD §7.5) */
const MSG = {
  ok: ['¡Ahí está! Ese tramo no está bien. Marcado.', 'Bien visto. Eso no lo monta así un profesional.', 'Otro «fenómeno paranormal» que resulta ser física. Sigue.'],
  fp: ['Ese tramo está bien. No marques por marcar — observa qué tiene de raro de verdad.', 'Ojo: el aspecto no es el problema. Una mala terminación sí. Mira mejor.'],
  fp3: 'Para. No vayas tocando a ver si suena. Observa, piensa, marca.',
  testerLocked: 'Primero observo, luego pruebo. Aún me falta línea por mirar.',
  notRevealed: 'No puedo marcar lo que no he visto. Alumbra primero.',
  verdictWrong: 'Ese defecto existe, pero no explica ESE síntoma. Escucha lo que dice la avería e inténtalo otra vez.',
  reobserve: 'El culpable se te ha escapado. Vuelve a alumbrar: hay algo que aún no has visto.',
  verdictOk: [
    '¡Eso es! El par estaba destrenzado de más: por eso solo sincronizaba a 100Mb. Funcionar no significa estar bien instalada.',
    '¡Cazado! El cable de datos iba pegado a la fuerza. Por eso fallaba justo con la maquinaria. Separa datos de potencia.',
    '¡Ahí está el fantasma! Un cable aplastado: a veces conduce, a veces no. De ahí el «hoy va y ayer no».',
  ],
  transition: [null, 'Planta baja, el local. Aquí el «fantasma» solo aparece cuando encienden las máquinas del taller. Curioso, ¿no?', 'Último piso. Este es el bueno: «hoy va y ayer no». El clásico fantasma caprichoso. Vamos.'],
  tut1: 'Primera regla: primero observo, luego pruebo. Arrastra el dedo como una linterna y mira TODA la línea antes de tocar nada.',
  tut2: '¿Ves? Solo veo lo que alumbro. Si algo te parece mal —una curva fea, un cable pelado, un destrenzado— dale un tap para marcarlo.',
  tut3: 'Ya he mirado bastante. Ahora sí: toca el tester para confirmar y dar el veredicto.',
  resultHigh: 'Caso cerrado. No había fantasmas: había física mal instalada. Y la has leído como un profesional. Observas antes de probar.',
  resultMid: 'Edificio diagnosticado. Vas bien, pero repasa la relación síntoma → causa: cada avería te está hablando, hay que escucharla.',
  resultLow: 'El fantasma se te ha escapado alguna vez. Recuerda el método: primero observo, luego pruebo. Y no marco a ojo. Vuelve a intentarlo.',
};

const OBS_THRESHOLD = 70;   // % observado para desbloquear tester
const OBS_SEGMENTS = 40;    // discretización de la línea para el %

/* ── Assets de Gabriel (Cloudinary — kampe/game_assets/S4D2_ELEC) ── */
const AVATAR = {
  happy:       'https://res.cloudinary.com/kampe/image/upload/v1780655857/Gabriel_happy_rd9mbc.png',
  celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1780655861/Gabriel_celebrating_dp4ud0.png',
  worried:     'https://res.cloudinary.com/kampe/image/upload/v1780655856/Gabriel_worried_m3palj.png',
};
const TESTER = {
  locked: 'https://res.cloudinary.com/kampe/image/upload/v1780661635/tester_loked_zalxb1.png',
  on:     'https://res.cloudinary.com/kampe/image/upload/v1780661636/tester_on_rjxddu.png',
};

/* ── Imágenes de tramos (Cloudinary S4D2_ELEC). Las que falten quedan en '' y
 *    caen al render CSS por variante. Al subirlas, solo pegar la URL aquí. ── */
const SEG_IMG = {
  roseta_ok:          'https://res.cloudinary.com/kampe/image/upload/v1780664659/Roseta_ok_akkifa.png',
  roseta_destrenzado: 'https://res.cloudinary.com/kampe/image/upload/v1780664659/roseta_destrenzado_zfxkma.png',
  latiguillo_ok:      'https://res.cloudinary.com/kampe/image/upload/v1780665376/latiguillo_ok_w72m82.png',
  latiguillo_gastado: 'https://res.cloudinary.com/kampe/image/upload/v1780908087/latiguillo_gastado_xhxzt7.png',
  latiguillo_rojo:    'https://res.cloudinary.com/kampe/image/upload/v1780665376/latiguillo_rojo_yzpe2d.png',
  switch_ok:          'https://res.cloudinary.com/kampe/image/upload/v1780586184/el_switch_akzha4.png',
  panel_ok:           'https://res.cloudinary.com/kampe/image/upload/v1780585737/el_patchpanel_v8qvgg.png',
  cable_aplastado:    'https://res.cloudinary.com/kampe/image/upload/v1780665829/cable_aplastado_nnwuc4.png',
  cable_potencia:     'https://res.cloudinary.com/kampe/image/upload/v1780908100/cable_potencia_yofvbd.png',
  cable_madeja:       'https://res.cloudinary.com/kampe/image/upload/v1780665828/cable_madeja_mvjz5k.png',
  curva_cerrada:      'https://res.cloudinary.com/kampe/image/upload/v1780665829/curva_cerrada_yxjbne.png',
  cable_ok:           'https://res.cloudinary.com/kampe/image/upload/v1780666041/cable_ok_l5cyc3.png',
};

/* ── Estado global ── */
const S = {
  floorIdx: 0,
  score: 0,
  tutorialDone: false,
  phase: 'observe',         // 'observe' | 'verdict'
  // por planta:
  revealedCols: new Set(),  // columnas (0..OBS_SEGMENTS-1) alumbradas → obsPct
  revealedSegs: new Set(),  // ids de tramos cuyo centro fue alumbrado (marcables)
  obsPct: 0,
  marked: new Set(),        // ids de tramos marcados como defecto
  hintUsed: false,
  verdictAttempts: 0,
  falsePosStreak: 0,
  tut2Shown: false,
  results: [],              // {floorName, correct, culpritLabel}
};

/* ── DOM refs ── */
const $ = id => document.getElementById(id);
const stage = $('stage'), scene = $('scene'), halo = $('halo'),
      penumbra = $('penumbra'), particles = $('particles'),
      bubble = $('speechBubble'), eduOverlay = $('eduOverlay');

let hitCount = 0;           // para semilla determinista de partículas

/* ── Screen switching ── */
function show(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');
  document.documentElement.className = 'gameplay';   // todas las pantallas sin scroll
}

/* ── Score ── */
function addScore(delta) {
  S.score = Math.max(0, S.score + delta);
  $('score').textContent = S.score + ' pts';
}

/* ── Burbuja de Gabriel ── */
let bubbleTimer = null;
function say(text, state, autoMs) {
  if (!text) return;
  bubble.textContent = text;
  bubble.classList.add('show');
  setAvatar(state || 'happy');
  if (bubbleTimer) clearTimeout(bubbleTimer);
  if (autoMs) bubbleTimer = setTimeout(() => bubble.classList.remove('show'), autoMs);
}
function setAvatar(state) {
  $('playAvatar').src = AVATAR[state] || AVATAR.happy;
}

/* ════════════════ Render de planta ════════════════ */
function renderFloor(idx) {
  const floor = FLOORS[idx];
  S.phase = 'observe';
  S.revealedCols = new Set();
  S.revealedSegs = new Set();
  S.obsPct = 0;
  S.marked = new Set();
  S.hintUsed = false;
  S.verdictAttempts = 0;
  S.falsePosStreak = 0;
  S.tut2Shown = false;

  $('floorName').textContent = floor.name;
  $('symptomText').textContent = '«' + floor.symptom + '»';
  $('obsPct').textContent = '0%';
  $('obsFill').style.width = '0%';
  $('verdictPanel').classList.remove('show');
  $('verdictOptions').innerHTML = '';
  bubble.classList.remove('show');

  // tester bloqueado
  const tBtn = $('testerBtn');
  tBtn.classList.add('locked'); tBtn.classList.remove('unlocked');
  $('testerImg').src = TESTER.locked;

  // penumbra full
  penumbra.style.opacity = '1';
  penumbra.style.webkitMaskImage = '';

  // pintar tramos — escala 1.2x manteniendo el centro (hitbox usa seg.x/y/w/h ya escalados)
  scene.innerHTML = '';
  floor.segments.forEach(seg => {
    if (!seg._scaled) {
      const f = 1.2;
      const cx = seg.x + seg.w / 2, cy = seg.y + seg.h / 2;
      seg.w = seg.w * f; seg.h = seg.h * f;
      seg.x = cx - seg.w / 2; seg.y = cy - seg.h / 2;
      seg._scaled = true;
    }
    const el = document.createElement('div');
    const url = seg.img ? SEG_IMG[seg.img] : '';
    if (url) {
      el.className = 'segment seg-img';
      el.style.backgroundImage = 'url("' + url + '")';
    } else {
      el.className = 'segment seg-' + (seg.variant || seg.defect || 'ok');
    }
    el.dataset.id = seg.id;
    el.style.left = seg.x + '%';
    el.style.top = seg.y + '%';
    el.style.width = seg.w + '%';
    el.style.height = seg.h + '%';
    el.innerHTML = '<span class="seg-label">' + seg.label + '</span>';
    el.classList.add('hidden-seg');
    scene.appendChild(el);
  });

  setAvatar('happy');

  // hint de deslizar (se oculta al primer arrastre)
  $('swipeHint').classList.remove('hide');

  // tutorial solo en planta 0
  if (idx === 0 && !S.tutorialDone) {
    say(MSG.tut1, 'happy', 4500);
  }
}

/* ════════════════ Linterna / observación ════════════════ */
let pointerDown = false, startX = 0, startY = 0, startT = 0, moved = false;

function stageXY(e) {
  const r = stage.getBoundingClientRect();
  const p = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
  return { x: p.clientX - r.left, y: p.clientY - r.top, w: r.width, h: r.height };
}

function moveHalo(x, y, w, h) {
  halo.style.left = x + 'px';
  halo.style.top = y + 'px';
  const px = (x / w * 100), py = (y / h * 100);
  penumbra.style.setProperty('--hx', px + '%');
  penumbra.style.setProperty('--hy', py + '%');
  revealAt(x, y, w, h);
}

function revealAt(x, y, w, h) {
  // columna observada (para %)
  const col = Math.max(0, Math.min(OBS_SEGMENTS - 1, Math.floor(x / w * OBS_SEGMENTS)));
  const before = S.revealedCols.size;
  S.revealedCols.add(col);
  // tramos cuyo centro cae bajo el halo (radio ~70px)
  FLOORS[S.floorIdx].segments.forEach(seg => {
    const cx = (seg.x + seg.w / 2) / 100 * w;
    const cy = (seg.y + seg.h / 2) / 100 * h;
    if (Math.hypot(cx - x, cy - y) < 75 && !S.revealedSegs.has(seg.id)) {
      S.revealedSegs.add(seg.id);
      const el = scene.querySelector('[data-id="' + seg.id + '"]');
      if (el) el.classList.remove('hidden-seg');
      if (!S.tut2Shown && S.floorIdx === 0 && !S.tutorialDone) {
        S.tut2Shown = true;
        say(MSG.tut2, 'happy', 3500);
      }
    }
  });
  if (S.revealedCols.size !== before) {
    const pct = Math.round(S.revealedCols.size / OBS_SEGMENTS * 100);
    S.obsPct = pct;
    $('obsPct').textContent = pct + '%';
    $('obsFill').style.width = pct + '%';
    if (S.revealedCols.size % 4 === 0) vibrate('light');
  }
  // chequear desbloqueo en cada frame (no solo cuando cambia el %)
  if (S.obsPct >= OBS_THRESHOLD) unlockTester();
}

function unlockTester() {
  const tBtn = $('testerBtn');
  if (tBtn.classList.contains('unlocked')) return;
  tBtn.classList.remove('locked'); tBtn.classList.add('unlocked');
  tBtn.classList.add('pulse');           // llama la atención: ya se puede tocar
  $('testerImg').src = TESTER.on;
  say(MSG.tut3, 'happy', 4000);          // "ya he mirado bastante, toca el tester"
}

/* ── Pointer events ── */
function onDown(e) {
  if (S.phase !== 'observe') return;
  pointerDown = true; moved = false;
  const { x, y, w, h } = stageXY(e);
  startX = x; startY = y; startT = Date.now();
  moveHalo(x, y, w, h);
}
function onMove(e) {
  if (!pointerDown || S.phase !== 'observe') return;
  const { x, y, w, h } = stageXY(e);
  if (Math.hypot(x - startX, y - startY) > 10) {
    moved = true;
    $('swipeHint').classList.add('hide');   // ocultar hint al deslizar
  }
  moveHalo(x, y, w, h);
  if (e.cancelable) e.preventDefault();
}
function onUp(e) {
  if (!pointerDown) return;
  pointerDown = false;
  const dt = Date.now() - startT;
  if (!moved && dt < 250) handleTap(startX, startY);
}

stage.addEventListener('touchstart', onDown, { passive: true });
stage.addEventListener('touchmove', onMove, { passive: false });
stage.addEventListener('touchend', onUp);
stage.addEventListener('mousedown', onDown);
stage.addEventListener('mousemove', onMove);
stage.addEventListener('mouseup', onUp);

/* ════════════════ Tap → marcar defecto ════════════════ */
function handleTap(x, y) {
  const r = stage.getBoundingClientRect();
  const w = r.width, h = r.height;
  const seg = FLOORS[S.floorIdx].segments.find(s => {
    const sx = s.x / 100 * w, sy = s.y / 100 * h, sw = s.w / 100 * w, sh = s.h / 100 * h;
    return x >= sx - 28 && x <= sx + sw + 28 && y >= sy - 28 && y <= sy + sh + 28;
  });
  if (!seg) return;

  // marcable si el tramo fue revelado, O si ya se observó lo suficiente (todo visible)
  if (!S.revealedSegs.has(seg.id) && S.obsPct < OBS_THRESHOLD) {
    say(MSG.notRevealed, 'happy', 2000); return;
  }

  // toggle si ya marcado
  if (S.marked.has(seg.id)) {
    S.marked.delete(seg.id);
    const m = scene.querySelector('.defect-mark[data-for="' + seg.id + '"]');
    if (m) m.remove();
    if (seg.state !== 'sane') addScore(-100);   // pierde el acierto
    return;
  }

  if (seg.state === 'sane') {
    // falso positivo
    addScore(-40);
    S.falsePosStreak++;
    flush('err');
    vibrate('error');
    const e = seg.eduSane;
    showEdu(e.mark, e.why, e.rule, e.do, S.falsePosStreak >= 3 ? MSG.fp3 : pick(MSG.fp));
  } else {
    // acierto: defecto real
    S.marked.add(seg.id);
    S.falsePosStreak = 0;
    addScore(100);
    addDefectMark(seg, x, y);
    emitParticles(x, y, 18);
    flush('ok');
    floatPts('+100', x, y);
    vibrate('success');
    // si ya se puede testear, recordar el siguiente paso
    if (S.obsPct >= OBS_THRESHOLD) say('¡Marcado! Cuando termines, toca el TESTER para dar el veredicto.', 'happy', 2600);
    else say(pick(MSG.ok), 'happy', 1500);
  }
}

function addDefectMark(seg, x, y) {
  const m = document.createElement('div');
  m.className = 'defect-mark';
  m.dataset.for = seg.id;
  m.textContent = '✕';
  m.style.left = (seg.x + seg.w / 2) + '%';
  m.style.top = (seg.y + seg.h / 2) + '%';
  scene.appendChild(m);
}

/* ════════════════ Tester → veredicto ════════════════ */
$('testerBtn').addEventListener('click', () => {
  if (S.phase !== 'observe') return;
  if (S.obsPct < OBS_THRESHOLD) {
    $('testerBtn').classList.add('shake');
    setTimeout(() => $('testerBtn').classList.remove('shake'), 300);
    say(MSG.testerLocked, 'worried', 2500);
    vibrate('error');
    return;
  }
  vibrate('medium');
  enterVerdict();
});

function enterVerdict() {
  S.phase = 'verdict';
  $('testerBtn').classList.remove('pulse');
  $('swipeHint').classList.add('hide');
  // atenuar penumbra: revelar todo tenue
  penumbra.style.opacity = '0.25';
  penumbra.style.webkitMaskImage = 'none';
  penumbra.style.maskImage = 'none';
  scene.querySelectorAll('.segment').forEach(el => el.classList.remove('hidden-seg'));

  const floor = FLOORS[S.floorIdx];
  $('verdictQ').textContent = '¿Qué explica el síntoma «' + floor.symptom + '»?';
  const opts = $('verdictOptions');
  opts.innerHTML = '';

  // Listar todos los defectos REALES observados (revelados con la linterna).
  // Marcar con tap da el bonus de +100, pero el veredicto siempre es resoluble
  // si el tramo fue observado. Como el tester exige ≥70% observado, el culpable
  // está garantizado en la lista → nunca hay bucle.
  const verdictSegs = floor.segments.filter(s =>
    s.state !== 'sane' && (S.revealedSegs.has(s.id) || S.obsPct >= OBS_THRESHOLD)
  );
  verdictSegs.forEach(seg => {
    const b = document.createElement('button');
    b.className = 'verdict-opt';
    b.textContent = DEFECT_LABELS[seg.defect] + (S.marked.has(seg.id) ? '  ✓' : '');
    b.addEventListener('click', () => chooseVerdict(seg));
    opts.appendChild(b);
  });

  // salvaguarda: si por lo que sea no hay opciones, permitir volver a observar
  if (verdictSegs.length === 0) {
    const b = document.createElement('button');
    b.className = 'verdict-opt';
    b.textContent = '↩ Volver a observar';
    b.addEventListener('click', backToObserve);
    opts.appendChild(b);
    say(MSG.reobserve, 'happy', 3500);
  }

  $('verdictPanel').classList.add('show');
}

function backToObserve() {
  S.phase = 'observe';
  $('verdictPanel').classList.remove('show');
  penumbra.style.opacity = '1';
  // restaurar máscara de halo
  penumbra.style.webkitMaskImage = '';
  penumbra.style.maskImage = '';
  // re-ocultar tramos no revelados
  scene.querySelectorAll('.segment').forEach(el => {
    if (!S.revealedSegs.has(el.dataset.id)) el.classList.add('hidden-seg');
  });
  say(MSG.reobserve, 'happy', 3000);
}

function chooseVerdict(seg) {
  const floor = FLOORS[S.floorIdx];
  if (seg.state === 'culprit') {
    // correcto
    const pts = (S.verdictAttempts === 0) ? 150 : 50;
    addScore(pts);
    emitParticles(stage.clientWidth / 2, stage.clientHeight / 2, 24);
    vibrate('success', [0, 60, 40, 120]);
    S.results.push({ floorName: floor.name, correct: true, culpritLabel: DEFECT_LABELS[floor.culprit] });
    showSolved();
  } else {
    // incorrecto
    S.verdictAttempts++;
    vibrate('error');
    const edu = VERDICT_EDU[S.floorIdx] && VERDICT_EDU[S.floorIdx][seg.defect];
    if (edu) showEdu(DEFECT_LABELS[seg.defect], edu.why, edu.rule, edu.do, null);
    else say(MSG.verdictWrong, 'worried', 3000);

    if (S.verdictAttempts >= 2) {
      // agotó intentos → marca como fallado y avanza por el overlay
      S.results.push({ floorName: floor.name, correct: false, culpritLabel: DEFECT_LABELS[floor.culprit] });
      const last = (S.floorIdx === FLOORS.length - 1);
      $('verdictPanel').classList.remove('show');
      $('solvedAvatar').src = AVATAR.worried;
      $('solvedText').textContent = 'El culpable era: ' + DEFECT_LABELS[floor.culprit] + '. ' + MSG.verdictOk[S.floorIdx];
      $('solvedBtn').textContent = last ? 'Cerrar el caso →' : 'Siguiente planta →';
      $('solvedBtn').onclick = () => {
        $('solvedOverlay').classList.remove('show');
        $('solvedAvatar').src = AVATAR.celebrating;   // restaurar para el próximo acierto
        if (last) { showResults(); return; }
        S.floorIdx++;
        transitionTo(S.floorIdx);
      };
      $('solvedOverlay').classList.add('show');
      if (S.floorIdx === 0) S.tutorialDone = true;
    }
  }
}

function showSolved() {
  // ocultar la pregunta del veredicto; mostrar Gabriel opaco + explicación + botón
  $('verdictPanel').classList.remove('show');
  bubble.classList.remove('show');
  const last = (S.floorIdx === FLOORS.length - 1);
  $('solvedText').textContent = MSG.verdictOk[S.floorIdx];
  $('solvedBtn').textContent = last ? 'Cerrar el caso →' : 'Siguiente planta →';
  $('solvedBtn').onclick = () => {
    $('solvedOverlay').classList.remove('show');
    if (last) { showResults(); return; }
    S.floorIdx++;
    transitionTo(S.floorIdx);
  };
  $('solvedOverlay').classList.add('show');
  if (S.floorIdx === 0) S.tutorialDone = true;
}

function transitionTo(idx) {
  vibrate('medium');
  // fade simple via overlay edu reutilizado como cartela
  const card = $('eduContent');
  card.innerHTML = '<p class="lbl" style="text-align:center;font-size:18px">Planta ' + (idx + 1) + ': ' + FLOORS[idx].name + '</p>' +
                   '<p style="text-align:center">«' + FLOORS[idx].symptom + '»</p>';
  $('eduBtn').textContent = 'Entrar';
  $('eduBtn').onclick = () => {
    eduOverlay.classList.remove('show');
    renderFloor(idx);
    say(MSG.transition[idx], 'happy', 4000);
  };
  eduOverlay.classList.add('show');
}

/* ════════════════ Pista "?" ════════════════ */
$('hintBtn').addEventListener('click', () => {
  if (S.hintUsed) return;
  S.hintUsed = true;
  addScore(-30);
  vibrate('light', [0, 30, 30, 30]);
  if (S.phase === 'observe') {
    say(FLOORS[S.floorIdx].hint, 'happy', null);
  } else {
    // en veredicto: atenuar una opción incorrecta
    const wrongBtn = Array.from($('verdictOptions').querySelectorAll('.verdict-opt'))
      .find(b => b.textContent !== DEFECT_LABELS[FLOORS[S.floorIdx].culprit] && !b.classList.contains('dim') && !b.textContent.includes('observar'));
    if (wrongBtn) {
      wrongBtn.classList.add('dim');
      say('Esa no encaja con el síntoma. Descártala.', 'happy', 3000);
    }
  }
});

/* ════════════════ Overlay educativo ════════════════ */
function showEdu(mark, why, rule, doText, extraBubble) {
  $('eduContent').innerHTML =
    '<p><span class="lbl">Qué marcaste:</span> ' + mark + '.</p>' +
    '<p><span class="lbl">Por qué está bien / no encaja:</span> ' + why + '</p>' +
    '<p><span class="lbl">La regla:</span> ' + rule + '</p>' +
    '<p><span class="lbl">Qué hacer:</span> ' + doText + '</p>';
  $('eduBtn').textContent = 'Entendido';
  $('eduBtn').onclick = () => {
    eduOverlay.classList.remove('show');
    if (extraBubble) say(extraBubble, 'worried', 3000);
  };
  setAvatar('worried');
  eduOverlay.classList.add('show');
}

/* ════════════════ Efectos ════════════════ */
const POOL = [];
function initParticles() {
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    particles.appendChild(p);
    POOL.push(p);
  }
}
function emitParticles(x, y, count) {
  hitCount++;
  const colors = ['#04FFB4', '#00E6BC', '#C5FFDF', '#FFFFAB'];
  for (let i = 0; i < count; i++) {
    const p = POOL[i];
    const ang = ((i * 137.5 + hitCount * 53) % 360) * Math.PI / 180;
    const dist = 60 + ((i * 29 + hitCount * 17) % 50);
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    p.style.background = colors[i % colors.length];
    p.style.left = x + 'px'; p.style.top = y + 'px';
    p.style.transition = 'none';
    p.style.transform = 'translate(-50%,-50%) scale(1)';
    p.style.opacity = '1';
    // forzar reflow y animar
    void p.offsetWidth;
    p.style.transition = 'transform 0.7s ease-out, opacity 0.7s ease-out';
    p.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (ang * 57) + 'deg) scale(0)';
    p.style.opacity = '0';
  }
}

function flush(type) {
  const f = document.createElement('div');
  f.className = 'flush ' + type;
  stage.appendChild(f);
  setTimeout(() => f.remove(), 320);
}
function floatPts(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-pts';
  el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  stage.appendChild(el);
  setTimeout(() => el.remove(), 520);
}

function pick(arr) { return arr[Math.floor(arr.length * ((hitCount * 0.618) % 1))]; }

/* ════════════════ Resultados ════════════════ */
function showResults() {
  // El tier se basa en VEREDICTOS acertados (mide la comprensión),
  // no en puntos absolutos (marcar defectos con tap es bonus opcional).
  const correct = S.results.filter(r => r.correct).length;
  const total = S.results.length || FLOORS.length;
  let tier, title, state;
  if (correct === total) { tier = 'high'; title = 'Caso cerrado: no había fantasmas'; state = 'celebrating'; }
  else if (correct >= Math.ceil(total / 2)) { tier = 'mid'; title = 'Edificio diagnosticado'; state = 'happy'; }
  else { tier = 'low'; title = 'El fantasma se te ha escapado'; state = 'worried'; }

  $('resultsAvatar').src = AVATAR[state] || AVATAR.happy;
  $('resultsTitle').textContent = title;

  // conteo animado
  const scoreEl = $('resultsScore');
  let n = 0; const step = Math.max(1, Math.round(S.score / 30));
  const tick = setInterval(() => {
    n += step; if (n >= S.score) { n = S.score; clearInterval(tick); }
    scoreEl.textContent = n + ' pts';
  }, 26);

  // record
  const rec = getRecord();
  if (S.score > rec) { setRecord(S.score); $('resultsRecord').textContent = 'Nuevo récord: ' + S.score + ' pts'; }
  else { $('resultsRecord').textContent = 'Récord: ' + rec + ' pts'; }

  // resumen por planta
  const sum = $('resultsSummary');
  sum.innerHTML = '';
  S.results.forEach(r => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = '<span>' + r.floorName + '</span><span>' + (r.correct ? '✓ ' : '✕ ') + r.culpritLabel + '</span>';
    sum.appendChild(row);
  });

  if (correct >= Math.ceil(total / 2)) fireTaskCompleted();
  if (tier === 'high') setTimeout(() => emitParticlesResults(), 300);

  show('results');
}
function emitParticlesResults() {
  // burst en resultados (reusa pool moviéndolo al body temporalmente no es trivial; burst simple)
  vibrate('success');
}

/* ════════════════ Wiring ════════════════ */
$('startBtn').addEventListener('click', () => {
  show('play');
  renderFloor(0);
});
$('replayBtn').addEventListener('click', () => {
  S.floorIdx = 0; S.score = 0; taskFired = false; S.results = []; S.tutorialDone = false;
  addScore(0);
  show('play');
  renderFloor(0);
});

initParticles();
show('intro');
