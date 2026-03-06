/* ================================================================
   NO ENCIENDE — Kampe Games — Game Logic
   ================================================================ */

/* ===== ASSETS ===== */
var CLD = 'https://res.cloudinary.com/kampe/image/upload/';

var DIEGO = {
  base:    CLD + 'v1772637807/Diego_base_h7qryy.png',
  happy:   CLD + 'v1772716479/Diego_celebrating_sut9ia.png',
  worried: CLD + 'v1772716480/Diego_worried_vrgous.png'
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
function pickN(arr, n) {
  var copy = arr.slice();
  shuffle(copy);
  return copy.slice(0, n);
}

/* ===== SYMBOL POOL (21 symbols — reused from El Plano Electrico) ===== */
function symSVG(paths, vb) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '0 0 60 60') + '" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
}

var SYMBOLS = [
  { id:'lampara', name:'Lampara / punto de luz', svg: symSVG('<circle cx="30" cy="30" r="16"/><line x1="20" y1="20" x2="40" y2="40"/><line x1="40" y1="20" x2="20" y2="40"/>') },
  { id:'interruptor', name:'Interruptor simple', svg: symSVG('<circle cx="12" cy="30" r="4" fill="#fff"/><circle cx="48" cy="30" r="4"/><line x1="16" y1="30" x2="46" y2="14"/>') },
  { id:'conmutador', name:'Conmutador', svg: symSVG('<circle cx="12" cy="30" r="4" fill="#fff"/><circle cx="48" cy="20" r="4"/><circle cx="48" cy="40" r="4"/><line x1="16" y1="30" x2="44" y2="20"/>') },
  { id:'enchufe', name:'Enchufe / base de toma', svg: symSVG('<circle cx="30" cy="30" r="16"/><line x1="22" y1="24" x2="22" y2="36"/><line x1="38" y1="24" x2="38" y2="36"/>') },
  { id:'fusible', name:'Fusible', svg: symSVG('<rect x="14" y="20" width="32" height="20" rx="3"/><line x1="4" y1="30" x2="14" y2="30"/><line x1="46" y1="30" x2="56" y2="30"/><line x1="22" y1="30" x2="38" y2="30" stroke-dasharray="4 3"/>') },
  { id:'magnetotermico', name:'Magnetotermico', svg: symSVG('<line x1="30" y1="4" x2="30" y2="16"/><line x1="30" y1="44" x2="30" y2="56"/><rect x="16" y="16" width="28" height="28" rx="3"/><path d="M24 32 Q30 22 36 32" fill="none"/><line x1="24" y1="38" x2="36" y2="38"/>') },
  { id:'diferencial', name:'Diferencial', svg: symSVG('<line x1="30" y1="4" x2="30" y2="14"/><line x1="30" y1="46" x2="30" y2="56"/><rect x="14" y="14" width="32" height="32" rx="3"/><path d="M22 28 Q30 18 38 28" fill="none"/><path d="M22 34 Q30 24 38 34" fill="none"/><text x="30" y="46" text-anchor="middle" fill="#fff" stroke="none" font-size="10" font-weight="700" font-family="Baloo 2,sans-serif">T</text>') },
  { id:'motor', name:'Motor', svg: symSVG('<circle cx="30" cy="30" r="16"/><text x="30" y="36" text-anchor="middle" fill="#fff" stroke="none" font-size="18" font-weight="700" font-family="Baloo 2,sans-serif">M</text>') },
  { id:'resistencia', name:'Resistencia', svg: symSVG('<line x1="4" y1="30" x2="12" y2="30"/><polyline points="12,30 16,18 22,42 28,18 34,42 40,18 44,42 48,30"/><line x1="48" y1="30" x2="56" y2="30"/>') },
  { id:'pila', name:'Pila / bateria', svg: symSVG('<line x1="4" y1="30" x2="22" y2="30"/><line x1="22" y1="16" x2="22" y2="44"/><line x1="30" y1="22" x2="30" y2="38"/><line x1="38" y1="16" x2="38" y2="44"/><line x1="38" y1="30" x2="56" y2="30"/>') },
  { id:'generador', name:'Generador AC', svg: symSVG('<circle cx="30" cy="30" r="16"/><text x="30" y="37" text-anchor="middle" fill="#fff" stroke="none" font-size="20" font-weight="700" font-family="Baloo 2,sans-serif">~</text>') },
  { id:'diodo', name:'Diodo', svg: symSVG('<line x1="4" y1="30" x2="20" y2="30"/><polygon points="20,18 20,42 40,30" fill="none"/><line x1="40" y1="18" x2="40" y2="42"/><line x1="40" y1="30" x2="56" y2="30"/>') },
  { id:'conductor', name:'Conductor / cable', svg: symSVG('<line x1="4" y1="30" x2="56" y2="30" stroke-width="4"/>') },
  { id:'nudo', name:'Conexion / nudo', svg: symSVG('<line x1="4" y1="30" x2="56" y2="30"/><line x1="30" y1="8" x2="30" y2="52"/><circle cx="30" cy="30" r="5" fill="#fff" stroke="#fff"/>') },
  { id:'cruce', name:'Cruce sin conexion', svg: symSVG('<line x1="4" y1="30" x2="24" y2="30"/><line x1="36" y1="30" x2="56" y2="30"/><path d="M24 30 Q30 18 36 30" fill="none"/><line x1="30" y1="8" x2="30" y2="52"/>') },
  { id:'interruptor_cerrado', name:'Interruptor cerrado', svg: symSVG('<circle cx="12" cy="30" r="4" fill="#fff"/><circle cx="48" cy="30" r="4" fill="#fff"/><line x1="16" y1="30" x2="44" y2="30"/>') },
  { id:'amperimetro', name:'Amperimetro', svg: symSVG('<line x1="4" y1="30" x2="14" y2="30"/><circle cx="30" cy="30" r="16"/><text x="30" y="36" text-anchor="middle" fill="#fff" stroke="none" font-size="18" font-weight="700" font-family="Baloo 2,sans-serif">A</text><line x1="46" y1="30" x2="56" y2="30"/>') },
  { id:'voltimetro', name:'Voltimetro', svg: symSVG('<line x1="4" y1="30" x2="14" y2="30"/><circle cx="30" cy="30" r="16"/><text x="30" y="36" text-anchor="middle" fill="#fff" stroke="none" font-size="18" font-weight="700" font-family="Baloo 2,sans-serif">V</text><line x1="46" y1="30" x2="56" y2="30"/>') },
  { id:'bobina', name:'Bobina / inductor', svg: symSVG('<line x1="4" y1="30" x2="10" y2="30"/><path d="M10 30 Q14 14 18 30 Q22 14 26 30 Q30 14 34 30 Q38 14 42 30 Q46 14 50 30" fill="none"/><line x1="50" y1="30" x2="56" y2="30"/>') },
  { id:'pulsador', name:'Pulsador', svg: symSVG('<circle cx="12" cy="36" r="4" fill="#fff"/><circle cx="48" cy="36" r="4"/><line x1="16" y1="36" x2="44" y2="36"/><line x1="30" y1="36" x2="30" y2="16"/><line x1="22" y1="16" x2="38" y2="16"/>') },
  { id:'resistencia_rect', name:'Resistencia (rectangular)', svg: symSVG('<line x1="4" y1="30" x2="14" y2="30"/><rect x="14" y="20" width="32" height="20" rx="2"/><line x1="46" y1="30" x2="56" y2="30"/>') }
];

