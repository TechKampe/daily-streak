// === El Piso Compartido — Game Logic ===

const RECORD_KEY = 'el_piso_compartido_record';
const TEMP_MAX = 40;
const TEMP_MIN = 22;
const TEMP_RANGE = TEMP_MAX - TEMP_MIN;
const TRAIL_COUNT = 5;
const TRAIL_DELAY = 40;

// Base mechanics
const TEMP_DROP_PER_PARTICLE = 1;  // °C dropped per absorbed particle
const GAME_TICK = 100;             // ms between heat rise ticks

// Per-stage difficulty
const STAGE_DIFFICULTY = [
  {
    // Stage 1: Warm-up — steady heat, moderate particles
    target: 34,
    heatPerSecond: 0.5,
    maxParticles: 8,
    spawnInterval: 900,
    initialBatch: 5
  },
  {
    // Stage 2: Transport — challenging heat, more particles
    target: 28,
    heatPerSecond: 1.4,
    maxParticles: 10,
    spawnInterval: 600,
    initialBatch: 6
  },
  {
    // Stage 3: MAYHEM — intense but beatable
    target: 22,
    heatPerSecond: 2.5,
    maxParticles: 14,
    spawnInterval: 400,
    initialBatch: 8
  }
]; // must reach this temp to complete each stage

// Avatar Cloudinary URLs
const AVATAR_URLS = {
  sandra_happy: 'https://res.cloudinary.com/kampe/image/upload/v1773766601/sandra_happy_vumah2.png',
  sandra_celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1773766601/sandra_celebrating_bzbpjc.png',
  sandra_worried: 'https://res.cloudinary.com/kampe/image/upload/v1773766602/sandra_worried_o2neyu.png'
};

// Reflection dialogues
const REFLECTIONS = [
  {
    avatar: 'sandra_happy',
    ask: 'Espera... ¿qué acabas de hacer?',
    explain: 'La unidad interior recoge el calor del aire de la habitación. Lo que ves bajar en el termómetro es la <strong>temperatura</strong> — es lo que medimos.',
    understand: 'Ahhh, o sea que la máquina de dentro chupa el calor del aire... ¡y por eso el termómetro baja! Mola.',
    btn: 'Siguiente etapa'
  },
  {
    avatar: 'sandra_happy',
    ask: '¿Y esas tuberías? ¿Cómo llega el calor de un lado a otro?',
    explain: 'El calor viaja dentro del refrigerante por las tuberías. La <strong>presión</strong> es lo que hace que el refrigerante se mueva y se comporte de cierta manera.',
    understand: 'Presión... como cuando aprietas la pasta de dientes y sale. ¡Lo pillo!',
    btn: 'Siguiente etapa'
  },
  {
    avatar: 'sandra_celebrating',
    ask: '¿Y el calor se va al aire de fuera? ¿Así sin más?',
    explain: 'Sí. La unidad exterior lo suelta al ambiente. Eso es el <strong>intercambio de calor</strong>. Y es un <strong>ciclo</strong>: recoge dentro, transporta, suelta fuera, y vuelta a empezar.',
    understand: '¡Interior recoge, tuberías transportan, exterior suelta! ¿Y esto es lo que estudias en Kämpe? ¡YO QUIERO APUNTARME!',
    btn: 'Ver resultados'
  }
];

// Stage intro messages
const STAGE_INTROS = [
  {
    title: 'Etapa 1 — Recoge el calor',
    text: 'Arrastra las bolas de calor hacia el aire acondicionado. ¡El calor no para de entrar, así que date prisa!'
  },
  {
    title: 'Etapa 2 — Transporta',
    text: 'El calor ya está en la máquina. Muévelo por las tuberías hacia la unidad exterior antes de que se acumule.'
  },
  {
    title: 'Etapa 3 — Suelta el calor',
    text: 'El calor está en la unidad exterior. ¡Sácalo al aire libre antes de que se sature!'
  }
];

