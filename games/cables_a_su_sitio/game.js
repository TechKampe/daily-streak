/* === Cables a Su Sitio === */
'use strict';

/* ── assets ── */
const CB = 'https://res.cloudinary.com/kampe/image/upload/';
const FER = {
  happy: `${CB}v1772019465/fer_happy_aotwxw.png`,
  celebrating: `${CB}v1772019464/fer_celebrating_yrrvkj.png`,
  worried: `${CB}v1772019465/fer_worried_g1z3jz.png`
};
const COMP_IMG = {
  iga: `${CB}iga_gc2r1r.png`,
  id:  `${CB}id_h0k5cr.png`,
  pia: `${CB}v1772807187/PIA_umn2cw.png`
};

/* ── colors ── */
const COLORS = {
  azul: '#3498DB',
  'verde-amarillo': '#2ECC40',
  negro: '#333',
  marron: '#8B4513',
  gris: '#999'
};

/* ── cable PNG assets ── */
const CABLE_IMG = {
  azul:            { ok: 'assets/cable_azul_ok.png', peluca: 'assets/cable_azul_peluca.png', tenso: 'assets/cable_azul_tenso.png' },
  'verde-amarillo':{ ok: 'assets/cable_va_ok.png',   peluca: 'assets/cable_va_peluca.png',   tenso: 'assets/cable_va_tenso.png' },
  negro:           { ok: 'assets/cable_gris_ok.png',  peluca: 'assets/cable_gris_peluca.png',  tenso: 'assets/cable_gris_tenso.png' },
  marron:          { ok: 'assets/cable_marron_ok.png',peluca: 'assets/cable_marron_peluca.png',tenso: 'assets/cable_marron_tenso.png' },
  gris:            { ok: 'assets/cable_gris_ok.png',  peluca: 'assets/cable_gris_peluca.png',  tenso: 'assets/cable_gris_tenso.png' }
};

/* ── config ── */
const LIVES_MAX = 3;
const PTS_BASE = 100;
const PTS_BONUS = 50;
const TASK_THRESHOLD = 900;
const RECORD_KEY = 'cables_a_su_sitio_record';
const SNAP_DIST = 90;
const BELT_SPEED = 1.0;

/* ── panel layout ── */
const COMPONENTS = [
  { id: 'iga',    label: 'IGA',    img: 'iga' },
  { id: 'id',     label: 'ID',     img: 'id' },
  { id: 'pia-c1', label: 'PIA C1', img: 'pia' },
  { id: 'pia-c2', label: 'PIA C2', img: 'pia' },
  { id: 'pia-c3', label: 'PIA C3', img: 'pia' }
];
const BARRAS = [
  { id: 'barra-n',  label: 'N',  color: COLORS.azul },
  { id: 'barra-pe', label: 'PE', color: '#2ECC40' }
];

/* ── single cable pool (all cables at once) ── */
const ALL_CABLES = [
  { color: 'azul', etiqueta: 'N',  reserva: 'OK',     destino: 'barra-n',  defecto: null },
  { color: 'verde-amarillo', etiqueta: 'PE', reserva: 'OK',     destino: 'barra-pe', defecto: null },
  { color: 'negro', etiqueta: 'C1', reserva: 'OK',     destino: 'pia-c1',  defecto: null },
  { color: 'marron', etiqueta: 'C2', reserva: 'OK',     destino: 'pia-c2',  defecto: null },
  { color: 'gris', etiqueta: 'C3', reserva: 'OK',     destino: 'pia-c3',  defecto: null },
  { color: 'verde-amarillo', etiqueta: 'PE', reserva: 'Peluca', destino: 'rehacer', defecto: 'peluca' },
  { color: 'marron', etiqueta: 'C2', reserva: 'Tenso',  destino: 'rehacer', defecto: 'tenso' },
  { color: 'azul', etiqueta: 'PE', reserva: 'OK',     destino: 'rehacer', defecto: 'etiqueta' },
  { color: 'negro', etiqueta: 'C1', reserva: 'Peluca', destino: 'rehacer', defecto: 'peluca' },
  { color: 'verde-amarillo', etiqueta: 'PE', reserva: 'OK',     destino: 'barra-pe', defecto: null },
  { color: 'azul', etiqueta: 'N',  reserva: 'OK',     destino: 'barra-n',  defecto: null },
  { color: 'gris', etiqueta: 'C3', reserva: 'OK',     destino: 'pia-c3',  defecto: null }
];

