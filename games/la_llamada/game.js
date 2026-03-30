/* ═══════════════════════════════════════════
   LA LLAMADA — game.js (v3)
   3 rondas fill-in-blank + grabación + detecta errores
   ═══════════════════════════════════════════ */
'use strict';

/* ─── Helpers ─────────────────────────────── */
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  if (navigator.vibrate) {
    const ms = { light: 30, medium: 60, heavy: 100, success: 60, error: 80 };
    navigator.vibrate(pattern || ms[level] || 30);
  }
}

function taskCompleted() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const t = document.getElementById(id);
  t.classList.remove('hidden');
  t.classList.add('active');
}

function $(id) { return document.getElementById(id); }
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── Content pool ────────────────────────── */

// Each blank: { a, b, c, feedbackA, feedbackB, feedbackC }
// a & b = correct (+100), c = incorrect (0 + overlay)
const BLANKS_DEF = {
  oficio: {
    a: 'instalador/a de electricidad, fontanería y climatización',
    b: 'técnico/a en instalaciones de electricidad, fontanería y climatización',
    c: 'una persona muy trabajadora y con muchas ganas de aprender',
    feedbackA: '✓ Oficio claro y completo. El encargado sabe de un vistazo qué sabes hacer.',
    feedbackB: '✓ Título técnico preciso. Muestra formación y especialización.',
    feedbackC: 'Los adjetivos genéricos no identifican tu oficio. El encargado necesita saber qué sabes hacer, no cómo eres.'
  },
  formacion: {
    a: 'Completé el Bootkämp de instalaciones, donde aprendí electricidad, fontanería y climatización con prácticas reales',
    b: 'Me formé en el Bootkämp de Kämpe — electricidad, fontanería y climatización, con proyectos reales desde el primer día',
    c: 'Estudié mucho y me esforcé todos los días',
    feedbackA: '✓ Programa + áreas + contexto real. El encargado sabe de dónde vienes y qué has tocado.',
    feedbackB: '✓ Programa + áreas + dato que lo hace creíble. Conciso y directo.',
    feedbackC: 'Sin mencionar qué aprendiste ni dónde. No aporta nada. Nombra el programa, las áreas y algo que hiciste.'
  },
  evidencia_electrica: {
    a: 'monté cuadros eléctricos con IGA, diferencial y PIAs — cableado limpio y etiquetado',
    b: 'instalé circuitos de iluminación y fuerza — trazado, canalización y conexionado completo',
    c: 'hice la parte de electricidad del Bootkämp y aprendí bastante',
    feedbackA: '✓ Tarea concreta + resultado visible. Así se construye una evidencia que convence.',
    feedbackB: '✓ Proceso completo de principio a fin. El encargado puede imaginarse trabajando contigo.',
    feedbackC: 'Sin tarea concreta ni resultado. Cualquiera podría decir esto. Di qué montaste y cómo quedó.'
  },
  evidencia_clima: {
    a: 'instalé tuberías de cobre con uniones soldadas y verifiqué la estanqueidad del circuito',
    b: 'puse en marcha un equipo split — fijación, conexión frigorífica, carga de gas y comprobación de temperaturas',
    c: 'también aprendí fontanería y climatización en el Bootkämp',
    feedbackA: '✓ Fontanería con detalle técnico real. Tarea + proceso + verificación.',
    feedbackB: '✓ Climatización paso a paso. Se ve que sabes lo que hiciste.',
    feedbackC: 'Sin especificar qué hiciste ni cómo quedó. Una evidencia sin tarea concreta no convence.'
  },
  zona: {
    a: 'Madrid capital y alrededores — tengo carnet de conducir y vehículo propio',
    b: 'la zona de Madrid, con disponibilidad para desplazarme — tengo carnet B',
    c: 'donde haga falta, me da igual el sitio',
    feedbackA: '✓ Zona concreta + movilidad como ventaja. Claro y útil para el encargado.',
    feedbackB: '✓ Zona acotada + dato práctico de movilidad. Directo y profesional.',
    feedbackC: 'Muestra falta de criterio. Mejor acotar zona y presentar la movilidad como ventaja.'
  },
  empresa: {
    a: 'una empresa de instalaciones de electricidad, fontanería o climatización, preferiblemente con contrato',
    b: 'una instaladora que trabaje en proyectos residenciales o de servicios — busco estabilidad y seguir aprendiendo',
    c: 'cualquier empresa que me quiera contratar',
    feedbackA: '✓ Muestra criterio: especialidad, tipo de empresa, condición laboral.',
    feedbackB: '✓ Tipo de proyecto + motivación real. Transmite que quieres crecer, no solo un trabajo.',
    feedbackC: 'Transmite desesperación. Muestra que tienes criterio: qué tipo de empresa, qué proyectos, qué buscas.'
  },
  disponibilidad: {
    a: 'incorporación inmediata, jornada completa',
    b: 'puedo empezar esta semana, a jornada completa o las horas que necesitéis',
    c: 'depende de las condiciones que ofrezcáis',
    feedbackA: '✓ Claro, concreto y sin ambigüedad. El encargado no necesita preguntar más.',
    feedbackB: '✓ Inmediato + flexible. Da confianza y quita fricción.',
    feedbackC: 'Genera incertidumbre. El encargado quiere saber cuándo puedes empezar, no negociar. Sé directo.'
  }
};

