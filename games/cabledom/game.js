/* ================================================================
   CABLE SORT — Kampe Games — Game Logic
   ================================================================ */

/* ===== ASSETS ===== */
const A = {
  happy: 'assets/alexia_happy.png',
  celebrating: 'assets/alexia_celebrating.png',
  worried: 'assets/alexia_worried.png',
  bg: 'assets/background.jpg',
  reject_icon: 'https://res.cloudinary.com/kampe/image/upload/v1771531179/icono_residuos.png'
};

const TERM_IMG = {
  fase:    { empty: 'assets/term_fase_empty.png',    filled: 'assets/term_fase_filled.png' },
  neutro:  { empty: 'assets/term_neutro_empty.png',  filled: 'assets/term_neutro_filled.png' },
  tierra:  { empty: 'assets/term_tierra_empty.png',  filled: 'assets/term_tierra_filled.png' },
  fase_l2: { empty: 'assets/term_l2_empty.png',      filled: 'assets/term_l2_filled.png' }
};

/* ===== HELPERS ===== */
const $ = id => document.getElementById(id);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function showScreen(id) { document.querySelectorAll('.scr').forEach(s => s.classList.add('off')); $(id).classList.remove('off'); }

/* ===== CABLE DATA ===== */
const CABLE_COLORS = {
  marron:         { css: 'cable-marron', label: 'Marrón', func: 'fase' },
  azul:           { css: 'cable-azul', label: 'Azul', func: 'neutro' },
  verde_amarillo: { css: 'cable-verde_amarillo', label: 'V/Am', func: 'tierra' },
  negro:          { css: 'cable-negro', label: 'Negro', func: 'fase' },
  gris:           { css: 'cable-gris', label: 'Gris', func: 'fase_l2' }
};

const SEC_SIZES = { 1.5: 8, 2.5: 12, 6: 18 };

const SLOT_ACCEPTS = {
  fase:    ['marron', 'negro'],
  neutro:  ['azul'],
  tierra:  ['verde_amarillo'],
  fase_l2: ['gris']
};

const FUNC_NAMES = {
  fase: 'fase', neutro: 'neutro', tierra: 'tierra', fase_l2: 'vuelta (L2)'
};

const CABLES_VALID = [
  { color: 'marron', section: 1.5 }, { color: 'marron', section: 2.5 }, { color: 'marron', section: 6 },
  { color: 'negro',  section: 1.5 }, { color: 'negro',  section: 2.5 },
  { color: 'azul',   section: 1.5 }, { color: 'azul',   section: 2.5 }, { color: 'azul',   section: 6 },
  { color: 'verde_amarillo', section: 2.5 }, { color: 'verde_amarillo', section: 6 },
  { color: 'gris',   section: 1.5 }, { color: 'gris',   section: 2.5 }
];

/* ===== APARATOS DATA ===== */
const APARATOS_POOL = [
  { id: 'A1', name: 'Luminaria', img: 'assets/luminaria.png', hint: '1.5mm² · Fase + Neutro',
    slots: [{ func: 'fase', section: 1.5 }, { func: 'neutro', section: 1.5 }] },
  { id: 'A2', name: 'Enchufes salón', img: 'assets/enchufes_salon.png', hint: '2.5mm² · F + N + PE',
    slots: [{ func: 'fase', section: 2.5 }, { func: 'neutro', section: 2.5 }, { func: 'tierra', section: 2.5 }] },
  { id: 'A3', name: 'Enchufes cocina', img: 'assets/enchufes_cocina.png', hint: '2.5mm² · F + N + PE',
    slots: [{ func: 'fase', section: 2.5 }, { func: 'neutro', section: 2.5 }, { func: 'tierra', section: 2.5 }] },
  { id: 'A4', name: 'Horno', img: 'assets/horno.png', hint: '6mm² · F + N + PE',
    slots: [{ func: 'fase', section: 6 }, { func: 'neutro', section: 6 }, { func: 'tierra', section: 6 }] },
  { id: 'A5', name: 'Cuadro general', img: 'assets/cuadro_general.png', hint: '6mm² · F + N + PE',
    slots: [{ func: 'fase', section: 6 }, { func: 'neutro', section: 6 }, { func: 'tierra', section: 6 }] },
  { id: 'A6', name: 'Conmutada', img: 'assets/conmutada.png', hint: '1.5mm² · F + Vuelta + N',
    slots: [{ func: 'fase', section: 1.5 }, { func: 'fase_l2', section: 1.5 }, { func: 'neutro', section: 1.5 }] },
  { id: 'A7', name: 'Termo', img: 'assets/termo.png', hint: '2.5mm² · F + N + PE',
    slots: [{ func: 'fase', section: 2.5 }, { func: 'neutro', section: 2.5 }, { func: 'tierra', section: 2.5 }] },
  { id: 'A8', name: 'Aire acond.', img: 'assets/aire_acond.png', hint: '2.5mm² · F + N + PE',
    slots: [{ func: 'fase', section: 2.5 }, { func: 'neutro', section: 2.5 }, { func: 'tierra', section: 2.5 }] }
];

