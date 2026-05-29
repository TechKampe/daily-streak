/* ════════════════════════════════════════════════
   Alexia, la asistente domótica — game.js
   Lección: Actuadores — Del Sensor al Movimiento Real
   Mecánica: configurar cadenas (entrada→nodo→control→salida)
             y reproducir el día para vivir las consecuencias.
════════════════════════════════════════════════ */

import * as THREE from 'three';
'use strict';

/* ─── Haptics ─── */
function vibrate(level, pattern) {
  if (!window.ReactNativeWebView) {
    if (navigator.vibrate && pattern) navigator.vibrate(pattern.filter((_, i) => i % 2));
    return;
  }
  const msg = { action: 'VIBRATE', level };
  if (pattern) msg.pattern = pattern;
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

/* ─── Catálogo de piezas ─── */
const TILES = {
  voz:            { type: 'entrada', emoji: '🔊', label: 'Comando de voz' },
  sonda:          { type: 'entrada', emoji: '💧', label: 'Sonda inundación' },
  luz:            { type: 'entrada', emoji: '☀️', label: 'Sensor de luz' },
  viento:         { type: 'entrada', emoji: '🌬️', label: 'Anemómetro' },
  pir:            { type: 'entrada', emoji: '🚶', label: 'Detector PIR' },
  pulsador:       { type: 'entrada', emoji: '🔘', label: 'Pulsador' },
  rele:           { type: 'control', emoji: '⚙️', label: 'Relé' },
  inversor:       { type: 'control', emoji: '🔁', label: 'Inversor c/encl.' },
  doble_sin:      { type: 'control', emoji: '⚠️', label: 'Doble s/encl.' },
  lampara:        { type: 'salida',  emoji: '💡', label: 'Lámpara' },
  electrovalvula: { type: 'salida',  emoji: '🚰', label: 'Electroválvula' },
  motor:          { type: 'salida',  emoji: '🪟', label: 'Motor persiana' },
  enchufe:        { type: 'salida',  emoji: '🔌', label: 'Enchufe/estufa' },
};
const label = id => TILES[id] ? TILES[id].label : '—';

/* ─── Casas ─── */
const CASAS = [
  {
    name: 'El piso de los Martín',
    reels: { entrada: ['voz', 'sonda', 'luz', 'pir'], control: ['rele', 'inversor'], salida: ['lampara', 'electrovalvula', 'motor'] },
    deseos: [
      { id: 'c1d1', text: '"Alexia, enciende la luz del salón"', correct: { entrada: 'voz', control: 'rele', salida: 'lampara' },
        tut: 'Cada deseo es una cadena. Arrastra el COMANDO DE VOZ a la ENTRADA, el RELÉ al CONTROL (mis 24V no pueden con los 230V) y la LÁMPARA a la SALIDA.' },
      { id: 'c1d2', text: '"Si detectas agua en la cocina, corta el agua"', correct: { entrada: 'sonda', control: 'rele', salida: 'electrovalvula' }, scene: 'agua',
        tut: 'Aquí nadie lo dice: lo detecta un SENSOR. La sonda y la voz van en la MISMA ranura de entrada. El agua la corta la electroválvula.' },
      { id: 'c1d3', text: '"Sube la persiana por la mañana"', correct: { entrada: 'luz', control: 'inversor', salida: 'motor', dir: 'subida' }, scene: 'persiana',
        tut: 'El motor necesita un RELÉ INVERSOR y una dirección. Para subir, elige SUBIDA. Nunca AMBAS.' },
    ],
  },
  {
    name: 'La casa de Doña Carmen',
    reels: { entrada: ['voz', 'sonda', 'luz', 'viento', 'pir'], control: ['rele', 'inversor'], salida: ['lampara', 'electrovalvula', 'motor', 'enchufe'] },
    deseos: [
      { id: 'c2d1', text: '"Alexia, apaga las luces del salón"', correct: { entrada: 'voz', control: 'rele', salida: 'lampara' }, scene: 'luz' },
      { id: 'c2d2', text: '"Si hay fuga bajo el lavavajillas, córtame el agua"', correct: { entrada: 'sonda', control: 'rele', salida: 'electrovalvula' }, scene: 'agua' },
      { id: 'c2d3', text: '"Recoge el toldo si se levanta viento"', correct: { entrada: 'viento', control: 'inversor', salida: 'motor', dir: 'subida' }, scene: 'toldo' },
      { id: 'c2d4', text: '"Enciende la estufa del porche al anochecer"', correct: { entrada: 'luz', control: 'rele', salida: 'enchufe' }, scene: 'estufa' },
      { id: 'c2d5', text: '🎵 "Alexia, pon reggaeton cuando cocino"', decoy: true, joke: '¿Un actuador para poner reggaeton? Eso lo hago yo sola 🎶' },
    ],
  },
  {
    name: 'El chalet de los Ríos',
    reels: { entrada: ['voz', 'sonda', 'luz', 'viento', 'pir', 'pulsador'], control: ['rele', 'inversor', 'doble_sin'], salida: ['lampara', 'electrovalvula', 'motor', 'enchufe'] },
    deseos: [
      { id: 'c3d1', text: '"Sube la persiana del dormitorio al amanecer"', correct: { entrada: 'luz', control: 'inversor', salida: 'motor', dir: 'subida' }, scene: 'persiana' },
      { id: 'c3d2', text: '"Baja la persiana del salón cuando el sol pegue fuerte"', correct: { entrada: 'luz', control: 'inversor', salida: 'motor', dir: 'bajada' }, scene: 'persiana' },
      { id: 'c3d3', text: '"Quiero un botón para subir y bajar el toldo"', correct: { entrada: 'pulsador', control: 'inversor', salida: 'motor', dir: 'any' }, scene: 'toldo' },
      { id: 'c3d4', text: '"Si hay fuga en el baño, corta el agua"', correct: { entrada: 'sonda', control: 'rele', salida: 'electrovalvula' }, scene: 'agua' },
      { id: 'c3d5', text: '🎂 "Recuérdame felicitar el cumple de mi jefe"', decoy: true, joke: 'Recordatorio anotado. Eso no necesita actuador — lo hago yo sola 📅' },
      { id: 'c3d6', text: '🔊 "Alexia, pon mi podcast a las 8"', decoy: true, joke: 'Le doy al play yo sola, sin cables ni relés 🎧' },
    ],
  },
];

/* ─── Mensajes de rechazo (físicamente imposible) ─── */
function rejectReason(slotType, tileType) {
  if (slotType === 'entrada' && tileType === 'salida')
    return { what: 'Pusiste un actuador en la entrada.', why: 'Eso ejecuta, no siente.', rule: 'El sensor detecta, el actuador ejecuta.', todo: 'Lleva el actuador a la SALIDA.' };
  if (slotType === 'salida' && tileType === 'entrada')
    return { what: 'Pusiste un disparador en la salida.', why: 'Eso pide, no ejecuta.', rule: 'Lo que siente o manda va en la entrada.', todo: 'Lleva el disparador a la ENTRADA.' };
  if (slotType === 'control')
    return { what: 'Pusiste ahí algo que no es un relé.', why: 'El control es la barrera de potencia.', rule: 'Entre mis 24V y los 230V va un relé/contactor.', todo: 'Pon una pieza de CONTROL en esa ranura.' };
  // tileType control en entrada/salida
  return { what: 'Pusiste el relé donde no va.', why: 'El relé no siente ni es el actuador final.', rule: 'Es la barrera entre los 24V de control y los 230V de potencia.', todo: 'Va en el CONTROL.' };
}

/* ─── Estado ─── */
let state = {
  casaIdx: 0,
  deseoIdx: 0,
  cur: { entrada: null, control: null, salida: null, dir: null },
  configs: {},          // deseoId -> {entrada,control,salida,dir}
  screen: 'INTRO',
};

/* ─── DOM ─── */
const $ = id => document.getElementById(id);
const overlays = ['overlay-intro', 'overlay-casa', 'overlay-error', 'overlay-parte', 'overlay-results', 'overlay-help'];
function showOverlay(id) { overlays.forEach(o => $(o).classList.toggle('hidden', o !== id)); }
function hideOverlays() { overlays.forEach(o => $(o).classList.add('hidden')); }

/* ════════════════════════════════════════════════
   CONFIGURA
════════════════════════════════════════════════ */

function startCasa(idx) {
  state.casaIdx = idx;
  state.deseoIdx = 0;
  const casa = CASAS[idx];
  $('casa-badge').textContent = `CASA ${idx + 1}/3`;
  $('casa-title').textContent = casa.name;
  const n = casa.deseos.length;
  $('casa-desc').textContent = `${n} deseos. Móntalos y reproduce el día.`;
  setMood('happy'); setBanner('CONFIGURA');
  showOverlay('overlay-casa');
}

function enterConfig() {
  const casa = CASAS[state.casaIdx];
  faceFront = false;
  alexiaBaseY = 0.55;
  document.documentElement.className = 'gameplay';
  hideOverlays();
  $('scene').classList.remove('show');
  $('dia').classList.add('hidden');
  $('config').classList.remove('hidden');
  renderReels(casa);
  loadDeseo(0);
  setMood('happy');
}

function renderReels(casa) {
  ['entrada', 'control', 'salida'].forEach(type => {
    const track = $('reel-' + type);
    track.innerHTML = '';
    casa.reels[type].forEach(id => {
      const t = TILES[id];
      const el = document.createElement('div');
      el.className = 'tile';
      el.dataset.type = type;
      el.dataset.id = id;
      el.innerHTML = `<span class="t-emoji">${t.emoji}</span><span class="t-label">${t.label}</span>`;
      el.addEventListener('pointerdown', e => onTilePointerDown(e, id, type));
      track.appendChild(el);
    });
  });
}

function loadDeseo(idx) {
  state.deseoIdx = idx;
  const casa = CASAS[state.casaIdx];
  const deseo = casa.deseos[idx];

  $('hud-left').textContent = `Casa ${state.casaIdx + 1}/3 · Deseo ${idx + 1}/${casa.deseos.length}`;
  $('wish-text').textContent = deseo.text;

  // tutorial hint (sólo Casa 1)
  const hint = $('tutorial-hint');
  if (state.casaIdx === 0 && deseo.tut) { hint.textContent = deseo.tut; hint.classList.remove('hidden'); }
  else hint.classList.add('hidden');

  // reset slots + cur
  state.cur = { entrada: null, control: null, salida: null, dir: null };
  ['entrada', 'control', 'salida'].forEach(clearSlotDOM);
  document.querySelectorAll('.tile').forEach(t => t.classList.remove('placed'));

  // restore stored config
  const stored = state.configs[deseo.id];
  if (stored) {
    if (stored.entrada) placeTile('entrada', stored.entrada, true);
    if (stored.salida)  placeTile('salida', stored.salida, true);
    if (stored.control) placeTile('control', stored.control, true);
    if (stored.dir) { state.cur.dir = stored.dir; }
  }

  // decoy → skip link
  $('btn-skip').classList.toggle('hidden', !deseo.decoy);
  updateChain();
}

function clearSlotDOM(type) {
  const slot = $('slot-' + type);
  slot.classList.remove('filled');
  slot.querySelector('.slot-content').innerHTML = '';
}

function placeTile(type, id, silent) {
  // return previous tile if any
  if (state.cur[type]) {
    const prev = document.querySelector(`.tile[data-id="${state.cur[type]}"]`);
    if (prev) prev.classList.remove('placed');
  }
  state.cur[type] = id;
  const slot = $('slot-' + type);
  slot.classList.add('filled');
  const t = TILES[id];
  slot.querySelector('.slot-content').innerHTML = `<span class="t-emoji">${t.emoji}</span> ${t.label}`;
  const reelTile = document.querySelector(`.tile[data-id="${id}"]`);
  if (reelTile) reelTile.classList.add('placed');
  if (!silent) vibrate('success');
  if (type === 'salida' && id !== 'motor') state.cur.dir = null;
}

function clearSlot(type) {
  if (!state.cur[type]) return;
  const prev = document.querySelector(`.tile[data-id="${state.cur[type]}"]`);
  if (prev) prev.classList.remove('placed');
  state.cur[type] = null;
  clearSlotDOM(type);
  if (type === 'salida') { state.cur.dir = null; clearSlot('control'); }
  updateChain();
}

function updateChain() {
  const deseo = CASAS[state.casaIdx].deseos[state.deseoIdx];
  const ctrlSlot = $('slot-control');
  const motorDir = $('motor-dir');
  const isMotor = state.cur.salida === 'motor';

  // control slot visible sólo si hay salida
  if (state.cur.salida) ctrlSlot.classList.remove('slot-collapsed');
  else ctrlSlot.classList.add('slot-collapsed');

  // aviso falta relé
  ctrlSlot.classList.toggle('need-rele', !!state.cur.salida && !state.cur.control);

  // selector de dirección del motor
  motorDir.classList.toggle('hidden', !isMotor);
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.toggle('sel', b.dataset.dir === state.cur.dir));

  // wires
  $('wire-top').classList.toggle('live', !!state.cur.entrada);
  $('wire-mid').classList.toggle('live', !!state.cur.salida && !!state.cur.control);

  // next enable
  let ready;
  if (deseo.decoy) ready = true;
  else {
    ready = state.cur.entrada && state.cur.salida && state.cur.control && (!isMotor || state.cur.dir);
  }
  const btn = $('btn-next');
  btn.disabled = !ready;
  const last = state.deseoIdx === CASAS[state.casaIdx].deseos.length - 1;
  btn.textContent = last ? '▶ Reproducir el día' : 'Siguiente deseo →';
}

