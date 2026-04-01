/* === Mi Primer Curro: Tarde [SIMULADOR] - Game Shell === */

// ============================================================
// SECTION 1: CDN + Helpers
// ============================================================

var CDN = 'https://res.cloudinary.com/kampe/image/upload/f_auto,q_auto';

function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    var msg = { action: 'VIBRATE', level: level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    var ms = { light: 10, medium: 20, heavy: 40, success: 30, error: 50 };
    navigator.vibrate(pattern || ms[level] || 20);
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  var screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
}

function showOverlay(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideOverlay(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// --- Chat overlay ---
function addChatMessage(text, username, isAchievement) {
  var containers = [
    document.getElementById('chat-messages'),
    document.getElementById('loc-chat-messages')
  ];
  containers.forEach(function(container) {
    if (!container) return;
    var msg = document.createElement('div');
    msg.className = 'chat-msg' + (isAchievement ? ' achievement' : '');
    if (isAchievement) {
      msg.textContent = text;
    } else {
      msg.innerHTML = '<span class="chat-user">[' + username + ']:</span> <span class="chat-text">' + text + '</span>';
    }
    container.appendChild(msg);
    while (container.children.length > 3) {
      container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
    setTimeout(function() {
      msg.style.transition = 'opacity 1s ease';
      msg.style.opacity = '0';
    }, 8000);
  });
}

// --- Typewriter ---
var activeTypewriters = [];

function typewriter(element, text, speed, callback) {
  // Cancel any pending auto-dismiss timer from a previous bubble
  if (element._autoDismissTimer) {
    clearTimeout(element._autoDismissTimer);
    element._autoDismissTimer = null;
  }
  element.classList.remove('hidden');
  element.style.opacity = '1';
  element.textContent = '';
  var i = 0;
  var interval = setInterval(function() {
    element.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      var idx = activeTypewriters.indexOf(interval);
      if (idx > -1) activeTypewriters.splice(idx, 1);
      autoDismissBubble(element, text);
      if (callback) setTimeout(callback, 500);
    }
  }, speed);
  activeTypewriters.push(interval);
  return interval;
}

function autoDismissBubble(element, text) {
  var readTime = Math.max(3000, Math.min(10000, text.length * 60));
  // If we're in a cooldown after dismissAllBubbles, add extra time
  var extra = _dismissCooldown ? 500 : 0;
  var timer = setTimeout(function() {
    dismissBubble(element);
  }, readTime + extra);
  element._autoDismissTimer = timer;
}

function dismissBubble(element) {
  if (element._autoDismissTimer) {
    clearTimeout(element._autoDismissTimer);
    element._autoDismissTimer = null;
  }
  if (element.classList.contains('hidden')) return;
  element.style.transition = 'opacity 0.3s ease';
  element.style.opacity = '0';
  setTimeout(function() {
    element.classList.add('hidden');
    element.style.opacity = '';
    element.style.transition = '';
  }, 300);
}

var _dismissCooldown = false;

function dismissAllBubbles() {
  // Don't dismiss if a typewriter is actively running
  if (activeTypewriters.length > 0) return;
  var npc = document.getElementById('npc-bubble');
  var player = document.getElementById('player-bubble');
  if (npc && !npc.classList.contains('hidden')) dismissBubble(npc);
  if (player && !player.classList.contains('hidden')) dismissBubble(player);
  // Set cooldown to prevent the next bubble from being auto-dismissed too quickly
  _dismissCooldown = true;
  setTimeout(function() { _dismissCooldown = false; }, 1000);
}

function clearDialogue() {
  activeTypewriters.forEach(clearInterval);
  activeTypewriters = [];
  var npcBubble = document.getElementById('npc-bubble');
  var playerBubble = document.getElementById('player-bubble');
  var choiceButtons = document.getElementById('choice-buttons');
  npcBubble.classList.add('hidden');
  npcBubble.textContent = '';
  playerBubble.classList.add('hidden');
  playerBubble.textContent = '';
  choiceButtons.classList.add('hidden');
  choiceButtons.innerHTML = '';
}

// --- Floating score ---
function showFloatingScore(points) {
  if (points <= 0) return;
  var el = document.createElement('div');
  el.className = 'floating-score';
  el.textContent = '+' + points;
  el.style.top = '40%';
  el.style.left = '50%';
  document.getElementById('loc-scene').appendChild(el);
  setTimeout(function() { el.remove(); }, 1000);
}

// --- Badge banner ---
var badgeQueue = [];
var badgeShowing = false;

function earnBadge(badgeId) {
  if (S.badges[badgeId]) return;
  S.badges[badgeId] = true;
  var badge = BADGES.find(function(b) { return b.id === badgeId; });
  if (!badge) return;
  vibrate('medium');
  badgeQueue.push(badge);
  if (!badgeShowing) showNextBadgeBanner();
}

function showNextBadgeBanner() {
  if (badgeQueue.length === 0) { badgeShowing = false; return; }
  badgeShowing = true;
  var badge = badgeQueue.shift();

  addChatMessage('🏆 Vega desbloqueó: ' + badge.label, null, true);

  var banner = document.createElement('div');
  banner.className = 'badge-banner';
  banner.innerHTML = '<span class="badge-banner-icon">' + badge.icon + '</span>' +
    '<div class="badge-banner-text">' +
      '<span class="badge-banner-title">Badge desbloqueado</span>' +
      '<span class="badge-banner-label">' + badge.label + '</span>' +
    '</div>';
  document.getElementById('wrapper').appendChild(banner);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      banner.classList.add('badge-banner-in');
    });
  });

  setTimeout(function() {
    banner.classList.remove('badge-banner-in');
    banner.classList.add('badge-banner-out');
    setTimeout(function() {
      banner.remove();
      showNextBadgeBanner();
    }, 500);
  }, 2500);
}

// --- Ambient chat ---
var ambientTimer = null;

var AMBIENT_MESSAGES = [
  { user: 'TuboMaster_3000', text: 'yo ya he mandado 3 mensajes hoy, estoy on fire' },
  { user: 'xX_Rookie_Xx', text: 'la primera llamada en frío es lo peor, luego ya no cuesta tanto' },
  { user: 'ChispaVolt', text: 'venga que esta tarde cerramos candidaturas' },
  { user: 'Ohm_Dulce_Ohm', text: 'mi madre me ha escrito el mensaje y me ha puesto "un cordial saludo"' },
  { user: 'CableMan420', text: 'contactar da pereza pero es lo que funciona' },
  { user: 'NoobElectricista', text: '¿alguien ha llamado ya? yo no me atrevo' },
  { user: 'InstaladorJefe', text: 'un buen mensaje abre puertas, una buena llamada las cruza' },
  { user: 'ElectricistaPRO_99', text: 'yo conseguí mi primer curro con una llamada de 20 segundos' },
  { user: 'xX_Rookie_Xx', text: '¿vosotros ponéis emojis en los mensajes a empresas?' },
  { user: 'InstaladorJefe', text: 'NO pongas emojis en mensajes a empresas' },
  { user: 'TuboMaster_3000', text: 'yo soy fontanero pero os leo para aprender' },
  { user: 'ChispaVolt', text: 'el que no contacta no trabaja, es así de simple' },
  { user: 'Ohm_Dulce_Ohm', text: '¿alguien más reescribe el mensaje 15 veces antes de enviarlo?' },
  { user: 'CableMan420', text: 'la clave es cerrar siempre con un siguiente paso' },
  { user: 'xX_Rookie_Xx', text: 'he llamado a una empresa y me ha colgado jajaja siguiente' },
  { user: 'InstaladorJefe', text: 'si no mencionas evidencias eres uno más del montón' },
  { user: 'ElectricistaPRO_99', text: 'en la ETT me dijeron que llamara cada 2 semanas y a la tercera me salió curro' },
  { user: 'NoobElectricista', text: 'acabo de enviar mi primer mensaje, las manos me tiemblan' },
  { user: 'TuboMaster_3000', text: '¿alguien sabe si las ETTs cobran algo? spoiler: no' },
  { user: 'Ohm_Dulce_Ohm', text: 'me han puesto en espera con musiquita y todo' },
  { user: 'ChispaVolt', text: 'siempre investiga la empresa antes de contactar, queda fatal no saber a qué se dedican' },
  { user: 'CableMan420', text: 'la diferencia entre un buen mensaje y uno malo es que el bueno se contesta' },
  { user: 'InstaladorJefe', text: 'nunca digas "busco lo que sea", siempre tu oficio concreto' },
  { user: 'xX_Rookie_Xx', text: 'consejo: practica la llamada en voz alta antes de marcar' },
  { user: 'ElectricistaPRO_99', text: 'mi primer jefe me dijo que le convenció porque sabía exactamente qué había hecho' },
  { user: 'Milane', text: 'Bonjour! Yo también estoy contactando empresas. En español, claro' },
  { user: 'NoobElectricista', text: '¿mejor llamar por la mañana o por la tarde?' },
  { user: 'InstaladorJefe', text: 'por la mañana temprano, antes de que se líen con la obra' },
  { user: 'TuboMaster_3000', text: 'Darwin dice que ya ha enviado 5 candidaturas, el crack' },
  { user: 'Ohm_Dulce_Ohm', text: 'si te dicen que no, no pasa nada. Es un no de momento, no un no para siempre' },
];

