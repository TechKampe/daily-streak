/* ════════════════════════════════════════════════
   Alexia, la asistente domótica — game.js
   Lección: Actuadores — Del Sensor al Movimiento Real
   Mecánica: marcar la combinación correcta en 3 ruedas
   (ENTRADA · CONTROL · SALIDA) y pulsar Play para ver el resultado.
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
const CDN = 'https://res.cloudinary.com/kampe/image/upload';
const TILES = {
  voz:            { type: 'entrada', emoji: '🔊', label: 'Comando de voz',   s: 'Voz',         img: `${CDN}/v1780320796/tile_voz_mohjl3.png` },
  sonda:          { type: 'entrada', emoji: '💧', label: 'Sonda inundación', s: 'Sonda',       img: `${CDN}/v1780320796/tile_sonda_s86tuz.png` },
  luz:            { type: 'entrada', emoji: '☀️', label: 'Sensor de luz',    s: 'Sensor luz',  img: `${CDN}/v1780320798/tile_luz_lmp32z.png` },
  viento:         { type: 'entrada', emoji: '🌬️', label: 'Anemómetro',       s: 'Viento',      img: `${CDN}/v1780320796/tile_viento_dxthux.png` },
  pir:            { type: 'entrada', emoji: '🚶', label: 'Detector PIR',     s: 'PIR',         img: `${CDN}/v1780320797/tile_pir_g9qiss.png` },
  pulsador:       { type: 'entrada', emoji: '🔘', label: 'Pulsador',         s: 'Pulsador',    img: `${CDN}/v1780320797/tile_pulsador_dx55cv.png` },
  directo:        { type: 'control', emoji: '⛔', label: 'Directo (sin relé)', s: 'Directo' },
  rele:           { type: 'control', emoji: '⚙️', label: 'Relé',             s: 'Relé',        img: `${CDN}/v1780320797/tile_rele_el5mej.png` },
  inversor:       { type: 'control', emoji: '🔁', label: 'Inversor c/encl.', s: 'Inversor',    img: `${CDN}/v1780320799/tile_inversor_ata5jz.png` },
  doble_sin:      { type: 'control', emoji: '⚠️', label: 'Doble s/encl.',    s: 'Doble s/enc', img: `${CDN}/v1780320800/tile_doble_sin_km4zfg.png` },
  lampara:        { type: 'salida',  emoji: '💡', label: 'Lámpara',          s: 'Lámpara',     img: `${CDN}/v1780320798/tile_lampara_hve8o9.png` },
  electrovalvula: { type: 'salida',  emoji: '🚰', label: 'Electroválvula',   s: 'Electrov.',   img: `${CDN}/v1780320799/tile_electrovalvula_co9rh1.png` },
  enchufe:        { type: 'salida',  emoji: '🔌', label: 'Enchufe/estufa',   s: 'Estufa',      img: `${CDN}/v1780320799/tile_enchufe_bla0yy.png` },
  motor_sub:      { type: 'salida',  emoji: '🪟', label: 'Motor ▲ Subida',   s: 'Motor ▲',     img: `${CDN}/v1780320797/tile_motor_rlfyp5.png` },
  motor_baj:      { type: 'salida',  emoji: '🪟', label: 'Motor ▼ Bajada',   s: 'Motor ▼',     img: `${CDN}/v1780320797/tile_motor_rlfyp5.png` },
  motor_amb:      { type: 'salida',  emoji: '🪟', label: 'Motor ↕ Ambas',    s: 'Motor ↕',     img: `${CDN}/v1780320797/tile_motor_rlfyp5.png` },
};
const label = id => TILES[id] ? TILES[id].label : '—';
const isMotor = id => id && id.indexOf('motor') === 0;

/* ─── Casas (ruedas + deseos) ───
   Cobertura: cada pieza aparece como respuesta correcta al menos una vez.
   ENTRADA  voz·sonda·luz·viento·pir·pulsador   CONTROL  relé·inversor (directo y doble_sin = trampa)
   SALIDA   lámpara(on/off)·electroválvula·estufa·motor▲·motor▼·motor↕(trampa) */
