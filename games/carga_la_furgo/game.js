/* ═══════════════════════════════════════════════
   CARGA LA FURGO — game.js
   ═══════════════════════════════════════════════ */

'use strict';

// ── Constantes ──────────────────────────────────
const DIAL_START   = 30;
const DIAL_STEP    = 5;
const KEY_RECORD   = 'carga_la_furgo_record';
const KEY_TUTORIAL = 'carga_la_furgo_tutorial_done';

const AVATAR = {
  happy:       'assets/juancarlos_happy.jpg',
  celebrating: 'assets/juancarlos_celebrating.jpg',
  worried:     'assets/juancarlos_worried.jpg',
};

// ── Pool de contenido ───────────────────────────
const PIEZAS = [
  {
    id: 'llave_corte', nombre: 'Llave de corte',
    img: 'assets/pieza_llave_corte.png',
    desc: [
      'Necesito lo que para el agua antes de tocar nada. La regla de oro.',
      'El cliente no puede cortar el agua de ese tramo. ¿Qué le falta instalar?',
      '¿Qué es lo primero que toco antes de aflojar cualquier unión en zona húmeda?',
    ],
    mandaste: 'Eso es una llave de corte — para el agua de un tramo.',
    pista:    'Para trabajar en zona húmeda hay una regla de oro antes de aflojar nada. ¿Qué control tienes que tener siempre preparado?',
  },
  {
    id: 'sifon', nombre: 'Sifón',
    img: 'assets/pieza_sifon.png',
    desc: [
      'Necesito la pieza que evita que suban los olores por el desagüe.',
      'El cliente dice que huele a alcantarilla en el baño. ¿Qué falta o está mal?',
      '¿Qué conecta el aparato sanitario con la evacuación y retiene el olor?',
    ],
    mandaste: 'Eso es un sifón — retiene agua para bloquear olores y conecta la evacuación.',
    pista:    'El problema es que suben olores por el desagüe. ¿Qué pieza retiene agua para hacer de barrera?',
  },
  {
    id: 'latiguillo', nombre: 'Latiguillo',
    img: 'assets/pieza_latiguillo.png',
    desc: [
      'Necesito la conexión flexible entre el grifo y la toma de pared.',
      'Gotea justo debajo del fregadero, en la entrada del agua. ¿Qué hay que revisar?',
      '¿Qué pieza absorbe las vibraciones entre el grifo y la pared?',
    ],
    mandaste: 'Eso es un latiguillo — conexión flexible entre grifo y pared.',
    pista:    'El goteo está donde el grifo conecta con la pared. ¿Qué pieza hace esa unión y además es flexible?',
  },
  {
    id: 'junta', nombre: 'Junta',
    img: 'assets/pieza_junta.png',
    desc: [
      'Necesito lo que sella entre dos piezas para que no gotee en la unión.',
      'Aprieto y aprieto pero sigue goteando en la rosca. ¿Qué puede faltar?',
      '¿Qué es lo primero que compruebo si hay un goteo justo donde dos piezas se unen?',
    ],
    mandaste: 'Eso es una junta — sella entre dos piezas para evitar goteos.',
    pista:    'Aprietas y aprietas pero sigue goteando en la unión. ¿Qué elemento de sellado puede faltar o estar deteriorado?',
  },
  {
    id: 'teflon', nombre: 'Teflón',
    img: 'assets/pieza_teflon.png',
    desc: [
      'Necesito lo que se enrolla en la rosca macho antes de apretar para sellar.',
      'La rosca no gotea a chorro pero suda. ¿Qué no se puso al montar?',
      '¿Con qué sello una rosca metálica para que no haya microfugas?',
    ],
    mandaste: 'Eso es teflón — sella roscas metálicas antes de apretar.',
    pista:    'La rosca suda aunque esté bien apretada. ¿Qué se aplica antes de apretar para sellar roscas metálicas?',
  },
  {
    id: 'racor', nombre: 'Racor',
    img: 'assets/pieza_racor.png',
    desc: [
      'Necesito la unión recta para empalmar dos tramos del mismo diámetro.',
      'Hay un tramo cortado y hay que empalmarlo en línea recta. ¿Qué pieza uso?',
      '¿Qué uso para unir dos tubos del mismo diámetro sin cambiar de dirección?',
    ],
    mandaste: 'Eso es un racor — une dos tramos en línea recta, mismo diámetro.',
    pista:    'Hay que empalmar dos tramos en línea recta, mismo diámetro. ¿Qué pieza hace esa unión sin cambiar de dirección?',
  },
  {
    id: 'codo', nombre: 'Codo',
    img: 'assets/pieza_codo.png',
    desc: [
      'Necesito la pieza para cambiar la dirección de la tubería.',
      'La tubería tiene que girar noventa grados por la pared. ¿Qué pieza uso?',
      '¿Con qué hago que una tubería doble sin forzarla?',
    ],
    mandaste: 'Eso es un codo — cambia la dirección de la tubería.',
    pista:    'La tubería tiene que girar sin forzarse. ¿Qué pieza permite cambiar la dirección?',
  },
  {
    id: 'reduccion', nombre: 'Reducción',
    img: 'assets/pieza_reduccion.png',
    desc: [
      'Necesito algo para conectar dos tubos que no son del mismo grosor.',
      'El tubo nuevo es más estrecho que el existente. ¿Qué necesito para conectarlos?',
      '¿Qué pieza adapta diámetros distintos para unir dos tubos de diferente grosor?',
    ],
    mandaste: 'Eso es una reducción — adapta dos diámetros distintos.',
    pista:    'Los dos tubos no tienen el mismo grosor. ¿Qué pieza adapta diámetros diferentes?',
  },
];