function startAmbientChat() {
  stopAmbientChat();
  var lastIdx = -1;
  ambientTimer = setInterval(function() {
    var idx;
    do { idx = Math.floor(Math.random() * AMBIENT_MESSAGES.length); } while (idx === lastIdx && AMBIENT_MESSAGES.length > 1);
    lastIdx = idx;
    var msg = AMBIENT_MESSAGES[idx];
    addChatMessage(msg.text, msg.user);
  }, 10000 + Math.random() * 8000);
}

function stopAmbientChat() {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
}

// --- Shuffle array ---
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// ============================================================
// SECTION 2: Content Data
// ============================================================

var CHARACTER = {
  name: 'Vega',
  happy: CDN + '/vega_happy_anzbgw.png',
  celebrating: CDN + '/vega_celebrating_q3q8qe.png',
  worried: CDN + '/vega_worried_mqvjoh.png',
};

var CAFE_BG = CDN + '/bg_cafe_hub_fhojla.jpg';

var LOCATION_BGS = {
  mensaje: CDN + '/bg_mensaje_lfjaew.jpg',
  llamada: CDN + '/bg_llamada_avtz3y.jpg',
  ett: CDN + '/bg_ett_tarde_x7jpxi.jpg',
};

var LOCATIONS_CONFIG = [
  { id: 'mensaje', label: 'Mensaje', pos: { top: 80, left: 62 }, scale: 0.85, isPhone: true },
  { id: 'llamada', label: 'Llamada', pos: { top: 65, left: 42 }, scale: 0.7, isPhone: false },
  { id: 'ett', label: 'ETT', pos: { top: 42, left: 10 }, scale: 0.6, isPhone: false },
];

var BADGES = [
  { id: 'investigadora', icon: '🔍', label: 'Investigadora', desc: 'Buscar info empresa antes de contactar' },
  { id: 'primer_contacto', icon: '✉️', label: 'Primer Contacto', desc: 'Completar primera localización' },
  { id: 'evidencia', icon: '📄', label: 'Evidencia Presentada', desc: 'Mencionar portfolio por primera vez' },
  { id: 'traductor_pro', icon: '🌐', label: 'Traductor Pro', desc: 'Explicar BootKämp en idioma empleador' },
  { id: 'siguiente_paso', icon: '➡️', label: 'Siguiente Paso', desc: 'Cerrar con siguiente paso concreto' },
  { id: 'seguimiento', icon: '📅', label: 'Seguimiento Programado', desc: 'Establecer fecha de follow-up' },
  { id: 'mensaje_pro', icon: '⭐', label: 'Mensaje Pro', desc: 'Mensaje con >=75% calidad' },
  { id: 'llamada_perfecta', icon: '📞', label: 'Llamada Perfecta', desc: 'Llamada con >=75% calidad' },
  { id: 'ett_registrada', icon: '🏢', label: 'ETT Registrada', desc: 'Completar registro ETT' },
  { id: 'tres_candidaturas', icon: '🏆', label: 'Las Tres Candidaturas', desc: 'Completar las 3 localizaciones' },
];

// ============================================================
// DIALOGUE TREES
// ============================================================

