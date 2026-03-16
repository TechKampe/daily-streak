/* =============================================
   TORNEO MTG: LA GRAN FINAL — game.js
   Kampe Daily Streak
   ============================================= */

'use strict';

/* =============================================
   DECK — 10 cartas de Fase 1 (sin cambios)
   ============================================= */

const DECK = [
  {
    id: 'compresor',
    nombre: 'Compresor',
    lado: 'caliente',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675473/card_compresor_anufur.png'
  },
  {
    id: 'evaporador',
    nombre: 'Evaporador',
    lado: 'frio',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_evaporador_aioivc.png'
  },
  {
    id: 'condensador',
    nombre: 'Condensador',
    lado: 'caliente',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_condensador_ihp9uo.png'
  },
  {
    id: 'vent_interior',
    nombre: 'Ventilador interior',
    lado: 'frio',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_ventilador_interior_ed6asq.png'
  },
  {
    id: 'tuberia',
    nombre: 'Tubería frigorífica',
    lado: 'ambos',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_tuberia_adw4m6.png'
  },
  {
    id: 'vent_exterior',
    nombre: 'Ventilador exterior',
    lado: 'caliente',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_ventilador_exterior_yhp7uu.png'
  },
  {
    id: 'filtro',
    nombre: 'Filtro',
    lado: 'frio',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_filtro_djokew.png'
  },
  {
    id: 'drenaje',
    nombre: 'Tubo de drenaje',
    lado: 'frio',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_drenaje_olqzwv.png'
  },
  {
    id: 'placa',
    nombre: 'Placa electrónica',
    lado: 'frio',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675472/card_placa_dzjesb.png'
  },
  {
    id: 'cable',
    nombre: 'Cable eléctrico',
    lado: 'ambos',
    art: 'https://res.cloudinary.com/kampe/image/upload/w_160,f_auto,q_auto/v1773675473/card_cable_zwpu9x.png'
  }
];

/* =============================================
   ROUNDS — 7 escenarios (0 = tutorial)
   ============================================= */

