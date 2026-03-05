/* ================================================================
   EL PLANO ELECTRICO — Kampe Games — Game Logic
   ================================================================ */

/* ===== ASSETS ===== */
var CLD = 'https://res.cloudinary.com/kampe/image/upload/';

var ALEX = {
  base:    CLD + 'v1772704991/Alex_base_zathyx.png',
  happy:   CLD + 'v1772704976/Alex_happy_lu9vx2.png',
  worried: CLD + 'v1772705008/Alex_worried_bcm52p.png'
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

/* ===== SYMBOL POOL (20 symbols with SVG) ===== */
function symSVG(paths, vb) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '0 0 60 60') + '" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
}

var SYMBOLS = [
  {
    id: 'lampara',
    name: 'Lampara / punto de luz',
    desc: 'Representa un punto de iluminacion en el circuito',
    svg: symSVG('<circle cx="30" cy="30" r="16"/><line x1="20" y1="20" x2="40" y2="40"/><line x1="40" y1="20" x2="20" y2="40"/>')
  },
  {
    id: 'interruptor',
    name: 'Interruptor simple',
    desc: 'Abre y cierra un circuito desde un punto',
    svg: symSVG('<circle cx="12" cy="30" r="4" fill="#fff"/><circle cx="48" cy="30" r="4"/><line x1="16" y1="30" x2="46" y2="14"/>')
  },
  {
    id: 'conmutador',
    name: 'Conmutador',
    desc: 'Controla un punto de luz desde dos sitios',
    svg: symSVG('<circle cx="12" cy="30" r="4" fill="#fff"/><circle cx="48" cy="20" r="4"/><circle cx="48" cy="40" r="4"/><line x1="16" y1="30" x2="44" y2="20"/>')
  },
  {
    id: 'enchufe',
    name: 'Enchufe / base de toma',
    desc: 'Punto donde se conecta un aparato electrico',
    svg: symSVG('<circle cx="30" cy="30" r="16"/><line x1="22" y1="24" x2="22" y2="36"/><line x1="38" y1="24" x2="38" y2="36"/>')
  },
  {
    id: 'fusible',
    name: 'Fusible',
    desc: 'Protege el circuito cortando si hay sobrecarga',
    svg: symSVG('<rect x="14" y="20" width="32" height="20" rx="3"/><line x1="4" y1="30" x2="14" y2="30"/><line x1="46" y1="30" x2="56" y2="30"/><line x1="22" y1="30" x2="38" y2="30" stroke-dasharray="4 3"/>')
  },
  {
    id: 'magnetotermico',
    name: 'Magnetotermico',
    desc: 'Protege contra sobrecargas y cortocircuitos',
    /* Rectangulo vertical con arco (disparo termico) + linea horizontal (contacto) */
    svg: symSVG('<line x1="30" y1="4" x2="30" y2="16"/><line x1="30" y1="44" x2="30" y2="56"/><rect x="16" y="16" width="28" height="28" rx="3"/><path d="M24 32 Q30 22 36 32" fill="none"/><line x1="24" y1="38" x2="36" y2="38"/>')
  },
  {
    id: 'diferencial',
    name: 'Diferencial',
    desc: 'Protege a las PERSONAS contra contactos indirectos',
    /* Rectangulo vertical con DOBLE arco (toroidal) + boton de test "T" */
    svg: symSVG('<line x1="30" y1="4" x2="30" y2="14"/><line x1="30" y1="46" x2="30" y2="56"/><rect x="14" y="14" width="32" height="32" rx="3"/><path d="M22 28 Q30 18 38 28" fill="none"/><path d="M22 34 Q30 24 38 34" fill="none"/><text x="30" y="46" text-anchor="middle" fill="#fff" stroke="none" font-size="10" font-weight="700" font-family="Baloo 2,sans-serif">T</text>')
  },
  {
    id: 'motor',
    name: 'Motor',
    desc: 'Representa un motor electrico',
    svg: symSVG('<circle cx="30" cy="30" r="16"/><text x="30" y="36" text-anchor="middle" fill="#fff" stroke="none" font-size="18" font-weight="700" font-family="Baloo 2,sans-serif">M</text>')
  },
  {
    id: 'resistencia',
    name: 'Resistencia',
    desc: 'Elemento que limita el paso de corriente',
    svg: symSVG('<line x1="4" y1="30" x2="12" y2="30"/><polyline points="12,30 16,18 22,42 28,18 34,42 40,18 44,42 48,30"/><line x1="48" y1="30" x2="56" y2="30"/>')
  },
  {
    id: 'pila',
    name: 'Pila / bateria',
    desc: 'Fuente de energia de corriente continua',
    svg: symSVG('<line x1="4" y1="30" x2="22" y2="30"/><line x1="22" y1="16" x2="22" y2="44"/><line x1="30" y1="22" x2="30" y2="38"/><line x1="38" y1="16" x2="38" y2="44"/><line x1="38" y1="30" x2="56" y2="30"/>')
  },
  {
    id: 'generador',
    name: 'Generador AC',
    desc: 'Fuente de corriente alterna',
    svg: symSVG('<circle cx="30" cy="30" r="16"/><text x="30" y="37" text-anchor="middle" fill="#fff" stroke="none" font-size="20" font-weight="700" font-family="Baloo 2,sans-serif">~</text>')
  },
  {
    id: 'diodo',
    name: 'Diodo',
    desc: 'Permite el paso de corriente en un solo sentido',
    svg: symSVG('<line x1="4" y1="30" x2="20" y2="30"/><polygon points="20,18 20,42 40,30" fill="none"/><line x1="40" y1="18" x2="40" y2="42"/><line x1="40" y1="30" x2="56" y2="30"/>')
  },
  {
    id: 'conductor',
    name: 'Conductor / cable',
    desc: 'Linea que conecta elementos del circuito',
    svg: symSVG('<line x1="4" y1="30" x2="56" y2="30" stroke-width="4"/>')
  },
  {
    id: 'nudo',
    name: 'Conexion / nudo',
    desc: 'Punto donde dos conductores se conectan',
    svg: symSVG('<line x1="4" y1="30" x2="56" y2="30"/><line x1="30" y1="8" x2="30" y2="52"/><circle cx="30" cy="30" r="5" fill="#fff" stroke="#fff"/>')
  },
  {
    id: 'cruce',
    name: 'Cruce sin conexion',
    desc: 'Los conductores se cruzan pero NO estan conectados',
    svg: symSVG('<line x1="4" y1="30" x2="24" y2="30"/><line x1="36" y1="30" x2="56" y2="30"/><path d="M24 30 Q30 18 36 30" fill="none"/><line x1="30" y1="8" x2="30" y2="52"/>')
  },
  {
    id: 'interruptor_cerrado',
    name: 'Interruptor cerrado',
    desc: 'Interruptor en posicion cerrada (circuito conectado)',
    svg: symSVG('<circle cx="12" cy="30" r="4" fill="#fff"/><circle cx="48" cy="30" r="4" fill="#fff"/><line x1="16" y1="30" x2="44" y2="30"/>')
  },
  {
    id: 'amperimetro',
    name: 'Amperimetro',
    desc: 'Mide la intensidad de corriente en amperios (se conecta en serie)',
    svg: symSVG('<line x1="4" y1="30" x2="14" y2="30"/><circle cx="30" cy="30" r="16"/><text x="30" y="36" text-anchor="middle" fill="#fff" stroke="none" font-size="18" font-weight="700" font-family="Baloo 2,sans-serif">A</text><line x1="46" y1="30" x2="56" y2="30"/>')
  },
  {
    id: 'voltimetro',
    name: 'Voltimetro',
    desc: 'Mide la tension o voltaje en voltios (se conecta en paralelo)',
    svg: symSVG('<line x1="4" y1="30" x2="14" y2="30"/><circle cx="30" cy="30" r="16"/><text x="30" y="36" text-anchor="middle" fill="#fff" stroke="none" font-size="18" font-weight="700" font-family="Baloo 2,sans-serif">V</text><line x1="46" y1="30" x2="56" y2="30"/>')
  },
  {
    id: 'bobina',
    name: 'Bobina / inductor',
    desc: 'Almacena energia en un campo magnetico',
    svg: symSVG('<line x1="4" y1="30" x2="10" y2="30"/><path d="M10 30 Q14 14 18 30 Q22 14 26 30 Q30 14 34 30 Q38 14 42 30 Q46 14 50 30" fill="none"/><line x1="50" y1="30" x2="56" y2="30"/>')
  },
  {
    id: 'pulsador',
    name: 'Pulsador',
    desc: 'Contacto momentaneo: solo cierra mientras se pulsa',
    svg: symSVG('<circle cx="12" cy="36" r="4" fill="#fff"/><circle cx="48" cy="36" r="4"/><line x1="16" y1="36" x2="44" y2="36"/><line x1="30" y1="36" x2="30" y2="16"/><line x1="22" y1="16" x2="38" y2="16"/>')
  },
  {
    id: 'resistencia_rect',
    name: 'Resistencia (rectangular)',
    desc: 'Representacion rectangular de la resistencia (norma IEC)',
    svg: symSVG('<line x1="4" y1="30" x2="14" y2="30"/><rect x="14" y="20" width="32" height="20" rx="2"/><line x1="46" y1="30" x2="56" y2="30"/>')
  }
];