// --- El Mensaje ---
var TREE_MENSAJE = {
  start: {
    id: 'start',
    npcBubble: 'Electricidad Comarcal. Los encontré esta mañana. Tengo el número. ¿Qué hago primero?',
    npcIsVega: true,
    choices: [
      {
        text: 'Buscar qué hace la empresa antes de escribir',
        quality: 'good', points: 50,
        response: 'Hacen mantenimiento eléctrico industrial y residencial en Teruel. El dueño se llama Miguel.',
        responseIsVega: true,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'saber a quién escribes marca la diferencia' }],
        badge: 'investigadora',
        nextExchange: 'msg_2',
      },
      {
        text: 'Abrir WhatsApp directamente y escribir',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [{ user: 'ChispaVolt', text: 'también vale, pero saber algo de la empresa ayuda' }],
        nextExchange: 'msg_2',
      },
      {
        text: 'Mandar solo el CV como archivo adjunto, sin mensaje',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'ElectricistaPRO_99', text: 'un CV sin mensaje es como dejar un papel debajo de la puerta' }],
        nextExchange: 'msg_2',
      },
    ],
  },
  msg_2: {
    id: 'msg_2',
    npcBubble: 'Primer paso: ¿cómo empiezas?',
    npcIsVega: true,
    composeLine: true,
    choices: [
      {
        text: 'Hola, me llamo Vega y soy instaladora eléctrica',
        quality: 'good', points: 50,
        composeLine: 'Hola, me llamo Vega y soy instaladora eléctrica.',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_3',
      },
      {
        text: 'Buenas, te escribo porque estoy buscando trabajo de electricista',
        quality: 'mediocre', points: 25,
        composeLine: 'Buenas, te escribo porque estoy buscando trabajo de electricista.',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_3',
      },
      {
        text: 'Buenos días me pongo en contacto con ustedes para informarles de que estoy interesada en posibles vacantes que pudieran surgir en su empresa',
        quality: 'bad', points: 0,
        composeLine: 'Buenos días me pongo en contacto con ustedes para informarles de que estoy interesada en posibles vacantes que pudieran surgir en su empresa.',
        response: null,
        chatMsgs: [
          { user: 'xX_Rookie_Xx', text: 'ese mensaje lo he mandado 200 veces y no me ha contestado nadie' },
          { user: 'CableMan420', text: 'bro eso lo escribe un robot' },
        ],
        nextExchange: 'msg_3',
      },
    ],
  },
  msg_3: {
    id: 'msg_3',
    npcBubble: '¿Cómo describes tu formación?',
    npcIsVega: true,
    composeLine: true,
    choices: [
      {
        text: 'He completado formación práctica en instalaciones eléctricas con prácticas reales verificadas en obra',
        quality: 'good', points: 50,
        composeLine: 'He completado formación práctica en instalaciones eléctricas con prácticas verificadas en obra.',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_4',
      },
      {
        text: 'He hecho un BootKämp de electricidad',
        quality: 'mediocre', points: 25,
        composeLine: 'He hecho un BootKämp de electricidad.',
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'el empleador no sabe que es un BootKämp, traduce a su idioma' }],
        nextExchange: 'msg_4',
      },
      {
        text: 'Tengo experiencia en el sector',
        quality: 'bad', points: 0,
        composeLine: 'Tengo experiencia en el sector.',
        response: null,
        chatMsgs: [{ user: 'ElectricistaPRO_99', text: '"experiencia" sin más no dice nada, necesitas ser concreta' }],
        nextExchange: 'msg_4',
      },
    ],
  },
  msg_4: {
    id: 'msg_4',
    npcBubble: '¿Incluyes alguna prueba de lo que sabes hacer?',
    npcIsVega: true,
    composeLine: true,
    choices: [
      {
        text: 'Te mando el enlace a mi portfolio de prácticas - ahí puedes ver los trabajos que he hecho',
        quality: 'good', points: 50,
        composeLine: 'Te mando el enlace a mi portfolio: [enlace]. Ahí puedes ver los trabajos que he hecho.',
        response: null,
        chatMsgs: [],
        badge: 'evidencia',
        nextExchange: 'msg_5',
      },
      {
        text: 'Si quieres te puedo pasar mi CV',
        quality: 'mediocre', points: 25,
        composeLine: 'Si quieres te puedo pasar mi CV.',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_5',
      },
      {
        text: 'No incluir evidencia',
        quality: 'bad', points: 0,
        composeLine: null,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'sin evidencia eres una más del montón' }],
        nextExchange: 'msg_5',
      },
    ],
  },
  msg_5: {
    id: 'msg_5',
    npcBubble: 'Antes de enviar... ¿añades algo sobre tu disponibilidad?',
    npcIsVega: true,
    composeLine: true,
    choices: [
      {
        text: 'Añadir: "Tengo disponibilidad inmediata"',
        quality: 'good', points: 50,
        composeLine: 'Tengo disponibilidad inmediata.',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_6',
      },
      {
        text: 'No añadir nada, el mensaje ya está bien',
        quality: 'mediocre', points: 25,
        composeLine: null,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'la disponibilidad siempre ayuda, pero no es obligatorio' }],
        nextExchange: 'msg_6',
      },
      {
        text: 'Añadir: "Podría empezar cuando me viniera bien"',
        quality: 'bad', points: 0,
        composeLine: 'Podría empezar cuando me viniera bien.',
        response: null,
        chatMsgs: [{ user: 'ChispaVolt', text: 'eso suena a que no tienes prisa, y las empresas buscan gente que sí la tenga' }],
        nextExchange: 'msg_6',
      },
    ],
  },
  msg_6: {
    id: 'msg_6',
    npcBubble: 'Último paso: ¿cómo cierras?',
    npcIsVega: true,
    composeLine: true,
    choices: [
      {
        text: '¿Tenéis hueco para hablar esta semana?',
        quality: 'good', points: 50,
        composeLine: '¿Tenéis hueco para hablar esta semana?',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_7',
      },
      {
        text: '¿Estáis buscando a alguien actualmente?',
        quality: 'mediocre', points: 25,
        composeLine: '¿Estáis buscando a alguien actualmente?',
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_7',
      },
      {
        text: 'Quedo a su disposición para cualquier consulta. Un cordial saludo.',
        quality: 'bad', points: 0,
        composeLine: 'Quedo a su disposición para cualquier consulta. Un cordial saludo.',
        response: null,
        chatMsgs: [
          { user: 'TuboMaster_3000', text: '"quedo a su disposición" es el beso de la muerte' },
          { user: 'xX_Rookie_Xx', text: 'yo siempre ponía eso hasta que alguien me dijo que nadie contesta a eso' },
        ],
        nextExchange: 'msg_7',
      },
    ],
  },
  msg_7: {
    id: 'msg_7',
    type: 'send_message',
    npcBubble: '¿Enviar?',
    npcIsVega: true,
    choices: [
      {
        text: 'Enviar mensaje',
        quality: 'none', points: 0,
        response: null,
        chatMsgs: [{ user: 'Ohm_Dulce_Ohm', text: 'los puntitos de "escribiendo..." son lo más estresante del mundo' }],
        nextExchange: 'msg_8_branch',
      },
    ],
  },
  // Branch based on quality
  msg_8_branch: {
    id: 'msg_8_branch',
    type: 'branch',
    branchOn: 'quality',
    branches: {
      high: 'msg_8a',   // >=250
      medium: 'msg_8b', // 125-249
      low: 'msg_8c',    // <125
    },
    thresholds: { high: 250, medium: 125 },
  },
  // HIGH quality path
  msg_8a: {
    id: 'msg_8a',
    npcBubble: 'Hola Vega, gracias por escribir. Me interesa lo del portfolio, he echado un vistazo rápido. ¿Me puedes contar un poco más de qué tipo de instalaciones has hecho?',
    choices: [
      {
        text: 'He hecho instalaciones en vivienda nueva y reforma - canalizaciones, cuadros eléctricos, y puntos de luz. En el portfolio hay fotos de cada trabajo',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_9a',
      },
      {
        text: 'De todo un poco, lo que me mandaban en las prácticas',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_9a',
      },
    ],
  },
  msg_9a: {
    id: 'msg_9a',
    npcBubble: '¿Oye, y tú controlas de cuadros eléctricos? Es lo que más hacemos aquí',
    choices: [
      {
        text: 'Sí, he montado cuadros en las prácticas. En el portfolio hay fotos del proceso',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_10a',
      },
      {
        text: 'He tocado algo en la formación, pero donde más he trabajado es en canalizaciones',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_10a',
      },
      {
        text: 'Sí, sí, controlo de todo',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'si no es verdad, no lo digas. Mejor ser honesta con lo que sabes' }],
        nextExchange: 'msg_10a',
      },
    ],
  },
  msg_10a: {
    id: 'msg_10a',
    npcBubble: '¿Tienes coche? Las obras están repartidas por la comarca.',
    choices: [
      {
        text: 'No tengo carnet todavía, pero me muevo en moto y puedo llegar sin problema',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_11a',
      },
      {
        text: 'No, no tengo',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_11a',
      },
      {
        text: 'Sí',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'no mientas, siempre te pilla y pierdes la confianza' }],
        nextExchange: 'msg_11a',
      },
    ],
  },
  msg_11a: {
    id: 'msg_11a',
    npcBubble: 'Ahora mismo no tenemos nada abierto, pero puede que en unas semanas sí. ¿Te parece si hablamos entonces?',
    choices: [
      {
        text: 'Perfecto. Te puedo escribir en dos semanas para ver cómo va?',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        badge: 'siguiente_paso',
        nextExchange: 'msg_12a',
      },
      {
        text: 'Claro, cuando queráis me decís',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'msg_12a',
      },
    ],
  },
  msg_12a: {
    id: 'msg_12a',
    type: 'harmless',
    npcBubble: 'Oye, perdona un segundo... [pausa] ...era un WhatsApp de otro candidato. Pero tu mensaje era mejor, la verdad.',
    choices: [],
    chatMsgs: [{ user: 'xX_Rookie_Xx', text: 'jajaja imagina competir por WhatsApp' }],
    nextExchange: null,
  },
  // MEDIUM quality path
  msg_8b: {
    id: 'msg_8b',
    npcBubble: 'Vale, tomo nota. Si surge algo te aviso.',
    choices: [
      {
        text: '¿Te puedo mandar el enlace a mi portfolio para que lo tengas? Así si surge algo ya tenéis referencia',
        quality: 'good', points: 50,
        response: 'Ah, vale, sí mándalo que le echo un vistazo.',
        chatMsgs: [],
        badge: 'evidencia',
        nextExchange: 'msg_9b',
      },
      {
        text: 'Vale, gracias',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: null,
      },
      {
        text: '¿Seguro que no tenéis nada? Puedo empezar mañana mismo',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'insistir cuando te han dicho que no queda desesperado' }],
        nextExchange: null,
      },
    ],
  },
  msg_9b: {
    id: 'msg_9b',
    npcBubble: 'Mándalo, le echo un vistazo.',
    choices: [
      {
        text: 'Hecho. ¿Te puedo escribir en un par de semanas por si cambia algo?',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        badge: 'siguiente_paso',
        nextExchange: null,
      },
      {
        text: 'Te lo mando ahora. Gracias.',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: null,
      },
    ],
  },
  // LOW quality path
  msg_8c: {
    id: 'msg_8c',
    type: 'no_response',
    npcBubble: null,
    noResponseDelay: 3000,
    noResponseChat: [{ user: 'ElectricistaPRO_99', text: 'no ha contestado. El mensaje no invitaba a responder' }],
    choices: [
      {
        text: 'Mandar un segundo mensaje más corto, con el portfolio y una pregunta directa',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: null,
      },
      {
        text: 'Dejarlo y probar con otra empresa',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: null,
      },
    ],
  },
};