function commitDeseo() {
  const deseo = CASAS[state.casaIdx].deseos[state.deseoIdx];
  state.configs[deseo.id] = { ...state.cur };
  setMood('celebrating'); setBanner('OK');
  const last = state.deseoIdx === CASAS[state.casaIdx].deseos.length - 1;
  if (last) { playDay(); }
  else { loadDeseo(state.deseoIdx + 1); }
}

/* ════════════════════════════════════════════════
   DRAG & DROP
════════════════════════════════════════════════ */
let drag = null; // {id,type,startX,startY,ghost,active,pointerId}

function onTilePointerDown(e, id, type) {
  if (e.target.closest('.tile').classList.contains('placed')) return;
  drag = { id, type, startX: e.clientX, startY: e.clientY, ghost: null, active: false, pointerId: e.pointerId, mouse: e.pointerType === 'mouse' };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
}

function onPointerMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
  if (!drag.active) {
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return;
    if (drag.mouse || Math.abs(dx) > Math.abs(dy)) {
      // start drag
      drag.active = true;
      const t = TILES[drag.id];
      const g = document.createElement('div');
      g.className = 'drag-ghost';
      g.innerHTML = `<span class="t-emoji">${t.emoji}</span><span class="t-label">${t.label}</span>`;
      document.body.appendChild(g);
      drag.ghost = g;
      highlightSlots(drag.type, true);
    } else {
      // vertical → es scroll del reel: abortamos drag
      cleanupDrag();
      return;
    }
  }
  if (drag.active) {
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    markHover(e.clientX, e.clientY);
  }
}