/* ===== SCHEMA POOL (N3 — circuits with errors) ===== */
function schemaSVG(w, h, content) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + content + '</svg>';
}

function svgLabel(x, y, text, size) {
  return '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="rgba(255,255,255,.85)" stroke="none" font-size="' + (size || 12) + '" font-weight="700" font-family="Baloo 2,sans-serif">' + text + '</text>';
}

function tapRect(x, y, w, h, zone) {
  return '<rect class="tap-zone" data-zone="' + zone + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.12)" stroke-width="1"/>';
}

/* Inline magnetotérmico symbol at (cx, cy) — matches the symbol pool version */
function inlineMagn(cx, cy) {
  var x = cx - 14, y = cy - 14;
  return '<rect x="' + x + '" y="' + y + '" width="28" height="28" rx="3" stroke="#fff" stroke-width="2"/>' +
    '<path d="M' + (cx - 6) + ' ' + (cy + 2) + ' Q' + cx + ' ' + (cy - 8) + ' ' + (cx + 6) + ' ' + (cy + 2) + '" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<line x1="' + (cx - 6) + '" y1="' + (cy + 8) + '" x2="' + (cx + 6) + '" y2="' + (cy + 8) + '" stroke="#fff" stroke-width="2"/>';
}

/* Inline interruptor symbol: dot at (x1,y), open contact to (x2, y-18) */
function inlineInterr(x1, y, x2) {
  return '<circle cx="' + x1 + '" cy="' + y + '" r="4" fill="#fff" stroke="#fff"/>' +
    '<circle cx="' + x2 + '" cy="' + y + '" r="4" fill="none" stroke="#fff"/>' +
    '<line x1="' + (x1 + 4) + '" y1="' + y + '" x2="' + (x2 - 4) + '" y2="' + (y - 18) + '" stroke="#fff" stroke-width="2.5"/>';
}

/* Inline lámpara symbol at (cx, cy) with radius r */
function inlineLamp(cx, cy, r) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="#fff"/>' +
    '<line x1="' + (cx - r * 0.6) + '" y1="' + (cy - r * 0.6) + '" x2="' + (cx + r * 0.6) + '" y2="' + (cy + r * 0.6) + '" stroke="#fff"/>' +
    '<line x1="' + (cx + r * 0.6) + '" y1="' + (cy - r * 0.6) + '" x2="' + (cx - r * 0.6) + '" y2="' + (cy + r * 0.6) + '" stroke="#fff"/>';
}

/* Schema cable colors */
var COL_FASE = '#8B4513';  /* marrón — fase */
var COL_NEUT = '#2980b9';  /* azul — neutro */
var COL_TIER = '#27ae60';  /* verde — tierra */

