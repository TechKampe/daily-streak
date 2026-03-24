/* ================================================================
   PASILLO CON DOS PUNTOS — Kampe Games — Game Logic
   ================================================================ */

/* ===== ASSETS ===== */
var CLD = 'https://res.cloudinary.com/kampe/image/upload/';
var A = {
  base:        CLD + 'v1774379417/Gil-qui_Happy_h0j3hl.png',
  happy:       CLD + 'v1774379417/Gil-qui_Happy_h0j3hl.png',
  celebrating: CLD + 'v1774379418/Gil-qui_celebrating_tujwk9.png',
  worried:     CLD + 'v1774379418/Gil-qui_worried_e9xv7v.png'
};

/* ===== HELPERS ===== */
var $ = function(id) { return document.getElementById(id); };
function showScreen(id) {
  document.querySelectorAll('.scr').forEach(function(s) { s.classList.add('off'); });
  $(id).classList.remove('off');
}
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ===== GAME STATE ===== */
var MAX_LIVES = 5;
var TASK_THRESHOLD = 200;
var score = 0;
var lives = MAX_LIVES;
var level = 0;
var busy = false;
var taskSent = false;
var record = parseInt(localStorage.getItem('pasillo_dos_puntos_record')) || 0;
var levelErrors = 0;
var n3Attempts = 0;
var n4Timer = null;
var n4Start = 0;
var n4Scenario = 0;
var n4Scenarios = [];
var dragCable = null;
var ghostEl = null;
var hintUsed = false;
var switchDemoActive = false;

/* ===== MISSIONS & HINTS ===== */
var MISSIONS = {
  1: {
    text: 'Arrastra los 4 cables a su sitio. L0 = entrada, L1 = salida',
    hints: [
      'Cable fase (marrón) va del cuadro al borne L0 del interruptor',
      'Cable retorno (negro) del borne L1 del interruptor a la bombilla',
      'Cable neutro (azul) sale de la bombilla (N) y vuelve al cuadro',
      'Cable tierra (verde-amarillo) sale de la bombilla (T) y va a la barra de tierra'
    ]
  },
  2: {
    text: 'Conmutada: 2 conmutadores controlan 1 lámpara. Arrastra cada cable a su borne.',
    hints: [
      'C = Común (borne central). La FASE siempre entra por el Común del primer conmutador (A)',
      'V1, V2 = Viajeros. Son los cables que van de un conmutador al OTRO. V1 de A → V1 de B, V2 de A → V2 de B',
      'El RETORNO sale del Común del segundo conmutador (B) y va a la lámpara',
      'El neutro (azul) va de la lámpara al cuadro (borne N)'
    ]
  },
  3: {
    text: 'Toca el cable que esta mal conectado',
    hints: [
      'Fijate donde llega la fase: deberia ir al comun',
      'Los viajeros deben cruzar de un conmutador al otro'
    ]
  },
  4: {
    text: 'Evalua cada circuito: ¿funciona o no funciona?',
    hints: [
      'Comprueba: ¿la fase va al comun? ¿los viajeros cruzan?',
      'Si algo va a un borne que no le corresponde, no funciona'
    ]
  }
};

/* ===== LEVEL DEFINITIONS ===== */

/* --- N1: Interruptor simple — ALL 4 cables (fase, retorno, neutro, tierra) --- */
var LEVEL1 = {
  name: 'Nivel 1',
  intro: 'Empezamos con un interruptor simple. ¡Conecta los 4 cables!',
  cables: [
    { id: 'fase',    label: 'Fase → L0',     css: 'cable-marron',        accepts: 'L' },
    { id: 'retorno', label: 'Retorno ← L1',  css: 'cable-negro',         accepts: 'sal' },
    { id: 'neutro',  label: 'Neutro → N',    css: 'cable-azul',          accepts: 'N' },
    { id: 'tierra',  label: 'Tierra → T',    css: 'cable-verde-amarillo', accepts: 'T' }
  ],
  distractors: [],
  terminals: [
    { id: 'L',   label: 'L0', x: 128, y: 118 },
    { id: 'sal', label: 'L1', x: 116, y: 86 },
    { id: 'N',   label: 'N',  x: 209, y: 103 },
    { id: 'T',   label: 'T',  x: 221, y: 103 }
  ],
  wires: [
    { id: 'w-cuadro-L',   type: 'empty', cable: 'fase' },
    { id: 'w-sal-lamp',   type: 'empty', cable: 'retorno' },
    { id: 'w-neutro',     type: 'empty', cable: 'neutro' },
    { id: 'w-tierra',     type: 'empty', cable: 'tierra' }
  ],
  wireLabels: {
    'w-cuadro-L': { text: 'FASE', text2: '(marrón)', color: '#8B5E3C', pos: [90, 30] },
    'w-sal-lamp':  { text: 'RETORNO', text2: '(negro)', color: '#AAA', pos: [170, 3] },
    'w-neutro':    { text: 'NEUTRO', text2: '(azul)', color: '#fff', pos: [115, 185] },
    'w-tierra':    { text: 'TIERRA', text2: '(V/A)', color: '#fff', pos: [130, 215] }
  },
  ptsPerCable: 30,
  bonusPerfect: 20,
  buildSVG: function() { return buildSVG_N1(); }
};

/* --- N2: Conmutada — 5 cables (fase, viaj1, viaj2, retorno, neutro) --- */
var LEVEL2 = {
  name: 'Nivel 2',
  intro: 'Una conmutada tiene 2 conmutadores con 3 bornes cada uno: Común (C), Viajero 1 (V1) y Viajero 2 (V2). ¡Conecta los 5 cables!',
  cables: [
    { id: 'fase',    label: 'Fase → C(A)',      css: 'cable-marron',  accepts: 'comA' },
    { id: 'viaj1',   label: 'Viajero 1',        css: 'cable-negro',   accepts: 'v1A' },
    { id: 'viaj2',   label: 'Viajero 2',        css: 'cable-gris',    accepts: 'v2A' },
    { id: 'retorno', label: 'Retorno ← C(B)',   css: 'cable-negro',   accepts: 'comB' },
    { id: 'neutro',  label: 'Neutro → N',       css: 'cable-azul',    accepts: 'nLamp' }
  ],
  distractors: [],
  terminals: [
    { id: 'comA',  label: 'C',   x: 78,  y: 193, group: 'A' },
    { id: 'v1A',   label: 'V1',  x: 64,  y: 193, group: 'A' },
    { id: 'v2A',   label: 'V2',  x: 92,  y: 193, group: 'A' },
    { id: 'comB',  label: 'C',   x: 278, y: 193, group: 'B' },
    { id: 'nLamp', label: 'N',   x: 339, y: 92 }
  ],
  wires: [
    { id: 'w-cuadro-comA', type: 'empty', cable: 'fase' },
    { id: 'w-v1A-v1B',     type: 'empty', cable: 'viaj1' },
    { id: 'w-v2A-v2B',     type: 'empty', cable: 'viaj2' },
    { id: 'w-comB-lamp',   type: 'empty', cable: 'retorno' },
    { id: 'w-neutro',      type: 'empty', cable: 'neutro' }
  ],
  wireLabels: {
    'w-cuadro-comA': { text: 'FASE', color: '#8B5E3C', pos: [130, 18] },
    'w-v1A-v1B':     { text: 'VIAJERO 1', color: '#AAA', pos: [164, 213] },
    'w-v2A-v2B':     { text: 'VIAJERO 2', color: '#999', pos: [164, 228] },
    'w-comB-lamp':   { text: 'RETORNO', color: '#AAA', pos: [310, 128] },
    'w-neutro':      { text: 'NEUTRO', color: '#2E86C1', pos: [260, 115] }
  },
  ptsPerCable: 25,
  bonusPerfect: 30,
  buildSVG: function() { return buildSVG_N2(); }
};

/* --- N3: Encuentra el error --- */
var N3_ERRORS = [
  {
    desc: 'Fase conectada a viajero en vez de comun',
    wrongWire: 'w-cuadro-comA',
    wrongTo: 'v1A',
    correctTo: 'comA',
    hint: 'La fase SIEMPRE va al comun. Si va a un viajero, el circuito no funciona.'
  },
  {
    desc: 'Viajero conectado al comun del mismo conmutador',
    wrongWire: 'w-v1A-v1B',
    wrongTo: 'comA',
    correctTo: 'v1A',
    hint: 'Un viajero conecta un conmutador con el OTRO, no consigo mismo.'
  },
  {
    desc: 'Retorno conectado a viajero en vez de comun',
    wrongWire: 'w-comB-lamp',
    wrongTo: 'v2B',
    correctTo: 'comB',
    hint: 'El retorno sale del comun del segundo conmutador hacia la lampara.'
  }
];

var LEVEL3 = {
  name: 'Nivel 3',
  intro: 'Alguien ha cableado mal esta conmutada. ¡Encuentra el error!',
  ptsFind: 50,
  bonusFirst: 30
};