/* ── messages ── */
const MSG = {
  tutorial: 'Venga, tienes todos los cables en la mesa. Arrastra cada uno a su sitio: N a su barra, PE a la suya, circuitos a su PIA. Si ves alguno con peluca, tenso o etiqueta rara, a Rehacer.',
  correct: ['Limpio. Así se hace.','Correcto. Ese cable está donde tiene que estar.','Bien visto. Eso es trabajar con criterio.'],
  defectCaught: ['Bien pillado. Ese cable no sirve, a Rehacer.','Buena inspección. Un cable así no se monta nunca.'],
  errLevePiaWrong: 'Ese cable va a otro PIA. Mira bien la etiqueta.',
  errLeveCircuitToBar: 'Los circuitos van a su PIA, no a las barras. Las barras son solo para N y PE.',
  errLeveNPEtoPIA: 'El Neutro va a la Barra N, no a un PIA. Las barras están arriba.',
  errGoodToRehacer: '¡Ese cable está perfecto! No lo descartes, ponlo en su sitio.',
  gameOver: 'Se acabaron las oportunidades. En una obra real, estos errores causan problemas serios. ¡Venga, otra vez!',
  resultHigh: 'Impecable. El cuadro ha quedado limpio, todo bien etiquetado. El cliente va a flipar.',
  resultMid: 'Bien, pero has dejado algún cable suelto. Repasa la diferencia entre N y PE y revisa siempre las reservas.',
  resultLow: 'Uf, hay que practicar más. Recuerda: primero inspecciona, luego coloca. Neutro y Tierra nunca se mezclan.',
  help: 'Arrastra cada cable a su destino correcto.\n\nAzul (N) → Barra N\nVerde-amarillo (PE) → Barra PE\nCircuitos (C1, C2...) → su PIA\nCable con defecto → Rehacer'
};

const EDU = {
  nToPE: { did: 'Has puesto un cable azul (Neutro) en la Barra de Tierra.', why: 'El Neutro es el retorno del circuito. La Tierra es protección. Si los mezclas, el diferencial puede no saltar.', rule: 'Azul = Neutro → Barra N. Verde-amarillo = Tierra → Barra PE. Nunca se intercambian.', tip: 'Fíjate en el color Y en la etiqueta antes de arrastrar.' },
  peTON: { did: 'Has puesto un cable verde-amarillo (Tierra) en la Barra de Neutro.', why: 'La Tierra solo protege. Si va a la barra N, las protecciones fallan.', rule: 'Verde-amarillo = Tierra → Barra PE. Azul = Neutro → Barra N.', tip: 'El verde-amarillo SIEMPRE va a la Barra PE.' },
  peluca: { did: 'Has colocado un cable con peluca en el cuadro.', why: 'Un cable con peluca crea un nido que dificulta el mantenimiento.', rule: 'La reserva debe ser razonable. Sin cable suelto dentro del cuadro.', tip: 'Si ves bucles/peluca → Rehacer.' },
  tenso: { did: 'Has colocado un cable tenso en el cuadro.', why: 'Un cable tenso puede desconectarse con cualquier vibración.', rule: 'Todo cable necesita reserva. Si está tenso, hay que cortar uno nuevo.', tip: 'Si ves el cable recto y tirante → Rehacer.' },
  etiqueta: { did: 'Has colocado un cable con etiqueta incorrecta.', why: 'Si el color y la etiqueta no coinciden, otros técnicos se confundirán.', rule: 'Etiquetado coherente: azul = N, verde-amarillo = PE.', tip: 'Compara color con etiqueta. Si no cuadran → Rehacer.' }
};

/* ── cable item builder ── */
function getCableImgSrc(cable) {
  const colorSet = CABLE_IMG[cable.color];
  if (!colorSet) return '';
  if (cable.defecto === 'peluca') return colorSet.peluca;
  if (cable.defecto === 'tenso') return colorSet.tenso;
  return colorSet.ok;
}

function makeCableHTML(cable) {
  const src = getCableImgSrc(cable);
  const isWrongLabel = cable.defecto === 'etiqueta';
  const lblClass = isWrongLabel ? 'cable-label wrong' : 'cable-label';
  return `<img class="cable-img" src="${src}" alt="${cable.etiqueta}" draggable="false">
    <span class="${lblClass}">${cable.etiqueta}</span>`;
}

/* ── state ── */
let score = 0, lives = LIVES_MAX;
let cables = [], cableErrors = {};
let dragging = null, dragOffX = 0, dragOffY = 0, dragStartX = 0, dragStartY = 0, isDragging = false;
let correctCount = 0, ferTimer = null;
let beltAnim = null;