const CASAS = [
  {
    name: 'El piso de los Martín',
    wheels: { entrada: ['voz', 'sonda', 'luz', 'pir'], control: ['directo', 'rele', 'inversor'], salida: ['lampara', 'electrovalvula', 'motor_sub', 'motor_baj'] },
    deseos: [
      // voz → relé → lámpara (la cadena base con barrera de potencia)
      { id: 'c1d1', text: '"Alexia, enciende la luz del salón"', correct: { entrada: 'voz', control: 'rele', salida: 'lampara' }, scene: 'luz',
        tut: 'Gira las ruedas: el COMANDO DE VOZ en ENTRADA, el RELÉ en CONTROL (mis 24V no pueden con los 230V) y la LÁMPARA en SALIDA. Luego pulsa Play.' },
      // sonda → relé → electroválvula (un sensor, no una voz, dispara la rutina)
      { id: 'c1d2', text: '"Si detectas agua en la cocina, corta el agua"', correct: { entrada: 'sonda', control: 'rele', salida: 'electrovalvula' }, scene: 'agua',
        tut: 'Aquí nadie lo dice: lo detecta un SENSOR. La sonda va en la misma rueda que la voz. El agua la corta la electroválvula.' },
      // sensor de luz → inversor → motor ▲ (motor = inversor + dirección)
      { id: 'c1d3', text: '"Sube la persiana por la mañana"', correct: { entrada: 'luz', control: 'inversor', salida: 'motor_sub' }, scene: 'persiana',
        tut: 'El motor necesita un INVERSOR y una dirección. Para subir, elige Motor ▲.' },
    ],
  },
  {
    name: 'La casa de Doña Carmen',
    wheels: { entrada: ['voz', 'sonda', 'luz', 'viento', 'pir'], control: ['directo', 'rele', 'inversor'], salida: ['lampara', 'electrovalvula', 'enchufe', 'motor_sub', 'motor_baj'] },
    deseos: [
      // voz → relé → lámpara, pero APAGAR (mismo cableado, distinto resultado)
      { id: 'c2d1', text: '"Alexia, apaga las luces del salón"', correct: { entrada: 'voz', control: 'rele', salida: 'lampara' }, scene: 'luz', off: true },
      // PIR (presencia) → relé → lámpara (el disparador es movimiento, no voz ni sonda)
      { id: 'c2d2', text: '"Enciende la luz del pasillo cuando alguien pase"', correct: { entrada: 'pir', control: 'rele', salida: 'lampara' }, scene: 'luz',
        tut: 'Esto no lo activa una voz ni el agua: lo activa el MOVIMIENTO. Usa el detector PIR de presencia en ENTRADA.' },
      // anemómetro → inversor → motor ▲ (recoger toldo = subirlo)
      { id: 'c2d3', text: '"Recoge el toldo si se levanta viento"', correct: { entrada: 'viento', control: 'inversor', salida: 'motor_sub' }, scene: 'toldo' },
      // sensor de luz → relé → estufa (carga 230V de enchufe, no motor)
      { id: 'c2d4', text: '"Enciende la estufa del porche al anochecer"', correct: { entrada: 'luz', control: 'rele', salida: 'enchufe' }, scene: 'estufa' },
      // decoy: sin actuador
      { id: 'c2d5', text: '🎵 "Alexia, pon reggaeton cuando cocino"', decoy: true, joke: '¿Un actuador para poner reggaeton? Eso lo hago yo sola 🎶' },
    ],
  },
  {
    name: 'El chalet de los Ríos',
    wheels: { entrada: ['voz', 'sonda', 'luz', 'viento', 'pir', 'pulsador'], control: ['directo', 'rele', 'inversor', 'doble_sin'], salida: ['lampara', 'electrovalvula', 'enchufe', 'motor_sub', 'motor_baj', 'motor_amb'] },
    deseos: [
      // sensor de luz → inversor → motor ▼ (la otra dirección del motor)
      { id: 'c3d1', text: '"Baja la persiana del salón cuando el sol pegue fuerte"', correct: { entrada: 'luz', control: 'inversor', salida: 'motor_baj' }, scene: 'persiana',
        tut: 'Misma persiana, pero ahora BAJAR. El inversor cambia el sentido del motor: elige Motor ▼.' },
      // pulsador → inversor → motor (sube o baja) — manual, dos sentidos con enclavamiento
      { id: 'c3d2', text: '"Quiero un botón para subir y bajar el toldo"', correct: { entrada: 'pulsador', control: 'inversor', salidaAny: ['motor_sub', 'motor_baj'] }, scene: 'toldo',
        tut: 'No es voz ni sensor: es un PULSADOR físico. El inversor con enclavamiento deja mandar en los dos sentidos sin cruzar los cables.' },
      // sonda → relé → electroválvula (refuerza el caso de fuga, otra estancia)
      { id: 'c3d3', text: '"Si hay fuga en el baño, corta el agua"', correct: { entrada: 'sonda', control: 'rele', salida: 'electrovalvula' }, scene: 'agua' },
      // decoys
      { id: 'c3d4', text: '🎂 "Recuérdame felicitar el cumple de mi jefe"', decoy: true, joke: 'Recordatorio anotado. Eso no necesita actuador — lo hago yo sola 📅' },
      { id: 'c3d5', text: '🔊 "Alexia, pon mi podcast a las 8"', decoy: true, joke: 'Le doy al play yo sola, sin cables ni relés 🎧' },
    ],
  },
];