/* --- N4: Chequeo rapido --- */
var N4_POOL = [
  { works: true,  label: 'Circuito correcto', explanation: 'Circuito correcto: fase al comun de A, viajeros cruzan, retorno del comun de B a lampara.' },
  { works: false, label: 'Fase en viajero', explanation: 'La fase esta conectada a un viajero en vez del comun. Asi no puede funcionar.' },
  { works: false, label: 'Viajeros sin cruzar', explanation: 'Los dos viajeros van al mismo borne. Deben cruzar: V1→V1, V2→V2.' },
  { works: true,  label: 'Circuito correcto (variante)', explanation: 'Conexion correcta. Los viajeros cruzan bien y el retorno sale del comun.' },
  { works: false, label: 'Retorno en viajero', explanation: 'El retorno esta en un viajero en vez del comun de B. La lampara no recibe corriente.' },
  { works: false, label: 'Comunes conectados entre si', explanation: 'Los comunes de ambos conmutadores estan conectados. Los viajeros quedan sueltos.' }
];

var LEVEL4 = {
  name: 'Nivel 4',
  intro: 'Chequeo rapido: ¿funciona o no? Tienes 30 segundos por circuito.',
  timePerScenario: 30,
  totalScenarios: 3,
  ptsCorrect: 40,
  bonusSpeed: 15,
  speedThreshold: 10
};

/* ===== SVG BUILDERS ===== */

function svgWrap(inner, vb) {
  // Define verde-amarillo stripe pattern for tierra wire
  var defs = '<defs>' +
    '<pattern id="pat-tierra" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">' +
      '<rect width="4" height="8" fill="#27AE60"/>' +
      '<rect x="4" width="4" height="8" fill="#F1C40F"/>' +
    '</pattern>' +
  '</defs>';
  return '<svg viewBox="' + (vb || '0 0 380 260') + '" xmlns="http://www.w3.org/2000/svg">' + defs + inner + '</svg>';
}

/* --- Reusable SVG components --- */

function svgMagnetotermico(x, y) {
  // MCB: 1 top screw (fase/L), 2 bottom screws (neutro/N left, tierra/CP right)
  // Body is 50 wide x 90 tall
  var s = '';
  // Main body
  s += '<rect x="' + x + '" y="' + y + '" width="50" height="90" rx="2" fill="#E8E8E8" stroke="#AAA" stroke-width="1.5"/>';

  // TOP terminal area — single screw (fase out)
  s += '<rect x="' + (x+9) + '" y="' + (y+2) + '" width="32" height="16" rx="1" fill="#444" stroke="#333" stroke-width="1"/>';
  s += '<circle cx="' + (x+25) + '" cy="' + (y+10) + '" r="4.5" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<line x1="' + (x+22) + '" y1="' + (y+7) + '" x2="' + (x+28) + '" y2="' + (y+13) + '" stroke="#666" stroke-width="1.5"/>';
  // Label "L" on top screw
  s += '<text x="' + (x+25) + '" y="' + (y+22) + '" text-anchor="middle" font-size="6" font-weight="bold" fill="#666">L</text>';

  // Toggle lever area
  s += '<rect x="' + (x+15) + '" y="' + (y+26) + '" width="20" height="24" rx="2" fill="#DDD" stroke="#BBB" stroke-width="1"/>';
  s += '<rect x="' + (x+18) + '" y="' + (y+28) + '" width="14" height="10" rx="2" fill="#2ECC71" stroke="#27AE60" stroke-width="1"/>';
  s += '<text x="' + (x+25) + '" y="' + (y+36) + '" text-anchor="middle" font-size="5" font-weight="bold" fill="white">I</text>';

  // Rating label
  s += '<rect x="' + (x+11) + '" y="' + (y+53) + '" width="28" height="10" rx="1" fill="white" stroke="#CCC" stroke-width=".5"/>';
  s += '<text x="' + (x+25) + '" y="' + (y+61) + '" text-anchor="middle" font-size="7" font-weight="bold" fill="#333">25A</text>';

  // BOTTOM terminal area — TWO screws side by side (N left, CP/T right)
  // Left screw = Neutro
  s += '<rect x="' + (x+2) + '" y="' + (y+68) + '" width="22" height="18" rx="1" fill="#444" stroke="#333" stroke-width="1"/>';
  s += '<circle cx="' + (x+13) + '" cy="' + (y+77) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<line x1="' + (x+10) + '" y1="' + (y+74) + '" x2="' + (x+16) + '" y2="' + (y+80) + '" stroke="#666" stroke-width="1.2"/>';
  s += '<text x="' + (x+13) + '" y="' + (y+67) + '" text-anchor="middle" font-size="5" font-weight="bold" fill="#2E86C1">N</text>';
  // Right screw = Tierra/CP
  s += '<rect x="' + (x+26) + '" y="' + (y+68) + '" width="22" height="18" rx="1" fill="#444" stroke="#333" stroke-width="1"/>';
  s += '<circle cx="' + (x+37) + '" cy="' + (y+77) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<line x1="' + (x+34) + '" y1="' + (y+74) + '" x2="' + (x+40) + '" y2="' + (y+80) + '" stroke="#666" stroke-width="1.2"/>';
  s += '<text x="' + (x+37) + '" y="' + (y+67) + '" text-anchor="middle" font-size="5" font-weight="bold" fill="#27AE60">CP</text>';

  // Label ABOVE
  s += '<text class="component-label" x="' + (x+25) + '" y="' + (y-6) + '" text-anchor="middle">MAGNETO.</text>';
  return s;
}

function svgInterruptor(x, y) {
  // Switch mechanism with L0 (common), L1, L2 contacts and lever
  var s = '';
  // Marco exterior
  s += '<rect x="' + x + '" y="' + y + '" width="56" height="68" rx="3" fill="#F0F0F0" stroke="#CCC" stroke-width="1.5"/>';
  // Inner tecla area (clickable)
  s += '<rect class="interruptor-tecla" id="interruptor-tecla" x="' + (x+4) + '" y="' + (y+4) + '" width="48" height="60" rx="2" fill="#E8E8E8" stroke="#BBB" stroke-width="1" cursor="pointer"/>';

  // Contact L1 (top-left)
  s += '<circle cx="' + (x+16) + '" cy="' + (y+16) + '" r="5" fill="#C0C0C0" stroke="#888" stroke-width="1.5"/>';
  s += '<text x="' + (x+16) + '" y="' + (y+10) + '" text-anchor="middle" font-size="7" font-weight="bold" fill="#666">L1</text>';

  // Contact L2 (top-right)
  s += '<circle cx="' + (x+40) + '" cy="' + (y+16) + '" r="5" fill="#C0C0C0" stroke="#888" stroke-width="1.5"/>';
  s += '<text x="' + (x+40) + '" y="' + (y+10) + '" text-anchor="middle" font-size="7" font-weight="bold" fill="#666">L2</text>';

  // Contact L0 (common — bottom center)
  s += '<circle id="interruptor-L0" cx="' + (x+28) + '" cy="' + (y+48) + '" r="6" fill="#D4A44A" stroke="#B8860B" stroke-width="1.5"/>';
  s += '<text x="' + (x+28) + '" y="' + (y+60) + '" text-anchor="middle" font-size="7" font-weight="bold" fill="#B8860B">L0</text>';

  // Lever arm — ON position: L0 → L1 (top-left)
  s += '<line class="interruptor-arm" id="interruptor-arm" x1="' + (x+28) + '" y1="' + (y+48) + '" x2="' + (x+16) + '" y2="' + (y+16) + '" stroke="#555" stroke-width="3.5" stroke-linecap="round"/>';

  // Pivot dot at L0
  s += '<circle cx="' + (x+28) + '" cy="' + (y+48) + '" r="3" fill="#888"/>';

  s += '<text class="component-label" x="' + (x+28) + '" y="' + (y-6) + '" text-anchor="middle">INTERRUPTOR</text>';
  return s;
}

