/* === Mi Primer Curro [SIMULADOR] — Game Shell === */

// --- CDN ---
var CDN = 'https://res.cloudinary.com/kampe/image/upload/f_auto,q_auto';

// --- Haptic helper ---
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    const ms = { light: 10, medium: 20, heavy: 40, success: 30, error: 50 };
    navigator.vibrate(pattern || ms[level] || 20);
  }
}

// --- Screen management ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
  // Enable scroll for results screen
  // No special scroll mode — all screens fit in viewport
}

// --- Overlay management ---
function showOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// --- Score + Record ---
const RECORD_KEY = 'mi_primer_curro_record';
const TASK_THRESHOLD = 150;

// === STATE ===
let S = {
  zone: null,
  score: 0,
  offersFound: 0,
  candidaturesSent: 0,
  kampePitchCount: 0,
  badges: {},
  locations: {},
  currentLocation: null,
  currentSecondary: null,
  taskCompleted: false,
  otherZonePlayed: false,
  firstOfferFound: false,
  firstCandidatureSent: false,
  _currentOffer: null,
};

function resetState(zone) {
  S.zone = zone;
  S.score = 0;
  S.offersFound = 0;
  S.candidaturesSent = 0;
  S.kampePitchCount = 0;
  S.badges = {};
  S.currentLocation = null;
  S.currentSecondary = null;
  S.taskCompleted = false;
  S.firstOfferFound = false;
  S.firstCandidatureSent = false;
  S._currentOffer = null;
  S.locations = {};
  const locs = LOCATIONS[zone];
  locs.forEach(loc => {
    S.locations[loc.id] = {
      state: 'available',
      mainDone: false,
      secondaryDone: {},
      offerFound: false,
      offerHandled: false,
    };
    loc.secondary.forEach(sec => {
      S.locations[loc.id].secondaryDone[sec.id] = false;
    });
  });
}

function updateStats() {
  document.getElementById('stat-offers').textContent = S.offersFound;
  document.getElementById('stat-candidatures').textContent = S.candidaturesSent;
}

function initZone(zone) {
  resetState(zone);
  var char = CHARACTERS[zone];

  // Show loading screen with Roblox-style connection messages
  var loadingText = document.getElementById('loading-text');
  loadingText.textContent = 'Conectando al servidor...';
  showScreen('loading');

  var zoneName = zone === 'urban' ? 'Valencia Centro' : 'Villahornos de Arriba';
  setTimeout(function() {
    loadingText.textContent = 'Cargando ' + zoneName + '...';
  }, 800);
  setTimeout(function() {
    loadingText.textContent = 'Preparando escenario...';
  }, 1600);
  setTimeout(function() {
    loadingText.textContent = zone === 'urban'
      ? 'Explora la calle, habla con la gente y encuentra ofertas de trabajo'
      : 'Recorre el pueblo, llama a puertas y descubre dónde está el curro';
  }, 2400);

  // Preload assets during loading
  document.getElementById('street-avatar').src = char.happy;
  document.getElementById('loc-avatar').src = char.happy;
  document.getElementById('street-bg').src = STREET_BG[zone];
  updateStats();
  buildMarkers();

  // Transition to street after loading (enough time to read the purpose message)
  setTimeout(function() {
    showScreen('street');
    startAmbientChat();
    setTimeout(function() {
      addChatMessage(char.introMsg, char.name, false);
    }, 800);
    setTimeout(function() {
      var zoneAmb = ZONE_AMBIENT[zone];
      var msg = zoneAmb[Math.floor(Math.random() * zoneAmb.length)];
      addChatMessage(msg.text, msg.user);
    }, 2500);
  }, 4000);
}