/* ===== CHECK STEPS (4 panels — no Empalmes photo) ===== */
var CHECK_STEPS = [
  { name: 'Visual', short: 'Visual' },
  { name: 'Ruta', short: 'Ruta' },
  { name: 'Mando', short: 'Mando' },
  { name: 'Cierre', short: 'Cierre' }
];

/* ===== FAULT OPTIONS per step ===== */
var FAULT_OPTIONS = [
  ['Cobre visible', 'Borne flojo', 'Cable pellizcado'],
  ['Circuito abierto', 'Cable en fase equivocada', 'Falta conexion a tierra'],
  ['Comun mal cableado', 'Viajeros cruzados', 'Interruptor en neutro'],
  ['Cable pellizcado', 'Conductor movido', 'Tapa mal cerrada']
];

/* ===== PANEL PHOTOS (Cloudinary) ===== */
/* Fault photos */
var PHOTO_FAULT = {
  visual:  CLD + 'Foto_1_Fallo_Visual-_Cobre_visible_en_borne_tmkalm.jpg',
  ruta:    CLD + 'Foto_2_Ruta_yoeqcx.jpg',
  mando:   CLD + 'Foto_3_Mando_yyircc.jpg',
  cierre:  CLD + 'Foto_5_Cierre_tvcycn.jpg'
};
/* OK photos */
var PHOTO_OK = {
  magneto:      CLD + 'Magneto_protección_gg8lki.jpg',
  lampara:      CLD + 'Lámpara_mq2gvw.jpg',
  interruptor:  CLD + 'interruptor_ovacnu.jpg',
  conmutador2:  CLD + 'conmutador2_cnefrj.jpg',
  tapa:         CLD + 'tapa_cierre_pxcl5k.jpg'
};

/* ===== CLEAN SVG SCHEMAS — bigger text (16px labels, 22px L/N), thicker lines, ~30% larger symbols ===== */
function schemaSVG1() {
  var s = '<svg viewBox="0 0 340 170" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" font-family="Baloo 2,sans-serif">';
  s += '<text x="8" y="28" fill="#E74C3C" stroke="none" font-size="22" font-weight="700">L</text>';
  s += '<text x="8" y="162" fill="#00E6BC" stroke="none" font-size="22" font-weight="700">N</text>';
  s += '<line x1="30" y1="20" x2="75" y2="20"/>';
  /* Magneto */
  s += '<rect x="75" y="4" width="36" height="34" rx="4"/>';
  s += '<path d="M85 14 Q93 6 101 14" fill="none"/><line x1="85" y1="22" x2="101" y2="22"/>';
  s += '<text x="93" y="54" text-anchor="middle" fill="rgba(255,255,255,.6)" stroke="none" font-size="16">Magneto</text>';
  /* Interruptor */
  s += '<line x1="111" y1="20" x2="148" y2="20"/>';
  s += '<circle cx="153" cy="20" r="5" fill="#fff"/><circle cx="197" cy="20" r="5"/>';
  s += '<line x1="158" y1="20" x2="194" y2="6"/>';
  s += '<text x="175" y="54" text-anchor="middle" fill="rgba(255,255,255,.6)" stroke="none" font-size="16">Interruptor</text>';
  /* Wire → lamp */
  s += '<line x1="202" y1="20" x2="250" y2="20"/><line x1="250" y1="20" x2="250" y2="56"/>';
  /* Lampara */
  s += '<circle cx="250" cy="78" r="20"/><line x1="238" y1="66" x2="262" y2="90"/><line x1="262" y1="66" x2="238" y2="90"/>';
  s += '<text x="250" y="114" text-anchor="middle" fill="rgba(255,255,255,.6)" stroke="none" font-size="16">Lampara</text>';
  /* Return */
  s += '<line x1="250" y1="98" x2="250" y2="155"/><line x1="250" y1="155" x2="30" y2="155"/>';
  s += '</svg>';
  return s;
}