function svgInterruptorBelow(x, y) {
  // Interruptor with label BELOW and dark-chip labels for L1/L2/L0
  var s = '';
  s += '<rect x="' + x + '" y="' + y + '" width="56" height="68" rx="3" fill="#F0F0F0" stroke="#CCC" stroke-width="1.5"/>';
  s += '<rect class="interruptor-tecla" id="interruptor-tecla" x="' + (x+4) + '" y="' + (y+4) + '" width="48" height="60" rx="2" fill="#E8E8E8" stroke="#BBB" stroke-width="1" cursor="pointer"/>';
  // Contact L1 (top-left)
  s += '<circle cx="' + (x+16) + '" cy="' + (y+16) + '" r="5" fill="#C0C0C0" stroke="#888" stroke-width="1.5"/>';
  // Contact L2 (top-right)
  s += '<circle cx="' + (x+40) + '" cy="' + (y+16) + '" r="5" fill="#C0C0C0" stroke="#888" stroke-width="1.5"/>';
  // Contact L0 (common — bottom center)
  s += '<circle id="interruptor-L0" cx="' + (x+28) + '" cy="' + (y+48) + '" r="6" fill="#D4A44A" stroke="#B8860B" stroke-width="1.5"/>';
  // Lever arm — ON position: L0 → L1
  s += '<line class="interruptor-arm" id="interruptor-arm" x1="' + (x+28) + '" y1="' + (y+48) + '" x2="' + (x+16) + '" y2="' + (y+16) + '" stroke="#555" stroke-width="3.5" stroke-linecap="round"/>';
  s += '<circle cx="' + (x+28) + '" cy="' + (y+48) + '" r="3" fill="#888"/>';
  // Dark chip labels: L1/L2 above top contacts, L0 below bottom contact
  var topChipY = y - 16;
  // L1 above top-left contact, L2 above top-right contact
  [{lbl:'L1',cx:x+16},{lbl:'L2',cx:x+40}].forEach(function(c) {
    s += '<rect x="' + (c.cx-11) + '" y="' + topChipY + '" width="22" height="14" rx="3" fill="#222"/>';
    s += '<text x="' + c.cx + '" y="' + (topChipY+11) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">' + c.lbl + '</text>';
  });
  // L0 below bottom contact
  var botChipY = y + 58;
  s += '<rect x="' + (x+28-11) + '" y="' + botChipY + '" width="22" height="14" rx="3" fill="#222"/>';
  s += '<text x="' + (x+28) + '" y="' + (botChipY+11) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">L0</text>';
  // Label BELOW
  s += '<text class="component-label" x="' + (x+28) + '" y="' + (y+82) + '" text-anchor="middle">INTERRUPTOR</text>';
  return s;
}

function svgConmutador(x, y, label) {
  var s = '';
  s += '<rect x="' + x + '" y="' + y + '" width="56" height="70" rx="3" fill="#F0F0F0" stroke="#CCC" stroke-width="1.5"/>';
  s += '<rect x="' + (x+5) + '" y="' + (y+5) + '" width="46" height="60" rx="2" fill="#E0E0E0" stroke="#BBB" stroke-width="1"/>';
  // Lever symbol
  s += '<circle cx="' + (x+28) + '" cy="' + (y+20) + '" r="3" fill="#888"/>';
  s += '<line x1="' + (x+28) + '" y1="' + (y+20) + '" x2="' + (x+16) + '" y2="' + (y+36) + '" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>';
  s += '<circle cx="' + (x+16) + '" cy="' + (y+38) + '" r="2.5" fill="#999"/>';
  s += '<circle cx="' + (x+40) + '" cy="' + (y+38) + '" r="2.5" fill="#999"/>';
  // Three screw bornes at bottom
  s += '<circle cx="' + (x+28) + '" cy="' + (y+53) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<circle cx="' + (x+14) + '" cy="' + (y+53) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<circle cx="' + (x+42) + '" cy="' + (y+53) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<text class="component-label" x="' + (x+28) + '" y="' + (y-6) + '" text-anchor="middle">' + label + '</text>';
  return s;
}

function svgConmutadorSchematic(x, y, label, id) {
  // Conmutador with identifiable lever arm for toggle animation
  var s = '';
  s += '<rect x="' + x + '" y="' + y + '" width="56" height="70" rx="3" fill="#F0F0F0" stroke="#CCC" stroke-width="1.5"/>';
  s += '<rect x="' + (x+5) + '" y="' + (y+5) + '" width="46" height="60" rx="2" fill="#E0E0E0" stroke="#BBB" stroke-width="1"/>';
  // Pivot (common) at top-center
  s += '<circle cx="' + (x+28) + '" cy="' + (y+20) + '" r="3" fill="#888"/>';
  // Lever arm — connects pivot to left contact (position 1)
  s += '<line class="conm-arm" id="conm-arm-' + id + '" x1="' + (x+28) + '" y1="' + (y+20) + '" x2="' + (x+16) + '" y2="' + (y+36) + '" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>';
  // Two contact positions
  s += '<circle cx="' + (x+16) + '" cy="' + (y+38) + '" r="2.5" fill="#999"/>';
  s += '<circle cx="' + (x+40) + '" cy="' + (y+38) + '" r="2.5" fill="#999"/>';
  // Three screw bornes at bottom
  s += '<circle cx="' + (x+14) + '" cy="' + (y+53) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<circle cx="' + (x+28) + '" cy="' + (y+53) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  s += '<circle cx="' + (x+42) + '" cy="' + (y+53) + '" r="4" fill="#C0C0C0" stroke="#888" stroke-width="1"/>';
  // Borne labels on dark background for readability
  var bornes = [{lbl:'V1',bx:x+14,by:y+53},{lbl:'C',bx:x+28,by:y+53},{lbl:'V2',bx:x+42,by:y+53}];
  bornes.forEach(function(b) {
    s += '<rect x="' + (b.bx-8) + '" y="' + (b.by-18) + '" width="16" height="12" rx="2" fill="#222"/>';
    s += '<text x="' + b.bx + '" y="' + (b.by-9) + '" text-anchor="middle" font-size="8" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">' + b.lbl + '</text>';
  });
  // Label on the side (A=left, B=right) to avoid overlapping cables
  var labelX = (id === 'A') ? (x - 4) : (x + 60);
  var anchor = (id === 'A') ? 'end' : 'start';
  s += '<text class="component-label" x="' + labelX + '" y="' + (y + 35) + '" text-anchor="' + anchor + '">' + label + '</text>';
  return s;
}

function svgBombilla(cx, cy) {
  var s = '';
  // Bulb glass
  s += '<ellipse class="lamp lamp-off" id="svg-lamp" cx="' + cx + '" cy="' + (cy-8) + '" rx="18" ry="22" />';
  // Screw base
  s += '<rect x="' + (cx-12) + '" y="' + (cy+12) + '" width="24" height="14" rx="3" fill="#AAA" stroke="#888" stroke-width="1"/>';
  s += '<line x1="' + (cx-11) + '" y1="' + (cy+16) + '" x2="' + (cx+11) + '" y2="' + (cy+16) + '" stroke="#999" stroke-width="1"/>';
  s += '<line x1="' + (cx-10) + '" y1="' + (cy+20) + '" x2="' + (cx+10) + '" y2="' + (cy+20) + '" stroke="#999" stroke-width="1"/>';
  // Two contacts at bottom (left = N, right = T)
  s += '<circle cx="' + (cx-6) + '" cy="' + (cy+28) + '" r="3" fill="#2E86C1" stroke="#1A5276" stroke-width="1"/>';
  s += '<circle cx="' + (cx+6) + '" cy="' + (cy+28) + '" r="3" fill="#27AE60" stroke="#1E8449" stroke-width="1"/>';
  s += '<text class="component-label" x="' + cx + '" y="' + (cy-36) + '" text-anchor="middle">LAMPARA</text>';
  return s;
}

function svgTerminal(t) {
  var s = '<circle class="terminal" data-id="' + t.id + '" cx="' + t.x + '" cy="' + t.y + '" r="9"/>' +
    '<circle class="terminal-hit" data-id="' + t.id + '" cx="' + t.x + '" cy="' + t.y + '" r="22"/>';
  if (!t.noLabel) {
    s += '<text class="terminal-label" data-for="' + t.id + '" x="' + t.x + '" y="' + (t.y - 13) + '" text-anchor="middle">' + t.label + '</text>';
  }
  return s;
}

/* ===== N1: INTERRUPTOR SIMPLE — 4 cables ===== */
/*
  Layout N1 (viewBox 260 250):
  Generous vertical space — labels well clear of cables.

  Magneto (5,10) — top L at (30,20), bottom N at (18,87), CP at (42,87)
  Interruptor (100,70) — L0 at (128,118), L1 at (116,86). Label below at y=152.
  Bombilla (215,75) — top at (215,67), contacts at (209,103) / (221,103)

  Wires — NO CROSSING:
    FASE:    magneto L → right at y=20 → down to L0 (128,118)
    RETORNO: L1 (116,86) → up to y=6 → right → bombilla top (215,67)
    NEUTRO:  bombilla N (209,103) → down to y=190 → left → magneto N (18,87)
    TIERRA:  bombilla T (221,103) → down to y=220 → left → magneto CP (42,87)
*/