// Rondas: which blanks go in each round
const ROUND_BLANKS = [
  ['formacion'],                               // Ronda 1 — Quién soy
  ['evidencia_electrica', 'evidencia_clima'],  // Ronda 2 — Lo que sé hacer
  ['zona', 'empresa', 'disponibilidad']        // Ronda 3 — Qué busco
];

const ROUND_TITLES = [
  'Ronda 1 — Quién soy',
  'Ronda 2 — Lo que sé hacer',
  'Ronda 3 — Qué busco'
];

const R4_FRAGMENTS = [
  {
    text: '"Hola… bueno… me llamo… este… Juan"',
    isError: true,
    overlay: 'Una apertura dubitativa destruye la confianza en 5 segundos. Empieza directo: "Me llamo Juan, soy instalador de electricidad."'
  },
  {
    text: '"Monté un cuadro eléctrico con IGA, diferencial y PIAs — cableado limpio y etiquetado"',
    isError: false,
    overlay: 'Tarea concreta + resultado visible. Así se construye una evidencia que convence a un encargado.'
  },
  {
    text: '"Soy muy responsable y me adapto a todo"',
    isError: true,
    overlay: 'Todos los candidatos dicen lo mismo. Reemplázalo con una evidencia real: qué hiciste y cómo quedó.'
  },
  {
    text: '"Busco empresa en Madrid con disponibilidad inmediata y carnet de conducir"',
    isError: false,
    overlay: 'Zona + disponibilidad + dato práctico. El encargado sabe si encajas sin necesidad de preguntar.'
  },
  {
    text: '"También sé de fontanería porque lo hice en el Bootkämp"',
    isError: true,
    overlay: 'Sin tarea concreta ni resultado. Di qué instalaste y cómo quedó — "instalé un circuito de agua fría y caliente con tuberías de cobre y prueba de estanqueidad."'
  },
  {
    text: '"Mi perfil Kämpe tiene evidencias verificadas con fotos y títulos de mis trabajos"',
    isError: false,
    overlay: 'El cierre perfecto. Invitas al encargado a ver exactamente lo que ya está revisando.'
  }
];

/* ─── State ───────────────────────────────── */
const S = {
  nombre: '',
  score: 0,
  roundIndex: 0,    // 0,1,2 = fill-in-blank; after = grabacion then r4
  blankIndex: 0,
  choices: {},      // { oficio: 'text', formacion: 'text', ... }
  r4Index: 0,
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  timerInterval: null,
  timerSec: 60,
  tourStep: 1,
};