function onPointerUp(e) {
  if (!drag) return;
  if (drag.active) dropAt(e.clientX, e.clientY);
  cleanupDrag();
}
function onPointerCancel() { cleanupDrag(); }

function cleanupDrag() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerCancel);
  if (drag && drag.ghost) drag.ghost.remove();
  document.querySelectorAll('.slot').forEach(s => s.classList.remove('compatible', 'hover'));
  drag = null;
}

function slotEls() {
  const els = [$('slot-entrada'), $('slot-salida')];
  if (!$('slot-control').classList.contains('slot-collapsed')) els.push($('slot-control'));
  return els;
}

function highlightSlots(type, on) {
  slotEls().forEach(s => { if (s.dataset.slot === type) s.classList.toggle('compatible', on); });
}

function markHover(x, y) {
  let best = null, bestD = Infinity;
  slotEls().forEach(s => {
    const r = s.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (x > r.left - 28 && x < r.right + 28 && y > r.top - 28 && y < r.bottom + 28) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { bestD = d; best = s; }
    }
  });
  slotEls().forEach(s => s.classList.toggle('hover', s === best));
}

function dropAt(x, y) {
  let target = null, bestD = Infinity;
  slotEls().forEach(s => {
    const r = s.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (x > r.left - 28 && x < r.right + 28 && y > r.top - 28 && y < r.bottom + 28) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { bestD = d; target = s; }
    }
  });
  if (!target) return; // soltó fuera, sin penalización
  const slotType = target.dataset.slot;
  const tileType = drag.type;
  if (slotType !== tileType) {
    target.classList.add('reject');
    setTimeout(() => target.classList.remove('reject'), 320);
    vibrate('error');
    showError(rejectReason(slotType, tileType));
    return;
  }
  placeTile(slotType, drag.id);
  updateChain();
}