// --- La Llamada ---
var TREE_LLAMADA = {
  start: {
    id: 'start',
    npcBubble: 'Hermanos Gracia. La ETT te dio su contacto esta mañana. ¿Qué haces antes de llamar?',
    npcIsVega: true,
    choices: [
      {
        text: 'Buscar información de la empresa',
        quality: 'good', points: 50,
        response: 'Hacen mantenimiento en Teruel provincia. El dueño es José Gracia.',
        responseIsVega: true,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'llamar sabiendo a quién llamas cambia todo' }],
        badge: 'investigadora',
        nextExchange: 'call_2',
      },
      {
        text: 'Llamar directamente, ya sé que buscan electricistas',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [{ user: 'ChispaVolt', text: 'bueno, al menos sabes que buscan' }],
        nextExchange: 'call_2',
      },
    ],
  },
  call_2: {
    id: 'call_2',
    npcBubble: '¿Sí, dígame?',
    showCallUI: true,
    choices: [
      {
        text: '¿Buenos días, hablo con Hermanos Gracia? Me llamo Vega',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_3',
      },
      {
        text: 'Hola, buenas, llamo porque me dieron este número en la ETT',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_3',
      },
      {
        text: '¿Hola, eh... estoy hablando con la empresa de instalaciones?',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'nombre + oficio en los primeros 5 segundos, siempre' }],
        nextExchange: 'call_3',
      },
    ],
  },
  call_3: {
    id: 'call_3',
    npcBubble: 'Sí, soy José. ¿Qué necesitas?',
    choices: [
      {
        text: 'Soy instaladora eléctrica. He terminado formación con prácticas reales verificadas y busco trabajo como ayudante',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_4',
      },
      {
        text: 'He terminado un BootKämp de electricidad y busco trabajo',
        quality: 'mediocre', points: 25,
        response: '¿Un boot qué? No me suena.',
        chatMsgs: [],
        nextExchange: 'call_3b',
      },
      {
        text: 'Busco trabajo, me han dicho que a lo mejor necesitáis gente',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'ElectricistaPRO_99', text: 'no has dicho ni tu nombre ni tu oficio' }],
        nextExchange: 'call_4',
      },
    ],
  },
  call_3b: {
    id: 'call_3b',
    npcBubble: '¿Un boot qué? No me suena.',
    isRecovery: true,
    choices: [
      {
        text: 'Es un programa de formación práctica intensiva. He hecho instalaciones reales en obra y tengo un portfolio verificado',
        quality: 'good', points: 25,
        response: null,
        chatMsgs: [{ user: 'CableMan420', text: 'así si, traducido a su idioma' }],
        badge: 'traductor_pro',
        nextExchange: 'call_4',
      },
      {
        text: 'Sí, bueno, es como un curso pero más largo',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_4',
      },
    ],
  },
  call_4: {
    id: 'call_4',
    npcBubble: 'Prácticas reales, ¿eh? Dime una cosa concreta que hayas hecho. Algo real.',
    choices: [
      {
        text: 'En las últimas prácticas hice una instalación completa en una vivienda - desde la canalización hasta el cuadro. Está documentado',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        badge: 'evidencia',
        nextExchange: 'call_5',
      },
      {
        text: 'Pues hemos hecho de todo, canalización, cableado...',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_5',
      },
      {
        text: 'Es que en las prácticas nos iban diciendo lo que hacer y nosotros lo hacíamos',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'ElectricistaPRO_99', text: 'eso suena a que no sabes qué hiciste' }],
        nextExchange: 'call_5',
      },
    ],
  },
  call_5: {
    id: 'call_5',
    type: 'harmless_amazon',
    npcBubble: 'Espera un segundo...',
    holdDuration: 3000,
    holdChat: [
      { user: 'TuboMaster_3000', text: 'cuando te dicen "espera" se para el mundo' },
      { user: 'Ohm_Dulce_Ohm', text: 'tranqui que vuelve' },
    ],
    afterHold: '...perdona, era el de Amazon con un paquete. Hoy no hay quien trabaje tranquilo. ¿Por dónde íbamos?',
    choices: [
      {
        text: 'Te decía que busco trabajo de instaladora. ¿Estáis buscando a alguien?',
        quality: 'none', points: 0,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_6',
      },
      {
        text: 'Jaja, Amazon no perdona. Te decía que...',
        quality: 'none', points: 0,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_6',
      },
    ],
  },
  call_6: {
    id: 'call_6',
    npcBubble: 'Mira, ahora mismo la verdad es que estamos servidos. No necesitamos a nadie.',
    choices: [
      {
        text: 'Entiendo. ¿Os puedo mandar el enlace a mi portfolio por si surge algo más adelante?',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_7',
      },
      {
        text: '¿Y tenéis previsto necesitar a alguien en los próximos meses?',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_7',
      },
      {
        text: 'Ah, vale. Perdona la molestia',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'nunca te disculpes por buscar trabajo. Y nunca cuelgues sin un siguiente paso' }],
        nextExchange: null,
      },
      {
        text: 'Ok, gracias',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'has colgado sin siguiente paso. Esa empresa ya no existe para ti' }],
        nextExchange: null,
      },
    ],
  },
  call_7: {
    id: 'call_7',
    npcBubble: 'Bueno, mándalo. Y mira, en septiembre puede que necesitemos a alguien para una nave.',
    choices: [
      {
        text: 'Perfecto, te lo mando hoy. ¿Te puedo llamar a principios de julio para recordártelo?',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        badge: 'siguiente_paso',
        badge2: 'seguimiento',
        nextExchange: 'call_8',
      },
      {
        text: 'Bien, te mando el portfolio. Ya me dices algo',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_8',
      },
      {
        text: '¡Genial! ¿Puedo pasarme mañana?',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'xX_Rookie_Xx', text: 'calma, te ha dicho septiembre no mañana' }],
        nextExchange: 'call_8',
      },
    ],
  },
  call_8: {
    id: 'call_8',
    npcBubble: 'Mira, yo no llevo las contrataciones. Eso lo lleva mi hermano. ¿Quieres que te pase su número?',
    choices: [
      {
        text: '¿Sí, por favor? ¿Cómo se llama para presentarme de tu parte?',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_9',
      },
      {
        text: 'Sí, dámelo',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_9',
      },
      {
        text: 'No, ya le llamaré yo por mi cuenta',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'te están ofreciendo una referencia directa, no la rechaces nunca' }],
        nextExchange: 'call_9',
      },
    ],
  },
  call_9: {
    id: 'call_9',
    npcBubble: 'Oye, ¿y cómo nos habéis encontrado? Nosotros no ponemos anuncios.',
    choices: [
      {
        text: 'Me dieron vuestro contacto en la ETT provincial. Me dijeron que trabajáis mucho en la comarca',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_10',
      },
      {
        text: 'Os encontré buscando por internet',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_10',
      },
    ],
  },
  call_10: {
    id: 'call_10',
    npcBubble: 'Bueno, ¿algo más que quieras preguntarme?',
    choices: [
      {
        text: 'Sí, ¿qué tipo de trabajos hacéis más? ¿Residencial, industrial...?',
        quality: 'good', points: 50,
        response: 'Sobre todo mantenimiento industrial y algo de vivienda nueva. Si sabes de cuadros eléctricos, eso es lo que más nos piden.',
        chatMsgs: [{ user: 'ChispaVolt', text: 'buena pregunta, ahora sabes qué esperan de ti' }],
        nextExchange: 'call_11',
      },
      {
        text: '¿Cuántos sois en la empresa?',
        quality: 'mediocre', points: 25,
        response: 'Somos cuatro, mi hermano, dos oficiales y yo. Cuando hay mucho trabajo buscamos ayudantes.',
        chatMsgs: [],
        nextExchange: 'call_11',
      },
      {
        text: 'No, nada, todo claro',
        quality: 'bad', points: 0,
        response: 'Vale, pues nada.',
        chatMsgs: [{ user: 'InstaladorJefe', text: 'siempre pregunta algo, demuestra que te interesa la empresa, no solo el puesto' }],
        nextExchange: 'call_11',
      },
    ],
  },
  call_11: {
    id: 'call_11',
    npcBubble: 'Para cerrar la llamada...',
    npcIsVega: true,
    choices: [
      {
        text: 'Muchas gracias por tu tiempo, José. Te mando el portfolio y te llamo en julio. ¡Buen día!',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        badgeConditional: 'llamada_perfecta',
        nextExchange: 'call_12',
      },
      {
        text: 'Gracias, pues eso, ya hablamos',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'call_12',
      },
      {
        text: 'Vale, adiós',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'la despedida importa, es la última impresión' }],
        nextExchange: 'call_12',
      },
    ],
  },
  call_12: {
    id: 'call_12',
    type: 'harmless',
    npcBubble: null,
    choices: [],
    chatMsgs: [
      { user: 'xX_Rookie_Xx', text: 'yo cuando cuelgo me tiemblan las manos' },
      { user: 'ChispaVolt', text: 'la primera llamada siempre cuesta, la segunda ya no tanto' },
      { user: 'CableMan420', text: 'Milane va mejorando, ánimo crack' },
    ],
    nextExchange: null,
  },
};