const RECORD_KEY = 'la_llamada_record';
const TOUR_KEY   = 'la_llamada_tour_done';

/* ─── Init ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setupIntro();
  setupTour();
  setupIntroGrab();
  setupGrabacion();
  setupResults();
});

/* ════════════════════════════════════════════
   INTRO
   ════════════════════════════════════════════ */
function setupIntro() {
  $('btn-start').onclick = () => {
    const raw = $('input-nombre').value.trim();
    S.nombre = raw.length >= 2 ? raw : 'tú';
    localStorage.getItem(TOUR_KEY) ? startRound(0) : showScreen('screen-tour');
  };
}

/* ════════════════════════════════════════════
   TOUR
   ════════════════════════════════════════════ */
function setupTour() {
  $('btn-tour-next').onclick = () => {
    if (S.tourStep < 3) {
      goTourStep(S.tourStep + 1);
    } else {
      localStorage.setItem(TOUR_KEY, '1');
      startRound(0);
    }
  };
}

function goTourStep(step) {
  S.tourStep = step;
  document.querySelectorAll('.tour-step').forEach(el => {
    el.classList.toggle('active', false);
    el.classList.toggle('hidden', true);
  });
  document.querySelectorAll('.dot').forEach(el => el.classList.remove('active'));
  const stepEl = document.querySelector(`.tour-step[data-step="${step}"]`);
  if (stepEl) { stepEl.classList.remove('hidden'); stepEl.classList.add('active'); }
  const dot = document.querySelector(`.dot[data-dot="${step}"]`);
  if (dot) dot.classList.add('active');
  $('btn-tour-next').textContent = step < 3 ? 'Siguiente →' : 'Entendido, empezamos →';
}

/* ════════════════════════════════════════════
   GAMEPLAY — RONDAS 1–3 (Fill-in-blank)
   ════════════════════════════════════════════ */
function startRound(roundIndex) {
  S.roundIndex = roundIndex;
  S.blankIndex = 0;

  showScreen('screen-play');
  $('game-fib').classList.remove('hidden');
  $('game-r4').classList.add('hidden');

  $('hud-ronda').textContent = ROUND_TITLES[roundIndex];
  $('btn-siguiente-ronda').classList.add('hidden');
  $('bubble-play').classList.remove('hidden');
  updateScore();
  renderBlank();
}

function renderBlank() {
  const key  = ROUND_BLANKS[S.roundIndex][S.blankIndex];
  const def  = BLANKS_DEF[key];

  // Update frase card
  $('frase-text').innerHTML = buildFraseHtml(key);

  // Shuffle so C isn't always last; keep track of which button is which value
  const options = shuffleOptions([
    { text: def.a, correct: true,  feedback: def.feedbackA },
    { text: def.b, correct: true,  feedback: def.feedbackB },
    { text: def.c, correct: false, feedback: def.feedbackC }
  ]);

  const container = $('opciones');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opcion-btn';
    btn.textContent = opt.text;
    btn.onclick = () => chooseOption(key, opt);
    container.appendChild(btn);
  });

  setBubble('play', bubblePrompt(key));
}

