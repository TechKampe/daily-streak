// === El Concurso del Gremio — Game Logic ===

(function () {
  'use strict';

  // --- Asset URLs (Cloudinary) ---
  const CDN = 'https://res.cloudinary.com/kampe/image/upload/';
  const ASSETS = {
    lucia_happy: CDN + 'v1773055779/lucia_happy_yop97a.png',
    lucia_celebrating: CDN + 'v1773055778/lucia_celebrating_a3jque.png',
    lucia_worried: CDN + 'v1773055778/lucia_worried_cvwqif.png',
    escenario_1: CDN + 'v1773055777/escenario_1_fhbbu3.jpg',
    escenario_2: CDN + 'v1773055777/escenario_2_cfqvsl.jpg',
    escenario_3: CDN + 'v1773055777/escenario_3_gtbzog.jpg',
    escenario_4: CDN + 'v1773055777/escenario_4_iygajf.jpg',
    escenario_5: CDN + 'v1773055777/escenario_5_ip8kas.jpg',
    escenario_6: CDN + 'v1773055777/escenario_6_udkfhp.jpg',
    escenario_7: CDN + 'v1773055777/escenario_7_zcgrbp.jpg',
    escenario_8: CDN + 'v1773055777/escenario_8_hfhegc.jpg',
  };

  // --- Screens ---
  const screens = {
    intro: document.getElementById('intro'),
    play: document.getElementById('play'),
    results: document.getElementById('results'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    if (name === 'results') {
      document.documentElement.classList.remove('gameplay');
      document.documentElement.classList.add('results');
    } else {
      document.documentElement.classList.remove('results');
      document.documentElement.classList.add('gameplay');
    }
  }

  // --- State ---
  let score = 0;
  let currentScenario = 0;
  let scenarioResults = [];
  let taskCompletedSent = false;
  let tutorialStep = 0; // 0=not started, 1-3 for tutorial steps
  let isScratching = false;
  let lastScratchPos = null;
  let scratchCheckInterval = null;
  let particleThrottle = 0;
  let publicTextRotation = 0;
  let inputLocked = false;

  const TASK_THRESHOLD = 700;
  const RECORD_KEY = 'el_concurso_del_gremio_record';
  const SCRATCH_THRESHOLD = 0.6;
  const SCRATCH_CHECK_MS = 500;
  const RETINA = 2;

  // --- DOM refs ---
  const scratchCanvas = document.getElementById('scratch-canvas');
  const shimmerCanvas = document.getElementById('shimmer-canvas');
  const scratchCtx = scratchCanvas.getContext('2d');
  const shimmerCtx = shimmerCanvas.getContext('2d');
  const scenarioImg = document.getElementById('scenario-img');
  const glowFinger = document.getElementById('glow-finger');
  const revealFlash = document.getElementById('reveal-flash');
  const judgmentButtons = document.getElementById('judgment-buttons');
  const btnPro = document.getElementById('btn-pro');
  const btnChapuza = document.getElementById('btn-chapuza');
  const detailOptions = document.getElementById('detail-options');
  const contestantCard = document.getElementById('contestant-card');
  const publicText = document.getElementById('public-text');
  const toast = document.getElementById('toast');
  const gameplayAvatar = document.getElementById('gameplay-avatar');
  const eduOverlay = document.getElementById('edu-overlay');
  const eduCard = document.getElementById('edu-card');
  const roundOverlay = document.getElementById('round-overlay');
  const roundContent = document.getElementById('round-content');
  const hudScore = document.getElementById('hud-score');
  const hudProgress = document.getElementById('hud-progress');
  const hudRound = document.getElementById('hud-round');
  const scenarioArea = document.getElementById('scenario-area');

  // --- Scenario Data ---
  const scenarios = [
    {
      name: 'Don Esteban',
      experience: '30 años',
      training: 'Maestro industrial',
      task: 'Esquina interior · Obra nueva',
      verdict: 'pro',
      round: 1,
      image: ASSETS.escenario_1,
      correctQualities: ['Radio suave en la esquina', 'Fijación a distancia constante'],
      qualityOptions: ['Radio suave en la esquina', 'Fijación a distancia constante', 'Tubo de mayor sección'],
      detailFeedbackPerfect: 'Exacto. Radio suave y abrazaderas a distancia constante. Don Esteban domina las esquinas.',
      detailFeedbackPartial: 'Buen juicio, pero fíjate: el radio suave Y la fijación constante son las dos cualidades que destacan aquí.',
      defectOptions: ['Esquina torcida', 'Fijación irregular', 'Falta abrazadera'],
      eduOverlayText: 'Esta instalación cumple todos los criterios: radio suave en la esquina, abrazaderas a distancia constante y tubo bien alineado. No todo es chapuza. Aprende a reconocer el buen trabajo.',
    },
    {
      name: 'Kevin',
      experience: 'Ninguna oficial',
      training: 'Autodidacta (YouTube)',
      task: 'Esquina interior · Reforma parcial',
      verdict: 'chapuza',
      round: 1,
      image: ASSETS.escenario_2,
      correctDefects: ['Esquina forzada sin radio', 'Falta abrazadera en la curva'],
      defectOptions: ['Esquina forzada sin radio', 'Falta abrazadera en la curva', 'Tubo de sección incorrecta'],
      detailFeedbackPerfect: 'Exacto. Esquina forzada sin radio suave y falta una abrazadera junto a la curva. Kevin necesita empezar por lo básico.',
      detailFeedbackPartial: 'Buen ojo, pero aquí hay más de un defecto. La esquina está forzada Y falta una abrazadera cerca de la curva para sujetarla.',
      qualityOptions: ['Radio suave en la esquina', 'Fijación a distancia constante', 'Abrazadera en cada cambio de dirección'],
      eduOverlayText: 'Era chapuza. Defectos: esquina forzada (sin radio suave, el tubo está doblado a lo bruto) y falta abrazadera junto a la curva. Siempre hay que poner una abrazadera antes y después de cada cambio de dirección.',
    },
    {
      name: 'Marcos',
      experience: '6 meses',
      training: 'FP Electricidad (en curso)',
      task: 'Esquina interior · Obra nueva',
      verdict: 'chapuza',
      round: 1,
      image: ASSETS.escenario_3,
      correctDefects: ['Tubo roto en el empalme'],
      defectOptions: ['Tubo roto en el empalme', 'Esquina torcida', 'Fijación irregular'],
      detailFeedbackPerfect: 'Correcto. El tubo está reventado en la unión. Esto pasa cuando se fuerza el empalme sin presentar la pieza antes.',
      detailFeedbackPartial: 'El problema principal es el tubo roto: se ve el agujero en la unión. Hay que presentar siempre antes de forzar.',
      qualityOptions: ['Radio suave en la esquina', 'Empalme limpio y cerrado', 'Se puede abrir para mantenimiento'],
      eduOverlayText: 'Era chapuza. El defecto: tubo roto en el empalme. Se ve un agujero donde se forzó la unión. La regla: medir, presentar la pieza, y solo entonces fijar. Nunca forzar.',
    },
    {
      name: 'Doña Carmen',
      experience: '15 años',
      training: 'Certificado profesionalidad',
      task: 'Encuentro con caja · Reforma integral',
      verdict: 'pro',
      round: 2,
      image: ASSETS.escenario_4,
      correctQualities: ['Llegada limpia a la caja', 'Se puede abrir para mantenimiento'],
      qualityOptions: ['Llegada limpia a la caja', 'Se puede abrir para mantenimiento', 'Doble abrazadera en la llegada'],
      detailFeedbackPerfect: 'Correcto. Llegada limpia y accesible para mantenimiento. Doña Carmen piensa en el mañana.',
      detailFeedbackPartial: 'Buen juicio. Pero aquí destacan dos cosas: la llegada limpia a la caja Y que se puede abrir mañana sin romper nada.',
      defectOptions: ['Cables a la vista', 'Impide mantenimiento', 'Fijación irregular'],
      eduOverlayText: 'Doña Carmen lo ha hecho perfecto: llegada limpia y alineada a la caja, y lo más importante: se puede abrir y repasar mañana sin romper nada.',
    },
    {
      name: 'Rubén "El Rápido"',
      experience: '12 años',
      training: 'FP Electricidad',
      task: 'Encuentro de tramos · Nave industrial',
      verdict: 'chapuza',
      round: 2,
      image: ASSETS.escenario_5,
      correctDefects: ['Fijación irregular', 'Agujeros sin tapar en la pared'],
      defectOptions: ['Fijación irregular', 'Agujeros sin tapar en la pared', 'Empalme mal alineado'],
      detailFeedbackPerfect: 'Correcto. Abrazaderas a ojo y agujeros de tacos sin tapar. Las prisas se notan.',
      detailFeedbackPartial: 'Hay más de un problema aquí. La separación entre abrazaderas es desigual Y se ven agujeros de tacos fallidos sin tapar.',
      qualityOptions: ['Fijación a distancia constante', 'Pared limpia sin agujeros', 'Empalme bien alineado'],
      eduOverlayText: 'Era chapuza. Defectos: fijación irregular (abrazaderas puestas a ojo, sin medir) y agujeros de tacos sin tapar. Se mide antes de taladrar, y si fallas un taco, se tapa el agujero.',
    },
    {
      name: 'Iker',
      experience: '1 año',
      training: 'FP Electricidad (en curso)',
      task: 'Encuentro con mecanismo · Vivienda',
      verdict: 'chapuza',
      round: 2,
      image: ASSETS.escenario_6,
      correctDefects: ['Cables a la vista', 'Sellado con silicona (chapuza)'],
      defectOptions: ['Cables a la vista', 'Sellado con silicona (chapuza)', 'Fijación irregular'],
      detailFeedbackPerfect: 'Exacto. Cables expuestos y silicona por todos lados. Iker ha intentado tapar el desastre con silicona en vez de hacer un remate limpio.',
      detailFeedbackPartial: 'Aquí hay más de un problema. Los cables están a la vista Y se ha sellado con silicona en vez de hacer una llegada limpia al mecanismo.',
      qualityOptions: ['Llegada limpia al mecanismo', 'Cables protegidos', 'Se puede abrir para mantenimiento'],
      eduOverlayText: 'Era chapuza. Defectos: cables a la vista y sellado con silicona. La silicona no es un remate: es un parche. La llegada al mecanismo debe ser limpia, con el tubo entrando recto y los cables protegidos dentro.',
    },
    {
      name: 'Javi',
      experience: 'Sin experiencia',
      training: 'Ninguna ("yo sé de todo")',
      task: 'Remate completo · Chalet',
      verdict: 'chapuza',
      round: 3,
      image: ASSETS.escenario_7,
      correctDefects: ['Remate abierto (cables a la vista)', 'Agujero en la pared sin tapar'],
      defectOptions: ['Remate abierto (cables a la vista)', 'Agujero en la pared sin tapar', 'Fijación irregular'],
      detailFeedbackPerfect: 'Exacto. Remate sin terminar con cables al aire y un agujero en la pared. Javi lo ha dejado a medias.',
      detailFeedbackPartial: 'Aquí hay más de un problema: el tubo termina abierto con cables al aire Y se ve el agujero de la pared sin sellar.',
      qualityOptions: ['Remate cerrado y limpio', 'Cables protegidos dentro del tubo', 'Pared sellada en la entrada'],
      eduOverlayText: 'Era chapuza. Defectos: remate abierto (los cables asoman del tubo) y agujero en la pared sin tapar. El tubo debe terminar con un remate cerrado, los cables dentro, y la entrada a la pared sellada.',
    },
    {
      name: 'Ana',
      experience: '2 años',
      training: 'BootKämp de Kämpe',
      task: 'Remate completo · Obra nueva',
      verdict: 'pro',
      round: 3,
      image: ASSETS.escenario_8,
      correctQualities: ['Radio suave en la esquina', 'Fijación a distancia constante', 'Remate cerrado y limpio'],
      qualityOptions: ['Radio suave en la esquina', 'Fijación a distancia constante', 'Remate cerrado y limpio'],
      detailFeedbackPerfect: 'Eso es. Todo perfecto: radio suave, fijación constante y remate limpio. Ana lo borda.',
      detailFeedbackPartial: 'Era todo correcto. Ana ha hecho un trabajo impecable: radio, fijación y remate. Las tres cosas.',
      defectOptions: ['Esquina torcida', 'Falta abrazadera', 'Remate abierto'],
      eduOverlayText: 'Trabajo impecable. Radio suave en la esquina, abrazaderas a distancia constante por todo el recorrido, y remate cerrado y limpio. Esto es calidad pro.',
    },
  ];

  const ROUND_LABELS = ['RONDA 1 · ESQUINAS', 'RONDA 2 · ENCUENTROS', 'GRAN FINAL'];
  const ROUND_TRANSITIONS = {
    3: { title: 'RONDA 2 · ENCUENTROS', msg: 'Primera ronda completada. Ahora vienen los encuentros: llegadas a caja y uniones de tramos. Aquí es donde muchos fallan. Atento.' },
    6: { title: 'GRAN FINAL', msg: 'Última ronda. La Gran Final. Aquí se evalúa todo junto: estética, remate, mantenimiento. Demuestra que tienes criterio.' },
  };

  const PUBLIC_TEXT_SUCCESS = ['BIEN VISTO', 'EXACTO', 'OLE'];
  const PUBLIC_TEXT_ERROR = 'BUUUU';

  const CELEBRATING_MSGS = {
    pro: [
      'Eso es. Has visto lo bueno y lo has nombrado. Ojo de jurado.',
      'Perfecto. Saber qué hace buena una instalación es tan importante como ver los fallos.',
      'Exacto. Reconocer calidad es el primer paso para producirla.',
    ],
    chapuza: [
      'Eso es. Has visto el defecto y lo has nombrado. Jurado de primera.',
      'Perfecto. Has identificado exactamente lo que falla.',
      'Bien. Saber qué falla Y por qué. Eso es tener criterio.',
    ],
  };
  let celebratingRotation = { pro: 0, chapuza: 0 };

  // --- Score ---
  function addScore(pts) {
    score += pts;
    hudScore.textContent = score + ' pts';
    hudScore.classList.remove('score-pop');
    void hudScore.offsetWidth;
    hudScore.classList.add('score-pop');
    showScoreDelta(pts);
    checkTaskCompleted();
  }

  function showScoreDelta(pts) {
    if (pts <= 0) return;
    const delta = document.createElement('span');
    delta.textContent = '+' + pts;
    delta.style.cssText = 'position:absolute;left:0;top:-4px;font-size:14px;font-weight:700;color:var(--lime);pointer-events:none;animation:fadeUp 0.8s ease-out forwards;';
    hudScore.style.position = 'relative';
    hudScore.appendChild(delta);
    setTimeout(() => delta.remove(), 800);
  }

  // --- Record ---
  function getRecord() {
    return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
  }

  function saveRecord(val) {
    localStorage.setItem(RECORD_KEY, val);
  }

  // --- TASK_COMPLETED ---
  function checkTaskCompleted() {
    if (!taskCompletedSent && score >= TASK_THRESHOLD) {
      taskCompletedSent = true;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
      }
    }
  }

  // --- HUD ---
  function initHUD() {
    hudProgress.innerHTML = '';
    for (let i = 0; i < scenarios.length; i++) {
      const seg = document.createElement('div');
      seg.className = 'seg';
      hudProgress.appendChild(seg);
    }
    hudScore.textContent = '0 pts';
    updateRoundLabel();
  }

  function updateRoundLabel() {
    const s = scenarios[currentScenario];
    if (!s) return;
    hudRound.textContent = ROUND_LABELS[s.round - 1];
  }

  function markSegment(index, ok) {
    const segs = hudProgress.querySelectorAll('.seg');
    if (segs[index]) {
      segs[index].classList.add(ok ? 'ok' : 'fail');
    }
  }

  // --- Avatar ---
  function setAvatar(state) {
    gameplayAvatar.src = ASSETS['lucia_' + state];
  }

  // --- Scratch Canvas ---
  function initScratchCanvas() {
    const w = 320 * RETINA;
    const h = 360 * RETINA;
    scratchCanvas.width = w;
    scratchCanvas.height = h;
    shimmerCanvas.width = w;
    shimmerCanvas.height = h;

    // Round-based gradient fill
    const round = scenarios[currentScenario] ? scenarios[currentScenario].round : 1;
    const grad = scratchCtx.createLinearGradient(0, 0, w, h);
    if (round === 1) {
      // Gold
      grad.addColorStop(0, '#D4AF37');
      grad.addColorStop(0.4, '#F5D061');
      grad.addColorStop(0.6, '#D4AF37');
      grad.addColorStop(1, '#C5982E');
    } else if (round === 2) {
      // Silver-blue
      grad.addColorStop(0, '#8EAFC2');
      grad.addColorStop(0.4, '#C5D8E8');
      grad.addColorStop(0.6, '#8EAFC2');
      grad.addColorStop(1, '#6A94AD');
    } else {
      // Rose-gold (final)
      grad.addColorStop(0, '#B76E79');
      grad.addColorStop(0.4, '#E8B4B8');
      grad.addColorStop(0.6, '#D4918A');
      grad.addColorStop(1, '#B76E79');
    }
    scratchCtx.fillStyle = grad;
    scratchCtx.fillRect(0, 0, w, h);

    // Reset shimmer
    shimmerCtx.clearRect(0, 0, w, h);

    // Show canvas
    scratchCanvas.style.opacity = '1';
    scratchCanvas.style.display = 'block';
    scratchCanvas.style.transition = '';
    shimmerCanvas.style.display = 'block';

    // Setup scratch drawing
    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchCtx.lineCap = 'round';
    scratchCtx.lineJoin = 'round';
    scratchCtx.lineWidth = 56; // 28px * retina

    isScratching = false;
    lastScratchPos = null;

    // Start percentage check
    if (scratchCheckInterval) clearInterval(scratchCheckInterval);
    scratchCheckInterval = setInterval(checkScratchProgress, SCRATCH_CHECK_MS);
  }

  function getScratchPos(e) {
    const rect = scratchCanvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * RETINA,
      y: (touch.clientY - rect.top) * RETINA,
    };
  }

  function scratchStart(e) {
    if (inputLocked) return;
    e.preventDefault();
    isScratching = true;
    const pos = getScratchPos(e);
    lastScratchPos = pos;

    // Draw dot at start
    scratchCtx.beginPath();
    scratchCtx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
    scratchCtx.fill();

    // Glow
    updateGlowPosition(e);
    glowFinger.style.opacity = '0.6';

    // Haptic
    if (navigator.vibrate) navigator.vibrate(10);

    // Shimmer dot
    drawShimmer(pos);
  }

  function scratchMove(e) {
    if (!isScratching || inputLocked) return;
    e.preventDefault();
    const pos = getScratchPos(e);

    // Draw line from last to current
    if (lastScratchPos) {
      scratchCtx.beginPath();
      scratchCtx.moveTo(lastScratchPos.x, lastScratchPos.y);
      scratchCtx.lineTo(pos.x, pos.y);
      scratchCtx.stroke();
    }

    lastScratchPos = pos;

    // Glow follows finger
    updateGlowPosition(e);

    // Shimmer trail
    drawShimmer(pos);

    // Particles (throttled to ~60ms)
    const now = Date.now();
    if (now - particleThrottle > 60) {
      particleThrottle = now;
      spawnParticles(e);
    }
  }

  function scratchEnd(e) {
    if (!isScratching) return;
    isScratching = false;
    lastScratchPos = null;
    glowFinger.style.opacity = '0';
  }

  function updateGlowPosition(e) {
    const rect = scenarioArea.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    glowFinger.style.left = x + 'px';
    glowFinger.style.top = y + 'px';
  }

  function drawShimmer(pos) {
    shimmerCtx.globalAlpha = 0.4;
    shimmerCtx.fillStyle = 'rgba(255,255,255,0.4)';
    shimmerCtx.beginPath();
    shimmerCtx.arc(pos.x, pos.y, 36, 0, Math.PI * 2);
    shimmerCtx.fill();
    shimmerCtx.globalAlpha = 1;
  }

  // Shimmer fade loop
  let shimmerFadeId = null;
  function startShimmerFade() {
    function fade() {
      shimmerCtx.save();
      shimmerCtx.globalCompositeOperation = 'destination-out';
      shimmerCtx.globalAlpha = 0.15;
      shimmerCtx.fillStyle = 'rgba(0,0,0,1)';
      shimmerCtx.fillRect(0, 0, shimmerCanvas.width, shimmerCanvas.height);
      shimmerCtx.restore();
      shimmerFadeId = requestAnimationFrame(fade);
    }
    shimmerFadeId = requestAnimationFrame(fade);
  }

  function stopShimmerFade() {
    if (shimmerFadeId) cancelAnimationFrame(shimmerFadeId);
  }

  function spawnParticles(e) {
    const rect = scenarioArea.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const cx = touch.clientX - rect.left;
    const cy = touch.clientY - rect.top;
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'scratch-particle';
      const tx = (Math.random() - 0.5) * 60;
      const ty = -20 + Math.random() * 60;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      scenarioArea.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  function checkScratchProgress() {
    const w = scratchCanvas.width;
    const h = scratchCanvas.height;
    // Sample a grid for performance (every 4th pixel)
    const step = 4;
    const data = scratchCtx.getImageData(0, 0, w, h).data;
    let transparent = 0;
    let total = 0;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] === 0) transparent++;
        total++;
      }
    }
    const ratio = transparent / total;
    if (ratio >= SCRATCH_THRESHOLD) {
      autoReveal();
    }
  }

  function autoReveal() {
    if (scratchCheckInterval) {
      clearInterval(scratchCheckInterval);
      scratchCheckInterval = null;
    }
    isScratching = false;
    glowFinger.style.opacity = '0';
    stopShimmerFade();

    // Flash
    revealFlash.style.transition = 'opacity 0.1s ease';
    revealFlash.style.opacity = '1';
    setTimeout(() => {
      revealFlash.style.transition = 'opacity 0.4s ease';
      revealFlash.style.opacity = '0';
    }, 100);

    // Fade out scratch canvas
    scratchCanvas.style.transition = 'opacity 0.5s ease-out';
    scratchCanvas.style.opacity = '0';
    shimmerCanvas.style.display = 'none';

    // Remove touch events temporarily
    scratchCanvas.style.pointerEvents = 'none';

    setTimeout(() => {
      scratchCanvas.style.display = 'none';
      onScratchRevealed();
    }, 500);
  }

  function onScratchRevealed() {
    // Tutorial step 2 (after reveal on scenario 1)
    if (currentScenario === 0 && tutorialStep === 1) {
      tutorialStep = 2;
      showTutorialToast(
        'Ahora mira bien. Ves líneas rectas? Fijación constante? El radio de la esquina es suave? Decide: Pro o Chapuza.',
        () => {
          showJudgmentButtons();
        }
      );
      return;
    }
    // Normal: show judgment buttons after 0.3s
    setTimeout(showJudgmentButtons, 300);
  }

  // --- Tutorial ---
  // --- Tutorial Modal ---
  const tutorialOverlay = document.getElementById('tutorial-overlay');
  const tutorialText = document.getElementById('tutorial-text');
  const tutorialBtn = document.getElementById('tutorial-btn');

  function showTutorialToast(msg, onDismiss) {
    inputLocked = true;
    tutorialText.textContent = msg;
    tutorialOverlay.classList.remove('hidden');
    tutorialBtn.onclick = function () {
      tutorialOverlay.classList.add('hidden');
      inputLocked = false;
      if (onDismiss) onDismiss();
    };
  }

  // --- Judgment ---
  function showJudgmentButtons() {
    // Hide contestant card
    contestantCard.style.opacity = '0';
    setTimeout(() => contestantCard.classList.add('hidden'), 200);

    // Show buttons with pop animation
    judgmentButtons.classList.remove('hidden');
    btnPro.style.transform = 'scale(0)';
    btnChapuza.style.transform = 'scale(0)';
    void btnPro.offsetWidth;
    btnPro.style.transition = 'transform 0.2s ease-out';
    btnChapuza.style.transition = 'transform 0.2s ease-out';
    btnPro.style.transform = 'scale(1)';
    btnChapuza.style.transform = 'scale(1)';
  }

  function handleJudgment(playerVerdict) {
    if (inputLocked) return;
    inputLocked = true;

    const chosenBtn = playerVerdict === 'pro' ? btnPro : btnChapuza;
    const otherBtn = playerVerdict === 'pro' ? btnChapuza : btnPro;

    // Pulse chosen, fade other
    chosenBtn.style.transition = 'transform 0.2s ease-in-out';
    chosenBtn.style.transform = 'scale(1.1)';
    setTimeout(() => { chosenBtn.style.transform = 'scale(1)'; }, 200);
    otherBtn.style.transition = 'opacity 0.2s ease';
    otherBtn.style.opacity = '0';

    // Always show detail options — correctness is resolved when player picks one
    setTimeout(() => {
      judgmentButtons.classList.add('hidden');
      btnPro.style.opacity = '1';
      btnChapuza.style.opacity = '1';
      showDetailOptions(playerVerdict);
    }, 300);
  }

  // --- Detail Options ---
  function showDetailOptions(playerVerdict) {
    const s = scenarios[currentScenario];

    // Tutorial: after pressing PRO/CHAPUZA on first scenario, explain the detail step
    if (currentScenario === 0 && tutorialStep === 2) {
      const msg = playerVerdict === 'pro'
        ? 'Bien. Ahora dime: qué hace buena esta instalación? Selecciona todo lo que veas bien y pulsa Confirmar.'
        : 'Bien. Ahora dime: qué está mal? Puede haber más de un defecto. Selecciona y pulsa Confirmar.';
      showTutorialToast(msg, () => {
        renderDetailButtons(playerVerdict);
      });
      return;
    }

    renderDetailButtons(playerVerdict);
  }

  function renderDetailButtons(playerVerdict) {
    const s = scenarios[currentScenario];
    const options = playerVerdict === 'pro' ? s.qualityOptions : s.defectOptions;
    const selected = new Set();

    detailOptions.innerHTML = '';
    detailOptions.classList.remove('hidden');

    const buttons = [];
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn-detail';
      btn.textContent = opt;
      btn.style.transform = 'scale(0)';
      btn.style.transition = 'transform 0.2s ease-out ' + (i * 0.1) + 's, background 0.2s ease';
      detailOptions.appendChild(btn);
      buttons.push(btn);

      requestAnimationFrame(() => { btn.style.transform = 'scale(1)'; });

      btn.addEventListener('click', () => {
        if (inputLocked) return;
        if (selected.has(opt)) {
          selected.delete(opt);
          btn.classList.remove('selected');
        } else {
          selected.add(opt);
          btn.classList.add('selected');
        }
        confirmBtn.disabled = selected.size === 0;
      });
    });

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-confirm';
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.disabled = true;
    confirmBtn.style.transform = 'scale(0)';
    confirmBtn.style.transition = 'transform 0.2s ease-out ' + (options.length * 0.1) + 's';
    detailOptions.appendChild(confirmBtn);
    requestAnimationFrame(() => { confirmBtn.style.transform = 'scale(1)'; });

    confirmBtn.addEventListener('click', () => {
      if (inputLocked || selected.size === 0) return;
      handleDetailConfirm(Array.from(selected), playerVerdict, buttons, confirmBtn);
    });

    inputLocked = false;
  }

  function handleDetailConfirm(selectedList, playerVerdict, buttons, confirmBtn) {
    inputLocked = true;
    const s = scenarios[currentScenario];
    const judgmentCorrect = playerVerdict === s.verdict;

    // Hide confirm button
    confirmBtn.style.transition = 'opacity 0.2s ease';
    confirmBtn.style.opacity = '0';
    confirmBtn.disabled = true;

    if (!judgmentCorrect) {
      // WRONG JUDGMENT — 0 pts, edu overlay
      buttons.forEach(b => { b.style.opacity = '0.3'; b.classList.remove('selected'); });
      markSegment(currentScenario, false);
      showPublicText(PUBLIC_TEXT_ERROR, 'var(--rojo)');
      setAvatar('worried');

      scenarioResults.push({
        name: s.name, playerVerdict: playerVerdict, correctVerdict: s.verdict,
        judgmentCorrect: false, detailPerfect: false, points: 0,
        selectedDetails: selectedList,
        correctDetails: s.verdict === 'pro' ? s.correctQualities : s.correctDefects,
      });

      if (currentScenario === 0 && tutorialStep === 2) tutorialStep = 3;

      setTimeout(() => {
        detailOptions.classList.add('hidden');
        showEduOverlay(s);
      }, 900);
      return;
    }

    // CORRECT JUDGMENT — evaluate multi-select
    const correctArr = playerVerdict === 'pro' ? s.correctQualities : s.correctDefects;
    const correctSet = new Set(correctArr);
    const selectedSet = new Set(selectedList);

    const correctHits = selectedList.filter(d => correctSet.has(d));
    const wrongHits = selectedList.filter(d => !correctSet.has(d));
    const missed = correctArr.filter(d => !selectedSet.has(d));

    const isPerfect = correctHits.length === correctSet.size && wrongHits.length === 0;
    const hasWrongSelections = wrongHits.length > 0;
    const isPartial = correctHits.length > 0 && !isPerfect;

    // Visual feedback on buttons
    buttons.forEach(btn => {
      const opt = btn.textContent;
      const wasSelected = selectedSet.has(opt);
      const isCorrect = correctSet.has(opt);
      btn.classList.remove('selected');
      if (wasSelected && isCorrect) {
        btn.classList.add('correct');
      } else if (wasSelected && !isCorrect) {
        btn.classList.add('wrong');
      } else if (!wasSelected && isCorrect) {
        btn.classList.add('missed');
      } else {
        btn.style.opacity = '0.3';
      }
    });

    let points;
    if (isPerfect) {
      points = 150;
      addScore(150);
      markSegment(currentScenario, true);
      showPublicText(PUBLIC_TEXT_SUCCESS[publicTextRotation % 3], 'var(--lime)');
      publicTextRotation++;
      setAvatar('celebrating');
    } else if (isPartial && !hasWrongSelections) {
      // Missed some correct, but didn't select anything wrong
      points = 100;
      addScore(100);
      markSegment(currentScenario, true);
      setAvatar('happy');
    } else if (hasWrongSelections) {
      // Selected wrong options (even if also got some correct)
      points = 50;
      addScore(50);
      markSegment(currentScenario, true);
      setAvatar('worried');
    } else {
      points = 50;
      addScore(50);
      markSegment(currentScenario, true);
      setAvatar('happy');
    }

    scenarioResults.push({
      name: s.name, playerVerdict: playerVerdict, correctVerdict: s.verdict,
      judgmentCorrect: true, detailPerfect: isPerfect, points: points,
      selectedDetails: selectedList,
      correctDetails: correctArr.slice(),
    });

    if (currentScenario === 0 && tutorialStep === 2) tutorialStep = 3;

    let feedbackMsg;
    if (isPerfect) {
      feedbackMsg = s.detailFeedbackPerfect;
    } else if (hasWrongSelections) {
      // Build specific feedback calling out wrong selections
      const wrongNames = wrongHits.map(w => '"' + w + '"').join(' y ');
      feedbackMsg = 'Has marcado ' + wrongNames + ' y eso no es correcto aquí. ' + s.detailFeedbackPartial;
    } else {
      feedbackMsg = s.detailFeedbackPartial;
    }

    if (isPerfect) {
      if (currentScenario === 0 && tutorialStep === 3) {
        showSuccessToast('Bien visto. Así se evalúa. A partir de ahora, tú solo.');
      } else {
        showSuccessToast(feedbackMsg);
      }
      setTimeout(() => {
        toast.classList.add('hidden');
        detailOptions.classList.add('hidden');
        transitionToNext();
      }, 2500);
    } else if (hasWrongSelections) {
      showWrongSelectionsToast(feedbackMsg, () => {
        detailOptions.classList.add('hidden');
        transitionToNext();
      });
    } else {
      showPartialToast(feedbackMsg, () => {
        detailOptions.classList.add('hidden');
        transitionToNext();
      });
    }
  }

  // --- Educational Overlay ---
  function showEduOverlay(scenario) {
    const isPro = scenario.verdict === 'pro';
    eduCard.innerHTML = '';

    // Avatar
    const avatar = document.createElement('img');
    avatar.className = 'edu-avatar';
    avatar.src = ASSETS.lucia_worried;
    avatar.alt = 'Lucía';
    eduCard.appendChild(avatar);

    // Icon
    const icon = document.createElement('div');
    icon.className = 'edu-icon';
    icon.textContent = isPro ? '?' : '✗';
    eduCard.appendChild(icon);

    // Verdict
    const verdict = document.createElement('div');
    verdict.className = 'edu-verdict';
    verdict.style.color = isPro ? 'var(--turquesa)' : 'var(--rojo)';
    verdict.textContent = isPro ? 'Era pro' : 'Era chapuza';
    eduCard.appendChild(verdict);

    if (!isPro) {
      // Defect name
      const defect = document.createElement('div');
      defect.className = 'edu-defect';
      defect.textContent = (scenario.correctDefects.length > 1 ? 'Defectos: ' : 'Defecto: ') + scenario.correctDefects.join(', ');
      eduCard.appendChild(defect);
    }

    // Explanation
    const explanation = document.createElement('div');
    explanation.className = 'edu-explanation';
    explanation.textContent = scenario.eduOverlayText;
    eduCard.appendChild(explanation);

    // Image thumbnail
    const img = document.createElement('img');
    img.className = 'edu-img';
    img.src = scenario.image;
    img.alt = 'Instalación';
    eduCard.appendChild(img);

    // Entendido button
    const btn = document.createElement('button');
    btn.className = 'btn-entendido';
    btn.style.cssText = 'background:var(--turquesa);color:var(--navy);font-family:"Baloo 2",cursive;font-size:14px;font-weight:700;border:none;border-radius:12px;padding:10px 24px;width:100%;cursor:pointer;';
    btn.textContent = 'Entendido';
    eduCard.appendChild(btn);

    // Show
    eduOverlay.classList.remove('hidden');
    eduOverlay.style.opacity = '0';
    requestAnimationFrame(() => {
      eduOverlay.style.transition = 'opacity 0.3s ease-out';
      eduOverlay.style.opacity = '1';
    });

    // Tutorial step 3 if scenario 1 and error
    if (currentScenario === 0 && tutorialStep === 2) {
      tutorialStep = 3;
    }

    btn.addEventListener('click', function handler() {
      btn.removeEventListener('click', handler);
      eduOverlay.style.transition = 'opacity 0.3s ease-in';
      eduOverlay.style.opacity = '0';
      setTimeout(() => {
        eduOverlay.classList.add('hidden');
        inputLocked = false;
        transitionToNext();
      }, 300);
    });
  }

  // --- Public Text ---
  function showPublicText(text, color) {
    publicText.textContent = text;
    publicText.style.color = color;
    publicText.classList.remove('hidden');
    publicText.style.opacity = '1';
    publicText.style.transform = 'translate(-50%, -50%)';
    publicText.style.transition = 'none';
    void publicText.offsetWidth;

    setTimeout(() => {
      publicText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      publicText.style.opacity = '0';
      publicText.style.transform = 'translate(-50%, -70%)';
    }, 900);

    setTimeout(() => {
      publicText.classList.add('hidden');
    }, 1200);
  }

  // --- Toasts ---
  function showSuccessToast(msg) {
    toast.className = 'success';
    toast.innerHTML = '<img src="' + ASSETS.lucia_celebrating + '" class="toast-avatar" alt="">' +
      '<p>' + msg + '</p>';
    toast.classList.remove('hidden');
  }

  function showPartialToast(msg, onDismiss) {
    toast.className = 'partial';
    toast.innerHTML = '<img src="' + ASSETS.lucia_happy + '" class="toast-avatar" alt="">' +
      '<p>' + msg + '</p><button class="btn-entendido">Entendido</button>';
    toast.classList.remove('hidden');
    const btn = toast.querySelector('.btn-entendido');
    btn.addEventListener('click', function handler() {
      btn.removeEventListener('click', handler);
      toast.classList.add('hidden');
      inputLocked = false;
      if (onDismiss) onDismiss();
    });
  }

  function showWrongSelectionsToast(msg, onDismiss) {
    toast.className = 'wrong-selections';
    toast.innerHTML = '<img src="' + ASSETS.lucia_worried + '" class="toast-avatar" alt="">' +
      '<p>' + msg + '</p><button class="btn-entendido">Entendido</button>';
    toast.classList.remove('hidden');
    const btn = toast.querySelector('.btn-entendido');
    btn.addEventListener('click', function handler() {
      btn.removeEventListener('click', handler);
      toast.classList.add('hidden');
      inputLocked = false;
      if (onDismiss) onDismiss();
    });
  }

  // --- Transitions ---
  function transitionToNext() {
    inputLocked = true;
    currentScenario++;

    // Check if round transition needed
    if (ROUND_TRANSITIONS[currentScenario]) {
      showRoundTransition(ROUND_TRANSITIONS[currentScenario], () => {
        if (currentScenario >= scenarios.length) {
          showResults();
        } else {
          slideToNextScenario();
        }
      });
      return;
    }

    if (currentScenario >= scenarios.length) {
      showResults();
      return;
    }

    slideToNextScenario();
  }

  function slideToNextScenario() {
    // Slide out current
    scenarioArea.style.transition = 'transform 0.4s ease-in, opacity 0.3s ease';
    scenarioArea.style.transform = 'translateX(-110%)';
    scenarioArea.style.opacity = '0';

    setTimeout(() => {
      loadScenario(currentScenario);
      scenarioArea.style.transition = 'none';
      scenarioArea.style.transform = 'translateX(110%)';
      scenarioArea.style.opacity = '0';
      void scenarioArea.offsetWidth;
      scenarioArea.style.transition = 'transform 0.4s ease-out, opacity 0.3s ease';
      scenarioArea.style.transform = 'translateX(0)';
      scenarioArea.style.opacity = '1';
      inputLocked = false;
    }, 400);
  }

  function showRoundTransition(roundData, onDone) {
    roundContent.innerHTML = '<h2>' + roundData.title + '</h2><p style="color:var(--mint);font-size:14px;max-width:300px;margin:0 auto 16px;line-height:1.5;">' + roundData.msg + '</p><button class="btn-primary" style="max-width:240px;margin:0 auto;">Siguiente ronda</button>';

    roundOverlay.classList.remove('hidden');
    roundOverlay.style.opacity = '0';
    requestAnimationFrame(() => {
      roundOverlay.style.transition = 'opacity 0.3s ease-out';
      roundOverlay.style.opacity = '1';
    });

    const btn = roundContent.querySelector('.btn-primary');
    btn.addEventListener('click', function handler() {
      btn.removeEventListener('click', handler);
      roundOverlay.style.transition = 'opacity 0.3s ease-in';
      roundOverlay.style.opacity = '0';
      setTimeout(() => {
        roundOverlay.classList.add('hidden');
        if (onDone) onDone();
      }, 300);
    });
  }

  // --- Load Scenario ---
  function loadScenario(index) {
    const s = scenarios[index];
    if (!s) return;

    // Load image
    scenarioImg.src = s.image;

    // Init scratch canvas
    initScratchCanvas();
    startShimmerFade();
    scratchCanvas.style.pointerEvents = 'auto';

    // Update round label
    updateRoundLabel();

    // Reset avatar
    setAvatar('happy');

    // Hide all UI
    judgmentButtons.classList.add('hidden');
    detailOptions.classList.add('hidden');
    toast.classList.add('hidden');
    publicText.classList.add('hidden');

    // Show contestant card
    contestantCard.innerHTML =
      '<div class="card-name">' + s.name + '</div>' +
      '<ul class="card-list">' +
        '<li><span class="card-label">Experiencia:</span> ' + s.experience + '</li>' +
        '<li><span class="card-label">Formación:</span> ' + s.training + '</li>' +
        '<li><span class="card-label">Tarea:</span> ' + s.task + '</li>' +
      '</ul>';
    contestantCard.classList.remove('hidden');
    contestantCard.style.opacity = '0';
    contestantCard.style.transform = 'translateY(20px)';
    void contestantCard.offsetWidth;
    contestantCard.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    contestantCard.style.opacity = '1';
    contestantCard.style.transform = 'translateY(0)';

    // Tutorial step 1 for first scenario
    if (index === 0 && tutorialStep === 0) {
      tutorialStep = 1;
      inputLocked = true;
      showTutorialToast(
        'Desliza el dedo sobre la capa dorada para descubrir la instalación del concursante. Tómate tu tiempo. No hay prisa.',
        () => {
          inputLocked = false;
        }
      );
    }
  }

  // --- Results ---
  function showResults() {
    showScreen('results');
    checkTaskCompleted();

    const record = getRecord();
    const isNewRecord = score > record;
    if (isNewRecord) {
      saveRecord(score);
    }

    // Score counter animation
    const scoreEl = document.getElementById('results-score');
    const ptsEl = document.getElementById('results-pts');
    const recordEl = document.getElementById('results-record');
    const progressEl = document.getElementById('results-progress');
    const avatarEl = document.getElementById('results-avatar');
    const messageEl = document.getElementById('results-message');
    const detailEl = document.getElementById('results-detail');

    // Animate score from 0 to final
    scoreEl.textContent = '0';
    const startTime = performance.now();
    const duration = 1200;

    function animateScore(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out: fast start, slow end
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      scoreEl.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      } else {
        scoreEl.textContent = score;
        // Pop at end
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 200);

        // Record
        recordEl.classList.remove('hidden');
        if (isNewRecord && score > 0) {
          setTimeout(() => {
            recordEl.textContent = 'Nuevo récord!';
            recordEl.style.color = 'var(--lemon)';
            recordEl.style.opacity = '0';
            recordEl.style.transition = 'opacity 0.3s ease-out';
            void recordEl.offsetWidth;
            recordEl.style.opacity = '1';
          }, 300);
        } else if (record > 0) {
          recordEl.textContent = 'Record: ' + record + ' pts';
        } else {
          recordEl.textContent = '\u00A0'; // non-breaking space placeholder
        }
      }
    }
    requestAnimationFrame(animateScore);

    // Progress segments
    progressEl.innerHTML = '';
    scenarioResults.forEach(r => {
      const seg = document.createElement('div');
      seg.className = 'seg ' + (r.judgmentCorrect ? 'ok' : 'fail');
      progressEl.appendChild(seg);
    });

    // Tier
    let tier, tierMsg;
    if (score >= 960) {
      tier = 'celebrating';
      tierMsg = 'Ojo clínico. El gremio tiene un jurado de primera.';
    } else if (score >= 700) {
      tier = 'happy';
      tierMsg = 'Buen trabajo. Repasa los encuentros. Ahí es donde más se escapa la chapuza.';
    } else {
      tier = 'worried';
      tierMsg = 'Necesitas entrenar el ojo. Recuerda: medir, marcar, presentar antes de fijar. Vuelve a intentarlo.';
    }

    avatarEl.src = ASSETS['lucia_' + tier];
    messageEl.innerHTML = '<p>' + tierMsg + '</p>';

    // Detail rows
    detailEl.innerHTML = '';
    scenarioResults.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'detail-row';

      let statusIcon, statusClass;
      if (r.judgmentCorrect) {
        statusIcon = '✓';
        statusClass = 'ok';
      } else {
        statusIcon = '✗';
        statusClass = 'fail';
      }

      let detailText = '';
      if (r.judgmentCorrect && r.detailPerfect) {
        detailText = '<br><small class="ok">Detalle perfecto (+50)</small>';
      } else if (r.judgmentCorrect && !r.detailPerfect) {
        const correctSet = new Set(r.correctDetails);
        const missed = r.correctDetails.filter(d => !r.selectedDetails.includes(d));
        const wrong = r.selectedDetails.filter(d => !correctSet.has(d));
        let parts = [];
        if (missed.length) parts.push('Faltó: ' + missed.join(', '));
        if (wrong.length) parts.push('Sobra: ' + wrong.join(', '));
        if (parts.length) detailText = '<br><small class="fail">' + parts.join(' · ') + '</small>';
      }

      row.innerHTML = '<span class="name">' + (i + 1) + '. ' + r.name + '</span> — <span class="' + statusClass + '">' + statusIcon + ' ' + r.points + ' pts</span>' + detailText;
      detailEl.appendChild(row);
    });
  }

  // --- Touch/Mouse Event Binding ---
  function bindScratchEvents() {
    // Touch
    scratchCanvas.addEventListener('touchstart', scratchStart, { passive: false });
    scratchCanvas.addEventListener('touchmove', scratchMove, { passive: false });
    scratchCanvas.addEventListener('touchend', scratchEnd);
    scratchCanvas.addEventListener('touchcancel', scratchEnd);
    // Mouse fallback
    scratchCanvas.addEventListener('mousedown', scratchStart);
    scratchCanvas.addEventListener('mousemove', scratchMove);
    scratchCanvas.addEventListener('mouseup', scratchEnd);
    scratchCanvas.addEventListener('mouseleave', scratchEnd);
  }

  function bindJudgmentEvents() {
    btnPro.addEventListener('click', () => handleJudgment('pro'));
    btnChapuza.addEventListener('click', () => handleJudgment('chapuza'));
  }

  // --- Init ---
  function init() {
    score = 0;
    currentScenario = 0;
    scenarioResults = [];
    taskCompletedSent = false;
    tutorialStep = 0;
    inputLocked = false;
    publicTextRotation = 0;
    celebratingRotation = { pro: 0, chapuza: 0 };

    initHUD();

    document.getElementById('btn-start').addEventListener('click', () => {
      showScreen('play');
      loadScenario(0);
    });

    document.getElementById('btn-replay').addEventListener('click', () => {
      // Reset all state
      score = 0;
      currentScenario = 0;
      scenarioResults = [];
      taskCompletedSent = false;
      tutorialStep = 0;
      inputLocked = false;
      publicTextRotation = 0;
      celebratingRotation = { pro: 0, chapuza: 0 };

      // Reset HUD
      hudScore.textContent = '0 pts';
      hudProgress.querySelectorAll('.seg').forEach(s => {
        s.classList.remove('ok', 'fail');
      });

      // Reset scenario area
      scenarioArea.style.transform = '';
      scenarioArea.style.opacity = '';

      // Hide overlays
      eduOverlay.classList.add('hidden');
      roundOverlay.classList.add('hidden');

      showScreen('intro');
    });

    bindScratchEvents();
    bindJudgmentEvents();
  }

  init();
})();