// --- La ETT ---
var TREE_ETT = {
  start: {
    id: 'start',
    npcBubble: 'Hola, siéntate. Soy Laura, llevo la selección del área industrial. ¿Qué te trae por aquí?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Vengo a registrarme. Soy instaladora eléctrica y busco primer empleo como ayudante',
        quality: 'good', points: 50,
        response: 'Perfecto, justo lo que nos piden las empresas de la zona. Cuéntame un poco más.',
        chatMsgs: [{ user: 'ChispaVolt', text: 'directa y concreta, bien' }],
        nextExchange: 'ett_3',
      },
      {
        text: 'Hola, busco trabajo de electricista',
        quality: 'mediocre', points: 25,
        response: '¿De qué tipo exactamente? Tenemos varias cosas.',
        chatMsgs: [],
        nextExchange: 'ett_3',
      },
      {
        text: 'Vengo a dejar el CV',
        quality: 'bad', points: 0,
        response: 'Puedes dejarlo, pero mejor cuéntame qué buscas y así te registro bien.',
        chatMsgs: [{ user: 'ElectricistaPRO_99', text: 'no te quedes en dejar el CV, habla con ella' }],
        nextExchange: 'ett_3',
      },
    ],
  },
  ett_3: {
    id: 'ett_3',
    npcBubble: '¿Qué formación tienes?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'He completado formación práctica en instalaciones eléctricas con prácticas verificadas en obra real',
        quality: 'good', points: 50,
        response: '¿Verificadas? Interesante. ¿Cómo funciona eso?',
        chatMsgs: [],
        nextExchange: 'ett_4',
      },
      {
        text: 'He hecho un BootKämp de electricidad',
        quality: 'mediocre', points: 25,
        response: '¿BootKämp? No me suena. ¿Es un certificado oficial?',
        chatMsgs: [],
        nextExchange: 'ett_3b',
      },
      {
        text: 'Un curso de electricista',
        quality: 'bad', points: 0,
        response: '¿Qué curso? FP, certificado de profesionalidad...?',
        chatMsgs: [],
        nextExchange: 'ett_4',
      },
    ],
  },
  ett_3b: {
    id: 'ett_3b',
    npcBubble: '¿BootKämp? No me suena. ¿Es un certificado oficial?',
    npcLabel: 'Laura',
    isRecovery: true,
    choices: [
      {
        text: 'Es un programa de formación intensiva con prácticas reales en obra. Todas verificadas y documentadas en un portfolio online',
        quality: 'good', points: 25,
        response: null,
        chatMsgs: [],
        badge: 'traductor_pro',
        nextExchange: 'ett_4',
      },
      {
        text: 'Sí, bueno, es como un curso intensivo',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_4',
      },
    ],
  },
  ett_4: {
    id: 'ett_4',
    type: 'harmless',
    npcBubble: 'Perdona, un segundo...',
    npcLabel: 'Laura',
    holdDuration: 3000,
    holdChat: [
      { user: 'TuboMaster_3000', text: 'fontanero dice, me apunto' },
      { user: 'Ohm_Dulce_Ohm', text: 'ese fontanero soy yo en otro servidor' },
    ],
    afterHold: '...perdona, era de una empresa que busca fontanero. Vaya mañanita. Bueno, ¿por dónde íbamos?',
    choices: [],
    nextExchange: 'ett_5',
  },
  ett_5: {
    id: 'ett_5',
    npcBubble: '¿Tienes algún documento que me puedas enseñar?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Sí, tengo mi portfolio en el móvil. Te lo enseño y te mando el enlace',
        quality: 'good', points: 50,
        response: 'Ah, esto está muy bien. Es mucho más útil que un CV normal.',
        chatMsgs: [],
        badge: 'evidencia',
        nextExchange: 'ett_6',
      },
      {
        text: 'Tengo el CV impreso',
        quality: 'mediocre', points: 25,
        response: 'Vale, lo adjunto a tu expediente.',
        chatMsgs: [],
        nextExchange: 'ett_6',
      },
      {
        text: 'No he traído nada, pero te lo puedo mandar por email',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'siempre lleva el portfolio encima' }],
        nextExchange: 'ett_6',
      },
    ],
  },
  ett_6: {
    id: 'ett_6',
    npcBubble: '¿Has trabajado en equipo? Las empresas buscan ayudantes que sepan seguir instrucciones.',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Sí, en las prácticas trabajé con un oficial. Aprendí a seguir indicaciones y a preguntar cuando no tenía claro',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_7a',
      },
      {
        text: 'Sí, hemos hecho trabajos en grupo',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_7a',
      },
      {
        text: 'Prefiero trabajar por mi cuenta, la verdad',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'como ayudante vas a trabajar SIEMPRE en equipo' }],
        nextExchange: 'ett_7a',
      },
    ],
  },
  ett_7a: {
    id: 'ett_7a',
    npcBubble: '¿Disponibilidad?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Inmediata',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_7b',
      },
      {
        text: 'Depende del horario y del sitio...',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_7b',
      },
    ],
  },
  ett_7b: {
    id: 'ett_7b',
    npcBubble: '¿Zona?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Teruel provincia. Me puedo mover por la comarca',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_8',
      },
      {
        text: 'Solo Villahornos y alrededores',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_8',
      },
    ],
  },
  ett_8: {
    id: 'ett_8',
    npcBubble: 'Oye, justo ayer nos llamó una empresa de climatización que busca a alguien. No es electricidad exactamente, pero es trabajo técnico parecido. ¿Te interesaría?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'No es mi especialidad, pero me interesa aprender. Apúntame y si sale ya valoro',
        quality: 'good', points: 50,
        response: null,
        chatMsgs: [{ user: 'ChispaVolt', text: 'ampliar el abanico es inteligente' }],
        nextExchange: 'ett_9',
      },
      {
        text: 'No, yo solo busco electricidad',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_9',
      },
      {
        text: 'Sí, sí, yo hago de todo',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'no digas que haces de todo, di que estás abierta a aprender' }],
        nextExchange: 'ett_9',
      },
    ],
  },
  ett_9: {
    id: 'ett_9',
    npcBubble: 'Perfecto, ya estás registrada. Si sale algo, te llamamos.',
    npcLabel: 'Laura',
    choices: [
      {
        text: '¡Genial! ¿Os puedo llamar cada dos semanas para ver si ha surgido algo?',
        quality: 'good', points: 50,
        response: 'Sí, cada 10-15 días está bien.',
        chatMsgs: [],
        badge: 'seguimiento',
        nextExchange: 'ett_10',
      },
      {
        text: '¿Cada cuánto debería llamar para hacer seguimiento?',
        quality: 'good', points: 50,
        response: 'Cada 10-15 días. Es ser profesional, no pesada.',
        chatMsgs: [],
        badge: 'seguimiento',
        nextExchange: 'ett_10',
      },
      {
        text: 'Vale, espero vuestra llamada',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'si no haces seguimiento, te olvidan. Cada 10-15 días' }],
        nextExchange: 'ett_10',
      },
      {
        text: '¿Os puedo llamar mañana?',
        quality: 'bad', points: 0,
        response: 'Mañana no. Pero en un par de semanas sí.',
        chatMsgs: [],
        nextExchange: 'ett_10',
      },
    ],
  },
  ett_10: {
    id: 'ett_10',
    npcBubble: 'Te voy a decir una cosa. Muchos vienen, se registran, y no vuelven a llamar. Los que consiguen trabajo hacen seguimiento. ¿Tú lo vas a hacer?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Sí, me apunto llamar cada dos semanas. ¿Cuál es el mejor día para pillaros?',
        quality: 'good', points: 50,
        response: 'Los martes y miércoles por la mañana es cuando menos lío tenemos.',
        chatMsgs: [],
        nextExchange: 'ett_11',
      },
      {
        text: 'Sí, claro, iré llamando',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_11',
      },
      {
        text: 'Bueno, si hay algo ya me llamaréis vosotros',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'CableMan420', text: 'acaba de decirte que los que no llaman no consiguen trabajo' }],
        nextExchange: 'ett_11',
      },
    ],
  },
  ett_11: {
    id: 'ett_11',
    npcBubble: '¿Conoces Hermanos Gracia? Les mandamos bastante gente.',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Sí, les he llamado hoy. Me han dicho que puede que en septiembre necesiten a alguien',
        quality: 'none', points: 0,
        response: 'Ah, mira, eso encaja. Si les mandamos tu perfil desde la ETT también, tienes más opciones.',
        chatMsgs: [],
        nextExchange: 'ett_12',
      },
      {
        text: 'No me suena, ¿quiénes son?',
        quality: 'none', points: 0,
        response: 'Son de mantenimiento eléctrico. Les paso tu perfil.',
        chatMsgs: [],
        nextExchange: 'ett_12',
      },
    ],
  },
  ett_12: {
    id: 'ett_12',
    npcBubble: '¿Tienes alguna duda sobre el proceso?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Sí, ¿cuándo una empresa os pide a alguien, me llamáis vosotros o tengo que llamar yo?',
        quality: 'good', points: 50,
        response: 'Normalmente te llamamos, pero si llamas de vez en cuando te tenemos más presente.',
        chatMsgs: [],
        nextExchange: 'ett_13',
      },
      {
        text: '¿Tenéis muchas empresas de electricidad en la zona?',
        quality: 'mediocre', points: 25,
        response: null,
        chatMsgs: [],
        nextExchange: 'ett_13',
      },
      {
        text: 'No, todo claro',
        quality: 'bad', points: 0,
        response: null,
        chatMsgs: [{ user: 'InstaladorJefe', text: 'preguntar demuestra que te lo tomas en serio' }],
        nextExchange: 'ett_13',
      },
    ],
  },
  ett_13: {
    id: 'ett_13',
    npcBubble: 'Bueno, pues ya está todo. ¿Algo más?',
    npcLabel: 'Laura',
    choices: [
      {
        text: 'Muchas gracias, Laura. Me apunto llamar en dos semanas. ¡Buen día!',
        quality: 'good', points: 50,
        response: 'Perfecto, aquí te espero. ¡Suerte!',
        chatMsgs: [{ user: 'CableMan420', text: 'cierre profesional, con nombre y fecha' }],
        badge: 'ett_registrada',
        nextExchange: null,
      },
      {
        text: 'Gracias por todo, adiós',
        quality: 'mediocre', points: 25,
        response: '¡De nada, suerte!',
        chatMsgs: [],
        badge: 'ett_registrada',
        nextExchange: null,
      },
    ],
  },
};

var TREES = {
  mensaje: TREE_MENSAJE,
  llamada: TREE_LLAMADA,
  ett: TREE_ETT,
};

// ============================================================
// SECTION 3: State
// ============================================================

var RECORD_KEY = 'mi_primer_curro_tarde_record';

var S = {
  score: 0,
  locations: {
    mensaje: { state: 'available', quality: 0, done: false },
    llamada: { state: 'available', quality: 0, done: false },
    ett: { state: 'available', quality: 0, done: false },
  },
  badges: {},
  currentLocation: null,
  currentExchange: null,
  taskCompleted: false,
  messageLines: [],
  callTimerInterval: null,
  callSeconds: 0,
};

function resetState() {
  S.score = 0;
  S.locations = {
    mensaje: { state: 'available', quality: 0, done: false },
    llamada: { state: 'available', quality: 0, done: false },
    ett: { state: 'available', quality: 0, done: false },
  };
  S.badges = {};
  S.currentLocation = null;
  S.currentExchange = null;
  S.taskCompleted = false;
  S.messageLines = [];
  stopCallTimer();
}

function updateStats() {
  var completed = 0;
  ['mensaje', 'llamada', 'ett'].forEach(function(id) {
    if (S.locations[id].done) completed++;
  });
  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-points').textContent = S.score;
}

function getRecord() {
  return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
}

function saveRecord(score) {
  var prev = getRecord();
  if (score > prev) {
    localStorage.setItem(RECORD_KEY, score.toString());
  }
}

function fireTaskCompleted() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

// ============================================================
// SECTION 4: Dialogue Engine
// ============================================================