/* ════════════════════════════════════════════════
   EL DÍA
════════════════════════════════════════════════ */

function evalDeseo(deseo) {
  if (deseo.decoy) return { status: 'neutral', reason: deseo.joke };
  const cfg = state.configs[deseo.id] || {};
  const c = deseo.correct;
  const isMotor = c.salida === 'motor';

  // cortocircuito del motor
  if (isMotor && (cfg.dir === 'ambas' || cfg.control === 'doble_sin')) {
    return { status: 'burn', reason: 'Activé subida y bajada a la vez: cruza los devanados, cortocircuito, motor quemado. Por eso el inversor lleva enclavamiento: impide las dos a la vez.' };
  }
  let dirOk = true;
  if (isMotor) dirOk = (c.dir === 'any') ? (cfg.dir === 'subida' || cfg.dir === 'bajada') : (cfg.dir === c.dir);

  const ok = cfg.entrada === c.entrada && cfg.salida === c.salida && cfg.control === c.control && dirOk;
  if (ok) return { status: 'ok', reason: '' };
  return { status: 'fail', reason: reasonFor(deseo, cfg, dirOk) };
}

function reasonFor(deseo, cfg, dirOk) {
  const c = deseo.correct;
  if (cfg.entrada && cfg.entrada !== c.entrada)
    return `El disparador no era el correcto: esto lo detecta ${label(c.entrada)}, no ${label(cfg.entrada)}. La voz y los sensores son entradas, pero cada deseo pide la suya.`;
  if (cfg.salida && cfg.salida !== c.salida)
    return `El actuador no era el correcto: esto lo ejecuta ${label(c.salida)}, no ${label(cfg.salida)}. Empareja el actuador con lo que hay que hacer.`;
  if (c.salida === 'motor' && !dirOk)
    return `El motor giró al revés. Cambia de sentido según la línea que activas: necesitabas ${c.dir === 'bajada' ? 'BAJADA' : 'SUBIDA'}.`;
  if (cfg.control !== c.control)
    return `El control no era el adecuado: para esto necesitabas ${label(c.control)}.`;
  return 'La cadena no hacía lo que el cliente pidió.';
}