const MSG_ACIERTO = [
  'Eso es. Bien.',
  'Correcto. Cárgala.',
  'Exacto. Eso es lo que necesitaba.',
  'Sí. Sin dudar.',
];

// ── Estado ──────────────────────────────────────
const G = {
  orden: [],
  turno: 0,
  fallos: 0,
  dial: DIAL_START,
  completadas: [],   // { id, intentos }
  intentosTurno: 0,
  tutorialDone: false,
  tutorialPaso: 0,   // 0 → 1 → 2 (completado)
  bloqueado: false,
  lluvia: false,
  rainId: null,
  rotAcierto: 0,
  twId: null,        // typewriter interval
};

// ── DOM ─────────────────────────────────────────
const $ = id => document.getElementById(id);

const EL = {
  intro:      $('screen-intro'),
  play:       $('screen-play'),
  results:    $('screen-results'),
  dial:       $('parking-dial'),
  progress:   $('hud-progress'),
  jcImg:      $('jc-img'),
  callBubble: $('call-bubble'),
  callText:   $('call-text'),
  grid:       $('piezas-grid'),
  rain:       $('rain-canvas'),
  notif:      $('notif-call'),
  overlayEdu: $('overlay-edu'),
  oMandaste:  $('overlay-mandaste'),
  oPista:     $('overlay-pista'),
  btnEnt:     $('btn-entendido'),
  rAvatar:    $('results-avatar'),
  rEstado:    $('results-estado'),
  rFallos:    $('results-fallos'),
  rExtra:     $('results-extra'),
  rRecord:    $('results-record'),
  rMsg:       $('results-msg'),
  rGrid:      $('results-grid'),
};

// ── Utilidades ──────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name) {
  ['intro', 'play', 'results'].forEach(n => {
    const el = $('screen-' + n);
    el.classList.toggle('active', n === name);
    el.style.display = n === name ? 'flex' : 'none';
  });
  document.documentElement.classList.toggle('results', name === 'results');
}

function setJC(state) {
  EL.jcImg.src = AVATAR[state] || AVATAR.happy;
}

