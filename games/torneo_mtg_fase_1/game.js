/* =============================================
   TORNEO MTG: CONSTRUYE TU MAZO — game.js
   Kampe Daily Streak
   ============================================= */

'use strict';

/* =============================================
   CONTENT DATA — 10 CARDS
   ============================================= */

const CARDS = [
  /* ---- R1 (1 blank: Función) ---- */
  {
    id: 1,
    nombre: 'Compresor',
    unidad: 'Exterior',
    funcion: 'Comprime el gas refrigerante para que circule por todo el sistema',
    lado: 'Caliente',
    tipo: 'Mecánico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675473/card_compresor_anufur.png',
    ronda: 1,
    funcion_distractors: [
      'Disipa el calor absorbido hacia el aire exterior',
      'Hace circular el aire de la habitación por el evaporador'
    ],
    feedback: {
      funcion: {
        'Disipa el calor absorbido hacia el aire exterior':
          { why: 'Esa es la función del condensador, no del compresor.', rule: 'El compresor comprime el gas refrigerante para que tenga la presión necesaria para circular y transferir calor.' },
        'Hace circular el aire de la habitación por el evaporador':
          { why: 'Esa es la función del ventilador interior.', rule: 'El compresor no mueve aire, mueve gas refrigerante comprimiéndolo.' }
      }
    }
  },
  {
    id: 2,
    nombre: 'Evaporador',
    unidad: 'Interior',
    funcion: 'Absorbe el calor del aire de la habitación para enfriarlo',
    lado: 'Frío',
    tipo: 'Mecánico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_evaporador_aioivc.png',
    ronda: 1,
    funcion_distractors: [
      'Comprime el gas refrigerante para que circule por el sistema',
      'Retiene el polvo y las partículas antes de que el aire entre al serpentín'
    ],
    feedback: {
      funcion: {
        'Comprime el gas refrigerante para que circule por el sistema':
          { why: 'Esa es la función del compresor.', rule: 'El evaporador absorbe calor del aire interior al evaporarse el refrigerante a baja presión.' },
        'Retiene el polvo y las partículas antes de que el aire entre al serpentín':
          { why: 'Esa es la función del filtro.', rule: 'El evaporador no filtra, transfiere calor del aire al refrigerante.' }
      }
    }
  },

  /* ---- R2 (2 blanks: Unidad + Función) ---- */
  {
    id: 3,
    nombre: 'Condensador',
    unidad: 'Exterior',
    funcion: 'Disipa el calor absorbido del interior hacia el aire exterior',
    lado: 'Caliente',
    tipo: 'Mecánico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_condensador_ihp9uo.png',
    ronda: 2,
    unidad_distractors: ['Interior', 'Conexión'],
    funcion_distractors: [
      'Absorbe el calor del aire de la habitación para enfriarlo',
      'Expulsa el calor mediante un ventilador hacia el exterior'
    ],
    feedback: {
      unidad: {
        'Interior': { why: 'El condensador está en la unidad exterior, la caja de fuera.', rule: 'El condensador trabaja con el calor que se disipa al exterior, por eso está en la unidad exterior.' },
        'Conexión': { why: 'El condensador no es un elemento de conexión.', rule: 'El condensador está dentro de la unidad exterior, no es el elemento que une las dos unidades.' }
      },
      funcion: {
        'Absorbe el calor del aire de la habitación para enfriarlo':
          { why: 'Esa es la función del evaporador. El condensador hace lo contrario: libera calor.', rule: 'El condensador disipa calor al exterior; el evaporador lo absorbe del interior.' },
        'Expulsa el calor mediante un ventilador hacia el exterior':
          { why: 'El ventilador exterior ayuda al condensador, pero no es el condensador en sí.', rule: 'El condensador es el serpentín que libera el calor; el ventilador exterior solo mueve el aire sobre él.' }
      }
    }
  },
  {
    id: 4,
    nombre: 'Ventilador interior',
    unidad: 'Interior',
    funcion: 'Hace circular el aire de la habitación por el evaporador para enfriarlo',
    lado: 'Frío',
    tipo: 'Mecánico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_ventilador_interior_ed6asq.png',
    ronda: 2,
    unidad_distractors: ['Exterior', 'Conexión'],
    funcion_distractors: [
      'Absorbe el calor del aire de la habitación para enfriarlo',
      'Filtra el aire antes de que entre al circuito de refrigeración'
    ],
    feedback: {
      unidad: {
        'Exterior': { why: 'El ventilador interior está en la unidad de pared, dentro de la habitación.', rule: 'El ventilador interior circula el aire de la habitación por el evaporador, que está en la unidad interior.' },
        'Conexión': { why: 'El ventilador interior no es un elemento de conexión entre unidades.', rule: 'Está completamente dentro de la unidad interior.' }
      },
      funcion: {
        'Absorbe el calor del aire de la habitación para enfriarlo':
          { why: 'Esa es la función del evaporador, no del ventilador.', rule: 'El ventilador interior mueve el aire; el evaporador es el que absorbe el calor de ese aire.' },
        'Filtra el aire antes de que entre al circuito de refrigeración':
          { why: 'Esa es la función del filtro.', rule: 'El ventilador interior mueve el aire, no lo filtra.' }
      }
    }
  },
  {
    id: 5,
    nombre: 'Tubería frigorífica',
    unidad: 'Conexión',
    funcion: 'Transporta el refrigerante entre la unidad interior y la exterior',
    lado: 'Ambos lados',
    tipo: 'Mecánico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_tuberia_adw4m6.png',
    ronda: 2,
    unidad_distractors: ['Interior', 'Exterior'],
    funcion_distractors: [
      'Evacúa el agua condensada de la unidad interior hacia el exterior',
      'Transmite señales eléctricas entre unidad interior y exterior'
    ],
    feedback: {
      unidad: {
        'Interior': { why: 'La tubería frigorífica no pertenece a ninguna unidad concreta.', rule: 'Es el elemento que conecta físicamente las dos unidades transportando el refrigerante.' },
        'Exterior': { why: 'La tubería frigorífica recorre las dos unidades, no pertenece solo a la exterior.', rule: 'Es el elemento de conexión entre unidades, no forma parte de ninguna de ellas por separado.' }
      },
      funcion: {
        'Evacúa el agua condensada de la unidad interior hacia el exterior':
          { why: 'Esa es la función del tubo de drenaje.', rule: 'La tubería frigorífica transporta refrigerante gaseoso/líquido, no agua.' },
        'Transmite señales eléctricas entre unidad interior y exterior':
          { why: 'Esa es la función del cable eléctrico.', rule: 'La tubería frigorífica es mecánica: transporta refrigerante, no señales eléctricas.' }
      }
    }
  },

  /* ---- R3 (3 blanks: Unidad + Función + Lado) ---- */
  {
    id: 6,
    nombre: 'Ventilador exterior',
    unidad: 'Exterior',
    funcion: 'Expulsa el calor del condensador hacia el exterior',
    lado: 'Caliente',
    tipo: 'Mecánico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_ventilador_exterior_yhp7uu.png',
    ronda: 3,
    unidad_distractors: ['Interior', 'Conexión'],
    funcion_distractors: [
      'Comprime el gas refrigerante para que circule por el sistema',
      'Disipa el calor absorbido del interior hacia el aire exterior'
    ],
    lado_distractors: ['Frío', 'Ambos lados'],
    feedback: {
      unidad: {
        'Interior': { why: 'El ventilador exterior está en la caja de fuera.', rule: 'Su función es expulsar calor al exterior, por eso está en la unidad exterior.' },
        'Conexión': { why: 'El ventilador exterior no conecta las dos unidades.', rule: 'Está completamente dentro de la unidad exterior.' }
      },
      funcion: {
        'Comprime el gas refrigerante para que circule por el sistema':
          { why: 'Esa es la función del compresor.', rule: 'El ventilador exterior mueve aire sobre el condensador para que pueda disipar calor más eficientemente.' },
        'Disipa el calor absorbido del interior hacia el aire exterior':
          { why: 'Esa descripción corresponde al condensador en su conjunto.', rule: 'El ventilador exterior solo mueve el aire; quien disipa el calor es el condensador.' }
      },
      lado: {
        'Frío': { why: 'El ventilador exterior trabaja en el lado caliente, ayudando a expulsar calor.', rule: 'El lado frío es donde el refrigerante absorbe calor (interior). El ventilador exterior opera en el lado caliente (exterior).' },
        'Ambos lados': { why: 'El ventilador exterior trabaja solo en el lado caliente.', rule: 'Solo está en la unidad exterior y solo opera con el calor que se expulsa al ambiente.' }
      }
    }
  },
  {
    id: 7,
    nombre: 'Filtro',
    unidad: 'Interior',
    funcion: 'Retiene el polvo y las partículas del aire antes de que lleguen al evaporador',
    lado: 'Frío',
    tipo: 'Estructural',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_filtro_djokew.png',
    ronda: 3,
    unidad_distractors: ['Exterior', 'Conexión'],
    funcion_distractors: [
      'Hace circular el aire de la habitación por el evaporador',
      'Regula la cantidad de refrigerante que entra al circuito frío'
    ],
    lado_distractors: ['Caliente', 'Ambos lados'],
    feedback: {
      unidad: {
        'Exterior': { why: 'El filtro está en la unidad interior, donde entra el aire de la habitación.', rule: 'El filtro limpia el aire antes de que pase por el evaporador, que está en la unidad interior.' },
        'Conexión': { why: 'El filtro no es un elemento de conexión entre unidades.', rule: 'El filtro está dentro de la unidad interior.' }
      },
      funcion: {
        'Hace circular el aire de la habitación por el evaporador':
          { why: 'Esa es la función del ventilador interior.', rule: 'El filtro no mueve aire, lo limpia reteniendo partículas.' },
        'Regula la cantidad de refrigerante que entra al circuito frío':
          { why: 'El filtro no tiene nada que ver con el circuito de refrigerante.', rule: 'El filtro trabaja solo con el aire, no con el refrigerante.' }
      },
      lado: {
        'Caliente': { why: 'El filtro trabaja en el lado frío, en la unidad interior.', rule: 'El filtro limpia el aire que pasa por el evaporador, que está en el lado frío del ciclo.' },
        'Ambos lados': { why: 'El filtro solo trabaja en la unidad interior, lado frío.', rule: 'No es un elemento de conexión: está completamente en el lado frío.' }
      }
    }
  },
  {
    id: 8,
    nombre: 'Tubo de drenaje',
    unidad: 'Conexión',
    funcion: 'Evacúa el agua condensada de la unidad interior hacia el exterior',
    lado: 'Frío',
    tipo: 'Estructural',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_drenaje_olqzwv.png',
    ronda: 3,
    unidad_distractors: ['Interior', 'Exterior'],
    funcion_distractors: [
      'Transporta el refrigerante entre la unidad interior y la exterior',
      'Transmite electricidad entre unidad interior y exterior'
    ],
    lado_distractors: ['Caliente', 'Ambos lados'],
    feedback: {
      unidad: {
        'Interior': { why: 'El tubo de drenaje sale de la unidad interior hacia el exterior, no pertenece solo a ella.', rule: 'Es un elemento de conexión: lleva el agua desde la unidad interior hasta el punto de drenaje exterior.' },
        'Exterior': { why: 'El tubo de drenaje no pertenece solo a la unidad exterior.', rule: 'Conecta la unidad interior (donde se produce el agua condensada) con el punto de drenaje exterior.' }
      },
      funcion: {
        'Transporta el refrigerante entre la unidad interior y la exterior':
          { why: 'Esa es la función de la tubería frigorífica.', rule: 'El tubo de drenaje evacúa agua, no refrigerante.' },
        'Transmite electricidad entre unidad interior y exterior':
          { why: 'Esa es la función del cable eléctrico.', rule: 'El tubo de drenaje es un conducto pasivo para el agua condensada.' }
      },
      lado: {
        'Caliente': { why: 'El agua condensada se produce en el evaporador, que está en el lado frío.', rule: 'El tubo de drenaje evacúa el agua producida en el lado frío del ciclo.' },
        'Ambos lados': { why: 'El agua condensada se produce en el evaporador, solo en el lado frío.', rule: 'El tubo de drenaje solo gestiona el agua del lado frío, no recorre ambos lados del ciclo térmico.' }
      }
    }
  },

  /* ---- R4 (4 blanks: todo) ---- */
  {
    id: 9,
    nombre: 'Placa electrónica',
    unidad: 'Interior',
    funcion: 'Controla y coordina el funcionamiento de todos los componentes del split',
    lado: 'Frío',
    tipo: 'Eléctrico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675472/card_placa_dzjesb.png',
    ronda: 4,
    unidad_distractors: ['Exterior', 'Conexión'],
    funcion_distractors: [
      'Transmite electricidad y señales entre unidad interior y exterior',
      'Absorbe el calor del aire de la habitación para enfriarlo'
    ],
    lado_distractors: ['Caliente', 'Ambos lados'],
    feedback: {
      unidad: {
        'Exterior': { why: 'La placa electrónica principal está en la unidad interior.', rule: 'Desde la unidad interior, la placa controla todos los componentes del split.' },
        'Conexión': { why: 'La placa electrónica no es un elemento de conexión física entre unidades.', rule: 'Está dentro de la unidad interior.' }
      },
      funcion: {
        'Transmite electricidad y señales entre unidad interior y exterior':
          { why: 'Esa es la función del cable eléctrico; la placa controla desde dentro, no transmite entre unidades.', rule: 'La placa electrónica coordina el funcionamiento; el cable eléctrico transmite las señales al exterior.' },
        'Absorbe el calor del aire de la habitación para enfriarlo':
          { why: 'Esa es la función del evaporador.', rule: 'La placa electrónica es el cerebro del sistema: gestiona señales, no calor.' }
      },
      lado: {
        'Caliente': { why: 'La placa electrónica está en la unidad interior, que opera en el lado frío del ciclo.', rule: 'Lado frío es donde se produce el enfriamiento del aire; la placa electrónica vive allí.' },
        'Ambos lados': { why: 'La placa electrónica está en la unidad interior solamente.', rule: 'Opera en el lado frío del ciclo, no recorre los dos lados como la tubería frigorífica.' }
      }
    }
  },
  {
    id: 10,
    nombre: 'Cable eléctrico',
    unidad: 'Conexión',
    funcion: 'Transmite electricidad y señales de control entre unidad interior y exterior',
    lado: 'Ambos lados',
    tipo: 'Eléctrico',
    art: 'https://res.cloudinary.com/kampe/image/upload/v1773675473/card_cable_zwpu9x.png',
    ronda: 4,
    unidad_distractors: ['Interior', 'Exterior'],
    funcion_distractors: [
      'Transporta el refrigerante entre la unidad interior y la exterior',
      'Controla y coordina el funcionamiento de todos los componentes del split'
    ],
    lado_distractors: ['Frío', 'Caliente'],
    feedback: {
      unidad: {
        'Interior': { why: 'El cable eléctrico no pertenece solo a la unidad interior.', rule: 'Conecta las dos unidades, por eso es un elemento de conexión.' },
        'Exterior': { why: 'El cable eléctrico no pertenece solo a la unidad exterior.', rule: 'Recorre las dos unidades: es el elemento de conexión eléctrica entre ellas.' }
      },
      funcion: {
        'Transporta el refrigerante entre la unidad interior y la exterior':
          { why: 'Esa es la función de la tubería frigorífica.', rule: 'El cable eléctrico transmite electricidad y señales, no refrigerante.' },
        'Controla y coordina el funcionamiento de todos los componentes del split':
          { why: 'Esa es la función de la placa electrónica.', rule: 'El cable eléctrico es el medio de transmisión; la placa electrónica es quien controla.' }
      },
      lado: {
        'Frío': { why: 'El cable eléctrico recorre los dos lados, no solo el frío.', rule: 'Conecta ambas unidades (interior y exterior), por lo que recorre ambos lados del ciclo térmico.' },
        'Caliente': { why: 'El cable eléctrico recorre los dos lados, no solo el caliente.', rule: 'Conecta la unidad interior (frío) con la exterior (caliente), por lo que pertenece a ambos lados.' }
      }
    }
  }
];