// Stage configurations
const STAGE_CONFIG = [
  {
    bg: 'https://res.cloudinary.com/kampe/image/upload/v1773766602/bg_etapa1_xtztdu.jpg',
    zone: { right: '8%', top: '14%', w: 100, h: 170 },
    spawnArea: { xMin: 0.05, xMax: 0.50, yMin: 0.35, yMax: 0.85 },
    showReturnPulse: false
  },
  {
    bg: 'https://res.cloudinary.com/kampe/image/upload/v1773766601/bg_etapa2_n6umd8.jpg',
    zone: { right: '2%', top: '33%', w: 80, h: 220 },
    sourceZone: { left: '2%', top: '33%', w: 80, h: 220 },
    spawnArea: { xMin: 0.02, xMax: 0.20, yMin: 0.30, yMax: 0.60 },
    showReturnPulse: false
  },
  {
    bg: 'https://res.cloudinary.com/kampe/image/upload/v1773766602/bg_etapa3_bo9nrg.jpg',
    zone: { right: '30%', top: '30%', w: 110, h: 130 },
    spawnArea: { xMin: 0.42, xMax: 0.68, yMin: 0.22, yMax: 0.40 },
    showReturnPulse: true,
    invertedZone: true
  }
];

// Toast messages
const TOAST_ENCOURAGING = [
  '¡Sigue así!',
  '¡Vas genial!',
  '¡Eso es!',
  '¡La habitación se enfría!',
  '¡Casi lo tienes!',
  '¡Buen ritmo!'
];
const TOAST_WARNING = [
  '¡Se calienta!',
  '¡Más rápido!',
  '¡El calor sube!',
  '¡No pares!',
  '¡Están sudando!'
];

// State
let state = {
  currentStage: 0,
  temperature: TEMP_MAX,
  tutorialShown: false,
  dragging: null,
  trailDots: [],
  trailPositions: [],
  trailTimer: null,
  gameLoopTimer: null,
  spawnTimer: null,
  stageActive: false,
  lastToastTime: 0,
  peakTemp: TEMP_MAX,
  streak: 0
};

// DOM refs
const $ = id => document.getElementById(id);
let screens;

function initDOMRefs() {
  screens = {
    intro: $('intro'),
    tutorial: $('tutorial'),
    play: $('play'),
    reflection: $('reflection'),
    results: $('results')
  };
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  document.documentElement.className = name === 'results' ? 'results' : 'gameplay';
}

// === Game Start ===
function startGame() {
  if (!state.tutorialShown) {
    showScreen('tutorial');
  } else {
    showScreen('play');
    initStage(0);
  }
}

function closeTutorial() {
  state.tutorialShown = true;
  showScreen('play');
  initStage(0);
}

function restartGame() {
  stopGameLoop();
  state.currentStage = 0;
  state.temperature = TEMP_MAX;
  showScreen('intro');
}

// === Stage Init ===
function initStage(stageIndex) {
  stopGameLoop();
  state.currentStage = stageIndex;
  state.stageActive = false;

  const config = STAGE_CONFIG[stageIndex];
  const scene = $('scene');

  // Fade in new scene
  scene.style.opacity = '0';
  scene.style.backgroundImage = `url('${config.bg}')`;

  // Update HUD
  $('stage-label').textContent = `Etapa ${stageIndex + 1}/3`;

  // Position target zone
  const tz = $('target-zone');
  tz.style.right = config.zone.right;
  tz.style.top = config.zone.top;
  tz.style.width = config.zone.w + 'px';
  tz.style.height = config.zone.h + 'px';

  // Position source zone (if stage has one)
  const sz = $('source-zone');
  if (config.sourceZone) {
    sz.style.display = 'block';
    sz.style.left = config.sourceZone.left || '';
    sz.style.right = config.sourceZone.right || '';
    sz.style.top = config.sourceZone.top;
    sz.style.width = config.sourceZone.w + 'px';
    sz.style.height = config.sourceZone.h + 'px';
  } else {
    sz.style.display = 'none';
  }

  // Clear old particles and trails
  $('particles').innerHTML = '';
  clearTrail();

  // Fade in scene
  requestAnimationFrame(() => {
    scene.style.transition = 'opacity 0.5s ease';
    scene.style.opacity = '1';
  });

  // Show stage intro, then start gameplay
  const diff = STAGE_DIFFICULTY[stageIndex];
  showStageIntro(stageIndex, () => {
    state.stageActive = true;
    // Spawn initial batch
    for (let i = 0; i < diff.initialBatch; i++) {
      spawnParticle(i * 120);
    }
    startGameLoop();
  });

  updateThermometer();
}