function playExchange(exchangeId) {
  var tree = TREES[S.currentLocation];
  var exchange = tree[exchangeId];
  if (!exchange) {
    // End of dialogue
    finishLocation();
    return;
  }

  S.currentExchange = exchange;

  // Branch exchange - route based on quality
  if (exchange.type === 'branch') {
    var quality = S.locations[S.currentLocation].quality;
    var nextId;
    if (quality >= exchange.thresholds.high) {
      nextId = exchange.branches.high;
    } else if (quality >= exchange.thresholds.medium) {
      nextId = exchange.branches.medium;
    } else {
      nextId = exchange.branches.low;
    }
    // For message location: send the message first
    if (S.currentLocation === 'mensaje') {
      sendComposedMessage(function() {
        playExchange(nextId);
      });
    } else {
      playExchange(nextId);
    }
    return;
  }

  // No-response exchange (read, no reply)
  if (exchange.type === 'no_response') {
    // Show "read" indicator then after delay show chat + choices
    var waArea = document.getElementById('wa-chat-area');
    // Add read indicator
    var readDiv = document.createElement('div');
    readDiv.className = 'wa-msg-left';
    readDiv.innerHTML = '<div style="color:#8696a0;font-style:italic;">Leido ✓✓</div>';
    waArea.appendChild(readDiv);
    waArea.scrollTop = waArea.scrollHeight;

    setTimeout(function() {
      if (exchange.noResponseChat) {
        exchange.noResponseChat.forEach(function(msg, i) {
          setTimeout(function() { addChatMessage(msg.text, msg.user); }, i * 600);
        });
      }
      setTimeout(function() {
        showChoicesForExchange(exchange);
      }, 1000);
    }, exchange.noResponseDelay || 3000);
    return;
  }

  // Harmless with hold (Amazon / Laura phone)
  if (exchange.holdDuration) {
    var npcBubble = document.getElementById('npc-bubble');
    typewriter(npcBubble, exchange.npcBubble, 30, function() {
      // Show hold
      if (S.currentLocation === 'llamada') {
        showCallHold();
        vibrate('light', [0, 50, 100, 50]);
      }
      if (exchange.holdChat) {
        exchange.holdChat.forEach(function(msg, i) {
          setTimeout(function() { addChatMessage(msg.text, msg.user); }, 500 + i * 800);
        });
      }
      setTimeout(function() {
        if (S.currentLocation === 'llamada') {
          hideCallHold();
        }
        if (exchange.afterHold) {
          npcBubble.textContent = '';
          typewriter(npcBubble, exchange.afterHold, 30, function() {
            if (exchange.choices && exchange.choices.length > 0) {
              showChoicesForExchange(exchange);
            } else {
              // No choices, auto-advance
              if (exchange.nextExchange) {
                setTimeout(function() { playExchange(exchange.nextExchange); }, 1500);
              } else {
                finishLocation();
              }
            }
          });
        } else if (exchange.choices && exchange.choices.length > 0) {
          showChoicesForExchange(exchange);
        } else {
          if (exchange.nextExchange) {
            setTimeout(function() { playExchange(exchange.nextExchange); }, 1500);
          } else {
            finishLocation();
          }
        }
      }, exchange.holdDuration);
    });
    return;
  }

  // Harmless end (no choices, just chat)
  if (exchange.type === 'harmless' && (!exchange.choices || exchange.choices.length === 0)) {
    if (exchange.npcBubble) {
      var npcBubble = document.getElementById('npc-bubble');
      typewriter(npcBubble, exchange.npcBubble, 30);
    }
    if (exchange.chatMsgs) {
      exchange.chatMsgs.forEach(function(msg, i) {
        setTimeout(function() { addChatMessage(msg.text, msg.user); }, 800 + i * 800);
      });
    }
    var delay = 1500 + (exchange.chatMsgs ? exchange.chatMsgs.length * 800 : 0);
    setTimeout(function() {
      if (exchange.nextExchange) {
        playExchange(exchange.nextExchange);
      } else {
        finishLocation();
      }
    }, delay);
    return;
  }

  // Standard exchange: show NPC bubble then choices
  if (exchange.npcBubble) {
    var npcBubble = document.getElementById('npc-bubble');
    typewriter(npcBubble, exchange.npcBubble, 30, function() {
      showChoicesForExchange(exchange);
    });
  } else {
    showChoicesForExchange(exchange);
  }
}

function showChoicesForExchange(exchange) {
  var container = document.getElementById('choice-buttons');
  container.innerHTML = '';
  container.classList.remove('hidden');

  var shuffled = shuffle(exchange.choices);

  shuffled.forEach(function(choice) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', function() {
      onChoiceTap(choice, exchange);
    });
    container.appendChild(btn);
  });
}

function onChoiceTap(choice, exchange) {
  vibrate('light');

  // Hide choices
  var container = document.getElementById('choice-buttons');
  container.classList.add('hidden');

  // Flash the button gold briefly (visual only)

  // Haptic based on quality
  if (choice.quality === 'good') {
    vibrate('success');
  } else if (choice.quality === 'bad') {
    vibrate('error');
  }

  // Update score
  var points = choice.points || 0;
  S.score += points;
  S.locations[S.currentLocation].quality += points;
  showFloatingScore(points);
  updateStats();

  // Update avatar
  if (choice.quality === 'good') {
    document.getElementById('loc-avatar').src = CHARACTER.celebrating;
    setTimeout(function() { document.getElementById('loc-avatar').src = CHARACTER.happy; }, 1500);
  } else if (choice.quality === 'bad') {
    document.getElementById('loc-avatar').src = CHARACTER.worried;
    setTimeout(function() { document.getElementById('loc-avatar').src = CHARACTER.happy; }, 1500);
  }

  // WhatsApp compose line
  if (choice.composeLine && S.currentLocation === 'mensaje') {
    addComposeMessageLine(choice.composeLine);
  }

  // Show player bubble
  var playerBubble = document.getElementById('player-bubble');
  typewriter(playerBubble, choice.text, 25, function() {
    // Chat overlay messages
    if (choice.chatMsgs && choice.chatMsgs.length > 0) {
      choice.chatMsgs.forEach(function(msg, i) {
        setTimeout(function() { addChatMessage(msg.text, msg.user); }, 800 + i * 600);
      });
    }

    // Badge
    if (choice.badge) earnBadge(choice.badge);
    if (choice.badge2) earnBadge(choice.badge2);

    // Conditional badge (llamada_perfecta - check >=75% quality)
    if (choice.badgeConditional === 'llamada_perfecta') {
      // Max possible ~550, 75% = 412. Approximate: if quality >= 375
      var q = S.locations[S.currentLocation].quality;
      if (q >= 375) earnBadge('llamada_perfecta');
    }

    // Show NPC response if any
    var responseDelay = 500;
    if (choice.response) {
      setTimeout(function() {
        var npcBubble = document.getElementById('npc-bubble');
        npcBubble.textContent = '';
        typewriter(npcBubble, choice.response, 30, function() {
          proceedToNext(choice);
        });
      }, responseDelay);
    } else {
      setTimeout(function() {
        proceedToNext(choice);
      }, responseDelay + 500);
    }
  });
}

function proceedToNext(choice) {
  if (choice.nextExchange) {
    setTimeout(function() {
      dismissAllBubbles();
      setTimeout(function() {
        playExchange(choice.nextExchange);
      }, 400);
    }, 800);
  } else {
    setTimeout(function() {
      finishLocation();
    }, 1000);
  }
}

// ============================================================
// SECTION 5: Screen Flows
// ============================================================

function initGame() {
  resetState();

  var loadingText = document.getElementById('loading-text');
  loadingText.textContent = 'Conectando al servidor...';
  showScreen('loading');

  setTimeout(function() {
    loadingText.textContent = 'Cargando El Contacto...';
  }, 800);
  setTimeout(function() {
    loadingText.textContent = 'Preparando escenario...';
  }, 1600);
  setTimeout(function() {
    loadingText.textContent = 'Hoy toca contactar con empresas de verdad';
  }, 2400);

  // Preload assets
  document.getElementById('cafe-avatar').src = CHARACTER.happy;
  document.getElementById('loc-avatar').src = CHARACTER.happy;
  document.getElementById('cafe-scene').style.backgroundImage = 'url(' + CAFE_BG + ')';
  updateStats();
  buildMarkers();

  setTimeout(function() {
    showScreen('cafe');
    startAmbientChat();
    setTimeout(function() {
      addChatMessage('Vale, ya sé dónde hay trabajo. Ahora toca lo difícil: contactar.', 'Vega');
    }, 800);
    setTimeout(function() {
      addChatMessage('un buen mensaje abre puertas, una buena llamada las cruza', 'InstaladorJefe');
    }, 2500);
  }, 4000);
}