/* ===== LEVEL CONFIG ===== */
const LEVELS = {
  1: { cols: 4, aparatos: ['A1', 'A2', 'A4'],
       cableTypes: ['marron', 'azul', 'verde_amarillo'], sections: [1.5, 2.5, 6] },
  2: { cols: 4, aparatos: ['A1', 'A2', 'A3', 'A4', 'A6'],
       cableTypes: ['marron', 'azul', 'verde_amarillo', 'negro', 'gris'], sections: [1.5, 2.5, 6] },
  3: { cols: 3, aparatos: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
       cableTypes: ['marron', 'azul', 'verde_amarillo', 'negro', 'gris'], sections: [1.5, 2.5, 6] }
};

/* ===== FEEDBACK MESSAGES ===== */
const FB_SECTION = {
  '1.5_2.5': 'Este aparato necesita 2.5 mm². Con 1.5 mm² te quedas corto de sección: el cable se calienta más de lo que debe y puede dar problemas.',
  '2.5_1.5': 'Este aparato va con 1.5 mm². Un cable de 2.5 funcionaría, pero no es lo que se pide. En obra, poner sección de más es gastar material y no seguir el proyecto.',
  '1.5_6':   '6 mm² es lo que pide este circuito. Con 1.5 mm² estarías poniendo un cable que no aguanta ni la mitad de la carga. Peligroso.',
  '6_2.5':   'Este circuito pide 2.5 mm². Meter un cable de 6 es excesivo — no entra bien en las conexiones y es desperdicio de material.',
  '6_1.5':   'Este aparato va con 1.5 mm². Un cable de 6 mm² es brutal para esto.',
  '2.5_6':   '6 mm² es lo que pide este circuito. Con 2.5 mm² no tienes suficiente sección para la carga. Peligroso.'
};

const FB_FUNC = {
  'neutro_fase':  'El azul es SIEMPRE neutro. Si lo metes como fase, quien venga después dará por hecho que es neutro y puede haber un accidente.',
  'fase_neutro':  'El marrón es fase. El neutro siempre es azul. Mezclar colores es la forma más rápida de crear un problema que nadie verá hasta que sea tarde.',
  'tierra_fase':  'Verde-amarillo es TIERRA y solo tierra. Nunca se usa para otra cosa. Es norma de seguridad básica.',
  'tierra_neutro':'Verde-amarillo es TIERRA y solo tierra. Nunca se usa para otra cosa.',
  'fase_tierra':  'La tierra siempre es verde-amarillo. Si usas otro color como tierra, cualquier electricista que abra esa caja después va a tener un susto.',
  'neutro_tierra':'La tierra siempre es verde-amarillo. El azul es neutro, no tierra.',
  'fase_l2_fase': 'El gris es para Fase L2 (vuelta de conmutada). No lo uses como fase principal.',
  'fase_l2_neutro':'El gris es Fase L2. El neutro siempre es azul.',
  'fase_fase_l2': 'Este slot es para la vuelta de conmutada (gris). El marrón es fase principal, no vuelta.',
  'neutro_fase_l2':'Este slot es para la vuelta de conmutada (gris). El azul es neutro.'
};

const MSG = {
  intro: 'Soy Alexia, jefa de compras de una gran empresa. Necesito saber cuántos cables tenemos y de qué tipo. ¿Me ayudas a clasificarlos? Fíjate en el color, la sección y el aparato al que van.',
  firstComplete: '¡Primer aparato listo! Así se trabaja con criterio.',
  otherComplete: '¡Otro más! Sigue así.',
  level2: '¡Genial! Ahora llegan cables más variados. Concéntrate.',
  level3: '¡Has superado la tarea! A ver ahora hasta cuánto aguantas y nos lo explicas en clase.',
  parkingFull: 'Cuidado, el parking está lleno. Piensa bien el próximo movimiento.',
  escape: 'Te veo atascado. Voy a devolver estos cables al fondo de las columnas.',
  gameOver: 'Se acabó el espacio. No pasa nada, la próxima planificas mejor.',
  resHigh: 'Almacén clasificado de diez. Trabajas con cabeza y criterio.',
  resMed: 'Buen trabajo. Fíjate en los errores para la próxima.',
  resLow: 'Necesitas más práctica. Recuerda: color, sección, uso. Y si dudas, pregunta.'
};