/* ── DOM ── */
const $ = id => document.getElementById(id);
const screens = { intro: $('intro'), play: $('play'), results: $('results') };

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
  document.documentElement.classList.toggle('results', id === 'results');
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

/* ── intro ── */
function buildIntro() {
  $('intro-inner').innerHTML = `
    <div class="intro-card">
      <img class="intro-av" src="${FER.happy}" alt="Fer">
      <div class="wa-bub-static">
        <p>Buenas tardes. Te dejo los cables en la mesa. Antes de colocar cada cable, revisa el <strong>estado</strong> y el <strong>etiquetado</strong>.</p>
        <span class="bub-time">16:32 <span class="bub-check">✓✓</span></span>
      </div>
      <div class="intro-slider">
        <div class="intro-slide active" data-idx="0">
          <img class="intro-cable-img" src="assets/cable_azul_ok.png" alt="OK">
          <div class="intro-slide-txt">
            <span class="intro-cable-tag ok">OK</span>
            <p>Reserva correcta, etiqueta legible. Listo para instalar.</p>
          </div>
        </div>
        <div class="intro-slide" data-idx="1">
          <img class="intro-cable-img" src="assets/cable_azul_peluca.png" alt="Peluca">
          <div class="intro-slide-txt">
            <span class="intro-cable-tag bad">PELUCA</span>
            <p>Exceso de cable suelto. Crea un nido → a Rehacer.</p>
          </div>
        </div>
        <div class="intro-slide" data-idx="2">
          <img class="intro-cable-img" src="assets/cable_azul_tenso.png" alt="Tenso">
          <div class="intro-slide-txt">
            <span class="intro-cable-tag bad">TENSO</span>
            <p>Sin reserva, puede desconectarse → a Rehacer.</p>
          </div>
        </div>
      </div>
      <div class="intro-dots">
        <span class="intro-dot active"></span>
        <span class="intro-dot"></span>
        <span class="intro-dot"></span>
      </div>
    </div>
    <button class="cta" id="start-btn">Empezar a cablear</button>
  `;
  $('start-btn').onclick = startGame;

  /* slider auto-rotate */
  const slides = document.querySelectorAll('.intro-slide');
  const dots = document.querySelectorAll('.intro-dot');
  let cur = 0;
  setInterval(() => {
    slides[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
    dots[cur].classList.add('active');
  }, 2500);
}

/* ── HUD ── */
function updateHUD() {
  $('hud-round').textContent = `${correctCount}/${cables.length}`;
  $('hud-score').textContent = '';
  let h = '';
  for (let i = 0; i < LIVES_MAX; i++) h += `<span class="heart${i >= lives ? ' lost' : ''}">♥</span>`;
  $('hud-lives').innerHTML = h;
}

/* ── fer ── */
function showFer(msg, state, dur) {
  clearTimeout(ferTimer);
  $('fer-img').src = FER[state || 'happy'];
  $('fer-msg').textContent = msg;
  $('fer-bubble').classList.remove('hidden');
  if (dur) ferTimer = setTimeout(() => $('fer-bubble').classList.add('hidden'), dur);
}

/* ── build panel ── */
function buildPanel() {
  const br = $('barras-row');
  br.innerHTML = '';
  BARRAS.forEach(b => {
    const slot = document.createElement('div');
    slot.className = 'barra-slot';
    slot.dataset.id = b.id;
    const isVA = b.id === 'barra-pe';
    const bg = isVA ? 'linear-gradient(90deg,#2ECC40 50%,#FFD700 50%)' : b.color;
    slot.innerHTML = `<div class="barra-bar" style="background:${bg}"></div><span class="barra-label">${b.label}</span>`;
    br.appendChild(slot);
  });

  const cr = $('comps-row');
  cr.innerHTML = '';
  COMPONENTS.forEach(c => {
    const slot = document.createElement('div');
    slot.className = 'comp-slot';
    slot.dataset.id = c.id;
    slot.innerHTML = `<img class="comp-asset" src="${COMP_IMG[c.img]}" alt="${c.label}"><span class="comp-label">${c.label}</span>`;
    cr.appendChild(slot);
  });
}

function setActiveSlots() {
  // All slots always active (no rounds)
  document.querySelectorAll('.comp-slot').forEach(el => el.classList.remove('inactive'));
  const rz = $('rehacer-zone');
  rz.style.opacity = '.9';
  rz.dataset.active = '1';
}

/* ── conveyor belt ── */
function buildConveyor() {
  const belt = $('belt-cables');
  belt.innerHTML = '';
  cables = shuffle([...ALL_CABLES]);
  cableErrors = {};
  correctCount = 0;
  const cableW = 60, gap = 24;

  cables.forEach((c, i) => {
    cableErrors[i] = 0;
    const el = document.createElement('div');
    el.className = 'cable-item';
    el.dataset.idx = i;
    el.innerHTML = makeCableHTML(c);
    el.style.left = (belt.offsetWidth + i * (cableW + gap)) + 'px';
    belt.appendChild(el);
  });
  startBelt();
}

function startBelt() {
  if (beltAnim) cancelAnimationFrame(beltAnim);
  const belt = $('belt-cables');
  const items = () => belt.querySelectorAll('.cable-item:not(.ghost)');
  const cableW = 60, gap = 24;

  function tick() {
    const els = items();
    els.forEach(el => {
      if (el.classList.contains('dragging')) return;
      let x = parseFloat(el.style.left) || 0;
      x -= BELT_SPEED;
      if (x < -(cableW + 10)) {
        let maxX = 0;
        els.forEach(other => {
          if (other === el || other.classList.contains('dragging')) return;
          const ox = parseFloat(other.style.left) || 0;
          if (ox > maxX) maxX = ox;
        });
        x = maxX + cableW + gap;
      }
      el.style.left = x + 'px';
    });
    beltAnim = requestAnimationFrame(tick);
  }
  beltAnim = requestAnimationFrame(tick);
}

function stopBelt() {
  if (beltAnim) { cancelAnimationFrame(beltAnim); beltAnim = null; }
}

/* ── drag & drop ── */
function initDrag() {
  document.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousedown', onStart);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchend', onEnd);
  document.addEventListener('mouseup', onEnd);
}