/* ─── Estado ─── */
let state = { casaIdx: 0, deseoIdx: 0, cur: { entrada: null, control: null, salida: null }, screen: 'INTRO', busy: false };

const $ = id => document.getElementById(id);
const overlays = ['overlay-intro', 'overlay-casa', 'overlay-error', 'overlay-parte', 'overlay-results'];
function showOverlay(id) { overlays.forEach(o => $(o).classList.toggle('hidden', o !== id)); }
function hideOverlays() { overlays.forEach(o => $(o).classList.add('hidden')); }

/* ════════════════════════════════════════════════
   CONFIGURA — dial
════════════════════════════════════════════════ */
const ITEM_H = 44;

function startCasa(idx) {
  titleScreen = false;
  if (titleGreetTimer) { clearInterval(titleGreetTimer); titleGreetTimer = null; }
  setPose('config');
  state.casaIdx = idx; state.deseoIdx = 0;
  const casa = CASAS[idx];
  $('casa-badge').textContent = `CASA ${idx + 1}/3`;
  $('casa-title').textContent = casa.name;
  $('casa-desc').textContent = `${casa.deseos.length} deseos. Marca la combinación de cada uno y dale a Play.`;
  setMood('happy'); setBanner('CONFIGÚRAME');
  showOverlay('overlay-casa');
}

function enterConfig() {
  faceFront = false; setPose('config');
  document.documentElement.className = 'gameplay';
  hideOverlays();
  $('scene').classList.remove('show'); resetScene();
  $('config').classList.remove('hidden');
  buildWheels(CASAS[state.casaIdx]);
  loadDeseo(0);
  setMood('happy');
}

function wheelItemHTML(t) {
  const icon = t.img
    ? `<img class="t-img" src="${t.img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"><span class="w-emoji" style="display:none">${t.emoji}</span>`
    : `<span class="w-emoji">${t.emoji}</span>`;
  return `${icon}<span class="w-label">${t.s || t.label}</span>`;
}

function buildWheels(casa) {
  ['entrada', 'control', 'salida'].forEach(type => {
    const scroll = $('wheel-' + type).querySelector('.wheel-scroll');
    scroll.innerHTML = '';
    const padA = document.createElement('div'); padA.className = 'wheel-pad'; scroll.appendChild(padA);
    casa.wheels[type].forEach((id, i) => {
      const it = document.createElement('div');
      it.className = 'wheel-item'; it.dataset.id = id; it.dataset.idx = i;
      it.innerHTML = wheelItemHTML(TILES[id]);
      scroll.appendChild(it);
    });
    const padB = document.createElement('div'); padB.className = 'wheel-pad'; scroll.appendChild(padB);
    scroll.onscroll = () => onWheelScroll(type);
  });
}

function onWheelScroll(type) {
  const scroll = $('wheel-' + type).querySelector('.wheel-scroll');
  const opts = CASAS[state.casaIdx].wheels[type];
  let idx = Math.round(scroll.scrollTop / ITEM_H);
  idx = Math.max(0, Math.min(opts.length - 1, idx));
  state.cur[type] = opts[idx];
  scroll.querySelectorAll('.wheel-item').forEach(el => el.classList.toggle('active', +el.dataset.idx === idx));
}

function setWheel(type, idx) {
  const scroll = $('wheel-' + type).querySelector('.wheel-scroll');
  scroll.scrollTop = idx * ITEM_H;
  onWheelScroll(type);
}

