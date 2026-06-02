/* ============================================================
   El Gremlin de la Instalación — S3D4-PM
   PLC / relé programable — automatismos básicos y lenguaje de contactos.
   Mecánica: armar un peldaño de ladder (drag bandeja→ranuras) + RUN
   que ejecuta un pulso de corriente; muere en el fallo, completa si OK.
   Vanilla HTML5/CSS3/JS. Sin frameworks.
   ============================================================ */

'use strict';

/* ---------- Constantes ---------- */
const RECORD_KEY    = 'el_gremlin_de_la_instalacion_record';
const TUTORIAL_KEY  = 'el_gremlin_tutorial_done';
const TASK_THRESHOLD = 490;   // ≥70% de 700
const MAX_SCORE = 700;
const START_LIVES = 5;

/* ---------- Assets (Cloudinary, cloud name: kampe) ---------- */
const CDN = 'https://res.cloudinary.com/kampe/image/upload/';
const AVATAR = {
  happy:       CDN + 'v1780330498/gremlin_happy_asks77.png',
  celebrating: CDN + 'v1780330498/gremlin_celebrating_pdurzn.png',
  worried:     CDN + 'v1780330499/gremlin_worried_jhu3re.png',
};

/* ============================================================
   Definición de símbolos
   id formato "TIPO:etiqueta"  →  NA:I1 | NC:I1 | Q:Q1 | TON:3 | NA:M1 ...
   role: 'contact' (NA/NC, va a entrada) | 'coil' (Q, va a salida) | 'timer' (TON)
   ============================================================ */

function parseSym(id){
  const [type, tag] = id.split(':');
  let role;
  if(type === 'Q')      role = 'coil';
  else if(type === 'TON') role = 'timer';
  else                  role = 'contact';   // NA / NC
  const isMark = tag && tag[0] === 'M';
  return { id, type, tag, role, isMark };
}

const SYM_INFO = {
  NA: { name:'Contacto NA (Normalmente Abierto)',
        desc:'Condición de ENTRADA (I). Abierto en reposo: deja pasar la corriente SOLO cuando se activa (al pulsar/detectar). Va en el lado de entrada del peldaño.' },
  NC: { name:'Contacto NC (Normalmente Cerrado)',
        desc:'Condición de ENTRADA (I). Cerrado en reposo: deja pasar la corriente en reposo y la corta al activarse. Se usa en seguridad (fail-safe).' },
  Q:  { name:'Bobina (salida Q)',
        desc:'SALIDA: la acción que se ejecuta (una lámpara, un motor, una sirena). Va al final de la línea, pegada al raíl N.' },
  TON:{ name:'Temporizador TON',
        desc:'Añade tiempo a la lógica. Cuenta el tiempo (PT) y luego deja pasar o corta. Sin él, nada se apaga solo.' },
  M:  { name:'Marca interna (M)',
        desc:'Memoria interna del PLC. No sale físicamente: guarda un estado o condición para usarlo en la lógica.' },
};

/* Etiqueta corta en lenguaje humano que se muestra DEBAJO de cada símbolo en la bandeja.
   La salida correcta (Q1) toma su nombre del escenario del nivel (lámpara, riego, sirena…);
   el resto de bobinas (Q2, distractor) son "salida" genérica. */
function humanLabel(sym){
  const s = parseSym(sym);
  const lvl = LEVELS[S.level];
  if(s.role === 'coil'){
    return (s.tag === 'Q1' && lvl && lvl.out) ? lvl.out : 'salida';
  }
  if(s.role === 'timer') return (s.tag && s.tag !== '0') ? 'temporizador' : 'temporiz. (sin tiempo)';
  // contactos (incluye marcas M, que se cablean como contacto de entrada)
  const tipo = s.type === 'NA' ? 'abierto en reposo' : 'cerrado en reposo';
  // si el nivel describe ese tag en lenguaje humano, mostrarlo (p. ej. "pulsador subir")
  const desc = lvl && lvl.tags && lvl.tags[s.tag];
  if(desc) return desc + ' · ' + tipo;
  if(s.isMark) return 'marca interna · ' + tipo;
  return 'entrada · ' + tipo;
}

/* Glosario de siglas — usado en la leyenda permanente y en la intro */
const GLOSARIO = [
  ['L1 · 24Vdc', 'Raíl de alimentación (positivo). Por aquí entra la corriente al peldaño, a 24 voltios de corriente continua.'],
  ['N · 0V',     'Raíl de retorno (neutro / 0 voltios). La corriente sale por aquí para cerrar el circuito.'],
  ['I (I1, I2…)','ENTRADA: una señal que INFORMA al PLC (un pulsador, un sensor). Se representa con un contacto.'],
  ['Q (Q1, Q2…)','SALIDA: lo que el PLC ACTIVA (una lámpara, un motor, una sirena). Se representa con una bobina.'],
  ['M (M1, M2…)','MARCA interna: memoria del PLC. No sale físicamente; guarda un estado para la lógica.'],
  ['Contacto NA','Normalmente Abierto: en reposo NO pasa corriente; cierra al activarse (al pulsar).'],
  ['Contacto NC','Normalmente Cerrado: en reposo SÍ pasa corriente; abre al activarse. Se usa en seguridad.'],
  ['Bobina ( )', 'La salida (Q). Se enciende cuando le llega corriente. Va al final de la línea.'],
  ['TON',        'Temporizador "a la conexión": cuenta un tiempo y luego actúa (p. ej. apaga la luz).'],
  ['PT',         'Preset Time: el tiempo que cuenta el temporizador (3 min, 5 min…).'],
];