// === Game Loop (heat rise + particle spawning) ===
function startGameLoop() {
  const diff = STAGE_DIFFICULTY[state.currentStage];

  // Heat rises over time + warning toasts
  state.gameLoopTimer = setInterval(() => {
    if (!state.stageActive) return;

    state.temperature += diff.heatPerSecond * (GAME_TICK / 1000);
    state.temperature = Math.min(state.temperature, TEMP_MAX);

    // Track peak temp for warning detection
    if (state.temperature > state.peakTemp) {
      state.peakTemp = state.temperature;
    }

    // Warning toast when temp rises significantly above target
    const target = diff.target;
    const now = Date.now();
    const tempAboveTarget = state.temperature - target;
    if (tempAboveTarget > 8 && now - state.lastToastTime > 4000) {
      showToast(TOAST_WARNING[Math.floor(Math.random() * TOAST_WARNING.length)], 'warning');
      state.lastToastTime = now;
    }

    updateThermometer();
  }, GAME_TICK);

  // Continuously spawn particles
  state.spawnTimer = setInterval(() => {
    if (!state.stageActive) return;

    const alive = $('particles').querySelectorAll('.particle:not(.absorbed):not(.dissipated)').length;
    if (alive < diff.maxParticles) {
      spawnParticle(0);
    }
  }, diff.spawnInterval);
}

function stopGameLoop() {
  if (state.gameLoopTimer) {
    clearInterval(state.gameLoopTimer);
    state.gameLoopTimer = null;
  }
  if (state.spawnTimer) {
    clearInterval(state.spawnTimer);
    state.spawnTimer = null;
  }
  state.stageActive = false;
}

// === Stage Intro ===
function showStageIntro(stageIndex, onDone) {
  const intro = STAGE_INTROS[stageIndex];
  const el = $('stage-intro');
  $('stage-intro-title').textContent = intro.title;
  $('stage-intro-text').textContent = intro.text;

  el.classList.add('visible');

  function dismiss() {
    el.removeEventListener('click', dismiss);
    el.classList.remove('visible');
    setTimeout(onDone, 300);
  }
  el.addEventListener('click', dismiss);
}

// === Particles ===
function spawnParticle(delay = 0) {
  const container = $('particles');
  const scene = $('scene');
  const sw = scene.clientWidth;
  const sh = scene.clientHeight;
  const config = STAGE_CONFIG[state.currentStage];
  const area = config.spawnArea;

  const el = document.createElement('div');
  el.className = 'particle';

  const x = area.xMin * sw + Math.random() * ((area.xMax - area.xMin) * sw);
  const y = area.yMin * sh + Math.random() * ((area.yMax - area.yMin) * sh);
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  // Random float animation — faster and wilder in later stages
  const floatScale = state.currentStage === 2 ? 1.8 : (state.currentStage === 1 ? 1.3 : 1);
  el.style.setProperty('--dx1', (Math.random() * 60 * floatScale - 30 * floatScale) + 'px');
  el.style.setProperty('--dy1', (Math.random() * 40 * floatScale - 20 * floatScale) + 'px');
  el.style.setProperty('--dx2', (Math.random() * 60 * floatScale - 30 * floatScale) + 'px');
  el.style.setProperty('--dy2', (Math.random() * 40 * floatScale - 20 * floatScale) + 'px');
  el.style.setProperty('--dx3', (Math.random() * 60 * floatScale - 30 * floatScale) + 'px');
  el.style.setProperty('--dy3', (Math.random() * 40 * floatScale - 20 * floatScale) + 'px');
  // Faster float in later stages
  const floatSpeed = state.currentStage === 2 ? (1.5 + Math.random() * 1) : (3 + Math.random() * 2);
  el.style.setProperty('--float-duration', floatSpeed + 's');
  el.style.animationDelay = (Math.random() * 2) + 's';

  if (delay > 0) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.classList.add('floating');
    }, delay);
  } else {
    el.classList.add('floating');
  }

  el.addEventListener('touchstart', onParticleTouchStart, { passive: false });
  el.addEventListener('mousedown', onParticleMouseDown);

  container.appendChild(el);
  return el;
}

// === Touch Handling ===
function onParticleTouchStart(e) {
  e.preventDefault();
  startDrag(e.currentTarget, e.touches[0].clientX, e.touches[0].clientY);
}

function onParticleMouseDown(e) {
  e.preventDefault();
  startDrag(e.currentTarget, e.clientX, e.clientY);
}

function startDrag(el, clientX, clientY) {
  if (state.dragging) return;
  el.classList.remove('floating');
  el.classList.add('grabbed');
  state.dragging = el;
  createTrail();
  startTrailTracking(clientX, clientY);
  moveDrag(clientX, clientY);
}

function moveDrag(clientX, clientY) {
  if (!state.dragging) return;
  const scene = $('scene');
  const sceneRect = scene.getBoundingClientRect();
  const x = clientX - sceneRect.left - 16;
  const y = clientY - sceneRect.top - 16;
  state.dragging.style.left = x + 'px';
  state.dragging.style.top = y + 'px';
  updateTrailTarget(clientX, clientY);
}