/* =============================================
   CONSTANTS
   ============================================= */

const ATTR_LABELS = {
  unidad:  '¿Cuál es la Unidad?',
  funcion: '¿Cuál es la Función?',
  lado:    '¿Cuál es el Lado térmico?',
  tipo:    '¿Cuál es el Tipo?'
};

const ATTR_VALUES = {
  unidad: ['Interior', 'Exterior', 'Conexión'],
  lado:   ['Frío', 'Caliente', 'Ambos lados'],
  tipo:   ['Mecánico', 'Eléctrico', 'Estructural']
};

const LADO_ICONS = {
  'Frío': `<svg viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="1" x2="10" y2="19"/>
    <line x1="1" y1="10" x2="19" y2="10"/>
    <line x1="3.5" y1="3.5" x2="16.5" y2="16.5"/>
    <line x1="16.5" y1="3.5" x2="3.5" y2="16.5"/>
    <polyline points="7,3.5 10,1 13,3.5"/>
    <polyline points="7,16.5 10,19 13,16.5"/>
    <polyline points="3.5,7 1,10 3.5,13"/>
    <polyline points="16.5,7 19,10 16.5,13"/>
  </svg>`,
  'Caliente': `<svg viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1C8 4 4 7 4 12a6 6 0 0 0 12 0C16 7 12 4 10 1zm0 5C10.8 8 13 11 13 13a3 3 0 0 1-6 0C7 11 9.2 8 10 6z"/>
  </svg>`,
  'Ambos lados': `<svg viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1l2.5 6.5H19l-5.3 3.8 2 6.2L10 14l-5.7 3.5 2-6.2L1 7.5h6.5z"/>
  </svg>`
};

