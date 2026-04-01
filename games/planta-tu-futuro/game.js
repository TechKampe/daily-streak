/* ===== EL INVERNADERO DE JESÚS ===== */

// ─── Helpers ────────────────────────────────────────────
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    const ms = { light: 10, medium: 20, heavy: 40, success: 20, error: 30 };
    navigator.vibrate(pattern || ms[level] || 20);
  }
}
function taskCompleted() {
  if (window.ReactNativeWebView)
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
}
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function showScreen(selector) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(selector).classList.add('active');
  document.documentElement.classList.toggle('results', selector === '#results');
}

// ─── Constants ──────────────────────────────────────────
const RECORD_KEY = 'planta_tu_futuro_record';
const TASK_THRESHOLD = 500;
const MAX_DAYS = 15;
const MAX_LIVES = 3;

// ─── SVG Plant Builder ─────────────────────────────────
function buildPlantSVG(id) {
  return `
  <svg viewBox="10 50 180 270" class="plant-svg" data-id="${id}">
    <defs>
      <linearGradient id="maceta-grad-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C67B4B"/>
        <stop offset="100%" stop-color="#8B4513"/>
      </linearGradient>
    </defs>
    <!-- Halo blanco superior para contraste -->
    <ellipse cx="100" cy="200" rx="70" ry="45" fill="rgba(255,255,255,0.25)"/>
    <!-- Destello -->
    <ellipse class="destello" cx="100" cy="230" rx="90" ry="50" fill="#FFCC00" opacity="0"/>
    <!-- Maceta -->
    <g class="maceta-group">
      <path d="M60,235 L65,290 Q65,300 75,300 L125,300 Q135,300 135,290 L140,235 Z" fill="url(#maceta-grad-${id})" stroke="#7A3B10" stroke-width="1"/>
      <path d="M55,230 L145,230 L145,240 Q145,242 143,242 L57,242 Q55,242 55,240 Z" fill="#A0522D" stroke="#7A3B10" stroke-width="1"/>
      <rect x="72" y="245" width="10" height="30" rx="5" fill="rgba(255,255,255,0.1)" transform="rotate(-5,77,260)"/>
      <path class="grieta" d="M95,260 L100,275 L97,290" fill="none" stroke="#5a3210" stroke-width="1.5" stroke-dasharray="40" stroke-dashoffset="40"/>
    </g>
    <!-- Tierra (interior maceta, sutil) -->
    <ellipse cx="100" cy="237" rx="38" ry="4" fill="#5D4037"/>
    <!-- Planta -->
    <g class="planta">
      <!-- Tallo principal -->
      <path class="tallo" d="M100,232 Q100,180 100,100" fill="none" stroke="#2E7D32" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="132" stroke-dashoffset="132"/>
      <!-- Ramas -->
      <path class="rama rama-1" d="M100,190 Q80,180 70,170" fill="none" stroke="#388E3C" stroke-width="2" stroke-linecap="round" stroke-dasharray="40" stroke-dashoffset="40"/>
      <path class="rama rama-2" d="M100,160 Q120,150 135,145" fill="none" stroke="#388E3C" stroke-width="2" stroke-linecap="round" stroke-dasharray="45" stroke-dashoffset="45"/>
      <!-- Hojas -->
      <g class="hoja hoja-1" style="transform-origin:100px 200px;transform:scale(0)">
        <path d="M100,200 Q85,190 80,180 Q90,185 100,190 Z" fill="#43A047"/>
        <path d="M100,200 Q115,190 120,180 Q110,185 100,190 Z" fill="#66BB6A"/>
      </g>
      <g class="hoja hoja-2" style="transform-origin:100px 180px;transform:scale(0)">
        <path d="M100,180 Q80,170 70,158 Q82,165 100,170 Z" fill="#43A047"/>
      </g>
      <g class="hoja hoja-3" style="transform-origin:100px 160px;transform:scale(0)">
        <path d="M100,160 Q120,148 135,140 Q118,150 100,155 Z" fill="#66BB6A"/>
      </g>
      <g class="hoja hoja-4" style="transform-origin:100px 140px;transform:scale(0)">
        <path d="M100,140 Q78,128 65,118 Q80,128 100,135 Z" fill="#43A047"/>
      </g>
      <g class="hoja hoja-5" style="transform-origin:100px 120px;transform:scale(0)">
        <path d="M100,120 Q122,108 140,100 Q120,112 100,118 Z" fill="#2E7D32"/>
      </g>
      <g class="hoja hoja-6" style="transform-origin:100px 105px;transform:scale(0)">
        <path d="M100,105 Q82,92 72,82 Q84,94 100,100 Z" fill="#388E3C"/>
      </g>
      <!-- Flor -->
      <g class="flor" style="transform-origin:100px 88px;transform:scale(0)">
        <ellipse cx="88" cy="80" rx="8" ry="5" fill="#FF7043" transform="rotate(-30,88,80)"/>
        <ellipse cx="112" cy="80" rx="8" ry="5" fill="#FF7043" transform="rotate(30,112,80)"/>
        <ellipse cx="95" cy="72" rx="8" ry="5" fill="#EF5350" transform="rotate(-60,95,72)"/>
        <ellipse cx="105" cy="72" rx="8" ry="5" fill="#EF5350" transform="rotate(60,105,72)"/>
        <ellipse cx="100" cy="68" rx="6" ry="5" fill="#FFAB91"/>
        <circle cx="100" cy="78" r="7" fill="#FDD835"/>
        <circle cx="98" cy="76" r="1.5" fill="#F9A825"/>
        <circle cx="102" cy="79" r="1" fill="#F9A825"/>
      </g>
    </g>
    <!-- Charco -->
    <ellipse class="charco" cx="100" cy="305" rx="55" ry="8" fill="rgba(33,150,243,0.3)" style="transform:scale(0);transform-origin:100px 305px"/>
    <!-- Gotas -->
    <g class="gotas" opacity="0">
      <ellipse cx="75" cy="245" rx="3" ry="5" fill="rgba(33,150,243,0.5)"/>
      <ellipse cx="125" cy="250" rx="2.5" ry="4" fill="rgba(33,150,243,0.4)"/>
      <ellipse cx="90" cy="248" rx="2" ry="3.5" fill="rgba(33,150,243,0.45)"/>
    </g>
    <!-- Semilla -->
    <g class="semilla" style="transform-origin:100px 222px;transform:scale(0)">
      <ellipse cx="100" cy="224" rx="10" ry="7" fill="#795548"/>
      <ellipse cx="100" cy="222" rx="5" ry="3.5" fill="#8D6E63"/>
      <!-- Tiny sprout hint -->
      <path d="M100,218 Q98,212 96,208 Q100,210 100,218 Z" fill="#81C784"/>
      <path d="M100,218 Q102,212 105,209 Q100,211 100,218 Z" fill="#66BB6A"/>
    </g>
    <!-- Confetti container -->
    <g class="confetti"></g>
  </svg>`;
}