function shuffleOptions(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function chooseOption(key, opt) {
  // Disable all buttons immediately
  $('opciones').querySelectorAll('.opcion-btn').forEach(b => b.disabled = true);

  if (opt.correct) {
    S.choices[key] = opt.text;
    S.score += 100;
    updateScore();
    vibrate('light');

    const card = $('frase-card');
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 400);

    // Update phrase to show chosen value
    $('frase-text').innerHTML = buildFraseHtml(null);

    S.blankIndex++;
    const blanks = ROUND_BLANKS[S.roundIndex];

    if (S.blankIndex >= blanks.length) {
      // Round complete — hide options, hide bubble, show next button
      vibrate('success');
      $('opciones').innerHTML = '';
      $('bubble-play').classList.add('hidden');
      const isLast = S.roundIndex >= 2;
      const btnSig = $('btn-siguiente-ronda');
      btnSig.textContent = isLast ? 'Siguiente →' : 'Siguiente ronda →';
      btnSig.classList.remove('hidden');
      btnSig.onclick = () => {
        btnSig.classList.add('hidden');
        if (isLast) {
          goToGrabacion();
        } else {
          startRound(S.roundIndex + 1);
        }
      };
    } else {
      setTimeout(() => renderBlank(), 450);
    }

  } else {
    // Wrong option
    vibrate('error');
    const card = $('frase-card');
    card.classList.add('flash-err');
    setTimeout(() => card.classList.remove('flash-err'), 400);
    showFibOverlay(opt.feedback, false, () => {
      // Re-enable correct buttons only
      $('opciones').querySelectorAll('.opcion-btn').forEach(b => {
        b.disabled = false;
      });
    });
  }
}

// Builds only the fragment for the current round
function buildFraseHtml(activeKey) {
  const nombre = escapeHtml(S.nombre);
  const c = S.choices;
  const lines = [];

  if (S.roundIndex === 0) {
    // Ronda 1: "Me llamo X," + hueco de FORMACIÓN
    lines.push(`Me llamo <span class="texto-elegido">${nombre}</span>,`);

    if (c.formacion)                    lines.push(`<span class="texto-elegido">${escapeHtml(c.formacion)}</span>.`);
    else if (activeKey === 'formacion') lines.push(`<span class="hueco">___</span>`);

  } else if (S.roundIndex === 1) {
    // Ronda 2: [EVIDENCIA_ELECTRICA]. También [EVIDENCIA_CLIMA].
    if (c.evidencia_electrica)                    lines.push(`<span class="texto-elegido">${escapeHtml(c.evidencia_electrica)}</span>.`);
    else if (activeKey === 'evidencia_electrica') lines.push(`<span class="hueco">___</span>`);

    if (c.evidencia_clima)                   lines.push(`También <span class="texto-elegido">${escapeHtml(c.evidencia_clima)}</span>.`);
    else if (activeKey === 'evidencia_clima') lines.push(`También <span class="hueco">___</span>`);

  } else if (S.roundIndex === 2) {
    // Ronda 3: Busco trabajo en [ZONA], en [EMPRESA]. Mi disponibilidad: [DISPONIBILIDAD].
    let l1 = 'Busco trabajo en ';
    if (c.zona)                    l1 += `<span class="texto-elegido">${escapeHtml(c.zona)}</span>`;
    else if (activeKey === 'zona') l1 += `<span class="hueco">___</span>`;
    else                           l1 += `___`;
    l1 += ', en ';
    if (c.empresa)                    l1 += `<span class="texto-elegido">${escapeHtml(c.empresa)}</span>`;
    else if (activeKey === 'empresa') l1 += `<span class="hueco">___</span>`;
    else                              l1 += `___`;
    lines.push(l1 + '.');

    if (c.disponibilidad)                      lines.push(`Mi disponibilidad: <span class="texto-elegido">${escapeHtml(c.disponibilidad)}</span>.`);
    else if (activeKey === 'disponibilidad')   lines.push(`Mi disponibilidad: <span class="hueco">___</span>`);
  }

  return lines.filter(l => l !== '').join('<br>');
}

function bubblePrompt(key) {
  const map = {
    oficio: '¿Cómo describirías tu oficio?',
    formacion: '¿Cómo resumirías tu formación?',
    evidencia_electrica: '¿Qué hiciste en electricidad?',
    evidencia_clima: '¿Y en fontanería o climatización?',
    zona: '¿Dónde buscas trabajo?',
    empresa: '¿Qué tipo de empresa buscas?',
    disponibilidad: '¿Cuándo puedes empezar?'
  };
  return map[key] || '';
}