function schemaSVG2() {
  var s = '<svg viewBox="0 0 340 180" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" font-family="Baloo 2,sans-serif">';
  s += '<text x="8" y="28" fill="#E74C3C" stroke="none" font-size="22" font-weight="700">L</text>';
  s += '<text x="8" y="174" fill="#00E6BC" stroke="none" font-size="22" font-weight="700">N</text>';
  s += '<line x1="30" y1="20" x2="48" y2="20"/>';
  /* Dif */
  s += '<rect x="48" y="4" width="32" height="32" rx="4"/>';
  s += '<path d="M56 14 Q64 6 72 14" fill="none"/><path d="M56 20 Q64 12 72 20" fill="none"/>';
  /* Mag */
  s += '<line x1="80" y1="20" x2="92" y2="20"/>';
  s += '<rect x="92" y="4" width="32" height="32" rx="4"/>';
  s += '<path d="M100 14 Q108 6 116 14" fill="none"/><line x1="100" y1="22" x2="116" y2="22"/>';
  /* Interruptor */
  s += '<line x1="124" y1="20" x2="148" y2="20"/>';
  s += '<circle cx="153" cy="20" r="5" fill="#fff"/><circle cx="193" cy="20" r="5"/>';
  s += '<line x1="158" y1="20" x2="190" y2="6"/>';
  /* Split */
  s += '<line x1="198" y1="20" x2="228" y2="20"/>';
  s += '<circle cx="228" cy="20" r="4" fill="#fff" stroke="#fff"/>';
  /* Lamp 1 */
  s += '<line x1="228" y1="20" x2="228" y2="48"/>';
  s += '<circle cx="228" cy="68" r="18"/><line x1="218" y1="58" x2="238" y2="78"/><line x1="238" y1="58" x2="218" y2="78"/>';
  s += '<line x1="228" y1="86" x2="228" y2="110"/>';
  /* Lamp 2 */
  s += '<line x1="228" y1="20" x2="296" y2="20"/><line x1="296" y1="20" x2="296" y2="48"/>';
  s += '<circle cx="296" cy="68" r="18"/><line x1="286" y1="58" x2="306" y2="78"/><line x1="306" y1="58" x2="286" y2="78"/>';
  s += '<line x1="296" y1="86" x2="296" y2="110"/>';
  /* Neutro */
  s += '<circle cx="228" cy="110" r="4" fill="#fff" stroke="#fff"/>';
  s += '<line x1="296" y1="110" x2="228" y2="110"/>';
  s += '<line x1="228" y1="110" x2="228" y2="165"/><line x1="228" y1="165" x2="30" y2="165"/>';
  s += '</svg>';
  return s;
}

function schemaSVG3() {
  var s = '<svg viewBox="0 0 380 170" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" font-family="Baloo 2,sans-serif">';
  s += '<text x="8" y="28" fill="#E74C3C" stroke="none" font-size="22" font-weight="700">L</text>';
  s += '<text x="8" y="162" fill="#00E6BC" stroke="none" font-size="22" font-weight="700">N</text>';
  s += '<line x1="30" y1="20" x2="40" y2="20"/>';
  /* Dif */
  s += '<rect x="40" y="4" width="28" height="32" rx="4"/>';
  s += '<path d="M48 14 Q54 6 60 14" fill="none"/><path d="M48 20 Q54 12 60 20" fill="none"/>';
  /* Mag */
  s += '<line x1="68" y1="20" x2="78" y2="20"/>';
  s += '<rect x="78" y="4" width="28" height="32" rx="4"/>';
  s += '<path d="M86 14 Q92 6 98 14" fill="none"/><line x1="86" y1="22" x2="98" y2="22"/>';
  /* Conm 1 — shifted left, more space before viajeros */
  s += '<line x1="106" y1="20" x2="124" y2="20"/>';
  s += '<circle cx="129" cy="20" r="5" fill="#fff"/>';
  s += '<circle cx="169" cy="8" r="5"/><circle cx="169" cy="32" r="5"/>';
  s += '<line x1="134" y1="20" x2="164" y2="8"/>';
  s += '<text x="150" y="54" text-anchor="middle" fill="rgba(255,255,255,.6)" stroke="none" font-size="16">Conm.1</text>';
  /* Viajeros — wider gap (60px instead of 30px) */
  s += '<line x1="174" y1="8" x2="244" y2="8"/>';
  s += '<line x1="174" y1="32" x2="244" y2="32"/>';
  /* Conm 2 — shifted right */
  s += '<circle cx="249" cy="8" r="5"/><circle cx="249" cy="32" r="5"/>';
  s += '<circle cx="289" cy="20" r="5" fill="#fff"/>';
  s += '<line x1="254" y1="8" x2="284" y2="20"/>';
  s += '<text x="270" y="54" text-anchor="middle" fill="rgba(255,255,255,.6)" stroke="none" font-size="16">Conm.2</text>';
  /* Lamp */
  s += '<line x1="294" y1="20" x2="330" y2="20"/><line x1="330" y1="20" x2="330" y2="50"/>';
  s += '<circle cx="330" cy="73" r="20"/><line x1="318" y1="61" x2="342" y2="85"/><line x1="342" y1="61" x2="318" y2="85"/>';
  /* Return */
  s += '<line x1="330" y1="93" x2="330" y2="155"/><line x1="330" y1="155" x2="30" y2="155"/>';
  s += '</svg>';
  return s;
}