const ROUNDS = [
  /* ---- Ronda 0: Tutorial ---- */
  {
    bannerTitle: 'Tutorial',
    bannerSub: 'Meses sin limpiar — ¿qué está obstruido?',
    error: {
      name: 'El aire apenas sale',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682054/error_filtro_fy0dkb.jpg',
      consequence: 'Caudal · Confort',
      scenario: 'La unidad interior lleva meses sin mantenimiento. El flujo de aire es mínimo. El cliente lleva semanas quejándose del calor.',
      check: 'Limpieza'
    },
    correctIds: ['filtro'],
    hand: ['filtro', 'vent_interior', 'evaporador', 'placa', 'drenaje'],
    feedback: {
      extra: {
        vent_interior: 'El ventilador interior mueve el aire, pero no lo obstruye.',
        evaporador: 'El evaporador enfría el aire, pero no es la causa de la pérdida de caudal.',
        placa: 'La placa gestiona el sistema; no afecta al caudal de aire directamente.',
        drenaje: 'El tubo de drenaje evacúa el agua condensada; no tiene relación con el caudal de aire.'
      },
      missed: {
        filtro: 'El filtro obstruido es la causa directa de la pérdida de caudal. Es el primer componente a revisar en cualquier problema de flujo de aire.'
      },
      rule: 'Un filtro sucio puede reducir el caudal hasta un 40%. La limpieza periódica es el mantenimiento más básico y más olvidado.'
    }
  },

  /* ---- Ronda 1: Ubicación interior ---- */
  {
    bannerTitle: 'El aire no llega al fondo',
    bannerSub: '¿Qué componentes están implicados?',
    error: {
      name: 'El aire no llega al fondo',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682054/error_ubicacion_interior_kzanho.jpg',
      consequence: 'Temperatura · Distribución',
      scenario: 'La unidad interior se instaló en un rincón mal estudiado. El chorro de aire no alcanza la zona de trabajo. Un lado de la sala siempre tiene más calor.',
      check: 'Ubicación'
    },
    correctIds: ['evaporador', 'vent_interior'],
    hand: ['evaporador', 'vent_interior', 'filtro', 'vent_exterior', 'compresor'],
    feedback: {
      extra: {
        filtro: 'El filtro afecta al caudal, pero no a la distribución espacial del aire.',
        vent_exterior: 'El ventilador exterior trabaja en la unidad exterior y no participa en la distribución interior.',
        compresor: 'El compresor está en la unidad exterior y no interviene en la distribución del aire interior.'
      },
      missed: {
        evaporador: 'La unidad evaporadora ES la unidad interior al completo. Si está mal ubicada, no puede absorber el calor de toda la sala.',
        vent_interior: 'El ventilador interior distribuye el aire frío. Una posición incorrecta limita su radio de acción.'
      },
      rule: 'La unidad interior debe instalarse donde el chorro de aire alcance la zona de uso, sin obstáculos en su trayectoria y a la altura correcta. Un check visual antes de fijar salva la instalación.'
    }
  },

  /* ---- Ronda 2: Ubicación exterior ---- */
  {
    bannerTitle: 'La unidad exterior se asfixia',
    bannerSub: '¿Qué componentes están implicados?',
    error: {
      name: 'El split no rinde en verano',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682053/error_ubicacion_exterior_pgt8ek.jpg',
      consequence: 'Rendimiento · Eficiencia',
      scenario: 'La unidad exterior quedó encajonada entre dos paredes. El calor no se disipa. En los días de verano el sistema entra en protección y el consumo se disparó.',
      check: 'Ubicación'
    },
    correctIds: ['compresor', 'condensador', 'vent_exterior'],
    hand: ['compresor', 'condensador', 'vent_exterior', 'cable', 'tuberia'],
    feedback: {
      extra: {
        cable: 'El cable alimenta la unidad exterior, pero no interviene en la disipación de calor.',
        tuberia: 'La tubería frigorífica conecta ambas unidades, pero no participa en la disipación de calor al exterior.'
      },
      missed: {
        compresor: 'El compresor se sobrecarga cuando no puede disipar el calor. Necesita espacio libre para trabajar dentro de sus parámetros.',
        condensador: 'El condensador necesita flujo de aire libre para ceder el calor del refrigerante. Sin ventilación, el sistema entra en alarma por alta presión.',
        vent_exterior: 'El ventilador expulsa el aire caliente del condensador. Si el calor recircula por falta de espacio, la eficiencia cae en picado.'
      },
      rule: 'La unidad exterior necesita como mínimo 30 cm de espacio libre en la salida de aire y no puede estar expuesta a recirculación. Verifica el espacio libre antes de fijar el soporte.'
    }
  },

  /* ---- Ronda 3: Drenaje ---- */
  {
    bannerTitle: 'El agua cae por la pared del cliente',
    bannerSub: '¿Qué componentes están implicados?',
    error: {
      name: 'El techo está goteando',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682055/error_drenaje_wd3w19.jpg',
      consequence: 'Goteos · Daños materiales',
      scenario: 'Agua acumulándose en la bandeja de condensados. El tubo de drenaje no tiene pendiente suficiente o está obstruido. El agua cae por la pared del cliente.',
      check: 'Drenaje'
    },
    correctIds: ['drenaje', 'evaporador'],
    hand: ['drenaje', 'evaporador', 'filtro', 'vent_interior', 'tuberia'],
    feedback: {
      extra: {
        filtro: 'El filtro obstruido reduce el caudal de aire, pero no genera goteos.',
        vent_interior: 'El ventilador mueve el aire, pero no produce condensación ni la evacúa.',
        tuberia: 'La tubería frigorífica transporta el refrigerante, pero no genera ni evacúa condensación.'
      },
      missed: {
        drenaje: 'El tubo de drenaje evacúa el agua condensada. Sin pendiente mínima del 2% o con obstrucción, el agua se acumula y desborda.',
        evaporador: 'El evaporador genera la condensación al enfriar el aire húmedo. Si la bandeja no desagua correctamente, es el primer punto de desbordamiento.'
      },
      rule: 'El tubo de drenaje necesita pendiente continua hacia el exterior, sin contrapendientes ni codos cerrados. Comprueba el nivel y el recorrido completo antes de dar la instalación por terminada.'
    }
  },

  /* ---- Ronda 4: Vibración ---- */
  {
    bannerTitle: 'Los vecinos ya han llamado dos veces',
    bannerSub: '¿Qué componentes están implicados?',
    error: {
      name: 'El cliente llama: hay ruido',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682053/error_vibracion_f4v0wq.jpg',
      consequence: 'Ruido · Vibraciones',
      scenario: 'La unidad exterior hace un ruido continuo y molesto. Los vecinos se quejan. La estructura vibra cuando el equipo funciona a plena potencia.',
      check: 'Nivel · Vibración'
    },
    correctIds: ['compresor', 'vent_exterior'],
    hand: ['compresor', 'vent_exterior', 'condensador', 'tuberia', 'placa'],
    feedback: {
      extra: {
        condensador: 'El condensador es estático — no tiene partes rotantes y no genera vibración.',
        tuberia: 'La tubería puede transmitir vibraciones si no está aislada, pero no las genera.',
        placa: 'La placa electrónica controla el sistema, pero no tiene partes móviles y no genera vibración mecánica.'
      },
      missed: {
        compresor: 'El compresor es la fuente principal de vibración. Su masa rotatoria transmite movimiento a la estructura si no está sobre antivibradores y bien nivelado.',
        vent_exterior: 'El ventilador amplifica las vibraciones del compresor si no está equilibrado y fijado correctamente.'
      },
      rule: 'El compresor debe apoyar sobre antivibradores de goma y la unidad debe estar perfectamente nivelada. Comprueba con nivel de burbuja antes de fijar definitivamente.'
    }
  },

  /* ---- Ronda 5: Mala ruta ---- */
  {
    bannerTitle: 'La ruta entre unidades queda forzada',
    bannerSub: '¿Qué componentes están implicados?',
    error: {
      name: 'La tubería queda forzada',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682054/error_ruta_j3crld.jpg',
      consequence: 'Estética · Tensiones mecánicas',
      scenario: 'El recorrido entre unidades tiene curvas cerradas y tensiones visibles. La instalación parece improvisada. A largo plazo hay riesgo de rotura en las conexiones.',
      check: 'Ruta'
    },
    correctIds: ['tuberia', 'cable', 'drenaje'],
    hand: ['tuberia', 'cable', 'drenaje', 'compresor', 'evaporador'],
    feedback: {
      extra: {
        compresor: 'El compresor es el destino de la tubería, pero no es responsable de la ruta que sigue la instalación.',
        evaporador: 'El evaporador es el punto de llegada de la tubería interior, pero no planifica ni define la ruta.'
      },
      missed: {
        tuberia: 'La tubería frigorífica es la conexión central. Una ruta mal planificada crea curvas cerradas que dañan el cobre y restringen el flujo de refrigerante.',
        cable: 'El cable eléctrico sigue la misma ruta. Una mala planificación lo expone a rozamientos y dificulta futuras reparaciones.',
        drenaje: 'El tubo de drenaje también forma parte del conjunto. Una ruta incorrecta le impide mantener la pendiente mínima necesaria.'
      },
      rule: 'Tubería, cable y drenaje deben planificarse juntos como un conjunto. Define la ruta antes de empezar: radio mínimo en curvas, sujeción cada 60 cm, pendiente del drenaje garantizada.'
    }
  },

  /* ---- Ronda 6: Remates ---- */
  {
    bannerTitle: 'El cliente llama: parece una chapuza',
    bannerSub: '¿Qué componentes están implicados?',
    error: {
      name: 'Parece una chapuza',
      art: 'https://res.cloudinary.com/kampe/image/upload/w_320,f_auto,q_auto/v1773682054/error_remates_gfiamw.jpg',
      consequence: 'Imagen · Profesionalidad',
      scenario: 'La instalación funciona, pero tiene canaletas sin rematar, cables sin fijar y sellados descuidados en los pasos de pared. El cliente no confía. Te llama para repetir el trabajo.',
      check: 'Remates · Limpieza'
    },
    correctIds: ['tuberia', 'cable'],
    hand: ['tuberia', 'cable', 'drenaje', 'placa', 'compresor'],
    feedback: {
      extra: {
        drenaje: 'El tubo de drenaje discurre por la pared, pero los remates estéticos se concentran en la canaleta que agrupa tubería y cable.',
        placa: 'La placa electrónica está dentro de la unidad, no a la vista.',
        compresor: 'El compresor está en la unidad exterior, no forma parte de los remates visibles al cliente.'
      },
      missed: {
        tuberia: 'La tubería frigorífica es la conexión más visible al exterior. Sin canaleta bien cerrada y sellado en pasos de pared, la instalación parece inacabada.',
        cable: 'El cable eléctrico sin canalizar ni fijar correctamente da imagen de trabajo descuidado y, además, incumple normativa.'
      },
      rule: 'El último 10% del trabajo define el 100% de la percepción del cliente. Canaleta cerrada, tornillos alineados, sellado en pasos de pared, sin restos de obra.'
    }
  }
];