function setBubble(which, text, autohideMs) {
  const id = which === 'play' ? 'bubble-play' : 'bubble-grab';
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  if (el._autohideTimer) clearTimeout(el._autohideTimer);
  if (autohideMs) {
    el._autohideTimer = setTimeout(() => el.classList.add('hidden'), autohideMs);
  }
}

function updateScore() {
  $('hud-score').textContent = `${S.score} pts`;
}

/* ─── FIB overlay (incorrect option) ─── */
function showFibOverlay(msg, isCorrect, onClose) {
  const contentEl = $('overlay-content');
  if (isCorrect) {
    contentEl.innerHTML =
      `<p class="ov-label ok">¿Por qué está bien?</p>` +
      `<p class="ov-body">${escapeHtml(msg)}</p>`;
  } else {
    contentEl.innerHTML =
      `<p class="ov-label">¿Por qué está mal?</p>` +
      `<p class="ov-body">${escapeHtml(msg)}</p>`;
  }
  // Use worried for error, happy for correct
  $('overlay-edu').querySelector('.overlay-avatar').src =
    isCorrect ? 'assets/alexia_happy.png' : 'assets/alexia_worried.png';

  $('overlay-edu').classList.remove('hidden');
  $('btn-entendido').onclick = () => {
    $('overlay-edu').classList.add('hidden');
    if (onClose) onClose();
  };
}

/* ════════════════════════════════════════════
   PANTALLA GRABACIÓN (después de ronda 3)
   ════════════════════════════════════════════ */
function goToGrabacion() {
  showScreen('screen-intro-grab');
}

function goToGrabacionReal() {
  showScreen('screen-grabacion');

  // Build complete frase card
  buildFraseCompletaCard();

  // Reset UI
  clearRecordingState();
  $('grab-acciones').classList.add('hidden');
  $('audio-pb').classList.add('hidden');
  $('audio-pb').src = '';
  $('btn-grabar').classList.remove('hidden');
  $('btn-detener').classList.add('hidden');
  $('grab-timer').classList.add('hidden');
  $('grab-viz').classList.add('hidden');

  setBubble('grab', 'Lee la frase completa en voz alta y cuando estés listo pulsa grabar.', 4000);
}

function buildFraseCompletaCard() {
  const c = S.choices;
  const nombre = escapeHtml(S.nombre);
  $('frase-completa-card').innerHTML =
    `Me llamo <span class="fc-nombre">${nombre}</span>, soy instalador/a de electricidad, fontanería y climatización.<br>` +
    `<span class="fc-formacion">${escapeHtml(c.formacion || '___')}</span>.<br>` +
    `<span class="fc-evidencia">${escapeHtml(c.evidencia_electrica || '___')}</span>.<br>` +
    `También <span class="fc-evidencia">${escapeHtml(c.evidencia_clima || '___')}</span>.<br>` +
    `Busco trabajo en <span class="fc-zona">${escapeHtml(c.zona || '___')}</span>, ` +
    `en <span class="fc-zona">${escapeHtml(c.empresa || '___')}</span>.<br>` +
    `Mi disponibilidad: <span class="fc-disponibilidad">${escapeHtml(c.disponibilidad || '___')}</span>.`;
}

function clearRecordingState() {
  if (S.timerInterval) { clearInterval(S.timerInterval); S.timerInterval = null; }
  if (S.mediaRecorder && S.mediaRecorder.state !== 'inactive') {
    try { S.mediaRecorder.stop(); } catch(e) {}
  }
  S.mediaRecorder = null;
  S.audioChunks = [];
  S.audioBlob = null;
  S.timerSec = 60;
}

function setupIntroGrab() {
  $('btn-ver-frase').onclick = () => {
    goToGrabacionReal();
  };
}