function buildSVG_N1() {
  var s = '';
  s += '<rect x="0" y="-12" width="260" height="262" rx="12" fill="rgba(255,255,255,.03)"/>';

  // Components
  s += svgMagnetotermico(5, 10);      // top L at (30,20), bottom N at (18,87), CP at (42,87)
  s += svgInterruptorBelow(100, 70);  // L0 at (128,118), L1 at (116,86), label at y=152
  s += svgBombilla(215, 75);          // top at (215,67), contacts at (209,103) / (221,103)

  // === WIRES ===

  // FASE: magneto top (30,20) → right at y=20 → down to L0 (128,118)
  s += '<path class="wire wire-empty" data-wire="w-cuadro-L" d="M55,20 L128,20 L128,118" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-cuadro-L" d="M55,20 L128,20 L128,118" fill="none"/>';

  // RETORNO: L1 (116,86) → up to y=6 → right → bombilla top (215,67)
  s += '<path class="wire wire-empty" data-wire="w-sal-lamp" d="M116,86 L116,6 L215,6 L215,67" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-sal-lamp" d="M116,86 L116,6 L215,6 L215,67" fill="none"/>';

  // NEUTRO: bombilla N (209,103) → down to y=190 → left → magneto N (18,87)
  s += '<path class="wire wire-empty" data-wire="w-neutro" d="M209,103 L209,190 L18,190 L18,87" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-neutro" d="M209,103 L209,190 L18,190 L18,87" fill="none"/>';

  // TIERRA: bombilla T (221,103) → down to y=220 → left → magneto CP (42,87)
  s += '<path class="wire wire-empty" data-wire="w-tierra" d="M221,103 L221,220 L42,220 L42,87" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-tierra" d="M221,103 L221,220 L42,220 L42,87" fill="none"/>';

  // Drop terminals
  s += svgTerminal({ id: 'L',   label: 'L0', x: 128, y: 118 });
  s += svgTerminal({ id: 'sal', label: 'L1', x: 116, y: 86 });
  s += svgTerminal({ id: 'N',   label: 'N',  x: 209, y: 103 });
  s += svgTerminal({ id: 'T',   label: 'T',  x: 221, y: 103 });

  return svgWrap(s, '0 -12 260 262');
}

/* ===== N2: CONMUTADA ===== */

function buildSVG_N2() {
  /*
    Layout: Magneto top-center, ConmA bottom-left, ConmB bottom-right, Bombilla right.
    5 cables: fase, viaj1, viaj2, retorno, neutro.
    Viajero wires are single continuous paths A→B.
    Conmutadores have lever arms with IDs for toggle animation.
  */
  var s = '';
  s += '<rect x="0" y="-12" width="380" height="257" rx="12" fill="rgba(255,255,255,.03)"/>';

  // Components
  s += svgMagnetotermico(165, 10);
  s += svgConmutadorSchematic(50, 140, 'CONM. A', 'A');
  s += svgConmutadorSchematic(250, 140, 'CONM. B', 'B');
  s += svgBombilla(345, 60);

  // Empty wires + drop areas
  // Fase: magneto L (190,20) → up → left → down to comA (78,193)
  s += '<path class="wire wire-empty" data-wire="w-cuadro-comA" d="M190,20 L190,8 L78,8 L78,193" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-cuadro-comA" d="M190,20 L190,8 L78,8 L78,193" fill="none"/>';

  // Viajero 1: single wire A V1 (64,193) → down → right → up → B V1 (264,193)
  s += '<path class="wire wire-empty" data-wire="w-v1A-v1B" d="M64,193 L64,218 L264,218 L264,193" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-v1A-v1B" d="M64,193 L64,218 L264,218 L264,193" fill="none"/>';

  // Viajero 2: single wire A V2 (92,193) → down → right → up → B V2 (292,193)
  s += '<path class="wire wire-empty" data-wire="w-v2A-v2B" d="M92,193 L92,233 L292,233 L292,193" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-v2A-v2B" d="M92,193 L92,233 L292,233 L292,193" fill="none"/>';

  // Retorno: comB (278,193) → up → right → bombilla (345,88)
  s += '<path class="wire wire-empty" data-wire="w-comB-lamp" d="M278,193 L278,135 L345,135 L345,88" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-comB-lamp" d="M278,193 L278,135 L345,135 L345,88" fill="none"/>';

  // Neutro: bombilla N (339,92) → down → left → magneto N (178,87)
  s += '<path class="wire wire-empty" data-wire="w-neutro" d="M339,92 L339,120 L178,120 L178,87" fill="none"/>';
  s += '<path class="wire-drop" data-wire="w-neutro" d="M339,92 L339,120 L178,120 L178,87" fill="none"/>';

  // Drop terminals — conmutador bornes have labels from svgConmutadorSchematic
  s += svgTerminal({ id: 'comA',  label: 'C',  x: 78,  y: 193, noLabel: true });
  s += svgTerminal({ id: 'v1A',   label: 'V1', x: 64,  y: 193, noLabel: true });
  s += svgTerminal({ id: 'v2A',   label: 'V2', x: 92,  y: 193, noLabel: true });
  s += svgTerminal({ id: 'comB',  label: 'C',  x: 278, y: 193, noLabel: true });
  s += svgTerminal({ id: 'nLamp', label: 'N',  x: 339, y: 92 });

  // Labels for B-side bornes (not drop targets, just visual — dark bg for readability)
  s += '<rect x="256" y="172" width="16" height="12" rx="2" fill="#222"/>';
  s += '<text x="264" y="181" text-anchor="middle" font-size="8" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">V1</text>';
  s += '<rect x="284" y="172" width="16" height="12" rx="2" fill="#222"/>';
  s += '<text x="292" y="181" text-anchor="middle" font-size="8" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">V2</text>';

  return svgWrap(s, '0 -12 380 257');
}

/* ===== N3: ENCUENTRA EL ERROR ===== */

function buildSVG_N3(errorDef) {
  var s = '';
  s += '<rect x="0" y="-12" width="380" height="282" rx="12" fill="rgba(255,255,255,.03)"/>';

  s += svgMagnetotermico(165, 10);
  s += svgConmutador(50, 140, 'CONM. A');
  s += svgConmutador(250, 140, 'CONM. B');
  s += svgBombilla(345, 60);

  // Neutro (fixed)
  s += '<path class="wire wire-fixed" data-wire="w-neutro" d="M339,92 L339,120 L178,120 L178,87" fill="none" style="stroke:#2E86C1;stroke-width:4;stroke-dasharray:none"/>';

  var correctPaths = {
    'w-cuadro-comA': 'M190,20 L190,8 L78,8 L78,193',
    'w-v1A-v1B':     'M64,193 L64,218 L264,218 L264,193',
    'w-v2A-v2B':     'M92,193 L92,233 L292,233 L292,193',
    'w-comB-lamp':   'M278,193 L278,135 L345,135 L345,88'
  };
  var wrongPaths = {
    'w-cuadro-comA': { v1A: 'M190,20 L190,8 L64,8 L64,193' },
    'w-v1A-v1B':     { comA: 'M78,193 L78,218 L264,218 L264,193' },
    'w-comB-lamp':   { v2B: 'M292,193 L292,135 L345,135 L345,88' }
  };

  var allWires = [
    { id: 'w-cuadro-comA', color: '#8B5E3C' },
    { id: 'w-v1A-v1B',     color: '#1B1B1B' },
    { id: 'w-v2A-v2B',     color: '#555555' },
    { id: 'w-comB-lamp',   color: '#333' }
  ];

  allWires.forEach(function(w) {
    var isWrong = (w.id === errorDef.wrongWire);
    var path = correctPaths[w.id];
    if (isWrong && wrongPaths[w.id] && wrongPaths[w.id][errorDef.wrongTo]) {
      path = wrongPaths[w.id][errorDef.wrongTo];
    }
    var cls = isWrong ? 'wire wire-suspect' : 'wire wire-fixed';
    s += '<path class="' + cls + '" data-wire="' + w.id + '" d="' + path + '" fill="none" style="stroke:' + w.color + ';stroke-width:4;stroke-dasharray:none"/>';
    s += '<path class="wire-hit" data-wire="' + w.id + '" d="' + path + '" fill="none"/>';
  });

  var terms = [
    { id: 'comA', label: 'C',  x: 78,  y: 193 },
    { id: 'v1A',  label: 'V1', x: 64,  y: 193 },
    { id: 'v2A',  label: 'V2', x: 92,  y: 193 },
    { id: 'v1B',  label: 'V1', x: 264, y: 193 },
    { id: 'v2B',  label: 'V2', x: 292, y: 193 },
    { id: 'comB', label: 'C',  x: 278, y: 193 }
  ];
  terms.forEach(function(t) {
    // Bold dark background labels for N3 readability
    s += '<rect x="' + (t.x - 10) + '" y="' + (t.y - 24) + '" width="20" height="14" rx="3" fill="#222"/>';
    s += '<text data-for="' + t.id + '" x="' + t.x + '" y="' + (t.y - 13) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">' + t.label + '</text>';
  });

  return svgWrap(s, '0 -12 380 282');
}

/* ===== N4: CHEQUEO RAPIDO ===== */