let dayResults = [];

function buildTimeline() {
  const tl = $('timeline');
  tl.innerHTML = '';
  CASAS[state.casaIdx].deseos.forEach((d, i) => {
    const m = document.createElement('div');
    m.className = 'tl-mark';
    m.id = 'tl-' + i;
    m.textContent = d.decoy ? '🎵' : (i === 0 ? '🌅' : '·');
    tl.appendChild(m);
  });
}

function playDay() {
  state.screen = 'DIA';
  $('config').classList.add('hidden');
  $('dia').classList.remove('hidden');
  $('scene').classList.add('show');
  faceFront = true;
  alexiaBaseY = -1.15;
  buildTimeline();
  dayResults = [];
  vibrate('medium');
  setMood('happy'); setBanner('EL DIA');
  setTimeout(() => runEvent(0), 800);
}

function runEvent(i) {
  const deseos = CASAS[state.casaIdx].deseos;
  if (i >= deseos.length) { setTimeout(showParte, 900); return; }
  const deseo = deseos[i];
  const mark = $('tl-' + i);
  document.querySelectorAll('.tl-mark').forEach(m => m.classList.remove('active'));
  mark.classList.add('active');

  // listening
  setMood('listening');
  const cue = triggerBanner(deseo);
  setBanner(cue.banner);
  $('dia-caption').textContent = cue.caption;

  setTimeout(() => {
    const res = evalDeseo(deseo);
    dayResults.push({ deseo, ...res });
    animateConsequence(deseo, res);
    if (res.status === 'ok') { mark.classList.add('ok'); mark.textContent = '✓'; setMood('celebrating'); setBanner('OK'); vibrate('success'); $('dia-caption').textContent = 'Hecho ✓ — ' + cleanWish(deseo); }
    else if (res.status === 'neutral') { mark.classList.add('ok'); mark.textContent = '🎵'; setMood('happy'); setBanner('YO SOLA'); $('dia-caption').textContent = deseo.joke; }
    else if (res.status === 'burn') { mark.classList.add('fail'); mark.textContent = '✗'; setMood('worried'); setBanner('MOTOR KO'); vibrate('heavy', [0, 200, 80, 200, 80, 200]); $('dia-caption').textContent = '¡Motor quemado!'; }
    else { mark.classList.add('fail'); mark.textContent = '✗'; setMood('worried'); setBanner('SIN POTENCIA'); vibrate('error', [0, 150, 80, 150]); $('dia-caption').textContent = 'Algo no salió como el cliente pidió…'; }

    setTimeout(() => runEvent(i + 1), 1700);
  }, 700);
}

