/* ══════════════════════════════════════════
   EL BAR DE MANOLO v2 — game.js
   S5D4-AM · Drenaje de condensados
   Mecánica: drag pieza + handle de inclinación
   ══════════════════════════════════════════ */
'use strict';

// ── Constantes ────────────────────────────────
const STORAGE_KEY    = 'el_bar_de_manolo_record';
const TUTORIAL_KEY   = 'el_bar_de_manolo_tutorial_seen';
const TASK_THRESHOLD = 200;
const PIECE_LEN      = 70;    // longitud de cada pieza recto en px SVG
const CODO_ARM       = 35;    // longitud de cada brazo del codo
const ANGLE_MIN      = 2;     // grados mínimos hacia abajo para ser válido
const ANGLE_CLAMP    = 80;    // máximo drag ±80° (casi vertical)
const SNAP_DRAIN     = 50;    // px para snap al desagüe
const HANDLE_R       = 14;    // radio visual del handle
const HANDLE_HIT     = 28;    // radio touch del handle

// ── Cloudinary ────────────────────────────────
const SANTI = {
  happy:       'https://res.cloudinary.com/kampe/image/upload/game_assets/s4d2/Santi_Happy_zddena.png',
  celebrating: 'https://res.cloudinary.com/kampe/image/upload/game_assets/s4d2/Santi_celebrating_rlkj6g.png',
  worried:     'https://res.cloudinary.com/kampe/image/upload/game_assets/s4d2/Santi_worried_u4bzlk.png',
};
const BG = {
  bar:     'https://res.cloudinary.com/kampe/image/upload/v1774266071/bg_bar_w8ygva.jpg',
  barra:   'https://res.cloudinary.com/kampe/image/upload/v1774266072/bg_barra_rdynzh.jpg',
  cocina:  'https://res.cloudinary.com/kampe/image/upload/v1774266071/bg_cocina_pi5l4b.jpg',
  comedor: 'https://res.cloudinary.com/kampe/image/upload/v1774266071/bg_comedor_d0qnyo.jpg',
};

// ── Errores educativos ─────────────────────────
const ERRORS = {
  no_slope: {
    title:  'Sin pendiente',
    what:   'El agua se quedó parada — hay una pieza casi horizontal.',
    why:    'Sin inclinación el agua no tiene impulso para avanzar.',
    rule:   'La gravedad manda: cada pieza debe bajar hacia la salida.',
    action: 'Arrastra el handle azul hacia abajo para inclinar la pieza.',
    msg:    'El agua se quedó parada. Esa pieza está demasiado plana.',
  },
  reverse: {
    title:  'Pendiente al revés',
    what:   'El agua volvió atrás — hay una pieza que sube.',
    why:    'El agua no puede vencer la gravedad.',
    rule:   'Todo el recorrido debe descender hacia la salida.',
    action: 'Arrastra el handle azul hacia abajo hasta que la flecha baje.',
    msg:    'El agua volvió para atrás. Esa pieza sube — la gravedad no perdona.',
  },
};

// ── Mensajes Santi ─────────────────────────────
const WIN1 = ['¡A la primera! Recorrido limpio, pendiente continua.',
              '¡Correcto! El agua llegó al desagüe sin dudar.',
              '¡Perfecto! Así no te llaman al día siguiente.'];
const WIN2 = 'Al segundo. Ya lo tienes — recuerda esta inclinación.';
const WIN3 = 'Correcto. A base de intentos se aprende.';
const TRANS = [
  { ok:'La barra, lista. Vamos a la cocina.', ko:'La barra lista. Ha costado. A la cocina.' },
  { ok:'La cocina perfecta. El comedor es el más complicado.', ko:'Cocina resuelta. En el comedor hay viga — piénsalo.' },
];

// ── Escenarios ─────────────────────────────────
// origin: punto de salida del condensado (inicio del recorrido)
// drain:  punto del desagüe (destino)
// pieces: piezas disponibles en la bandeja
// bg:     clave de BG
const SCENARIOS = [
  {
    id: 0, label: 'BARRA', bg: 'barra',
    intro: 'La barra. Recorrido corto, bajante cerca. Ponle pendiente y listo.',
    vbW: 280, vbH: 240,
    origin: { x: 60, y: 60 },
    drain:  { x: 230, y: 190 },
    pieces: ['recto','codo','recto'],
  },
  {
    id: 1, label: 'COCINA', bg: 'cocina',
    intro: 'La cocina. Hay que rodear la encimera. Piensa el recorrido antes.',
    vbW: 280, vbH: 280,
    origin: { x: 50, y: 55 },
    drain:  { x: 240, y: 230 },
    pieces: ['recto','codo','recto','codo','recto'],
  },
  {
    id: 2, label: 'COMEDOR', bg: 'comedor',
    intro: 'El comedor. Hay una viga por medio. Dos cambios de dirección. Planifícalo antes.',
    vbW: 280, vbH: 300,
    origin: { x: 50, y: 55 },
    drain:  { x: 235, y: 255 },
    pieces: ['recto','codo','recto','codo','recto'],
  },
];