const LADO_STATES = {
  'Frío':       'frio',
  'Caliente':   'caliente',
  'Ambos lados':'ambos'
};

const LADO_COLORS = {
  frio:     '#1464AC',
  caliente: '#C0392B',
  ambos:    '#C9A040',
  empty:    '#7A7A7A'
};

const ROUND_SUBS = {
  2: 'Ahora rellena Unidad y Función',
  3: 'Tres atributos por carta',
  4: 'Todo en blanco. Demuéstralo.'
};

/* =============================================
   GAME STATE
   ============================================= */

const state = {
  cardIndex:      0,
  completedCards: [],
  currentCard:    null,
  filledAttrs:    {},
  blanks:         [],
  activeZone:     null,
  processing:     false,
  dimmedOptions:  {},
  tutorialShown:  false
};

/* =============================================
   DOM REFS
   ============================================= */

const dom = {
  screenIntro:      document.getElementById('screen-intro'),
  screenPlay:       document.getElementById('screen-play'),
  screenResults:    document.getElementById('screen-results'),
  btnStart:         document.getElementById('btn-start'),
  btnRetry:         document.getElementById('btn-retry'),
  roundBanner:      document.getElementById('round-banner'),
  roundBannerTitle: document.getElementById('round-banner-title'),
  roundBannerSub:   document.getElementById('round-banner-sub'),
  activeCard:       document.getElementById('active-card'),
  cardName:         document.getElementById('card-name'),
  cardArt:          document.getElementById('card-art'),
  cardLadoIcon:     document.getElementById('card-lado-icon'),
  zoneUnidad:       document.getElementById('zone-unidad'),
  unidadValue:      document.getElementById('unidad-value'),
  zoneFuncion:      document.getElementById('zone-funcion'),
  funcionBtn:       document.getElementById('funcion-btn'),
  funcionValue:     document.getElementById('funcion-value'),
  zoneTipo:         document.getElementById('zone-tipo'),
  deckStack:        document.getElementById('deck-stack'),
  stackCards:       document.getElementById('stack-cards'),
  stackCount:       document.getElementById('stack-count'),
  modalOverlay:     document.getElementById('modal-overlay'),
  modal:            document.getElementById('modal'),
  modalClose:       document.getElementById('modal-close'),
  modalTitle:       document.getElementById('modal-title'),
  modalOptions:     document.getElementById('modal-options'),
  feedbackPanel:    document.getElementById('feedback-panel'),
  fbWhat:           document.getElementById('fb-what'),
  fbWhy:            document.getElementById('fb-why'),
  fbRule:           document.getElementById('fb-rule'),
  btnEntendido:     document.getElementById('btn-entendido'),
  completeOverlay:  document.getElementById('complete-overlay'),
  resultsGrid:      document.getElementById('results-grid'),
  screenFlash:      document.getElementById('screen-flash'),
  particles:        document.getElementById('particles')
};