/* =============================================
   STATE
   ============================================= */
let currentRound = 0;
let selectedIds = new Set();
let taskCompleted = false;
let canInteract = true;

/* =============================================
   DOM REFS
   ============================================= */
const $ = id => document.getElementById(id);

const screenIntro   = $('screen-intro');
const screenPlay    = $('screen-play');
const screenResults = $('screen-results');

const roundBanner      = $('round-banner');
const roundBannerTitle = $('round-banner-title');
const roundBannerSub   = $('round-banner-sub');

const errorCard        = $('error-card');
const errorCardName    = $('error-card-name');
const errorCardArt     = $('error-card-art');
const errorConsequence = $('error-consequence');
const errorScenario    = $('error-scenario');
const errorCheckBadge  = $('error-check-badge');

const handArea         = $('hand-area');
const btnAtacar        = $('btn-atacar');

const feedbackBackdrop  = $('feedback-overlay-backdrop');
const feedbackOverlay   = $('feedback-overlay');
const fbExtraSection    = $('fb-extra-section');
const fbExtraList       = $('fb-extra-list');
const fbMissedSection   = $('fb-missed-section');
const fbMissedList      = $('fb-missed-list');
const fbRule            = $('fb-rule');
const btnEntendido      = $('btn-entendido');

const completeOverlay = $('complete-overlay');
const screenFlash     = $('screen-flash');
const particleCanvas  = $('particles');
const pCtx            = particleCanvas.getContext('2d');