function buildMarkers() {
  var container = document.getElementById('location-markers');
  container.innerHTML = '';
  var locs = LOCATIONS[S.zone];
  locs.forEach(function(loc, i) {
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
  if (locState.state === 'completed') {
    marker.classList.add('visited');
    if (!marker.querySelector('.marker-check')) {
      var check = document.createElement('span');
      check.className = 'marker-check';
      check.textContent = '✓';
      marker.querySelector('.marker-dot').appendChild(check);
    }
  } else if (locState.state === 'entered') {
    marker.classList.add('entered');
  }
}

function onMarkerTap(loc) {
  vibrate('light');
  var avatar = document.getElementById('street-avatar');
  var scaleVal = 0.5 + (loc.pos.top / 100) * 0.5;
  avatar.style.top = loc.pos.top + '%';
  avatar.style.left = (loc.pos.left - 5) + '%';
  avatar.style.transform = 'scale(' + scaleVal + ')';
  setTimeout(function() { enterLocation(loc); }, 500);
}

function getRecord() {
  return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
}

function saveRecord(score) {
  const prev = getRecord();
  if (score > prev) {
    localStorage.setItem(RECORD_KEY, score.toString());
  }
}

function fireTaskCompleted() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

// --- Chat overlay ---
const CHAT_USERNAMES = [
  'ElectricistaPRO_99', 'xX_Rookie_Xx', 'CableMan420',
  'InstaladorJefe', 'ChispaVolt', 'TuboMaster_3000',
  'Ohm_Dulce_Ohm', 'NoobElectricista'
];

function addChatMessage(text, username, isAchievement) {
  const containers = [
    document.getElementById('chat-messages'),
    document.getElementById('loc-chat-messages')
  ];
  containers.forEach(container => {
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'chat-msg' + (isAchievement ? ' achievement' : '');
    if (isAchievement) {
      msg.textContent = text;
    } else {
      msg.innerHTML = `<span class="chat-user">[${username}]:</span> <span class="chat-text">${text}</span>`;
    }
    container.appendChild(msg);
    // Keep max 4 visible
    while (container.children.length > 3) {
      container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
    // Auto-fade after 8s
    setTimeout(() => {
      msg.style.transition = 'opacity 1s ease';
      msg.style.opacity = '0';
    }, 8000);
  });
}

// --- Ambient chat timer ---
let ambientTimer = null;

const AMBIENT_MESSAGES = [
  { user: 'TuboMaster_3000', text: 'yo soy fontanero pero me he metido aquí por error' },
  { user: 'xX_Rookie_Xx', text: 'alguien más nervioso o solo yo' },
  { user: 'ChispaVolt', text: 'venga que hoy encontramos algo seguro' },
  { user: 'Ohm_Dulce_Ohm', text: 'mi madre dice que busque en InfoCurros y ya' },
  { user: 'CableMan420', text: 'hay que moverse, el curro no viene solo' },
  { user: 'NoobElectricista', text: 'es mi primer día buscando, a ver qué tal' },
  { user: 'ElectricistaPRO_99', text: 'yo tardé 2 semanas en encontrar, pero encontré' },
  { user: 'xX_Rookie_Xx', text: 'cuántas ofertas lleváis? yo 0 de momento' },
  { user: 'ChispaVolt', text: 'si no te cogen a la primera no pasa nada eh' }
];

// === ZONE-SPECIFIC AMBIENT MESSAGES ===
const ZONE_AMBIENT = {
  urban: [
    { user: 'ElectricistaPRO_99', text: 'en Valencia hay bastante movimiento en portales' },
    { user: 'InstaladorJefe', text: 'las ETTs de ciudad tienen más ofertas de industria' },
    { user: 'ChispaVolt', text: 'aquí hay muchas empresas medianas, eso es bueno' },
  ],
  rural: [
    { user: 'CableMan420', text: 'en pueblo el boca a boca es lo que funciona' },
    { user: 'InstaladorJefe', text: 'aquí las ETTs provinciales conocen a todos' },
    { user: 'ElectricistaPRO_99', text: 'no te fíes de los portales en zona rural, busca de otra forma' },
  ],
};

// === CHARACTER CONFIG ===
const CHARACTERS = {
  urban: {
    name: 'Nico',
    happy: CDN + '/nico_happy_hx1syt.png',
    celebrating: CDN + '/nico_celebrating_vwn5dz.png',
    worried: CDN + '/nico_worried_jrygm6.png',
    introMsg: 'Bueno, es martes. Hoy busco curro de verdad. Vamos a ver qué hay por aquí.',
  },
  rural: {
    name: 'Vega',
    happy: CDN + '/vega_happy_anzbgw.png',
    celebrating: CDN + '/vega_celebrating_q3q8qe.png',
    worried: CDN + '/vega_worried_mqvjoh.png',
    introMsg: 'Venga, hoy toca moverse. A ver qué encuentro por el pueblo.',
  },
};

const STREET_BG = {
  urban: CDN + '/bg_street_urban_nqljtb.jpg',
  rural: CDN + '/bg_street_rural_gn7uwc.jpg',
};

// === LOCATION DATA ===
const LOCATIONS = {
  urban: [
    {
      id: 'ett',
      label: 'ETT',
      pos: { top: 58, left: 12 },
      scale: 0.85,
      bg: CDN + '/bg_ett_urban_gq5hjl.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: 'Buenos días. ¿Vienes a registrarte?',
        choices: [
          {
            text: 'Busco trabajo de lo que sea',
            correct: false,
            kampePitch: false,
            npcResponse: 'Vale, rellena este formulario y ya te llamaremos.',
            chatMsg: { user: 'InstaladorJefe', text: '"de lo que sea" es lo peor que puedes decir en una ETT' },
            offersOffer: false,
          },
          {
            text: 'Soy electricista, busco trabajo en instalaciones. Tengo prácticas verificadas',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Verificadas? Eso no me lo dicen mucho. A ver, déjame mirar en el sistema...',
            chatMsg: { user: 'ChispaVolt', text: 'ha reaccionado diferente cuando has dicho lo del portfolio' },
            offersOffer: true,
          },
          {
            text: 'Soy electricista, busco trabajo en instalaciones',
            correct: true,
            kampePitch: false,
            npcResponse: 'Ok, electricista. Tenemos una cosa abierta, déjame ver...',
            chatMsg: { user: 'ElectricistaPRO_99', text: 'bien, pero te ha faltado mencionar tu portfolio, eso diferencia' },
            offersOffer: true,
          },
        ],
      },
      secondary: [
        {
          id: 'painter',
          tappableArea: { top: 55, left: 55, width: 35, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Tú también vienes a lo de RandStaff?',
              choices: [
                { text: 'Sí, a lo de electricidad', response: 'Ah, electricidad. A mí me han dicho que para pintores ahora mismo no hay mucho, pero para vosotros hay movimiento. He visto a dos pasar antes de ti preguntando lo mismo.' },
                { text: 'Estoy mirando qué hay', response: 'Yo llevo una hora. Me han dicho que espere. Creo que depende del sector, los de industria van más rápido. ¿Tú de qué vas?' },
              ],
              chatMsg: { user: 'TuboMaster_3000', text: 'este tío lleva ahí un rato, pide cita la próxima vez' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante de electricista',
        company: 'RandStaff — para empresa cliente',
        type: 'Empresa grande (a través de ETT)',
        requirements: [
          { text: 'Formación en electricidad', met: true },
          { text: 'Disponibilidad inmediata', met: true },
          { text: 'Vehículo propio', met: false },
          { text: 'Mayor de 18', met: true },
        ],
        matchPct: 75,
        correctDecision: 'apply',
      },
    },
    {
      id: 'taller',
      label: 'Taller',
      pos: { top: 32, left: 28 },
      scale: 0.7,
      bg: CDN + '/bg_taller_urban_xdtk0a.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: '¿Está el jefe?',
            correct: false,
            kampePitch: false,
            npcResponse: 'Soy yo. ¿Y tú eres...?',
            chatMsg: { user: 'InstaladorJefe', text: 'nunca preguntes por "el jefe" cuando es empresa pequeña, preséntate directo' },
            offersOffer: false,
          },
          {
            text: 'Buenos días, soy electricista, busco trabajo. Tengo portfolio de prácticas verificadas, te lo puedo enseñar',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Portfolio? Eso es nuevo. A ver.',
            chatMsg: { user: 'CableMan420', text: 'le has pillado la atención, eso no se lo dice nadie' },
            offersOffer: true,
          },
          {
            text: 'Buenos días, ¿necesitáis ayuda? Soy electricista',
            correct: true,
            kampePitch: false,
            npcResponse: 'Ahora mismo no busco a nadie, pero déjame el teléfono.',
            chatMsg: { user: 'ChispaVolt', text: 'no está mal, pero podías haber mostrado algo que te diferencie' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'apprentice',
          tappableArea: { top: 35, left: 60, width: 30, height: 35 },
          exchanges: [
            {
              npcBubble: 'Ey, ¿vienes a preguntar por curro?',
              choices: [
                { text: 'Sí, ¿sabes si cogen a alguien?', response: 'El jefe dice que no, pero siempre dice que no. Yo vine tres veces hasta que me dijo que sí. Eso sí, anda, ¿tú haces el BootKämp? Mi prima Nerea también lo está haciendo.' },
                { text: '¿Tú trabajas aquí?', response: 'Desde hace cuatro meses. Empecé como tú, buscando por ahí. Al final llamé a la puerta directamente. Si entras, háblale claro, que es buen tío pero no le gusta que le mareen.' },
              ],
              chatMsg: { user: 'xX_Rookie_Xx', text: 'tres veces fue, yo me habría rajado a la segunda' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante instalador — obra nueva',
        company: 'Instalaciones López',
        type: 'Empresa mediana local',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Experiencia 1 año', met: false },
          { text: 'Trabajo en altura', met: false },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 40,
        correctDecision: 'pass',
      },
    },
    {
      id: 'bar',
      label: 'Bar',
      pos: { top: 38, left: 72 },
      scale: 0.75,
      bg: CDN + '/bg_bar_urban_wflui3.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: 'Perdona, he visto el logo de tu polo. ¿Trabajas en instalaciones?',
            correct: true,
            kampePitch: false,
            npcResponse: 'Sí, en Electrovall. ¿Por qué? ... Anda, pues justo estaban buscando un ayudante. Dile a mi jefe que te manda Carlos.',
            chatMsg: { user: 'InstaladorJefe', text: 'la red local es oro, fíjate en los detalles' },
            offersOffer: true,
          },
          {
            text: 'Sentarte y mirar el móvil',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'xX_Rookie_Xx', text: 'tienes a un tío con polo de empresa eléctrica a 2 metros y miras el movil' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'barista',
          tappableArea: { top: 20, left: 5, width: 30, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Qué te pongo?',
              choices: [
                { text: 'Un café, por favor', response: 'Marchando. ¿Eres del barrio? No te había visto. ... Ah, pues mira, ese de ahí del polo trabaja en una empresa de instalaciones. Lleva aquí todas las mañanas. No es mala persona, pero hay que pillarle antes del segundo café.' },
                { text: 'Nada, solo vengo a preguntar una cosa', response: 'Tú dirás. ... Yo de cables no sé nada, pero el del polo de ahí viene todas las mañanas. Creo que trabaja en algo de eso.' },
              ],
              chatMsg: { user: 'CableMan420', text: 'el barista sabe más de lo que parece' },
            },
          ],
        },
        {
          id: 'cat',
          tappableArea: { top: 72, left: 55, width: 28, height: 20 },
          exchanges: [
            {
              npcBubble: null,
              choices: [],
              chatMsg: [
                { user: 'TuboMaster_3000', text: 'bro estás tocando al gato en vez de buscar curro' },
                { user: 'Ohm_Dulce_Ohm', text: 'ese gato tiene más contactos que yo' },
              ],
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante electricista',
        company: 'Electrovall S.L.',
        type: 'Empresa mediana local (contacto red local)',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 67,
        correctDecision: 'apply',
      },
    },
    {
      id: 'portal',
      label: 'Portal',
      pos: { top: 68, left: 70 },
      scale: 0.9,
      bg: null,
      isDeadEnd: false,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué buscas en el portal?',
        choices: [
          {
            text: '"electricista"',
            correct: true,
            kampePitch: false,
            npcResponse: 'Resultados: "electricista de coches", "tienda eléctrica"... y 1 oferta real entre el ruido.',
            chatMsg: { user: 'ElectricistaPRO_99', text: '"ayudante electricista" + tu zona funciona mejor' },
            offersOffer: true,
          },
          {
            text: '"ayudante electricista Valencia"',
            correct: true,
            kampePitch: false,
            npcResponse: 'Resultados limpios. La mejor oferta aparece directamente.',
            chatMsg: { user: 'ChispaVolt', text: 'las keywords importan, así se busca' },
            offersOffer: true,
          },
        ],
      },
      secondary: [
        {
          id: 'bench_lady',
          tappableArea: { top: 65, left: 50, width: 35, height: 25 },
          exchanges: [
            {
              npcBubble: '¿Buscando trabajo en el móvil? Mi hijo hace lo mismo todo el día.',
              choices: [
                { text: 'Sí, estoy mirando ofertas de electricista', response: 'Ah, electricista. Pues mira, el del taller de ahí abajo creo que buscaba a alguien. Pero eso ya se lo dije a un chico que también hace vuestro curso, Darwin creo que se llamaba. ¿Le conoces? ... Pues eso, buen curso será, que ya vais varios por aquí buscando. Suerte, hijo.' },
                { text: 'Ignorarla y seguir buscando', response: null },
              ],
              chatMsg: { user: 'Ohm_Dulce_Ohm', text: 'esa señora te estaba dando info gratis y la has ignorado' },
            },
          ],
        },
      ],
      offer: {
        title: 'Oficial electricista 2a',
        company: 'Grupo Electra',
        type: 'Empresa grande',
        requirements: [
          { text: 'Titulación FP electricidad', met: false },
          { text: 'Experiencia 2 años', met: false },
          { text: 'Carnet B', met: false },
          { text: 'Disponibilidad', met: true },
          { text: 'Trabajo en equipo', met: true },
        ],
        matchPct: 40,
        correctDecision: 'pass',
      },
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      pos: { top: 78, left: 25 },
      scale: 0.95,
      bg: null,
      isDeadEnd: true,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué haces en el grupo?',
        choices: [
          {
            text: 'Escribir: "Busco trabajo de electricista en Valencia, ¿alguien sabe?"',
            correct: false,
            kampePitch: false,
            npcResponse: '... Silencio. Un meme. Alguien escribe "bienvenido" y nada más.',
            chatMsg: { user: 'CableMan420', text: 'en ciudad los grupos son más para memes que para curro' },
            offersOffer: false,
          },
          {
            text: 'Escuchar el audio de Milane',
            correct: false,
            kampePitch: false,
            npcResponse: '"Eh bonjour, alguien sabe dónde puedo comprar tubo corrugado por aquí? En France lo pedía online y llegaba al día siguiente, esto es otro mundo..."',
            chatMsg: { user: 'TuboMaster_3000', text: 'Milane adaptándose al sistema español, respeto' },
            offersOffer: false,
          },
          {
            text: 'Mandar un meme de electricistas',
            correct: false,
            kampePitch: false,
            npcResponse: 'Alguien responde con 😂😂😂. Otro con 👍. Nadie menciona trabajo.',
            chatMsg: { user: 'InstaladorJefe', text: 'en Valencia tira más de portales y ETTs que de WhatsApp' },
            offersOffer: false,
          },
        ],
      },
      secondary: [],
      offer: null,
    },
  ],

  rural: [
    {
      id: 'portal',
      label: 'Portal',
      pos: { top: 75, left: 18 },
      scale: 0.9,
      bg: null,
      isDeadEnd: true,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué buscas?',
        choices: [
          {
            text: '"ayudante electricista Teruel"',
            correct: false,
            kampePitch: false,
            npcResponse: 'No se han encontrado ofertas en tu zona. 1 resultado lejano: "Técnico senior — Zaragoza."',
            chatMsg: { user: 'CableMan420', text: 'en pueblo los portales no funcionan, pero hay curro por otros lados' },
            offersOffer: false,
          },
          {
            text: '"electricista" (sin zona)',
            correct: false,
            kampePitch: false,
            npcResponse: 'Ofertas de Madrid, Barcelona, Zaragoza. Nada local.',
            chatMsg: { user: 'ElectricistaPRO_99', text: 'sin filtrar sale de todo menos de aquí' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'dog',
          tappableArea: { top: 75, left: 10, width: 25, height: 18 },
          exchanges: [
            {
              npcBubble: null,
              choices: [],
              chatMsg: [
                { user: 'xX_Rookie_Xx', text: 'el perro es el único que no te pide el carnet B' },
                { user: 'Ohm_Dulce_Ohm', text: 'contratado, empieza el lunes' },
              ],
            },
          ],
        },
      ],
      offer: null,
    },
    {
      id: 'ett',
      label: 'ETT',
      pos: { top: 48, left: 72 },
      scale: 0.8,
      bg: CDN + '/bg_ett_rural_upwzmq.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: 'Hola, ¿tú no eres la de los cursos de electricidad? Pasa, pasa.',
        choices: [
          {
            text: 'Sí, estoy buscando trabajo de instaladora. Tengo prácticas verificadas con portfolio',
            correct: true,
            kampePitch: true,
            npcResponse: 'Uy, ¿portfolio verificado? Eso me gusta. Mira, los de Hermanos Gracia llevan semanas buscando. Les paso tu perfil directamente.',
            chatMsg: { user: 'InstaladorJefe', text: 'en la ETT del pueblo te conocen, eso es una ventaja enorme' },
            offersOffer: true,
          },
          {
            text: 'Sí, a ver si hay algo por aquí...',
            correct: true,
            kampePitch: false,
            npcResponse: 'Algo siempre hay, pero cuéntame bien qué buscas. ¿De qué vas exactamente? ... Mira, los de Hermanos Gracia llevan semanas buscando.',
            chatMsg: { user: 'ChispaVolt', text: 'está interesada pero le has hecho currar para sacarte la info' },
            offersOffer: true,
          },
          {
            text: 'Solo venía a dejar el CV',
            correct: false,
            kampePitch: false,
            npcResponse: 'Vale, lo dejo aquí con los demás.',
            chatMsg: { user: 'ElectricistaPRO_99', text: 'dejar el CV sin hablar es como mandar un WhatsApp sin esperar respuesta' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'nerea_mom',
          tappableArea: { top: 70, left: 5, width: 30, height: 25 },
          exchanges: [
            {
              npcBubble: 'Anda, ¿tú eres la chica nueva del BootKämp? Mi hija Nerea también lo está haciendo. No para de hablar de cables y no sé qué de secciones. A mí me suena a chino, pero ella está encantada.',
              choices: [],
              chatMsg: { user: 'CableMan420', text: 'pueblo es pueblo, aquí se sabe todo' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante instaladora — mantenimiento',
        company: 'Hermanos Gracia (vía ETT provincial)',
        type: 'Empresa familiar local',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 67,
        correctDecision: 'apply',
      },
    },
    {
      id: 'taller',
      label: 'Taller',
      pos: { top: 55, left: 20 },
      scale: 0.85,
      bg: CDN + '/bg_taller_rural_gu3hsb.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: 'Buenos días, soy electricista, acabo de terminar formación con prácticas verificadas. ¿Necesitas ayudante?',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Prácticas verificadas? Eso no lo oigo mucho. Enséñame qué has hecho.',
            chatMsg: { user: 'CableMan420', text: 'en pueblo el contacto directo es EL canal' },
            offersOffer: true,
          },
          {
            text: '¿Estáis cogiendo gente?',
            correct: true,
            kampePitch: false,
            npcResponse: 'Ahora mismo no, pero déjame el teléfono.',
            chatMsg: { user: 'InstaladorJefe', text: 'está bien pero podías haber dicho más de ti' },
            offersOffer: false,
          },
          {
            text: 'Mirar desde fuera y no entrar',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'xX_Rookie_Xx', text: 'yo la primera vez tampoco me atreví, pero hay que lanzarse' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'neighbor',
          tappableArea: { top: 8, left: 55, width: 35, height: 25 },
          exchanges: [
            {
              npcBubble: '¿Buscas a Paco? Está dentro, siempre está dentro. Lleva trabajando solo desde que se jubiló el otro. Fijo que necesita ayuda, aunque no lo diga.',
              choices: [],
              chatMsg: { user: 'InstaladorJefe', text: 'en pueblo la gente sabe quién necesita ayuda antes que el propio dueño' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante instalador — obras y mantenimiento',
        company: 'Eléctrica Villahornos (Paco)',
        type: 'Autónomo / microempresa',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Ganas de aprender', met: true },
          { text: 'Vehículo propio', met: false },
        ],
        matchPct: 75,
        correctDecision: 'apply',
      },
    },
    {
      id: 'bar',
      label: 'Bar',
      pos: { top: 40, left: 10 },
      scale: 0.75,
      bg: CDN + '/bg_bar_rural_lwpmhu.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: 'Perdona, ¿has dicho que buscan electricista?',
            correct: true,
            kampePitch: false,
            npcResponse: 'Sí, lo pusieron en el grupo del gremio. Mira, te lo paso.',
            chatMsg: { user: 'InstaladorJefe', text: 'boca a boca en pueblo mueve mucho curro' },
            offersOffer: true,
          },
          {
            text: 'No acercarte',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'ElectricistaPRO_99', text: 'ese tío estaba hablando de curro y no te has acercado' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'barman',
          tappableArea: { top: 30, left: 5, width: 30, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Qué va a ser? ¿Una caña? Aquí todo el mundo acaba hablando de trabajo. El otro día vino un chaval, Darwin, que también está haciendo vuestro curso ese del BootKämp. Preguntó por fontanería, le dije que aquí lo que hay es de electricista. Se quedó desayunando igualmente, buen chaval.',
              choices: [],
              chatMsg: { user: 'ChispaVolt', text: 'Darwin anda buscando también, qué crack' },
            },
          ],
        },
        {
          id: 'old_man',
          tappableArea: { top: 40, left: 62, width: 30, height: 35 },
          exchanges: [
            {
              npcBubble: '¿Tú eres nueva por aquí?',
              choices: [
                { text: 'Sí, estoy buscando trabajo de electricista', response: 'Electricista, ¿eh? Yo en mis tiempos no teníamos ni portales ni ETTs. Llamabas a la puerta y listo. Eso sí, ahora hay más trabajo que nunca, lo que pasa es que la gente no sabe buscarlo. ... Oye, ¿y sabes algo de enchufes? Que tengo uno en casa que hace chispas.' },
                { text: 'De aquí de toda la vida, pero buscando curro', response: 'Pues con lo que están montando en la nave nueva, seguro que sale algo. Aquí en Villahornos siempre ha habido curro para quien sabe buscarlo. Lo que pasa es que no sale en el Google ese.' },
              ],
              chatMsg: { user: 'InstaladorJefe', text: 'este señor sabe de lo que habla' },
            },
          ],
        },
      ],
      offer: {
        title: 'Electricista para instalación nave industrial',
        company: 'Construcciones Pérez (subcontrata)',
        type: 'Empresa mediana comarcal',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Experiencia previa', met: false },
          { text: 'Carnet B', met: false },
          { text: 'Botas de seguridad', met: true },
        ],
        matchPct: 60,
        correctDecision: 'apply',
      },
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      pos: { top: 78, left: 70 },
      scale: 0.95,
      bg: null,
      isDeadEnd: false,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué haces?',
        choices: [
          {
            text: 'Llamar: "Buenos días, soy instaladora eléctrica. Tengo portfolio verificado, ¿puedo mandároslo?"',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Portfolio verificado? Sí, mándalo. Y pásate mañana si puedes, estamos justos de personal.',
            chatMsg: { user: 'CableMan420', text: 'llamar en frío funciona en pueblo' },
            offersOffer: true,
          },
          {
            text: 'Llamar: "Hola, eh... ¿tenéis trabajo?"',
            correct: false,
            kampePitch: false,
            npcResponse: '¿De qué? ... Mira, llámanos cuando sepas lo que buscas.',
            chatMsg: { user: 'InstaladorJefe', text: 'nombre + oficio + qué ofreces, en los primeros 10 segundos' },
            offersOffer: false,
          },
          {
            text: 'Buscar en Google Maps pero no llamar',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: [
              { user: 'xX_Rookie_Xx', text: 'la empresa está ahí, el número está ahí, ¿qué más necesitas?' },
              { user: 'ChispaVolt', text: 'yo también tardo en llamar, pero hay que hacerlo' },
            ],
            offersOffer: false,
          },
        ],
      },
      secondary: [],
      offer: {
        title: 'Ayudante electricista — mantenimiento comarcal',
        company: 'Electricidad Comarcal',
        type: 'Empresa pequeña local',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 67,
        correctDecision: 'apply',
      },
    },
  ],
};

// === BADGES ===
const BADGES = [
  { id: 'buscador_activo', icon: '🔍', label: 'Buscador Activo', desc: 'Visita las 5 localizaciones' },
  { id: 'canal_portal', icon: '💻', label: 'Canal Portal', desc: 'Encuentra oferta por portal' },
  { id: 'canal_ett', icon: '🏢', label: 'Canal ETT', desc: 'Encuentra oferta por ETT' },
  { id: 'contacto_directo', icon: '🚪', label: 'Contacto Directo', desc: 'Encuentra oferta por contacto directo' },
  { id: 'red_local', icon: '💬', label: 'Red Local', desc: 'Encuentra oferta por red local' },
  { id: 'pitch_kampe', icon: '📋', label: 'Pitch Kampe', desc: 'Menciona portfolio verificado' },
  { id: 'regla_60', icon: '✅', label: 'Regla del 60%', desc: 'Envía candidatura con >=60% ajuste' },
  { id: 'lectura_critica', icon: '👁', label: 'Lectura Critica', desc: 'Pasa correctamente oferta <60%' },
  { id: 'primera_candidatura', icon: '✉️', label: 'Primera Candidatura', desc: 'Envía tu primera candidatura' },
  { id: 'no_hay_curro', icon: '🗺', label: 'No Hay Curro? Si Lo Hay', desc: 'Encuentra 3+ ofertas en zona rural', ruralOnly: true },
];

const CHANNEL_BADGES = {
  portal: 'canal_portal',
  ett: 'canal_ett',
  taller: 'contacto_directo',
  bar: 'red_local',
  telefono: 'contacto_directo',
};

function startAmbientChat() {
  stopAmbientChat();
  const allMessages = [...AMBIENT_MESSAGES, ...(ZONE_AMBIENT[S.zone] || [])];
  let lastIdx = -1;
  ambientTimer = setInterval(() => {
    let idx;
    do { idx = Math.floor(Math.random() * allMessages.length); } while (idx === lastIdx && allMessages.length > 1);
    lastIdx = idx;
    const msg = allMessages[idx];
    addChatMessage(msg.text, msg.user);
  }, 10000 + Math.random() * 8000);
}

function stopAmbientChat() {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
}

// === TASK 4: Location Engine — Dialogue System ===

function enterLocation(loc) {
  S.currentLocation = loc;
  var locState = S.locations[loc.id];
  if (locState.state === 'available') locState.state = 'entered';

  var locBg = document.getElementById('loc-bg');
  if (loc.isPhoneUI) {
    locBg.style.display = 'none';
    showPhoneUI(loc);
  } else {
    locBg.style.display = '';
    locBg.src = loc.bg;
    hidePhoneUI();
  }

  var char = CHARACTERS[S.zone];
  document.getElementById('loc-avatar').src = char.happy;
  clearDialogue();
  showScreen('location');
  buildSecondaryNPCs(loc);
  // Always show back button — player can leave anytime
  showBackButton();

  if (!locState.mainDone) {
    startMainDialogue(loc);
  }
}

var activeTypewriters = [];

function clearDialogue() {
  // Cancel any running typewriter animations
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

// Auto-dismiss bubble after a delay based on text length
// ~60ms per character reading time, min 3s, max 10s
function autoDismissBubble(element, text) {
  var readTime = Math.max(3000, Math.min(10000, text.length * 60));
  var timer = setTimeout(function() {
    dismissBubble(element);
  }, readTime);
  // Store timer so tap-to-dismiss can cancel it
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

// Tap anywhere on the scene to dismiss visible bubbles
function dismissAllBubbles() {
  var npc = document.getElementById('npc-bubble');
  var player = document.getElementById('player-bubble');
  if (npc && !npc.classList.contains('hidden')) dismissBubble(npc);
  if (player && !player.classList.contains('hidden')) dismissBubble(player);
}

function typewriter(element, text, speed, callback) {
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
      // Schedule auto-dismiss
      autoDismissBubble(element, text);
      if (callback) setTimeout(callback, 500);
    }
  }, speed);
  activeTypewriters.push(interval);
  return interval;
}

function startMainDialogue(loc) {
  var main = loc.main;
  if (main.npcBubble) {
    var npcBubble = document.getElementById('npc-bubble');
    typewriter(npcBubble, main.npcBubble, 30, function() {
      showChoices(main.choices, loc);
    });
  } else {
    showChoices(main.choices, loc);
  }
}

function showChoices(choices, loc) {
  var container = document.getElementById('choice-buttons');
  container.innerHTML = '';
  container.classList.remove('hidden');
  choices.forEach(function(choice, idx) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', function() { onChoiceTap(choice, loc); });
    container.appendChild(btn);
  });
}

function onChoiceTap(choice, loc) {
  vibrate('light');
  var locState = S.locations[loc.id];
  var container = document.getElementById('choice-buttons');

  if (loc.isDeadEnd) {
    // Dead-end locations are flavor — disable tapped, keep others
    var buttons = container.querySelectorAll('.choice-btn');
    buttons.forEach(function(btn) {
      if (btn.textContent === choice.text) {
        btn.disabled = true;
        btn.style.opacity = '0.35';
        btn.style.pointerEvents = 'none';
      }
    });
    // Track how many used
    if (!locState._choicesMade) locState._choicesMade = 0;
    locState._choicesMade++;
    if (locState._choicesMade >= loc.main.choices.length) {
      locState.mainDone = true;
      container.classList.add('hidden');
    }
  } else {
    // Real locations — ONE shot, first impression matters
    locState.mainDone = true;
    container.classList.add('hidden');
  }

  var playerBubble = document.getElementById('player-bubble');
  typewriter(playerBubble, choice.text, 25, function() {
    setTimeout(function() {
      if (choice.npcResponse) {
        var npcBubble = document.getElementById('npc-bubble');
        npcBubble.textContent = '';
        typewriter(npcBubble, choice.npcResponse, 30, function() {
          afterMainResponse(choice, loc);
        });
      } else {
        afterMainResponse(choice, loc);
      }
    }, 500);
  });
}

function afterMainResponse(choice, loc) {
  var locState = S.locations[loc.id];
  var char = CHARACTERS[S.zone];

  // Chat overlay feedback
  setTimeout(function() {
    var msgs = Array.isArray(choice.chatMsg) ? choice.chatMsg : [choice.chatMsg];
    msgs.forEach(function(msg, i) {
      setTimeout(function() { addChatMessage(msg.text, msg.user); }, i * 600);
    });
  }, 800);

  // Kampe pitch
  if (choice.kampePitch) {
    S.kampePitchCount++;
    earnBadge('pitch_kampe');
  }

  // Offer found
  if (choice.offersOffer && loc.offer) {
    locState.offerFound = true;
    S.offersFound++;
    S.score += 25;
    updateStats();
    document.getElementById('loc-avatar').src = char.celebrating;
    vibrate('success');

    var channelBadge = CHANNEL_BADGES[loc.id];
    if (channelBadge) earnBadge(channelBadge);

    if (!S.firstOfferFound) {
      S.firstOfferFound = true;
    }

    // Beat before showing offer — let the NPC response sink in
    setTimeout(function() {
      addChatMessage('Mira, hay algo. Vamos a ver si me encaja.', char.name, false);
    }, 1500);

    setTimeout(function() { showOfferCard(loc.offer); }, 3000);
  } else {
    if (!choice.correct) {
      document.getElementById('loc-avatar').src = char.worried;
      vibrate('error');
      setTimeout(function() {
        document.getElementById('loc-avatar').src = char.happy;
      }, 1500);
    }
    locState.state = 'completed';
  }
}

function showBackButton() {
  document.getElementById('btn-back').classList.remove('hidden');
}

// === Secondary NPCs ===

function buildSecondaryNPCs(loc) {
  document.querySelectorAll('.secondary-tap').forEach(function(el) { el.remove(); });
  var locScene = document.getElementById('loc-scene');
  var locState = S.locations[loc.id];

  loc.secondary.forEach(function(sec) {
    if (locState.secondaryDone[sec.id]) return;
    var tap = document.createElement('div');
    tap.className = 'secondary-tap';
    tap.style.position = 'absolute';
    tap.style.top = sec.tappableArea.top + '%';
    tap.style.left = sec.tappableArea.left + '%';
    tap.style.width = sec.tappableArea.width + '%';
    tap.style.height = sec.tappableArea.height + '%';
    tap.style.zIndex = '15';
    tap.style.cursor = 'pointer';
    tap.style.borderRadius = '8px';
    // No visible border — tappable areas are discoverable by exploration
    tap.addEventListener('click', function() {
      locState.secondaryDone[sec.id] = true;
      tap.remove();
      playSecondaryExchange(sec);
    });
    locScene.appendChild(tap);
  });
}

function restoreMainChoices() {
  // If main dialogue hasn't been done, re-show the choices
  if (!S.currentLocation) return;
  var locState = S.locations[S.currentLocation.id];
  if (!locState.mainDone) {
    showChoices(S.currentLocation.main.choices, S.currentLocation);
  }
}

function playSecondaryExchange(sec) {
  var exchange = sec.exchanges[0];
  if (!exchange) return;

  // Hide main choices while secondary plays
  document.getElementById('choice-buttons').classList.add('hidden');

  // Chat-only interaction (cat, dog, etc.)
  if (!exchange.npcBubble && (!exchange.choices || exchange.choices.length === 0)) {
    var msgs = Array.isArray(exchange.chatMsg) ? exchange.chatMsg : [exchange.chatMsg];
    msgs.forEach(function(msg, i) {
      setTimeout(function() { addChatMessage(msg.text, msg.user); }, i * 600);
    });
    // Restore main choices after a beat
    setTimeout(restoreMainChoices, 1000);
    return;
  }

  var npcBubble = document.getElementById('npc-bubble');
  npcBubble.textContent = '';

  if (exchange.npcBubble) {
    typewriter(npcBubble, exchange.npcBubble, 30, function() {
      if (exchange.choices && exchange.choices.length > 0) {
        showSecondaryChoices(exchange);
      } else {
        // No choices — just flavor bubble + chat
        var msgs = Array.isArray(exchange.chatMsg) ? exchange.chatMsg : [exchange.chatMsg];
        msgs.forEach(function(msg, i) {
          setTimeout(function() { addChatMessage(msg.text, msg.user); }, 800 + i * 600);
        });
        // Restore main choices after the exchange
        setTimeout(restoreMainChoices, 2000);
      }
    });
  }
}

function showSecondaryChoices(exchange) {
  var container = document.getElementById('choice-buttons');
  container.innerHTML = '';
  container.classList.remove('hidden');
  exchange.choices.forEach(function(choice) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', function() {
      vibrate('light');
      container.classList.add('hidden');
      var playerBubble = document.getElementById('player-bubble');
      typewriter(playerBubble, choice.text, 25, function() {
        if (choice.response) {
          var npcBubble = document.getElementById('npc-bubble');
          npcBubble.textContent = '';
          typewriter(npcBubble, choice.response, 30);
        }
        var msgs = Array.isArray(exchange.chatMsg) ? exchange.chatMsg : [exchange.chatMsg];
        setTimeout(function() {
          msgs.forEach(function(msg, i) {
            setTimeout(function() { addChatMessage(msg.text, msg.user); }, i * 600);
          });
        }, 800);
        // Restore main choices after secondary resolves
        setTimeout(restoreMainChoices, 2000);
      });
    });
    container.appendChild(btn);
  });
}

// === Phone UI helpers ===

function showPhoneUI(loc) {
  document.getElementById('loc-scene').classList.add('phone-active');
  var phoneUI = document.getElementById('phone-ui');
  if (!phoneUI) {
    phoneUI = document.createElement('div');
    phoneUI.id = 'phone-ui';
    phoneUI.className = 'phone-ui';
    document.getElementById('loc-scene').appendChild(phoneUI);
  }
  phoneUI.classList.remove('hidden');

  if (loc.id === 'portal') {
    phoneUI.innerHTML = '' +
      '<div style="background:#fff;border-radius:12px;overflow:hidden;height:100%;display:flex;flex-direction:column;">' +
        // Top nav bar
        '<div style="background:#ff6b35;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="color:#fff;font-family:var(--font-title);font-size:18px;font-weight:700;">InfoCurros</span>' +
          '<span style="color:rgba(255,255,255,0.8);font-size:11px;">Tu primer empleo</span>' +
        '</div>' +
        // Search bar
        '<div style="padding:10px 12px;background:#f5f5f5;border-bottom:1px solid #e0e0e0;">' +
          '<div style="background:#fff;border:1px solid #ddd;border-radius:20px;padding:8px 14px;display:flex;align-items:center;gap:8px;">' +
            '<span style="color:#999;">🔍</span>' +
            '<span style="color:#999;font-size:14px;">Buscar empleo...</span>' +
          '</div>' +
        '</div>' +
        // Filters
        '<div style="padding:8px 12px;display:flex;gap:6px;border-bottom:1px solid #eee;">' +
          '<span style="background:#ff6b35;color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;">Electricidad</span>' +
          '<span style="background:#eee;color:#666;padding:4px 10px;border-radius:12px;font-size:11px;">Mi zona</span>' +
          '<span style="background:#eee;color:#666;padding:4px 10px;border-radius:12px;font-size:11px;">Hoy</span>' +
        '</div>' +
        // Job listings placeholder
        '<div style="flex:1;padding:12px;overflow-y:auto;">' +
          '<p style="color:#999;font-size:13px;text-align:center;margin-top:30px;">Escribe lo que buscas para ver resultados</p>' +
          // Fake listing skeletons
          '<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">' +
            '<div style="background:#f0f0f0;border-radius:8px;padding:12px;">' +
              '<div style="background:#e0e0e0;height:14px;width:70%;border-radius:4px;margin-bottom:6px;"></div>' +
              '<div style="background:#e0e0e0;height:10px;width:50%;border-radius:4px;margin-bottom:4px;"></div>' +
              '<div style="background:#e0e0e0;height:10px;width:40%;border-radius:4px;"></div>' +
            '</div>' +
            '<div style="background:#f0f0f0;border-radius:8px;padding:12px;">' +
              '<div style="background:#e0e0e0;height:14px;width:60%;border-radius:4px;margin-bottom:6px;"></div>' +
              '<div style="background:#e0e0e0;height:10px;width:45%;border-radius:4px;margin-bottom:4px;"></div>' +
              '<div style="background:#e0e0e0;height:10px;width:35%;border-radius:4px;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Bottom nav
        '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid #eee;background:#fafafa;">' +
          '<span style="font-size:10px;color:#ff6b35;text-align:center;">🏠<br>Inicio</span>' +
          '<span style="font-size:10px;color:#999;text-align:center;">🔍<br>Buscar</span>' +
          '<span style="font-size:10px;color:#999;text-align:center;">💼<br>Mis ofertas</span>' +
          '<span style="font-size:10px;color:#999;text-align:center;">👤<br>Perfil</span>' +
        '</div>' +
      '</div>';
  } else if (loc.id === 'whatsapp') {
    phoneUI.innerHTML = '' +
      '<div style="background:#111b21;border-radius:12px;overflow:hidden;height:100%;display:flex;flex-direction:column;">' +
        // WhatsApp header
        '<div style="background:#1f2c34;padding:10px 12px;display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:16px;">←</span>' +
          '<div style="width:36px;height:36px;border-radius:50%;background:#2a3942;display:flex;align-items:center;justify-content:center;font-size:16px;">⚡</div>' +
          '<div style="flex:1;">' +
            '<div style="color:#e9edef;font-size:14px;font-weight:600;">Electricistas Valencia 🔌</div>' +
            '<div style="color:#8696a0;font-size:11px;">247 miembros · 12 en línea</div>' +
          '</div>' +
        '</div>' +
        // Chat area
        '<div style="flex:1;background:#0b141a;background-image:url(\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect fill=%22%230d1a22%22 width=%2240%22 height=%2240%22/></svg>\');padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">' +
          // Timestamp
          '<div style="align-self:center;background:#1d2831;color:#8696a0;font-size:10px;padding:3px 10px;border-radius:6px;">Hoy, 10:32</div>' +
          // Left bubble — Juan
          '<div style="align-self:flex-start;max-width:78%;">' +
            '<div style="background:#1f2c34;border-radius:0 8px 8px 8px;padding:5px 8px;">' +
              '<span style="color:#53bdeb;font-size:11px;font-weight:600;">Juan_Elec</span>' +
              '<div style="color:#e9edef;font-size:13px;margin-top:2px;">😂😂😂😂</div>' +
              '<div style="color:#8696a0;font-size:9px;text-align:right;margin-top:2px;">10:32</div>' +
            '</div>' +
          '</div>' +
          // Left bubble — Milane audio
          '<div style="align-self:flex-start;max-width:78%;">' +
            '<div style="background:#1f2c34;border-radius:0 8px 8px 8px;padding:5px 8px;">' +
              '<span style="color:#ff9500;font-size:11px;font-weight:600;">Milane 🇫🇷</span>' +
              '<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">' +
                '<span style="color:#53bdeb;font-size:16px;">▶</span>' +
                '<div style="flex:1;height:3px;background:#374045;border-radius:2px;"><div style="width:35%;height:100%;background:#53bdeb;border-radius:2px;"></div></div>' +
                '<span style="color:#8696a0;font-size:10px;">0:47</span>' +
              '</div>' +
              '<div style="color:#8696a0;font-size:9px;text-align:right;margin-top:2px;">10:34</div>' +
            '</div>' +
          '</div>' +
          // Left bubble — Carlos
          '<div style="align-self:flex-start;max-width:78%;">' +
            '<div style="background:#1f2c34;border-radius:0 8px 8px 8px;padding:5px 8px;">' +
              '<span style="color:#e667af;font-size:11px;font-weight:600;">Carlos_Instala</span>' +
              '<div style="color:#e9edef;font-size:13px;margin-top:2px;">Alguien vende taladro Bosch? El mío ha muerto hoy 💀</div>' +
              '<div style="color:#8696a0;font-size:9px;text-align:right;margin-top:2px;">10:38</div>' +
            '</div>' +
          '</div>' +
          // Left bubble — Pedro (image placeholder)
          '<div style="align-self:flex-start;max-width:78%;">' +
            '<div style="background:#1f2c34;border-radius:0 8px 8px 8px;padding:5px 8px;">' +
              '<span style="color:#7eb8e1;font-size:11px;font-weight:600;">Pedro_ETT</span>' +
              '<div style="background:#2a3942;border-radius:6px;padding:20px;text-align:center;margin-top:3px;">' +
                '<span style="font-size:28px;">🤣</span>' +
                '<div style="color:#8696a0;font-size:10px;margin-top:4px;">[meme]</div>' +
              '</div>' +
              '<div style="color:#8696a0;font-size:9px;text-align:right;margin-top:2px;">10:41</div>' +
            '</div>' +
          '</div>' +
          // Left bubble — random
          '<div style="align-self:flex-start;max-width:78%;">' +
            '<div style="background:#1f2c34;border-radius:0 8px 8px 8px;padding:5px 8px;">' +
              '<span style="color:#53bdeb;font-size:11px;font-weight:600;">Juan_Elec</span>' +
              '<div style="color:#e9edef;font-size:13px;margin-top:2px;">Que alguien le diga a Pedro que esto es un grupo de curro no de memes 😅</div>' +
              '<div style="color:#8696a0;font-size:9px;text-align:right;margin-top:2px;">10:42</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Input bar
        '<div style="background:#1f2c34;padding:6px 10px;display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:18px;">😊</span>' +
          '<div style="flex:1;background:#2a3942;border-radius:20px;padding:7px 14px;color:#8696a0;font-size:13px;">Escribe un mensaje</div>' +
          '<span style="font-size:18px;">🎤</span>' +
        '</div>' +
      '</div>';
  } else if (loc.id === 'telefono') {
    phoneUI.innerHTML = '<div class="phone-header">Google Maps — Empresas cercanas</div><div class="phone-content"><div style="background:var(--panel);padding:12px;border-radius:8px;margin-bottom:8px;"><strong style="color:var(--white);">📍 Electricidad Comarcal</strong><p style="font-size:11px;margin-top:4px;">Carretera de Teruel, km 3 · ⭐ 4.2</p><p style="font-size:11px;color:var(--green);">📞 978 XX XX XX</p></div></div>';
  }
}

function hidePhoneUI() {
  document.getElementById('loc-scene').classList.remove('phone-active');
  var phoneUI = document.getElementById('phone-ui');
  if (phoneUI) phoneUI.classList.add('hidden');
}

// === TASK 5: Offer Evaluation ===

function showOfferCard(offer) {
  // Hide bubbles so they don't bleed through the overlay
  document.getElementById('npc-bubble').classList.add('hidden');
  document.getElementById('player-bubble').classList.add('hidden');
  document.querySelector('.offer-title').textContent = offer.title;
  document.querySelector('.offer-company').textContent = offer.company + ' · ' + offer.type;

  var reqContainer = document.querySelector('.offer-requirements');
  reqContainer.innerHTML = '';
  offer.requirements.forEach(function(req) {
    var item = document.createElement('div');
    item.className = 'req-item ' + (req.met ? 'req-met' : 'req-not');
    item.innerHTML = '<span>' + (req.met ? '✅' : '❌') + '</span> <span>' + req.text + '</span>';
    reqContainer.appendChild(item);
  });

  var fill = document.querySelector('.match-fill');
  var pct = document.querySelector('.match-pct');
  fill.style.width = '0%';
  fill.style.background = offer.matchPct >= 60 ? 'var(--green)' : 'var(--red)';
  pct.textContent = offer.matchPct + '%';
  pct.style.color = offer.matchPct >= 60 ? 'var(--green)' : 'var(--red)';
  setTimeout(function() { fill.style.width = offer.matchPct + '%'; }, 100);

  S._currentOffer = offer;
  showOverlay('offer-overlay');
}

function onApply() {
  var offer = S._currentOffer;
  if (!offer) return;
  S._currentOffer = null;
  hideOverlay('offer-overlay');

  var locState = S.locations[S.currentLocation.id];
  locState.offerHandled = true;
  locState.state = 'completed';
  var char = CHARACTERS[S.zone];
  var metCount = offer.requirements.filter(function(r) { return r.met; }).length;
  var totalCount = offer.requirements.length;

  S.candidaturesSent++;
  updateStats();

  if (offer.matchPct >= 60) {
    // Good decision — educate why
    S.score += 50;
    earnBadge('regla_60');
    vibrate('success');
    document.getElementById('loc-avatar').src = char.celebrating;

    // NPC bubble with educational feedback
    var npcBubble = document.getElementById('npc-bubble');
    npcBubble.classList.remove('hidden');
    npcBubble.textContent = '';
    typewriter(npcBubble, 'Cumples ' + metCount + ' de ' + totalCount + ' requisitos (' + offer.matchPct + '%). Buena decisión enviar.', 30);

    // Chat reinforcement
    setTimeout(function() {
      addChatMessage('cumple el 60% y ha enviado, así se hace', 'InstaladorJefe');
    }, 1500);

    if (!S.firstCandidatureSent) {
      S.firstCandidatureSent = true;
      earnBadge('primera_candidatura');
      setTimeout(function() {
        addChatMessage('Enviada. La primera. Ya no vale eso de que no he buscado.', char.name, false);
      }, 2500);
    }

  } else {
    // Sent but didn't meet 60% — still counts but educate
    S.score += 25;
    vibrate('light');
    document.getElementById('loc-avatar').src = char.happy;

    var npcBubble = document.getElementById('npc-bubble');
    npcBubble.classList.remove('hidden');
    npcBubble.textContent = '';
    typewriter(npcBubble, 'Solo cumples ' + metCount + ' de ' + totalCount + ' requisitos (' + offer.matchPct + '%). Has enviado, pero las opciones con más ajuste tienen más posibilidades.', 30);

    setTimeout(function() {
      addChatMessage('no pasa nada por enviar, pero céntrate en ofertas donde encajes más', 'ElectricistaPRO_99');
    }, 1500);

    if (!S.firstCandidatureSent) {
      S.firstCandidatureSent = true;
      earnBadge('primera_candidatura');
    }
  }

  checkTaskCompleted();
}

function onPass() {
  var offer = S._currentOffer;
  if (!offer) return;
  S._currentOffer = null;
  hideOverlay('offer-overlay');

  var locState = S.locations[S.currentLocation.id];
  locState.offerHandled = true;
  var char = CHARACTERS[S.zone];
  var metCount = offer.requirements.filter(function(r) { return r.met; }).length;
  var totalCount = offer.requirements.length;

  if (offer.matchPct >= 60) {
    // Bad pass — blocking toast (already good, keep as is)
    vibrate('error');
    document.getElementById('loc-avatar').src = char.worried;
    document.getElementById('toast-text').textContent =
      'Cumples ' + metCount + ' de ' + totalCount + ' requisitos obligatorios (' + offer.matchPct + '%). La regla: si llegas al 60%, se envía. No esperes al 100%.';
    showOverlay('toast-overlay');
  } else {
    // Good pass — educate why this was smart
    locState.state = 'completed';
    S.score += 25;
    earnBadge('lectura_critica');
    vibrate('light');
    document.getElementById('loc-avatar').src = char.happy;

    // NPC bubble with educational feedback
    var npcBubble = document.getElementById('npc-bubble');
    npcBubble.classList.remove('hidden');
    npcBubble.textContent = '';
    typewriter(npcBubble, 'Solo cumples ' + metCount + ' de ' + totalCount + ' requisitos (' + offer.matchPct + '%). Bien visto, mejor buscar ofertas que encajen más.', 30);

    setTimeout(function() {
      addChatMessage('bien visto, no pierdas tiempo en ofertas donde no encajas', 'CableMan420');
    }, 1500);
  }
}

// === TASK 6: Scoring + Badges ===

var badgeQueue = [];
var badgeShowing = false;

function earnBadge(badgeId) {
  if (S.badges[badgeId]) return;
  S.badges[badgeId] = true;
  var badge = BADGES.find(function(b) { return b.id === badgeId; });
  if (!badge) return;
  vibrate('medium');
  // Queue the banner (multiple badges can fire at once)
  badgeQueue.push(badge);
  if (!badgeShowing) showNextBadgeBanner();
}

function showNextBadgeBanner() {
  if (badgeQueue.length === 0) { badgeShowing = false; return; }
  badgeShowing = true;
  var badge = badgeQueue.shift();
  var char = CHARACTERS[S.zone];

  // Also add to chat
  addChatMessage('🏆 ' + char.name + ' desbloqueó: ' + badge.label, null, true);

  // Create banner
  var banner = document.createElement('div');
  banner.className = 'badge-banner';
  banner.innerHTML = '<span class="badge-banner-icon">' + badge.icon + '</span>' +
    '<div class="badge-banner-text">' +
      '<span class="badge-banner-title">Badge desbloqueado</span>' +
      '<span class="badge-banner-label">' + badge.label + '</span>' +
    '</div>';
  document.getElementById('wrapper').appendChild(banner);

  // Slide in
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      banner.classList.add('badge-banner-in');
    });
  });

  // Slide out after 2.5s, then show next
  setTimeout(function() {
    banner.classList.remove('badge-banner-in');
    banner.classList.add('badge-banner-out');
    setTimeout(function() {
      banner.remove();
      showNextBadgeBanner();
    }, 500);
  }, 2500);
}