function schemaSVG5() {
  var s = '<svg viewBox="0 0 340 170" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" font-family="Baloo 2,sans-serif">';
  s += '<text x="8" y="28" fill="#E74C3C" stroke="none" font-size="22" font-weight="700">L</text>';
  s += '<text x="8" y="162" fill="#00E6BC" stroke="none" font-size="22" font-weight="700">N</text>';
  s += '<line x1="30" y1="20" x2="75" y2="20"/>';
  /* Magneto */
  s += '<rect x="75" y="4" width="36" height="34" rx="4"/>';
  s += '<path d="M85 14 Q93 6 101 14" fill="none"/><line x1="85" y1="22" x2="101" y2="22"/>';
  /* Interruptor */
  s += '<line x1="111" y1="20" x2="148" y2="20"/>';
  s += '<circle cx="153" cy="20" r="5" fill="#fff"/><circle cx="197" cy="20" r="5"/>';
  s += '<line x1="158" y1="20" x2="194" y2="6"/>';
  /* Lamp */
  s += '<line x1="202" y1="20" x2="250" y2="20"/><line x1="250" y1="20" x2="250" y2="50"/>';
  s += '<circle cx="250" cy="73" r="20"/><line x1="238" y1="61" x2="262" y2="85"/><line x1="262" y1="61" x2="238" y2="85"/>';
  /* Return through tapa */
  s += '<line x1="250" y1="93" x2="250" y2="104"/>';
  s += '<rect x="234" y="104" width="32" height="38" rx="4" stroke="rgba(255,255,255,.4)" stroke-dasharray="4 3"/>';
  s += '<text x="250" y="130" text-anchor="middle" fill="rgba(255,255,255,.4)" stroke="none" font-size="14">Tapa</text>';
  s += '<line x1="250" y1="104" x2="250" y2="155"/>';
  s += '<line x1="250" y1="155" x2="30" y2="155"/>';
  s += '</svg>';
  return s;
}

/* ===== PANELS — "inspect the schema" mechanic ===== */
/*
  New flow (2-step diagnosis):
  1. SVG schema shown (small) with 3 invisible tap zones
  2. Tap zone → photo popup shows that area in real life
  3. Close photo → Step 1: choose CHECK CATEGORY (Visual/Ruta/Mando/Cierre)
  4. If fault zone → Step 2: choose FAULT TYPE from that category
     If OK zone → must pick "OK" button → correct = +5pts
  5. After finding the fault → next panel

  Each zone has a photo (ok or fault) and metadata.
*/
var PANELS = [
  {
    id: 1,
    title: 'Circuito simple',
    desc: 'Magneto → Interruptor → Lampara',
    correctCategory: 'Visual',
    faultOption: 0,
    feedback: 'Visual siempre primero. Si ves cobre fuera, ahi tienes tu problema. Reinserta el conductor correctamente.',
    svg: schemaSVG1,
    zones: [
      { x: 20, y: 0, w: 24, h: 55, photo: PHOTO_OK.magneto, fault: false },
      { x: 38, y: 0, w: 25, h: 55, photo: PHOTO_FAULT.visual, fault: true },
      { x: 64, y: 10, w: 28, h: 80, photo: PHOTO_OK.lampara, fault: false }
    ]
  },
  {
    id: 2,
    title: 'Circuito 2 lamparas',
    desc: 'Dif + Magneto → Interruptor → 2 lamparas',
    correctCategory: 'Ruta',
    faultOption: 0,
    feedback: 'Sin camino completo, no hay corriente. Fuente → carga → retorno. Si falta un tramo, no enciende.',
    svg: schemaSVG2,
    zones: [
      { x: 12, y: 0, w: 24, h: 40, photo: PHOTO_OK.magneto, fault: false },
      { x: 38, y: 0, w: 22, h: 40, photo: PHOTO_OK.interruptor, fault: false },
      { x: 58, y: 5, w: 35, h: 70, photo: PHOTO_FAULT.ruta, fault: true }
    ]
  },
  {
    id: 3,
    title: 'Conmutada',
    desc: 'Dif + Magneto → 2 Conmutadores → Lampara',
    correctCategory: 'Mando',
    faultOption: 0,
    feedback: 'El conmutador tiene un comun y dos viajeros (negro y gris). Si el comun esta donde no toca, la logica de conmutacion falla.',
    svg: schemaSVG3,
    zones: [
      { x: 26, y: 0, w: 22, h: 55, photo: PHOTO_FAULT.mando, fault: true },
      { x: 60, y: 0, w: 22, h: 55, photo: PHOTO_OK.conmutador2, fault: false },
      { x: 82, y: 10, w: 16, h: 80, photo: PHOTO_OK.lampara, fault: false }
    ]
  },
  {
    id: 4,
    title: 'Circuito simple',
    desc: 'Magneto → Interruptor → Lampara',
    correctCategory: 'Cierre',
    faultOption: 0,
    feedback: 'Siempre comprueba el cierre. Un cable pellizcado puede perder contacto o provocar un cortocircuito con el tiempo.',
    svg: schemaSVG5,
    zones: [
      { x: 20, y: 0, w: 24, h: 55, photo: PHOTO_OK.magneto, fault: false },
      { x: 38, y: 0, w: 25, h: 55, photo: PHOTO_OK.interruptor, fault: false },
      { x: 62, y: 15, w: 28, h: 75, photo: PHOTO_FAULT.cierre, fault: true }
    ]
  }
];