function loadDeseo(idx) {
  state.deseoIdx = idx;
  state.screen = 'CONFIG';
  const casa = CASAS[state.casaIdx];
  const deseo = casa.deseos[idx];
  $('hud-left').textContent = `Casa ${state.casaIdx + 1}/3 · Deseo ${idx + 1}/${casa.deseos.length}`;
  $('wish-text').textContent = deseo.text;
  $('dia-caption').textContent = deseo.decoy ? 'Gira… o pulsa Play y veamos qué hace 😏' : '';

  const hint = $('tutorial-hint');
  if (state.casaIdx === 0 && deseo.tut) { hint.textContent = deseo.tut; hint.classList.remove('hidden'); }
  else hint.classList.add('hidden');

  // ruedas a su valor inicial (índice 1: arranca con la 2ª opción, menos espacio vacío)
  ['entrada', 'control', 'salida'].forEach(type => {
    const opts = casa.wheels[type];
    setWheel(type, Math.min(1, opts.length - 1));
  });
  // restaurar visibilidad de la UI de configuración
  $('config').classList.remove('playing');
  state.busy = false;
}

/* ════════════════════════════════════════════════
   PLAY — ejecutar y ver el resultado
════════════════════════════════════════════════ */
function onPlay() {
  if (state.busy) return;
  state.busy = true;
  const deseo = CASAS[state.casaIdx].deseos[state.deseoIdx];
  const cfg = { ...state.cur };
  const res = evalDeseo(deseo, cfg);

  // limpiar la UI de configuración y mover a Alexia a la esquina → protagonismo de la escena
  $('config').classList.add('playing');
  setPose('play');
  // estado de partida de la escena: si el deseo es "apaga", la luz arranca encendida
  $('lamp-glow').classList.toggle('on', deseo.scene === 'luz' && !!deseo.off);
  // persiana/toldo arrancan en la posición opuesta a la pedida, para que se vea el movimiento
  if (deseo.scene === 'persiana' || deseo.scene === 'toldo') {
    const el = $(deseo.scene === 'persiana' ? 'blind-persiana' : 'awning-toldo');
    el.classList.remove('up', 'down', 'storm');
    const dir = deseo.correct && deseo.correct.salida;
    if (dir === 'motor_sub') el.classList.add('down');      // pedías subir → arranca bajada
    else if (dir === 'motor_baj') el.classList.add('up');   // pedías bajar → arranca subida
  }
  $('scene').classList.add('show');
  setMood('listening'); setBanner('RECIBIDO');
  vibrate('medium');

  setTimeout(() => {
    animateConsequence(deseo, res, cfg);
    if (res.status === 'ok') {
      setMood('celebrating'); setBanner('¡HECHO!'); vibrate('success');
      const msgs = ['¡Justo lo que pedía! ✓', '¡Como un guante! ✓', '¡Eso es! ✓', '¡Funciona! ✓'];
      showToast(msgs[state.deseoIdx % msgs.length], 'ok');
      setTimeout(advance, 2600);
    } else if (res.status === 'neutral') {
      setMood('happy'); setBanner('YO SOLA');
      showToast(deseo.joke || 'Eso ya lo hago yo sola 😏', 'fun');
      setTimeout(advance, 2800);
    } else if (res.status === 'burn') {
      setMood('worried'); setBanner('MOTOR KO'); vibrate('heavy', [0, 200, 80, 200, 80, 200]);
      showToast('¡El motor se ha quemado! ✗', 'ko');
      setTimeout(() => showError(res.reason), 3200);
    } else {
      setMood('worried'); setBanner('SIN POTENCIA'); vibrate('error', [0, 150, 80, 150]);
      showToast('No pasó nada… ✗', 'ko');
      setTimeout(() => showError(res.reason), 3200);
    }
  }, 520);
}

function advance() {
  const casa = CASAS[state.casaIdx];
  if (state.deseoIdx < casa.deseos.length - 1) {
    hideToast();
    $('scene').classList.remove('show');
    $('config').classList.remove('playing'); setPose('config');
    setMood('happy'); setBanner('CONFIGÚRAME');
    setTimeout(() => loadDeseo(state.deseoIdx + 1), 320);
  } else {
    casaComplete();
  }
}