function checkAllBadges() {
  var locs = LOCATIONS[S.zone];
  var allVisited = locs.every(function(l) { return S.locations[l.id].state !== 'available'; });
  if (allVisited) earnBadge('buscador_activo');
  if (S.zone === 'rural' && S.offersFound >= 3) earnBadge('no_hay_curro');
}

function checkTaskCompleted() {
  if (S.taskCompleted) return;
  // Task completes when all locations in the zone have been visited
  var locs = LOCATIONS[S.zone];
  var allDone = locs.every(function(l) { return S.locations[l.id].state !== 'available'; });
  if (allDone) {
    S.taskCompleted = true;
    fireTaskCompleted();
    addChatMessage('🏆 TAREA COMPLETADA — Has visitado todos los sitios', null, true);
    vibrate('success', [0, 100, 50, 200]);
  }
}

// === TASK 7: Results Screen ===

function endMorning() {
  var visitedCount = 0;
  var keys = Object.keys(S.locations);
  for (var i = 0; i < keys.length; i++) {
    if (S.locations[keys[i]].state !== 'available') visitedCount++;
  }

  if (visitedCount < 2) {
    addChatMessage('tío aún no has mirado ni la mitad de sitios', 'InstaladorJefe');
    showOverlay('confirm-overlay');
    return;
  }

  if (visitedCount < 5) {
    showOverlay('confirm-overlay');
    return;
  }

  goToResults();
}