const resultsGrid = $('results-grid');

/* =============================================
   INIT
   ============================================= */
function initGame() {
  currentRound = 0;
  selectedIds.clear();
  taskCompleted = false;
  canInteract = false;

  showScreen(screenPlay);
  loadRound(currentRound);
}

function showScreen(target) {
  [screenIntro, screenPlay, screenResults].forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  if (target === screenResults) {
    document.documentElement.classList.remove('gameplay');
    document.documentElement.classList.add('results');
  } else {
    document.documentElement.classList.remove('results');
    document.documentElement.classList.add('gameplay');
  }
}

/* =============================================
   ROUND MANAGEMENT
   ============================================= */
function loadRound(index) {
  selectedIds.clear();
  canInteract = false;
  handArea.innerHTML = '';
  btnAtacar.disabled = true;

  const round = ROUNDS[index];

  // Pre-populate card content while still hidden (no flash)
  prepareErrorCard(round);

  function enterRound() {
    // 1 — Error card slides in from top
    animateErrorCardIn();

    // 2 — Hand cards slide in 500ms later
    setTimeout(() => {
      dealHand(round);

      // 3 — Enable interaction after cards have drawn in
      setTimeout(() => {
        updateAttackButton();
        canInteract = true;
      }, 400);
    }, 500);
  }

  if (index === 0) {
    // Tutorial: show modal first, then enterRound on dismiss
    requestAnimationFrame(() => requestAnimationFrame(() => showTutorialModal(enterRound)));
  } else {
    showRoundBanner(round.bannerTitle, round.bannerSub, enterRound);
  }
}