/* ===== CONTEXTUAL TUTORIAL HINTS ===== */
const HINT_MSGS = {
  start:    'Estos son los cables del almacén. Toca el de arriba de una columna y arrástralo al aparato que lo necesita. ¡Fíjate en la sección y el color!',
  parking:  'Si un cable no cabe en ningún aparato ahora mismo, puedes aparcarlo aquí arriba. Pero solo tienes 3 huecos — ¡piensa antes de aparcar!',
  complete: '¡Aparato completado! Cuando rellenas todos los slots, desaparece y viene uno nuevo.'
};

/* ===== GAME STATE ===== */
let columns = [];
let parking = [null, null, null];
let aparatos = [];
let level = 1;
let completedCount = 0;
let taskSent = false;
let record = parseInt(localStorage.getItem('cable_sort_record')) || 0;
let dragState = null;
let blocked = false;
let levelApCompleted = 0;
let firstComplete = true;
let msgTimer = null;
let cableIdCounter = 0;
let hintsShown = { start: false, parking: false, complete: false };
let firstWrongPlace = true;
let cluesLeft = 3;
let inactivityTimer = null;

/* ===== CABLE FACTORY ===== */
function makeCable(color, section) {
  return { id: 'c' + (++cableIdCounter), color, section, func: CABLE_COLORS[color].func };
}

function makeAparato(template) {
  return { ...template, slots: template.slots.map(s => ({ ...s, filled: null })) };
}

/* ===== POOL GENERATION ===== */
function generateColumnsForLevel(lvl) {
  const cfg = LEVELS[lvl];
  const numCols = cfg.cols;
  const pool = cfg.aparatos.map(id => APARATOS_POOL.find(a => a.id === id));

  let picked;
  if (lvl === 1) picked = pool.slice(0, 3);
  else picked = shuffle([...pool]).slice(0, 3);
  aparatos = picked.map(t => makeAparato(t));

  let required = [];
  for (const ap of aparatos) {
    for (const slot of ap.slots) {
      const colors = SLOT_ACCEPTS[slot.func];
      const availColors = colors.filter(c => cfg.cableTypes.includes(c));
      required.push(makeCable(availColors[0] || colors[0], slot.section));
    }
  }

  const totalCables = numCols * 5;
  const fillerCount = Math.max(0, totalCables - required.length);
  let filler = [];
  const validForLevel = CABLES_VALID.filter(cv => cfg.cableTypes.includes(cv.color) && cfg.sections.includes(cv.section));
  for (let i = 0; i < fillerCount; i++) {
    const t = validForLevel[Math.floor(Math.random() * validForLevel.length)]; filler.push(makeCable(t.color, t.section));
  }

  let allCables = [...shuffle(required), ...shuffle(filler)];
  columns = Array.from({ length: numCols }, () => []);
  allCables.forEach((cable, i) => columns[i % numCols].push(cable));
}

function injectCablesForAparato(ap) {
  const cfg = LEVELS[level];
  let needed = [];
  for (const slot of ap.slots) {
    const colors = SLOT_ACCEPTS[slot.func];
    const availColors = colors.filter(c => cfg.cableTypes.includes(c));
    needed.push(makeCable(availColors[0] || colors[0], slot.section));
  }
  const validForLevel = CABLES_VALID.filter(cv => cfg.cableTypes.includes(cv.color) && cfg.sections.includes(cv.section));
  for (let i = 0; i < 2; i++) {
    const t = validForLevel[Math.floor(Math.random() * validForLevel.length)]; needed.push(makeCable(t.color, t.section));
  }
  shuffle(needed);
  needed.forEach((cable, i) => {
    const col = columns[i % columns.length];
    col.splice(Math.min(1, col.length), 0, cable);
  });
}

/* ===== RENDER ===== */
function render() {
  renderAparatos();
  renderParking();
  renderColumns();
  updateHUD();
}