// ─── Plant State Machine ────────────────────────────────
// estadoVisual: semilla, brote, pequena, grande, flor, marchita, ahogada
function applyPlantState(idx, state, animate) {
  const svg = $(`.plant-svg[data-id="${idx}"]`);
  if (!svg) return;
  const dur = animate ? '' : 'transition:none !important;';

  // Reset all
  const tallo = svg.querySelector('.tallo');
  const hojas = svg.querySelectorAll('.hoja');
  const ramas = svg.querySelectorAll('.rama');
  const flor = svg.querySelector('.flor');
  const charco = svg.querySelector('.charco');
  const gotas = svg.querySelector('.gotas');
  const semilla = svg.querySelector('.semilla');
  const grieta = svg.querySelector('.grieta');
  const planta = svg.querySelector('.planta');

  // Remove state classes
  planta.classList.remove('marchita', 'ahogada');

  // Default: hide everything
  tallo.style.strokeDashoffset = '132';
  hojas.forEach(h => h.style.transform = 'scale(0)');
  ramas.forEach(r => r.style.strokeDashoffset = r.getTotalLength ? r.getTotalLength() : '40');
  flor.style.transform = 'scale(0)';
  charco.style.transform = 'scale(0)';
  gotas.style.opacity = '0';
  semilla.style.transform = 'scale(0)';
  grieta.style.strokeDashoffset = '40';

  if (!animate) {
    svg.querySelectorAll('*').forEach(el => {
      el.style.transition = 'none';
    });
    // Force reflow
    svg.offsetHeight;
    requestAnimationFrame(() => {
      svg.querySelectorAll('*').forEach(el => {
        el.style.transition = '';
      });
    });
  }

  switch (state) {
    case 'semilla':
      semilla.style.transform = 'scale(1)';
      break;

    case 'brote':
      tallo.style.strokeDashoffset = '99'; // ~25% of stem
      hojas[0].style.transform = 'scale(1)';
      break;

    case 'pequena':
      tallo.style.strokeDashoffset = '66'; // ~50%
      hojas[0].style.transform = 'scale(1)';
      hojas[1].style.transform = 'scale(1)';
      hojas[2].style.transform = 'scale(1)';
      ramas[0].style.strokeDashoffset = '0';
      break;

    case 'grande':
      tallo.style.strokeDashoffset = '20'; // ~85%
      hojas.forEach(h => h.style.transform = 'scale(1)');
      ramas.forEach(r => r.style.strokeDashoffset = '0');
      break;

    case 'flor':
      tallo.style.strokeDashoffset = '0';
      hojas.forEach(h => h.style.transform = 'scale(1)');
      ramas.forEach(r => r.style.strokeDashoffset = '0');
      flor.style.transform = 'scale(1)';
      break;

    case 'marchita':
      tallo.style.strokeDashoffset = '20';
      planta.classList.add('marchita');
      hojas.forEach((h, i) => {
        h.style.transform = `scale(1) rotate(${30 + i * 8}deg)`;
      });
      ramas.forEach(r => r.style.strokeDashoffset = '0');
      break;

    case 'ahogada':
      tallo.style.strokeDashoffset = '20';
      planta.classList.add('ahogada');
      hojas.forEach((h, i) => {
        h.style.transform = `scale(1) translateY(${15 + i * 3}px) rotate(${20 + i * 5}deg)`;
      });
      ramas.forEach(r => r.style.strokeDashoffset = '0');
      charco.style.transform = 'scale(1)';
      gotas.style.opacity = '1';
      break;
  }
}

function showDestello(idx) {
  const svg = $(`.plant-svg[data-id="${idx}"]`);
  if (!svg) return;
  const d = svg.querySelector('.destello');
  d.style.transition = 'opacity 0.3s ease-out';
  d.style.opacity = '0.5';
  setTimeout(() => { d.style.opacity = '0'; }, 600);
}

function showShake(idx) {
  const svg = $(`.plant-svg[data-id="${idx}"]`);
  if (!svg) return;
  const g = svg.querySelector('.maceta-group');
  g.classList.add('maceta-shake');
  setTimeout(() => g.classList.remove('maceta-shake'), 400);
}

function showCrack(idx) {
  const svg = $(`.plant-svg[data-id="${idx}"]`);
  if (!svg) return;
  svg.querySelector('.grieta').style.strokeDashoffset = '0';
}