var SCHEMAS = [
  {
    id: 'interruptor_en_neutro',
    title: 'Circuito con interruptor',
    errorZone: 'interruptor',
    hint: 'Fijate en que cable corta el interruptor: ¿fase o neutro?',
    feedback: 'El interruptor SIEMPRE corta la fase, nunca el neutro. Si corta el neutro, la lampara sigue con tension aunque este apagada.',
    build: function() {
      return schemaSVG(340, 200,
        /* Fase (marrón) — recta arriba */
        '<line x1="20" y1="40" x2="320" y2="40" stroke="' + COL_FASE + '" stroke-width="2"/>' +
        svgLabel(10, 34, 'F', 12) +
        /* Neutro (azul) — con interruptor en el neutro (ERROR) */
        '<line x1="20" y1="160" x2="100" y2="160" stroke="' + COL_NEUT + '" stroke-width="2"/>' +
        '<line x1="170" y1="160" x2="320" y2="160" stroke="' + COL_NEUT + '" stroke-width="2"/>' +
        svgLabel(10, 154, 'N', 12) +
        inlineInterr(105, 160, 165) +
        svgLabel(135, 185, 'Interruptor', 12) +
        /* Lámpara */
        inlineLamp(320, 100, 18) +
        '<line x1="320" y1="40" x2="320" y2="82" stroke="' + COL_FASE + '"/>' +
        '<line x1="320" y1="118" x2="320" y2="160" stroke="' + COL_NEUT + '"/>' +
        svgLabel(320, 136, 'Lampara', 12) +
        /* Magnetotérmico */
        inlineMagn(54, 100) +
        '<line x1="54" y1="40" x2="54" y2="86" stroke="' + COL_FASE + '"/>' +
        '<line x1="54" y1="114" x2="54" y2="160" stroke="' + COL_FASE + '"/>' +
        /* Tap zones */
        tapRect(90, 130, 90, 55, 'interruptor') +
        tapRect(295, 70, 50, 70, 'lampara') +
        tapRect(30, 75, 50, 55, 'magnetotermico') +
        tapRect(200, 25, 90, 30, 'fase')
      );
    }
  },
  {
    id: 'circuito_abierto',
    title: 'Circuito de iluminacion',
    errorZone: 'ruptura',
    hint: 'Sigue el recorrido de la corriente: ¿llega la corriente de un extremo al otro?',
    feedback: 'El circuito esta abierto. Sin circuito cerrado no hay corriente y la lampara no enciende. Falta una conexion.',
    build: function() {
      return schemaSVG(340, 200,
        /* Fase (marrón) — con ruptura entre 230 y 270 */
        '<line x1="20" y1="40" x2="100" y2="40" stroke="' + COL_FASE + '"/>' +
        '<line x1="170" y1="40" x2="230" y2="40" stroke="' + COL_FASE + '"/>' +
        '<line x1="270" y1="40" x2="320" y2="40" stroke="' + COL_FASE + '"/>' +
        svgLabel(10, 34, 'F', 12) +
        /* Gap visual */
        '<line x1="232" y1="36" x2="232" y2="44" stroke="#E74C3C" stroke-width="2"/>' +
        '<line x1="268" y1="36" x2="268" y2="44" stroke="#E74C3C" stroke-width="2"/>' +
        /* Neutro (azul) */
        '<line x1="20" y1="160" x2="320" y2="160" stroke="' + COL_NEUT + '"/>' +
        svgLabel(10, 154, 'N', 12) +
        /* Interruptor en fase */
        inlineInterr(105, 40, 165) +
        svgLabel(135, 60, 'Interruptor', 12) +
        /* Lámpara */
        inlineLamp(320, 100, 18) +
        '<line x1="320" y1="40" x2="320" y2="82" stroke="' + COL_FASE + '"/>' +
        '<line x1="320" y1="118" x2="320" y2="160" stroke="' + COL_NEUT + '"/>' +
        svgLabel(320, 136, 'Lampara', 12) +
        /* Magnetotérmico */
        inlineMagn(54, 100) +
        '<line x1="54" y1="40" x2="54" y2="86" stroke="' + COL_FASE + '"/>' +
        '<line x1="54" y1="114" x2="54" y2="160" stroke="' + COL_FASE + '"/>' +
        /* Tap zones */
        tapRect(220, 25, 60, 35, 'ruptura') +
        tapRect(90, 20, 90, 45, 'interruptor') +
        tapRect(295, 70, 50, 70, 'lampara') +
        tapRect(30, 75, 50, 55, 'magnetotermico')
      );
    }
  },
  {
    id: 'sin_proteccion',
    title: 'Circuito sin proteccion',
    errorZone: 'sin_proteccion',
    hint: '¿Tiene este circuito algun elemento de proteccion?',
    feedback: 'Todo circuito necesita proteccion. Sin magnetotermico o diferencial, un fallo puede ser peligroso. Falta el elemento de proteccion.',
    build: function() {
      return schemaSVG(340, 200,
        /* Fase (marrón) */
        '<line x1="20" y1="40" x2="100" y2="40" stroke="' + COL_FASE + '"/>' +
        '<line x1="170" y1="40" x2="320" y2="40" stroke="' + COL_FASE + '"/>' +
        svgLabel(10, 34, 'F', 12) +
        /* Neutro (azul) */
        '<line x1="20" y1="160" x2="320" y2="160" stroke="' + COL_NEUT + '"/>' +
        svgLabel(10, 154, 'N', 12) +
        /* Interruptor en fase */
        inlineInterr(105, 40, 165) +
        svgLabel(135, 60, 'Interruptor', 12) +
        /* Lámpara */
        inlineLamp(320, 100, 18) +
        '<line x1="320" y1="40" x2="320" y2="82" stroke="' + COL_FASE + '"/>' +
        '<line x1="320" y1="118" x2="320" y2="160" stroke="' + COL_NEUT + '"/>' +
        svgLabel(320, 136, 'Lampara', 12) +
        /* Hueco donde debería ir protección */
        '<rect x="30" y="75" width="48" height="50" rx="6" stroke="rgba(255,255,255,.2)" stroke-dasharray="4 4" fill="none"/>' +
        svgLabel(54, 105, '???', 14) +
        '<line x1="54" y1="40" x2="54" y2="75" stroke="rgba(255,255,255,.3)"/>' +
        '<line x1="54" y1="125" x2="54" y2="160" stroke="rgba(255,255,255,.3)"/>' +
        /* Tap zones */
        tapRect(22, 65, 64, 70, 'sin_proteccion') +
        tapRect(90, 20, 90, 45, 'interruptor') +
        tapRect(295, 70, 50, 70, 'lampara') +
        tapRect(200, 140, 100, 35, 'neutro')
      );
    }
  },
  {
    id: 'simbolo_incorrecto',
    title: 'Circuito con conmutada',
    errorZone: 'simbolo_mal',
    hint: 'Una conmutada necesita dos conmutadores. ¿Ves alguno que no lo sea?',
    feedback: 'Ese simbolo es un interruptor simple, pero aqui necesitas un conmutador. Una conmutada necesita dos conmutadores, no interruptores.',
    build: function() {
      return schemaSVG(340, 220,
        /* Fase (marrón) */
        '<line x1="20" y1="40" x2="80" y2="40" stroke="' + COL_FASE + '"/>' +
        svgLabel(10, 34, 'F', 12) +
        /* Conmutador 1 (correcto) */
        '<circle cx="85" cy="40" r="4" fill="#fff" stroke="#fff"/>' +
        '<circle cx="145" cy="28" r="4" fill="none" stroke="#fff"/>' +
        '<circle cx="145" cy="52" r="4" fill="none" stroke="#fff"/>' +
        '<line x1="89" y1="40" x2="141" y2="28" stroke="#fff" stroke-width="2.5"/>' +
        svgLabel(115, 68, 'Conmut.', 12) +
        /* Viajeros (naranja) */
        '<line x1="149" y1="28" x2="189" y2="28" stroke="#e67e22"/>' +
        '<line x1="149" y1="52" x2="189" y2="52" stroke="#e67e22"/>' +
        svgLabel(170, 18, 'viajeros', 11) +
        /* Interruptor simple INCORRECTO (debería ser conmutador) */
        inlineInterr(193, 40, 253) +
        svgLabel(223, 58, 'Interr.??', 12) +
        '<line x1="189" y1="28" x2="193" y2="40" stroke="#e67e22" stroke-dasharray="3 3"/>' +
        '<line x1="189" y1="52" x2="193" y2="40" stroke="#e67e22" stroke-dasharray="3 3"/>' +
        '<line x1="257" y1="40" x2="320" y2="40" stroke="' + COL_FASE + '"/>' +
        /* Neutro (azul) */
        '<line x1="20" y1="180" x2="320" y2="180" stroke="' + COL_NEUT + '"/>' +
        svgLabel(10, 174, 'N', 12) +
        /* Lámpara */
        inlineLamp(320, 110, 18) +
        '<line x1="320" y1="40" x2="320" y2="92" stroke="' + COL_FASE + '"/>' +
        '<line x1="320" y1="128" x2="320" y2="180" stroke="' + COL_NEUT + '"/>' +
        svgLabel(320, 148, 'Lampara', 12) +
        /* Protección (Dif+Mag) */
        inlineMagn(44, 100) +
        '<line x1="44" y1="40" x2="44" y2="86" stroke="rgba(255,255,255,.4)"/>' +
        '<line x1="44" y1="114" x2="44" y2="180" stroke="rgba(255,255,255,.4)"/>' +
        svgLabel(44, 76, 'Dif+Mag', 11) +
        /* Tap zones */
        tapRect(180, 20, 85, 50, 'simbolo_mal') +
        tapRect(70, 20, 85, 55, 'conmutador1') +
        tapRect(295, 80, 50, 70, 'lampara') +
        tapRect(20, 70, 50, 60, 'proteccion')
      );
    }
  }
];