function retry() {
  hideOverlays(); hideToast();
  $('scene').classList.remove('show'); resetScene();
  $('config').classList.remove('playing'); setPose('config');
  setMood('happy'); setBanner('CONFIGÚRAME');
  $('dia-caption').textContent = '';
  state.busy = false;
}

function casaComplete() {
  state.screen = 'PARTE';
  document.documentElement.className = 'results';
  hideToast();
  $('scene').classList.remove('show');
  saveProgress(state.casaIdx + 1, state.casaIdx === CASAS.length - 1);
  $('parte-title').textContent = `Casa entregada: ${CASAS[state.casaIdx].name}`;
  const btn = $('btn-parte');
  const last = state.casaIdx === CASAS.length - 1;
  btn.textContent = last ? 'Ver resultado' : 'Siguiente casa';
  btn.onclick = () => { if (last) showResults(); else startCasa(state.casaIdx + 1); };
  setMood('celebrating'); setBanner('OK'); jumpT = JUMP_DUR;
  showOverlay('overlay-parte');
}

function showResults() {
  state.screen = 'RESULTS';
  document.documentElement.className = 'results';
  setMood('celebrating'); setBanner('LISTO'); jumpT = JUMP_DUR;
  showOverlay('overlay-results');
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
}

/* ─── Evaluación ─── */
function evalDeseo(deseo, cfg) {
  if (deseo.decoy) return { status: 'neutral' };
  const c = deseo.correct;
  if (cfg.salida === 'motor_amb' || (isMotor(cfg.salida) && cfg.control === 'doble_sin'))
    return { status: 'burn', reason: reasonObj(deseo, cfg) };
  const salidaOk = cfg.salida === c.salida || (c.salidaAny && c.salidaAny.includes(cfg.salida));
  const ok = cfg.entrada === c.entrada && cfg.control === c.control && salidaOk;
  return ok ? { status: 'ok' } : { status: 'fail', reason: reasonObj(deseo, cfg) };
}

function correctSalidaLabel(c) { return c.salidaAny ? 'Motor (sube o baja)' : label(c.salida); }
function correctDirWord(c) { const id = c.salida || (c.salidaAny ? c.salidaAny[0] : ''); return id === 'motor_baj' ? 'Motor ▼ (bajada)' : 'Motor ▲ (subida)'; }

function reasonObj(deseo, cfg) {
  const c = deseo.correct;
  // motor: ambas / sin enclavamiento
  if (cfg.salida === 'motor_amb')
    return { what: 'Energizaste subida y bajada a la vez (Motor ↕).', why: 'Eso cruza los devanados del motor.', rule: 'Cortocircuito → motor quemado. El inversor lleva enclavamiento justo para impedirlo.', todo: 'Elige una sola dirección: Motor ▲ o Motor ▼.' };
  if (isMotor(cfg.salida) && cfg.control === 'doble_sin')
    return { what: 'Usaste un doble pulsador sin enclavamiento.', why: 'Permite activar las dos líneas a la vez.', rule: 'Sin enclavamiento hay riesgo de cortocircuito. El inversor lo impide.', todo: 'Pon Inversor c/encl. en CONTROL.' };
  // entrada
  if (cfg.entrada !== c.entrada)
    return { what: `Pusiste ${label(cfg.entrada)} como disparador.`, why: `Esto lo detecta ${label(c.entrada)}.`, rule: 'La voz y los sensores son entradas, pero cada deseo pide la suya.', todo: `Marca ${label(c.entrada)} en ENTRADA.` };
  // salida
  const salidaOk = cfg.salida === c.salida || (c.salidaAny && c.salidaAny.includes(cfg.salida));
  if (!salidaOk) {
    if (isMotor(cfg.salida) && (isMotor(c.salida) || c.salidaAny))
      return { what: 'El motor giró al revés.', why: 'Activaste la línea contraria.', rule: 'El motor cambia de sentido según la línea (subida/bajada).', todo: `Elige ${correctDirWord(c)}.` };
    return { what: `Pusiste ${label(cfg.salida)} como actuador.`, why: `Esto lo ejecuta ${correctSalidaLabel(c)}.`, rule: 'El actuador tiene que coincidir con la acción pedida.', todo: `Marca ${correctSalidaLabel(c)} en SALIDA.` };
  }
  // control
  if (cfg.control === 'directo')
    return { what: 'Conectaste en Directo (sin relé).', why: 'Mis 24V de control no pueden con los 230V.', rule: 'El relé es la barrera entre el control y la potencia.', todo: 'Pon Relé en CONTROL.' };
  return { what: `Pusiste ${label(cfg.control)} en el control.`, why: 'No es el control adecuado para esta carga.', rule: 'On/off de 230V → Relé. Motor → Inversor.', todo: `Pon ${label(c.control)} en CONTROL.` };
}