function buildSVG_N4(scenario) {
  var s = '';
  s += '<rect x="0" y="-12" width="380" height="282" rx="12" fill="rgba(255,255,255,.03)"/>';

  s += svgMagnetotermico(165, 10);
  s += svgConmutador(50, 140, 'CONM. A');
  s += svgConmutador(250, 140, 'CONM. B');
  s += svgBombilla(345, 60);

  // Neutro (fixed)
  s += '<path class="wire wire-fixed" d="M339,92 L339,120 L178,120 L178,87" fill="none" style="stroke:#2E86C1;stroke-width:4;stroke-dasharray:none"/>';

  var paths = {
    fase:    'M190,20 L190,8 L78,8 L78,193',
    v1:      'M64,193 L64,218 L264,218 L264,193',
    v2:      'M92,193 L92,233 L292,233 L292,193',
    retorno: 'M278,193 L278,135 L345,135 L345,88'
  };

  if (!scenario.works) {
    if (scenario.label.indexOf('Fase en viajero') >= 0) {
      paths.fase = 'M190,20 L190,8 L64,8 L64,193';
    } else if (scenario.label.indexOf('sin cruzar') >= 0) {
      paths.v1 = 'M64,193 L64,218 L292,218 L292,193';
      paths.v2 = 'M92,193 L92,233 L264,233 L264,193';
    } else if (scenario.label.indexOf('Retorno en viajero') >= 0) {
      paths.retorno = 'M292,193 L292,135 L345,135 L345,88';
    } else if (scenario.label.indexOf('Comunes conectados') >= 0) {
      paths.v1 = 'M78,193 L78,218 L278,218 L278,193';
    }
  }

  var colors = { fase: '#8B5E3C', v1: '#1B1B1B', v2: '#555555', retorno: '#333' };
  ['fase', 'v1', 'v2', 'retorno'].forEach(function(k) {
    s += '<path class="wire wire-fixed" d="' + paths[k] + '" fill="none" style="stroke:' + colors[k] + ';stroke-width:4;stroke-dasharray:none"/>';
  });

  var terms = [
    { id: 'comA', label: 'C',  x: 78,  y: 193 },
    { id: 'v1A',  label: 'V1', x: 64,  y: 193 },
    { id: 'v2A',  label: 'V2', x: 92,  y: 193 },
    { id: 'v1B',  label: 'V1', x: 264, y: 193 },
    { id: 'v2B',  label: 'V2', x: 292, y: 193 },
    { id: 'comB', label: 'C',  x: 278, y: 193 }
  ];
  terms.forEach(function(t) {
    s += '<rect x="' + (t.x - 10) + '" y="' + (t.y - 24) + '" width="20" height="14" rx="3" fill="#222"/>';
    s += '<text x="' + t.x + '" y="' + (t.y - 13) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="\'Baloo 2\',cursive">' + t.label + '</text>';
  });

  if (scenario.works) {
    s += '<style>#svg-lamp{fill:var(--lemon)!important;stroke:var(--lemon)!important;filter:drop-shadow(0 0 12px rgba(255,255,171,.6))!important}</style>';
  }

  return svgWrap(s, '0 -12 380 282');
}

/* ===== RENDER HELPERS ===== */

/* ===== MISSION & HINT ===== */

var currentHintIndex = 0;

function setMission(lvl) {
  var m = MISSIONS[lvl];
  if (!m) return;
  $('mission-text').textContent = m.text;
  currentHintIndex = 0;
  hintUsed = false;
  var btn = $('mission-hint');
  btn.classList.remove('used');
  btn.classList.add('pulse');
  setTimeout(function() { btn.classList.remove('pulse'); }, 4000);
}

function onHintClick() {
  var m = MISSIONS[level];
  if (!m || !m.hints || m.hints.length === 0) return;
  var hint = m.hints[currentHintIndex % m.hints.length];
  showCharMsg(hint, A.happy);
  currentHintIndex++;
  hintUsed = true;
  setTimeout(function() { hideCharMsg(); }, 3500);
  if (currentHintIndex >= m.hints.length) {
    $('mission-hint').classList.add('used');
  }
}

function renderLives() {
  var c = $('hud-lives');
  c.innerHTML = '';
  for (var i = 0; i < MAX_LIVES; i++) {
    var h = document.createElement('span');
    h.className = 'hud-heart' + (i >= lives ? ' lost' : '');
    h.textContent = '❤️';
    c.appendChild(h);
  }
}

function renderScore() {
  $('hud-score').textContent = score + ' pts';
}

function flash(color) {
  var el = $('flash-overlay');
  el.className = 'flash-overlay flash-' + color;
  setTimeout(function() { el.className = 'flash-overlay'; }, 400);
}

var _celebTimer = null;
function showCharMsg(text, avatar) {
  var av = avatar || A.happy;
  $('char-av').src = av;
  var bub = $('char-bubble');
  bub.textContent = text;
  bub.classList.add('show');
  if (_celebTimer) { clearTimeout(_celebTimer); _celebTimer = null; }
  if (av === A.celebrating) {
    _celebTimer = setTimeout(function() {
      $('char-av').src = A.happy;
      _celebTimer = null;
    }, 2000);
  }
}

function hideCharMsg() {
  $('char-bubble').classList.remove('show');
}

function showFeedback(avatar, text, sub, cb) {
  $('fb-av').src = avatar;
  $('fb-text').textContent = text;
  $('fb-sub').textContent = sub || '';
  $('feedback-overlay').classList.add('show');
  $('fb-btn').onclick = function() {
    $('feedback-overlay').classList.remove('show');
    if (cb) cb();
  };
}

function setWireState(wireId, state) {
  // Update ALL elements with this data-wire (both visual wire and drop area)
  var els = document.querySelectorAll('[data-wire="' + wireId + '"]');
  els.forEach(function(el) {
    if (el.classList.contains('wire-drop')) return; // Don't restyle drop areas
    el.className = 'wire wire-' + state;
  });
}

function setTerminalState(termId, state) {
  var els = document.querySelectorAll('.terminal[data-id="' + termId + '"]');
  els.forEach(function(el) {
    el.className = 'terminal' + (state ? ' ' + state : '');
  });
  var lbl = document.querySelector('.terminal-label[data-for="' + termId + '"]');
  if (lbl) {
    if (state === 'highlight') {
      lbl.classList.add('highlight-label');
    } else {
      lbl.classList.remove('highlight-label');
    }
  }
}

function setLampOn() {
  var lamp = document.getElementById('svg-lamp');
  if (lamp) {
    lamp.classList.remove('lamp-off');
    lamp.classList.add('lamp-on');
    lamp.style.animation = 'lampGlow 1s ease-in-out';
  }
}

function setLampOff() {
  var lamp = document.getElementById('svg-lamp');
  if (lamp) {
    lamp.classList.remove('lamp-on');
    lamp.classList.add('lamp-off');
    lamp.style.animation = '';
  }
}

/* ===== LOSE LIFE ===== */

function loseLife() {
  lives--;
  levelErrors++;
  renderLives();
  flash('red');
  var livesEl = $('hud-lives');
  livesEl.classList.add('shaking');
  setTimeout(function() { livesEl.classList.remove('shaking'); }, 350);
  if (lives <= 0) {
    setTimeout(function() { showResults(); }, 600);
    return true;
  }
  return false;
}

/* ===== ADD SCORE ===== */

function addScore(pts) {
  score += pts;
  renderScore();
  checkTask();
}

function checkTask() {
  if (score >= TASK_THRESHOLD && !taskSent) {
    taskSent = true;
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch (e) {}
  }
}

/* ===== CABLE TRAY + DRAG (N1-N2) ===== */

var connectedTerminals = {};
var connectedWires = {};
var currentLevel = null;

function buildCableTray(levelDef) {
  var tray = $('cable-tray');
  tray.innerHTML = '';
  tray.classList.remove('hidden');
  tray.classList.add('has-chips');
  var allCables = levelDef.cables.concat(levelDef.distractors || []);
  shuffle(allCables);
  // Smaller chips when there are many cables
  var smallChips = allCables.length > 5;
  allCables.forEach(function(c) {
    var chip = document.createElement('div');
    chip.className = 'cable-chip ' + c.css;
    chip.textContent = c.label;
    chip.dataset.cableId = c.id;
    chip.dataset.accepts = c.accepts;
    if (smallChips) {
      chip.style.fontSize = '11px';
      chip.style.height = '34px';
      chip.style.padding = '0 8px';
    }
    tray.appendChild(chip);
  });
}