function setupGrabacion() {
  $('btn-grabar').onclick  = startRecording;
  $('btn-detener').onclick = stopRecording;
  $('btn-repetir').onclick = resetRecording;
  $('btn-sig-ronda').onclick = nextFromGrabacion;
  $('btn-saltar').onclick    = nextFromGrabacion;
}

async function startRecording() {
  vibrate('medium');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
                   : MediaRecorder.isTypeSupported('audio/ogg')  ? 'audio/ogg' : '';
    S.audioChunks = [];
    S.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

    S.mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data.size > 0) S.audioChunks.push(e.data);
    });
    S.mediaRecorder.addEventListener('stop', () => {
      stream.getTracks().forEach(t => t.stop());
      S.audioBlob = new Blob(S.audioChunks, { type: mimeType || 'audio/webm' });
      const url = URL.createObjectURL(S.audioBlob);
      $('audio-pb').src = url;
      $('audio-pb').classList.remove('hidden');
      $('grab-viz').classList.add('hidden');
      $('grab-timer').classList.add('hidden');
      $('btn-detener').classList.add('hidden');
      $('grab-acciones').classList.remove('hidden');
      setBubble('grab', 'Escúchate. ¿Suenas a alguien que contratarías?', 4000);
    });

    S.mediaRecorder.start();
    $('btn-grabar').classList.add('hidden');
    $('btn-detener').classList.remove('hidden');
    $('grab-viz').classList.remove('hidden');
    $('grab-timer').classList.remove('hidden');
    $('grab-timer').textContent = 60;
    S.timerSec = 60;

    S.timerInterval = setInterval(() => {
      S.timerSec--;
      $('grab-timer').textContent = S.timerSec;
      if (S.timerSec <= 0) stopRecording();
    }, 1000);

  } catch (err) {
    console.warn('Mic unavailable:', err);
    nextFromGrabacion();
  }
}

function stopRecording() {
  if (S.timerInterval) { clearInterval(S.timerInterval); S.timerInterval = null; }
  if (S.mediaRecorder && S.mediaRecorder.state !== 'inactive') S.mediaRecorder.stop();
}

function resetRecording() {
  vibrate('light');
  clearRecordingState();
  $('audio-pb').src = '';
  $('audio-pb').classList.add('hidden');
  $('grab-acciones').classList.add('hidden');
  $('btn-grabar').classList.remove('hidden');
  $('btn-detener').classList.add('hidden');
  $('grab-timer').classList.add('hidden');
  $('grab-viz').classList.add('hidden');
  setBubble('grab', 'Cada toma es mejor. Cuando suene bien, pasamos.', 4000);
}

function nextFromGrabacion() {
  clearRecordingState();
  startRound4();
}

/* ════════════════════════════════════════════
   RONDA 4 — Detecta los errores
   ════════════════════════════════════════════ */
function startRound4() {
  S.r4Index = 0;

  showScreen('screen-play');
  $('game-fib').classList.add('hidden');
  $('game-r4').classList.remove('hidden');

  $('hud-ronda').textContent = 'Ronda 4 — Detecta los errores';
  updateScore();

  // Build progress dots
  const prog = $('r4-progreso');
  prog.innerHTML = '';
  R4_FRAGMENTS.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'prog-dot' + (i === 0 ? ' current' : '');
    dot.id = `prog-${i}`;
    prog.appendChild(dot);
  });

  $('btn-correcto').onclick = () => judgeFragment(false);
  $('btn-error').onclick    = () => judgeFragment(true);

  renderFragment();
}

function renderFragment() {
  $('fragmento-text').textContent = R4_FRAGMENTS[S.r4Index].text;
  $('btn-correcto').disabled = false;
  $('btn-error').disabled    = false;
}

