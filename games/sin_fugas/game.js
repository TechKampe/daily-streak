/* ════════════════════════════════════════
   SIN FUGAS — game.js
   Kampe Daily Streak · S4D4-PM
   ════════════════════════════════════════ */

'use strict';

// ── Constantes ──────────────────────────────────────────────────────────────
const TASK_THRESHOLD = 400;
const RECORD_KEY     = 'sin_fugas_record';
const TUTORIAL_KEY   = 'sin_fugas_tutorial_done';
const TOTAL_ASSETS   = 8;
const PARAMS         = ['alineacion', 'junta', 'latiguillo'];

// Puntos base por asset correcto; bonus por velocidad (ms → pts)
const PTS_BASE       = 100;
const PTS_SPEED_MAX  = 50;   // bonus máximo si responde en < 2s
const SPEED_FAST_MS  = 2000;
const SPEED_SLOW_MS  = 7000; // barra vacía a los 7s

// ── URLs de assets (Cloudinary) ──────────────────────────────────────────────
const ASSETS = {
  pedro_happy:       'https://res.cloudinary.com/kampe/image/upload/v1773309926/pedro_happy_uhfhdb.png',
  pedro_celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1773309926/pedro_celebrating_xo8x80.png',
  pedro_worried:     'https://res.cloudinary.com/kampe/image/upload/v1773309926/pedro_worried_mchura.png',
  montaje_ok:                        'https://res.cloudinary.com/kampe/image/upload/v1773679372/montaje_ok_gkcoae.png',
  montaje_fallo_alineacion:          'https://res.cloudinary.com/kampe/image/upload/v1773679371/montaje_fallo_alineacion_iozhq6.png',
  montaje_fallo_junta:               'https://res.cloudinary.com/kampe/image/upload/v1773679371/montaje_fallo_junta_zz1b3a.png',
  montaje_fallo_latiguillo:          'https://res.cloudinary.com/kampe/image/upload/v1773682960/montaje_fallo_latiguillo_xq7rwj.png',
  montaje_fallo_alineacion_latiguillo: 'https://res.cloudinary.com/kampe/image/upload/v1773682855/montaje_fallo_alineacion_latiguillo_a1yryq.png',
};

// ── Tipos de asset (4 tipos × 2 = 8) ─────────────────────────────────────────
// faults: array de params con fallo real. Vacío = montaje correcto.
const ASSET_TYPES = [
  { img: ASSETS.montaje_ok,                          faults: [] },
  { img: ASSETS.montaje_ok,                          faults: [] },
  { img: ASSETS.montaje_fallo_alineacion,            faults: ['alineacion'] },
  { img: ASSETS.montaje_fallo_junta,                 faults: ['junta'] },
  { img: ASSETS.montaje_fallo_junta,                 faults: ['junta'] },
  { img: ASSETS.montaje_fallo_latiguillo,            faults: ['latiguillo'] },
  { img: ASSETS.montaje_fallo_alineacion_latiguillo, faults: ['alineacion', 'latiguillo'] },
  { img: ASSETS.montaje_fallo_alineacion_latiguillo, faults: ['alineacion', 'latiguillo'] },
];

// ── Datos de diagnóstico ──────────────────────────────────────────────────────
const DIAG_DATA = {
  alineacion: {
    label:    'Orientación / alineación de la escuadra',
    que:      'La escuadra no está orientada correctamente — está torcida respecto al ramal.',
    porQue:   'Una escuadra torcida distribuye el apriete de forma irregular, generando fuga aunque la junta sea buena.',
    regla:    'Orienta antes de apretar. La alineación visual es parte del check.',
    queHacer: 'Presenta la escuadra, orienta el cuerpo perpendicular al ramal, luego aprieta con control.',
  },
  junta: {
    label:    'Junta mal asentada o sucia',
    que:      'La junta está pellizcada o mal colocada en el asiento.',
    porQue:   'Una junta que no sella fuga nada más abrir el agua — y no siempre se ve desde fuera.',
    regla:    'Antes de apretar, asiento y alineo.',
    queHacer: 'Retira la pieza, limpia el asiento, coloca la junta plana y centrada, luego presenta y aprieta con control.',
  },
  latiguillo: {
    label:    'Latiguillo con torsión o tensión',
    que:      'El latiguillo está retorcido o tirante — bajo tensión en vez de colgar libre.',
    porQue:   'La torsión genera estrés en los extremos del latiguillo — fuga progresiva que puede inundar el mueble.',
    regla:    'El latiguillo debe colgar libre, sin torsión ni tensión.',
    queHacer: 'Recoloca el latiguillo sin forzar el recorrido. Debe quedar con una curva suave, no tirante.',
  },
};