/* =============================================
   SCREEN SWITCHING
   ============================================= */

function showScreen(name) {
  [dom.screenIntro, dom.screenPlay, dom.screenResults].forEach(s => s.classList.remove('active'));
  document.documentElement.classList.remove('results');

  if (name === 'intro') {
    dom.screenIntro.classList.add('active');
  } else if (name === 'play') {
    dom.screenPlay.classList.add('active');
  } else if (name === 'results') {
    dom.screenResults.classList.add('active');
    document.documentElement.classList.add('results');
  }
}

/* =============================================
   RECORD / LOCALSTORAGE
   ============================================= */

const RECORD_KEY = 'torneo_mtg_fase_1_record';

function saveRecord() {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify({ completado: true })); } catch (e) {}
}

/* =============================================
   TASK_COMPLETED
   ============================================= */

function fireTaskCompleted() {
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    }
  } catch (e) {}
}

/* =============================================
   SCREEN FLASH
   ============================================= */

function screenFlash(color) {
  if (!dom.screenFlash) return;
  dom.screenFlash.style.background = color;
  dom.screenFlash.animate(
    [{ opacity: 0 }, { opacity: 0.28 }, { opacity: 0 }],
    { duration: 650, easing: 'ease-in-out' }
  );
}

/* =============================================
   FLOATING +1
   ============================================= */