function setupDrag() {
  var body = $('play');
  ghostEl = $('drag-ghost');

  function getPos(e) {
    var t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function getDropTarget(x, y) {
    // Check terminals first (higher priority)
    var terms = document.querySelectorAll('.terminal-hit');
    for (var i = 0; i < terms.length; i++) {
      var r = terms[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return { type: 'terminal', id: terms[i].dataset.id };
      }
    }
    // Then check wire drop areas
    var wireDrop = document.querySelectorAll('.wire-drop');
    for (var j = 0; j < wireDrop.length; j++) {
      // Use a point-in-stroke check via SVG
      var el = wireDrop[j];
      var svg = el.closest('svg');
      if (!svg) continue;
      var pt = svg.createSVGPoint();
      var ctm = svg.getScreenCTM();
      if (!ctm) continue;
      pt.x = (x - ctm.e) / ctm.a;
      pt.y = (y - ctm.f) / ctm.d;
      // Check if point is near the path (within stroke width)
      if (el.isPointInStroke && el.isPointInStroke(pt)) {
        // Find which wire this is and which terminal it connects to
        var wireId = el.dataset.wire;
        return { type: 'wire', wireId: wireId };
      }
    }
    return null;
  }

  function wireToTerminal(wireId) {
    // Map wire id to its terminal id
    if (!currentLevel) return null;
    var wire = currentLevel.wires.find(function(w) { return w.id === wireId; });
    if (!wire || !wire.cable) return null;
    // Find the cable that connects to this wire
    var cable = currentLevel.cables.find(function(c) { return c.id === wire.cable; });
    if (!cable) return null;
    return cable.accepts; // terminal id
  }

  function onStart(e) {
    if (busy || switchDemoActive) return;
    var target = e.target.closest('.cable-chip');
    if (!target || target.classList.contains('used')) return;
    e.preventDefault();
    dragCable = target;
    dragCable.classList.add('dragging');

    ghostEl.innerHTML = '';
    var clone = dragCable.cloneNode(true);
    clone.classList.remove('dragging');
    clone.style.pointerEvents = 'none';
    ghostEl.appendChild(clone);
    ghostEl.classList.add('active');

    var pos = getPos(e);
    ghostEl.style.left = (pos.x - 40) + 'px';
    ghostEl.style.top = (pos.y - 22) + 'px';

    // Highlight valid terminals AND wire paths
    currentLevel.terminals.forEach(function(t) {
      if (!connectedTerminals[t.id]) {
        setTerminalState(t.id, 'highlight');
      }
    });
    // Highlight empty wires
    currentLevel.wires.forEach(function(w) {
      if (w.type === 'empty' && !connectedWires[w.id]) {
        var wireEl = document.querySelector('.wire[data-wire="' + w.id + '"]');
        if (wireEl) wireEl.classList.add('wire-highlight');
      }
    });
  }

  function onMove(e) {
    if (!dragCable) return;
    e.preventDefault();
    var pos = getPos(e);
    ghostEl.style.left = (pos.x - 40) + 'px';
    ghostEl.style.top = (pos.y - 22) + 'px';
  }

  function onEnd(e) {
    if (!dragCable) return;
    var pos;
    if (e.changedTouches) {
      pos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    } else {
      pos = { x: e.clientX, y: e.clientY };
    }

    var dropResult = getDropTarget(pos.x, pos.y);
    var termId = null;

    if (dropResult) {
      if (dropResult.type === 'terminal') {
        termId = dropResult.id;
      } else if (dropResult.type === 'wire') {
        // Dropped on a wire — resolve to the terminal it maps to
        termId = wireToTerminal(dropResult.wireId);
      }
    }

    // Reset highlights
    currentLevel.terminals.forEach(function(t) {
      if (!connectedTerminals[t.id]) {
        setTerminalState(t.id, '');
      }
    });
    // Remove wire highlights
    document.querySelectorAll('.wire-highlight').forEach(function(el) {
      el.classList.remove('wire-highlight');
    });

    ghostEl.classList.remove('active');
    dragCable.classList.remove('dragging');

    if (termId && !connectedTerminals[termId]) {
      processDrop(dragCable, termId);
    }

    dragCable = null;
  }

  body.addEventListener('touchstart', onStart, { passive: false });
  body.addEventListener('touchmove', onMove, { passive: false });
  body.addEventListener('touchend', onEnd);
  body.addEventListener('mousedown', onStart);
  body.addEventListener('mousemove', onMove);
  body.addEventListener('mouseup', onEnd);
}

function processDrop(cableEl, termId) {
  busy = true;
  var cableAccepts = cableEl.dataset.accepts;

  if (cableAccepts === termId) {
    // Correct!
    connectedTerminals[termId] = true;
    // Remove chip from tray (not just fade — fully remove)
    cableEl.remove();
    setTerminalState(termId, 'filled');

    // Find wire and light it up with cable color
    var wire = currentLevel.wires.find(function(w) { return w.cable === cableEl.dataset.cableId; });
    if (wire) {
      connectedWires[wire.id] = true;
      setWireState(wire.id, 'connected');
      // Apply cable color to connected wire
      var cableColors = { fase: '#8B5E3C', retorno: '#333', neutro: '#2E86C1', tierra: 'url(#pat-tierra)', viaj1: '#1B1B1B', viaj2: '#555555' };
      var wireEl = document.querySelector('.wire[data-wire="' + wire.id + '"]');
      if (wireEl && cableColors[cableEl.dataset.cableId]) {
        wireEl.style.stroke = cableColors[cableEl.dataset.cableId];
        wireEl.style.strokeWidth = '4';
        wireEl.style.strokeDasharray = 'none';
      }
    }

    flash('green');
    addScore(currentLevel.ptsPerCable);
    showCharMsg(pick(['¡Bien conectado!', '¡Ese borne es correcto!', '¡Eso es!']), A.celebrating);
    setTimeout(function() { hideCharMsg(); }, 1200);

    // Check if level complete
    var allDone = currentLevel.terminals.every(function(t) { return connectedTerminals[t.id]; });
    if (allDone) {
      onLevelComplete();
      // busy stays true — onLevelComplete manages it
    } else {
      busy = false;
    }
  } else if (cableAccepts === '_none') {
    // Distractor cable dropped on a valid terminal
    showCharMsg('Ese cable no se usa en este circuito. ¡Cuidado!', A.worried);
    var dead = loseLife();
    if (!dead) {
      setTimeout(function() { hideCharMsg(); busy = false; }, 2000);
    }
  } else {
    // Wrong terminal
    setTerminalState(termId, 'error');
    setTimeout(function() { setTerminalState(termId, ''); }, 500);

    var feedback = getDropFeedback(cableEl.dataset.cableId, termId);
    showCharMsg(feedback, A.worried);

    var dead = loseLife();
    if (!dead) {
      setTimeout(function() { hideCharMsg(); busy = false; }, 2000);
    }
  }
}

/* ===== LEVEL COMPLETE — WIRE LABELS + SWITCH DEMO ===== */

function showWireLabels() {
  if (!currentLevel || !currentLevel.wireLabels) return;
  var svg = document.querySelector('.circuit-area svg');
  if (!svg) return;
  var labels = currentLevel.wireLabels;
  Object.keys(labels).forEach(function(wireId) {
    var lbl = labels[wireId];
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', lbl.pos[0]);
    el.setAttribute('y', lbl.pos[1]);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('class', 'wire-label-text');
    el.setAttribute('fill', lbl.color);
    el.textContent = lbl.text;
    // Two-line label support
    if (lbl.text2) {
      var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttribute('x', lbl.pos[0]);
      tspan.setAttribute('dy', '10');
      tspan.setAttribute('font-size', '7');
      tspan.textContent = lbl.text2;
      el.appendChild(tspan);
    }
    svg.appendChild(el);
  });
}

function onLevelComplete() {
  setLampOn();
  busy = true;

  // Show wire labels (names on each cable)
  showWireLabels();

  // Add bonus
  if (levelErrors === 0) {
    addScore(currentLevel.bonusPerfect);
  }

  setTimeout(function() {
    var tecla = document.getElementById('interruptor-tecla');
    var arm = document.getElementById('interruptor-arm');

    if (!tecla) {
      // N2: conmutada — toggle with lever animation
      switchDemoActive = true;
      var lampIsOn = true;
      var conmAPos = 1; // 1=left, 2=right
      var conmBPos = 1;

      showCharMsg('¡Conmutada completada! Pulsa un conmutador para encender y apagar.', A.celebrating);

      var svgEl = document.querySelector('.circuit-area svg');
      // Add hint labels
      if (svgEl) {
        var hintGrp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        hintGrp.setAttribute('class', 'toggle-hint');
        ['78', '278'].forEach(function(xPos) {
          var h = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          h.setAttribute('x', xPos); h.setAttribute('y', '133');
          h.setAttribute('text-anchor', 'middle'); h.setAttribute('font-size', '8');
          h.setAttribute('font-weight', '700'); h.setAttribute('fill', 'var(--lemon)');
          h.setAttribute('font-family', "'Baloo 2',cursive");
          h.textContent = '☝ pulsa';
          hintGrp.appendChild(h);
        });
        svgEl.appendChild(hintGrp);
      }

      var armA = document.getElementById('conm-arm-A');
      var armB = document.getElementById('conm-arm-B');

      function toggleConm(which) {
        if (which === 'A') {
          conmAPos = conmAPos === 1 ? 2 : 1;
          if (armA) {
            armA.setAttribute('x2', conmAPos === 1 ? '66' : '90');
            armA.setAttribute('y2', '176');
          }
        } else {
          conmBPos = conmBPos === 1 ? 2 : 1;
          if (armB) {
            armB.setAttribute('x2', conmBPos === 1 ? '266' : '290');
            armB.setAttribute('y2', '176');
          }
        }
        // Lamp is ON when both conmutadores are in same position
        lampIsOn = (conmAPos === conmBPos);
        if (lampIsOn) {
          setLampOn();
          showCharMsg('¡ENCENDIDA! Ambos conmutadores en la misma posición.', A.celebrating);
        } else {
          setLampOff();
          showCharMsg('APAGADA. Un conmutador ha cambiado de posición.', A.happy);
        }
      }

      function onConmToggleA(ev) { ev.stopPropagation(); ev.preventDefault(); toggleConm('A'); }
      function onConmToggleB(ev) { ev.stopPropagation(); ev.preventDefault(); toggleConm('B'); }

      var clickZoneA = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      clickZoneA.setAttribute('x', '50'); clickZoneA.setAttribute('y', '140');
      clickZoneA.setAttribute('width', '56'); clickZoneA.setAttribute('height', '70');
      clickZoneA.setAttribute('fill', 'transparent'); clickZoneA.setAttribute('cursor', 'pointer');
      clickZoneA.classList.add('tecla-clickable');
      clickZoneA.addEventListener('click', onConmToggleA);
      clickZoneA.addEventListener('touchend', onConmToggleA);
      if (svgEl) svgEl.appendChild(clickZoneA);

      var clickZoneB = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      clickZoneB.setAttribute('x', '250'); clickZoneB.setAttribute('y', '140');
      clickZoneB.setAttribute('width', '56'); clickZoneB.setAttribute('height', '70');
      clickZoneB.setAttribute('fill', 'transparent'); clickZoneB.setAttribute('cursor', 'pointer');
      clickZoneB.classList.add('tecla-clickable');
      clickZoneB.addEventListener('click', onConmToggleB);
      clickZoneB.addEventListener('touchend', onConmToggleB);
      if (svgEl) svgEl.appendChild(clickZoneB);

      var tray = $('cable-tray');
      tray.innerHTML = '';
      tray.classList.remove('hidden');
      tray.classList.remove('has-chips');
      var nextBtn = document.createElement('button');
      nextBtn.className = 'btn';
      nextBtn.textContent = 'Siguiente nivel →';
      nextBtn.style.margin = '16px auto 0';
      nextBtn.addEventListener('click', function() {
        switchDemoActive = false;
        hideCharMsg();
        tray.classList.add('hidden');
        busy = false;
        nextLevel();
      });
      tray.appendChild(nextBtn);
      return;
    }

    // N1: Enable switch toggling — click ANYWHERE on the SVG interruptor area
    switchDemoActive = true;
    var lampIsOn = true;

    showCharMsg('¡Circuito completo! Pulsa el interruptor para encender y apagar.', A.celebrating);

    // Create a large click zone over the entire interruptor area
    var svg = document.querySelector('.circuit-area svg');
    var clickRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    // Interruptor is at (100,70) size 56x68
    clickRect.setAttribute('x', '96'); clickRect.setAttribute('y', '66');
    clickRect.setAttribute('width', '64'); clickRect.setAttribute('height', '76');
    clickRect.setAttribute('fill', 'transparent'); clickRect.setAttribute('cursor', 'pointer');
    clickRect.setAttribute('id', 'switch-click-zone');
    clickRect.classList.add('tecla-clickable');
    if (svg) svg.appendChild(clickRect);

    // Add arrow + text hint below interruptor
    if (svg) {
      var arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      arrowGroup.setAttribute('class', 'toggle-hint');
      var arrowText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      arrowText.setAttribute('x', '128'); arrowText.setAttribute('y', '165');
      arrowText.setAttribute('text-anchor', 'middle');
      arrowText.setAttribute('font-size', '9'); arrowText.setAttribute('font-weight', '700');
      arrowText.setAttribute('fill', 'var(--lemon)');
      arrowText.setAttribute('font-family', "'Baloo 2',cursive");
      arrowText.textContent = '☝ enciende / apaga';
      arrowGroup.appendChild(arrowText);
      svg.appendChild(arrowGroup);
    }

    var armX1 = arm ? parseFloat(arm.getAttribute('x1')) : 0;
    var armY1 = arm ? parseFloat(arm.getAttribute('y1')) : 0;
    var l1X = armX1 - 12;
    var l1Y = armY1 - 32;

    function toggleSwitch() {
      lampIsOn = !lampIsOn;
      if (lampIsOn) {
        setLampOn();
        if (arm) { arm.setAttribute('x2', String(l1X)); arm.setAttribute('y2', String(l1Y)); }
        showCharMsg('¡ENCENDIDO! La palanca toca L1 y cierra el circuito.', A.celebrating);
      } else {
        setLampOff();
        if (arm) { arm.setAttribute('x2', String(armX1 + 10)); arm.setAttribute('y2', String(armY1 - 28)); }
        showCharMsg('APAGADO. La palanca se separa de L1 y abre el circuito.', A.happy);
      }
    }

    function onSwitchClick(ev) { ev.stopPropagation(); ev.preventDefault(); toggleSwitch(); }

    clickRect.addEventListener('click', onSwitchClick);
    clickRect.addEventListener('touchend', onSwitchClick);

    var tray = $('cable-tray');
    tray.innerHTML = '';
    tray.classList.remove('hidden');
    tray.classList.remove('has-chips');
    var nextBtn = document.createElement('button');
    nextBtn.className = 'btn';
    nextBtn.textContent = 'Siguiente nivel →';
    nextBtn.style.margin = '16px auto 0';
    nextBtn.addEventListener('click', function() {
      switchDemoActive = false;
      clickRect.removeEventListener('click', onSwitchClick);
      clickRect.removeEventListener('touchend', onSwitchClick);
      hideCharMsg();
      tray.classList.add('hidden');
      busy = false;
      nextLevel();
    });
    tray.appendChild(nextBtn);
  }, 600);
}

function getDropFeedback(cableId, termId) {
  if (cableId === 'fase' && termId.indexOf('v') === 0) {
    return 'La fase SIEMPRE va al Común (C), no a un Viajero (V1/V2).';
  }
  if (cableId === 'retorno' && termId.indexOf('v') === 0) {
    return 'El retorno sale del Común (C), no de un Viajero.';
  }
  if ((cableId === 'viaj1' || cableId === 'viaj2') && termId.indexOf('com') === 0) {
    return 'Los viajeros van a V1 y V2, no al Común (C). C es para fase/retorno.';
  }
  if (cableId === 'fase' && termId === 'sal') {
    return 'La fase entra por L0 (entrada). L1 es la salida para el retorno.';
  }
  if (cableId === 'retorno' && termId === 'L') {
    return 'El retorno sale por L1 (salida). L0 es la entrada de la fase.';
  }
  if (cableId === 'neutro' && termId !== 'N') {
    return 'El neutro (azul) sale de la bombilla por el borne N y vuelve al cuadro.';
  }
  if (cableId === 'tierra' && termId !== 'T') {
    return 'El cable de tierra (verde-amarillo) sale por el borne T hacia la barra de tierra.';
  }
  // Neutro placed on conmutador instead of lámpara (N2)
  if (cableId === 'neutro' && termId.indexOf('com') === 0) {
    return 'El neutro va a la lámpara (N), no al conmutador.';
  }
  return 'Ese cable no va en ese borne. Piensa en la funcion de cada uno.';
}

/* ===== LEVEL 3 — FIND THE ERROR ===== */

var currentN3Error = null;
var n3SelectedWire = null;

function setupLevel3() {
  currentN3Error = pick(N3_ERRORS);
  n3Attempts = 0;
  n3SelectedWire = null;

  $('cable-tray').classList.add('hidden');
  $('verdict-area').classList.remove('show');
  $('circuit-area').innerHTML = buildSVG_N3(currentN3Error);

  showCharMsg(LEVEL3.intro, A.worried);
  setTimeout(function() { hideCharMsg(); }, 4500);

  var hits = document.querySelectorAll('.wire-hit');
  hits.forEach(function(hit) {
    hit.addEventListener('click', onWireTap);
    hit.addEventListener('touchend', function(e) {
      e.preventDefault();
      onWireTap.call(this, e);
    });
  });
}

function onWireTap(e) {
  if (busy) return;
  var wireId = this.dataset.wire;
  if (wireId === 'w-neutro') return;

  if (wireId === currentN3Error.wrongWire) {
    busy = true;
    setWireState(wireId, 'selected');
    showCharMsg('¡Encontrado! ¿A donde deberia ir este cable?', A.celebrating);
    showFixOptions();
  } else {
    n3Attempts++;
    setWireState(wireId, 'error');
    showCharMsg('Ese cable esta bien colocado. Sigue buscando.', A.worried);
    var dead = loseLife();
    if (!dead) {
      setTimeout(function() {
        setWireState(wireId, 'fixed');
        hideCharMsg();
        if (n3Attempts >= 2) {
          showCharMsg('Pista: mira donde llega la fase y los viajeros.', A.happy);
          setTimeout(function() { hideCharMsg(); }, 2500);
        }
      }, 1000);
    }
  }
}

function showFixOptions() {
  var existing = document.querySelector('.fix-options');
  if (existing) existing.remove();

  var container = document.createElement('div');
  container.className = 'fix-options show';

  var title = document.createElement('div');
  title.className = 'fix-title';
  title.textContent = '¿A que borne deberia ir?';
  container.appendChild(title);

  var options = [currentN3Error.correctTo];
  var allTerms = ['comA', 'v1A', 'v2A', 'v1B', 'v2B', 'comB'];
  shuffle(allTerms);
  allTerms.forEach(function(t) {
    if (t !== currentN3Error.correctTo && t !== currentN3Error.wrongTo && options.length < 3) {
      options.push(t);
    }
  });
  shuffle(options);

  var termLabels = { comA: 'Comun A', v1A: 'Viajero 1 A', v2A: 'Viajero 2 A', v1B: 'Viajero 1 B', v2B: 'Viajero 2 B', comB: 'Comun B' };

  options.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'fix-btn';
    btn.textContent = termLabels[opt] || opt;
    btn.onclick = function() { handleFix(opt, container); };
    container.appendChild(btn);
  });

  // Insert before the spacer so it stays visible on mobile
  var cableTray = $('cable-tray');
  cableTray.parentNode.insertBefore(container, cableTray.nextSibling);
}