// ── Estado ─────────────────────────────────────
let S = {
  scIdx:    0,
  score:    0,
  attempts: 0,
  allFirst: true,
  pieces:   [],   // piezas colocadas: [{type, x0,y0, x1,y1, angle, dir?}]
  winRot:   0,
  inputOff: false,
  // drag handle
  draggingHandle: false,
  handlePieceIdx: -1,
  // drag pieza desde bandeja
  draggingPiece: null,   // { el, type, ghost }
  // codo pending
  pendingCodo: null,     // callback tras elegir dirección
};

// ── DOM ────────────────────────────────────────
const $ = id => document.getElementById(id);
const elIntro  = $('intro');
const elPlay   = $('play');
const elRes    = $('results');
const elTut    = $('tutorial-modal');
const elErr    = $('error-overlay');
const elCodo   = $('codo-picker');
const elTrans  = $('transition-overlay');
const elSvg    = $('build-svg');
const elTray   = $('tray');
const elBtnT   = $('btn-test');
const elBtnC   = $('btn-clear');
const elChar   = $('char-wrap');
const elImg    = $('char-img');
const elBubble = $('bubble');
const elFx     = $('fx-canvas');
const fxCtx    = elFx.getContext('2d');

// ── Helpers pantalla ────────────────────────────
function showScreen(name) {
  [$('intro'), $('play'), $('results')].forEach(e => e.classList.add('hidden'));
  ({ intro:elIntro, play:elPlay, results:elRes })[name].classList.remove('hidden');
  document.documentElement.classList.toggle('results', name === 'results');
}

// ── Santi ──────────────────────────────────────
function setSanti(state, msg) {
  const url = SANTI[state] || SANTI.happy;
  elImg.src = url;
  $('intro-avatar').src = url;
  $('res-avatar').src   = url;
  if (msg) {
    elBubble.textContent = msg;
    elBubble.classList.remove('hidden');
    elChar.classList.add('active');
  } else {
    elBubble.classList.add('hidden');
    elChar.classList.remove('active');
  }
}

// ── Listeners ──────────────────────────────────
$('btn-start').addEventListener('click', () => {
  if (!localStorage.getItem(TUTORIAL_KEY)) { elTut.classList.remove('hidden'); }
  else startScenario(0);
});
$('btn-tutorial-ok').addEventListener('click', () => {
  localStorage.setItem(TUTORIAL_KEY,'1');
  elTut.classList.add('hidden');
  startScenario(0);
});
$('btn-error-ok').addEventListener('click', () => {
  elErr.classList.add('hidden');
  S.inputOff = false;
  elBtnT.disabled = !pathReachesDrain();
  setSanti('happy','Venga, ajusta la inclinación y vuelve a probar.');
});
$('btn-next').addEventListener('click', () => {
  elTrans.classList.add('hidden');
  const next = S.scIdx + 1;
  if (next < SCENARIOS.length) startScenario(next);
  else showResults();
});
$('btn-retry').addEventListener('click', () => {
  S = { scIdx:0, score:0, attempts:0, allFirst:true, pieces:[], winRot:0, inputOff:false,
        draggingHandle:false, handlePieceIdx:-1, draggingPiece:null, pendingCodo:null };
  showScreen('intro');
  setSanti('happy', null);
});
elBtnT.addEventListener('click', () => { if (!S.inputOff) runTest(); });
elBtnC.addEventListener('click', () => { if (!S.inputOff) clearAll(); });

// Codo direction picker
document.querySelectorAll('.codo-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    elCodo.classList.add('hidden');
    if (S.pendingCodo) { S.pendingCodo(dir); S.pendingCodo = null; }
  });
});

// ── Start scenario ──────────────────────────────
function startScenario(idx) {
  S.scIdx    = idx;
  S.attempts = 0;
  S.pieces   = [];
  S.inputOff = false;
  const sc   = SCENARIOS[idx];

  showScreen('play');
  $('play-bg').style.backgroundImage = `url('${BG[sc.bg]}')`;
  $('hud-label').textContent = `${idx+1}/3`;
  updateHud(idx);
  $('scene-title').textContent = `${sc.label} — Monta el drenaje`;
  elBtnT.disabled = true;

  buildTray(sc);
  renderAll();
  setSanti('happy', sc.intro);
}