function cleanWish(d) { return d.text.replace(/"/g, '').replace(/^[^\w¿¡A-Za-zÁÉÍÓÚáéíóú]+/, ''); }

function triggerBanner(deseo) {
  const c = deseo.correct || {};
  if (deseo.decoy) return { banner: 'RECIBIDO', caption: cleanWish(deseo) };
  if (c.entrada === 'voz' || c.entrada === 'pulsador') return { banner: 'RECIBIDO', caption: '🔊 ' + cleanWish(deseo) };
  const map = { sonda: { b: 'AGUA!', c: '💧 La sonda detecta agua' }, luz: { b: 'AMANECE', c: '☀️ El sensor de luz se activa' }, viento: { b: 'VIENTO!', c: '🌬️ El anemómetro detecta viento' }, pir: { b: 'PRESENCIA', c: '🚶 El PIR detecta movimiento' } };
  const m = map[c.entrada] || { b: 'RECIBIDO', c: cleanWish(deseo) };
  return { banner: m.b, caption: m.c };
}

function resetScene() {
  $('flood').classList.remove('on');
  $('valve').classList.remove('closed');
  $('lamp-glow').classList.remove('on');
  $('heater').classList.remove('on');
  $('smoke').classList.remove('on');
  ['blind-persiana', 'awning-toldo'].forEach(id => { const e = $(id); e.classList.remove('up', 'down', 'storm'); });
}

function animateConsequence(deseo, res) {
  resetScene();
  const sc = deseo.scene;
  const ok = res.status === 'ok';
  if (res.status === 'burn') { $('smoke').classList.add('on'); return; }
  if (sc === 'agua') {
    if (ok) $('valve').classList.add('closed');
    else $('flood').classList.add('on');
  } else if (sc === 'luz') {
    $('lamp-glow').classList.toggle('on', ok);
  } else if (sc === 'estufa') {
    $('heater').classList.toggle('on', ok);
  } else if (sc === 'persiana' || sc === 'toldo') {
    const el = $(sc === 'persiana' ? 'blind-persiana' : 'awning-toldo');
    const wantUp = (deseo.correct.dir === 'subida' || deseo.correct.dir === 'any');
    if (ok) el.classList.add(wantUp ? 'up' : 'down');
    else { el.classList.add(wantUp ? 'down' : 'up'); if (sc === 'toldo') el.classList.add('storm'); }
  }
  // En Casa1 deseo1 la lámpara enciende
  if (!sc && deseo.correct && deseo.correct.salida === 'lampara') $('lamp-glow').classList.toggle('on', ok);
}

/* ════════════════════════════════════════════════
   PARTE DE LA CASA
════════════════════════════════════════════════ */
function showParte() {
  state.screen = 'PARTE';
  document.documentElement.className = 'results';
  $('scene').classList.remove('show');
  const casa = CASAS[state.casaIdx];
  const reales = dayResults.filter(r => !r.deseo.decoy);
  const cleared = reales.every(r => r.status === 'ok');

  $('parte-title').textContent = `Parte: ${casa.name}`;
  const verdict = $('parte-verdict');
  if (cleared) { verdict.textContent = '✅ Casa entregada'; verdict.className = 'parte-verdict good'; }
  else { verdict.textContent = 'El cliente no lo firma todavía. Revisa lo que falló.'; verdict.className = 'parte-verdict bad'; }

  const ul = $('parte-list');
  ul.innerHTML = '';
  dayResults.forEach(r => {
    const li = document.createElement('li');
    const good = r.status === 'ok' || r.status === 'neutral';
    li.className = good ? 'ok' : 'fail';
    li.innerHTML = `${cleanWish(r.deseo)}${r.reason && !good ? `<span class="why">${r.reason}</span>` : (r.status === 'neutral' ? `<span class="why">${r.reason}</span>` : '')}`;
    ul.appendChild(li);
  });

  const btn = $('btn-parte');
  if (cleared) {
    saveProgress(state.casaIdx + 1, state.casaIdx === CASAS.length - 1);
    btn.textContent = state.casaIdx === CASAS.length - 1 ? 'Ver resultado' : 'Siguiente casa';
    btn.onclick = () => { if (state.casaIdx === CASAS.length - 1) showResults(); else { document.documentElement.className = 'gameplay'; startCasa(state.casaIdx + 1); } };
    setMood('celebrating');
  } else {
    btn.textContent = 'Reconfigurar';
    btn.onclick = () => { document.documentElement.className = 'gameplay'; enterConfig(); };
    setMood('worried');
  }
  setBanner(cleared ? 'OK' : '...');
  showOverlay('overlay-parte');
}

function showResults() {
  state.screen = 'RESULTS';
  document.documentElement.className = 'results';
  setMood('celebrating'); setBanner('LISTO');
  jumpT = JUMP_DUR;
  showOverlay('overlay-results');
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
}

/* ─── localStorage ─── */
function saveProgress(maxCasa, completed) {
  try {
    const cur = JSON.parse(localStorage.getItem('alexia_asistente_domotica_record') || '{}');
    const rec = { maxCasa: Math.max(maxCasa, cur.maxCasa || 0), completado: completed || cur.completado || false };
    localStorage.setItem('alexia_asistente_domotica_record', JSON.stringify(rec));
  } catch (e) {}
}

/* ─── Error overlay ─── */
function showError(r) {
  $('err-what').textContent = r.what;
  $('err-why').textContent = r.why;
  $('err-rule').textContent = r.rule;
  $('err-do').textContent = r.todo;
  setMood('worried');
  showOverlay('overlay-error');
}

/* ─── Reset ─── */
function resetGame() {
  document.documentElement.className = 'gameplay';
  state.configs = {};
  startCasa(0);
}

/* ════════════════════════════════════════════════
   ALEXIA — modelo 3D (Three.js)
════════════════════════════════════════════════ */
let alexiaMood = 'happy';
let faceFront = false;
let jumpT = 0, celebrateSpinT = 0, wobbleT = 0;
let alexiaBaseY = 0.55;
const JUMP_DUR = 0.55;
let bannerCanvas, bannerCtx, bannerTex;
let ringMat;

const MOOD_COLOR = {
  happy:       new THREE.Color(0x00E6BC),
  listening:   new THREE.Color(0x35F0D0),
  celebrating: new THREE.Color(0x04FFB4),
  worried:     new THREE.Color(0xE74C3C),
};

function setMood(m) {
  if (m === alexiaMood) { if (m === 'celebrating') { celebrateSpinT = 0.8; jumpT = JUMP_DUR; } return; }
  alexiaMood = m;
  if (m === 'celebrating') { celebrateSpinT = 0.8; jumpT = JUMP_DUR; }
  if (m === 'worried') { wobbleT = 0.5; }
}

function setBanner(text) {
  if (!bannerCtx) { const fb = $('fb-banner'); if (fb) fb.textContent = text; return; }
  drawBanner(text);
  const fb = $('fb-banner'); if (fb) fb.textContent = text;
}

function drawBanner(text) {
  const w = bannerCanvas.width, h = bannerCanvas.height;
  bannerCtx.fillStyle = '#06121f';
  bannerCtx.fillRect(0, 0, w, h);
  // marco
  bannerCtx.strokeStyle = '#0b2238'; bannerCtx.lineWidth = 8;
  bannerCtx.strokeRect(4, 4, w - 8, h - 8);
  const col = alexiaMood === 'worried' ? '#ff6b5e' : (alexiaMood === 'celebrating' ? '#7dffd0' : '#46f0d6');
  bannerCtx.fillStyle = col;
  bannerCtx.font = '92px VT323, monospace';
  bannerCtx.textAlign = 'center';
  bannerCtx.textBaseline = 'middle';
  bannerCtx.shadowColor = col; bannerCtx.shadowBlur = 16;
  bannerCtx.fillText(text, w / 2, h / 2 + 6);
  bannerCtx.shadowBlur = 0;
  if (bannerTex) bannerTex.needsUpdate = true;
}

function initThree() {
  const canvas = $('alexia-canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { enableFallback(); return; }
  if (!renderer || !renderer.getContext()) { enableFallback(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  scene.add(new THREE.HemisphereLight(0xFFF4E0, 0x16305f, 0.7));
  const key = new THREE.DirectionalLight(0xFFFDF0, 1.15); key.position.set(4, 7, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xAAD0FF, 0.4); fill.position.set(-5, -1, -3); scene.add(fill);

  const g = new THREE.Group();
  g.scale.setScalar(0.5);
  scene.add(g);

  const fabric = new THREE.MeshStandardMaterial({ color: 0xB9C0C9, roughness: 0.95, metalness: 0.0 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0B214A, roughness: 0.6, metalness: 0.1 });

  // cúpula (media esfera superior)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), fabric);
  dome.position.y = -0.05; g.add(dome);

  // base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.08, 0.5, 48), baseMat);
  base.position.y = -0.62; g.add(base);

  // aro de ánimo (emissive)
  ringMat = new THREE.MeshStandardMaterial({ color: 0x00E6BC, emissive: new THREE.Color(0x00E6BC), emissiveIntensity: 1.0, roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.07, 16, 64), ringMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = -0.36; g.add(ring);

  // banner (CanvasTexture)
  bannerCanvas = document.createElement('canvas'); bannerCanvas.width = 512; bannerCanvas.height = 160;
  bannerCtx = bannerCanvas.getContext('2d');
  bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.anisotropy = 4;
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, transparent: false });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.34), bannerMat);
  banner.position.set(0, 0.12, 1.02); banner.rotation.x = -0.05; g.add(banner);
  drawBanner('HOLA');

  // re-dibuja cuando VT323 esté lista
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawBanner($('fb-banner') ? $('fb-banner').textContent : 'HOLA'));

  const clock = new THREE.Clock();
  let t = 0, baseScale = 0.5;
  const tmpColor = new THREE.Color();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    // color del aro
    tmpColor.copy(MOOD_COLOR[alexiaMood] || MOOD_COLOR.happy);
    ringMat.color.lerp(tmpColor, 0.12);
    ringMat.emissive.lerp(tmpColor, 0.12);
    const pulse = alexiaMood === 'listening' ? (0.7 + 0.4 * Math.sin(t * 6)) : (alexiaMood === 'worried' ? (0.6 + 0.3 * Math.sin(t * 4)) : 1.0);
    ringMat.emissiveIntensity = pulse;

    // rotación
    if (celebrateSpinT > 0) { celebrateSpinT -= dt; g.rotation.y += dt * 6; }
    else if (faceFront || alexiaMood === 'listening' || alexiaMood === 'worried') {
      // ease hacia el frente
      let y = g.rotation.y % (Math.PI * 2); if (y > Math.PI) y -= Math.PI * 2; if (y < -Math.PI) y += Math.PI * 2;
      g.rotation.y -= y * 0.12;
    } else {
      // idle: balanceo suave para mantener el banner legible
      g.rotation.y += (Math.sin(t * 0.6) * 0.32 - g.rotation.y) * 0.06;
    }

    // salto + pulso (celebrate) sobre la base de fase (config/día)
    let hop = 0, pulse2 = 0;
    if (jumpT > 0) {
      jumpT -= dt;
      const p = 1 - jumpT / JUMP_DUR; // 0→1
      hop = Math.sin(p * Math.PI) * 0.4;
      pulse2 = 0.10 * Math.sin(p * Math.PI);
    }
    const targetY = alexiaBaseY + hop;
    g.position.y += (targetY - g.position.y) * 0.3;
    g.scale.setScalar(baseScale + 0.01 * Math.sin(t * 2) + pulse2);

    // wobble (worried)
    if (wobbleT > 0) {
      wobbleT -= dt;
      const k = wobbleT / 0.5;
      g.rotation.z = Math.sin(t * 38) * 0.09 * k;
      g.position.x = Math.sin(t * 34) * 0.05 * k;
    } else {
      g.rotation.z *= 0.85;
      g.position.x *= 0.85;
    }

    renderer.render(scene, camera);
  }
  animate();
}