/* ============================================================
   Niveles (ver GDD §5.2). slots en orden L1→N.
   slot tipos: 'in' (entrada/contacto) | 'timer' | 'out' (salida/bobina)
   answer[i] = símbolo correcto en slots[i].
   ============================================================ */

const LEVELS = [
  { need:'La lámpara se enciende al pulsar.',
    slots:['in','out'],            answer:['NA:I1','Q:Q1'],            distractors:['Q:Q2'],            scene:'lampara',       out:'salida (lámpara)', noun:'la lámpara', act:'encender' },
  { need:'La luz del trastero se enciende con el pulsador.',
    slots:['in','out'],            answer:['NA:I1','Q:Q1'],            distractors:['NA:I2','Q:Q2'],    scene:'lampara',       out:'salida (luz)',     noun:'la luz', act:'encender' },
  { need:'Luz de escalera: al pulsar, enciende y se apaga sola a los 3 min.',
    slots:['in','timer','out'],    answer:['NA:I1','TON:3','Q:Q1'],    distractors:['Q:Q2'],            scene:'lampara_timer', out:'salida (luz)',     noun:'la luz', act:'encender' },
  { need:'Riego del jardín: al pulsar, riega 5 min y para solo.',
    slots:['in','timer','out'],    answer:['NA:I1','TON:5','Q:Q1'],    distractors:['TON:0','NA:I2'],   scene:'aspersor',      out:'salida (riego)',   noun:'el riego', act:'activarse' },
  { need:'Alarma de puerta: el sensor está cerrado en reposo; al abrir, salta la sirena.',
    slots:['in','out'],            answer:['NC:I1','Q:Q1'],            distractors:['NA:I1'],           scene:'sirena',        out:'salida (sirena)',  noun:'la sirena', act:'sonar' },
  { need:'Luz de emergencia: si falla la tensión de red, enciende la lámpara.',
    slots:['in','out'],            answer:['NC:I1','Q:Q1'],            distractors:['NA:I1','Q:Q2'],    scene:'lampara',       out:'salida (lámpara)', noun:'la lámpara', act:'encender' },
  { need:'La persiana sube solo si es de día (sensor de luz) Y pulsas subir.',
    slots:['in','in2','out'],      answer:['NA:I1','NA:M1','Q:Q1'],    distractors:['Q:Q2','NC:I1'],    scene:'persiana',      out:'salida (motor)', noun:'la persiana', act:'subir',
    tags:{ 'I1':'pulsador subir', 'M1':'sensor de día' } },
];

/* Refuerzos de acierto por nivel (GDD §5.3) */
const SUCCESS_MSG = [
  '¡La corriente llegó! Contacto = entrada (I1), bobina = salida (Q1). ¡Lo pillé!',
  '¡Otra vez! La entrada manda, la salida ejecuta. Los distractores no me engañan.',
  '¡Mira el temporizador! Cuenta 3 min y apaga la luz solo. ¡El tiempo en la lógica!',
  '¡5 minutos regando y para! El TON manda en el tiempo, no yo.',
  '¡NC! Cerrado en reposo. Si abren la puerta o cortan el cable… ¡salta igual!',
  '¡Si falla la red, enciende! El NC vigila la ausencia. Genial.',
  '¡Los DOS contactos en serie! Día Y pulsar. Si falta uno, no sube. ¡Lógica completa!',
];

/* Mensajes de presentación de nivel (rotación) */
const PRESENT_MSG = [
  'Vale, este peldaño lo dejé hecho un lío. A ver… ¿qué pide el cliente?',
  'Otro que desordené. Léelo bien y móntalo: entrada, lógica, salida.',
  'Este me costó liarlo… ¡seguro que tú lo arreglas! Piensa la lógica primero.',
];