function judgeFragment(playerSaysError) {
  const frag = R4_FRAGMENTS[S.r4Index];
  const correct = (playerSaysError === frag.isError);

  $('btn-correcto').disabled = true;
  $('btn-error').disabled    = true;

  if (correct) {
    S.score += 100;
    updateScore();
    vibrate('light');
    $('fragmento-card').classList.add('flash-ok');
    setTimeout(() => $('fragmento-card').classList.remove('flash-ok'), 500);
    markDot(S.r4Index, 'done-ok');
  } else {
    vibrate('error');
    $('fragmento-card').classList.add('flash-err');
    setTimeout(() => $('fragmento-card').classList.remove('flash-err'), 400);
    markDot(S.r4Index, 'done-err');
  }

  // Always show overlay
  showR4Overlay(frag.overlay, correct, frag.isError);
}

function showR4Overlay(msg, wasCorrect, fragmentIsError) {
  const contentEl = $('overlay-content');
  const label = wasCorrect
    ? (fragmentIsError ? '¿Por qué es un error?' : '¿Por qué está bien?')
    : (fragmentIsError ? 'Era un error — ¿por qué?' : 'Era correcto — ¿por qué?');

  contentEl.innerHTML =
    `<p class="ov-label ${wasCorrect ? 'ok' : ''}">${escapeHtml(label)}</p>` +
    `<p class="ov-body">${escapeHtml(msg)}</p>`;

  $('overlay-edu').querySelector('.overlay-avatar').src =
    wasCorrect ? 'assets/alexia_happy.png' : 'assets/alexia_worried.png';

  $('overlay-edu').classList.remove('hidden');
  $('btn-entendido').onclick = () => {
    $('overlay-edu').classList.add('hidden');
    S.r4Index++;
    if (S.r4Index >= R4_FRAGMENTS.length) {
      // pequeño delay para que el overlay cierre antes de cambiar pantalla
      setTimeout(() => showResults(), 50);
    } else {
      renderFragment();
    }
  };
}

function markDot(index, cls) {
  const dot = $(`prog-${index}`);
  if (dot) { dot.classList.remove('current'); dot.classList.add(cls); }
  const next = $(`prog-${index + 1}`);
  if (next) next.classList.add('current');
}

/* ════════════════════════════════════════════
   RESULTADOS
   ════════════════════════════════════════════ */
function showResults() {
  vibrate('success', [0, 100, 50, 100, 50, 300]);
  taskCompleted();
  showScreen('screen-results');

  // Score count-up
  let displayed = 0;
  const step = Math.ceil(S.score / 40);
  const iv = setInterval(() => {
    displayed = Math.min(displayed + step, S.score);
    $('res-score').textContent = `${displayed} pts`;
    if (displayed >= S.score) clearInterval(iv);
  }, 30);

  // Record
  const prev = parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
  if (S.score > prev) {
    localStorage.setItem(RECORD_KEY, String(S.score));
    $('res-record').textContent = '🏆 Nuevo récord';
  } else {
    $('res-record').textContent = prev > 0 ? `Récord: ${prev} pts` : '';
  }

  // Tier
  const pct = S.score / 1300;
  let src, msg;
  if (pct >= 0.80) {
    src = 'assets/alexia_celebrating.png';
    msg = 'Dominas la frase contratable. Ese perfil genera llamadas.';
  } else if (pct >= 0.60) {
    src = 'assets/alexia_happy.png';
    msg = 'Vas bien. Practica tu presentación hasta que salga sola.';
  } else {
    src = 'assets/alexia_worried.png';
    msg = 'Repasa los errores típicos — son los que más candidaturas destruyen.';
  }
  $('avatar-res').src = src;
  $('bubble-res').textContent = msg;


  $('btn-reintentar').onclick = restartGame;
  $('btn-cerrar').onclick = () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'CLOSE' }));
    }
  };
}

function restartGame() {
  S.score = 0;
  S.roundIndex = 0;
  S.blankIndex = 0;
  S.choices = {};
  S.r4Index = 0;
  showScreen('screen-intro');
}