function typewrite(text, cb) {
  clearInterval(G.twId);
  EL.callText.textContent = '';
  let i = 0;
  G.twId = setInterval(() => {
    EL.callText.textContent += text[i++];
    if (i >= text.length) {
      clearInterval(G.twId);
      G.twId = null;
      cb && cb();
    }
  }, 28);
}

// ── Dial SVG ─────────────────────────────────────
const DIAL_CX = 55, DIAL_CY = 55, DIAL_R = 44;

function dialPolar(angleDeg, r) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: DIAL_CX + r * Math.cos(rad), y: DIAL_CY + r * Math.sin(rad) };
}

function buildDialTicks() {
  const NS = 'http://www.w3.org/2000/svg';
  const tG = $('dial-ticks');
  const lG = $('dial-labels');
  if (!tG || tG.childElementCount) return;   // ya construido

  [30, 25, 20, 15, 10, 5].forEach((label, i) => {
    const deg   = i * 60;
    const outer = dialPolar(deg, 50);
    const inner = dialPolar(deg, 44);
    const lpos  = dialPolar(deg, 36);

    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', outer.x.toFixed(1)); line.setAttribute('y1', outer.y.toFixed(1));
    line.setAttribute('x2', inner.x.toFixed(1)); line.setAttribute('y2', inner.y.toFixed(1));
    line.setAttribute('stroke', 'rgba(255,255,255,0.45)');
    line.setAttribute('stroke-width', '1.5');
    tG.appendChild(line);

    const txt = document.createElementNS(NS, 'text');
    txt.setAttribute('x', lpos.x.toFixed(1));
    txt.setAttribute('y', (lpos.y + 2.5).toFixed(1));
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', "'Baloo 2',cursive");
    txt.setAttribute('font-size', '7');
    txt.setAttribute('font-weight', '700');
    txt.setAttribute('fill', 'rgba(255,255,255,0.5)');
    txt.textContent = label;
    lG.appendChild(txt);
  });
}