function endDrag(clientX, clientY) {
  if (!state.dragging) return;
  const el = state.dragging;
  state.dragging = null;
  el.classList.remove('grabbed');
  clearTrail();

  const tz = $('target-zone');
  const tzRect = tz.getBoundingClientRect();
  const snapMargin = 30;

  const inZone = (
    clientX >= tzRect.left - snapMargin &&
    clientX <= tzRect.right + snapMargin &&
    clientY >= tzRect.top - snapMargin &&
    clientY <= tzRect.bottom + snapMargin
  );

  const config = STAGE_CONFIG[state.currentStage];
  const success = config.invertedZone ? !inZone : inZone;

  if (success) {
    absorbParticle(el);
  } else {
    returnParticle(el);
  }
}

// === Trail ===
function createTrail() {
  clearTrail();
  const scene = $('scene');
  state.trailDots = [];
  state.trailPositions = [];

  for (let i = 0; i < TRAIL_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    dot.style.opacity = (0.6 - i * 0.12).toFixed(2);
    dot.style.transform = 'scale(' + (1 - i * 0.15).toFixed(2) + ')';
    dot.style.display = 'none';
    scene.appendChild(dot);
    state.trailDots.push(dot);
    state.trailPositions.push({ x: 0, y: 0 });
  }
}

function startTrailTracking(clientX, clientY) {
  const scene = $('scene');
  const sceneRect = scene.getBoundingClientRect();
  const x = clientX - sceneRect.left;
  const y = clientY - sceneRect.top;
  for (let i = 0; i < TRAIL_COUNT; i++) {
    state.trailPositions[i] = { x, y };
  }
  if (state.trailTimer) clearInterval(state.trailTimer);
  state.trailTimer = setInterval(updateTrailAnimation, TRAIL_DELAY);
}

function updateTrailTarget(clientX, clientY) {
  const scene = $('scene');
  const sceneRect = scene.getBoundingClientRect();
  state.trailPositions[0] = {
    x: clientX - sceneRect.left,
    y: clientY - sceneRect.top
  };
}

function updateTrailAnimation() {
  if (!state.dragging) return;
  for (let i = TRAIL_COUNT - 1; i >= 1; i--) {
    const prev = state.trailPositions[i - 1];
    const curr = state.trailPositions[i];
    curr.x += (prev.x - curr.x) * 0.4;
    curr.y += (prev.y - curr.y) * 0.4;
  }
  for (let i = 0; i < TRAIL_COUNT; i++) {
    const dot = state.trailDots[i];
    const pos = state.trailPositions[i];
    dot.style.display = 'block';
    dot.style.left = (pos.x - 4) + 'px';
    dot.style.top = (pos.y - 4) + 'px';
  }
}

function clearTrail() {
  if (state.trailTimer) {
    clearInterval(state.trailTimer);
    state.trailTimer = null;
  }
  state.trailDots.forEach(dot => dot.remove());
  state.trailDots = [];
  state.trailPositions = [];
}

// === Particle Absorption ===
function absorbParticle(el) {
  const config = STAGE_CONFIG[state.currentStage];

  if (state.currentStage >= 2) {
    el.classList.add('dissipated');
  } else {
    el.classList.add('absorbed');
  }

  // Flash target zone
  const tz = $('target-zone');
  tz.classList.add('flash');
  setTimeout(() => tz.classList.remove('flash'), 200);

  // Drop temperature
  state.temperature -= TEMP_DROP_PER_PARTICLE;
  state.temperature = Math.max(state.temperature, TEMP_MIN);
  state.streak++;
  updateThermometer();

  // Encouraging toast on streaks
  const now = Date.now();
  const stageTarget = STAGE_DIFFICULTY[state.currentStage].target;
  if (state.streak >= 4 && now - state.lastToastTime > 3000) {
    showToast(TOAST_ENCOURAGING[Math.floor(Math.random() * TOAST_ENCOURAGING.length)], 'encouraging');
    state.lastToastTime = now;
    state.streak = 0;
  }
  // Close to target — extra encouragement
  if (state.temperature <= stageTarget + 2 && state.temperature > stageTarget && now - state.lastToastTime > 2000) {
    showToast('¡Casi lo tienes!', 'encouraging');
    state.lastToastTime = now;
  }

  // Return pulse (stage 3)
  if (config.showReturnPulse) {
    spawnReturnPulse();
  }

  // Check stage complete — reached target temperature?
  const target = STAGE_DIFFICULTY[state.currentStage].target;
  if (state.temperature <= target) {
    state.stageActive = false;
    stopGameLoop();
    // Clear remaining particles
    $('particles').querySelectorAll('.particle').forEach(p => {
      p.classList.add('dissipated');
      setTimeout(() => p.remove(), 500);
    });
    setTimeout(() => showReflection(state.currentStage), 800);
  }

  // Remove absorbed particle
  setTimeout(() => el.remove(), 500);
}