function enableFallback() {
  $('alexia-canvas').classList.add('hidden');
  $('alexia-fallback').classList.remove('hidden');
}

/* override setBanner/ mood for fallback ring color */
const _fbRing = () => $('fb-ring');
function applyFallbackMood() {
  const r = _fbRing(); if (!r) return;
  const c = alexiaMood === 'worried' ? '#E74C3C' : alexiaMood === 'celebrating' ? '#04FFB4' : '#00E6BC';
  r.style.borderColor = c; r.style.boxShadow = `0 0 24px ${c}88`;
}
const _setMood = setMood;
setMood = function (m) { _setMood(m); applyFallbackMood(); };

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
function init() {
  initThree();

  $('btn-start').addEventListener('click', () => startCasa(0));
  $('btn-casa-go').addEventListener('click', enterConfig);
  $('btn-next').addEventListener('click', commitDeseo);
  $('btn-skip').addEventListener('click', () => { const d = CASAS[state.casaIdx].deseos[state.deseoIdx]; state.configs[d.id] = { ...state.cur }; commitDeseo(); });
  $('btn-understood').addEventListener('click', () => { hideOverlays(); setMood('happy'); });
  $('btn-replay').addEventListener('click', resetGame);
  $('btn-help').addEventListener('click', () => showOverlay('overlay-help'));
  $('btn-help-close').addEventListener('click', () => { hideOverlays(); });

  // slots: tap para editar (devolver pieza)
  ['entrada', 'control', 'salida'].forEach(type => {
    $('slot-' + type).addEventListener('click', () => { if (state.screen !== 'DIA') clearSlot(type); });
  });

  // selector de dirección del motor
  document.querySelectorAll('.dir-btn').forEach(b => {
    b.addEventListener('click', () => { state.cur.dir = b.dataset.dir; updateChain(); });
  });

  showOverlay('overlay-intro');
  setMood('happy');
}

init();