/* Feedback educativo por tipo de error (GDD §5.4) */
const EDU = {
  coil_in:   { did:'Pusiste una bobina (salida Q) donde va la condición de entrada',
               why:'Una salida no informa, ejecuta. No puede ser la condición que activa la línea',
               rule:'Los contactos (I/M) van a la entrada; la bobina (Q) va al final',
               do:'Pon un contacto en la entrada y deja la bobina para el final',
               bubble:'¡Uy! Puse una salida donde va la condición. Una bobina ejecuta, no informa… eso es una entrada.' },
  contact_out:{ did:'Terminaste la línea en un contacto, no en una bobina',
               why:'Un contacto es una condición, no ejecuta nada. La línea no acciona ninguna salida',
               rule:'Toda línea termina en una salida (bobina Q): es lo que se activa',
               do:'Pon la bobina Q al final, pegada al raíl N',
               bubble:'Mmm… la línea termina en un contacto. ¡No acciona nada! Falta la salida (la bobina Q).' },
  timer_missing:{ did:'Montaste contacto + bobina, pero sin temporizador',
               why:'{Noun} se activa… y no se para nunca. Nadie cuenta el tiempo',
               rule:'El temporizador (TON) añade tiempo a la lógica: cuenta y luego corta',
               do:'Mete el TON entre el contacto y la bobina, con su tiempo (PT)',
               bubble:'¡{Noun} se queda activada para siempre! Se me olvidó el temporizador… ¿quién cuenta el tiempo si no?' },
  timer_nopt:{ did:'Pusiste un temporizador sin definir el tiempo (PT)',
               why:'Un TON sin PT no sabe cuánto contar: no retrasa ni corta nada',
               rule:'El temporizador necesita su PT (3 min, 5 min…) para funcionar',
               do:'Usa el temporizador que trae el tiempo definido',
               bubble:'Este temporizador no tiene tiempo… ¡así no cuenta nada! Usa el que trae los minutos.' },
  na_for_nc: { did:'Pusiste un contacto NA (abierto en reposo)',
               why:'En reposo no pasa corriente; la alarma/emergencia no vigila nada hasta que se active',
               rule:'Seguridad = NC: cerrado en reposo, así detecta fallos y cortes (fail-safe)',
               do:'Cambia al contacto NC, cerrado en reposo',
               bubble:'Puse un NA donde tocaba NC. En reposo no vigila nada… ¡y la seguridad va con NC!' },
  nc_for_na: { did:'Pusiste un contacto NC (cerrado en reposo)',
               why:'La línea estaría activa todo el rato; {noun} se activaría sin pulsar',
               rule:'Acción al pulsar = NA: abierto en reposo, cierra solo al activarse',
               do:'Cambia al contacto NA, abierto en reposo',
               bubble:'Puse un NC y la línea está activa siempre… ¡{noun} se activa sin pulsar! Va un NA.' },
  missing_series:{ did:'Dejaste una sola condición; falta la otra en serie',
               why:'Se pide día Y pulsar: con una sola condición, la persiana sube cuando no debe',
               rule:'Lógica Y (AND): los dos contactos en serie, ambos deben cerrarse',
               do:'Coloca los dos contactos NA en serie antes de la bobina',
               bubble:'Solo puse una condición. El cliente pide día Y pulsar… ¡faltan los dos contactos en serie!' },
  wrong_generic:{ did:'La lógica del peldaño no coincide con lo que pide el caso',
               why:'El pulso no llega a accionar la salida correctamente',
               rule:'Piensa la secuencia completa: qué informa (entrada) y qué ejecuta (salida)',
               do:'Revisa cada ranura y vuelve a montar la línea',
               bubble:'Algo no cuadra en el peldaño… ¡revisémoslo con calma!' },
};

/* ============================================================
   Estado global
   ============================================================ */

const S = {
  level: 0,
  score: 0,
  lives: START_LIVES,
  failedThisLevel: false,
  placed: {},          // slot -> symId
  trayIds: [],         // símbolos disponibles en bandeja (no colocados)
  running: false,
  tutorialDone: false,
  tutorialStep: 0,
};

/* ============================================================
   Helpers de plataforma
   ============================================================ */

function vibrate(level, pattern){
  if(window.ReactNativeWebView){
    const msg = { action:'VIBRATE', level };
    if(pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    return;
  }
  if(navigator.vibrate){
    const map = { light:10, medium:25, heavy:50, success:[0,30,40,30], error:[0,60,40,80] };
    navigator.vibrate(pattern || map[level] || 15);
  }
}

function taskCompleted(){
  if(window.ReactNativeWebView){
    window.ReactNativeWebView.postMessage(JSON.stringify({ action:'TASK_COMPLETED' }));
  }
}

function getRecord(){ return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10); }
function setRecord(v){ localStorage.setItem(RECORD_KEY, String(v)); }

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const $ = id => document.getElementById(id);

/* ============================================================
   Cambio de pantalla
   ============================================================ */

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  document.documentElement.className = (id === 'results') ? 'results' : 'gameplay';
  window.scrollTo(0, 0);
}

/* ============================================================
   HUD / avatar / burbuja
   ============================================================ */

function renderHUD(){
  $('lives').textContent = '❤'.repeat(S.lives) + '♡'.repeat(START_LIVES - S.lives);
  $('level-label').textContent = `Nivel ${S.level + 1}/${LEVELS.length}`;
  $('score').textContent = S.score;
}

function setAvatar(state){ $('play-avatar').src = AVATAR[state] || AVATAR.happy; }

let bubbleTimer = null;
function sayBubble(text, ms){
  const b = $('play-bubble');
  if(bubbleTimer){ clearTimeout(bubbleTimer); bubbleTimer = null; }
  if(!text){ b.hidden = true; return; }
  b.textContent = text;
  b.hidden = false;
  if(ms){ bubbleTimer = setTimeout(() => { b.hidden = true; }, ms); }
}

/* ============================================================
   Render de símbolos (SVG)
   ============================================================ */