/* ===== PLANNING SCENARIOS (N4) ===== */
var PLAN_STEPS = [
  { text: 'Identificar los elementos del esquema', order: 1 },
  { text: 'Marcar puntos en el panel', order: 2 },
  { text: 'Trazar rutas de cableado', order: 3 },
  { text: 'Comprobar que el plan coincide con el esquema', order: 4 }
];

var BONUS_QUESTIONS = [
  {
    question: '¿Por donde empezarias a cablear en un circuito de iluminacion?',
    options: ['Desde la lampara hacia atras', 'Desde la proteccion (cuadro) hacia delante', 'Da igual, empiezo por donde pille'],
    correct: 1,
    feedback: 'Siempre se empieza desde el cuadro de proteccion hacia delante. Asi controlas el recorrido.'
  },
  {
    question: '¿Que es lo primero que marcas en el panel?',
    options: ['Donde van las cajas de registro', 'Donde van las lamparas', 'Donde va el cuadro electrico'],
    correct: 2,
    feedback: 'Lo primero es marcar donde va el cuadro electrico, desde ahi sale todo.'
  },
  {
    question: '¿Que haces si el esquema no coincide con lo que ves en la obra?',
    options: ['Adapto sobre la marcha', 'Paro y consulto con el encargado', 'Sigo el esquema, la obra se equivoca'],
    correct: 1,
    feedback: 'Si algo no cuadra, PARA y consulta. Improvisar en obra es donde nacen las chapuzas.'
  }
];

/* ===== GAME STATE ===== */
var MAX_LIVES = 5;
var TASK_THRESHOLD = 150;
var score = 0;
var lives = MAX_LIVES;
var level = 0;
var busy = false;
var taskSent = false;
var record = parseInt(localStorage.getItem('el_plano_electrico_record')) || 0;

/* N1 state */
var n1Round = 0;
var n1Questions = [];

/* N2 state */
var n2Round = 0;
var n2Pairs = [];
var n2Matched = 0;
var n2RoundErrors = 0;
var n2DragSym = null;
var n2Line = null;
var n2SvgOverlay = null;

/* N3 state */
var n3Round = 0;
var n3Schemas = [];

/* N4 state */
var n4Timer = null;
var n4TimeLeft = 0;
var n4BonusIdx = 0;

/* ===== INIT ===== */
(function init() {
  $('intro-av-alex').src = ALEX.base;
  $('intro-btn').addEventListener('click', startGame);
  $('res-btn').addEventListener('click', function() { location.reload(); });
  $('fb-btn').addEventListener('click', closeFeedback);
})();