function renderAparatos() {
  const row = $('aparatos-row');
  // Only re-render cards that need updating (or all on first render)
  if (row.children.length !== aparatos.length) row.innerHTML = '';

  aparatos.forEach((ap, i) => {
    let card = row.querySelector('[data-aparato="' + i + '"]');
    const isNew = !card;
    if (isNew) {
      card = document.createElement('div');
      card.className = 'aparato-card';
      card.dataset.aparato = i;
      row.appendChild(card);
    }

    card.innerHTML =
      '<img class="ap-img" src="' + ap.img + '" alt="' + ap.name + '">' +
      '<div class="ap-name">' + ap.name + '</div>' +
      '<div class="ap-hint">' + ap.hint + '</div>' +
      '<div class="ap-slots">' + ap.slots.map((s, si) => {
        const term = TERM_IMG[s.func];
        if (s.filled) {
          return '<div class="ap-slot filled" data-slot="' + si + '">' +
            '<img class="term-img" src="' + (term ? term.filled : '') + '" alt="">' +
            '</div>';
        }
        return '<div class="ap-slot" data-slot="' + si + '">' +
          '<img class="term-img" src="' + (term ? term.empty : '') + '" alt="">' +
          '</div>';
      }).join('') + '</div>';
  });
}

function renderParking() {
  const row = $('parking-row');
  row.innerHTML = '';
  parking.forEach((cable, i) => {
    const slot = document.createElement('div');
    slot.className = 'park-slot' + (cable ? ' occupied' : '');
    slot.dataset.parking = i;
    if (cable) slot.appendChild(createCableEl(cable, 'parking-cable'));
    row.appendChild(slot);
  });
}

function renderColumns() {
  const row = $('columns-row');
  row.innerHTML = '';
  columns.forEach((col, ci) => {
    const colDiv = document.createElement('div');
    colDiv.className = 'col';
    colDiv.dataset.col = ci;
    const cablesDiv = document.createElement('div');
    cablesDiv.className = 'col-cables';

    if (col.length === 0) {
      cablesDiv.innerHTML = '<div class="col-empty">✕</div>';
    } else {
      for (let j = 0; j < Math.min(2, col.length); j++) {
        const el = createCableEl(col[j], j === 0 ? 'top' : 'next');
        el.dataset.col = ci;
        el.dataset.pos = j;
        cablesDiv.appendChild(el);
      }
    }
    colDiv.appendChild(cablesDiv);
    row.appendChild(colDiv);
  });
}

function createCableEl(cable, extraClass) {
  const el = document.createElement('div');
  let css = 'cable ' + CABLE_COLORS[cable.color].css;
  if (extraClass) css += ' ' + extraClass;
  el.className = css;
  el.dataset.cableId = cable.id;

  const dotSize = SEC_SIZES[cable.section] || 8;
  const dotEl = document.createElement('span');
  dotEl.className = 'sec-dot';
  dotEl.style.width = dotSize + 'px';
  dotEl.style.height = dotSize + 'px';
  el.appendChild(dotEl);

  const label = document.createElement('span');
  label.textContent = cable.section + ' mm²';
  el.appendChild(label);
  return el;
}

function updateHUD() {
  $('hud-aparatos').textContent = '⚡ ' + completedCount + ' aparatos';
  $('hud-hint').textContent = '💡 ' + cluesLeft;
  if (cluesLeft <= 0) $('hud-hint').classList.add('disabled');
  else $('hud-hint').classList.remove('disabled');
}

/* ===== CONTEXTUAL HINTS ===== */
function showHint(key, highlightEl) {
  if (hintsShown[key]) return;
  hintsShown[key] = true;
  showCharMsg(A.happy, HINT_MSGS[key], 5000);
  if (highlightEl) {
    highlightEl.classList.add('hint-glow');
    setTimeout(() => highlightEl.classList.remove('hint-glow'), 4500);
  }
}

/* ===== DRAG & DROP ===== */
function setupDrag() {
  const playBody = document.querySelector('.play-body');
  playBody.addEventListener('touchstart', onDragStart, { passive: false });
  playBody.addEventListener('mousedown', onDragStart);
}