function symbolSVG(sym, energized){
  const s = parseSym(sym);
  const labelColor = s.isMark ? 'var(--m-blue)' : '#fff';
  const lab = s.tag || '';
  if(s.role === 'contact'){
    // NA: brazo separado (abierto). NC: brazo uniendo + barra diagonal.
    const arm = s.type === 'NA'
      ? '<line x1="14" y1="30" x2="34" y2="18" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'  // diagonal abierto
      : '<line x1="14" y1="30" x2="34" y2="30" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' + // cerrado horizontal
        '<line x1="20" y1="22" x2="30" y2="38" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>'; // barra NC
    return `<svg viewBox="0 0 48 48" width="46" height="46">
      <text x="24" y="10" text-anchor="middle" fill="${labelColor}" font-size="11" font-weight="700">${lab}</text>
      <line x1="6" y1="30" x2="14" y2="30" stroke="#fff" stroke-width="3"/>
      <line x1="14" y1="22" x2="14" y2="38" stroke="#fff" stroke-width="3"/>
      <line x1="34" y1="22" x2="34" y2="38" stroke="#fff" stroke-width="3"/>
      <line x1="34" y1="30" x2="42" y2="30" stroke="#fff" stroke-width="3"/>
      ${arm}
    </svg>`;
  }
  if(s.role === 'coil'){
    const fill = energized ? 'var(--lime)' : 'none';
    return `<svg viewBox="0 0 48 48" width="46" height="46">
      <text x="24" y="10" text-anchor="middle" fill="${labelColor}" font-size="11" font-weight="700">${lab}</text>
      <line x1="6" y1="30" x2="13" y2="30" stroke="#fff" stroke-width="3"/>
      <path d="M13 18 A 14 14 0 0 0 13 42" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M35 18 A 14 14 0 0 1 35 42" fill="none" stroke="#fff" stroke-width="3"/>
      <circle cx="24" cy="30" r="6" fill="${fill}" opacity="${energized?0.9:0}"/>
      <line x1="35" y1="30" x2="42" y2="30" stroke="#fff" stroke-width="3"/>
    </svg>`;
  }
  if(s.role === 'timer'){
    const pt = s.tag && s.tag !== '0' ? `PT:${s.tag}min` : 'PT:--';
    return `<svg viewBox="0 0 60 48" width="58" height="46">
      <rect x="10" y="8" width="40" height="32" rx="4" fill="none" stroke="#fff" stroke-width="2.5"/>
      <text x="30" y="22" text-anchor="middle" fill="var(--turq)" font-size="11" font-weight="800">TON</text>
      <text x="30" y="34" text-anchor="middle" fill="#fff" font-size="9">${pt}</text>
    </svg>`;
  }
  return '';
}

/* ============================================================
   Render del peldaño (raíles + cable + ranuras)
   ============================================================ */

function renderLadder(lvl){
  const wrap = $('ladder');
  wrap.innerHTML = '';

  // Raíles + etiquetas (SVG de fondo)
  const rails = document.createElement('div');
  rails.className = 'ladder-rails';
  rails.innerHTML = `<svg viewBox="0 0 320 200" preserveAspectRatio="none" width="100%" height="100%">
    <line x1="20" y1="20" x2="20" y2="180" stroke="var(--mint)" stroke-width="4"/>
    <line x1="300" y1="20" x2="300" y2="180" stroke="var(--mint)" stroke-width="4"/>
    <line x1="20" y1="100" x2="300" y2="100" stroke="var(--mint)" stroke-width="4"/>
  </svg>
  <span class="rail-label rail-l1">L1 · 24Vdc</span>
  <span class="rail-label rail-n">N · 0V</span>`;
  wrap.appendChild(rails);

  // Ranuras posicionadas sobre el cable (y=100 de 200 → 50%)
  const n = lvl.slots.length;
  lvl.slots.forEach((slotType, i) => {
    const left = 12 + (i + 0.5) * (76 / n);

    const slot = document.createElement('div');
    slot.className = 'slot' + (slotType === 'out' ? ' slot-out' : '');
    slot.dataset.slot = slotType;
    slot.style.left = left + '%';
    slot.style.top = '50%';
    wrap.appendChild(slot);
  });

  refreshSlots();
}

/* Pinta el contenido de cada ranura según S.placed */
function refreshSlots(){
  document.querySelectorAll('#ladder .slot').forEach(slot => {
    const type = slot.dataset.slot;
    const sym = S.placed[type];
    slot.classList.toggle('filled', !!sym);
    slot.innerHTML = sym ? symbolSVG(sym, false) : '';
  });
}

/* ============================================================
   Bandeja
   ============================================================ */

function renderTray(){
  const tray = $('tray');
  tray.innerHTML = '';
  S.trayIds.forEach(sym => {
    const item = document.createElement('div');
    item.className = 'tray-item';

    const el = document.createElement('div');
    el.className = 'tray-symbol';
    el.dataset.sym = sym;
    el.innerHTML = symbolSVG(sym, false);
    const dot = document.createElement('div');
    dot.className = 'info-dot';
    dot.textContent = 'i';
    dot.addEventListener('click', e => { e.stopPropagation(); openInfo(sym); });
    el.appendChild(dot);

    const cap = document.createElement('div');
    cap.className = 'tray-caption';
    cap.textContent = humanLabel(sym);

    item.appendChild(el);
    item.appendChild(cap);
    tray.appendChild(item);
  });
}

function openInfo(sym){
  const s = parseSym(sym);
  const info = SYM_INFO[s.isMark ? 'M' : s.type] || SYM_INFO[s.type];
  $('info-symbol').innerHTML = symbolSVG(sym, false);
  $('info-name').textContent = info.name;
  $('info-desc').textContent = info.desc;
  $('info-overlay').hidden = false;
}