function updateDial() {
  const m       = G.dial;
  const danger  = m <= 10;
  const color   = danger ? '#E74C3C' : '#00E6BC';
  const slice   = $('dial-slice');
  const full    = $('dial-full');
  const valTxt  = $('dial-text-val');

  valTxt.textContent = m;
  valTxt.setAttribute('fill', danger ? '#E74C3C' : '#FFFFAB');
  EL.dial.classList.toggle('danger', danger);

  if (m >= DIAL_START) {
    // Círculo completo
    full.setAttribute('fill', color); full.setAttribute('opacity', '1');
    slice.setAttribute('d', 'M 0 0');
  } else if (m <= 0) {
    full.setAttribute('opacity', '0');
    slice.setAttribute('d', 'M 0 0');
  } else {
    full.setAttribute('opacity', '0');
    slice.setAttribute('fill', color);
    const frac     = m / DIAL_START;
    const angleDeg = frac * 360;
    const end      = dialPolar(angleDeg, DIAL_R);
    const large    = frac > 0.5 ? 1 : 0;
    slice.setAttribute('d',
      `M ${DIAL_CX} ${DIAL_CY} L ${DIAL_CX} ${DIAL_CY - DIAL_R} ` +
      `A ${DIAL_R} ${DIAL_R} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
    );
  }
}

function updateProgress() {
  EL.progress.textContent = G.completadas.length + '/8';
}

// ── Init ────────────────────────────────────────
function startGame() {
  G.orden         = shuffle([0,1,2,3,4,5,6,7]);
  G.turno         = 0;
  G.fallos        = 0;
  G.dial          = DIAL_START;
  G.completadas   = [];
  G.intentosTurno = 0;
  G.bloqueado     = false;
  G.lluvia        = false;
  G.rotAcierto    = 0;
  G.tutorialDone  = !!localStorage.getItem(KEY_TUTORIAL);
  G.tutorialPaso  = G.tutorialDone ? 2 : 0;

  stopRain();
  EL.notif.classList.remove('visible');
  buildDialTicks();
  updateDial();
  updateProgress();
  buildGrid();
  showScreen('play');

  if (!G.tutorialDone) {
    tutorialStep1();
  } else {
    nextTurn();
  }
}

// ── Grid ────────────────────────────────────────
function buildGrid() {
  EL.grid.innerHTML = '';
  PIEZAS.forEach((p, idx) => {
    const cell = document.createElement('div');
    cell.className = 'pieza';
    cell.dataset.idx = idx;

    const img = document.createElement('img');
    img.src = p.img; img.alt = p.nombre;

    const name = document.createElement('div');
    name.className = 'pieza-name';
    name.textContent = p.nombre;

    cell.append(img, name);

    cell.addEventListener('touchstart', e => { e.preventDefault(); tap(idx); }, { passive: false });
    cell.addEventListener('mousedown',  ()  => tap(idx));

    EL.grid.appendChild(cell);
  });
}

function cell(idx) { return EL.grid.querySelector(`.pieza[data-idx="${idx}"]`); }

// ── Tutorial ────────────────────────────────────
function tutorialStep1() {
  G.bloqueado = true;
  setJC('happy');
  typewrite(
    'Mira, es sencillo: yo te digo qué necesito y tú tocas la pieza correcta en la bandeja de abajo. Hay 8 piezas — todas tienen nombre. Léelas antes de elegir.',
    () => setTimeout(() => {
      G.tutorialPaso = 1;
      G.bloqueado = false;
      nextTurn();
    }, 1800)
  );
}

function tutorialStep2(cb) {
  G.bloqueado = true;
  setJC('happy');
  typewrite(
    'Bien. Ahora fíjate en el ticket de aparcamiento — arriba a la izquierda. Si te equivocas pierdo 5 minutos. Si llega a cero, arranco con lo que haya.',
    () => setTimeout(() => {
      G.tutorialPaso = 2;
      localStorage.setItem(KEY_TUTORIAL, '1');
      G.bloqueado = false;
      cb && cb();
    }, 1600)
  );
}

// ── Turno ───────────────────────────────────────
function nextTurn() {
  if (G.turno >= 8) { victoria(); return; }
  G.intentosTurno = 0;
  G.bloqueado = false;

  // Resetear todas las celdas: quitar done, errada, checks
  EL.grid.querySelectorAll('.pieza').forEach(c => {
    c.classList.remove('done', 'errada', 'shaking');
    c.style.transform = '';
    const chk = c.querySelector('.pieza-check');
    if (chk) chk.remove();
    // Reactivar pointer events
    c.style.pointerEvents = '';
  });

  const idx  = G.orden[G.turno];
  const p    = PIEZAS[idx];
  const d    = p.desc[Math.floor(Math.random() * 3)];

  setJC('happy');
  typewrite(d);
}

// ── Tap ─────────────────────────────────────────
function tap(idx) {
  if (G.bloqueado) return;
  const c = cell(idx);
  if (!c || c.classList.contains('done')) return;

  const correct = G.orden[G.turno];

  if (idx === correct) {
    onCorrect(idx, c);
  } else {
    onWrong(idx, c, PIEZAS[idx], PIEZAS[correct]);
  }
}

// ── Correcto ────────────────────────────────────
function onCorrect(idx, c) {
  G.bloqueado = true;
  setJC('celebrating');

  // ASMR correcto — glow + partículas
  c.classList.add('asmr-correct');
  setTimeout(() => c.classList.remove('asmr-correct'), 580);
  const { x, y } = cellCenter(c);
  asmrBurst(x, y, true);

  G.completadas.push({ id: PIEZAS[idx].id, intentos: G.intentosTurno + 1 });
  G.turno++;
  updateProgress();

  // Transición recompensa
  const msg = MSG_ACIERTO[G.rotAcierto % MSG_ACIERTO.length];
  G.rotAcierto++;
  showReward(c, PIEZAS[idx], msg, () => {
    G.bloqueado = false;
    if (G.turno === 1 && G.tutorialPaso === 1) {
      tutorialStep2(() => nextTurn());
    } else {
      nextTurn();
    }
  });
}

function showReward(cellEl, pieza, msg, cb) {
  const rOvr  = $('overlay-reward');
  const rImg  = $('reward-img');
  const rMsg  = $('reward-msg');

  // Posición de origen: centro de la celda
  const rc = cellEl.getBoundingClientRect();
  const originX = ((rc.left + rc.width  / 2) / window.innerWidth  * 100).toFixed(1) + '%';
  const originY = ((rc.top  + rc.height / 2) / window.innerHeight * 100).toFixed(1) + '%';

  rImg.src = pieza.img;
  rImg.style.transformOrigin = originX + ' ' + originY;
  rMsg.textContent = msg;

  // Reset state
  rOvr.style.opacity = '0';
  rImg.classList.remove('show');
  rMsg.classList.remove('show');
  rOvr.classList.add('active');

  // Fade in overlay, then trigger img + text
  requestAnimationFrame(() => requestAnimationFrame(() => {
    rOvr.style.opacity = '1';
    rImg.classList.add('show');
    rMsg.classList.add('show');
  }));

  // Dismiss: fade out everything, then hide
  setTimeout(() => {
    rOvr.style.opacity = '0';
    rImg.classList.remove('show');
    rMsg.classList.remove('show');
    setTimeout(() => {
      rOvr.classList.remove('active');
      cb && cb();
    }, 300);
  }, 900);
}

// ── Incorrecto ──────────────────────────────────
function onWrong(idx, c, wrongP, correctP) {
  G.bloqueado = true;
  G.intentosTurno++;
  G.fallos++;

  // ASMR incorrecto — shockwave + partículas
  shockwave(c);
  const { x: wx, y: wy } = cellCenter(c);
  asmrBurst(wx, wy, false);

  // Shake
  c.classList.add('shaking');
  setTimeout(() => c.classList.remove('shaking'), 400);
  c.classList.add('errada');

  // Dial
  G.dial = Math.max(0, G.dial - DIAL_STEP);
  updateDial();
  flashDial();

  // Overlay
  setTimeout(() => {
    EL.oMandaste.textContent = wrongP.mandaste;
    EL.oPista.textContent    = correctP.pista;
    setJC('worried');
    EL.overlayEdu.classList.add('active');
  }, 420);
}

function flashDial() {
  const slice  = $('dial-slice');
  const full   = $('dial-full');
  const valTxt = $('dial-text-val');
  slice.setAttribute('fill', '#E74C3C');
  full.setAttribute('fill',  '#E74C3C');
  valTxt.setAttribute('fill', '#E74C3C');
  setTimeout(() => { updateDial(); }, 820);
}

// ── Entendido ───────────────────────────────────
EL.btnEnt.addEventListener('click', () => {
  EL.overlayEdu.classList.remove('active');
  situacion(G.fallos, () => {
    if (G.dial <= 0) { gameOver(); return; }
    // Resetear estado visual de todas las celdas para el nuevo intento
    EL.grid.querySelectorAll('.pieza').forEach(c => {
      c.classList.remove('errada', 'shaking');
      c.style.pointerEvents = '';
    });
    G.bloqueado = false;
  });
});

// ── Situaciones cómicas ─────────────────────────
function situacion(n, cb) {
  if      (n <= 2) situacionClaxon(n, cb);
  else if (n <= 4) situacionLluvia(n, cb);
  else if (n <= 6) situacionLlamada(n, cb);
  else cb && cb();
}

function situacionClaxon(n, cb) {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position:'absolute', top:'12px', left:'50%', transform:'translateX(-50%)',
    zIndex:'25', color:'var(--lemon)', fontFamily:"'Baloo 2', sans-serif",
    fontSize:'15px', fontWeight:'800', whiteSpace:'nowrap',
    opacity:'0', transition:'opacity .3s', pointerEvents:'none',
  });
  el.textContent = '— Piiiii —';
  $('videocall').appendChild(el);
  setJC('worried');
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => { el.remove(); cb && cb(); }, 320);
  }, 1300);
}

function situacionLluvia(n, cb) {
  if (!G.lluvia) { G.lluvia = true; startRain(); }
  setJC('worried');
  setTimeout(() => { cb && cb(); }, 1800);
}

function situacionLlamada(n, cb) {
  EL.notif.classList.add('visible');
  EL.jcImg.style.opacity = '0';
  setTimeout(() => {
    EL.jcImg.style.opacity = '1';
    EL.notif.classList.remove('visible');
    if (n >= 6) {
      typewrite('...dice que también gotea debajo del fregadero. Ya lo vemos cuando lleguemos.');
    }
    setTimeout(() => { cb && cb(); }, n >= 6 ? 2200 : 400);
  }, 1700);
}

// ── Lluvia ──────────────────────────────────────
let rainDrops = [];

function startRain() {
  const cv = EL.rain;
  const ctx = cv.getContext('2d');
  cv.classList.add('active');

  function resize() {
    cv.width  = cv.offsetWidth;
    cv.height = cv.offsetHeight;
  }
  resize();

  rainDrops = Array.from({ length: 18 }, () => ({
    x: Math.random() * cv.width,
    y: Math.random() * cv.height,
    s: 2.5 + Math.random() * 3,
    l: 9 + Math.random() * 10,
  }));

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(160,210,255,.55)';
    ctx.lineWidth = 1.4;
    rainDrops.forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1.5, d.y + d.l);
      ctx.stroke();
      d.y += d.s;
      if (d.y > cv.height) { d.y = -d.l; d.x = Math.random() * cv.width; }
    });
    G.rainId = requestAnimationFrame(draw);
  }
  draw();
}

function stopRain() {
  if (G.rainId) { cancelAnimationFrame(G.rainId); G.rainId = null; }
  rainDrops = [];
  const ctx = EL.rain.getContext('2d');
  ctx.clearRect(0, 0, EL.rain.width, EL.rain.height);
  EL.rain.classList.remove('active');
  G.lluvia = false;
}

// ── ASMR — canvas partículas ────────────────────
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
  const color  = isCorrect ? ['#04FFB4', '#00E6BC', '#FFFFAB'] : ['#E74C3C', '#FF7675', '#FFFFAB'];
  const count  = isCorrect ? 22 : 14;
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
    p.vy += .12;   // gravedad leve
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

function cellCenter(cellEl) {
  const r = cellEl.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Shockwave ring para error
function shockwave(cellEl) {
  const r  = cellEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'pieza-shock';
  Object.assign(el.style, {
    left:   r.left + 'px',
    top:    r.top  + 'px',
    width:  r.width  + 'px',
    height: r.height + 'px',
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('run'));
  setTimeout(() => el.remove(), 460);
}

// ── Animación vuelo ─────────────────────────────
function flyPieza(cellEl) {
  const img  = cellEl.querySelector('img');
  const src  = img.src;
  const rCell = cellEl.getBoundingClientRect();
  const rVC   = $('videocall').getBoundingClientRect();

  const clone = document.createElement('img');
  clone.className = 'pieza-clone';
  clone.src = src;

  const sx = rCell.left + rCell.width  / 2 - 29;
  const sy = rCell.top  + rCell.height / 2 - 29;
  clone.style.left = sx + 'px';
  clone.style.top  = sy + 'px';
  document.body.appendChild(clone);

  const tx = rVC.left + 24;
  const ty = rVC.top  + 24;

  requestAnimationFrame(() => {
    clone.style.transition = 'left .38s cubic-bezier(.4,0,.2,1), top .38s cubic-bezier(.4,0,.2,1), transform .38s, opacity .38s';
    clone.style.left      = tx + 'px';
    clone.style.top       = ty + 'px';
    clone.style.transform = 'scale(1.4)';
    clone.style.opacity   = '0';
  });

  setTimeout(() => clone.remove(), 520);
}

// ── Victoria ────────────────────────────────────
function victoria() {
  stopRain();

  try { ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); }
  catch(e) {}

  const prev     = parseInt(localStorage.getItem(KEY_RECORD) ?? '999');
  const isRecord = G.fallos < prev;
  if (isRecord) localStorage.setItem(KEY_RECORD, G.fallos);

  let avatar = 'celebrating', msg = '';
  if (G.fallos === 0) {
    msg = 'Cero fallos. Eso es conocer el muestrario. Cuando llegues a obra, ya sabes lo que llevas.';
  } else if (G.fallos <= 3) {
    msg = 'Bien hecho. Repasa las que fallaste — en obra no hay segunda oportunidad de buscar la pieza.';
  } else {
    avatar = 'happy';
    msg = 'Vas aprendiendo. Pero necesitas conocer esas 8 piezas sin dudar. Vuelta a intentarlo.';
  }

  showResults({ win: true, avatar, msg, isRecord, prev });
}

// ── Game over ────────────────────────────────────
function gameOver() {
  stopRain();
  setJC('worried');
  typewrite('Se me acaba el tiempo. Me voy con lo que hay.');
  setTimeout(() => {
    showResults({
      win: false, avatar: 'worried',
      msg: 'Sin las piezas correctas no se puede trabajar. Estudia el muestrario y vuelve a intentarlo.',
      isRecord: false,
      prev: parseInt(localStorage.getItem(KEY_RECORD) ?? '999'),
    });
  }, 1600);
}

// ── Resultados ───────────────────────────────────
function showResults({ win, avatar, msg, isRecord, prev }) {
  EL.rAvatar.src = AVATAR[avatar];

  if (win) {
    EL.rEstado.textContent = '¡Todo cargado!';
    EL.rEstado.className   = 'results-estado win';
    EL.rFallos.textContent = G.fallos === 0 ? 'Sin fallos' : G.fallos + (G.fallos === 1 ? ' fallo' : ' fallos');
    EL.rExtra.textContent  = 'Te sobraron ' + G.dial + ' minutos';
  } else {
    EL.rEstado.textContent = 'Se fue sin todo';
    EL.rEstado.className   = 'results-estado lose';
    EL.rFallos.textContent = G.fallos + (G.fallos === 1 ? ' fallo' : ' fallos');
    EL.rExtra.textContent  = G.completadas.length + '/8 piezas cargadas';
  }

  if (isRecord) {
    EL.rRecord.textContent = 'Nuevo récord';
    EL.rRecord.className   = 'results-record new';
  } else if (prev < 999) {
    EL.rRecord.textContent = 'Récord: ' + prev + (prev === 1 ? ' fallo' : ' fallos');
    EL.rRecord.className   = 'results-record';
  } else {
    EL.rRecord.textContent = '';
  }

  EL.rMsg.textContent = msg;

  EL.rGrid.innerHTML = '';
  PIEZAS.forEach(p => {
    const done = G.completadas.find(c => c.id === p.id);
    const div  = document.createElement('div');
    div.className = 'result-cell';
    let icon = '✗', color = 'var(--rojo)';
    if (done) {
      icon  = done.intentos === 1 ? '✓' : '~';
      color = done.intentos === 1 ? '#27ae60' : 'var(--turq)';
    }
    div.innerHTML = `<span class="result-icon" style="color:${color}">${icon}</span><span>${p.nombre}</span>`;
    EL.rGrid.appendChild(div);
  });

  setTimeout(() => showScreen('results'), 380);
}

// ── Eventos ──────────────────────────────────────
$('btn-start').addEventListener('click',  startGame);
$('btn-retry').addEventListener('click', () => showScreen('intro'));

// Arrancar en intro
showScreen('intro');