function onDragStart(e) {
  if (blocked) return;
  const target = e.target.closest('.cable.top, .cable.parking-cable');
  if (!target) return;

  e.preventDefault();
  resetInactivity();
  const isTouch = !!e.touches;
  const startX = isTouch ? e.touches[0].clientX : e.clientX;
  const startY = isTouch ? e.touches[0].clientY : e.clientY;

  const cableId = target.dataset.cableId;
  let cable, source;

  for (let ci = 0; ci < columns.length; ci++) {
    if (columns[ci].length > 0 && columns[ci][0].id === cableId) {
      cable = columns[ci][0]; source = { type: 'column', colIdx: ci }; break;
    }
  }
  if (!cable) {
    for (let pi = 0; pi < parking.length; pi++) {
      if (parking[pi] && parking[pi].id === cableId) {
        cable = parking[pi]; source = { type: 'parking', parkIdx: pi }; break;
      }
    }
  }
  if (!cable) return;

  const ghost = $('drag-ghost');
  ghost.innerHTML = '';
  const ghostCable = createCableEl(cable, 'top');
  ghostCable.style.width = '90px';
  ghostCable.style.height = '48px';
  ghost.appendChild(ghostCable);
  ghost.classList.add('active');
  ghost.style.left = (startX - 45) + 'px';
  ghost.style.top = (startY - 24) + 'px';

  target.classList.add('dragging');
  dragState = { cable, source, origEl: target };
  highlightDropZones(true);

  const onMove = ev => {
    ev.preventDefault();
    const cx = isTouch ? ev.touches[0].clientX : ev.clientX;
    const cy = isTouch ? ev.touches[0].clientY : ev.clientY;
    ghost.style.left = (cx - 45) + 'px';
    ghost.style.top = (cy - 24) + 'px';
  };

  const onEnd = ev => {
    document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
    document.removeEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
    const cx = isTouch ? (ev.changedTouches ? ev.changedTouches[0].clientX : startX) : ev.clientX;
    const cy = isTouch ? (ev.changedTouches ? ev.changedTouches[0].clientY : startY) : ev.clientY;
    ghost.classList.remove('active');
    highlightDropZones(false);
    target.classList.remove('dragging');
    processDrop(cable, source, getDropZone(cx, cy));
    dragState = null;
  };

  document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, { passive: false });
  document.addEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
}

function highlightDropZones(on) {
  document.querySelectorAll('.aparato-card').forEach(el => el.classList.toggle('highlight', on));
  document.querySelectorAll('.park-slot:not(.occupied)').forEach(el => el.classList.toggle('highlight', on));
}

function getDropZone(x, y) {
  for (let i = 0; i < document.querySelectorAll('.aparato-card').length; i++) {
    const r = document.querySelectorAll('.aparato-card')[i].getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { type: 'aparato', index: i };
  }
  const parkSlots = document.querySelectorAll('.park-slot');
  for (let i = 0; i < parkSlots.length; i++) {
    const r = parkSlots[i].getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { type: 'parking', index: i };
  }
  return null;
}

/* ===== DROP PROCESSING ===== */
function processDrop(cable, source, zone) {
  if (!zone) { render(); return; }
  if (zone.type === 'aparato') tryPlaceInAparato(cable, source, zone.index);
  else if (zone.type === 'parking') tryPlaceInParking(cable, source, zone.index);
}

function removeCableFromSource(source) {
  if (source.type === 'column') columns[source.colIdx].shift();
  else if (source.type === 'parking') parking[source.parkIdx] = null;
}

function tryPlaceInAparato(cable, source, apIdx) {
  const ap = aparatos[apIdx];

  let matchSlot = -1;
  for (let i = 0; i < ap.slots.length; i++) {
    const slot = ap.slots[i];
    if (slot.filled) continue;
    if (slot.section === cable.section && SLOT_ACCEPTS[slot.func].includes(cable.color)) { matchSlot = i; break; }
  }

  if (matchSlot >= 0) {
    removeCableFromSource(source);
    ap.slots[matchSlot].filled = cable;
    render();

    setTimeout(() => {
      const slotEl = document.querySelector('[data-aparato="' + apIdx + '"] [data-slot="' + matchSlot + '"]');
      if (slotEl) slotEl.classList.add('glow');
    }, 50);

    const justCompleted = ap.slots.every(s => s.filled);
    if (justCompleted) setTimeout(() => completeAparato(apIdx), 400);
    else checkDeadlockAfterMove();
  } else {
    const feedback = getErrorFeedback(cable, ap);
    showEduModal('⚠️', feedback);
    $('avatar-img').src = A.worried;
    setTimeout(() => { if ($('avatar-img')) $('avatar-img').src = A.happy; }, 3000);
    render();

    // Show parking hint only when cable doesn't fit ANY aparato and parking has space
    if (firstWrongPlace && !canFitAnyAparato(cable) && parking.some(p => p === null)) {
      firstWrongPlace = false;
      setTimeout(() => showHint('parking', $('parking-row')), 5000);
    }
  }
}