/* ─── Escena ─── */
function resetScene() {
  $('scene').classList.remove('cut');
  $('flood').classList.remove('on');
  $('valve').classList.remove('closed');
  $('lamp-glow').classList.remove('on');
  $('heater').classList.remove('on');
  $('smoke').classList.remove('on');
  ['blind-persiana', 'awning-toldo'].forEach(id => $(id).classList.remove('up', 'down', 'storm'));
}

function animateConsequence(deseo, res, cfg) {
  resetScene();
  if (res.status === 'burn') { $('smoke').classList.add('on'); return; }
  const sc = deseo.scene;
  const ok = res.status === 'ok';
  if (sc === 'agua') { if (ok) { $('valve').classList.add('closed'); $('scene').classList.add('cut'); } else $('flood').classList.add('on'); }
  else if (sc === 'luz') {
    // "apaga": correcto → luz OFF; fallo → sigue encendida.  "enciende": correcto → ON; fallo → OFF.
    const lampOn = deseo.off ? !ok : ok;
    $('lamp-glow').classList.toggle('on', lampOn);
  }
  else if (sc === 'estufa') { $('heater').classList.toggle('on', ok); }
  else if (sc === 'persiana' || sc === 'toldo') {
    const el = $(sc === 'persiana' ? 'blind-persiana' : 'awning-toldo');
    if (isMotor(cfg.salida)) {
      el.classList.add(cfg.salida === 'motor_baj' ? 'down' : 'up');
      if (!ok && sc === 'toldo') el.classList.add('storm');
    } else if (sc === 'toldo') { el.classList.add('storm'); }
  } else if (res.status === 'neutral') {
    $('lamp-glow').classList.add('on'); setTimeout(() => $('lamp-glow').classList.remove('on'), 500);
  }
}

/* ─── localStorage ─── */
function saveProgress(maxCasa, completed) {
  try {
    const cur = JSON.parse(localStorage.getItem('alexia_asistente_domotica_record') || '{}');
    localStorage.setItem('alexia_asistente_domotica_record', JSON.stringify({ maxCasa: Math.max(maxCasa, cur.maxCasa || 0), completado: completed || cur.completado || false }));
  } catch (e) {}
}

/* ─── Feedback overlay ─── */
function showError(r) {
  $('err-what').textContent = r.what;
  $('err-why').textContent = r.why;
  $('err-rule').textContent = r.rule;
  $('err-do').textContent = r.todo;
  setMood('worried');
  showOverlay('overlay-error');
}

function resetGame() { document.documentElement.className = 'gameplay'; startCasa(0); }

/* ════════════════════════════════════════════════
   ALEXIA — modelo 3D (Three.js, primitivas)
════════════════════════════════════════════════ */
let alexiaMood = 'happy';
let faceFront = false;
let titleScreen = false;
let jumpT = 0, celebrateSpinT = 0, wobbleT = 0, bounceT = 0;
const BOUNCE_DUR = 0.7;
let alexiaBaseY = -0.2;
// pose objetivo (se interpola en animate): config = grande y centrada, play = mitad y en esquina, title = saludo
const POSE = {
  title:  { scale: 0.78, x: 0.0,  y: 0.55 },
  config: { scale: 0.92, x: 0.0,  y: 0.10 },
  play:   { scale: 0.36, x: -0.55, y: 1.7 },
};
let pose = POSE.config;
function setPose(name) { pose = POSE[name] || POSE.config; alexiaBaseY = pose.y; }
const JUMP_DUR = 0.55;
let bannerCanvas, bannerCtx, bannerTex, ringMat;

const MOOD_COLOR = {
  happy:       new THREE.Color(0x00E6BC),
  listening:   new THREE.Color(0x35F0D0),
  celebrating: new THREE.Color(0x04FFB4),
  worried:     new THREE.Color(0xE74C3C),
};