function spawnFloatingPlus() {
  const rect = dom.activeCard.getBoundingClientRect();
  const el   = document.createElement('div');
  el.className  = 'floating-plus';
  el.textContent = '+1';
  el.style.left  = (rect.left + rect.width / 2 - 22) + 'px';
  el.style.top   = (rect.top  + rect.height * 0.3) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/* =============================================
   PARTICLES
   ============================================= */

const particleCtx  = dom.particles.getContext('2d');
const particleList = [];
let   particleRAF  = null;

function resizeParticleCanvas() {
  dom.particles.width  = window.innerWidth;
  dom.particles.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener('resize', resizeParticleCanvas);

function spawnParticlesAt(cx, cy, count, colors) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 1.5;
    particleList.push({
      x:     cx + (Math.random() - 0.5) * 50,
      y:     cy + (Math.random() - 0.5) * 50,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed - Math.random() * 3.5,
      r:     Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life:  1
    });
  }
  if (!particleRAF) particleRAF = requestAnimationFrame(tickParticles);
}

function tickParticles() {
  particleCtx.clearRect(0, 0, dom.particles.width, dom.particles.height);
  for (let i = particleList.length - 1; i >= 0; i--) {
    const p = particleList[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.14;
    p.life -= 0.028;
    if (p.life <= 0) { particleList.splice(i, 1); continue; }
    particleCtx.globalAlpha = p.life;
    particleCtx.fillStyle   = p.color;
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    particleCtx.fill();
  }
  particleCtx.globalAlpha = 1;
  particleRAF = particleList.length > 0 ? requestAnimationFrame(tickParticles) : null;
}

/* =============================================
   TUTORIAL
   ============================================= */

function showTutorial() {
  if (state.tutorialShown) return;
  document.getElementById('tutorial-modal').removeAttribute('hidden');
}

function dismissTutorial() {
  const firstPlay = !state.tutorialShown;
  state.tutorialShown = true;
  document.getElementById('tutorial-modal').setAttribute('hidden', '');
  if (firstPlay) loadCard(0);
}

document.getElementById('btn-tutorial-ok').addEventListener('click', dismissTutorial);

/* =============================================
   GAME INIT
   ============================================= */

function startGame(skipTutorial) {
  state.cardIndex      = 0;
  state.completedCards = [];
  state.tutorialShown  = skipTutorial || false;
  state.processing     = false;

  updateStackUI();
  showScreen('play');

  if (!state.tutorialShown) {
    showTutorial(); /* tutorial shows first; dismissTutorial() will call loadCard(0) */
  } else {
    loadCard(0);
  }
}

/* =============================================
   CARD LOADING
   ============================================= */

function getBlanksForCard(card) {
  const r = card.ronda;
  if (r === 1) return ['funcion'];
  if (r === 2) return ['unidad', 'funcion'];
  if (r === 3) return ['unidad', 'funcion', 'lado'];
  return       ['unidad', 'funcion', 'lado', 'tipo'];
}

function loadCard(index) {
  const card = CARDS[index];
  state.currentCard   = card;
  state.filledAttrs   = {};
  state.blanks        = getBlanksForCard(card);
  state.dimmedOptions = {};
  state.activeZone    = null;

  const prevCard    = index > 0 ? CARDS[index - 1] : null;
  const isRoundStart = prevCard && card.ronda !== prevCard.ronda;

  /* Populate card — clear src first so old image never flashes in new card */
  dom.cardName.textContent = card.nombre.toUpperCase();
  dom.cardArt.src          = '';
  dom.cardArt.src          = card.art;
  dom.cardArt.alt          = card.nombre;
  dom.activeCard.className = 'card';

  resetZoneUnidad(card);
  resetZoneFuncion(card);
  resetZoneLado(card);
  resetZoneTipo(card);

  dom.activeCard.removeAttribute('hidden');

  if (isRoundStart) {
    showRoundBanner(card.ronda, () => animateCardEnter());
  } else {
    animateCardEnter();
  }

}

function resetZoneUnidad(card) {
  const blank = state.blanks.includes('unidad');
  dom.zoneUnidad.classList.toggle('zone-tappable', blank);
  if (blank) {
    dom.unidadValue.className   = 'zone-ghost';
    dom.unidadValue.textContent = '· · · Unidad · · ·';
  } else {
    dom.unidadValue.className   = 'zone-filled';
    dom.unidadValue.textContent = card.unidad;
    state.filledAttrs.unidad    = card.unidad;
  }
}

function resetZoneFuncion(card) {
  const blank = state.blanks.includes('funcion');
  dom.zoneFuncion.classList.toggle('zone-tappable', blank);
  if (blank) {
    dom.funcionBtn.removeAttribute('hidden');
    dom.funcionValue.setAttribute('hidden', '');
    dom.funcionValue.textContent = '';
  } else {
    dom.funcionBtn.setAttribute('hidden', '');
    dom.funcionValue.removeAttribute('hidden');
    dom.funcionValue.textContent = card.funcion;
    state.filledAttrs.funcion    = card.funcion;
  }
}

function resetZoneLado(card) {
  const blank = state.blanks.includes('lado');
  dom.cardLadoIcon.classList.toggle('zone-tappable', blank);
  if (blank) {
    dom.cardLadoIcon.setAttribute('data-state', 'empty');
    dom.cardLadoIcon.innerHTML = '?';
  } else {
    applyLadoIcon(card.lado, false);
    state.filledAttrs.lado = card.lado;
  }
}

function resetZoneTipo(card) {
  const blank = state.blanks.includes('tipo');
  dom.zoneTipo.classList.toggle('zone-tappable', blank);
  if (blank) {
    dom.zoneTipo.removeAttribute('data-tipo');
    dom.zoneTipo.textContent = '?';
  } else {
    applyTipoBadge(card.tipo, false);
    state.filledAttrs.tipo = card.tipo;
  }
}

function animateCardEnter() {
  dom.activeCard.classList.remove('entering');
  void dom.activeCard.offsetWidth;
  dom.activeCard.classList.add('entering');
  setTimeout(() => dom.activeCard.classList.remove('entering'), 420);
}

/* =============================================
   ROUND BANNER
   ============================================= */

function showRoundBanner(ronda, callback) {
  dom.roundBannerTitle.textContent = 'Ronda ' + ronda;
  dom.roundBannerSub.textContent   = ROUND_SUBS[ronda] || '';
  dom.roundBanner.removeAttribute('hidden');
  dom.roundBanner.classList.remove('animating');
  void dom.roundBanner.offsetWidth;
  dom.roundBanner.classList.add('animating');
  if (callback) callback();
  setTimeout(() => {
    dom.roundBanner.setAttribute('hidden', '');
    dom.roundBanner.classList.remove('animating');
  }, 3000);
}

/* =============================================
   ZONE TAP
   ============================================= */

function handleZoneTap(zone) {
  if (state.processing) return;
  if (state.filledAttrs[zone] !== undefined) return;

  if (!state.tutorialShown) {
    dismissTutorial();
  }

  state.activeZone    = zone;
  state.dimmedOptions = {};
  openModal(zone);
}

dom.zoneUnidad.addEventListener('click',  () => handleZoneTap('unidad'));
dom.zoneFuncion.addEventListener('click', () => handleZoneTap('funcion'));
dom.funcionBtn.addEventListener('click',  (e) => { e.stopPropagation(); handleZoneTap('funcion'); });
dom.cardLadoIcon.addEventListener('click',() => handleZoneTap('lado'));
dom.zoneTipo.addEventListener('click',    (e) => { e.stopPropagation(); handleZoneTap('tipo'); });

/* =============================================
   MODAL
   ============================================= */

function buildOptions(zone) {
  const card    = state.currentCard;
  const correct = card[zone];
  const wrong   = zone === 'funcion'
    ? (card.funcion_distractors || [])
    : (card[zone + '_distractors'] || ATTR_VALUES[zone].filter(v => v !== correct));
  return [correct, ...wrong].sort(() => Math.random() - 0.5);
}

function openModal(zone) {
  dom.modalTitle.textContent = ATTR_LABELS[zone] || zone;
  dom.feedbackPanel.setAttribute('hidden', '');

  const opts    = buildOptions(zone);
  const isShort = (zone === 'unidad' || zone === 'tipo' || zone === 'lado');
  dom.modalOptions.className = isShort ? 'modal-options two-col' : 'modal-options';
  dom.modalOptions.innerHTML = '';

  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'option-pill';
    btn.textContent = opt;
    if (state.dimmedOptions[opt]) btn.classList.add('dimmed');
    btn.addEventListener('click', () => handleOptionTap(btn, opt, zone));
    dom.modalOptions.appendChild(btn);
  });

  dom.modalOverlay.removeAttribute('hidden');
  dom.modal.removeAttribute('hidden');
  requestAnimationFrame(() => dom.modal.classList.add('open'));
}