function getErrorFeedback(cable, ap) {
  const apSection = ap.slots[0].section;
  const cableFunc = CABLE_COLORS[cable.color].func;

  // Find if another aparato accepts this cable (for guidance)
  let correctAp = null;
  for (const other of aparatos) {
    if (other === ap) continue;
    for (const s of other.slots) {
      if (!s.filled && s.section === cable.section && SLOT_ACCEPTS[s.func].includes(cable.color)) {
        correctAp = other.name; break;
      }
    }
    if (correctAp) break;
  }
  const hint = correctAp ? '\n\nPrueba en ' + correctAp + '.' : '';

  // Section mismatch
  if (cable.section !== apSection) {
    const key = cable.section + '_' + apSection;
    return (FB_SECTION[key] || 'Este aparato necesita ' + apSection + ' mm², no ' + cable.section + ' mm².') + hint;
  }

  // Section matches — check if this cable's function slot is ALREADY FILLED
  for (const slot of ap.slots) {
    if (slot.filled && SLOT_ACCEPTS[slot.func].includes(cable.color)) {
      const fn = FUNC_NAMES[slot.func] || slot.func;
      return 'Este aparato ya tiene su cable de ' + fn + '. Busca otro aparato que lo necesite.' + hint;
    }
  }

  // Function doesn't match any empty slot
  for (const slot of ap.slots) {
    if (slot.filled) continue;
    if (!SLOT_ACCEPTS[slot.func].includes(cable.color)) {
      const key = cableFunc + '_' + slot.func;
      return (FB_FUNC[key] || 'Este cable (' + CABLE_COLORS[cable.color].label + ') no encaja aquí.') + hint;
    }
  }

  return 'Este cable no encaja en ningún slot libre de este aparato.' + hint;
}

function tryPlaceInParking(cable, source, parkIdx) {
  if (source.type === 'parking') {
    if (parking[parkIdx] === null) { parking[source.parkIdx] = null; parking[parkIdx] = cable; }
    render(); return;
  }
  if (parking[parkIdx] !== null) {
    const emptyIdx = parking.indexOf(null);
    if (emptyIdx >= 0) { removeCableFromSource(source); parking[emptyIdx] = cable; render();
      if (parking.every(p => p !== null)) { $('avatar-img').src = A.worried; showCharMsg(A.worried, MSG.parkingFull); setTimeout(() => { if ($('avatar-img')) $('avatar-img').src = A.happy; }, 4000); }
    } else render();
    return;
  }
  removeCableFromSource(source);
  parking[parkIdx] = cable;
  render();
  if (parking.every(p => p !== null)) { $('avatar-img').src = A.worried; showCharMsg(A.worried, MSG.parkingFull); setTimeout(() => { if ($('avatar-img')) $('avatar-img').src = A.happy; }, 4000); }
  checkDeadlockAfterMove();
}

/* ===== APARATO COMPLETION ===== */
function completeAparato(apIdx) {
  completedCount++;
  levelApCompleted++;

  // Show completion message immediately
  if (firstComplete) {
    firstComplete = false;
    showCharMsg(A.celebrating, MSG.firstComplete, 4000);
  } else {
    showCharMsg(A.celebrating, MSG.otherComplete, 2500);
  }

  // Briefly show celebrating avatar
  $('avatar-img').src = A.celebrating;
  setTimeout(() => { if ($('avatar-img')) $('avatar-img').src = A.happy; }, 3000);

  if (completedCount >= 5 && !taskSent) {
    taskSent = true;
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch (e) {}
  }

  // Flip-out animation on completed card
  const card = document.querySelector('[data-aparato="' + apIdx + '"]');
  if (card) card.classList.add('flip-out');

  setTimeout(() => {
    if (level === 1 && levelApCompleted >= 3) { transitionToLevel(2, apIdx); return; }
    if (level === 2 && levelApCompleted >= 3) { transitionToLevel(3, apIdx); return; }
    spawnNewAparato(apIdx);
  }, 450);
}

function spawnNewAparato(apIdx) {
  const cfg = LEVELS[level];
  const pool = cfg.aparatos.map(id => APARATOS_POOL.find(a => a.id === id));
  const completedId = aparatos[apIdx].id;
  let candidates = pool.filter(a => a.id !== completedId);
  if (candidates.length === 0) candidates = pool;
  const template = candidates[Math.floor(Math.random() * candidates.length)];

  aparatos[apIdx] = makeAparato(template);
  injectCablesForAparato(aparatos[apIdx]);
  render();

  // Slide-in animation only on the new card
  setTimeout(() => {
    const newCard = document.querySelector('[data-aparato="' + apIdx + '"]');
    if (newCard) newCard.classList.add('slide-in');
  }, 20);

  checkDeadlockAfterMove();
}

function transitionToLevel(newLevel, completedApIdx) {
  level = newLevel;
  levelApCompleted = 0;
  const cfg = LEVELS[level];
  showCharMsg(A.happy, level === 2 ? MSG.level2 : MSG.level3, 6000);

  if (cfg.cols < columns.length) {
    while (columns.length > cfg.cols) {
      const extra = columns.pop();
      extra.forEach((cable, i) => columns[i % columns.length].push(cable));
    }
  }

  // Only replace the completed aparato, keep the other two
  spawnNewAparato(completedApIdx);
}