function showRoundBanner(title, sub, callback) {
  roundBannerTitle.textContent = title;
  roundBannerSub.textContent = sub;
  roundBanner.hidden = false;
  roundBanner.classList.remove('animating');
  void roundBanner.offsetWidth;
  roundBanner.classList.add('animating');

  // Wait for full animation (3s) before firing callback
  setTimeout(() => {
    roundBanner.hidden = true;
    roundBanner.classList.remove('animating');
    if (callback) callback();
  }, 3000);
}

/* =============================================
   TUTORIAL MODAL
   ============================================= */
function showTutorialModal(onDismiss) {
  const modal = document.getElementById('tutorial-modal');
  const btn   = document.getElementById('btn-tutorial-ok');
  modal.removeAttribute('hidden');

  function dismiss() {
    btn.removeEventListener('click', dismiss);
    btn.removeEventListener('touchend', onTouchEnd);
    modal.setAttribute('hidden', '');
    onDismiss();
  }

  function onTouchEnd(e) {
    e.preventDefault();
    dismiss();
  }

  btn.addEventListener('click', dismiss);
  btn.addEventListener('touchend', onTouchEnd);
}

/* =============================================
   ERROR CARD RENDERING
   ============================================= */

// Step 1: set content + reset state, keep card hidden (no flash)
function prepareErrorCard(round) {
  const e = round.error;
  errorCardName.textContent = e.name;
  errorCardArt.src = e.art;
  errorCardArt.alt = e.name;
  errorConsequence.textContent = e.consequence;
  errorScenario.textContent = e.scenario;
  errorCheckBadge.textContent = e.check;

  errorCard.classList.remove('burning-break', 'burning-destroy');
  errorCard.style.transition = 'none';
  errorCard.style.transform = 'translateY(-80px)';
  errorCard.style.opacity = '0';
  errorCard.hidden = true;
}

// Step 2: unhide + animate in (called after banner or directly for round 0)
function animateErrorCardIn() {
  errorCard.hidden = false;
  void errorCard.offsetWidth; // force reflow so transition fires
  errorCard.style.transition = 'transform 0.5s ease-out, opacity 0.4s ease-out';
  errorCard.style.transform = 'translateY(0)';
  errorCard.style.opacity = '1';
}

/* =============================================
   HAND MANAGEMENT
   ============================================= */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealHand(round) {
  handArea.innerHTML = '';

  shuffle(round.hand).forEach((cardId, index) => {
    const cardData = DECK.find(c => c.id === cardId);
    if (!cardData) return;

    const el = document.createElement('div');
    el.className = 'hand-card drawing';
    el.dataset.cardId = cardId;
    el.style.animationDelay = `${index * 60}ms`;

    // Border class based on lado
    if (cardData.lado === 'frio')     el.classList.add('border-frio');
    if (cardData.lado === 'caliente') el.classList.add('border-caliente');
    if (cardData.lado === 'ambos')    el.classList.add('border-ambos');

    el.innerHTML = `
      <div class="hand-card-nameplate">
        <span class="hand-card-name">${cardData.nombre}</span>
      </div>
      <div class="hand-card-art-window" style="background-image:url('${cardData.art}')"></div>
    `;

    el.addEventListener('touchend', e => { e.preventDefault(); onCardTap(e); });
    el.addEventListener('click', onCardTap);

    handArea.appendChild(el);
  });
}

function onCardTap(e) {
  if (!canInteract) return;
  const card = e.currentTarget;
  const cardId = card.dataset.cardId;
  if (!cardId) return;

  if (selectedIds.has(cardId)) {
    selectedIds.delete(cardId);
    card.classList.remove('selected');
  } else {
    selectedIds.add(cardId);
    card.classList.add('selected');
  }

  updateAttackButton();
}

function updateAttackButton() {
  btnAtacar.disabled = selectedIds.size === 0;
}

/* =============================================
   ATTACK RESOLUTION
   ============================================= */
function resolveAttack() {
  if (!canInteract || selectedIds.size === 0) return;
  canInteract = false;

  const round = ROUNDS[currentRound];
  const correct = new Set(round.correctIds);
  const selected = new Set(selectedIds);

  // Check exact match
  const isCorrect =
    selected.size === correct.size &&
    [...correct].every(id => selected.has(id));

  if (isCorrect) {
    onCorrectAttack();
  } else {
    onWrongAttack(round, selected, correct);
  }
}