function startGame() {
  score = 0;
  lives = MAX_LIVES;
  level = 0;
  taskSent = false;
  busy = false;
  $('alex-av').src = ALEX.base;
  showScreen('play');
  startLevel(1);
}

/* ===== HUD ===== */
function updateHUD() {
  $('hud-level').textContent = 'Nivel ' + level;
  $('hud-score').textContent = score + ' pts';
  var h = '';
  for (var i = 0; i < MAX_LIVES; i++) {
    h += '<span class="hud-heart' + (i >= lives ? ' lost' : '') + '">❤️</span>';
  }
  $('hud-lives').innerHTML = h;
}

function addScore(pts) {
  score += pts;
  updateHUD();
  checkTaskCompleted();
}

function loseLife() {
  lives--;
  updateHUD();
  $('hud-lives').classList.add('shaking');
  setTimeout(function() { $('hud-lives').classList.remove('shaking'); }, 350);
  if (lives <= 0) {
    if (n4Timer) { clearInterval(n4Timer); n4Timer = null; }
    setTimeout(showResults, 600);
    return true;
  }
  return false;
}

function checkTaskCompleted() {
  if (!taskSent && score >= TASK_THRESHOLD) {
    taskSent = true;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    } catch (e) { /* not in RN */ }
  }
}

/* ===== CHARACTER BUBBLES ===== */
function say(msg, alexState) {
  /* Update avatar state */
  if (alexState) {
    var src = ALEX[alexState] || ALEX.base;
    $('alex-av').src = src;
    var bottomImg = $('bottom-av-img');
    if (bottomImg) bottomImg.src = src;
    var n1Img = document.getElementById('n1-alex-img');
    if (n1Img) n1Img.src = src;
  }

  /* N1/N2: update hero bubble if present */
  var heroBub = document.getElementById('hero-bubble');
  if (heroBub) {
    heroBub.textContent = msg;
    return;
  }

  /* N3/N4: use char-row */
  var bub = $('char-bubble');
  bub.textContent = msg;
  bub.classList.add('show');
}

/* ===== FEEDBACK OVERLAY ===== */
function showFeedback(icon, text, cb) {
  $('fb-icon').textContent = icon;
  $('fb-text').innerHTML = text;
  $('fb-overlay').classList.remove('off');
  $('fb-btn').onclick = function() {
    closeFeedback();
    if (cb) cb();
  };
}
function closeFeedback() {
  $('fb-overlay').classList.add('off');
}

/* ===== LEVEL ROUTER ===== */
function startLevel(n) {
  level = n;
  updateHUD();
  $('game-area').innerHTML = '';
  $('timer-wrap').classList.add('hidden');
  $('bottom-av').classList.add('hidden');
  $('bottom-av').classList.remove('small');
  $('char-row').classList.add('hidden');
  $('char-bubble').classList.remove('show');

  /* N1/N2: use hero layout (no char-row). N3/N4: use char-row */
  if (n >= 3) $('char-row').classList.remove('hidden');

  switch (n) {
    case 1: initN1(); break;
    case 2: initN2(); break;
    case 3: initN3(); break;
    case 4: initN4(); break;
    default: showResults(); break;
  }
}

/* ================================================================
   NIVEL 1 — Identifica el simbolo (8 rondas)
   Alex solo, se pregunta a si mismo
   ================================================================ */
function initN1() {
  $('mission-text').textContent = 'Identifica el simbolo correcto';
  /* N1: no bottom avatar, Alex is inside game-area as hero-speaker */
  n1Round = 0;
  n1Questions = pickN(SYMBOLS, 8);
  nextN1Round();
}

function nextN1Round() {
  if (n1Round >= n1Questions.length) {
    say('¡Bien! Ya me se los simbolos basicos.', 'happy');
    showFeedback('✅', 'Nivel 1 completado', function() { startLevel(2); });
    return;
  }
  var correct = n1Questions[n1Round];
  var distractors = SYMBOLS.filter(function(s) { return s.id !== correct.id; });
  var options = shuffle([correct].concat(pickN(distractors, 3)));

  var area = $('game-area');
  area.innerHTML = '';

  var info = document.createElement('div');
  info.className = 'round-info';
  info.textContent = (n1Round + 1) + ' / ' + n1Questions.length;
  area.appendChild(info);

  /* Alex speaks — hero bubble */
  var hero = document.createElement('div');
  hero.className = 'hero-speaker';
  var heroImg = document.createElement('img');
  heroImg.src = ALEX.base;
  heroImg.id = 'n1-alex-img';
  hero.appendChild(heroImg);
  var heroBub = document.createElement('div');
  heroBub.className = 'hero-bubble';
  heroBub.id = 'hero-bubble';
  heroBub.textContent = '¿Cual es: ' + correct.name + '?';
  hero.appendChild(heroBub);
  area.appendChild(hero);

  var grid = document.createElement('div');
  grid.className = 'quiz-grid';
  var errorsThisRound = 0;

  options.forEach(function(sym) {
    var opt = document.createElement('div');
    opt.className = 'quiz-option pop-in';
    opt.innerHTML = sym.svg;
    opt.addEventListener('click', function handler() {
      if (busy) return;
      if (sym.id === correct.id) {
        busy = true;
        opt.classList.add('correct');
        var pts = 20 + (errorsThisRound === 0 ? 10 : 0);
        addScore(pts);
        var heroB = document.getElementById('hero-bubble');
        var n1Img = document.getElementById('n1-alex-img');
        if (heroB) heroB.textContent = pick(['¡Ese es! ' + correct.name + '.', '¡Lo tengo!']);
        if (n1Img) n1Img.src = ALEX.happy;
        setTimeout(function() { busy = false; n1Round++; nextN1Round(); }, 800);
      } else {
        errorsThisRound++;
        opt.classList.add('wrong');
        opt.classList.add('disabled');
        opt.removeEventListener('click', handler);
        var heroB = document.getElementById('hero-bubble');
        var n1Img = document.getElementById('n1-alex-img');
        if (heroB) heroB.textContent = 'No... ese es el ' + sym.name + '.';
        if (n1Img) n1Img.src = ALEX.worried;
        if (loseLife()) return;
      }
    });
    grid.appendChild(opt);
  });

  area.appendChild(grid);
}