/* ===== DEADLOCK DETECTION ===== */
function checkDeadlockAfterMove() {
  setTimeout(() => {
    if (isDeadlocked()) {
      $('avatar-img').src = A.worried;
      if (!taskSent) {
        showCharMsg(A.worried, MSG.escape, 5000);
        setTimeout(() => showEscapeButton(), 5000);
      } else {
        showCharMsg(A.worried, MSG.gameOver, 5000);
        setTimeout(showResults, 5000);
      }
    }
  }, 600);
}

function isDeadlocked() {
  if (parking.some(p => p === null)) return false;
  for (const col of columns) {
    if (col.length === 0) continue;
    if (canFitAnyAparato(col[0])) return false;
  }
  for (const cable of parking) {
    if (!cable) continue;
    if (canFitAnyAparato(cable)) return false;
  }
  if (columns.every(c => c.length === 0) && parking.every(p => p === null)) return false;
  return true;
}

function canFitAnyAparato(cable) {
  for (const ap of aparatos) {
    for (const slot of ap.slots) {
      if (slot.filled) continue;
      if (slot.section === cable.section && SLOT_ACCEPTS[slot.func].includes(cable.color)) return true;
    }
  }
  return false;
}

/* ===== ESCAPE RULE ===== */
function showEscapeButton() {
  $('escape-btn').style.display = 'block';
  $('escape-btn').onclick = executeEscape;
}

function executeEscape() {
  $('escape-btn').style.display = 'none';
  showCharMsg(A.worried, MSG.escape);
  for (let i = 0; i < parking.length; i++) {
    if (parking[i]) {
      columns[Math.floor(Math.random() * columns.length)].push(parking[i]);
      parking[i] = null;
    }
  }
  render();
  checkDeadlockAfterMove();
}

/* ===== GAME OVER ===== */
function gameOver() {
  $('escape-btn').style.display = 'none';
  showResults();
}

/* ===== BUBBLE POSITIONING ===== */
function positionBubble() {
  const avatarEl = $('avatar-img');
  const msgEl = $('char-msg');
  if (!avatarEl || !msgEl) return;
  const rect = avatarEl.getBoundingClientRect();
  const wRect = $('W').getBoundingClientRect();
  const wW = wRect.width;
  const avatarMidY = (rect.top + rect.bottom) / 2;
  const bubbleH = msgEl.offsetHeight || 60;
  msgEl.style.bottom = (wRect.bottom - avatarMidY - bubbleH / 2) + 'px';
  // Position to the right of avatar, but clamp so it stays within wrapper
  const leftPos = Math.min(rect.right - wRect.left - 60, wW * 0.55);
  msgEl.style.left = Math.max(10, leftPos) + 'px';
  msgEl.style.right = '6px';
}

/* ===== EDUCATIONAL MODAL (uses in-game bubble) ===== */
function showEduModal(_, text) {
  blocked = true;
  if (msgTimer) clearTimeout(msgTimer);
  $('edu-overlay').classList.add('show');
  $('char-msg-text').innerHTML = text.replace(/\n/g, '<br>');
  $('char-msg').classList.add('show');
  $('edu-btn').style.display = 'block';
  positionBubble();
  $('edu-btn').onclick = () => {
    $('edu-overlay').classList.remove('show');
    $('char-msg').classList.remove('show');
    $('edu-btn').style.display = 'none';
    blocked = false;
  };
}

/* ===== CHARACTER MESSAGE ===== */
function showCharMsg(avatar, text, duration) {
  if (msgTimer) clearTimeout(msgTimer);
  $('char-msg-av').src = avatar;
  $('char-msg-text').textContent = text;
  $('char-msg').classList.add('show');
  positionBubble();
  msgTimer = setTimeout(() => $('char-msg').classList.remove('show'), duration || 4000);
}