const CORRECT_MSGS = [
  '¡Correcto!',
  'Sin fugas.',
  'Bien visto.',
  '¡Eso es!',
];

const INSPECT_MSGS = [
  'Analiza el componente.',
  'Revisa los tres puntos.',
  '¿Ves algún fallo?',
  'Junta, alineación, latiguillo.',
  'Míralo bien antes de marcar.',
];

// ── Estado ───────────────────────────────────────────────────────────────────
const S = {
  assetIdx:      0,
  sequence:      [],
  lives:         3,
  score:         0,
  verdicts:      {},
  pendingFault:  null,
  assetStart:    0,
  locked:        false,
  correctMsgIdx: 0,
  timerRaf:      null,   // requestAnimationFrame handle para la barra
};

// ── Helpers DOM ───────────────────────────────────────────────────────────────
const $    = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

function setScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const el = $(`screen-${name}`);
  el.classList.remove('hidden');
  el.classList.add('active');
  if (name === 'results') document.documentElement.classList.add('results');
  else document.documentElement.classList.remove('results');
}

function setAvatar(elId, state) {
  const el = $(elId);
  if (el) el.src = ASSETS[`pedro_${state}`];
}

function showBubble(msg, ms = 2500) {
  const el = $('gameplay-bubble');
  el.textContent = msg;
  show(el);
  clearTimeout(showBubble._t);
  showBubble._t = setTimeout(() => hide(el), ms);
}

// ── Record ────────────────────────────────────────────────────────────────────
function getRecord() { return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10); }
function saveRecord(score) { if (score > getRecord()) localStorage.setItem(RECORD_KEY, score); }

// ── Partículas ────────────────────────────────────────────────────────────────
function burstParticles() {
  const canvas = $('asmr-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const rect = $('montaje-img').getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const particles = Array.from({ length: 36 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.9) * 14,
    r:  Math.random() * 6 + 3,
    color: Math.random() > 0.5 ? '#00E6BC' : '#04FFB4',
    alpha: 1,
  }));
  let start = null;
  function frame(ts) {
    if (!start) start = ts;
    const dt = (ts - start) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35;
      p.alpha = Math.max(0, 1 - dt * 1.4);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (dt < 0.75) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function updateHUD() {
  $('hud-progress').textContent = `${S.assetIdx + 1} / ${TOTAL_ASSETS}`;
  $('hud-score').textContent    = `${S.score} pts`;
  [1, 2, 3].forEach(i => {
    $(`heart-${i}`).classList.toggle('lost', i > S.lives);
  });
}

function shakeHeart() {
  const h = $(`heart-${S.lives + 1}`);
  if (!h) return;
  h.classList.add('shake');
  setTimeout(() => h.classList.remove('shake'), 400);
}

// ── Secuencia aleatoria ───────────────────────────────────────────────────────
function buildSequence() {
  // Fisher-Yates sobre una copia de ASSET_TYPES
  const arr = [...ASSET_TYPES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Asset actual ──────────────────────────────────────────────────────────────
function currentAsset() {
  return S.sequence[S.assetIdx];
}

// ── Barra de tiempo ───────────────────────────────────────────────────────────
function startTimerBar() {
  stopTimerBar();
  const bar = $('timer-bar');
  bar.style.transform = 'scaleX(1)';
  bar.style.transition = 'none';
  bar.style.background = 'var(--lime)';

  function tick() {
    const elapsed = Date.now() - S.assetStart;
    const pct     = Math.max(0, 1 - elapsed / SPEED_SLOW_MS);
    bar.style.transition = 'none';
    bar.style.transform  = `scaleX(${pct})`;
    // Color: verde → amarillo → rojo
    if (pct > 0.5)      bar.style.background = 'var(--lime)';
    else if (pct > 0.2) bar.style.background = 'var(--lemon)';
    else                bar.style.background = 'var(--rojo)';

    if (pct > 0) S.timerRaf = requestAnimationFrame(tick);
  }
  S.timerRaf = requestAnimationFrame(tick);
}

function stopTimerBar() {
  if (S.timerRaf) { cancelAnimationFrame(S.timerRaf); S.timerRaf = null; }
}

// ── Checklist reset ───────────────────────────────────────────────────────────
function resetChecklist() {
  S.verdicts = { alineacion: null, junta: null, latiguillo: null };
  PARAMS.forEach(param => {
    const row = $(`row-${param}`);
    row.classList.remove('selected-ok', 'selected-fail', 'shake');
    row.querySelectorAll('.btn-verdict').forEach(b => b.classList.remove('active'));
  });
}

// ── Lanzar asset (animación de caída) ────────────────────────────────────────
function dropAsset() {
  S.locked = true;
  const asset = currentAsset();
  const img   = $('montaje-img');

  // Reset posición: vuelve arriba
  img.classList.remove('landed', 'fault-flash');
  hide($('check-tick'));

  // Actualizar src
  img.src = asset.img;

  // Pequeño delay para que el browser procese el remove de 'landed'
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      img.classList.add('landed');
      // Cuando aterrice, habilitar checklist y mostrar instrucción
      setTimeout(() => {
        S.locked     = false;
        S.assetStart = Date.now();
        resetChecklist();
        updateHUD();
        startTimerBar();
        const msg = INSPECT_MSGS[S.assetIdx % INSPECT_MSGS.length];
        showBubble(msg, 2000);
        setAvatar('gameplay-avatar', 'happy');
      }, 580);
    });
  });
}