/* ================================================================
   NIVEL 2 — Conecta simbolo y nombre (2 rondas x 5 parejas)
   Drag line de simbolo a nombre
   ================================================================ */
function initN2() {
  $('mission-text').textContent = 'Conecta cada simbolo con su nombre';
  n2Round = 0;
  var picked = pickN(SYMBOLS, 10);
  n2Pairs = [picked.slice(0, 5), picked.slice(5, 10)];
  nextN2Round();
}

function nextN2Round() {
  if (n2Round >= 2) {
    showFeedback('✅', 'Nivel 2 completado', function() { startLevel(3); });
    return;
  }
  var pairs = n2Pairs[n2Round];
  n2Matched = 0;
  n2RoundErrors = 0;
  n2DragSym = null;

  var area = $('game-area');
  area.innerHTML = '';

  var info = document.createElement('div');
  info.className = 'round-info';
  info.textContent = 'Ronda ' + (n2Round + 1) + ' / 2 — Arrastra del simbolo al nombre';
  area.appendChild(info);

  /* Wrapper for relative positioning */
  var wrapper = document.createElement('div');
  wrapper.className = 'match-wrapper';
  wrapper.id = 'match-wrapper';

  /* SVG overlay for drawing lines */
  var svgOvl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgOvl.setAttribute('class', 'match-svg-overlay');
  svgOvl.id = 'match-svg';
  wrapper.appendChild(svgOvl);

  var container = document.createElement('div');
  container.className = 'match-container';

  var colLeft = document.createElement('div');
  colLeft.className = 'match-col match-col-left';
  var colRight = document.createElement('div');
  colRight.className = 'match-col match-col-right';

  var shuffledSyms = shuffle(pairs.slice());
  var shuffledNames = shuffle(pairs.slice());

  shuffledSyms.forEach(function(sym) {
    var el = document.createElement('div');
    el.className = 'match-sym';
    el.innerHTML = sym.svg;
    el.dataset.symId = sym.id;
    colLeft.appendChild(el);
  });

  shuffledNames.forEach(function(sym) {
    var el = document.createElement('div');
    el.className = 'match-name';
    el.textContent = sym.name;
    el.dataset.symId = sym.id;
    colRight.appendChild(el);
  });

  container.appendChild(colLeft);
  container.appendChild(colRight);
  wrapper.appendChild(container);
  area.appendChild(wrapper);

  n2SvgOverlay = svgOvl;

  /* Setup drag from symbols */
  setupN2Drag(wrapper, colLeft, colRight);
}

function setupN2Drag(wrapper, colLeft, colRight) {
  var dragging = false;
  var startEl = null;
  var startId = null;
  var line = null;

  /* Anchor point: right edge for symbols, left edge for names */
  function getAnchor(el, side) {
    var wr = wrapper.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var y = r.top + r.height / 2 - wr.top;
    if (side === 'right') return { x: r.right - wr.left, y: y };
    if (side === 'left') return { x: r.left - wr.left, y: y };
    return { x: r.left + r.width / 2 - wr.left, y: y };
  }

  function getTouch(e) {
    var t = e.touches ? e.touches[0] : e;
    var wr = wrapper.getBoundingClientRect();
    return { x: t.clientX - wr.left, y: t.clientY - wr.top };
  }

  function startDrag(symEl, e) {
    if (busy || dragging) return;
    if (symEl.classList.contains('matched')) return;
    e.preventDefault();
    dragging = true;
    startEl = symEl;
    startId = symEl.dataset.symId;
    symEl.classList.add('selected');

    var c = getAnchor(symEl, 'right');
    line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', c.x);
    line.setAttribute('y1', c.y);
    line.setAttribute('x2', c.x);
    line.setAttribute('y2', c.y);
    line.setAttribute('stroke', '#00E6BC');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', '0.7');
    n2SvgOverlay.appendChild(line);
  }

  function moveDrag(e) {
    if (!dragging || !line) return;
    e.preventDefault();
    var p = getTouch(e);
    line.setAttribute('x2', p.x);
    line.setAttribute('y2', p.y);
  }

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (startEl) startEl.classList.remove('selected');

    /* Find which name was dropped on — hide SVG overlay so elementFromPoint hits the name */
    var touch = e.changedTouches ? e.changedTouches[0] : e;
    var dropX = touch.clientX;
    var dropY = touch.clientY;
    n2SvgOverlay.style.display = 'none';
    var target = document.elementFromPoint(dropX, dropY);
    n2SvgOverlay.style.display = '';

    /* Walk up to find .match-name */
    var nameEl = null;
    var el = target;
    while (el && el !== wrapper) {
      if (el.classList && el.classList.contains('match-name')) { nameEl = el; break; }
      el = el.parentElement;
    }

    if (nameEl && !nameEl.classList.contains('matched')) {
      var nameId = nameEl.dataset.symId;
      if (nameId === startId) {
        /* Correct! Draw permanent green line */
        busy = true;
        var c1 = getAnchor(startEl, 'right');
        var c2 = getAnchor(nameEl, 'left');
        line.setAttribute('x2', c2.x);
        line.setAttribute('y2', c2.y);
        line.setAttribute('stroke', '#04FFB4');
        line.setAttribute('opacity', '1');
        startEl.classList.add('matched');
        nameEl.classList.add('matched');
        addScore(25);
        n2Matched++;
        setTimeout(function() {
          busy = false;
          if (n2Matched >= 5) {
            if (n2RoundErrors === 0) addScore(20);
            n2Round++;
            showN2Inter();
          }
        }, 400);
      } else {
        /* Wrong — red flash then remove line */
        n2RoundErrors++;
        line.setAttribute('stroke', '#E74C3C');
        line.setAttribute('opacity', '1');
        var c2 = getAnchor(nameEl, 'left');
        line.setAttribute('x2', c2.x);
        line.setAttribute('y2', c2.y);
        nameEl.classList.add('wrong');
        loseLife();
        var oldLine = line;
        setTimeout(function() {
          nameEl.classList.remove('wrong');
          if (oldLine.parentNode) oldLine.parentNode.removeChild(oldLine);
        }, 600);
      }
    } else {
      /* Dropped on nothing — just remove line */
      if (line && line.parentNode) line.parentNode.removeChild(line);
    }

    startEl = null;
    startId = null;
    line = null;
  }

  /* Bind events to sym elements */
  var syms = colLeft.querySelectorAll('.match-sym');
  syms.forEach(function(symEl) {
    symEl.addEventListener('touchstart', function(e) { startDrag(symEl, e); }, { passive: false });
    symEl.addEventListener('mousedown', function(e) { startDrag(symEl, e); });
  });

  wrapper.addEventListener('touchmove', moveDrag, { passive: false });
  wrapper.addEventListener('mousemove', moveDrag);
  wrapper.addEventListener('touchend', endDrag);
  wrapper.addEventListener('mouseup', endDrag);
}