function xy(e) { const t = e.touches ? e.touches[0] : e; return { x: t.clientX, y: t.clientY }; }

function onStart(e) {
  if (dragging) return;
  const item = e.target.closest('.cable-item:not(.ghost)');
  if (!item) return;
  e.preventDefault();
  const p = xy(e), r = item.getBoundingClientRect();
  dragOffX = p.x - r.left; dragOffY = p.y - r.top;
  dragStartX = p.x; dragStartY = p.y;
  isDragging = false;
  dragging = item;
}

function onMove(e) {
  if (!dragging) return;
  e.preventDefault();
  const p = xy(e);
  if (!isDragging) {
    if (Math.hypot(p.x - dragStartX, p.y - dragStartY) < 8) return;
    isDragging = true;
    const ghost = document.createElement('div');
    ghost.className = 'cable-item ghost';
    ghost.style.left = dragging.style.left;
    ghost.innerHTML = dragging.innerHTML;
    ghost.dataset.ghost = '1';
    dragging.parentNode.appendChild(ghost);
    dragging.classList.add('dragging');
  }
  dragging.style.left = (p.x - dragOffX) + 'px';
  dragging.style.top = (p.y - dragOffY) + 'px';
  updateHighlights(p);
}

function distToRect(px, py, r) {
  const cx = Math.max(r.left, Math.min(px, r.right));
  const cy = Math.max(r.top, Math.min(py, r.bottom));
  return Math.hypot(px - cx, py - cy);
}

function updateHighlights(p) {
  document.querySelectorAll('.barra-slot').forEach(el => {
    const d = distToRect(p.x, p.y, el.getBoundingClientRect());
    el.classList.toggle('highlight', d < SNAP_DIST);
  });
  document.querySelectorAll('.comp-slot').forEach(el => {
    if (el.classList.contains('filled')) return;
    const d = distToRect(p.x, p.y, el.getBoundingClientRect());
    el.classList.toggle('highlight', d < SNAP_DIST);
  });
  const rz = $('rehacer-zone');
  const d = distToRect(p.x, p.y, rz.getBoundingClientRect());
  rz.classList.toggle('highlight', d < SNAP_DIST);
}

function clearHL() {
  document.querySelectorAll('.barra-slot').forEach(el => el.classList.remove('highlight'));
  document.querySelectorAll('.comp-slot').forEach(el => el.classList.remove('highlight'));
  $('rehacer-zone').classList.remove('highlight');
}