/* ===== QUIZ QUESTIONS ===== */
var QUIZ = [
  {
    q: '¿Cual es el PRIMER paso del check?',
    opts: ['Revisar empalmes', 'Visual', 'Probar el interruptor'],
    correct: 1,
    fb: 'Siempre primero miras. Si ves algo evidente (cobre fuera, cable suelto), ya tienes pista sin tocar nada.'
  },
  {
    q: 'No enciende y todo se ve bien visualmente. ¿Que haces?',
    opts: ['Tocar cables al azar', 'Cambiar la lampara', 'Comprobar ruta/continuidad'],
    correct: 2,
    fb: 'Despues del visual, piensas: ¿hay camino completo? Fuente → carga → retorno. Si falta un tramo, no enciende.'
  },
  {
    q: '¿Cual es el error mas comun al diagnosticar?',
    opts: ['Saltarse el visual', 'Ir demasiado lento', 'Usar demasiadas herramientas'],
    correct: 0,
    fb: 'El visual es lo mas rapido y lo primero que se salta. Mucha gente empieza tocando cosas sin mirar antes.'
  },
  {
    q: 'Detectas un borne flojo en el interruptor. ¿Cual es tu "accion 1"?',
    opts: ['Cambiar el interruptor', 'Reapretar el borne y comprobar', 'Llamar al encargado'],
    correct: 1,
    fb: 'La accion 1 siempre es la mas simple y segura. Reapretar un borne es rapido, seguro y probablemente soluciona el problema.'
  },
  {
    q: '¿Que significa "no poder explicar en 1 frase que estas comprobando"?',
    opts: ['Que el fallo es muy complicado', 'Que estas improvisando', 'Que necesitas mas formacion'],
    correct: 1,
    fb: 'Si no puedes decir en 1 frase que estas mirando y por que, es que no estas siguiendo el check. Estas adivinando.'
  }
];

/* ===== GAME STATE ===== */
var MAX_LIVES = 5;
var TASK_THRESHOLD = 180;
var score = 0;
var lives = MAX_LIVES;
var busy = false;
var taskSent = false;
var record = parseInt(localStorage.getItem('no_enciende_record')) || 0;

/* R0 state */
var r0Questions = [];
var r0Idx = 0;

/* Check state */
var currentPanel = 0;
var panelErrors = 0;

/* Quiz state */
var quizIdx = 0;

/* ===== DOM REFS ===== */
var gameArea = $('game-area');
var charBubble = $('char-bubble');
var hudLevel = $('hud-level');
var hudLives = $('hud-lives');
var hudScore = $('hud-score');

/* ===== CORE FUNCTIONS ===== */
function updateHUD() {
  var h = '';
  for (var i = 0; i < MAX_LIVES; i++) {
    h += '<span class="hud-heart' + (i >= lives ? ' lost' : '') + '">❤️</span>';
  }
  hudLives.innerHTML = h;
  hudScore.textContent = score + ' pts';
}

function addScore(pts) {
  score += pts;
  updateHUD();
  checkTaskCompleted();
}

function loseLife() {
  lives--;
  updateHUD();
  hudLives.classList.add('shaking');
  setTimeout(function() { hudLives.classList.remove('shaking'); }, 350);
  if (lives <= 0) {
    setTimeout(showResults, 800);
    return true;
  }
  return false;
}

function checkTaskCompleted() {
  if (!taskSent && score >= TASK_THRESHOLD) {
    taskSent = true;
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch(e) {}
  }
}

function say(msg, state) {
  var src = DIEGO[state || 'base'] || DIEGO.base;
  $('diego-av').src = src;
  charBubble.classList.remove('show');
  setTimeout(function() {
    charBubble.textContent = msg;
    charBubble.classList.add('show');
  }, 60);
}

function showFeedback(icon, text, isSuccess, cb) {
  $('fb-icon').textContent = icon;
  $('fb-text').innerHTML = text;
  var card = $('fb-card');
  card.className = 'feedback-card ' + (isSuccess ? 'success' : 'error');
  $('fb-overlay').classList.add('show');
  $('fb-btn').onclick = function() {
    $('fb-overlay').classList.remove('show');
    if (cb) setTimeout(cb, 100);
  };
}

/* ===== R0: ARCADE — RAIN (always 1 correct visible) ===== */
/*
  Symbols rain down smoothly. 6 on screen at a time.
  GUARANTEE: at least 1 is the current correct symbol — always visible.
  Tap correct → +10, next question, symbol pops. Tap wrong → flash red.
  When a symbol exits bottom it respawns from top as a new random symbol
  (or as the correct one if none is visible).
*/
var arcadeField, arcadePromptEl, arcadeProgressEl;
var arcadeActive = false;
var RAIN_COUNT = 16;
var FALL_S = 5.5; /* seconds to cross full field */
var RAIN_COLS = 5; /* number of lanes to prevent overlap */
var rainColNext = 0; /* round-robin lane assignment */

function startArcade() {
  hudLevel.textContent = 'R0';
  r0Questions = pickN(SYMBOLS, 10);
  r0Idx = 0;
  arcadeActive = true;
  say('Primero, un repaso rapido. A ver si te acuerdas de los simbolos.', 'base');

  gameArea.innerHTML =
    '<div class="arcade-prompt" id="arcade-prompt">¿Cual es: <span>' + r0Questions[0].name + '</span>?</div>' +
    '<div class="arcade-field" id="arcade-field"></div>' +
    '<div class="arcade-progress" id="arcade-progress">1/10</div>';

  arcadeField = $('arcade-field');
  arcadePromptEl = $('arcade-prompt');
  arcadeProgressEl = $('arcade-progress');

  /* Spawn initial batch — distribute evenly across screen + above */
  setTimeout(function() {
    for (var i = 0; i < RAIN_COUNT; i++) {
      /* Spread from 80% (bottom) to -60% (above screen) */
      var y = 80 - (i * 10);
      spawnRain(i === 0, y);
    }
  }, 400);
}

/* Does any visible symbol match current correct? */
function hasCorrectOnScreen() {
  if (!arcadeField) return false;
  var target = r0Questions[r0Idx];
  var found = false;
  arcadeField.querySelectorAll('.rain-sym').forEach(function(el) {
    if (el.getAttribute('data-id') === target.id) found = true;
  });
  return found;
}