// ── Veredicto ─────────────────────────────────────────────────────────────────
function onVerdictClick(param, verdict) {
  if (S.locked) return;

  S.verdicts[param] = verdict;

  const row = $(`row-${param}`);
  row.classList.remove('selected-ok', 'selected-fail');
  row.classList.add(verdict === 'ok' ? 'selected-ok' : 'selected-fail');
  row.querySelectorAll('.btn-verdict').forEach(b => b.classList.remove('active'));
  row.querySelector(`[data-verdict="${verdict}"]`).classList.add('active');

  // ¿Ya están los 3 marcados?
  const allFilled = PARAMS.every(p => S.verdicts[p] !== null);
  if (allFilled) validateAnswer();
}

// ── Validar respuesta ─────────────────────────────────────────────────────────
function validateAnswer() {
  S.locked = true;
  const asset = currentAsset();

  // Comprobar cada param: correcto = faults.includes(param) → debe marcar 'fail'; si no → 'ok'
  const firstError = PARAMS.find(param => {
    const hasFault = asset.faults.includes(param);
    const markedOk = S.verdicts[param] === 'ok';
    return hasFault === markedOk; // marcó ok cuando había fallo, o fail cuando estaba bien
  });

  if (!firstError) {
    onCorrect();
  } else {
    onWrong(firstError, asset.faults.includes(firstError));
  }
}

// ── Respuesta correcta ────────────────────────────────────────────────────────
function onCorrect() {
  stopTimerBar();

  const elapsed  = Date.now() - S.assetStart;
  const speedPct = 1 - Math.min(1, Math.max(0, (elapsed - SPEED_FAST_MS) / (SPEED_SLOW_MS - SPEED_FAST_MS)));
  const bonus    = Math.round(speedPct * PTS_SPEED_MAX);
  const pts      = PTS_BASE + bonus;
  S.score       += pts;

  $('hud-score').textContent = `${S.score} pts`;

  // Feedback bonus visual encima del asset
  if (bonus > 0) showSpeedBonus(`+${bonus}`);

  show($('check-tick'));
  burstParticles();
  setAvatar('gameplay-avatar', 'celebrating');
  showBubble(CORRECT_MSGS[S.correctMsgIdx % CORRECT_MSGS.length]);
  S.correctMsgIdx++;

  setTimeout(() => {
    hide($('check-tick'));
    setAvatar('gameplay-avatar', 'happy');
    nextAsset();
  }, 1200);
}