function closeModal() {
  dom.modal.classList.remove('open');
  dom.modalOverlay.setAttribute('hidden', ''); /* immediately — overlay must never block card zone taps */
  setTimeout(() => {
    dom.modal.setAttribute('hidden', '');
    dom.feedbackPanel.setAttribute('hidden', '');
  }, 280);
  state.activeZone = null;
}

dom.modalClose.addEventListener('click',   closeModal);
dom.modalOverlay.addEventListener('click', closeModal);

/* =============================================
   OPTION TAP
   ============================================= */

function handleOptionTap(btn, value, zone) {
  if (state.processing) return;
  if (btn.classList.contains('dimmed')) return;
  state.processing = true;
  if (value === state.currentCard[zone]) {
    handleCorrect(btn, value, zone);
  } else {
    handleIncorrect(btn, value, zone);
  }
}

/* =============================================
   CORRECT ANSWER — rewarding sequence
   ============================================= */

function handleCorrect(btn, value, zone) {
  /* Flash pill turquesa + checkmark */
  btn.style.background  = '#00E6BC';
  btn.style.borderColor = '#04FFB4';
  btn.style.color       = '#0B214A';
  const check = document.createElement('span');
  check.className   = 'pill-check';
  check.textContent = ' ✓';
  btn.appendChild(check);

  /* Particles from modal center */
  const mRect = dom.modal.getBoundingClientRect();
  spawnParticlesAt(
    mRect.left + mRect.width  / 2,
    mRect.top  + mRect.height / 2,
    30,
    ['#00E6BC', '#04FFB4', '#C9A040', '#ffffff']
  );

  setTimeout(() => {
    closeModal();
    state.filledAttrs[zone] = value;
    fillZone(zone, value);

    const allFilled = state.blanks.every(b => state.filledAttrs[b] !== undefined);
    if (allFilled) {
      setTimeout(() => animateCardComplete(), 520);
    }
    state.processing = false;
  }, 360);
}

/* =============================================
   FILL ZONE — per-zone rewarding animations
   ============================================= */


function fillZone(zone, value) {
  if (zone === 'unidad') {
    dom.unidadValue.className   = 'zone-filled text-pop-turq';
    dom.unidadValue.textContent = value;
    dom.zoneUnidad.classList.remove('zone-tappable');
    dom.zoneUnidad.classList.add('zone-glow-turq');
    setTimeout(() => dom.zoneUnidad.classList.remove('zone-glow-turq'), 950);

  } else if (zone === 'funcion') {
    dom.funcionBtn.setAttribute('hidden', '');
    dom.funcionValue.textContent = value;
    dom.funcionValue.removeAttribute('hidden');
    dom.funcionValue.classList.add('text-slide-in');
    dom.zoneFuncion.classList.remove('zone-tappable');
    dom.zoneFuncion.classList.add('zone-pulse-mint');
    setTimeout(() => {
      dom.funcionValue.classList.remove('text-slide-in');
      dom.zoneFuncion.classList.remove('zone-pulse-mint');
    }, 750);

  } else if (zone === 'lado') {
    applyLadoIcon(value, true);
    dom.cardLadoIcon.classList.remove('zone-tappable');

  } else if (zone === 'tipo') {
    applyTipoBadge(value, true);
    dom.zoneTipo.classList.remove('zone-tappable');
  }
}