function spawnRain(forceCorrect, startPct) {
  if (!arcadeActive) return;

  var target = r0Questions[r0Idx];
  /* Pick symbol: force correct if requested or if none on screen */
  var needCorrect = forceCorrect || !hasCorrectOnScreen();
  var sym = needCorrect ? target : pick(SYMBOLS);

  var el = document.createElement('div');
  el.className = 'rain-sym';
  el.innerHTML = sym.svg;
  el.setAttribute('data-id', sym.id);

  /* Lane-based horizontal position to prevent overlap */
  var colW = (100 - 4) / RAIN_COLS; /* 4% total margin */
  var col = rainColNext % RAIN_COLS;
  rainColNext++;
  el.style.left = (2 + col * colW + Math.random() * (colW - 16)) + '%';

  /* Start position */
  var y0 = (startPct != null) ? startPct : -14;
  el.style.top = y0 + '%';

  /* Smooth fall */
  var dist = 114 - y0;
  var dur = FALL_S * (dist / 114);
  el.style.transition = 'top ' + dur + 's linear';

  arcadeField.appendChild(el);
  el.offsetHeight; /* reflow */
  el.style.top = '114%';

  /* Recycle when it exits */
  var timer = setTimeout(function() {
    if (el.parentNode) el.remove();
    if (arcadeActive) spawnRain(false, null);
  }, dur * 1000 + 50);

  /* Tap handler */
  el.addEventListener('click', function(e) {
    e.stopPropagation();
    if (busy || !arcadeActive) return;

    var current = r0Questions[r0Idx];
    if (sym.id === current.id) {
      busy = true;
      /* Freeze position — stop the fall transition */
      var currentY = getComputedStyle(el).top;
      el.style.transition = 'none';
      el.style.top = currentY;
      /* Force reflow then apply pop effect */
      el.offsetHeight;
      el.classList.add('correct');
      el.style.transition = 'transform .4s ease-out, opacity .4s';
      el.style.transform = 'scale(1.8) rotate(25deg)';
      el.style.opacity = '0';
      addScore(10);
      clearTimeout(timer);
      setTimeout(function() { if (el.parentNode) el.remove(); }, 450);

      r0Idx++;
      if (r0Idx >= r0Questions.length) {
        arcadeActive = false;
        setTimeout(function() { busy = false; endArcade(); }, 400);
      } else {
        arcadePromptEl.querySelector('span').textContent = r0Questions[r0Idx].name;
        arcadeProgressEl.textContent = (r0Idx + 1) + '/10';
        /* Ensure a correct one is on screen for new question */
        if (!hasCorrectOnScreen()) spawnRain(true, null);
        setTimeout(function() { busy = false; }, 250);
      }
    } else {
      el.classList.add('wrong');
      setTimeout(function() { el.classList.remove('wrong'); }, 400);
    }
  });
}

function endArcade() {
  arcadeActive = false;
  if (arcadeField) {
    arcadeField.querySelectorAll('.rain-sym').forEach(function(el) {
      el.style.transition = 'opacity .4s';
      el.style.opacity = '0';
    });
  }
  say('Bien, te los sabes. Ahora lo serio.', 'happy');
  setTimeout(function() {
    $('check-av-diego').src = DIEGO.base;
    showScreen('check-intro');
  }, 1200);
}

/* ===== CHECK: 4 PANELS — "inspect the schema" ===== */
/*
  Flow per panel (2-STEP DIAGNOSIS):
  1. SVG schema shown (compact) with 3 invisible tap zones (no labels)
  2. Tap zone → photo popup shows that zone in real life
  3. Close photo → Step 1: "¿Que ves?" → OK / Hay fallo
  4. If "Hay fallo":
     a) Step 2a: choose CHECK CATEGORY (Visual/Ruta/Mando/Cierre)
     b) Step 2b: choose FAULT TYPE from that category's options
  5. Correct = points; Wrong at any step = lose life
  6. After finding the fault → next panel
*/
var checkedZones = []; /* indices of zones already inspected this panel */

function startCheck() {
  currentPanel = 0;
  $('diego-av').classList.add('quiz-big');
  showScreen('play');
  startPanel();
}

function startPanel() {
  if (currentPanel >= PANELS.length) {
    startQuiz();
    return;
  }
  var panel = PANELS[currentPanel];
  panelErrors = 0;
  checkedZones = [];
  hudLevel.textContent = 'Panel ' + panel.id;
  say('Toca una zona del esquema para inspeccionarla.', 'base');
  renderPanel();
}

function renderPanel() {
  var panel = PANELS[currentPanel];

  /* Step bar */
  var stepBar = '<div class="step-bar">';
  for (var i = 0; i < CHECK_STEPS.length; i++) {
    var cls = '';
    if (i < currentPanel) cls = 'done';
    else if (i === currentPanel) cls = 'active';
    stepBar += '<div class="step-seg ' + cls + '">';
    stepBar += '<div class="step-seg-bar ' + cls + '"></div>';
    stepBar += '<div class="step-seg-label">' + CHECK_STEPS[i].short + '</div>';
    stepBar += '</div>';
  }
  stepBar += '</div>';

  var svgHtml = panel.svg();

  var html = stepBar;
  html += '<div class="step-label">' + panel.title + ': ' + panel.desc + '</div>';

  /* Schema with invisible zones overlaid (NO labels) */
  html += '<div class="schema-inspect" id="schema-inspect">';
  html += svgHtml;

  panel.zones.forEach(function(z, idx) {
    var checked = checkedZones.indexOf(idx) !== -1;
    var cls = 'schema-zone' + (checked ? ' checked' : '');
    html += '<div class="' + cls + '" data-idx="' + idx + '" style="left:' + z.x + '%;top:' + z.y + '%;width:' + z.w + '%;height:' + z.h + '%"></div>';
  });

  html += '</div>'; /* schema-inspect */
  html += '<div class="check-hint">Toca una zona para inspeccionarla</div>';
  /* Diagnosis area — starts empty */
  html += '<div id="diagnosis-area"></div>';

  gameArea.innerHTML = html;

  /* Zone click handlers */
  gameArea.querySelectorAll('.schema-zone').forEach(function(el) {
    el.addEventListener('click', function() {
      if (busy) return;
      if (el.classList.contains('checked')) return;
      var idx = parseInt(el.getAttribute('data-idx'));
      openPhotoPopup(panel, idx);
    });
  });
}