function onEnd(e) {
  if (!dragging) return;
  const item = dragging;
  dragging = null;
  if (!isDragging) { item.classList.remove('dragging'); return; }

  const p = e.changedTouches ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : { x: e.clientX, y: e.clientY };
  clearHL();

  const target = findTarget(p);
  const ghost = item.parentNode ? item.parentNode.querySelector('[data-ghost="1"]') : null;
  if (!target) { returnItem(item, ghost); return; }

  const idx = parseInt(item.dataset.idx);
  const cable = cables[idx];
  const result = evaluate(cable, target.id);

  if (result === 'correct') onCorrect(item, ghost, cable, target, idx);
  else if (result === 'grave') onGrave(item, ghost, cable, target.id, idx);
  else if (result === 'goodToRehacer') onGoodToRehacer(item, ghost, idx);
  else onLeve(item, ghost, cable, target.id, idx);
}

function findTarget(p) {
  let best = null, bestD = Infinity;
  document.querySelectorAll('.barra-slot').forEach(el => {
    const d = distToRect(p.x, p.y, el.getBoundingClientRect());
    if (d < SNAP_DIST && d < bestD) { bestD = d; best = { id: el.dataset.id, el }; }
  });
  document.querySelectorAll('.comp-slot:not(.filled)').forEach(el => {
    const d = distToRect(p.x, p.y, el.getBoundingClientRect());
    if (d < SNAP_DIST && d < bestD) { bestD = d; best = { id: el.dataset.id, el }; }
  });
  const rz = $('rehacer-zone');
  const d = distToRect(p.x, p.y, rz.getBoundingClientRect());
  if (d < SNAP_DIST && d < bestD) { bestD = d; best = { id: 'rehacer', el: rz }; }
  return best;
}

function returnItem(item, ghost) {
  item.classList.remove('dragging');
  item.style.position = 'absolute';
  item.style.top = '8px';
  item.style.transform = '';
  item.style.transition = '';
  item.style.opacity = '';
  if (ghost) {
    item.style.left = ghost.style.left;
    ghost.remove();
  }
}

/* ── evaluation ── */
function evaluate(cable, zoneId) {
  const isDef = cable.defecto !== null;
  if (isDef && zoneId !== 'rehacer') return 'grave';
  if (isDef && zoneId === 'rehacer') return 'correct';
  if (!isDef && zoneId === 'rehacer') return 'goodToRehacer';
  if (cable.etiqueta === 'N' && zoneId === 'barra-pe') return 'grave';
  if (cable.etiqueta === 'PE' && zoneId === 'barra-n') return 'grave';
  if (zoneId === cable.destino) return 'correct';
  return 'leve';
}

function getEduKey(cable, zoneId) {
  if (cable.defecto === 'peluca') return 'peluca';
  if (cable.defecto === 'tenso') return 'tenso';
  if (cable.defecto === 'etiqueta') return 'etiqueta';
  if (cable.etiqueta === 'N' && zoneId === 'barra-pe') return 'nToPE';
  if (cable.etiqueta === 'PE' && zoneId === 'barra-n') return 'peTON';
  return 'nToPE';
}

/* ── handlers ── */
function onCorrect(item, ghost, cable, target, idx) {
  const tr = target.el.getBoundingClientRect();
  item.style.transition = 'all 0.25s ease-out';
  item.style.left = (tr.left + tr.width/2 - 26) + 'px';
  item.style.top = (tr.top + tr.height/2 - 40) + 'px';
  item.style.transform = 'scale(0.15)';
  item.style.opacity = '0';
  setTimeout(() => { item.remove(); if (ghost) ghost.remove(); }, 280);

  if (target.id === 'rehacer') {
    $('rehacer-zone').classList.add('has-cables');
    const cnt = $('rehacer-count');
    cnt.classList.remove('hidden');
    cnt.textContent = parseInt(cnt.textContent || '0') + 1;
  } else {
    if (!target.id.startsWith('barra')) target.el.classList.add('filled');
    // Flash green on barras
    if (target.id.startsWith('barra')) {
      const bar = target.el.querySelector('.barra-bar');
      if (bar) { bar.style.animation = 'flashGreen 0.4s ease-out'; setTimeout(() => bar.style.animation = '', 400); }
    }
  }

  const bonus = cableErrors[idx] === 0 ? PTS_BONUS : 0;
  score += PTS_BASE + bonus;
  updateHUD();

  if (cable.defecto) showFer(MSG.defectCaught[Math.floor(Math.random()*MSG.defectCaught.length)], 'celebrating', 1800);
  else showFer(MSG.correct[Math.floor(Math.random()*MSG.correct.length)], 'celebrating', 1800);

  correctCount++;
  checkRound();
}