function showSpeedBonus(text) {
  const el = document.createElement('div');
  el.className = 'speed-bonus';
  el.textContent = text;
  $('drop-zone').appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ── Respuesta incorrecta ──────────────────────────────────────────────────────
function onWrong(firstError, hasFault) {
  stopTimerBar();
  S.lives = Math.max(0, S.lives - 1);
  shakeHeart();
  updateHUD();
  setAvatar('gameplay-avatar', 'worried');

  const img = $('montaje-img');
  img.classList.add('fault-flash');
  setTimeout(() => img.classList.remove('fault-flash'), 400);

  // Marcar visualmente las filas incorrectas
  PARAMS.forEach(param => {
    const asset  = currentAsset();
    const fault  = asset.faults.includes(param);
    const marked = S.verdicts[param];
    if (marked === null) return;
    if ((fault && marked === 'ok') || (!fault && marked === 'fail')) {
      const row = $(`row-${param}`);
      row.classList.add('shake');
      setTimeout(() => row.classList.remove('shake'), 350);
    }
  });

  S.pendingFault = firstError;

  setTimeout(() => {
    if (hasFault) {
      openDiagnostico(currentAsset().faults);
    } else {
      openEduOverlay(firstError);
    }
  }, 500);
}

// ── Siguiente asset ───────────────────────────────────────────────────────────
function nextAsset() {
  if (S.lives === 0) { showResults(); return; }
  S.assetIdx++;
  if (S.assetIdx >= TOTAL_ASSETS) { showResults(); return; }
  dropAsset();
}

// ── Diagnóstico ───────────────────────────────────────────────────────────────
function openDiagnostico(faultParams) {
  // faultParams: array con 1 o 2 params
  const isMulti = faultParams.length > 1;

  // Construir opciones: todas las correctas + relleno hasta 3 opciones
  const wrongPool = PARAMS.filter(p => !faultParams.includes(p));
  const options = [
    ...faultParams.map(p => ({ label: DIAG_DATA[p].label, correct: true })),
    ...wrongPool.map(p   => ({ label: DIAG_DATA[p].label, correct: false })),
  ];
  // Si sólo hay 1 fallo, opciones = [correcto, incorrecto, incorrecto] → 3 opciones
  // Si hay 2 fallos, opciones = [correcto, correcto, incorrecto] → 3 opciones
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  $('diag-title').textContent = isMulti
    ? `Hay ${faultParams.length} fallos. ¿Cuáles son?`
    : '¿Qué está fallando?';

  document.querySelectorAll('.btn-option').forEach((btn, i) => {
    btn.textContent     = options[i].label;
    btn.dataset.correct = options[i].correct;
    btn.className       = 'btn-option';
    btn.disabled        = false;
  });

  if (isMulti) {
    // Modo selección múltiple: clic togglea, botón Confirmar valida
    show($('btn-diag-confirm'));
    $('btn-diag-confirm').disabled = true;
    document.querySelectorAll('.btn-option').forEach(btn => {
      btn.onclick = () => onDiagToggle(btn, faultParams.length);
    });
  } else {
    hide($('btn-diag-confirm'));
    document.querySelectorAll('.btn-option').forEach(btn => {
      btn.onclick = () => onDiagSingle(btn);
    });
  }

  $('diag-fault-img').src = currentAsset().img;
  show($('modal-diagnostico'));
}

// Selección única (1 fallo)
function onDiagSingle(btn) {
  const isCorrect  = btn.dataset.correct === 'true';
  const faultParam = S.pendingFault;
  document.querySelectorAll('.btn-option').forEach(b => b.disabled = true);

  if (isCorrect) {
    btn.classList.add('correct');
    setTimeout(() => {
      hide($('modal-diagnostico'));
      setAvatar('gameplay-avatar', 'happy');
      nextAsset();
    }, 700);
  } else {
    btn.classList.add('incorrect');
    document.querySelectorAll('.btn-option').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    S.lives = Math.max(0, S.lives - 1);
    shakeHeart();
    updateHUD();
    setAvatar('diag-avatar', 'worried');
    setTimeout(() => {
      hide($('modal-diagnostico'));
      openEduOverlay(faultParam);
    }, 600);
  }
}

// Selección múltiple (2 fallos): toggle + confirmar
function onDiagToggle(btn, needed) {
  btn.classList.toggle('selected');
  const selected = document.querySelectorAll('.btn-option.selected').length;
  $('btn-diag-confirm').disabled = selected !== needed;
}

function onDiagConfirm() {
  const faultParams = currentAsset().faults;
  const selected    = [...document.querySelectorAll('.btn-option.selected')];
  document.querySelectorAll('.btn-option').forEach(b => { b.disabled = true; b.onclick = null; });
  $('btn-diag-confirm').disabled = true;

  const allCorrect = selected.every(b => b.dataset.correct === 'true')
                  && selected.length === faultParams.length;

  if (allCorrect) {
    selected.forEach(b => b.classList.add('correct'));
    setTimeout(() => {
      hide($('modal-diagnostico'));
      setAvatar('gameplay-avatar', 'happy');
      nextAsset();
    }, 700);
  } else {
    // Marcar bien y mal
    document.querySelectorAll('.btn-option').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
      else if (b.classList.contains('selected')) b.classList.add('incorrect');
    });
    S.lives = Math.max(0, S.lives - 1);
    shakeHeart();
    updateHUD();
    setAvatar('diag-avatar', 'worried');
    setTimeout(() => {
      hide($('modal-diagnostico'));
      openEduOverlay(faultParams[0]);
    }, 600);
  }
}