function setMood(m) {
  if (m === alexiaMood) { if (m === 'celebrating') { celebrateSpinT = 1.0; jumpT = JUMP_DUR; bounceT = BOUNCE_DUR; } applyFallbackMood(); return; }
  alexiaMood = m;
  if (m === 'celebrating') { celebrateSpinT = 1.0; jumpT = JUMP_DUR; bounceT = BOUNCE_DUR; }
  if (m === 'worried') { wobbleT = 0.7; }
  applyFallbackMood();
}

function setBanner(text) {
  if (bannerCtx) drawBanner(text);
  const fb = $('fb-banner'); if (fb) fb.textContent = text;
}

let toastTimer = null;
function showToast(text, kind) {
  const el = $('reward-toast');
  if (!el) return;
  el.textContent = text;
  el.className = 'reward-toast ' + (kind || 'ok');
  // reiniciar animación
  void el.offsetWidth;
  el.classList.add('show');
}
function hideToast() {
  const el = $('reward-toast'); if (!el) return;
  el.classList.remove('show'); el.className = 'reward-toast';
}

function drawBanner(text) {
  const w = bannerCanvas.width, h = bannerCanvas.height;
  // sin panel: fondo transparente, el texto se "imprime" directo sobre la superficie
  bannerCtx.clearRect(0, 0, w, h);
  const col = alexiaMood === 'worried' ? '#ff6b5e' : (alexiaMood === 'celebrating' ? '#7dffd0' : '#46f0d6');
  // ajustar tamaño de fuente al ancho disponible (textos largos como "HOLA, SOY ALEXIA")
  let size = 190;
  bannerCtx.textAlign = 'center'; bannerCtx.textBaseline = 'middle';
  do {
    bannerCtx.font = `${size}px VT323, monospace`;
    if (bannerCtx.measureText(text).width <= w - 24) break;
    size -= 8;
  } while (size > 60);
  bannerCtx.fillStyle = col;
  bannerCtx.shadowColor = col; bannerCtx.shadowBlur = 18;
  bannerCtx.fillText(text, w / 2, h / 2 + 4);
  bannerCtx.shadowBlur = 0;
  if (bannerTex) bannerTex.needsUpdate = true;
}