function openGlosario(){
  const list = $('glos-list');
  if(!list.childElementCount){   // construir una sola vez
    GLOSARIO.forEach(([sigla, desc]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="glos-sigla">${sigla}</span><span class="glos-desc">${desc}</span>`;
      list.appendChild(li);
    });
  }
  $('glos-overlay').hidden = false;
}

/* ============================================================
   Drag and drop (single-touch + mouse fallback)
   ============================================================ */

const DRAG = { active:false, sym:null, origin:null, ghost:null, startX:0, startY:0, moved:false, pointerId:null };
const DRAG_THRESHOLD = 8;

function pointFromEvent(e){ return { x:e.clientX, y:e.clientY }; }

function onPointerDown(e){
  if(S.running) return;
  if(e.target.closest('.info-dot')) return;          // tap en "i" no arrastra
  const target = e.target.closest('.tray-symbol, .slot.filled');
  if(!target) return;

  const sym = target.dataset.sym || S.placed[target.dataset.slot];
  if(!sym) return;

  DRAG.active = true;
  DRAG.moved = false;
  DRAG.sym = sym;
  DRAG.origin = target.classList.contains('slot') ? { type:'slot', slot:target.dataset.slot } : { type:'tray' };
  DRAG.startX = e.clientX; DRAG.startY = e.clientY;
  DRAG.pointerId = e.pointerId;
  try{ playEl.setPointerCapture(e.pointerId); }catch(_){}
  e.preventDefault();
}

function onPointerMove(e){
  if(!DRAG.active || (DRAG.pointerId != null && e.pointerId !== DRAG.pointerId)) return;
  const p = pointFromEvent(e);
  if(!DRAG.moved){
    if(Math.hypot(p.x - DRAG.startX, p.y - DRAG.startY) < DRAG_THRESHOLD) return;
    DRAG.moved = true;
    startGhost();
  }
  moveGhost(p);
  highlightDropZone(p);
  e.preventDefault();
}

function onPointerUp(e){
  if(!DRAG.active || (DRAG.pointerId != null && e.pointerId !== DRAG.pointerId)) return;
  const p = pointFromEvent(e);

  if(DRAG.moved){
    endGhost();                       // ocultar ANTES de elementFromPoint (si no, lo intercepta)
    const slot = dropTargetSlot(p);
    if(slot){
      placeSymbol(DRAG.sym, DRAG.origin, slot.dataset.slot);
    } else {
      returnToTray(DRAG.sym, DRAG.origin);   // soltar fuera → vuelve a bandeja
    }
  }
  endGhost();
  clearDropHighlight();
  try{ playEl.releasePointerCapture(DRAG.pointerId); }catch(_){}
  DRAG.active = false; DRAG.sym = null; DRAG.origin = null; DRAG.moved = false; DRAG.pointerId = null;
}

function startGhost(){
  const g = $('drag-ghost');
  g.innerHTML = symbolSVG(DRAG.sym, false);
  g.hidden = false;
  vibrate('light');
}
function moveGhost(p){
  const g = $('drag-ghost');
  g.style.left = (p.x - 36) + 'px';
  g.style.top  = (p.y - 30) + 'px';
}
function endGhost(){ $('drag-ghost').hidden = true; }

function dropTargetSlot(p){
  const slots = Array.from(document.querySelectorAll('#ladder .slot'));
  const anyEmpty = slots.some(s => !s.classList.contains('filled'));

  // 1) ¿está justo ENCIMA de una ranura?
  const el = document.elementFromPoint(p.x, p.y);
  const direct = el ? el.closest('#ladder .slot') : null;
  // Si caes sobre una ranura, acéptala SALVO que esté ocupada y aún queden huecos
  // vacíos (en ese caso casi nunca quieres expulsar: pasamos al paso 2 → hueco).
  if(direct && !(direct.classList.contains('filled') && anyEmpty)) return direct;

  // 2) busca por cercanía priorizando ranuras VACÍAS
  //    (así soltar "cerca" del segundo hueco no expulsa al símbolo del primero)
  const dist = s => {
    const r = s.getBoundingClientRect();
    return Math.hypot(p.x - (r.left + r.width/2), p.y - (r.top + r.height/2));
  };
  const empty  = slots.filter(s => !s.classList.contains('filled'));
  const pool = empty.length ? empty : slots;   // si no hay vacías, considera todas
  // tolerancia más generosa si solo hay un hueco vacío (no hay riesgo de expulsar nada)
  const tol = empty.length ? 130 : 80;
  let best = null, bestDist = Infinity;
  pool.forEach(s => { const d = dist(s); if(d < bestDist){ bestDist = d; best = s; } });
  return (best && bestDist <= tol) ? best : null;
}
function highlightDropZone(p){
  clearDropHighlight();
  const slot = dropTargetSlot(p);
  if(slot) slot.classList.add('drop-hover');
}
function clearDropHighlight(){
  document.querySelectorAll('#ladder .slot.drop-hover').forEach(s => s.classList.remove('drop-hover'));
}

/* Coloca un símbolo en una ranura. Maneja origen (bandeja/otra ranura) y ranura ocupada. */
function placeSymbol(sym, origin, destSlot){
  // 1) quitar el símbolo de su origen
  if(origin.type === 'slot'){ delete S.placed[origin.slot]; }
  else { const i = S.trayIds.indexOf(sym); if(i >= 0) S.trayIds.splice(i, 1); }

  // 2) si la ranura destino está ocupada, su símbolo previo vuelve a la bandeja
  const prev = S.placed[destSlot];
  if(prev){ S.trayIds.push(prev); }

  // 3) colocar
  S.placed[destSlot] = sym;

  vibrate('light');
  refreshSlots();
  renderTray();
  updateRunState();
  advanceTutorial();
}

function returnToTray(sym, origin){
  if(origin.type === 'slot'){
    delete S.placed[origin.slot];
    S.trayIds.push(sym);
    refreshSlots();
    renderTray();
    updateRunState();
  }
  // si venía de la bandeja y se suelta fuera, no cambia nada
}

function updateRunState(){
  const lvl = LEVELS[S.level];
  const full = lvl.slots.every(s => S.placed[s]);
  $('btn-run').disabled = !full || S.running;
}

/* ============================================================
   Validación de la lógica + detección del tipo de error
   Devuelve { ok:true } o { ok:false, type, deadSlotIndex }
   ============================================================ */

function evaluateLadder(){
  const lvl = LEVELS[S.level];
  // Recorremos slots en orden L1→N
  for(let i = 0; i < lvl.slots.length; i++){
    const slotType = lvl.slots[i];
    const placed = S.placed[slotType];
    const correct = lvl.answer[i];
    if(placed === correct) continue;

    const ps = parseSym(placed);
    const cs = parseSym(correct);

    // --- Diagnóstico del tipo de error según slot ---
    if(slotType === 'out'){
      // En la salida debe ir una bobina; si hay contacto/timer → contact_out
      if(ps.role !== 'coil') return fail('contact_out', i);
      // bobina pero etiqueta distinta → genérico
      return fail('wrong_generic', i);
    }
    if(slotType === 'timer'){
      if(ps.role !== 'timer') return fail('timer_missing', i);
      if(ps.tag === '0' || !ps.tag) return fail('timer_nopt', i);
      return fail('wrong_generic', i);
    }
    // slot de entrada ('in' / 'in2')
    if(ps.role === 'coil') return fail('coil_in', i);          // Q usada como entrada
    if(ps.role === 'timer') return fail('wrong_generic', i);
    // es un contacto pero incorrecto: ¿tipo (NA/NC) o solo etiqueta?
    if(ps.type !== cs.type){
      return fail(cs.type === 'NC' ? 'na_for_nc' : 'nc_for_na', i);
    }
    // mismo tipo, etiqueta distinta (p. ej. NA:I1 donde iba NA:M1) → falta condición en serie
    if(lvl.slots.includes('in2')) return fail('missing_series', i);
    return fail('wrong_generic', i);
  }
  return { ok:true };

  function fail(type, idx){ return { ok:false, type, deadSlotIndex:idx }; }
}

/* ============================================================
   RUN — simulación del pulso
   ============================================================ */

function runLadder(){
  if(S.running) return;
  const lvl = LEVELS[S.level];
  if(!lvl.slots.every(s => S.placed[s])) return;

  S.running = true;
  $('btn-run').disabled = true;
  vibrate('medium');

  const result = evaluateLadder();
  const slots = Array.from(document.querySelectorAll('#ladder .slot'));
  const railEndX = $('ladder').clientWidth - 16;

  // posiciones X (centros) de cada ranura para animar el pulso por tramos
  const stops = slots.map(s => s.offsetLeft + s.offsetWidth / 2);
  const deadIdx = result.ok ? slots.length : result.deadSlotIndex;

  animatePulse(stops, deadIdx, () => {
    if(result.ok) onLevelSuccess();
    else onLevelFail(result.type);
  });
}

function animatePulse(stops, deadIdx, done){
  const ladder = $('ladder');
  const pulse = document.createElement('div');
  pulse.className = 'pulse';
  pulse.style.top = '50%';
  pulse.style.left = '20px';
  ladder.appendChild(pulse);

  const startX = 22;
  // recorre hasta la ranura "muerta" (o el final si OK)
  const targetX = deadIdx >= stops.length
    ? ladder.clientWidth - 22
    : stops[deadIdx];

  // animación por requestAnimationFrame
  const dur = 500 + 350 * Math.max(1, deadIdx); // ~0.5s/tramo
  const t0 = performance.now();
  function step(now){
    const k = Math.min(1, (now - t0) / dur);
    pulse.style.left = (startX + (targetX - startX) * k) + 'px';
    // ilumina ranuras al pasar (solo si la lógica es válida hasta ahí)
    stops.forEach((sx, i) => {
      if(i < deadIdx && (startX + (targetX - startX) * k) >= sx){
        const slot = document.querySelectorAll('#ladder .slot')[i];
        if(slot){ slot.classList.add('energized'); slot.innerHTML = symbolSVG(S.placed[slot.dataset.slot], true); }
      }
    });
    if(k < 1){ requestAnimationFrame(step); }
    else {
      if(deadIdx >= stops.length){ pulse.remove(); }
      else { pulse.classList.add('dead'); setTimeout(() => pulse.remove(), 500); }
      setTimeout(done, 250);
    }
  }
  requestAnimationFrame(step);
}

/* ============================================================
   Mini-escenas (resultado visual)
   ============================================================ */

function playScene(kind){
  const scene = $('scene');
  let svg = '';
  if(kind === 'lampara' || kind === 'lampara_timer'){
    svg = `<svg viewBox="0 0 60 60" width="60" height="60">
      <circle cx="30" cy="26" r="14" fill="var(--lemon)"/>
      <rect x="24" y="38" width="12" height="8" fill="#888"/>
      ${kind==='lampara_timer'?'<text x="30" y="58" text-anchor="middle" fill="var(--turq)" font-size="9">3 min ⏱</text>':''}
    </svg>`;
  } else if(kind === 'aspersor'){
    svg = `<svg viewBox="0 0 60 60" width="60" height="60">
      <rect x="26" y="30" width="8" height="22" fill="#888"/>
      <circle cx="20" cy="22" r="3" fill="var(--turq)"/><circle cx="30" cy="16" r="3" fill="var(--turq)"/><circle cx="40" cy="22" r="3" fill="var(--turq)"/>
    </svg>`;
  } else if(kind === 'sirena'){
    svg = `<svg viewBox="0 0 60 60" width="60" height="60">
      <circle cx="30" cy="30" r="14" fill="var(--rojo)"/><circle cx="30" cy="30" r="6" fill="var(--lemon)"/>
    </svg>`;
  } else if(kind === 'persiana'){
    svg = `<svg viewBox="0 0 60 60" width="60" height="60">
      <rect x="14" y="12" width="32" height="6" fill="var(--mint)"/>
      <rect x="14" y="20" width="32" height="6" fill="var(--mint)"/>
      <text x="30" y="46" text-anchor="middle" fill="var(--turq)" font-size="10">▲ sube</text>
    </svg>`;
  }
  scene.innerHTML = svg;
  scene.classList.add('pop-in');
  setTimeout(() => scene.classList.remove('pop-in'), 300);
}

/* ============================================================
   Resolución de nivel
   ============================================================ */

function onLevelSuccess(){
  vibrate('success');
  S.score += S.failedThisLevel ? 50 : 100;
  setAvatar('celebrating');
  renderHUD();
  burstAtOutput();                 // bubble explosion en la bobina
  playScene(LEVELS[S.level].scene);
  sayBubble(SUCCESS_MSG[S.level], 2000);
  $('btn-run').disabled = true;
  S.running = false;
  setTimeout(transitionNext, 2000);
}

function onLevelFail(type){
  vibrate('error', [0,80,40,120]);
  if(type === 'timer_missing') vibrate('error', [0,200]);
  S.failedThisLevel = true;
  S.lives--;
  setAvatar('worried');
  renderHUD();

  const edu = EDU[type] || EDU.wrong_generic;
  const fill = txt => {
    const lvl = LEVELS[S.level];
    const noun = (lvl && lvl.noun) || 'la salida';
    const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
    return txt.replace(/\{Noun\}/g, Noun).replace(/\{noun\}/g, noun);
  };
  sayBubble(fill(edu.bubble));

  if(S.lives <= 0){
    vibrate('heavy');
    S.running = false;
    setTimeout(() => endGame(), 700);
    return;
  }
  // overlay educativo
  $('edu-did').textContent  = fill(edu.did);
  $('edu-why').textContent  = fill(edu.why);
  $('edu-rule').textContent = fill(edu.rule);
  $('edu-do').textContent   = fill(edu.do);
  $('edu-overlay').hidden = false;
}

function dismissEdu(){
  $('edu-overlay').hidden = true;
  S.running = false;
  // las piezas quedan colocadas para corregir solo lo necesario
  refreshSlots();
  updateRunState();
}

function transitionNext(){
  const play = $('play');
  $('ladder').classList.add('fade-out');
  $('need-card').classList.add('fade-out');
  setTimeout(() => {
    $('ladder').classList.remove('fade-out');
    $('need-card').classList.remove('fade-out');
    S.level++;
    if(S.level >= LEVELS.length){ endGame(); return; }
    loadLevel();
  }, 340);
}

/* ============================================================
   Carga de nivel
   ============================================================ */

function loadLevel(){
  const lvl = LEVELS[S.level];
  S.failedThisLevel = false;
  S.placed = {};
  S.trayIds = shuffle(lvl.answer.concat(lvl.distractors));
  S.running = false;

  $('need-card').textContent = lvl.need;
  $('scene').innerHTML = '';
  renderHUD();
  setAvatar('happy');
  renderLadder(lvl);
  renderTray();
  updateRunState();

  if(!S.tutorialDone && S.level === 0){
    startTutorial();
  } else {
    sayBubble(PRESENT_MSG[S.level % PRESENT_MSG.length], 2600);
  }
}

/* ============================================================
   Tutorial contextual (solo nivel 1)
   ============================================================ */

const TUT = [
  { bubble:'El cliente quiere que la lámpara se encienda al pulsar. Necesito un CONTACTO en la entrada (el pulsador, I1). Arrástralo a la primera ranura.', haloSlot:'in' },
  { bubble:'¡Eso es! El contacto es la condición de ENTRADA. Ahora la bobina Q1 al final: es la SALIDA, lo que se enciende.', haloSlot:'out' },
  { bubble:'Ya está montado. Pulsa RUN y mira la corriente recorrer el cable. ¡Si va bien, la lámpara se enciende!', haloRun:true },
];

function startTutorial(){
  S.tutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep(){
  clearHalos();
  const step = TUT[S.tutorialStep];
  if(!step) return;
  sayBubble(step.bubble);
  if(step.haloSlot){
    const slot = document.querySelector(`#ladder .slot[data-slot="${step.haloSlot}"]`);
    if(slot) slot.classList.add('halo');
  }
  if(step.haloRun){ $('btn-run').classList.add('halo'); }
}

function advanceTutorial(){
  if(S.tutorialDone || S.level !== 0) return;
  // paso 0 → tras colocar la entrada; paso 1 → tras colocar la salida
  if(S.tutorialStep === 0 && S.placed['in']){ S.tutorialStep = 1; showTutorialStep(); }
  else if(S.tutorialStep === 1 && S.placed['out']){ S.tutorialStep = 2; showTutorialStep(); }
}

function clearHalos(){
  document.querySelectorAll('.halo').forEach(el => el.classList.remove('halo'));
}

/* Al pulsar RUN durante el tutorial, marcarlo como hecho */
function markTutorialDone(){
  if(S.level === 0 && !S.tutorialDone){
    S.tutorialDone = true;
    localStorage.setItem(TUTORIAL_KEY, '1');
    clearHalos();
  }
}

/* ============================================================
   Inicio / fin de partida
   ============================================================ */

function startGame(){
  S.level = 0;
  S.score = 0;
  S.lives = START_LIVES;
  S.tutorialDone = localStorage.getItem(TUTORIAL_KEY) === '1';
  showScreen('play');
  loadLevel();
}

function endGame(){
  const prev = getRecord();
  const beat = S.score > prev;
  if(beat) setRecord(S.score);

  let avatar, msg;
  if(S.score >= MAX_SCORE * 0.8){
    avatar='celebrating';
    msg='¡Lo conseguimos! Ya pienso la lógica antes de montar: entrada, lógica, salida. ¡Eres el mejor profe!';
  } else if(S.score >= MAX_SCORE * 0.6){
    avatar='happy';
    msg='¡Casi todo montado! Repasa lo del orden de la línea y el temporizador y quedo como nuevo.';
  } else {
    avatar='worried';
    msg='Uf… aún hay peldaños sin montar. Acuérdate: la entrada informa, la salida ejecuta. No las confundas. ¿Probamos otra vez?';
  }

  $('results-avatar').src = AVATAR[avatar];
  $('results-score').textContent = S.score + ' pts';
  const rec = $('results-record');
  rec.textContent = beat ? `Record: ${prev} → ${S.score}` : `Record: ${getRecord()}`;
  rec.classList.toggle('beat', beat);
  $('results-msg').textContent = msg;

  if(S.score >= TASK_THRESHOLD) taskCompleted();
  showScreen('results');
}

/* ============================================================
   Wiring
   ============================================================ */

$('btn-start').addEventListener('click', startGame);
$('btn-run').addEventListener('click', () => { markTutorialDone(); runLadder(); });
$('btn-replay').addEventListener('click', startGame);
$('edu-ok').addEventListener('click', dismissEdu);
$('info-ok').addEventListener('click', () => { $('info-overlay').hidden = true; });
$('btn-glos').addEventListener('click', openGlosario);
$('glos-ok').addEventListener('click', () => { $('glos-overlay').hidden = true; });
$('glos-close').addEventListener('click', () => { $('glos-overlay').hidden = true; });
// tocar el fondo oscuro (fuera del card) también cierra el glosario
$('glos-overlay').addEventListener('click', e => { if(e.target.id === 'glos-overlay') $('glos-overlay').hidden = true; });
// las etiquetas de los raíles abren el glosario al tocarlas
$('ladder').addEventListener('click', e => {
  if(e.target.closest('.rail-label')) openGlosario();
});

// Drag con Pointer Events (unifica touch+mouse, sin doble disparo).
// setPointerCapture garantiza recibir move/up aunque el dedo salga del elemento;
// los eventos capturados burbujean a window, donde los escuchamos (una sola vez).
const playEl = $('play');
playEl.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup',   onPointerUp);
window.addEventListener('pointercancel', onPointerUp);

/* ============================================================
   Bubble explosion (canvas de partículas) — estilo Carga la Furgo
   ============================================================ */

const fxCv  = $('fx-canvas');
const fxCtx = fxCv.getContext('2d');
let fxParts = [];
let fxRaf = null;

function fxResize(){ fxCv.width = window.innerWidth; fxCv.height = window.innerHeight; }
window.addEventListener('resize', fxResize);
fxResize();

function burst(x, y){
  const colors = ['#04FFB4', '#00E6BC', '#FFFFAB', '#C5FFDF'];
  const count = 24;
  for(let i = 0; i < count; i++){
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .4;
    const speed = 2.8 + Math.random() * 3.4;
    fxParts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 3.5 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: .022 + Math.random() * .018,
    });
  }
  if(!fxRaf) fxLoop();
}

function fxLoop(){
  fxCtx.clearRect(0, 0, fxCv.width, fxCv.height);
  fxParts = fxParts.filter(p => p.alpha > 0.02);
  fxParts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += .12;            // gravedad leve
    p.alpha -= p.decay;
    fxCtx.globalAlpha = Math.max(0, p.alpha);
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    fxCtx.fillStyle = p.color;
    fxCtx.fill();
  });
  fxCtx.globalAlpha = 1;
  fxRaf = fxParts.length ? requestAnimationFrame(fxLoop) : null;
}

/* Estalla en el centro de la ranura de salida (la bobina) */
function burstAtOutput(){
  const out = document.querySelector('#ladder .slot-out') || document.querySelector('#ladder .slot:last-of-type');
  if(!out){ return; }
  const r = out.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
}

/* Arranque: setear avatares (fuente única = AVATAR) y mostrar intro */
$('intro-avatar').src   = AVATAR.happy;
$('play-avatar').src    = AVATAR.happy;
$('results-avatar').src = AVATAR.celebrating;
showScreen('intro');