function onCorrectAttack() {
  // Phase 1: flash
  flashScreen(0.8, 200, () => {

    // Phase 2: break
    errorCard.classList.add('burning-break');

    setTimeout(() => {
      // Phase 3: destroy + shake + particles
      errorCard.classList.remove('burning-break');
      errorCard.classList.add('burning-destroy');
      document.body.classList.add('shaking');
      spawnParticles();

      setTimeout(() => {
        document.body.classList.remove('shaking');
      }, 400);

    }, 150);

    // Destroy selected hand cards in parallel
    destroySelectedCards();

    // After burn completes (~650ms), show "Resuelto" over the now-empty area
    setTimeout(() => {
      errorCard.hidden = true;
      errorCard.classList.remove('burning-destroy');
      showCompleteOverlay('Resuelto', 900);
    }, 650);

    // After overlay fades out — advance
    setTimeout(() => {
      currentRound++;

      if (currentRound >= ROUNDS.length) {
        showResults();
      } else {
        loadRound(currentRound);
      }
    }, 1700);
  });
}

function onWrongAttack(round, selected, correct) {
  // Shake the button
  btnAtacar.classList.add('shaking');
  setTimeout(() => btnAtacar.classList.remove('shaking'), 400);

  const extraIds          = [...selected].filter(id => !correct.has(id));
  const correctlySelected = [...selected].filter(id => correct.has(id));

  // Deselect wrong cards in all partial cases
  if (extraIds.length > 0) {
    extraIds.forEach(id => {
      selectedIds.delete(id);
      const el = handArea.querySelector(`[data-card-id="${id}"]`);
      if (el) el.classList.remove('selected');
    });
    updateAttackButton();
  }

  let header, headerColor;
  if (correctlySelected.length === 0) {
    // Nothing right
    header = 'Esos no están implicados';
    headerColor = '';
  } else if (extraIds.length > 0) {
    // Mix of right and wrong
    header = 'Alguno no está implicado';
    headerColor = 'var(--lemon)';
  } else {
    // All selected are correct, just missing some
    header = 'Bien, pero faltan componentes';
    headerColor = 'var(--turq)';
  }

  showFeedback(extraIds, round.feedback, header, headerColor, correctlySelected.length > 0);
}

/* =============================================
   DESTROY SELECTED CARDS
   ============================================= */
function destroySelectedCards() {
  const cards = handArea.querySelectorAll('.hand-card.selected');
  cards.forEach(card => {
    card.classList.remove('selected');
    card.classList.add('destroying');
  });
}

/* =============================================
   FEEDBACK OVERLAY
   ============================================= */
function showFeedback(extraIds, feedbackData, header, headerColor, partial = false) {
  // Header
  const headerLabel = feedbackOverlay.querySelector('.feedback-header-label');
  headerLabel.textContent = header;
  headerLabel.style.color = headerColor;

  // Extra cards section (only when fully wrong and extras exist)
  if (!partial && extraIds.length > 0) {
    fbExtraSection.hidden = false;
    fbExtraList.innerHTML = '';
    extraIds.forEach(id => {
      const cardData = DECK.find(c => c.id === id);
      const why = feedbackData.extra[id] || '';
      fbExtraList.innerHTML += `
        <div class="fb-card-item">
          <div class="fb-card-name">${cardData ? cardData.nombre : id}</div>
          <div class="fb-card-why">${why}</div>
        </div>
      `;
    });
  } else {
    fbExtraSection.hidden = true;
  }

  fbMissedSection.hidden = true;
  fbRule.textContent = feedbackData.rule;

  // Tag overlay so closeFeedback knows whether to preserve selection
  feedbackOverlay.dataset.partial = partial ? '1' : '0';

  // Show overlay
  feedbackBackdrop.hidden = false;
  feedbackOverlay.hidden = false;
  void feedbackOverlay.offsetWidth;
  feedbackOverlay.classList.add('open');
}