function applyLadoIcon(value, animate) {
  const icon = LADO_ICONS[value];
  const s    = LADO_STATES[value] || 'empty';
  dom.cardLadoIcon.innerHTML = icon || '?';
  dom.cardLadoIcon.setAttribute('data-state', s);

  /* Card border color */
  dom.activeCard.classList.remove('border-frio', 'border-caliente', 'border-ambos');
  if (s === 'frio')     dom.activeCard.classList.add('border-frio');
  if (s === 'caliente') dom.activeCard.classList.add('border-caliente');
  if (s === 'ambos')    dom.activeCard.classList.add('border-ambos');

  if (animate) {
    /* Icon pop */
    dom.cardLadoIcon.classList.remove('icon-pop-big');
    void dom.cardLadoIcon.offsetWidth;
    dom.cardLadoIcon.classList.add('icon-pop-big');
    dom.cardLadoIcon.addEventListener('animationend',
      () => dom.cardLadoIcon.classList.remove('icon-pop-big'), { once: true });

    /* Card exterior glow using CSS variable */
    const glowColor = LADO_COLORS[s] || '#7A7A7A';
    dom.activeCard.style.setProperty('--glow-color', glowColor);
    dom.activeCard.classList.add('lado-glow');
    setTimeout(() => dom.activeCard.classList.remove('lado-glow'), 1100);
  }
}

function applyTipoBadge(value, animate) {
  dom.zoneTipo.textContent = value;
  dom.zoneTipo.setAttribute('data-tipo', value);
  if (animate) {
    dom.zoneTipo.classList.remove('badge-pop');
    void dom.zoneTipo.offsetWidth;
    dom.zoneTipo.classList.add('badge-pop');
    dom.zoneTipo.addEventListener('animationend',
      () => dom.zoneTipo.classList.remove('badge-pop'), { once: true });
  }
}

/* =============================================
   INCORRECT ANSWER
   ============================================= */

function handleIncorrect(btn, value, zone) {
  /* Flash red + shake */
  btn.style.background = 'var(--red)';
  btn.classList.add('shaking');

  /* Immediately mark as used — prevents re-tapping during animation */
  state.dimmedOptions[value] = true;

  /* Use setTimeout instead of animationend — more reliable across browsers */
  setTimeout(() => {
    btn.classList.remove('shaking');
    btn.style.background = '';
    btn.classList.add('dimmed');

    /* Show feedback panel */
    const fb = getFeedback(zone, value);
    dom.fbWhat.textContent = '"' + value + '"';
    dom.fbWhy.textContent  = fb.why;
    dom.fbRule.textContent = fb.rule;
    dom.feedbackPanel.removeAttribute('hidden');
    state.processing = false;
  }, 350);
}

dom.btnEntendido.addEventListener('click', () => {
  dom.feedbackPanel.setAttribute('hidden', '');
});

function getFeedback(zone, value) {
  const card = state.currentCard;
  const fb   = card.feedback && card.feedback[zone] && card.feedback[zone][value];
  return fb || {
    why:  'Esa respuesta no es correcta para este componente.',
    rule: 'Revisa la descripción del componente y su posición en el sistema split.'
  };
}

/* =============================================
   CARD COMPLETE — ASMR SEQUENCE
   ============================================= */

function animateCardComplete() {
  const ladoState = dom.cardLadoIcon.getAttribute('data-state') || 'empty';
  const ladoColor = LADO_COLORS[ladoState] || '#7A7A7A';

  /* 0. Preload next card's image so it's ready when the card appears */
  const nextCard = CARDS[state.cardIndex + 1];
  if (nextCard) {
    const preload = new Image();
    preload.src = nextCard.art;
  }

  /* 1. White flash overlay on card */
  const flash = document.createElement('div');
  flash.className = 'card-flash-overlay';
  dom.activeCard.appendChild(flash);
  flash.animate(
    [{ opacity: 0 }, { opacity: 0.85 }, { opacity: 0 }],
    { duration: 520, easing: 'ease-in-out' }
  ).onfinish = () => flash.remove();

  /* 2. Screen color flash */
  screenFlash(ladoColor);

  /* 3. Glow ring (CSS class with CSS variable) */
  dom.activeCard.style.setProperty('--ring-color', ladoColor);
  dom.activeCard.classList.add('completing');
  setTimeout(() => dom.activeCard.classList.remove('completing'), 900);

  /* 4. Scale pulse with slight rotate */
  dom.activeCard.animate([
    { transform: 'scale(1)    rotate(0deg)' },
    { transform: 'scale(1.06) rotate(0.5deg)', offset: 0.4 },
    { transform: 'scale(1.02) rotate(0deg)',   offset: 0.7 },
    { transform: 'scale(1)    rotate(0deg)' }
  ], { duration: 520, easing: 'ease-in-out' });

  /* 5. 60 particles from card center */
  const cRect = dom.activeCard.getBoundingClientRect();
  spawnParticlesAt(
    cRect.left + cRect.width  / 2,
    cRect.top  + cRect.height / 2,
    60,
    ['#00E6BC', '#04FFB4', '#C9A040', ladoColor, '#ffffff', '#FFFFAB']
  );

  /* 6. Haptic */
  try { navigator.vibrate && navigator.vibrate(80); } catch (e) {}

  /* 7. Floating "+1" at t=200ms */
  setTimeout(() => spawnFloatingPlus(), 200);

  /* 8. Slide to stack at t=950ms */
  setTimeout(() => sendCardToStack(ladoColor), 950);
}