/* N2 interstitial: show Alex big between rounds */
function showN2Inter() {
  var ok = n2RoundErrors === 0;
  $('n2-inter-img').src = ok ? ALEX.happy : ALEX.worried;
  $('n2-inter-msg').textContent = ok
    ? (n2Round < 2 ? '¡Ronda perfecta! Vamos a por la segunda.' : '¡Perfecto! Todas conectadas.')
    : (n2Round < 2 ? 'Algunos fallos… ¡A por la ronda 2!' : 'Ronda terminada. ¡Puedo mejorar!');
  $('n2-inter').classList.add('show');
  setTimeout(function() {
    $('n2-inter').classList.remove('show');
    setTimeout(nextN2Round, 300);
  }, 1600);
}

/* ================================================================
   NIVEL 3 — Encuentra el error en el esquema (4 rondas)
   ================================================================ */
function initN3() {
  $('mission-text').textContent = 'Encuentra el error en el esquema';
  $('alex-av').src = ALEX.base;
  say('Estos esquemas tienen errores. Si no los pillo aqui, los monto en la pared.', null);
  n3Round = 0;
  n3Schemas = shuffle(SCHEMAS.slice());
  nextN3Round();
}

function nextN3Round() {
  if (n3Round >= n3Schemas.length) {
    say('¡Voy pillando! Un buen electricista detecta errores en el plano.', 'happy');
    showFeedback('✅', 'Nivel 3 completado', function() { startLevel(4); });
    return;
  }
  var schema = n3Schemas[n3Round];
  var firstTap = true;

  var area = $('game-area');
  area.innerHTML = '';

  var info = document.createElement('div');
  info.className = 'round-info';
  info.textContent = 'Esquema ' + (n3Round + 1) + ' / ' + n3Schemas.length + ' — ' + schema.title;
  area.appendChild(info);

  var schemaArea = document.createElement('div');
  schemaArea.className = 'schema-area pop-in';
  schemaArea.innerHTML = schema.build();
  area.appendChild(schemaArea);

  var hintRow = document.createElement('div');
  hintRow.className = 'schema-hint-row';
  var hintText = document.createElement('div');
  hintText.className = 'schema-hint';
  hintText.textContent = 'Toca la zona donde esta el error';
  hintRow.appendChild(hintText);
  var helpBtn = document.createElement('button');
  helpBtn.className = 'help-btn';
  helpBtn.textContent = '💡';
  helpBtn.title = 'Pista';
  var hintUsed = false;
  helpBtn.addEventListener('click', function() {
    if (hintUsed) return;
    hintUsed = true;
    helpBtn.classList.add('used');
    say(schema.hint, null);
  });
  hintRow.appendChild(helpBtn);
  area.appendChild(hintRow);

  var zones = schemaArea.querySelectorAll('.tap-zone');
  zones.forEach(function(zone) {
    zone.addEventListener('click', function() {
      if (busy) return;
      var zoneId = zone.getAttribute('data-zone');

      if (zoneId === schema.errorZone) {
        busy = true;
        zone.classList.add('found');
        var pts = 35 + (firstTap ? 15 : 0);
        addScore(pts);
        say('¡Lo encontre! Eso habria sido un problema gordo.', 'happy');
        showFeedback('🔍', schema.feedback, function() {
          busy = false;
          n3Round++;
          nextN3Round();
        });
      } else {
        firstTap = false;
        zone.classList.add('wrong-tap');
        say('No era eso... voy a mirar las conexiones con mas calma.', 'worried');
        if (loseLife()) return;
        setTimeout(function() {
          zone.classList.remove('wrong-tap');
        }, 800);
      }
    });
  });
}

/* ================================================================
   NIVEL 4 — Planifica el montaje (1 ronda, contrarreloj 40s)
   ================================================================ */
function initN4() {
  $('mission-text').textContent = 'Planifica el montaje en orden';
  say('Ultimo reto: planificar el montaje. Primero entiendo, luego marco, luego ejecuto.', 'base');
  $('timer-wrap').classList.add('hidden');
  var roundStart = Date.now();
  var n4Confirmed = false;

  var area = $('game-area');
  area.innerHTML = '';

  var info = document.createElement('div');
  info.className = 'round-info';
  info.textContent = 'Arrastra para ordenar los pasos';
  area.appendChild(info);

  var steps = PLAN_STEPS.map(function(s) { return { text: s.text, order: s.order }; });
  shuffle(steps);

  var list = document.createElement('div');
  list.className = 'steps-list';
  list.id = 'steps-tray';

  steps.forEach(function(step, i) {
    var row = document.createElement('div');
    row.className = 'step-btn pop-in';
    row.dataset.order = step.order;
    var num = document.createElement('span');
    num.className = 'step-num';
    num.textContent = (i + 1);
    row.appendChild(num);
    var txt = document.createElement('span');
    txt.textContent = step.text;
    row.appendChild(txt);
    list.appendChild(row);
  });

  /* Confirm button */
  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-sm';
  confirmBtn.textContent = 'Confirmar orden';
  confirmBtn.style.marginTop = '10px';
  confirmBtn.addEventListener('click', function() {
    if (busy || n4Confirmed) return;
    n4Confirmed = true;
    var rows = list.querySelectorAll('.step-btn');
    var correct = true;
    for (var i = 0; i < rows.length; i++) {
      if (parseInt(rows[i].dataset.order) !== i + 1) { correct = false; break; }
    }
    if (correct) {
      rows.forEach(function(r) { r.classList.add('done'); });
      addScore(80);
      var elapsed = (Date.now() - roundStart) / 1000;
      if (elapsed < 20) addScore(15);
      say(pick(['¡Perfecto! Ese es el orden correcto.', '¡Bien planificado!']), 'happy');
      n4BonusIdx = 0;
      setTimeout(function() { showBonusQuestion(); }, 1000);
    } else {
      rows.forEach(function(r, i) {
        if (parseInt(r.dataset.order) === i + 1) {
          r.classList.add('done');
        } else {
          r.classList.add('wrong-step');
        }
      });
      say('No esta bien. Revisa el orden.', 'worried');
      if (loseLife()) return;
      setTimeout(function() {
        rows.forEach(function(r) {
          r.classList.remove('done');
          r.classList.remove('wrong-step');
        });
        n4Confirmed = false;
      }, 1000);
    }
  });
  list.appendChild(confirmBtn);

  area.appendChild(list);

  /* Drag-to-reorder */
  setupN4Drag(list);

}