function returnParticle(el) {
  state.streak = 0;
  const scene = $('scene');
  const config = STAGE_CONFIG[state.currentStage];
  const area = config.spawnArea;
  const sw = scene.clientWidth;
  const sh = scene.clientHeight;
  const newX = area.xMin * sw + Math.random() * ((area.xMax - area.xMin) * sw);
  const newY = area.yMin * sh + Math.random() * ((area.yMax - area.yMin) * sh);

  el.classList.add('returning');
  el.style.left = newX + 'px';
  el.style.top = newY + 'px';

  setTimeout(() => {
    el.classList.remove('returning');
    el.classList.add('floating');
  }, 500);
}

// === Return Pulse (blue coolant) ===
function spawnReturnPulse() {
  const scene = $('scene');
  const sw = scene.clientWidth;
  const sh = scene.clientHeight;

  const pulse = document.createElement('div');
  pulse.className = 'return-pulse';
  pulse.style.left = (sw * 0.9) + 'px';
  pulse.style.top = (sh * 0.55) + 'px';

  scene.appendChild(pulse);

  requestAnimationFrame(() => {
    pulse.style.transition = 'left 0.8s ease-in-out, opacity 0.8s ease';
    pulse.style.left = (sw * 0.1) + 'px';
    pulse.style.opacity = '0.3';
  });

  setTimeout(() => pulse.remove(), 900);
}

// === Global event listeners ===
document.addEventListener('touchmove', e => {
  if (state.dragging) {
    e.preventDefault();
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: false });

document.addEventListener('touchend', e => {
  if (state.dragging) {
    endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
});

document.addEventListener('touchcancel', () => {
  if (state.dragging) {
    const el = state.dragging;
    state.dragging = null;
    el.classList.remove('grabbed');
    clearTrail();
    returnParticle(el);
  }
});

document.addEventListener('mousemove', e => {
  if (state.dragging) moveDrag(e.clientX, e.clientY);
});

document.addEventListener('mouseup', e => {
  if (state.dragging) endDrag(e.clientX, e.clientY);
});

// === Toast Messages ===
let toastTimeout = null;
function showToast(text, type) {
  const el = $('toast');
  el.textContent = text;
  el.className = 'toast ' + type;

  // Force reflow for re-trigger
  if (toastTimeout) clearTimeout(toastTimeout);
  el.classList.remove('visible');
  void el.offsetWidth;
  el.classList.add('visible');

  toastTimeout = setTimeout(() => {
    el.classList.remove('visible');
  }, 1800);
}

// === Thermometer ===
function updateThermometer() {
  const pct = ((state.temperature - TEMP_MIN) / TEMP_RANGE) * 100;
  const fill = $('thermo-fill');
  fill.style.width = Math.max(0, Math.min(100, pct)) + '%';

  if (state.temperature > 35) fill.style.backgroundColor = 'var(--thermo-red)';
  else if (state.temperature > 30) fill.style.backgroundColor = 'var(--thermo-orange)';
  else if (state.temperature > 25) fill.style.backgroundColor = 'var(--thermo-yellow)';
  else fill.style.backgroundColor = 'var(--thermo-green)';

  $('thermo-text').textContent = Math.round(state.temperature) + '°C';
}

// === Reflections ===
function showReflection(stageIndex) {
  const r = REFLECTIONS[stageIndex];
  $('refl-avatar').src = AVATAR_URLS[r.avatar];
  $('refl-sandra-ask').innerHTML = `<p>${r.ask}</p>`;
  $('refl-player-explain').innerHTML = `<p>${r.explain}</p>`;
  $('refl-sandra-understand').innerHTML = `<p>${r.understand}</p>`;
  $('refl-btn').textContent = r.btn;
  showScreen('reflection');
}

function nextStage() {
  const next = state.currentStage + 1;
  if (next >= 3) {
    completeGame();
  } else {
    showScreen('play');
    initStage(next);
  }
}

// === Game Complete ===
function completeGame() {
  localStorage.setItem(RECORD_KEY, 'true');
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
  showScreen('results');
}

// initDOMRefs() is called from inline script in index.html after DOM is ready