function initThree() {
  const canvas = $('alexia-canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { enableFallback(); return; }
  if (!renderer || !renderer.getContext()) { enableFallback(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6.2); camera.lookAt(0, 0, 0);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  scene.add(new THREE.HemisphereLight(0xFFF4E0, 0x16305f, 0.7));
  const key = new THREE.DirectionalLight(0xFFFDF0, 1.15); key.position.set(4, 7, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xAAD0FF, 0.4); fill.position.set(-5, -1, -3); scene.add(fill);

  const g = new THREE.Group(); g.scale.setScalar(POSE.config.scale); scene.add(g);

  const fabric = new THREE.MeshStandardMaterial({ color: 0xB9C0C9, roughness: 0.95 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0B214A, roughness: 0.6, metalness: 0.1 });

  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), fabric);
  dome.position.y = -0.05; g.add(dome);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.08, 0.5, 48), baseMat);
  base.position.y = -0.62; g.add(base);

  ringMat = new THREE.MeshStandardMaterial({ color: 0x00E6BC, emissive: new THREE.Color(0x00E6BC), emissiveIntensity: 1.0, roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.07, 16, 64), ringMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = -0.36; g.add(ring);

  bannerCanvas = document.createElement('canvas'); bannerCanvas.width = 680; bannerCanvas.height = 240;
  bannerCtx = bannerCanvas.getContext('2d');
  bannerTex = new THREE.CanvasTexture(bannerCanvas); bannerTex.anisotropy = 4;
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 0.46), bannerMat);
  banner.position.set(0, -0.04, 1.0); banner.rotation.x = -0.02; g.add(banner);
  drawBanner('HOLA');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawBanner($('fb-banner') ? $('fb-banner').textContent : 'HOLA'));

  const clock = new THREE.Clock();
  let t = 0; let curScale = POSE.config.scale; let curX = 0; const tmp = new THREE.Color();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05); t += dt;

    tmp.copy(MOOD_COLOR[alexiaMood] || MOOD_COLOR.happy);
    ringMat.color.lerp(tmp, 0.12); ringMat.emissive.lerp(tmp, 0.12);
    ringMat.emissiveIntensity = alexiaMood === 'listening' ? (0.7 + 0.4 * Math.sin(t * 6)) : (alexiaMood === 'worried' ? (0.6 + 0.3 * Math.sin(t * 4)) : 1.0);

    if (celebrateSpinT > 0) { celebrateSpinT -= dt; g.rotation.y += dt * 6; }
    else if (titleScreen) { g.rotation.y += dt * 2.4; } // giro con personalidad
    else if (faceFront || alexiaMood === 'listening' || alexiaMood === 'worried') {
      let y = g.rotation.y % (Math.PI * 2); if (y > Math.PI) y -= Math.PI * 2; if (y < -Math.PI) y += Math.PI * 2;
      g.rotation.y -= y * 0.12;
    } else {
      g.rotation.y += (Math.sin(t * 0.6) * 0.32 - g.rotation.y) * 0.06;
    }

    // objetivo X/Y: en "play" se ancla a la esquina sup-izq según el frustum real (adaptable a cualquier pantalla)
    let targetX = pose.x, targetY = alexiaBaseY;
    if (pose === POSE.play) {
      const halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
      const halfW = halfH * camera.aspect;
      // extensión de Alexia respecto al origen del grupo (dome arriba, base abajo)
      const rx = 1.1 * pose.scale;            // medio ancho
      const topExt = 1.0 * pose.scale;        // cuánto sobresale la cúpula por encima del origen
      targetX = -halfW + rx + 0.12;           // pegada al borde izquierdo con margen
      targetY = halfH - topExt - 0.12;        // la cúpula justo bajo el borde superior
    }

    // interpolar pose (escala + posición) hacia el objetivo actual
    curScale += (pose.scale - curScale) * 0.12;
    curX += (targetX - curX) * 0.12;

    let hop = 0, pulse2 = 0;
    if (jumpT > 0) { jumpT -= dt; const p = 1 - jumpT / JUMP_DUR; hop = Math.sin(p * Math.PI) * 0.4; pulse2 = 0.10 * Math.sin(p * Math.PI); }
    g.position.y += (targetY + hop - g.position.y) * 0.3;

    // squash & stretch al celebrar (rebote elástico vertical)
    let sy = 1, sxz = 1;
    if (bounceT > 0) {
      bounceT -= dt; const p = 1 - bounceT / BOUNCE_DUR;
      const e = Math.sin(p * Math.PI * 3) * Math.pow(1 - p, 1.6); // oscilación amortiguada
      sy = 1 + 0.28 * e; sxz = 1 - 0.20 * e;
    }
    const s = curScale + 0.01 * Math.sin(t * 2) + pulse2;
    g.scale.set(s * sxz, s * sy, s * sxz);

    let wob = 0;
    if (wobbleT > 0) { wobbleT -= dt; const k = wobbleT / 0.5; g.rotation.z = Math.sin(t * 38) * 0.09 * k; wob = Math.sin(t * 34) * 0.05 * k; }
    else { g.rotation.z *= 0.85; }
    g.position.x = curX + wob;

    renderer.render(scene, camera);
  }
  animate();
}

function enableFallback() { $('alexia-canvas').classList.add('hidden'); $('alexia-fallback').classList.remove('hidden'); }
function applyFallbackMood() {
  const r = $('fb-ring'); if (!r) return;
  const c = alexiaMood === 'worried' ? '#E74C3C' : alexiaMood === 'celebrating' ? '#04FFB4' : '#00E6BC';
  r.style.borderColor = c; r.style.boxShadow = `0 0 24px ${c}88`;
}

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
function init() {
  initThree();
  $('btn-start').addEventListener('click', () => startCasa(0));
  $('btn-casa-go').addEventListener('click', enterConfig);
  $('btn-play').addEventListener('click', onPlay);
  $('btn-understood').addEventListener('click', retry);
  $('btn-replay').addEventListener('click', resetGame);
  enterTitle();
}

function enterTitle() {
  titleScreen = true; faceFront = false; setPose('title');
  showOverlay('overlay-intro');
  setMood('happy'); setBanner('HOLA, SOY ALEXIA');
  // pequeño saludo cada pocos segundos
  if (titleGreetTimer) clearInterval(titleGreetTimer);
  jumpT = JUMP_DUR; bounceT = BOUNCE_DUR;
  titleGreetTimer = setInterval(() => { if (titleScreen) { jumpT = JUMP_DUR; bounceT = BOUNCE_DUR; } }, 3200);
}
let titleGreetTimer = null;

init();