function buildMarkers() {
  var container = document.getElementById('location-markers');
  container.innerHTML = '';
  LOCATIONS_CONFIG.forEach(function(loc, i) {
    var marker = document.createElement('div');
    marker.className = 'loc-marker';
    marker.dataset.locId = loc.id;
    marker.style.top = loc.pos.top + '%';
    marker.style.left = loc.pos.left + '%';
    marker.style.transform = 'scale(' + loc.scale + ')';
    marker.innerHTML = '<div class="marker-dot"></div><span class="marker-label">' + loc.label + '</span>';
    marker.style.opacity = '0';
    setTimeout(function() {
      marker.style.transition = 'opacity 0.3s ease';
      marker.style.opacity = '1';
    }, 200 + i * 100);
    marker.addEventListener('click', function() { onMarkerTap(loc); });
    container.appendChild(marker);
  });
}

function updateMarkerState(locId) {
  var marker = document.querySelector('.loc-marker[data-loc-id="' + locId + '"]');
  if (!marker) return;
  var locState = S.locations[locId];
  if (locState.done) {
    marker.classList.add('visited');
    if (!marker.querySelector('.marker-check')) {
      var check = document.createElement('span');
      check.className = 'marker-check';
      check.textContent = '\u2713';
      marker.querySelector('.marker-dot').appendChild(check);
    }
  }
}

function onMarkerTap(loc) {
  if (S.locations[loc.id].done) {
    addChatMessage('Ya has completado esta localización', 'Vega');
    return;
  }
  vibrate('light');
  enterLocation(loc);
}

function enterLocation(loc) {
  S.currentLocation = loc.id;
  S.locations[loc.id].state = 'entered';

  // Set background
  var locBg = document.getElementById('loc-bg');
  if (loc.isPhone) {
    locBg.style.display = 'none';
    document.getElementById('loc-scene').classList.add('phone-active');
  } else {
    locBg.style.display = '';
    locBg.src = LOCATION_BGS[loc.id];
    document.getElementById('loc-scene').classList.remove('phone-active');
  }

  // Show/hide WhatsApp UI
  var waCompose = document.getElementById('wa-compose');
  var callUI = document.getElementById('call-ui');
  waCompose.classList.add('hidden');
  callUI.classList.add('hidden');

  if (loc.id === 'mensaje') {
    waCompose.classList.remove('hidden');
    S.messageLines = [];
    document.getElementById('wa-chat-area').innerHTML = '';
  }

  document.getElementById('loc-avatar').src = CHARACTER.happy;
  clearDialogue();
  showScreen('location');
  document.getElementById('btn-back').classList.remove('hidden');

  // Vega intro message
  var vegaIntros = {
    mensaje: 'A ver, el mensaje tiene que ser corto y directo. Nada de parrafones.',
    llamada: 'Llamar en frío... esto me cuesta. Pero si no llamo, no existe.',
    ett: 'La ETT está ahí enfrente. Voy a registrarme como toca.',
  };
  setTimeout(function() {
    addChatMessage(vegaIntros[loc.id], 'Vega');
  }, 500);

  // Start dialogue
  setTimeout(function() {
    playExchange('start');
  }, 1200);
}

function finishLocation() {
  var locId = S.currentLocation;
  if (!locId) return;

  S.locations[locId].done = true;
  S.locations[locId].state = 'completed';

  // Hide special UIs
  document.getElementById('wa-compose').classList.add('hidden');
  document.getElementById('call-ui').classList.add('hidden');
  stopCallTimer();

  // First location badge
  var completedCount = 0;
  ['mensaje', 'llamada', 'ett'].forEach(function(id) {
    if (S.locations[id].done) completedCount++;
  });
  if (completedCount === 1) earnBadge('primer_contacto');

  // Location-specific badges
  if (locId === 'mensaje') {
    var msgQual = S.locations.mensaje.quality;
    // Max ~300 (6 scored exchanges * 50). 75% = 225
    if (msgQual >= 225) earnBadge('mensaje_pro');
    // Post-completion Vega message
    if (msgQual >= 225) {
      addChatMessage('Mensaje enviado y me ha contestado. Eso es un buen mensaje.', 'Vega');
      document.getElementById('loc-avatar').src = CHARACTER.celebrating;
    } else {
      addChatMessage('No ha contestado... Algo falla. La próxima vez, más directo.', 'Vega');
      document.getElementById('loc-avatar').src = CHARACTER.worried;
    }
  }

  if (locId === 'llamada') {
    var callQual = S.locations.llamada.quality;
    // llamada_perfecta checked in onChoiceTap via badgeConditional
    if (callQual >= 375) {
      addChatMessage('He colgado con un siguiente paso. Eso es lo que importa.', 'Vega');
      document.getElementById('loc-avatar').src = CHARACTER.celebrating;
    } else {
      addChatMessage('He colgado sin siguiente paso. Esa oportunidad se ha ido.', 'Vega');
      document.getElementById('loc-avatar').src = CHARACTER.worried;
    }
  }

  if (locId === 'ett') {
    // ett_registrada badge is awarded in the dialogue tree
    var ettQual = S.locations.ett.quality;
    if (ettQual >= 375) {
      addChatMessage('Registrada y con fecha de seguimiento. Profesional.', 'Vega');
      document.getElementById('loc-avatar').src = CHARACTER.celebrating;
    } else {
      addChatMessage('He dejado el CV pero no he hablado con nadie. Eso no funciona.', 'Vega');
      document.getElementById('loc-avatar').src = CHARACTER.worried;
    }
  }

  // Chat progress
  if (completedCount === 1) {
    setTimeout(function() { addChatMessage('primera candidatura enviada, faltan 2', 'ChispaVolt'); }, 1500);
  } else if (completedCount === 2) {
    setTimeout(function() { addChatMessage('dos de tres, ya casi está', 'CableMan420'); }, 1500);
  }

  // Check all done
  if (completedCount === 3) {
    earnBadge('tres_candidaturas');
    if (!S.taskCompleted) {
      S.taskCompleted = true;
      fireTaskCompleted();
      addChatMessage('🏆 TAREA COMPLETADA - Has contactado con 3 empresas', null, true);
      vibrate('success', [0, 100, 50, 200]);
    }
    setTimeout(function() {
      goToResults();
    }, 2000);
    return;
  }

  // Return to café after a moment
  setTimeout(function() {
    returnToCafe();
  }, 2500);
}

function returnToCafe() {
  if (S.currentLocation) {
    updateMarkerState(S.currentLocation);
  }
  document.getElementById('loc-scene').classList.remove('phone-active');
  document.getElementById('wa-compose').classList.add('hidden');
  document.getElementById('call-ui').classList.add('hidden');
  stopCallTimer();
  showScreen('cafe');
  S.currentLocation = null;
}

// ============================================================
// SECTION 6: WhatsApp Compose Mechanic
// ============================================================

function addComposeMessageLine(text) {
  if (!text) return;
  S.messageLines.push(text);

  var waArea = document.getElementById('wa-chat-area');
  var bubble = document.createElement('div');
  bubble.className = 'wa-msg-right';
  bubble.innerHTML = '<div>' + text + '</div><div class="wa-msg-time">' + getCurrentTime() + '</div>';
  waArea.appendChild(bubble);
  waArea.scrollTop = waArea.scrollHeight;
}

function sendComposedMessage(callback) {
  var waArea = document.getElementById('wa-chat-area');

  // Clear individual lines and show the full composed message
  waArea.innerHTML = '';
  var fullMessage = S.messageLines.join(' ');

  var bubble = document.createElement('div');
  bubble.className = 'wa-msg-right';
  bubble.innerHTML = '<div>' + fullMessage + '</div><div class="wa-msg-time">' + getCurrentTime() + ' ✓✓</div>';
  waArea.appendChild(bubble);
  waArea.scrollTop = waArea.scrollHeight;

  // Show "typing..." indicator
  setTimeout(function() {
    var typing = document.createElement('div');
    typing.className = 'wa-typing';
    typing.textContent = 'escribiendo...';
    typing.id = 'wa-typing';
    waArea.appendChild(typing);
    waArea.scrollTop = waArea.scrollHeight;
  }, 1000);

  // Quality-based chat reaction
  var quality = S.locations.mensaje.quality;
  setTimeout(function() {
    if (quality >= 250) {
      addChatMessage('directo, con evidencia y con pregunta, eso se contesta', 'ChispaVolt');
    } else if (quality >= 125) {
      addChatMessage('no está mal pero le falta algo', 'CableMan420');
    } else {
      addChatMessage('ese mensaje no invita a responder', 'InstaladorJefe');
    }
  }, 1500);

  // Remove typing and show employer response
  setTimeout(function() {
    var typingEl = document.getElementById('wa-typing');
    if (typingEl) typingEl.remove();

    vibrate('success');

    if (callback) callback();
  }, 3500);
}