function openPhotoPopup(panel, zoneIdx) {
  busy = true;
  var zone = panel.zones[zoneIdx];

  /* Show photo overlay — each zone has its own photo */
  var overlay = document.createElement('div');
  overlay.className = 'photo-popup';
  overlay.innerHTML =
    '<div class="photo-popup-card">' +
      '<img src="' + zone.photo + '" alt="Foto">' +
      '<div class="photo-popup-hint">Observa bien esta zona</div>' +
      '<button class="btn btn-sm photo-popup-close">Cerrar y diagnosticar</button>' +
    '</div>';

  document.getElementById('W').appendChild(overlay);
  overlay.offsetHeight; /* reflow */
  overlay.classList.add('show');

  overlay.querySelector('.photo-popup-close').addEventListener('click', function() {
    overlay.classList.remove('show');
    setTimeout(function() {
      overlay.remove();
      showStep1(panel, zoneIdx);
    }, 300);
  });
}

/* Step 1: "¿Que ves?" → OK / Hay fallo */
function showStep1(panel, zoneIdx) {
  var zone = panel.zones[zoneIdx];
  var area = $('diagnosis-area');

  var html = '<div class="diagnosis">';
  html += '<div class="diagnosis-title">¿Que ves en esta zona?</div>';
  html += '<div class="diag-opt" data-action="ok">✓ Todo correcto</div>';
  html += '<div class="diag-opt" data-action="fault">✗ Hay un fallo</div>';
  html += '</div>';
  area.innerHTML = html;

  /* Hide hint */
  var hint = gameArea.querySelector('.check-hint');
  if (hint) hint.style.display = 'none';

  busy = false;

  area.querySelectorAll('.diag-opt').forEach(function(el) {
    el.addEventListener('click', function() {
      if (busy) return;
      busy = true;
      var action = el.getAttribute('data-action');

      if (action === 'ok') {
        if (!zone.fault) {
          /* Correct — zone is clean */
          el.classList.add('correct');
          say('Correcto, ahi no hay problema.', 'happy');
          addScore(5);
          checkedZones.push(zoneIdx);
          markZoneChecked(zoneIdx, 'ok');
          setTimeout(function() {
            area.innerHTML = '';
            var h2 = gameArea.querySelector('.check-hint');
            if (h2) h2.style.display = '';
            busy = false;
          }, 600);
        } else {
          /* Wrong — there IS a fault here */
          el.classList.add('wrong');
          say('Hay un fallo aqui y no lo has visto.', 'worried');
          panelErrors++;
          var dead = loseLife();
          if (!dead) {
            setTimeout(function() {
              area.innerHTML = '';
              var h2 = gameArea.querySelector('.check-hint');
              if (h2) h2.style.display = '';
              busy = false;
            }, 800);
          }
        }
      } else {
        /* Player says "Hay fallo" */
        if (zone.fault) {
          /* Correct — there IS a fault. Go to step 2a: pick category */
          el.classList.add('correct');
          say('Bien visto. ¿Que tipo de comprobacion es?', 'base');
          setTimeout(function() {
            showStep2a(panel, zoneIdx);
          }, 400);
        } else {
          /* Wrong — no fault here */
          el.classList.add('wrong');
          say('No hay fallo aqui.', 'worried');
          panelErrors++;
          var dead2 = loseLife();
          if (!dead2) {
            checkedZones.push(zoneIdx);
            markZoneChecked(zoneIdx, 'wrong');
            setTimeout(function() {
              area.innerHTML = '';
              var h2 = gameArea.querySelector('.check-hint');
              if (h2) h2.style.display = '';
              busy = false;
            }, 800);
          }
        }
      }
    });
  });
}

/* Step 2a: choose CHECK CATEGORY (Visual/Ruta/Mando/Cierre) */
function showStep2a(panel, zoneIdx) {
  var area = $('diagnosis-area');
  var html = '<div class="diagnosis">';
  html += '<div class="diagnosis-title">¿Que tipo de comprobacion?</div>';
  CHECK_STEPS.forEach(function(step, i) {
    html += '<div class="diag-opt" data-cat="' + step.name + '">' + step.name + '</div>';
  });
  html += '</div>';
  area.innerHTML = html;
  busy = false;

  area.querySelectorAll('.diag-opt').forEach(function(el) {
    el.addEventListener('click', function() {
      if (busy) return;
      busy = true;
      var cat = el.getAttribute('data-cat');

      if (cat === panel.correctCategory) {
        el.classList.add('correct');
        say('Correcto. ¿Y cual es el fallo exacto?', 'happy');
        setTimeout(function() {
          showStep2b(panel, zoneIdx);
        }, 400);
      } else {
        el.classList.add('wrong');
        /* Highlight the correct one */
        area.querySelector('[data-cat="' + panel.correctCategory + '"]').classList.add('correct');
        say('No, es un fallo de tipo ' + panel.correctCategory + '.', 'worried');
        panelErrors++;
        var dead = loseLife();
        if (!dead) {
          setTimeout(function() {
            showStep2b(panel, zoneIdx);
          }, 800);
        }
      }
    });
  });
}