function updateHud(cur) {
  for (let i=0;i<3;i++) {
    const d = $(`hdot-${i}`);
    d.className = 'hdot' + (i<cur?' done':i===cur?' cur':'');
  }
}

// ── Tray ───────────────────────────────────────
function buildTray(sc) {
  elTray.innerHTML = '';
  sc.pieces.forEach(type => {
    const div = document.createElement('div');
    div.className = 'piece';
    div.dataset.type = type;
    div.innerHTML = `${pieceSvgIcon(type)}<span>${pieceLabel(type)}</span>`;
    setupPieceDrag(div);
    elTray.appendChild(div);
  });
}

function pieceSvgIcon(type) {
  if (type === 'recto')
    return `<svg viewBox="0 0 40 16"><line x1="0" y1="8" x2="40" y2="8" stroke="#00E6BC" stroke-width="5" stroke-linecap="round"/></svg>`;
  if (type === 'codo')
    return `<svg viewBox="0 0 36 36"><polyline points="4,4 4,32 32,32" stroke="#00E6BC" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return '';
}
function pieceLabel(t) {
  return { recto:'Recto', codo:'Codo' }[t] || t;
}

// ── Drag pieza desde tray ───────────────────────
function setupPieceDrag(el) {
  const start = (e) => {
    if (S.inputOff) return;
    e.preventDefault();
    const type = el.dataset.type;
    const touch = e.touches ? e.touches[0] : e;

    // Ghost visual
    const ghost = el.cloneNode(true);
    ghost.style.cssText = `position:fixed;z-index:500;pointer-events:none;
      transform:scale(1.1);box-shadow:0 8px 24px rgba(0,0,0,.4);
      width:64px;height:64px;border-radius:12px;
      background:rgba(11,33,74,.95);border:1.5px solid #00E6BC;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;`;
    ghost.innerHTML = el.innerHTML;
    document.body.appendChild(ghost);

    S.draggingPiece = { el, type, ghost,
      startX: touch.clientX, startY: touch.clientY, moved: false };

    posGhost(ghost, touch.clientX, touch.clientY);

    const move = e2 => {
      const t2 = e2.touches ? e2.touches[0] : e2;
      posGhost(ghost, t2.clientX, t2.clientY);
      S.draggingPiece.moved = true;
    };
    const end = e2 => {
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchend',  end);
      document.removeEventListener('mouseup',   end);
      ghost.remove();
      if (!S.draggingPiece) return;
      const t2 = e2.changedTouches ? e2.changedTouches[0] : e2;
      dropPiece(type, t2.clientX, t2.clientY, el);
      S.draggingPiece = null;
    };
    document.addEventListener('touchmove', move, { passive:false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchend',  end);
    document.addEventListener('mouseup',   end);
  };
  el.addEventListener('touchstart', start, { passive:false });
  el.addEventListener('mousedown',  start);
}

function posGhost(ghost, cx, cy) {
  ghost.style.left = `${cx - 32}px`;
  ghost.style.top  = `${cy - 32}px`;
}

// ── Drop pieza en zona ──────────────────────────
function dropPiece(type, clientX, clientY, trayEl) {
  // ¿El drop está dentro de la zona de construcción?
  const zoneRect = $('build-zone').getBoundingClientRect();
  if (clientX < zoneRect.left || clientX > zoneRect.right ||
      clientY < zoneRect.top  || clientY > zoneRect.bottom) return;

  // Si ya hay piezas, la nueva parte del extremo libre de la última
  const sc = SCENARIOS[S.scIdx];
  const startPt = freeEnd();

  if (type === 'codo') {
    // Mostrar picker de dirección
    elCodo.classList.remove('hidden');
    S.pendingCodo = (dir) => {
      placeCodo(startPt, dir, trayEl);
    };
  } else {
    // El ángulo inicial apunta desde el origen hacia donde soltó el dedo
    const dropPt = clientToSvg(clientX, clientY);
    let rawAngle = Math.atan2(dropPt.y - startPt.y, dropPt.x - startPt.x) * 180 / Math.PI;
    rawAngle = Math.max(-ANGLE_CLAMP, Math.min(ANGLE_CLAMP, rawAngle));
    const end = endPoint(startPt, rawAngle);
    S.pieces.push({ type, x0:startPt.x, y0:startPt.y,
                    x1:end.x, y1:end.y, angle:rawAngle });
    trayEl.classList.add('used');
    renderAll();
    checkDrainSnap();
  }
}

function placeCodo(startPt, dir, trayEl) {
  // Codo: L con dos brazos de CODO_ARM cada uno
  // mx,my = punto de giro (esquina de la L)
  // x1,y1 = extremo final
  const A = CODO_ARM;
  let mx, my, x1, y1;
  if (dir === 'rb') { mx = startPt.x + A; my = startPt.y;     x1 = startPt.x + A; y1 = startPt.y + A; }
  if (dir === 'lb') { mx = startPt.x - A; my = startPt.y;     x1 = startPt.x - A; y1 = startPt.y + A; }
  if (dir === 'ru') { mx = startPt.x + A; my = startPt.y;     x1 = startPt.x + A; y1 = startPt.y - A; }
  if (dir === 'lu') { mx = startPt.x - A; my = startPt.y;     x1 = startPt.x - A; y1 = startPt.y - A; }
  S.pieces.push({ type:'codo', x0:startPt.x, y0:startPt.y,
                  mx, my, x1, y1, dir });
  trayEl.classList.add('used');
  renderAll();
  checkDrainSnap();
}

// ── Punto libre (extremo de la última pieza) ────
function freeEnd() {
  if (S.pieces.length === 0) {
    const sc = SCENARIOS[S.scIdx];
    return { x: sc.origin.x, y: sc.origin.y };
  }
  const last = S.pieces[S.pieces.length - 1];
  return { x: last.x1, y: last.y1 };
}

function endPoint(from, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return {
    x: from.x + PIECE_LEN * Math.cos(rad),
    y: from.y + PIECE_LEN * Math.sin(rad),
  };
}

// ── Check snap a desagüe ────────────────────────
function checkDrainSnap() {
  const sc   = SCENARIOS[S.scIdx];
  const fe   = freeEnd();
  const dist = Math.sqrt((fe.x-sc.drain.x)**2+(fe.y-sc.drain.y)**2);
  elBtnT.disabled = dist > SNAP_DRAIN;
}

function pathReachesDrain() {
  const sc   = SCENARIOS[S.scIdx];
  const fe   = freeEnd();
  const dist = Math.sqrt((fe.x-sc.drain.x)**2+(fe.y-sc.drain.y)**2);
  return dist <= SNAP_DRAIN;
}

// ── Clear ───────────────────────────────────────
function clearAll() {
  S.pieces = [];
  // Restaurar piezas en bandeja
  elTray.querySelectorAll('.piece').forEach(el => el.classList.remove('used'));
  elBtnT.disabled = true;
  setSanti('happy', null);
  renderAll();
}

// ── Render ──────────────────────────────────────
function renderAll() {
  const sc = SCENARIOS[S.scIdx];
  elSvg.setAttribute('viewBox', `0 0 ${sc.vbW} ${sc.vbH}`);
  elSvg.innerHTML = '';

  drawBackground(sc);
  drawPieces();
  drawHandle();
}

// ── Background SVG ──────────────────────────────
function drawBackground(sc) {
  const W = sc.vbW, H = sc.vbH;

  // Pared
  svgR(0,0,W,H,'#0e2244');
  // Grid
  for(let x=20;x<W;x+=20) svgL(x,0,x,H,'rgba(255,255,255,0.03)',1);
  for(let y=20;y<H;y+=20) svgL(0,y,W,y,'rgba(255,255,255,0.03)',1);
  // Paredes laterales
  svgR(0,0,16,H,'#162e55');
  svgR(W-16,0,16,H,'#162e55');

  // Escenario 3: viga
  if (sc.id === 2) {
    svgR(60,0,110,20,'#1e3a6a');
    for(let x=65;x<165;x+=12) svgL(x,0,x,20,'rgba(255,255,255,0.07)',1);
    svgT('VIGA', 115, 14, 9, '#5a80b0');
  }

  // UE interior
  drawUE(sc.origin.x - 52, sc.origin.y - 14);

  // Bajante
  drawBajante(W-14, H);

  // Desagüe
  drawDrain(sc.drain.x, sc.drain.y);

  // Punto de inicio (origen)
  svgC(sc.origin.x, sc.origin.y, 6, '#00E6BC');
  svgT('INICIO', sc.origin.x, sc.origin.y - 10, 8, '#00E6BC');
}

function drawUE(x, y) {
  svgR(x, y, 52, 28, '#1e4070', 4, '#3a6090', 1.5);
  for(let i=0;i<4;i++) svgR(x+6+i*11, y+6, 7, 16, '#0e2244', 2);
  svgT('UE', x+26, y+38, 8, '#00E6BC');
}

function drawBajante(x, h) {
  svgR(x, 0, 14, h, '#1a3c70', 0, '#264870', 1);
  for(let y=30;y<h-20;y+=50) {
    const pts = `${x+7},${y+12} ${x+3},${y+2} ${x+11},${y+2}`;
    const el = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    el.setAttribute('points', pts);
    el.setAttribute('fill','rgba(90,150,220,0.25)');
    elSvg.appendChild(el);
  }
  svgT('BAJANTE', x+7, 50, 8, '#5a80b0', -90, x+7, 50);
}

function drawDrain(x, y) {
  svgR(x-14, y-5, 14, 10, '#1e4070', 3, '#3a6090', 1.5);
  svgC(x-14, y, 5, '#FFFFAB', '#fff', 1);
  svgT('DESAGÜE', x-8, y+18, 8, '#FFFFAB');
}

// ── Dibujar piezas colocadas ────────────────────
function drawPieces() {
  S.pieces.forEach((p, idx) => {
    if (p.type === 'codo') drawCodo(p, idx);
    else drawRecto(p, idx);
  });
}

function drawRecto(p, idx) {
  const line = svgEl('line', {
    x1:p.x0, y1:p.y0, x2:p.x1, y2:p.y1,
    stroke:'#00E6BC', 'stroke-width':6, 'stroke-linecap':'round',
  });
  line.dataset.pidx = idx;
  // Tap para eliminar
  const hit = svgEl('line', {
    x1:p.x0, y1:p.y0, x2:p.x1, y2:p.y1,
    stroke:'transparent', 'stroke-width':20,
  });
  hit.dataset.pidx = idx;
  hit.style.cursor = 'pointer';
  hit.addEventListener('click', () => removePiecesFrom(idx));
  hit.addEventListener('touchend', e => { e.preventDefault(); removePiecesFrom(idx); });
}


function drawCodo(p, idx) {
  // Codo = L con esquina redondeada
  const path = `M${p.x0},${p.y0} L${p.mx},${p.my} L${p.x1},${p.y1}`;
  const el = svgEl('path', {
    d: path, fill:'none',
    stroke:'#00E6BC', 'stroke-width':6, 'stroke-linecap':'round', 'stroke-linejoin':'round',
  });
  el.dataset.pidx = idx;
  const hit = svgEl('path', { d:path, fill:'none', stroke:'transparent', 'stroke-width':20 });
  hit.style.cursor = 'pointer';
  hit.addEventListener('click', () => removePiecesFrom(idx));
  hit.addEventListener('touchend', e => { e.preventDefault(); removePiecesFrom(idx); });
}

// ── Handle de inclinación ───────────────────────
function drawHandle() {
  if (S.pieces.length === 0) return;
  const last = S.pieces[S.pieces.length-1];
  if (last.type === 'codo') return;

  const hx = last.x1, hy = last.y1;

  const guide = svgEl('line', {
    x1:hx, y1:hy-30, x2:hx, y2:hy+30,
    stroke:'rgba(0,230,188,0.2)', 'stroke-width':1, 'stroke-dasharray':'3 3',
  });
  guide.classList.add('handle-el');
  guide.dataset.htype = 'guide';

  const outer = svgEl('circle', {
    cx:hx, cy:hy, r:HANDLE_R+4,
    fill:'rgba(0,230,188,0.15)', stroke:'rgba(0,230,188,0.4)', 'stroke-width':1,
  });
  outer.classList.add('handle-el');

  const inner = svgEl('circle', {
    cx:hx, cy:hy, r:HANDLE_R,
    fill:'#00E6BC', stroke:'#fff', 'stroke-width':2,
  });
  inner.classList.add('handle-el', 'handle-dot');

  const arrowAngle = last.angle * Math.PI/180;
  const arrow = svgEl('line', {
    x1:hx, y1:hy,
    x2:hx + Math.cos(arrowAngle)*22,
    y2:hy + Math.sin(arrowAngle)*22,
    stroke:'rgba(255,255,255,0.5)', 'stroke-width':2, 'stroke-linecap':'round',
  });
  arrow.classList.add('handle-el');
  arrow.dataset.htype = 'arrow';

  const target = svgEl('circle', {
    cx:hx, cy:hy, r:HANDLE_HIT, fill:'transparent',
  });
  target.classList.add('handle-el');
  target.style.cursor = 'grab';

  setupHandleDrag(target, S.pieces.length-1);
}

// ── Actualizar SVG sin recrear (para drag fluido) ─
function updatePieceSvg(idx) {
  const p = S.pieces[idx];
  // línea visible del recto (stroke no transparente)
  const lines = elSvg.querySelectorAll(`[data-pidx="${idx}"]`);
  lines.forEach(el => {
    if (el.tagName === 'line') {
      el.setAttribute('x2', p.x1);
      el.setAttribute('y2', p.y1);
    }
  });
}

function updateHandleSvg() {
  if (S.pieces.length === 0) return;
  const last = S.pieces[S.pieces.length - 1];
  const hx = last.x1, hy = last.y1;
  // Mover todos los elementos del handle (círculos y líneas sin data-pidx)
  elSvg.querySelectorAll('.handle-el').forEach(el => {
    const tag = el.tagName;
    if (tag === 'circle') {
      el.setAttribute('cx', hx);
      el.setAttribute('cy', hy);
    } else if (tag === 'line') {
      const type = el.dataset.htype;
      if (type === 'guide') {
        el.setAttribute('x1', hx); el.setAttribute('y1', hy - 30);
        el.setAttribute('x2', hx); el.setAttribute('y2', hy + 30);
      } else if (type === 'arrow') {
        const rad = last.angle * Math.PI / 180;
        el.setAttribute('x1', hx); el.setAttribute('y1', hy);
        el.setAttribute('x2', hx + Math.cos(rad) * 22);
        el.setAttribute('y2', hy + Math.sin(rad) * 22);
      }
    }
  });
}

// ── Drag handle ─────────────────────────────────
function setupHandleDrag(el, pieceIdx) {
  const onStart = (e) => {
    if (S.inputOff) return;
    e.preventDefault();
    S.draggingHandle  = true;
    S.handlePieceIdx  = pieceIdx;

    const move = (e2) => {
      if (!S.draggingHandle) return;
      e2.preventDefault();
      const t = e2.touches ? e2.touches[0] : e2;

      const pt  = clientToSvg(t.clientX, t.clientY);
      const p   = S.pieces[pieceIdx];
      const raw = Math.atan2(pt.y - p.y0, pt.x - p.x0) * 180/Math.PI;
      const clamped = Math.max(-ANGLE_CLAMP, Math.min(ANGLE_CLAMP, raw));

      const ne = endPoint({ x:p.x0, y:p.y0 }, clamped);
      p.angle = clamped;
      p.x1    = ne.x;
      p.y1    = ne.y;

      // Actualizar solo los elementos SVG afectados sin destruir todo
      updatePieceSvg(pieceIdx);
      updateHandleSvg();
      checkDrainSnap();

      let msg;
      if (clamped < -ANGLE_MIN) msg = 'Sube — el agua no puede salir.';
      else if (clamped < ANGLE_MIN) msg = 'Casi plano — necesitas más pendiente.';
      else msg = `${Math.round(clamped)}° — bajando bien.`;
      setSanti(clamped >= ANGLE_MIN ? 'happy' : 'worried', msg);
    };

    const end = () => {
      S.draggingHandle = false;
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchend',  end);
      document.removeEventListener('mouseup',   end);
      renderAll(); // render completo solo al soltar
    };

    document.addEventListener('touchmove', move, { passive:false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchend',  end);
    document.addEventListener('mouseup',   end);
  };

  el.addEventListener('touchstart', onStart, { passive:false });
  el.addEventListener('mousedown',  onStart);
}


// ── Eliminar piezas desde índice ────────────────
function removePiecesFrom(idx) {
  if (S.inputOff) return;
  // Restaurar piezas en bandeja
  const removed = S.pieces.splice(idx);
  let rCount = { recto:0, codo:0, canaleta:0 };
  removed.forEach(p => rCount[p.type]++);

  // Reactivar en bandeja (las últimas N de cada tipo)
  Object.entries(rCount).forEach(([type, n]) => {
    const els = [...elTray.querySelectorAll(`.piece.used[data-type="${type}"]`)];
    els.slice(-n).forEach(el => el.classList.remove('used'));
  });

  elBtnT.disabled = !pathReachesDrain();
  renderAll();
}

// ── Coordenadas cliente → SVG ────────────────────
function clientToSvg(cx, cy) {
  const rect = elSvg.getBoundingClientRect();
  const vb   = elSvg.viewBox.baseVal;
  return {
    x: (cx - rect.left) / rect.width  * vb.width,
    y: (cy - rect.top)  / rect.height * vb.height,
  };
}

// ── Validar piezas ──────────────────────────────
function validatePieces() {
  for (let i=0; i<S.pieces.length; i++) {
    const p = S.pieces[i];
    if (p.type === 'codo') {
      // El segundo brazo del codo debe bajar (y1 > my)
      if (p.y1 < p.my - 5) return { ok:false, type:'reverse', idx:i };
      continue;
    }
    const dY = p.y1 - p.y0;
    // Pendiente en pixels vs longitud
    const len = Math.sqrt((p.x1-p.x0)**2+(p.y1-p.y0)**2);
    const angleDeg = Math.atan2(dY, p.x1-p.x0) * 180/Math.PI;

    if (angleDeg < -ANGLE_MIN) return { ok:false, type:'reverse',   idx:i };
    if (angleDeg <  ANGLE_MIN) {
      return { ok:false, type:'no_slope', idx:i };
    }
  }
  return { ok:true };
}

// ── Test ────────────────────────────────────────
function runTest() {
  S.inputOff = true;
  elBtnT.disabled = true;
  setSanti('happy', null);

  const result = validatePieces();
  animateWater(result, () => {
    if (result.ok) handleCorrect();
    else handleError(result);
  });
}

// ── Animación de agua ────────────────────────────
function animateWater(result, cb) {
  const sc    = SCENARIOS[S.scIdx];
  const pts   = buildWaterPath(result);
  const total = pathLen(pts);

  const drop = svgEl('circle', { r:7, fill:'#00E6BC', opacity:0.95 });
  const dur   = result.ok ? 1800 : 1400;
  const t0    = performance.now();

  function tick(now) {
    const progress = Math.min((now-t0)/dur, 1);
    const dist     = progress * total;
    const pos      = posAlongPath(pts, dist);
    drop.setAttribute('cx', pos.x);
    drop.setAttribute('cy', pos.y);
    if (progress < 1) requestAnimationFrame(tick);
    else { drop.remove(); cb(); }
  }
  requestAnimationFrame(tick);
}

function buildWaterPath(result) {
  const sc = SCENARIOS[S.scIdx];
  const pts = [{ x:sc.origin.x, y:sc.origin.y }];

  for (let i=0; i<S.pieces.length; i++) {
    const p = S.pieces[i];
    if (!result.ok && i === result.idx) {
      // Para en el punto problemático (80% del tramo)
      pts.push({ x: p.x0 + (p.x1-p.x0)*0.8, y: p.y0 + (p.y1-p.y0)*0.8 });
      break;
    }
    if (p.type === 'codo') {
      pts.push({ x:p.mx, y:p.my }); // punto de giro (esquina de la L)
      pts.push({ x:p.x1, y:p.y1 });
    } else {
      pts.push({ x:p.x1, y:p.y1 });
    }
  }
  if (result.ok) pts.push({ x:sc.drain.x, y:sc.drain.y });
  return pts;
}

function pathLen(pts) {
  let l=0;
  for(let i=0;i<pts.length-1;i++) l+=Math.sqrt((pts[i+1].x-pts[i].x)**2+(pts[i+1].y-pts[i].y)**2);
  return l;
}

function posAlongPath(pts, target) {
  let acc=0;
  for(let i=0;i<pts.length-1;i++) {
    const seg=Math.sqrt((pts[i+1].x-pts[i].x)**2+(pts[i+1].y-pts[i].y)**2);
    if(acc+seg>=target) {
      const t=(target-acc)/seg;
      return { x:pts[i].x+t*(pts[i+1].x-pts[i].x), y:pts[i].y+t*(pts[i+1].y-pts[i].y) };
    }
    acc+=seg;
  }
  return pts[pts.length-1];
}

// ── Correcto ─────────────────────────────────────
function handleCorrect() {
  S.attempts++;
  const pts = [150,75,25];
  S.score += pts[Math.min(S.attempts-1,2)];
  if (S.attempts>1) S.allFirst=false;

  // Pulso en desagüe
  const sc=SCENARIOS[S.scIdx];
  const drainEl=elSvg.querySelector('circle[fill="#FFFFAB"]');
  if(drainEl) drainEl.classList.add('anim-pulse');

  spawnParticles();
  const msg = S.attempts===1 ? WIN1[S.winRot++%WIN1.length] :
              S.attempts===2 ? WIN2 : WIN3;
  setSanti('celebrating', msg);
  setTimeout(() => showTrans(S.scIdx, S.attempts===1), 2000);
}

// ── Error ──────────────────────────────────────
function handleError(result) {
  S.attempts++;
  if(S.attempts>1) S.allFirst=false;

  const err = ERRORS[result.type];
  const p   = S.pieces[result.idx];

  // Parpadeo rojo en la pieza problemática
  const pieceEls = elSvg.querySelectorAll(`[data-pidx="${result.idx}"]`);
  pieceEls.forEach(el => {
    let n=0;
    const iv=setInterval(()=>{
      el.setAttribute('stroke', n%2===0?'#E74C3C':'#00E6BC');
      if(++n>=6) clearInterval(iv);
    },150);
  });

  setSanti('worried', err.msg);

  setTimeout(() => {
    $('error-title').textContent  = err.title;
    $('error-what').textContent   = err.what;
    $('error-why').textContent    = err.why;
    $('error-rule').textContent   = err.rule;
    $('error-action').textContent = err.action;
    elErr.classList.remove('hidden');
    elBtnT.disabled = false;
  }, 1300);
}

// ── Transición ──────────────────────────────────
function showTrans(idx, wasFirst) {
  if (idx===SCENARIOS.length-1) { showResults(); return; }
  const t = TRANS[idx];
  $('trans-msg').textContent = wasFirst ? t.ok : t.ko;
  $('trans-avatar').src = wasFirst ? SANTI.celebrating : SANTI.happy;
  for(let i=0;i<3;i++) {
    const d=$(`pdot-${i}`);
    d.className='pdot'+(i<=idx?' done':'');
  }
  elTrans.classList.remove('hidden');
}

// ── Resultados ───────────────────────────────────
function showResults() {
  if(S.allFirst) S.score+=50;
  const prev=parseInt(localStorage.getItem(STORAGE_KEY)||'0');
  const isNew=S.score>prev;
  if(isNew) localStorage.setItem(STORAGE_KEY,S.score);
  if(S.score>=TASK_THRESHOLD) {
    try { ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'})); }catch(e){}
  }
  let st,msg;
  if(S.score>=400)     { st='celebrating'; msg='Tres escenarios, tres primeros intentos. Criterio de instalador. El drenaje de Manolo va a funcionar diez años.'; }
  else if(S.score>=200){ st='happy';       msg='Superado. Algunos escenarios necesitaron reintentos. Planifica el recorrido antes de colocar la primera pieza.'; }
  else                 { st='worried';     msg='Ha costado. Repasa la regla: la gravedad manda. Cada pieza tiene que bajar hacia la salida.'; }
  $('res-score').textContent  = `${S.score} pts`;
  $('res-record').textContent = isNew ? `¡Nuevo récord! ${S.score} pts` : `Récord: ${prev} pts`;
  $('res-msg').textContent    = msg;
  $('res-avatar').src         = SANTI[st];
  showScreen('results');
}

// ── Partículas ───────────────────────────────────
function spawnParticles() {
  elFx.width=window.innerWidth; elFx.height=window.innerHeight;
  const ps=Array.from({length:35},()=>({
    x:Math.random()*elFx.width, y:Math.random()*elFx.height*.5+elFx.height*.25,
    vx:(Math.random()-.5)*5, vy:(Math.random()-.5)*5-2,
    r:Math.random()*7+3, c:Math.random()>.5?'#00E6BC':'#04FFB4', a:1,
  }));
  const t0=performance.now();
  function draw(now) {
    const p=(now-t0)/600;
    fxCtx.clearRect(0,0,elFx.width,elFx.height);
    ps.forEach(q=>{
      q.x+=q.vx; q.y+=q.vy; q.vy+=.1; q.a=Math.max(0,1-p);
      fxCtx.globalAlpha=q.a;
      fxCtx.beginPath(); fxCtx.arc(q.x,q.y,q.r,0,Math.PI*2);
      fxCtx.fillStyle=q.c; fxCtx.fill();
    });
    if(p<1) requestAnimationFrame(draw);
    else fxCtx.clearRect(0,0,elFx.width,elFx.height);
  }
  requestAnimationFrame(draw);
}

// ── SVG helpers ──────────────────────────────────
function svgEl(tag, attrs) {
  const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  elSvg.appendChild(el);
  return el;
}
function svgR(x,y,w,h,fill,rx=0,stroke,sw) {
  const a={x,y,width:w,height:h,fill,rx};
  if(stroke){a.stroke=stroke;a['stroke-width']=sw;}
  return svgEl('rect',a);
}
function svgL(x1,y1,x2,y2,stroke,sw) {
  return svgEl('line',{x1,y1,x2,y2,stroke,'stroke-width':sw});
}
function svgC(cx,cy,r,fill,stroke,sw) {
  const a={cx,cy,r,fill};
  if(stroke){a.stroke=stroke;a['stroke-width']=sw;}
  return svgEl('circle',a);
}
function svgT(text,x,y,size,fill,rotate,rx,ry) {
  const el=svgEl('text',{x,y,'text-anchor':'middle','font-size':size,fill,
    'font-family':'Baloo 2,sans-serif','font-weight':700});
  if(rotate) el.setAttribute('transform',`rotate(${rotate},${rx||x},${ry||y})`);
  el.textContent=text;
  return el;
}