function goToResults() {
  stopAmbientChat();
  checkAllBadges();
  saveRecord(S.score);
  showScreen('results');
  populateResults();
}

function populateResults() {
  var char = CHARACTERS[S.zone];

  // Avatar state
  var avatarImg = document.getElementById('results-avatar');
  if (S.candidaturesSent >= 2) {
    avatarImg.src = char.celebrating;
  } else if (S.candidaturesSent >= 1) {
    avatarImg.src = char.happy;
  } else {
    avatarImg.src = char.worried;
  }

  // Stats with staggered reveal
  var statsContainer = document.getElementById('results-stats');
  statsContainer.innerHTML = '';
  var stats = [
    'Ofertas encontradas: ' + S.offersFound + '/4',
    'Candidaturas enviadas: ' + S.candidaturesSent,
    'Pitch Kampe: ' + S.kampePitchCount + ' veces',
    'Puntuación: ' + S.score + ' pts',
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

  // Badges with staggered pop-in
  var badgesContainer = document.getElementById('results-badges');
  badgesContainer.innerHTML = '';
  var delayBase = 400 + stats.length * 400 + 400;
  var badgeIndex = 0;
  BADGES.forEach(function(badge) {
    if (badge.ruralOnly && S.zone !== 'rural') return;
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

  // Missed opportunities
  var missedContainer = document.getElementById('results-missed');
  missedContainer.innerHTML = '';
  var locs = LOCATIONS[S.zone];
  var missed = locs.filter(function(l) {
    return !l.isDeadEnd && l.offer && !S.locations[l.id].offerFound;
  });
  if (missed.length > 0) {
    var h4 = document.createElement('h4');
    h4.textContent = 'Oportunidades perdidas:';
    missedContainer.appendChild(h4);
    missed.forEach(function(loc) {
      var p = document.createElement('p');
      p.textContent = 'En ' + loc.label.toLowerCase() + ' había una oferta de "' + loc.offer.title + '". La próxima vez, prueba otro enfoque.';
      missedContainer.appendChild(p);
    });
  }

  // Result message in chat
  var totalBadgeCount = badgeIndex;
  var msgDelay = delayBase + totalBadgeCount * 200 + 400;
  setTimeout(function() {
    var msg;
    if (S.score >= 250) {
      msg = S.zone === 'urban'
        ? 'Tres candidaturas en una mañana. No está mal para ser martes.'
        : 'Decían que aquí no había curro. Pues mira.';
    } else if (S.score >= TASK_THRESHOLD) {
      msg = S.zone === 'urban'
        ? 'Algo he sacado. La próxima vez pregunto más.'
        : 'Hay más de lo que creía. La próxima vez entro en todos los sitios.';
    } else {
      msg = S.zone === 'urban'
        ? 'Me ha faltado atreverme. Mañana vuelvo y hablo con más gente.'
        : 'El curro estaba ahí pero no lo he encontrado. Tengo que buscar de otra forma.';
    }
    addChatMessage(msg, char.name, false);
  }, msgDelay);

  // Other server button
  var otherBtn = document.getElementById('btn-other-server');
  if (!S.otherZonePlayed) {
    otherBtn.classList.remove('hidden');
    otherBtn.textContent = 'Conectar a otro servidor';
  } else {
    otherBtn.classList.add('hidden');
  }
}

// --- Event listeners ---
document.addEventListener('DOMContentLoaded', function() {
  // Title → Server Select
  document.getElementById('btn-play').addEventListener('click', function() {
    vibrate('light');
    showScreen('server-select');
  });

  // Server Select → Street
  document.querySelectorAll('.server-card').forEach(function(card) {
    card.addEventListener('click', function() {
      if (card.classList.contains('server-offline')) {
        vibrate('light');
        // Show toast message for locked servers
        document.getElementById('toast-text').textContent =
          'Este servidor se desbloquea por la tarde. Primero hay que aprender a encontrar ofertas.';
        document.querySelector('#toast-card h3').textContent = 'Servidor offline';
        showOverlay('toast-overlay');
        return;
      }
      vibrate('light');
      initZone(card.dataset.zone);
    });
  });

  // End morning
  document.getElementById('btn-end-morning').addEventListener('click', function() {
    vibrate('light');
    endMorning();
  });

  document.getElementById('btn-confirm-end').addEventListener('click', function() {
    hideOverlay('confirm-overlay');
    goToResults();
  });

  document.getElementById('btn-cancel-end').addEventListener('click', function() {
    hideOverlay('confirm-overlay');
  });

  // Tap scene to dismiss bubbles
  document.getElementById('loc-scene').addEventListener('click', function(e) {
    // Only dismiss if tapping the scene itself, not a secondary NPC or phone UI
    if (e.target.closest('.secondary-tap') || e.target.closest('.phone-ui')) return;
    dismissAllBubbles();
  });

  // Back to street from location
  document.getElementById('btn-back').addEventListener('click', function() {
    vibrate('light');
    if (S.currentLocation) {
      updateMarkerState(S.currentLocation.id);
    }
    hidePhoneUI();
    showScreen('street');
    checkTaskCompleted();

    // Check if all locations completed
    var allDone = true;
    var keys = Object.keys(S.locations);
    for (var i = 0; i < keys.length; i++) {
      if (S.locations[keys[i]].state !== 'completed') { allDone = false; break; }
    }
    if (allDone) {
      var char = CHARACTERS[S.zone];
      setTimeout(function() {
        addChatMessage('Ya he mirado por todos lados. Vamos a ver qué tal ha ido.', char.name, false);
        setTimeout(goToResults, 2000);
      }, 500);
    }
  });

  // Offer card actions
  document.getElementById('btn-apply').addEventListener('click', function() {
    onApply();
  });

  document.getElementById('btn-pass').addEventListener('click', function() {
    onPass();
  });

  // Toast dismiss
  document.getElementById('btn-understood').addEventListener('click', function() {
    vibrate('light');
    hideOverlay('toast-overlay');
    var char = CHARACTERS[S.zone];
    document.getElementById('loc-avatar').src = char.happy;
    addChatMessage('recuerda la regla del 60%, no esperes al 100%', 'InstaladorJefe');
    // Now mark location completed and show back button (deferred from onPass)
    if (S.currentLocation) {
      S.locations[S.currentLocation.id].state = 'completed';
    }
    showBackButton();
  });

  // Results actions
  document.getElementById('btn-other-server').addEventListener('click', function() {
    vibrate('light');
    S.otherZonePlayed = true;
    showScreen('server-select');
  });

  document.getElementById('btn-replay').addEventListener('click', function() {
    vibrate('light');
    initZone(S.zone);
  });

  document.getElementById('btn-exit').addEventListener('click', function() {
    vibrate('light');
    showScreen('title');
  });

  // Player count animation on title screen
  var playerCountEl = document.getElementById('player-count');
  setInterval(function() {
    var base = 800 + Math.floor(Math.random() * 200);
    playerCountEl.textContent = base;
  }, 5000);
});