/* ===== CLUE SYSTEM ===== */
function useClue() {
  if (blocked || cluesLeft <= 0) return;
  cluesLeft--;
  updateHUD();
  resetInactivity();

  // Find the best hint: which top cable fits which aparato
  const funcLabelsClue = { fase: 'Fase (L)', neutro: 'Neutro (N)', tierra: 'Tierra (⏚)', fase_l2: 'Vuelta (L2)' };
  function showClueForCable(cable, ai, ap, slot, fromParking) {
    const slotName = funcLabelsClue[slot.func] || slot.func;
    const prefix = fromParking
      ? 'Tienes un ' + CABLE_COLORS[cable.color].label + ' de ' + cable.section + ' mm² en el parking.'
      : 'Mira el cable ' + CABLE_COLORS[cable.color].label + ' de ' + cable.section + ' mm².';
    showCharMsg(A.happy, prefix + ' Va en ' + ap.name + ', slot ' + slotName + '.', 6000);
    const card = document.querySelector('[data-aparato="' + ai + '"]');
    if (card) { card.classList.add('hint-glow'); setTimeout(() => card.classList.remove('hint-glow'), 5500); }
  }

  for (const col of columns) {
    if (col.length === 0) continue;
    const cable = col[0];
    for (let ai = 0; ai < aparatos.length; ai++) {
      const ap = aparatos[ai];
      for (const slot of ap.slots) {
        if (slot.filled) continue;
        if (slot.section === cable.section && SLOT_ACCEPTS[slot.func].includes(cable.color)) {
          showClueForCable(cable, ai, ap, slot, false);
          return;
        }
      }
    }
  }
  // Check parking cables
  for (const cable of parking) {
    if (!cable) continue;
    for (let ai = 0; ai < aparatos.length; ai++) {
      const ap = aparatos[ai];
      for (const slot of ap.slots) {
        if (slot.filled) continue;
        if (slot.section === cable.section && SLOT_ACCEPTS[slot.func].includes(cable.color)) {
          showClueForCable(cable, ai, ap, slot, true);
          return;
        }
      }
    }
  }
  // If truly deadlocked, say so clearly
  if (isDeadlocked()) {
    showCharMsg(A.worried, 'No hay movimiento posible. Esto es un bloqueo.', 5000);
    cluesLeft++; // refund the clue
    updateHUD();
    if (!taskSent) setTimeout(() => showEscapeButton(), 2000);
    else setTimeout(showResults, 3000);
    return;
  }
  $('avatar-img').src = A.worried;
  setTimeout(() => { if ($('avatar-img')) $('avatar-img').src = A.happy; }, 5000);
  showCharMsg(A.worried, 'Hmm, no veo ningún movimiento fácil. Usa el parking.', 5000);
}

/* ===== INACTIVITY TIMER ===== */
function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  $('hud-hint').classList.remove('pulse');
  inactivityTimer = setTimeout(() => {
    if (cluesLeft > 0) $('hud-hint').classList.add('pulse');
  }, 10000);
}

/* ===== RESULTS ===== */
function showResults() {
  showScreen('results');
  $('res-score').textContent = completedCount;
  const isNew = completedCount > record;
  if (isNew) { record = completedCount; localStorage.setItem('cable_sort_record', record); }
  $('res-record').textContent = record;
  $('res-new').classList.toggle('show', isNew);
  $('res-stats').textContent = '⚡ ' + completedCount + ' aparatos';

  if (completedCount >= 10) {
    $('res-badge').textContent = '¡ALMACÉN COMPLETADO!'; $('res-badge').style.display = 'block';
    $('res-av').src = A.celebrating; $('res-msg').textContent = MSG.resHigh;
  } else if (completedCount >= 5) {
    $('res-badge').textContent = '¡MISIÓN COMPLETADA!'; $('res-badge').style.display = 'block';
    $('res-av').src = A.happy; $('res-msg').textContent = MSG.resMed;
  } else {
    $('res-badge').style.display = 'none';
    $('res-av').src = A.worried; $('res-msg').textContent = MSG.resLow;
  }
}

/* ===== START / RESTART ===== */
function startGame() {
  columns = []; parking = [null, null, null]; aparatos = [];
  level = 1; completedCount = 0; taskSent = false;
  levelApCompleted = 0; firstComplete = true;
  blocked = false; cableIdCounter = 0; firstWrongPlace = true;
  hintsShown = { start: false, parking: false, complete: false };
  cluesLeft = 3;
  $('escape-btn').style.display = 'none';
  $('char-msg').classList.remove('show');

  // Set background & avatar
  $('play-bg').src = A.bg;
  $('avatar-img').src = A.happy;

  generateColumnsForLevel(1);
  showScreen('play');
  render();
  resetInactivity();

  // Contextual start hint
  setTimeout(() => showHint('start', $('columns-row')), 800);
}

/* ===== INIT ===== */
function init() {
  $('intro-bg').src = A.bg;
  $('intro-av').src = A.happy;
  $('intro-msg').textContent = MSG.intro;
  $('intro-btn').onclick = startGame;
  $('res-btn').onclick = startGame;
  $('hud-hint').onclick = useClue;
  setupDrag();
  showScreen('intro');
}

init();