/* =============================================
   SEND CARD TO STACK
   ============================================= */

function sendCardToStack(ladoColor) {
  /* Clone the current card as an exit ghost so the new card can load on top */
  const cardArea  = dom.activeCard.parentElement;
  const cardRect  = dom.activeCard.getBoundingClientRect();
  const areaRect  = cardArea.getBoundingClientRect();

  const ghost = dom.activeCard.cloneNode(true);
  ghost.removeAttribute('id');
  ghost.style.cssText = [
    'position:absolute',
    `top:${cardRect.top - areaRect.top}px`,
    `left:${cardRect.left - areaRect.left}px`,
    `width:${cardRect.width}px`,
    `height:${cardRect.height}px`,
    'margin:0',
    'z-index:1',
    'pointer-events:none'
  ].join(';');
  cardArea.appendChild(ghost);

  /* Update state and load next card immediately — it slides in on top of ghost */
  state.completedCards.push(state.currentCard);
  updateStackUI();

  dom.deckStack.animate([
    { boxShadow: `inset 0 0 0px  ${ladoColor}` },
    { boxShadow: `inset 0 0 22px ${ladoColor}` },
    { boxShadow: `inset 0 0 0px  ${ladoColor}` }
  ], { duration: 320, easing: 'ease-out' });

  state.cardIndex++;
  if (state.cardIndex < CARDS.length) {
    loadCard(state.cardIndex);
  }

  /* Animate ghost off underneath the new card — invisible behind it */
  ghost.animate([
    { transform: 'translateY(0)     scale(1)    rotate(0deg)',  opacity: 1 },
    { transform: 'translateY(320px) scale(0.14) rotate(-3deg)', opacity: 0 }
  ], { duration: 500, easing: 'ease-in', fill: 'forwards' })
  .onfinish = () => {
    ghost.remove();
    if (state.cardIndex >= CARDS.length) {
      setTimeout(gameComplete, 320);
    }
  };
}

/* =============================================
   HUD + STACK UI
   ============================================= */

function updateHUD() {
  dom.hudCount.textContent = state.completedCards.length + ' / 10';
}

function updateStackUI() {
  dom.stackCards.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const slot = document.createElement('div');
    slot.className = 'stack-slot';
    const card = state.completedCards[i];
    if (card) {
      slot.classList.add('filled');
      const color = { 'Frío': '#1464AC', 'Caliente': '#C0392B', 'Ambos lados': '#C9A040' }[card.lado] || '#7A7A7A';
      slot.style.borderColor = color;
      const img = document.createElement('img');
      img.src = 'https://res.cloudinary.com/kampe/image/upload/v1773675475/card_back_afybdu.jpg';
      img.alt = card.nombre;
      slot.appendChild(img);
    }
    dom.stackCards.appendChild(slot);
  }
}

/* =============================================
   GAME COMPLETE
   ============================================= */

function gameComplete() {
  /* Epic stack glow */
  dom.deckStack.animate([
    { boxShadow: '0 0 0px  #C9A040' },
    { boxShadow: '0 0 48px #C9A040, 0 0 80px rgba(201,160,64,0.3)' },
    { boxShadow: '0 0 20px #C9A040' }
  ], { duration: 1200, easing: 'ease' });

  /* Massive particle burst from stack */
  const sRect = dom.deckStack.getBoundingClientRect();
  spawnParticlesAt(
    sRect.left + sRect.width  / 2,
    sRect.top  + sRect.height / 2,
    80,
    ['#C9A040', '#FFFFAB', '#00E6BC', '#04FFB4', '#ffffff']
  );

  /* Haptic celebration */
  try { navigator.vibrate && navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}

  /* "¡Mazo completado!" overlay */
  dom.completeOverlay.removeAttribute('hidden');
  dom.completeOverlay.animate([
    { opacity: 0, transform: 'scale(0.8)' },
    { opacity: 1, transform: 'scale(1.06)', offset: 0.25 },
    { opacity: 1, transform: 'scale(1)',    offset: 0.5  },
    { opacity: 1, transform: 'scale(1)',    offset: 0.72 },
    { opacity: 0, transform: 'scale(0.92)' }
  ], { duration: 3000, easing: 'ease', fill: 'forwards' })
  .onfinish = () => dom.completeOverlay.setAttribute('hidden', '');

  saveRecord();
  fireTaskCompleted();
  setTimeout(showResults, 2000);
}

/* =============================================
   RESULTS
   ============================================= */

function showResults() {
  showScreen('results');
  buildResultsGrid();
}

function buildResultsGrid() {
  dom.resultsGrid.innerHTML = '';
  state.completedCards.forEach((card, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'result-thumb';
    const img = document.createElement('img');
    img.src = card.art;
    img.alt = card.nombre;
    thumb.appendChild(img);
    const color = { 'Frío': '#1464AC', 'Caliente': '#C0392B', 'Ambos lados': '#C9A040' }[card.lado] || '#7A7A7A';
    thumb.style.borderColor = color;
    dom.resultsGrid.appendChild(thumb);
    setTimeout(() => thumb.classList.add('visible'), 100 + i * 150);
  });
}

/* =============================================
   EVENT LISTENERS
   ============================================= */

dom.btnStart.addEventListener('click',  () => startGame(false));
dom.btnRetry.addEventListener('click',  () => startGame(true));