// ── Overlay educativo ─────────────────────────────────────────────────────────
function openEduOverlay(param) {
  const d = DIAG_DATA[param];
  $('edu-que').textContent       = d.que;
  $('edu-por-que').textContent   = d.porQue;
  $('edu-regla').textContent     = d.regla;
  $('edu-que-hacer').textContent = d.queHacer;
  setAvatar('edu-avatar', 'worried');
  show($('modal-educativo'));
}

// ── Resultados ────────────────────────────────────────────────────────────────
function showResults() {
  const score    = S.score;
  const record   = getRecord();
  saveRecord(score);
  const newRecord = score > record;

  let state, msg;
  const maxScore = TOTAL_ASSETS * (PTS_BASE + PTS_SPEED_MAX);
  if (score >= maxScore * 0.8)      { state = 'celebrating'; msg = 'Sin fugas. Todos los montajes bien y rápido. Instalación de garantía.'; }
  else if (score >= TASK_THRESHOLD) { state = 'happy';        msg = 'Superado. Repasa la junta y la alineación — son los más frecuentes.'; }
  else                              { state = 'worried';      msg = 'El check de tres puntos no es opcional. Vuelve a intentarlo.'; }

  setAvatar('results-avatar', state);
  $('results-score').textContent  = `${score} pts`;
  $('results-msg').textContent    = msg;
  $('results-record').textContent = newRecord
    ? `¡Nuevo récord! ${score} pts`
    : `Récord: ${Math.max(record, score)} pts`;

  if (score >= TASK_THRESHOLD) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch (_) {}
  }

  setScreen('results');
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetGame() {
  S.assetIdx     = 0;
  S.sequence     = buildSequence();
  S.lives        = 3;
  S.score        = 0;
  S.verdicts     = {};
  S.pendingFault = null;
  S.locked       = false;
  S.correctMsgIdx = 0;

  hide($('modal-diagnostico'));
  hide($('modal-educativo'));
  hide($('check-tick'));
  $('montaje-img').classList.remove('landed', 'fault-flash');

  setAvatar('gameplay-avatar', 'happy');
  updateHUD();
  setScreen('play');

  // Pequeño delay para que la pantalla se muestre antes de caer el primer asset
  setTimeout(dropAsset, 200);
}

// ── Eventos ───────────────────────────────────────────────────────────────────
function initEvents() {
  function startGame() {
    S.sequence = buildSequence();
    setScreen('play');
    updateHUD();
    setTimeout(dropAsset, 200);
  }

  $('btn-start').addEventListener('click', () => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      show($('modal-tutorial'));
    } else {
      startGame();
    }
  });

  $('btn-tutorial-ok').addEventListener('click', () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    hide($('modal-tutorial'));
    startGame();
  });

  // Veredictos
  document.querySelectorAll('.btn-verdict').forEach(btn => {
    btn.addEventListener('click', () => {
      onVerdictClick(btn.dataset.param, btn.dataset.verdict);
    });
  });

  // Diagnóstico — los onclick se asignan dinámicamente en openDiagnostico
  $('btn-diag-confirm').addEventListener('click', onDiagConfirm);

  // Educativo
  $('btn-edu-ok').addEventListener('click', () => {
    hide($('modal-educativo'));
    setAvatar('gameplay-avatar', 'happy');
    nextAsset();
  });

  // Retry
  $('btn-retry').addEventListener('click', resetGame);
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
});