function renumberSteps(tray) {
  var rows = tray.querySelectorAll('.step-btn');
  rows.forEach(function(r, i) {
    var num = r.querySelector('.step-num');
    if (num) num.textContent = (i + 1);
  });
}

function setupN4Drag(tray) {
  var dragRow = null;
  var placeholder = null;
  var offsetY = 0;

  function onStart(e) {
    if (busy) return;
    var row = e.target.closest('.step-btn');
    if (!row || row.classList.contains('done')) return;
    e.preventDefault();

    dragRow = row;
    var rect = row.getBoundingClientRect();
    var t = e.touches ? e.touches[0] : e;
    offsetY = t.clientY - rect.top;

    placeholder = document.createElement('div');
    placeholder.className = 'step-placeholder';
    placeholder.style.height = rect.height + 'px';
    row.parentNode.insertBefore(placeholder, row);

    row.classList.add('step-dragging');
    row.style.width = rect.width + 'px';
    row.style.top = rect.top + 'px';
    row.style.left = rect.left + 'px';
    document.body.appendChild(row);
  }

  function onMove(e) {
    if (!dragRow) return;
    e.preventDefault();
    var t = e.touches ? e.touches[0] : e;
    dragRow.style.top = (t.clientY - offsetY) + 'px';

    var rows = tray.querySelectorAll('.step-btn:not(.step-dragging)');
    var inserted = false;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var rRect = r.getBoundingClientRect();
      var mid = rRect.top + rRect.height / 2;
      if (t.clientY < mid) {
        tray.insertBefore(placeholder, r);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      var btn = tray.querySelector('.btn');
      if (btn) tray.insertBefore(placeholder, btn);
    }
  }

  function onEnd(e) {
    if (!dragRow) return;
    e.preventDefault();
    dragRow.classList.remove('step-dragging');
    dragRow.style.width = '';
    dragRow.style.top = '';
    dragRow.style.left = '';
    tray.insertBefore(dragRow, placeholder);
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    dragRow = null;
    placeholder = null;
    renumberSteps(tray);
  }

  tray.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd, { passive: false });
  tray.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}

function updateTimerBar(current, max) {
  var pct = (current / max) * 100;
  var fill = $('timer-fill');
  fill.style.width = pct + '%';
  if (pct <= 25) fill.classList.add('low');
  else fill.classList.remove('low');
}

/* ===== BONUS QUESTIONS (N4) ===== */
function showBonusQuestion() {
  if (n4BonusIdx >= BONUS_QUESTIONS.length) {
    showResults();
    return;
  }
  var bonus = BONUS_QUESTIONS[n4BonusIdx];

  var area = $('game-area');
  area.innerHTML = '';

  var info = document.createElement('div');
  info.className = 'round-info';
  info.textContent = 'Pregunta ' + (n4BonusIdx + 1) + ' / ' + BONUS_QUESTIONS.length;
  area.appendChild(info);

  var q = document.createElement('div');
  q.className = 'bonus-q';
  q.textContent = bonus.question;
  area.appendChild(q);

  var opts = document.createElement('div');
  opts.className = 'bonus-options';

  bonus.options.forEach(function(text, i) {
    var opt = document.createElement('div');
    opt.className = 'bonus-opt pop-in';
    opt.textContent = text;
    opt.addEventListener('click', function() {
      if (busy) return;
      busy = true;
      if (i === bonus.correct) {
        opt.classList.add('correct');
        addScore(30);
        say('¡Correcto!', 'happy');
      } else {
        opt.classList.add('wrong');
        opts.children[bonus.correct].classList.add('correct');
        say(bonus.feedback, 'worried');
        loseLife();
      }
      setTimeout(function() {
        busy = false;
        n4BonusIdx++;
        if (lives > 0) showBonusQuestion();
      }, 1200);
    });
    opts.appendChild(opt);
  });

  area.appendChild(opts);
}

/* ===== RESULTS ===== */
function showResults() {
  if (n4Timer) { clearInterval(n4Timer); n4Timer = null; }
  if (score > record) {
    record = score;
    localStorage.setItem('el_plano_electrico_record', record);
  }

  var msg, av;
  if (score >= 500) {
    msg = '¡Chaval, lees planos como un jefe de obra! Bienvenido al equipo.';
    av = 'happy';
  } else if (score >= 150) {
    msg = 'No esta mal. Vas cogiendo soltura. Sigue asi.';
    av = 'base';
  } else {
    msg = 'Hay que repasar, chaval. Sin prisa, pero sin cables hasta que lo tengas claro.';
    av = 'worried';
  }

  $('res-av').src = ALEX[av] || ALEX.base;
  $('res-msg').textContent = msg;
  $('res-score').textContent = score;
  $('res-record').textContent = record;
  $('res-title').textContent = score >= 500 ? '¡Increible!' : score >= 150 ? '¡Buen trabajo!' : '¡A repasar!';
  showScreen('results');
}