function closeFeedback() {
  const partial = feedbackOverlay.dataset.partial === '1';
  feedbackOverlay.classList.remove('open');
  setTimeout(() => {
    feedbackOverlay.hidden = true;
    feedbackBackdrop.hidden = true;
    if (!partial) {
      // Fully wrong — clear everything so the player starts fresh
      selectedIds.clear();
      handArea.querySelectorAll('.hand-card').forEach(c => c.classList.remove('selected'));
    }
    updateAttackButton();
    canInteract = true;
  }, 300);
}

/* =============================================
   RESULTS
   ============================================= */
function showResults() {
  // Curated scatter transforms — looks tossed on the table, not random chaos
  const scatters = [
    'rotate(-13deg) translate(-4px, 6px)',
    'rotate(9deg)  translate(5px, -7px)',
    'rotate(-4deg) translate(2px, 3px)',
    'rotate(17deg) translate(-6px, 5px)',
    'rotate(-11deg) translate(4px, -2px)',
    'rotate(5deg)  translate(-3px, 8px)',
    'rotate(-19deg) translate(6px, 1px)'
  ];

  resultsGrid.innerHTML = '';
  ROUNDS.forEach((round, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.transform = scatters[i];
    card.innerHTML = `
      <div class="result-card-nameplate">${round.error.name}</div>
      <div class="result-card-art">
        <img src="${round.error.art}" alt="${round.error.name}" loading="lazy">
      </div>
    `;
    resultsGrid.appendChild(card);
    setTimeout(() => card.classList.add('visible'), i * 150);
  });

  showScreen(screenResults);

  if (!taskCompleted) {
    taskCompleted = true;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    } catch (e) {
      // Not in RN context — dev mode
    }
  }
}

/* =============================================
   HELPERS — ANIMATIONS
   ============================================= */
function flashScreen(maxOpacity, duration, callback) {
  screenFlash.style.transition = 'none';
  screenFlash.style.opacity = '0';
  void screenFlash.offsetWidth;

  const half = duration / 2;
  screenFlash.style.transition = `opacity ${half}ms ease-out`;
  screenFlash.style.opacity = String(maxOpacity);

  setTimeout(() => {
    screenFlash.style.transition = `opacity ${half}ms ease-in`;
    screenFlash.style.opacity = '0';
    if (callback) callback();
  }, half);
}

function showCompleteOverlay(text, duration) {
  completeOverlay.textContent = text;
  completeOverlay.hidden = false;
  completeOverlay.style.transition = 'opacity 0.3s ease-out';
  completeOverlay.style.opacity = '1';
  setTimeout(() => {
    completeOverlay.style.transition = 'opacity 0.3s ease-in';
    completeOverlay.style.opacity = '0';
    setTimeout(() => { completeOverlay.hidden = true; }, 300);
  }, duration);
}

/* =============================================
   PARTICLES (reutilizado de F1)
   ============================================= */
function resizeCanvas() {
  particleCanvas.width  = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

function spawnParticles() {
  resizeCanvas();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.35;
  const particles = [];
  const colors = ['#C0392B', '#FF6B6B', '#E74C3C', '#FF8A80', '#C9A040'];

  for (let i = 0; i < 40; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 2 + Math.random() * 5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    });
  }

  function animate() {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.18;
      p.life -= 0.022;
      if (p.life > 0) {
        alive = true;
        pCtx.globalAlpha = p.life;
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fill();
      }
    });
    pCtx.globalAlpha = 1;
    if (alive) requestAnimationFrame(animate);
    else pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  }
  animate();
}

/* =============================================
   EVENT LISTENERS
   ============================================= */
$('btn-start').addEventListener('click', initGame);
$('btn-start').addEventListener('touchend', e => { e.preventDefault(); initGame(); });

btnAtacar.addEventListener('click', resolveAttack);
btnAtacar.addEventListener('touchend', e => { e.preventDefault(); resolveAttack(); });

btnEntendido.addEventListener('click', closeFeedback);
btnEntendido.addEventListener('touchend', e => { e.preventDefault(); closeFeedback(); });

$('btn-retry').addEventListener('click', initGame);
$('btn-retry').addEventListener('touchend', e => { e.preventDefault(); initGame(); });

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