function handleFix(chosen, container) {
  if (busy === false) return;

  var btns = container.querySelectorAll('.fix-btn');
  btns.forEach(function(b) { b.style.pointerEvents = 'none'; });

  if (chosen === currentN3Error.correctTo) {
    var pts = LEVEL3.ptsFind;
    if (n3Attempts === 0) pts += LEVEL3.bonusFirst;
    addScore(pts);
    flash('green');
    setWireState(currentN3Error.wrongWire, 'connected');
    setLampOn();

    setTimeout(function() {
      container.remove();
      showFeedback(A.celebrating, '¡Reparado!',
        n3Attempts === 0 ? '¡A la primera! +' + pts + ' pts' : '+' + pts + ' pts',
        function() { busy = false; nextLevel(); });
    }, 600);
  } else {
    var clickedBtn = null;
    btns.forEach(function(b) {
      if (b.textContent.toLowerCase().indexOf(chosen.toLowerCase()) >= 0 ||
          b.textContent === (({ comA: 'Comun A', v1A: 'Viajero 1 A', v2A: 'Viajero 2 A', v1B: 'Viajero 1 B', v2B: 'Viajero 2 B', comB: 'Comun B' })[chosen])) {
        b.classList.add('wrong');
        clickedBtn = b;
      }
    });

    showCharMsg(currentN3Error.hint, A.worried);
    n3Attempts++;
    var dead = loseLife();

    if (!dead) {
      setTimeout(function() {
        btns.forEach(function(b) {
          b.classList.remove('wrong');
          b.style.pointerEvents = 'auto';
        });
        hideCharMsg();
      }, 1500);
    }
  }
}