function showConfetti(idx) {
  const svg = $(`.plant-svg[data-id="${idx}"]`);
  if (!svg) return;
  const g = svg.querySelector('.confetti');
  g.innerHTML = '';
  const colors = ['#FF7043','#FDD835','#66BB6A','#42A5F5','#AB47BC','#EF5350','#26C6DA','#FFCA28'];
  for (let i = 0; i < 16; i++) {
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const angle = (i / 16) * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 40;
    r.setAttribute('x', '98');
    r.setAttribute('y', '78');
    r.setAttribute('width', '4');
    r.setAttribute('height', '6');
    r.setAttribute('rx', '1');
    r.setAttribute('fill', colors[i % colors.length]);
    r.style.transformOrigin = '100px 80px';
    r.style.animation = `confettiFly${i} 1.5s ease-out forwards`;
    g.appendChild(r);

    // Dynamic keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFly${i} {
        0% { opacity:1; transform:translate(0,0) rotate(0deg); }
        100% { opacity:0; transform:translate(${tx}px,${ty}px) rotate(${360 + Math.random()*360}deg); }
      }`;
    document.head.appendChild(style);
  }
  setTimeout(() => { g.innerHTML = ''; }, 1800);
}

// ─── State ──────────────────────────────────────────────
const S = {
  day: 1, lives: MAX_LIVES, score: 0,
  record: parseInt(localStorage.getItem(RECORD_KEY)) || 0,
  carouselIndex: 0, actedThisTurn: false, swipeCount: 0,
  onboardingStep: 0, gameStarted: false, gameOver: false,
  macetas: [],
};

const EMPRESAS_NUEVAS = [
  { empresa: 'Climatec Sur', tipo: 'Empresa de climatización' },
  { empresa: 'Taller Hermanos Ruiz', tipo: 'Taller eléctrico familiar' },
  { empresa: 'ManpowerGroup (ETT)', tipo: 'ETT nacional' },
];
let empresaNuevaIdx = 0;

// ─── Candidatura Logic ──────────────────────────────────
function makeMaceta(empresa, tipo, fase, diasSinAccion, diasTotales, estadoVisual) {
  return { empresa, tipo, fase, diasSinAccion, diasTotales, riegosExtra: 0, estadoVisual, diasVacia: 0 };
}

function initMacetas() {
  return [
    makeMaceta('Instalaciones López', 'Pequeña empresa familiar', 'entrevistada', 0, 0, 'semilla'),
    makeMaceta('RandStaff (ETT)', 'ETT', 'entrevistada', 0, 0, 'semilla'),
    makeMaceta('Electrotec Servicios', 'Mediana empresa', 'agradecida', 2, 3, 'brote'),
  ];
}

// ─── Pista Text ─────────────────────────────────────────
function getPista(m) {
  if (!m) return '';
  if (m.fase === 'vacia') return 'Esta maceta está vacía. No tienes ninguna candidatura aquí.';
  if (m.fase === 'florecida') return `¡Has firmado con ${m.empresa}! Esta planta ha florecido.`;
  if (m.fase === 'marchita') return `La candidatura con ${m.empresa} se ha marchitado.`;
  if (m.fase === 'ahogada') return `Has agobiado a ${m.empresa}. La planta se ha ahogado.`;
  if (m.fase === 'cerrada') return 'Has cerrado esta candidatura. La maceta está libre para plantar.';
  if (m.fase === 'entrevistada') return `Hoy has tenido la entrevista con ${m.empresa}. Ha ido bien.`;
  if (m.fase === 'agradecida' && m.diasSinAccion <= 6) {
    const d = m.diasSinAccion;
    if (d === 0) return `Enviaste el agradecimiento a ${m.empresa}. Ahora toca esperar.`;
    return `Enviaste el agradecimiento a ${m.empresa}. Sin respuesta aún. ${d === 1 ? 'Ha pasado 1 día' : `Han pasado ${d} días`}.`;
  }
  if (m.fase === 'agradecida' && m.diasSinAccion === 7) return `Llevas 7 días sin saber nada de ${m.empresa}.`;
  if (m.fase === 'agradecida' && m.diasSinAccion > 7) return `Llevas ${m.diasSinAccion} días sin saber nada de ${m.empresa}.`;
  if (m.fase === 'esperando_confirmacion') {
    const d = m.diasSinAccion;
    return `${m.empresa} dijo que te llamaría. ${d === 1 ? 'Llevas 1 día' : `Llevas ${d} días`} esperando la confirmación.`;
  }
  if (m.fase === 'seguimiento_hecho') {
    const d = m.diasSinAccion;
    return `Hiciste seguimiento con ${m.empresa} hace ${d === 1 ? '1 día' : `${d} días`}. Siguen sin contestar.`;
  }
  if (m.fase === 'rechazo') return `${m.empresa} te ha dicho que no.`;
  return `Candidatura con ${m.empresa}.`;
}

// ─── Action Buttons ─────────────────────────────────────
function getActions(m, idx) {
  if (!m) return [];
  const a = [];

  switch (m.fase) {
    case 'entrevistada':
      a.push({ text: '💧 Enviar agradecimiento', type: 'regar', action: 'agradecer' });
      a.push({ text: '⏳ Ya escribiré mañana', type: 'esperar', action: 'posponer_agradecimiento' });
      break;
    case 'agradecida':
      if (m.diasSinAccion >= 7) {
        a.push({ text: '💧 Hacer seguimiento', type: 'regar', action: 'seguimiento' });
        a.push({ text: '⏳ Esperar más', type: 'esperar', action: 'esperar_seguimiento' });
        a.push({ text: '✕ Descartar candidatura', type: 'cerrar', action: 'descartar_pronto' });
      } else if (m.diasSinAccion === 6) {
        a.push({ text: '💧 Escribir, casi 7 días', type: 'regar', action: 'escribir_pronto' });
        a.push({ text: '⏳ Esperar, mañana hará 7', type: 'esperar', action: 'esperar_ok' });
      } else {
        a.push({ text: '💧 Escribir otra vez', type: 'regar', action: 'agobiar' });
        a.push({ text: '⏳ Esperar, aún no toca', type: 'esperar', action: 'esperar_ok' });
      }
      break;
    case 'esperando_confirmacion':
      if (m.diasSinAccion >= 7) {
        a.push({ text: '💧 Hacer seguimiento', type: 'regar', action: 'seguimiento_confirmacion' });
        a.push({ text: '⏳ Esperar más', type: 'esperar', action: 'esperar_confirmacion_tarde' });
      } else {
        a.push({ text: '💧 Llamar para preguntar', type: 'regar', action: 'llamar_pronto' });
        a.push({ text: '⏳ Esperar, ya dijeron que llamarían', type: 'esperar', action: 'esperar_ok' });
      }
      break;
    case 'seguimiento_hecho':
      if (m.diasSinAccion >= 7) {
        a.push({ text: '💧 Intentarlo una vez más', type: 'regar', action: 'insistir_final' });
        a.push({ text: '⏳ Seguir esperando', type: 'esperar', action: 'esperar_ghosteo' });
        a.push({ text: '✕ Cerrar y seguir buscando', type: 'cerrar', action: 'cerrar_14' });
      } else {
        a.push({ text: '💧 Insistir otra vez', type: 'regar', action: 'insistir' });
        a.push({ text: '⏳ Esperar, ya escribí', type: 'esperar', action: 'esperar_ok' });
      }
      break;
    case 'rechazo':
      a.push({ text: '💧 Preguntar qué hice mal', type: 'regar', action: 'preguntar_mal' });
      a.push({ text: '✕ Agradecer y cerrar', type: 'cerrar', action: 'cerrar_rechazo' });
      break;
    case 'vacia':
    case 'cerrada':
      a.push({ text: '🌱 Buscar nueva oportunidad', type: 'plantar', action: 'plantar' });
      a.push({ text: '⏳ Ya buscaré otro día', type: 'esperar', action: 'no_plantar' });
      break;
    case 'florecida':
    case 'marchita':
    case 'ahogada':
      // No actions
      break;
  }
  return a;
}

// ─── Action Resolution ──────────────────────────────────
const FEEDBACK = {
  posponer_agradecimiento: {
    titulo: '❌ Ya escribiré mañana',
    que: 'No has enviado el mensaje de agradecimiento el mismo día de la entrevista.',
    porque: 'El mensaje de agradecimiento se envía el mismo día. Máximo al día siguiente. Si esperas más, pierdes la oportunidad de dejar huella.',
    regla: 'Enviarlo el mismo día — máximo al día siguiente. Máximo 4 líneas.',
  },
  agobiar: {
    titulo: '❌ Has regado de más',
    que: 'Enviaste otro mensaje antes de que pasaran 7 días.',
    porque: 'Escribir otra vez tan pronto agobia. El reclutador tiene más procesos abiertos — tu mensaje puede esperar.',
    regla: 'Si no hay respuesta, espera 7 días. Ni uno menos.',
  },
  escribir_pronto: {
    titulo: '❌ Casi pero no',
    que: 'Has escrito el día 6. Falta un día para los 7.',
    porque: 'Hoy es el día 6. Espera a mañana — 7 días es 7 días.',
    regla: 'Seguimiento a los 7 días exactos. Ni antes.',
  },
  esperar_seguimiento: {
    titulo: '❌ Toca regar',
    que: 'No has hecho seguimiento cuando ya han pasado 7 días.',
    porque: 'Ya son 7 días. Toca escribir un mensaje breve de seguimiento.',
    regla: 'A los 7 días sin respuesta: un mensaje breve. "¿Hay novedades? Sigo interesado."',
  },
  descartar_pronto: {
    titulo: '❌ Aún no toca cerrar',
    que: 'Has descartado la candidatura sin agotar los intentos.',
    porque: 'Primero haz seguimiento — si no contestan tras el segundo intento, entonces cierras.',
    regla: 'Seguimiento al día 7. Cierre al día 14 sin respuesta.',
  },
  insistir: {
    titulo: '❌ Has regado de más',
    que: 'Insististe otra vez cuando ya habías hecho seguimiento.',
    porque: 'Ya escribiste hace pocos días. Insistir tan pronto transmite desesperación.',
    regla: 'Tras el seguimiento, espera otros 7 días. Si a los 14 sigue sin respuesta, cierras.',
  },
  insistir_final: {
    titulo: '❌ No insistas más',
    que: 'Intentaste contactar una tercera vez.',
    porque: 'Después de dos intentos sin respuesta, no insistir más. No quemes ese puente.',
    regla: 'Dos intentos máximo. Después, cierra esa candidatura y planta algo nuevo.',
  },
  esperar_ghosteo: {
    titulo: '❌ Toca cerrar',
    que: 'Sigues esperando después de 14 días y dos mensajes sin respuesta.',
    porque: 'Han pasado 14 días y dos intentos. No van a contestar.',
    regla: 'Después de dos intentos sin respuesta, cierra y sigue buscando.',
  },
  preguntar_mal: {
    titulo: '❌ No preguntes eso',
    que: 'Has preguntado "¿Qué hice mal?" tras un rechazo.',
    porque: 'Es incómodo para ellos y no cambia nada. Agradece, cierra, y sigue adelante.',
    regla: 'Ante un rechazo: agradecer, cerrar la candidatura, y seguir con las demás.',
  },
  llamar_pronto: {
    titulo: '❌ Aún no toca',
    que: 'Has llamado para preguntar antes de que pasen 7 días desde su mensaje.',
    porque: 'Dijeron que te llamarían la semana que viene. Espera al menos 7 días desde su mensaje antes de hacer seguimiento.',
    regla: 'Espera 7 días desde el último contacto antes de hacer seguimiento.',
  },
  esperar_confirmacion_tarde: {
    titulo: '❌ Toca hacer seguimiento',
    que: 'Llevas 7 días esperando la confirmación sin hacer seguimiento.',
    porque: 'Ya han pasado 7 días desde su último mensaje. Toca un seguimiento breve.',
    regla: 'A los 7 días: un mensaje breve de seguimiento.',
  },
  no_plantar: {
    titulo: '❌ Maceta vacía',
    que: 'No has buscado una nueva oportunidad teniendo macetas libres.',
    porque: 'Mientras esperas respuesta de las otras, sigue buscando.',
    regla: 'La regla: mientras esperas de A, buscas B, C y D. La búsqueda no para hasta contrato firmado.',
  },
};

function resolveAction(idx, action) {
  const m = S.macetas[idx];
  if (!m) return;

  // Correct actions
  const correctActions = [
    'agradecer', 'esperar_ok', 'seguimiento', 'cerrar_14', 'cerrar_rechazo',
    'plantar', 'seguimiento_confirmacion',
  ];
  const isCorrect = correctActions.includes(action);

  if (isCorrect) {
    handleCorrect(idx, action);
  } else {
    handleError(idx, action);
  }

  // Mark this maceta as checked for this turn
  S.checks[idx] = true;
  updateUI();

  // Auto-advance to next unchecked maceta after a short delay
  setTimeout(() => {
    const nextUnchecked = S.macetas.findIndex((m2, i2) => !S.checks[i2] && !['florecida', 'marchita', 'ahogada'].includes(m2.fase));
    if (nextUnchecked >= 0 && nextUnchecked !== S.carouselIndex) {
      S.carouselIndex = nextUnchecked;
      snapCarousel();
      updateDots();
      updatePista();
      updateActions();
    }
  }, 800);
}

function handleCorrect(idx, action) {
  const m = S.macetas[idx];
  let pts = 100;

  switch (action) {
    case 'agradecer':
      if (m.diasSinAccion > 0) pts = 50; // late
      m.fase = 'agradecida';
      m.diasSinAccion = 0;
      m.estadoVisual = 'brote';
      break;
    case 'esperar_ok':
      // No visual change, just correct
      break;
    case 'seguimiento':
      m.fase = 'seguimiento_hecho';
      m.diasSinAccion = 0;
      m.estadoVisual = 'grande';
      break;
    case 'seguimiento_confirmacion':
      m.fase = 'seguimiento_hecho';
      m.diasSinAccion = 0;
      m.estadoVisual = 'grande';
      break;
    case 'cerrar_14':
    case 'cerrar_rechazo':
      m.fase = 'vacia';
      m.empresa = null;
      m.tipo = null;
      m.estadoVisual = 'semilla';
      m.diasSinAccion = 0;
      m.diasTotales = 0;
      m.riegosExtra = 0;
      m.diasVacia = 0;
      break;
    case 'plantar':
      if (empresaNuevaIdx < EMPRESAS_NUEVAS.length) {
        const ne = EMPRESAS_NUEVAS[empresaNuevaIdx++];
        m.empresa = ne.empresa;
        m.tipo = ne.tipo;
      } else {
        m.empresa = 'Nueva empresa';
        m.tipo = 'Empresa';
      }
      m.fase = 'entrevistada';
      m.diasSinAccion = 0;
      m.diasTotales = 0;
      m.riegosExtra = 0;
      m.estadoVisual = 'semilla';
      m.diasVacia = 0;
      break;
  }

  S.score += pts;
  applyPlantState(idx, m.estadoVisual, true);
  showDestello(idx);
  showScorePopup(idx, `+${pts}`);
  burstFromPlant(true);
  showJesusToast(true);
  vibrate('success');
}

function handleError(idx, action) {
  const m = S.macetas[idx];
  const fb = FEEDBACK[action];

  // Apply damage
  if (['agobiar', 'escribir_pronto', 'insistir', 'insistir_final', 'llamar_pronto'].includes(action)) {
    m.riegosExtra++;
    if (m.riegosExtra >= 2) {
      m.fase = 'ahogada';
      m.estadoVisual = 'ahogada';
    }
  }
  if (action === 'posponer_agradecimiento') {
    // Will be handled in day advance
  }
  if (action === 'no_plantar') {
    m.diasVacia = (m.diasVacia || 0) + 1;
    if (m.diasVacia >= 3) {
      showCrack(idx);
    }
  }

  applyPlantState(idx, m.estadoVisual, true);
  showShake(idx);
  burstFromPlant(false);
  showJesusToast(false);
  vibrate('error');
  loseLife();

  // Show educational overlay
  if (fb) {
    showEduOverlay(fb);
  }
}

function loseLife() {
  if (S.lives <= 0) return;
  S.lives--;
  const hearts = $$('#hud-vidas .vida');
  const h = hearts[S.lives];
  if (h) h.classList.add('lost');

  if (S.lives <= 0) {
    setTimeout(showGameOver, 800);
  }
}

// ─── Events ─────────────────────────────────────────────
const EVENTS = {
  3: {
    text: 'Instalaciones López te escribe: "Nos ha gustado tu perfil. Te llamamos la semana que viene para concretar."',
    options: [
      { text: 'Dejar de buscar, la tengo', correct: false },
      { text: 'Genial, sigo con las demás', correct: true },
    ],
    feedback: 'Hasta que no hay contrato firmado, la búsqueda no para. Una promesa verbal no es un contrato.',
    onCorrect: (m) => { m[0].fase = 'esperando_confirmacion'; m[0].diasSinAccion = 0; m[0].estadoVisual = 'pequena'; },
  },
  5: {
    text: 'Te apetece escribir a RandStaff un mensaje largo explicando por qué quieres el puesto.',
    options: [
      { text: 'Escribir el mensaje largo', correct: false },
      { text: 'No, mejor espero al día 7', correct: true },
    ],
    feedback: 'Los mensajes largos agobian. Si no han pasado 7 días, espera. Cuando escribas, máximo 4 líneas.',
  },
  7: {
    text: 'Un colega te dice: "¿No te han dicho nada de RandStaff? Yo llamaría ya."',
    options: [
      { text: 'Tiene razón, llamo', correct: false },
      { text: 'No, aún no toca', correct: true },
    ],
    feedback: 'Que un colega te meta prisa no cambia la regla. 7 días. El seguimiento tiene su ritmo.',
  },
  8: {
    text: 'Electrotec te escribe: "Gracias por tu interés, pero hemos elegido a otro candidato."',
    options: [
      { text: 'Preguntar qué hice mal', correct: false },
      { text: 'Agradecer y cerrar', correct: true },
    ],
    feedback: 'No preguntes qué hiciste mal. Es incómodo para ellos y no cambia nada. Agradece, cierra, y sigue adelante.',
    onCorrect: (m) => { m[2].fase = 'rechazo'; m[2].estadoVisual = 'marchita'; },
    onWrong: (m) => { m[2].fase = 'rechazo'; m[2].estadoVisual = 'marchita'; },
  },
  10: {
    text: 'Han pasado 14 días y dos mensajes. RandStaff no ha contestado a nada.',
    options: [
      { text: 'Intentarlo una última vez', correct: false },
      { text: 'Cerrar y plantar nueva semilla', correct: true },
    ],
    feedback: 'Después de dos intentos sin respuesta, no insistir más. Cierra esa maceta y planta algo nuevo.',
    onCorrect: (m) => {
      m[1].fase = 'vacia'; m[1].empresa = null; m[1].tipo = null;
      m[1].estadoVisual = 'semilla'; m[1].diasSinAccion = 0; m[1].diasVacia = 0;
    },
  },
  12: {
    text: 'Instalaciones López te llama: "¡Te queremos! ¿Cuándo puedes empezar?"',
    options: [
      { text: 'Firmar y declinar las demás educadamente', correct: true },
      { text: 'Esperar a ver si las demás también ofrecen', correct: false },
    ],
    feedback: 'Cuando llega una oferta buena, se acepta. Las demás se declinan educadamente. No dejes esperando a nadie.',
    onCorrect: (m) => {
      m[0].fase = 'florecida'; m[0].estadoVisual = 'flor';
    },
  },
  14: {
    text: 'Miras tu jardín. Has aprendido a cuidar cada planta a su ritmo. Eso es lo que importa.',
    options: null,
  },
};

function checkEvent() {
  const evt = EVENTS[S.day];
  if (!evt) return false;

  if (!evt.options) {
    // Narrative only
    showEventModal(evt.text, null, () => {
      if (S.day >= MAX_DAYS - 1) {
        setTimeout(showResults, 500);
      }
    });
    return true;
  }

  showEventModal(evt.text, evt.options, (chosen) => {
    if (chosen.correct) {
      S.score += 100;
      showScorePopup(S.carouselIndex, '+100');
      vibrate('success');
      if (evt.onCorrect) {
        evt.onCorrect(S.macetas);
        S.macetas.forEach((m, i) => applyPlantState(i, m.estadoVisual, true));
        // Special: if plant flowers, show confetti
        // Check if a plant just flowered → game ends with success
        const flowered = S.macetas.find(m2 => m2.fase === 'florecida');
        if (flowered) {
          const flIdx = S.macetas.indexOf(flowered);
          S.carouselIndex = flIdx;
          snapCarousel();
          applyPlantState(flIdx, 'flor', true);
          setTimeout(() => {
            showConfetti(flIdx);
            showDestello(flIdx);
            burstFromPlant(true);
            vibrate('success', [0, 100, 50, 100, 50, 200]);
          }, 300);
          setTimeout(() => showResults(), 2500);
          return;
        }
      }
    } else {
      vibrate('error');
      loseLife();
      if (evt.onWrong) {
        evt.onWrong(S.macetas);
        S.macetas.forEach((m, i) => applyPlantState(i, m.estadoVisual, true));
      }
      showEduOverlay({
        titulo: '❌ Decisión incorrecta',
        que: `Elegiste: "${chosen.text}"`,
        porque: evt.feedback,
        regla: 'Recuerda las reglas del jardín de Jesús.',
      });
    }
    updateUI();
  });
  return true;
}

// ─── UI Updates ─────────────────────────────────────────
function updateUI() {
  updateHUD();
  updateDots();
  updatePista();
  updateActions();
  updateNextDayBtn();
}

function updateHUD() {
  $('#hud-dia').textContent = `DÍA ${S.day} de ${MAX_DAYS}`;
}

function updateDots() {
  $$('#carousel-dots .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === S.carouselIndex);
    dot.classList.toggle('checked', S.checks[i] === true);
    const m = S.macetas[i];
    const needsAtt = m && !S.checks[i] && !['florecida', 'marchita', 'ahogada'].includes(m.fase);
    dot.classList.toggle('needs-attention', needsAtt && i !== S.carouselIndex);
  });
}

function needsAttention(m) {
  if (m.fase === 'entrevistada') return true;
  if (m.fase === 'agradecida' && m.diasSinAccion >= 7) return true;
  if (m.fase === 'esperando_confirmacion' && m.diasSinAccion >= 7) return true;
  if (m.fase === 'seguimiento_hecho' && m.diasSinAccion >= 7) return true;
  if (m.fase === 'rechazo') return true;
  if ((m.fase === 'vacia' || m.fase === 'cerrada') && m.diasVacia >= 2) return true;
  return false;
}

function updatePista() {
  const m = S.macetas[S.carouselIndex];
  $('#pista-text').textContent = getPista(m);
}

function updateActions() {
  const m = S.macetas[S.carouselIndex];
  const container = $('#actions');
  container.innerHTML = '';
  const questionLabel = $('#question-label');
  questionLabel.style.display = 'none';

  // If already acted this turn, show confirmation
  if (S.checks[S.carouselIndex]) {
    const done = document.createElement('p');
    done.className = 'check-done';
    done.textContent = '✅ Planta atendida';
    container.appendChild(done);
    return;
  }

  // Dead/finished plants — auto-check
  if (['florecida', 'marchita', 'ahogada'].includes(m.fase)) {
    S.checks[S.carouselIndex] = true;
    return;
  }

  // If action options are open (player pressed "Realizar acción")
  if (S.showingOptions === S.carouselIndex) {
    questionLabel.textContent = '¿Qué hacer?';
    questionLabel.style.display = 'block';
    const actions = getActions(m, S.carouselIndex);
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = `btn-action ${a.type}`;
      btn.textContent = a.text;
      btn.addEventListener('click', () => {
        vibrate('light');
        S.showingOptions = -1;
        resolveAction(S.carouselIndex, a.action);
      });
      container.appendChild(btn);
    });
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-action esperar';
    cancelBtn.textContent = '← Volver';
    cancelBtn.addEventListener('click', () => {
      vibrate('light');
      S.showingOptions = -1;
      updateActions();
    });
    container.appendChild(cancelBtn);
    return;
  }

  // Default: show "Realizar acción" button
  const btn = document.createElement('button');
  btn.className = 'btn-action regar';
  btn.textContent = '🌱 Realizar acción';
  btn.addEventListener('click', () => {
    vibrate('light');
    S.showingOptions = S.carouselIndex;
    updateActions();
  });
  container.appendChild(btn);
}

function getNeglectedPlants() {
  // Plants that NEEDED action this turn but didn't get it
  const neglected = [];
  S.macetas.forEach((m, i) => {
    if (S.checks[i]) return;
    if (['florecida', 'marchita', 'ahogada'].includes(m.fase)) return;
    // These phases require action
    if (m.fase === 'entrevistada') neglected.push(i);
    if (m.fase === 'agradecida' && m.diasSinAccion >= 7) neglected.push(i);
    if (m.fase === 'esperando_confirmacion' && m.diasSinAccion >= 7) neglected.push(i);
    if (m.fase === 'seguimiento_hecho' && m.diasSinAccion >= 7) neglected.push(i);
    if (m.fase === 'rechazo') neglected.push(i);
    if ((m.fase === 'vacia' || m.fase === 'cerrada') && (m.diasVacia || 0) >= 3) neglected.push(i);
  });
  return neglected;
}

function updateNextDayBtn() {
  const btn = $('#btn-next-day');
  if (!S.gameOver) {
    btn.style.display = 'block';
  } else {
    btn.style.display = 'none';
  }
}

// ─── Overlays ───────────────────────────────────────────
function showEduOverlay(fb) {
  $('#edu-titulo').textContent = fb.titulo;
  $('#edu-que').textContent = fb.que;
  $('#edu-porque').textContent = fb.porque;
  $('#edu-regla').textContent = fb.regla;
  $('#overlay-edu').style.display = 'flex';
}

function showEventModal(text, options, callback) {
  $('#modal-evento-text').textContent = text;
  const container = $('#modal-evento-options');
  container.innerHTML = '';

  if (!options) {
    const btn = document.createElement('button');
    btn.className = 'btn-action regar';
    btn.textContent = 'Continuar';
    btn.addEventListener('click', () => {
      vibrate('light');
      $('#modal-evento').style.display = 'none';
      if (callback) callback();
    });
    container.appendChild(btn);
  } else {
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `btn-action ${opt.correct ? 'regar' : 'esperar'}`;
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        vibrate('light');
        $('#modal-evento').style.display = 'none';
        if (callback) callback(opt);
      });
      container.appendChild(btn);
    });
  }

  $('#modal-evento').style.display = 'flex';
  vibrate('medium');
}

// ─── Jesús Toast ────────────────────────────────────────
const JESUS_SUCCESS_MSGS = [
  '¡Así se hace! Justo a tiempo.',
  'Bien cuidada. Eso es tener ojo.',
  'Esa planta va a crecer fuerte.',
  'Buen timing. Ni antes ni después.',
  '¡Perfecto! Sigue así.',
  'Eso es regar con cabeza.',
];
const JESUS_ERROR_MSGS = [
  'Ojo, que esa planta sufre.',
  'Eso no era lo que tocaba...',
  'Cuidado, vas a perder esa.',
  'Para. Piensa antes de regar.',
  'Esa no necesitaba eso.',
  'Recuerda las reglas del jardín.',
];

let jesusToastTimer = null;

function showJesusToast(isCorrect) {
  const toast = $('#jesus-toast');
  const img = $('#jesus-toast-img');
  const text = $('#jesus-toast-text');

  if (isCorrect) {
    // Only show 40% of the time on success
    if (Math.random() > 0.4) return;
    img.src = 'assets/jesus_celebrating.png';
    text.textContent = JESUS_SUCCESS_MSGS[Math.floor(Math.random() * JESUS_SUCCESS_MSGS.length)];
  } else {
    // Always show on error
    img.src = 'assets/jesus_worried.png';
    text.textContent = JESUS_ERROR_MSGS[Math.floor(Math.random() * JESUS_ERROR_MSGS.length)];
  }

  // Clear previous timer
  if (jesusToastTimer) clearTimeout(jesusToastTimer);

  toast.style.display = 'flex';
  requestAnimationFrame(() => toast.classList.add('visible'));

  jesusToastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.style.display = 'none'; }, 400);
  }, 3000);
}

function showReminder(text) {
  // Remove existing reminder
  const existing = $('.reminder-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'reminder-toast';
  toast.textContent = text;
  $('#play').appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ─── ASMR Particle System ───────────────────────────────
let asmrParts = [];
let asmrRafId = null;
let asmrCv, asmrCtx;

function initAsmr() {
  asmrCv = document.getElementById('asmr-canvas');
  if (!asmrCv) return;
  asmrCtx = asmrCv.getContext('2d');
  asmrResize();
  window.addEventListener('resize', asmrResize);
}

function asmrResize() {
  if (!asmrCv) return;
  asmrCv.width = window.innerWidth;
  asmrCv.height = window.innerHeight;
}

function asmrBurst(x, y, isCorrect) {
  if (!asmrCtx) return;
  const colors = isCorrect
    ? ['#04FFB4', '#00E6BC', '#FFFFAB', '#C5FFDF', '#FDD835']
    : ['#E74C3C', '#FF7675', '#FFFFAB'];
  const count = isCorrect ? 28 : 16;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const speed = isCorrect ? 3 + Math.random() * 4 : 2 + Math.random() * 2.5;
    asmrParts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isCorrect ? 2 : 0),
      r: isCorrect ? 3.5 + Math.random() * 3 : 2.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: isCorrect ? 0.018 + Math.random() * 0.015 : 0.035 + Math.random() * 0.02,
    });
  }
  if (!asmrRafId) asmrLoop();
}

function asmrLoop() {
  if (!asmrCtx) return;
  asmrCtx.clearRect(0, 0, asmrCv.width, asmrCv.height);
  asmrParts = asmrParts.filter(p => p.alpha > 0.02);
  asmrParts.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // gravity
    p.alpha -= p.decay;
    asmrCtx.globalAlpha = Math.max(0, p.alpha);
    asmrCtx.beginPath();
    asmrCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    asmrCtx.fillStyle = p.color;
    asmrCtx.fill();
  });
  asmrCtx.globalAlpha = 1;
  asmrRafId = asmrParts.length ? requestAnimationFrame(asmrLoop) : null;
}

function burstFromPlant(isCorrect) {
  // Get center of the active plant SVG
  const svg = $(`.carousel-slide.active svg`);
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height * 0.35; // burst from upper part of plant
  asmrBurst(x, y, isCorrect);
}

function showScorePopup(idx, text) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  popup.style.left = '50%';
  popup.style.top = '40%';
  popup.style.transform = 'translateX(-50%)';
  $('#play').appendChild(popup);
  setTimeout(() => popup.remove(), 1100);
}

// ─── Day Transition ─────────────────────────────────────
function transitionDay(callback) {
  // Create stars if needed
  const estrellas = $('.estrellas');
  if (!estrellas.children.length) {
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('div');
      s.className = 'estrella';
      s.style.left = `${15 + Math.random() * 70}%`;
      s.style.top = `${5 + Math.random() * 35}%`;
      s.style.width = `${2 + Math.random() * 2}px`;
      s.style.height = s.style.width;
      s.style.transitionDelay = `${i * 0.08}s`;
      estrellas.appendChild(s);
    }
  }

  const sol = $('.sol');
  const luna = $('.luna');

  // 1. Sol sale por la izquierda
  sol.classList.add('exit-left');
  $('.overlay-noche').classList.add('visible');

  setTimeout(() => {
    // 2. Luna entra por la derecha + estrellas
    luna.classList.add('enter-right');
    $('.estrellas').classList.add('visible');
    estrellas.querySelectorAll('.estrella').forEach(s => s.classList.add('visible'));

    setTimeout(() => {
      // 3. Advance day counter
      advanceDay();
      const hudDia = $('#hud-dia');
      hudDia.style.opacity = '0';
      setTimeout(() => {
        hudDia.textContent = `DÍA ${S.day} de ${MAX_DAYS}`;
        hudDia.style.opacity = '1';
      }, 200);

      setTimeout(() => {
        // 4. Luna sale por la izquierda + oscuridad se va
        luna.classList.remove('enter-right');
        luna.classList.add('exit-left');
        $('.estrellas').classList.remove('visible');
        estrellas.querySelectorAll('.estrella').forEach(s => s.classList.remove('visible'));
        $('.overlay-noche').classList.remove('visible');

        setTimeout(() => {
          // 5. Sol entra por la izquierda (amanecer)
          sol.classList.remove('exit-left');
          sol.classList.add('enter-left');
          luna.classList.remove('exit-left');

          setTimeout(() => {
            // 6. Sol vuelve a posición normal
            sol.classList.remove('enter-left');
            vibrate('light');
            if (callback) callback();
          }, 400);
        }, 300);
      }, 600);
    }, 400);
  }, 400);
}

function advanceDay() {
  S.day++;
  S.checks = [false, false, false];
  S.showingOptions = -1;
  S.reminderShown = false;
  // Update maceta states
  S.macetas.forEach((m, i) => {
    if (['florecida', 'marchita', 'ahogada'].includes(m.fase)) return;

    m.diasSinAccion++;
    m.diasTotales++;

    if (m.fase === 'vacia' || m.fase === 'cerrada') {
      m.diasVacia = (m.diasVacia || 0) + 1;
    }

    // Auto-growth for healthy plants between states
    if (m.fase === 'agradecida' && m.estadoVisual === 'brote' && m.diasTotales >= 4) {
      m.estadoVisual = 'pequena';
    }

    // Check for neglect deaths
    if (m.fase === 'entrevistada' && m.diasSinAccion >= 3) {
      m.fase = 'marchita';
      m.estadoVisual = 'marchita';
      loseLife();
    }
    if (m.fase === 'agradecida' && m.diasSinAccion >= 11) {
      m.fase = 'marchita';
      m.estadoVisual = 'marchita';
      loseLife();
    }
    if ((m.fase === 'vacia' || m.fase === 'cerrada') && m.diasVacia >= 4) {
      showCrack(i);
      if (m.diasVacia === 4) loseLife();
    }

    applyPlantState(i, m.estadoVisual, false);
  });
}

// ─── Carousel ───────────────────────────────────────────
let touchStartX = 0, touchCurrentX = 0, isDragging = false;

function setupCarousel() {
  const carousel = $('#carousel');
  if (!carousel) return;

  carousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    isDragging = true;
    $('#carousel-track').style.transition = 'none';
  }, { passive: true });

  carousel.addEventListener('touchmove', e => {
    if (!isDragging) return;
    touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX;
    const baseOffset = getCarouselOffset();
    let drag = diff;
    if ((S.carouselIndex === 0 && diff > 0) || (S.carouselIndex === S.macetas.length - 1 && diff < 0)) {
      drag = diff * 0.3;
    }
    $('#carousel-track').style.transform = `translateX(-${baseOffset - drag}px)`;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const diff = touchCurrentX - touchStartX;
    if (diff < -50 && S.carouselIndex < S.macetas.length - 1) { S.carouselIndex++; S.swipeCount++; }
    else if (diff > 50 && S.carouselIndex > 0) { S.carouselIndex--; S.swipeCount++; }
    S.showingOptions = -1; // Close options when swiping
    snapCarousel();
    updateDots();
    updatePista();
    updateActions();
    vibrate('light');
  });

  // Mouse fallback
  carousel.addEventListener('mousedown', e => {
    touchStartX = e.clientX; touchCurrentX = touchStartX; isDragging = true;
    $('#carousel-track').style.transition = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    touchCurrentX = e.clientX;
    const diff = touchCurrentX - touchStartX;
    const baseOffset = getCarouselOffset();
    let drag = diff;
    if ((S.carouselIndex === 0 && diff > 0) || (S.carouselIndex === S.macetas.length - 1 && diff < 0)) drag = diff * 0.3;
    $('#carousel-track').style.transform = `translateX(-${baseOffset - drag}px)`;
  });
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const diff = touchCurrentX - touchStartX;
    if (diff < -50 && S.carouselIndex < S.macetas.length - 1) { S.carouselIndex++; S.swipeCount++; }
    else if (diff > 50 && S.carouselIndex > 0) { S.carouselIndex--; S.swipeCount++; }
    S.showingOptions = -1;
    snapCarousel();
    updateDots();
    updatePista();
    updateActions();
  });
}

const SLIDE_W = 220; // px per slide

function getSlideWidth() {
  return SLIDE_W;
}

function getCarouselOffset() {
  const containerW = $('#carousel').offsetWidth || 375;
  const sw = getSlideWidth();
  // +1 because of ghost slide at start
  const trackIndex = S.carouselIndex + 1;
  return trackIndex * sw - (containerW - sw) / 2;
}

function snapCarousel() {
  const track = $('#carousel-track');
  const offset = getCarouselOffset();
  track.style.transition = 'transform 0.3s ease-out';
  track.style.transform = `translateX(-${offset}px)`;

  // Set slide widths and active/side classes
  const trackIndex = S.carouselIndex + 1; // +1 for ghost
  $$('.carousel-slide').forEach((slide, i) => {
    slide.style.width = `${SLIDE_W}px`;
    slide.style.minWidth = `${SLIDE_W}px`;
    slide.classList.toggle('active', i === trackIndex);
    slide.classList.toggle('side', i !== trackIndex);
  });

  // Swipe hint always visible
}

// ─── Onboarding ─────────────────────────────────────────
const OB_STEPS = [
  {
    text: 'Cuando te entrevistan, manda un mensaje de agradecimiento ese mismo día. Corto, concreto, sin preguntar si han decidido. Eso es regar a tiempo.',
    fromState: 'brote', toState: 'pequena', effect: 'destello',
  },
  {
    text: 'Si no te contestan, espera. No llames cada dos días ni mandes mensajes largos. Eso es regar de más — y ahoga la planta.',
    fromState: 'pequena', toState: 'ahogada', effect: 'shake',
  },
  {
    text: 'Si pasan 7 días sin respuesta, un mensaje breve: "¿Hay novedades? Sigo interesado." Si a los 14 sigue sin respuesta, cierra esa maceta.',
    fromState: 'pequena', toState: 'grande', effect: 'destello',
  },
  {
    text: 'Mientras esperas respuesta de unas, sigue buscando otras. Cada maceta vacía es una oportunidad que no estás aprovechando. La búsqueda no para hasta contrato firmado.',
    fromState: 'semilla', toState: 'brote', effect: 'destello',
  },
];

function startOnboarding() {
  S.onboardingStep = 0;
  showScreen('#onboarding');
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const step = OB_STEPS[S.onboardingStep];
  if (!step) return;

  $('#onboarding-text').textContent = step.text;

  // Update dots
  $$('.ob-dot').forEach((d, i) => d.classList.toggle('active', i === S.onboardingStep));

  // Render plant
  const container = $('#onboarding-plant');
  container.innerHTML = buildPlantSVG('ob');

  // Set initial state
  requestAnimationFrame(() => {
    applyPlantState('ob', step.fromState, false);
    // Animate to target after delay
    setTimeout(() => {
      applyPlantState('ob', step.toState, true);
      if (step.effect === 'destello') showDestello('ob');
      if (step.effect === 'shake') showShake('ob');
    }, 600);
  });

  // Button text
  const btn = $('#btn-onboarding-next');
  btn.textContent = S.onboardingStep < OB_STEPS.length - 1 ? 'Siguiente' : 'Empezar';
}

function advanceOnboarding() {
  S.onboardingStep++;
  if (S.onboardingStep >= OB_STEPS.length) {
    // Transition text
    $('#onboarding-text').textContent = 'A partir de aquí, tú decides. Cuida tu jardín.';
    $('#btn-onboarding-next').textContent = '🌱 Empezar';
    $$('.ob-dot').forEach(d => d.classList.remove('active'));

    setTimeout(() => {
      startGameplay();
    }, 200);
    return;
  }
  renderOnboardingStep();
}

// ─── Gameplay Start ─────────────────────────────────────
function startGameplay() {
  S.gameStarted = true;
  S.gameOver = false;
  showScreen('#play');

  // Build carousel with ghost slides at edges
  const track = $('#carousel-track');
  track.innerHTML = '';

  // Ghost slide at start (empty, just for peek)
  const ghostStart = document.createElement('div');
  ghostStart.className = 'carousel-slide ghost';
  ghostStart.innerHTML = '<div style="width:192px;height:300px"></div>';
  track.appendChild(ghostStart);

  // Real slides
  S.macetas.forEach((m, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.dataset.realIndex = i;
    slide.innerHTML = buildPlantSVG(i);
    track.appendChild(slide);
  });

  // Ghost slide at end
  const ghostEnd = document.createElement('div');
  ghostEnd.className = 'carousel-slide ghost';
  ghostEnd.innerHTML = '<div style="width:192px;height:300px"></div>';
  track.appendChild(ghostEnd);

  // Apply initial states
  requestAnimationFrame(() => {
    S.macetas.forEach((m, i) => applyPlantState(i, m.estadoVisual, false));
    S.carouselIndex = 0;
    snapCarousel();
    updateUI();

    // Check for day 1 events
    checkEvent();
  });
}

// ─── Results ────────────────────────────────────────────
function showResults() {
  S.gameOver = true;
  document.documentElement.classList.add('results');
  showScreen('#results');

  // Build result plants
  const container = $('#results-plants');
  container.innerHTML = '';
  S.macetas.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'results-plant-item';
    div.innerHTML = buildPlantSVG(`r${i}`);
    container.appendChild(div);
  });

  requestAnimationFrame(() => {
    S.macetas.forEach((m, i) => {
      setTimeout(() => {
        applyPlantState(`r${i}`, m.estadoVisual, true);
        if (m.estadoVisual === 'flor') {
          setTimeout(() => showConfetti(`r${i}`), 400);
        }
      }, i * 400);
    });
  });

  // Score count-up
  const ptsEl = $('#results-pts');
  let current = 0;
  const target = S.score;
  const step = Math.max(1, Math.ceil(target / 40));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    ptsEl.textContent = current;
    if (current >= target) {
      clearInterval(interval);
      vibrate('success');
    }
  }, 30);

  // Record
  const isNewRecord = S.score > S.record;
  if (isNewRecord) {
    S.record = S.score;
    localStorage.setItem(RECORD_KEY, S.record);
  }
  const recordEl = $('#results-record');
  recordEl.innerHTML = isNewRecord
    ? `<span class="new-record">¡Nuevo récord! ${S.record} pts</span>`
    : `Récord: ${S.record} pts`;

  // Tier
  let avatar, message;
  if (S.score >= 700) {
    avatar = 'assets/jesus_celebrating.png';
    message = 'He visto tu balcón. Está precioso. Ya no me necesitas.';
  } else if (S.score >= 500) {
    avatar = 'assets/jesus_happy.png';
    message = 'Buen jardín. Algunas plantas necesitaban más atención, pero vas por buen camino.';
  } else {
    avatar = 'assets/jesus_worried.png';
    message = 'Hay trabajo que hacer. Repasa cuándo regar y cuándo esperar — es cuestión de timing.';
  }
  $('#results-avatar').src = avatar;
  $('#results-message').textContent = message;

  // TASK_COMPLETED
  if (S.score >= TASK_THRESHOLD) {
    taskCompleted();
    vibrate('success', [0, 100, 50, 100, 50, 100, 50, 300]);
  }
}

function showGameOver() {
  S.gameOver = true;
  document.documentElement.classList.add('results');
  showScreen('#results');

  $('#results-titulo').textContent = 'Game Over';

  const container = $('#results-plants');
  container.innerHTML = '';
  S.macetas.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'results-plant-item';
    div.innerHTML = buildPlantSVG(`go${i}`);
    container.appendChild(div);
  });
  requestAnimationFrame(() => {
    S.macetas.forEach((m, i) => applyPlantState(`go${i}`, m.estadoVisual, false));
  });

  $('#results-pts').textContent = S.score;
  $('#results-record').textContent = `Récord: ${S.record} pts`;
  $('#results-avatar').src = 'assets/jesus_worried.png';
  $('#results-message').textContent = 'Se te han muerto demasiadas plantas. Recuerda: regar a tiempo, no regar de más, y siempre seguir plantando.';
}

// ─── Init & Events ──────────────────────────────────────
function init() {
  S.day = 1;
  S.lives = MAX_LIVES;
  S.score = 0;
  S.carouselIndex = 0;
  S.actedThisTurn = false;
  S.swipeCount = 0;
  S.onboardingStep = 0;
  S.gameStarted = false;
  S.gameOver = false;
  S.reminderShown = false;
  S.checks = [false, false, false];
  S.showingOptions = -1;
  empresaNuevaIdx = 0;
  S.macetas = initMacetas();
  S.record = parseInt(localStorage.getItem(RECORD_KEY)) || 0;
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  initAsmr();
  setupCarousel();

  $('#btn-start').addEventListener('click', () => {
    vibrate('light');
    startOnboarding();
  });

  $('#btn-onboarding-next').addEventListener('click', () => {
    vibrate('light');
    advanceOnboarding();
  });

  $('#btn-next-day').addEventListener('click', () => {
    vibrate('light');

    // Check for neglected plants
    const neglected = getNeglectedPlants();
    if (neglected.length > 0) {
      vibrate('error');
      // Navigate to first neglected plant
      S.carouselIndex = neglected[0];
      snapCarousel();
      updateDots();
      updatePista();
      updateActions();
      // Show error
      const m = S.macetas[neglected[0]];
      const name = m.empresa || 'esta maceta';
      showEduOverlay({
        titulo: '❌ Hay plantas que necesitan atención',
        que: `No has hecho nada con ${name} y lo necesitaba.`,
        porque: 'Cada planta representa una candidatura. Si no las cuidas a tiempo, se marchitan.',
        regla: 'Revisa todas tus plantas antes de pasar de día. Desliza para verlas todas.',
      });
      loseLife();
      return;
    }

    $('#btn-next-day').style.display = 'none';

    if (S.day >= MAX_DAYS) {
      showResults();
      return;
    }

    transitionDay(() => {
      S.macetas.forEach((m, i) => applyPlantState(i, m.estadoVisual, false));
      updateUI();
      if (!checkEvent()) {
        // No event, normal turn
      }
    });
  });

  $('#btn-retry').addEventListener('click', () => {
    vibrate('light');
    document.documentElement.classList.remove('results');
    init();
    startGameplay();
  });

  $('#btn-entendido').addEventListener('click', () => {
    vibrate('light');
    $('#overlay-edu').style.display = 'none';
  });
});