/* Step 2b: choose FAULT TYPE within the correct category */
function showStep2b(panel, zoneIdx) {
  var catIdx = CHECK_STEPS.findIndex(function(s) { return s.name === panel.correctCategory; });
  if (catIdx === -1) catIdx = currentPanel;
  var faultOptions = FAULT_OPTIONS[catIdx];

  var area = $('diagnosis-area');
  var html = '<div class="diagnosis">';
  html += '<div class="diagnosis-title">¿Cual es el fallo?</div>';
  faultOptions.forEach(function(opt, i) {
    html += '<div class="diag-opt" data-idx="' + i + '">' + opt + '</div>';
  });
  html += '</div>';
  area.innerHTML = html;
  busy = false;

  area.querySelectorAll('.diag-opt').forEach(function(el) {
    el.addEventListener('click', function() {
      if (busy) return;
      busy = true;
      var chosenFault = parseInt(el.getAttribute('data-idx'));

      if (chosenFault === panel.faultOption) {
        el.classList.add('correct');
        addScore(25);
        if (panelErrors === 0) addScore(10); /* bonus sin errores */
        say('Exacto. ' + panel.feedback, 'happy');
        checkedZones.push(zoneIdx);
        markZoneChecked(zoneIdx, 'fault');
        setTimeout(function() {
          showFeedback('✅', '<strong>¡Fallo detectado!</strong><br><br>' + panel.feedback, true, function() {
            busy = false;
            currentPanel++;
            startPanel();
          });
        }, 500);
      } else {
        el.classList.add('wrong');
        area.querySelector('[data-idx="' + panel.faultOption + '"]').classList.add('correct');
        say('Hay fallo, pero no es ese.', 'worried');
        var dead = loseLife();
        if (!dead) {
          panelErrors++;
          setTimeout(function() {
            showFeedback('⚠️', 'El fallo era: <strong>' + faultOptions[panel.faultOption] + '</strong><br><br>' + panel.feedback, false, function() {
              busy = false;
              currentPanel++;
              startPanel();
            });
          }, 500);
        }
      }
    });
  });
}

function markZoneChecked(idx, result) {
  var el = gameArea.querySelector('.schema-zone[data-idx="' + idx + '"]');
  if (!el) return;
  el.classList.add('checked');
  if (result === 'fault') el.classList.add('found-fault');
  else if (result === 'wrong') el.classList.add('missed');
  else el.classList.add('ok');
}

/* ===== QUIZ FINAL ===== */
function startQuiz() {
  quizIdx = 0;
  hudLevel.textContent = 'Quiz';
  $('diego-av').classList.add('quiz-big');
  say('Ultimo reto. Preguntas rapidas sobre el check.', 'base');
  setTimeout(showQuizQuestion, 600);
}

function showQuizQuestion() {
  if (quizIdx >= QUIZ.length) {
    $('diego-av').classList.remove('quiz-big');
    showResults();
    return;
  }
  $('diego-av').src = DIEGO.base;
  var q = QUIZ[quizIdx];

  var html = '<div class="quiz-question">' + q.q + '</div>';
  html += '<div class="quiz-options">';
  q.opts.forEach(function(opt, i) {
    html += '<div class="quiz-opt" data-idx="' + i + '">' + String.fromCharCode(65 + i) + ') ' + opt + '</div>';
  });
  html += '</div>';
  html += '<div class="quiz-progress">' + (quizIdx + 1) + '/5</div>';

  gameArea.innerHTML = html;

  gameArea.querySelectorAll('.quiz-opt').forEach(function(el) {
    el.addEventListener('click', function() {
      if (busy) return;
      busy = true;
      var idx = parseInt(el.getAttribute('data-idx'));
      handleQuizAnswer(idx, q);
    });
  });
}

function handleQuizAnswer(idx, q) {
  var opts = gameArea.querySelectorAll('.quiz-opt');
  opts.forEach(function(o) { o.classList.add('disabled'); });

  if (idx === q.correct) {
    opts[idx].classList.add('correct');
    addScore(15);
    say(pick(['Correcto.', 'Eso es.', 'Exacto.']), 'happy');
    setTimeout(function() {
      busy = false;
      quizIdx++;
      showQuizQuestion();
    }, 1000);
  } else {
    opts[idx].classList.add('wrong');
    opts[q.correct].classList.add('correct');
    say(q.fb, 'worried');
    var dead = loseLife();
    if (!dead) {
      setTimeout(function() {
        busy = false;
        quizIdx++;
        showQuizQuestion();
      }, 1800);
    }
  }
}

/* ===== RESULTS ===== */
function showResults() {
  if (score > record) {
    record = score;
    localStorage.setItem('no_enciende_record', record);
  }
  checkTaskCompleted();

  $('res-score').textContent = score;
  $('res-record').textContent = score >= record ? '¡NUEVO RECORD! 🎉' : 'Record: ' + record + ' pts';

  var msg, avState;
  if (score >= 280) {
    msg = 'Diagnosticas como un profesional. Puedes tocar cables.';
    avState = 'happy';
  } else if (score >= TASK_THRESHOLD) {
    msg = 'No esta mal. Repasa el check hasta que lo hagas sin pensar.';
    avState = 'base';
  } else {
    msg = 'Hay que repasar. Sin el check dominado, no tocas nada en obra.';
    avState = 'worried';
  }

  $('res-msg').textContent = msg;
  $('res-av-diego').src = DIEGO[avState];
  showScreen('results');
}

/* ===== INIT ===== */
function init() {
  score = 0;
  lives = MAX_LIVES;
  busy = false;
  taskSent = false;
  updateHUD();

  /* Set Diego avatars */
  $('intro-av-diego').src = DIEGO.base;
  $('check-av-diego').src = DIEGO.base;
  $('res-av-diego').src = DIEGO.base;

  showScreen('intro');
}

/* ===== EVENT LISTENERS ===== */
$('intro-btn').addEventListener('click', function() {
  showScreen('play');
  startArcade();
});

$('check-intro-btn').addEventListener('click', function() {
  showScreen('play');
  startCheck();
});

$('res-replay').addEventListener('click', function() {
  location.reload();
});

/* ===== START ===== */
init();