/* ===== LEVEL 4 — TIMER + VERDICT ===== */

function setupLevel4() {
  $('cable-tray').classList.add('hidden');
  n4Scenario = 0;

  var working = N4_POOL.filter(function(s) { return s.works; });
  var broken = N4_POOL.filter(function(s) { return !s.works; });
  n4Scenarios = [pick(working), pick(broken)];
  n4Scenarios.push(pick(N4_POOL));
  shuffle(n4Scenarios);

  showCharMsg(LEVEL4.intro, A.happy);
  setTimeout(function() {
    hideCharMsg();
    showN4Scenario();
  }, 2000);
}

function showN4Scenario() {
  if (n4Scenario >= LEVEL4.totalScenarios) {
    showFeedback(A.celebrating, '¡Chequeo completado!', '', function() { showResults(); });
    return;
  }

  var scenario = n4Scenarios[n4Scenario];
  $('circuit-area').innerHTML = buildSVG_N4(scenario);
  $('verdict-area').classList.add('show');
  $('hud-level').textContent = 'Nivel 4 · ' + (n4Scenario + 1) + '/' + LEVEL4.totalScenarios;

  var btnOk = $('btn-funciona');
  var btnNo = $('btn-no-funciona');
  btnOk.className = 'verdict-btn verdict-ok';
  btnNo.className = 'verdict-btn verdict-no';

  n4Start = Date.now();
  var fill = $('timer-fill');
  fill.style.transition = 'none';
  fill.style.width = '100%';
  fill.classList.remove('warning');

  fill.offsetHeight;
  fill.style.transition = 'width ' + LEVEL4.timePerScenario + 's linear';
  fill.style.width = '0%';

  setTimeout(function() {
    fill.classList.add('warning');
  }, (LEVEL4.timePerScenario - 10) * 1000);

  clearTimeout(n4Timer);
  n4Timer = setTimeout(function() {
    handleVerdict(null);
  }, LEVEL4.timePerScenario * 1000);

  btnOk.onclick = function() { handleVerdict(true); };
  btnNo.onclick = function() { handleVerdict(false); };
}

function handleVerdict(answer) {
  clearTimeout(n4Timer);
  busy = true;
  var scenario = n4Scenarios[n4Scenario];
  var elapsed = (Date.now() - n4Start) / 1000;

  var btnOk = $('btn-funciona');
  var btnNo = $('btn-no-funciona');
  btnOk.classList.add('disabled');
  btnNo.classList.add('disabled');

  var fill = $('timer-fill');
  fill.style.transition = 'none';
  var currentWidth = fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width * 100;
  fill.style.width = currentWidth + '%';

  if (answer === null) {
    showCharMsg('¡Se acabo el tiempo!', A.worried);
    loseLife();
  } else if ((answer && scenario.works) || (!answer && !scenario.works)) {
    var pts = LEVEL4.ptsCorrect;
    if (elapsed < LEVEL4.speedThreshold) pts += LEVEL4.bonusSpeed;
    addScore(pts);
    flash('green');

    if (answer) { btnOk.classList.add('correct'); }
    else { btnNo.classList.add('correct'); }

    showCharMsg(scenario.explanation, A.celebrating);
  } else {
    if (answer) { btnOk.classList.add('wrong'); }
    else { btnNo.classList.add('wrong'); }

    showCharMsg(scenario.explanation, A.worried);
    loseLife();
  }

  if (lives > 0) {
    setTimeout(function() {
      hideCharMsg();
      n4Scenario++;
      busy = false;
      showN4Scenario();
    }, 2500);
  }
}

/* ===== LEVEL TRANSITIONS ===== */

function startLevel(lvl) {
  level = lvl;
  levelErrors = 0;
  connectedTerminals = {};
  connectedWires = {};
  busy = false;
  switchDemoActive = false;

  $('verdict-area').classList.remove('show');
  var existingFix = document.querySelector('.fix-options');
  if (existingFix) existingFix.remove();

  setMission(lvl);

  if (lvl === 1) {
    currentLevel = LEVEL1;
    $('hud-level').textContent = LEVEL1.name;
    $('circuit-area').innerHTML = LEVEL1.buildSVG();
    buildCableTray(LEVEL1);
    showCharMsg(LEVEL1.intro, A.happy);
    setTimeout(function() { hideCharMsg(); }, 2500);
  } else if (lvl === 2) {
    currentLevel = LEVEL2;
    $('hud-level').textContent = LEVEL2.name;
    $('circuit-area').innerHTML = LEVEL2.buildSVG();
    buildCableTray(LEVEL2);
    showCharMsg(LEVEL2.intro, A.happy);
    setTimeout(function() { hideCharMsg(); }, 8000);
  } else if (lvl === 3) {
    currentLevel = null;
    $('hud-level').textContent = LEVEL3.name;
    setupLevel3();
  } else if (lvl === 4) {
    currentLevel = null;
    $('hud-level').textContent = LEVEL4.name;
    setupLevel4();
  }
}

function nextLevel() {
  if (level < 4) {
    startLevel(level + 1);
  } else {
    showResults();
  }
}

/* ===== RESULTS ===== */

function showResults() {
  clearTimeout(n4Timer);
  busy = true;

  var isNew = score > record;
  if (isNew) {
    record = score;
    localStorage.setItem('pasillo_dos_puntos_record', record);
  }

  $('res-score').textContent = score;
  $('res-record').textContent = record;
  $('res-new').className = 'res-new' + (isNew ? ' show' : '');

  var avatar, badge, msg;
  if (score >= 350) {
    avatar = A.celebrating;
    badge = '⚡ ELECTRICISTA PRO';
    msg = '¡Eres un crack del cableado! Montaje pro.';
  } else if (score >= TASK_THRESHOLD) {
    avatar = A.happy;
    badge = '💡 BUEN TRABAJO';
    msg = '¡Buen trabajo! Vas pillando el tema de las conmutadas.';
  } else {
    avatar = A.worried;
    badge = '🔧 SIGUE PRACTICANDO';
    msg = 'Hay que repasar los bornes. ¡La proxima sera mejor!';
  }

  $('res-av').src = avatar;
  $('res-badge').textContent = badge;
  $('res-msg').textContent = msg;

  showScreen('results');
}

/* ===== INIT ===== */

function startGame() {
  score = 0;
  lives = MAX_LIVES;
  level = 0;
  taskSent = false;
  busy = false;
  switchDemoActive = false;

  renderLives();
  renderScore();
  showScreen('play');
  startLevel(1);
}

function init() {
  $('intro-av').src = A.happy;

  Object.values(A).forEach(function(url) {
    var img = new Image();
    img.src = url;
  });

  $('intro-btn').addEventListener('click', function() { startGame(); });
  $('res-btn').addEventListener('click', function() { startGame(); });
  $('mission-hint').addEventListener('click', function() { onHintClick(); });

  setupDrag();
}

init();