function onGrave(item, ghost, cable, zoneId, idx) {
  cableErrors[idx]++;
  returnItem(item, ghost);
  item.style.animation = 'shake 0.4s ease-in-out';
  setTimeout(() => item.style.animation = '', 400);

  const flash = document.createElement('div');
  flash.className = 'red-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 300);

  lives--; updateHUD();
  if (lives <= 0) { showGameOver(); return; }

  const edu = EDU[getEduKey(cable, zoneId)];
  $('edu-av').src = FER.worried;
  $('edu-content').innerHTML = `
    <div class="edu-section"><strong>Qué hiciste:</strong><p>${edu.did}</p></div>
    <div class="edu-section"><strong>Por qué está mal:</strong><p>${edu.why}</p></div>
    <div class="edu-rule"><p>${edu.rule}</p></div>
    <div class="edu-section"><strong>Qué hacer:</strong><p>${edu.tip}</p></div>`;
  $('edu-overlay').classList.remove('hidden');
}

function onLeve(item, ghost, cable, zoneId, idx) {
  cableErrors[idx]++;
  returnItem(item, ghost);
  item.style.animation = 'shake 0.3s ease-in-out';
  setTimeout(() => item.style.animation = '', 300);
  let msg = MSG.errLevePiaWrong;
  if (['N','PE'].includes(cable.etiqueta) && zoneId.startsWith('pia')) msg = MSG.errLeveNPEtoPIA;
  else if (!['N','PE'].includes(cable.etiqueta) && zoneId.startsWith('barra')) msg = MSG.errLeveCircuitToBar;
  showFer(msg, 'happy', 2500);
}

function onGoodToRehacer(item, ghost, idx) {
  cableErrors[idx]++;
  returnItem(item, ghost);
  item.style.animation = 'shake 0.3s ease-in-out';
  setTimeout(() => item.style.animation = '', 300);
  showFer(MSG.errGoodToRehacer, 'happy', 2500);
}

/* ── end check ── */
function checkRound() {
  if (correctCount < cables.length) return;
  setTimeout(() => { stopBelt(); showResults(); }, 800);
}

/* ── game over ── */
function showGameOver() {
  stopBelt();
  $('go-av').src = FER.worried;
  $('go-txt').textContent = MSG.gameOver;
  $('gameover-overlay').classList.remove('hidden');
}

/* ── results ── */
function showResults() {
  show('results');
  const rec = parseInt(localStorage.getItem(RECORD_KEY) || '0');
  const isNew = score > rec;
  if (isNew) localStorage.setItem(RECORD_KEY, score);
  let av, msg;
  if (score >= 1400) { av = FER.celebrating; msg = MSG.resultHigh; }
  else if (score >= 900) { av = FER.happy; msg = MSG.resultMid; }
  else { av = FER.worried; msg = MSG.resultLow; }
  if (score >= TASK_THRESHOLD && window.ReactNativeWebView)
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  $('res-inner').innerHTML = `
    <h2>Cables a Su Sitio</h2>
    <img class="res-av" src="${av}" alt="Fer">
    <div class="res-score">${score} pts</div>
    <div class="res-record ${isNew?'new-rec':''}">${isNew ? `Récord: ${rec} → <strong>${score}</strong>` : `Récord: ${Math.max(rec,score)}`}</div>
    <p style="text-align:center;font-size:14px;line-height:1.5;max-width:300px">${msg}</p>
    <button class="cta" id="retry-btn">Volver a intentar</button>`;
  $('retry-btn').onclick = () => { show('play'); startGame(); };
}

/* ── start ── */
function startGame() {
  show('play');
  score = 0; lives = LIVES_MAX;
  buildPanel();
  setActiveSlots();
  updateHUD();
  $('fer-img').src = FER.happy;
  $('rehacer-count').textContent = '0';
  $('rehacer-count').classList.add('hidden');
  $('rehacer-zone').classList.remove('has-cables');
  buildConveyor();
  showFer(MSG.tutorial, 'happy', 3000);
}

/* ── init ── */
function init() {
  buildIntro();
  initDrag();
  $('edu-btn').onclick = () => $('edu-overlay').classList.add('hidden');
  $('help-btn').onclick = () => { $('help-txt').textContent = MSG.help; $('help-overlay').classList.remove('hidden'); };
  $('help-close-btn').onclick = () => $('help-overlay').classList.add('hidden');
  $('go-btn').onclick = () => { $('gameover-overlay').classList.add('hidden'); startGame(); };
}

init();