function getCurrentTime() {
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

// Employer response as left bubble in WhatsApp
function showEmployerWAResponse(text) {
  var waArea = document.getElementById('wa-chat-area');
  var bubble = document.createElement('div');
  bubble.className = 'wa-msg-left';
  bubble.innerHTML = '<div>' + text + '</div><div class="wa-msg-time">' + getCurrentTime() + '</div>';
  waArea.appendChild(bubble);
  waArea.scrollTop = waArea.scrollHeight;
}

// ============================================================
// SECTION 7: Phone Call UI
// ============================================================

function showCallUI() {
  var callUI = document.getElementById('call-ui');
  callUI.classList.remove('hidden');
  document.getElementById('call-status').textContent = 'En llamada';
  startCallTimer();
}

function startCallTimer() {
  stopCallTimer();
  S.callSeconds = 0;
  updateCallTimerDisplay();
  S.callTimerInterval = setInterval(function() {
    S.callSeconds++;
    updateCallTimerDisplay();
  }, 1000);
}

function stopCallTimer() {
  if (S.callTimerInterval) {
    clearInterval(S.callTimerInterval);
    S.callTimerInterval = null;
  }
}

function updateCallTimerDisplay() {
  var m = Math.floor(S.callSeconds / 60);
  var s = S.callSeconds % 60;
  document.getElementById('call-timer').textContent =
    (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function showCallHold() {
  var callUI = document.getElementById('call-ui');
  var hold = document.createElement('div');
  hold.className = 'call-hold';
  hold.id = 'call-hold-screen';
  hold.innerHTML = '<div class="call-hold-text">En espera...</div>';
  callUI.appendChild(hold);
}

function hideCallHold() {
  var hold = document.getElementById('call-hold-screen');
  if (hold) hold.remove();
}

// ============================================================
// SECTION 8: Results Screen
// ============================================================

function goToResults() {
  stopAmbientChat();
  saveRecord(S.score);
  showScreen('results');
  populateResults();
}

function populateResults() {
  // Calculate totals
  var totalQuality = 0;
  var locIds = ['mensaje', 'llamada', 'ett'];
  locIds.forEach(function(id) {
    totalQuality += S.locations[id].quality;
  });

  // Avatar state
  var avatarImg = document.getElementById('results-avatar');
  var completedCount = 0;
  locIds.forEach(function(id) { if (S.locations[id].done) completedCount++; });

  if (completedCount >= 3 && totalQuality >= 900) {
    avatarImg.src = CHARACTER.celebrating;
  } else if (completedCount >= 2) {
    avatarImg.src = CHARACTER.happy;
  } else {
    avatarImg.src = CHARACTER.worried;
  }

  // Stats
  var statsContainer = document.getElementById('results-stats');
  statsContainer.innerHTML = '';
  var stats = [
    'Localizaciones: ' + completedCount + '/3',
    'Puntuación total: ' + S.score + ' pts',
    'Record: ' + Math.max(S.score, getRecord()) + ' pts',
  ];
  stats.forEach(function(text, i) {
    var div = document.createElement('div');
    div.textContent = text;
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    statsContainer.appendChild(div);
    setTimeout(function() {
      div.style.transition = 'all 0.4s ease-out';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
      vibrate('light');
    }, 400 + i * 400);
  });

  // Badges
  var badgesContainer = document.getElementById('results-badges');
  badgesContainer.innerHTML = '';
  var delayBase = 400 + stats.length * 400 + 400;
  var badgeIndex = 0;
  BADGES.forEach(function(badge) {
    var earned = !!S.badges[badge.id];
    var el = document.createElement('div');
    el.className = 'badge' + (earned ? '' : ' locked');
    el.textContent = earned ? badge.icon : '🔒';
    el.title = badge.label + ': ' + badge.desc;
    el.style.transform = 'scale(0)';
    badgesContainer.appendChild(el);
    var delay = delayBase + badgeIndex * 200;
    badgeIndex++;
    (function(element, d, isFirst) {
      setTimeout(function() {
        element.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
        element.style.transform = 'scale(1)';
        if (isFirst && earned) vibrate('success');
      }, d);
    })(el, delay, badgeIndex === 1);
  });

  // Summary
  var summaryContainer = document.getElementById('results-summary');
  summaryContainer.innerHTML = '';
  var h4 = document.createElement('h4');

  // Tier each location
  var highCount = 0;
  locIds.forEach(function(id) {
    var q = S.locations[id].quality;
    // rough max per location ~500
    if (q / 500 >= 0.75) highCount++;
  });

  var summaryMsg;
  if (highCount >= 3) {
    summaryMsg = 'Tres candidaturas perfectas. Mañana toca entrevista, pero eso es otro servidor.';
  } else if (highCount >= 1) {
    summaryMsg = 'Has contactado bien, pero hay sitio para mejorar.';
  } else {
    summaryMsg = 'Contactar cuesta, pero cada intento enseña algo.';
  }

  h4.textContent = 'Resultado';
  summaryContainer.appendChild(h4);
  var p = document.createElement('p');
  p.textContent = summaryMsg;
  summaryContainer.appendChild(p);

  // Vega result chat
  var vegaMsg;
  if (highCount >= 3) {
    vegaMsg = 'Tres contactos bien hechos en una tarde. Mañana toca entrevista.';
  } else if (highCount >= 1) {
    vegaMsg = 'He contactado, pero puedo mejorar. Evidencia y siguiente paso.';
  } else {
    vegaMsg = 'Contactar cuesta, pero cada intento enseña. La próxima, más directa.';
  }
  var msgDelay = delayBase + badgeIndex * 200 + 400;
  setTimeout(function() {
    addChatMessage(vegaMsg, 'Vega');
  }, msgDelay);
}

function endTarde() {
  var completedCount = 0;
  ['mensaje', 'llamada', 'ett'].forEach(function(id) {
    if (S.locations[id].done) completedCount++;
  });

  if (completedCount < 3) {
    showOverlay('confirm-overlay');
    return;
  }

  goToResults();
}

// ============================================================
// SECTION 9: Event Wiring
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // Title -> Server Select
  document.getElementById('btn-play').addEventListener('click', function() {
    vibrate('light');
    showScreen('server-select');
  });

  // Server Select
  document.querySelectorAll('.server-card').forEach(function(card) {
    card.addEventListener('click', function() {
      if (card.classList.contains('server-completed')) {
        vibrate('light');
        document.getElementById('toast-title').textContent = 'Servidor completado';
        document.getElementById('toast-text').textContent =
          'Ya has completado este servidor esta mañana.';
        showOverlay('toast-overlay');
        return;
      }
      var zone = card.dataset.zone;
      if (zone === 'contacto') {
        vibrate('light');
        initGame();
      }
    });
  });

  // End tarde
  document.getElementById('btn-end-tarde').addEventListener('click', function() {
    vibrate('light');
    endTarde();
  });

  document.getElementById('btn-confirm-end').addEventListener('click', function() {
    hideOverlay('confirm-overlay');
    goToResults();
  });

  document.getElementById('btn-cancel-end').addEventListener('click', function() {
    hideOverlay('confirm-overlay');
  });

  // Toast dismiss
  document.getElementById('btn-understood').addEventListener('click', function() {
    vibrate('light');
    hideOverlay('toast-overlay');
  });

  // Back to café
  document.getElementById('btn-back').addEventListener('click', function() {
    vibrate('light');
    returnToCafe();
  });

  // Tap scene to dismiss bubbles
  document.getElementById('loc-scene').addEventListener('click', function(e) {
    if (e.target.closest('.wa-compose') || e.target.closest('.call-ui')) return;
    dismissAllBubbles();
  });

  // Results actions
  document.getElementById('btn-replay').addEventListener('click', function() {
    vibrate('light');
    initGame();
  });

  document.getElementById('btn-exit').addEventListener('click', function() {
    vibrate('light');
    showScreen('title');
  });

  // Player count animation
  var playerCountEl = document.getElementById('player-count');
  setInterval(function() {
    var base = 300 + Math.floor(Math.random() * 100);
    playerCountEl.textContent = base;
  }, 5000);

  // Call UI: show when llamada exchange requests it
  // The call_2 exchange has showCallUI: true - handled in playExchange
  var origPlayExchange = playExchange;
  playExchange = function(exchangeId) {
    var tree = TREES[S.currentLocation];
    if (tree) {
      var exchange = tree[exchangeId];
      if (exchange && exchange.showCallUI) {
        showCallUI();
      }
    }
    origPlayExchange(exchangeId);
  };

  // For message location: show employer response in WA bubbles
  var origOnChoiceTap = onChoiceTap;
  // Intercept to show WA employer responses for mensaje high-quality path
  // This is handled within the normal flow since exchange responses
  // appear as NPC bubbles. For the WA overlay, we show employer responses
  // as left-aligned bubbles when in the post-send branches.
  var origProceedToNext = proceedToNext;
  // Patch: when in mensaje and the NPC responds, also show in WA
  // We can do this by hooking into the exchange flow.

  // Monkey-patch to show WA employer bubbles for mensaje exchanges after send
  var waResponseExchanges = ['msg_8a', 'msg_9a', 'msg_10a', 'msg_11a', 'msg_8b', 'msg_9b', 'msg_8c'];

  var origPlayExchange2 = playExchange;
  playExchange = function(exchangeId) {
    // Show employer text in WA for mensaje post-send exchanges
    if (S.currentLocation === 'mensaje' && waResponseExchanges.indexOf(exchangeId) >= 0) {
      var tree = TREES.mensaje;
      var exchange = tree[exchangeId];
      if (exchange && exchange.npcBubble) {
        showEmployerWAResponse(exchange.npcBubble);
      }
    }
    origPlayExchange2(exchangeId);
  };
});
