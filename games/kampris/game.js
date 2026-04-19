/* ─────────────────────────────────────────────
   KampRIS — tradeshow falling-item arcade
   Mechanic: center-spawn, swipe left/right, lane-sort, Tetris-style line-clear.
   ───────────────────────────────────────────── */

(() => {
  'use strict';

  // ─────────────── Config ───────────────

  const LANES = ['electricidad', 'fontaneria', 'climatizacion'];
  const ITEM_SIZE = 80;
  const STACK_ROWS = 5;

  // Cloudinary asset base + per-file public ID map (PNG delivery, auto format/quality)
  const CDN_BASE = 'https://res.cloudinary.com/kampe/image/upload/f_auto,q_auto/';
  const ASSET_MAP = {
    game_title:           'game_title_vgld8d.png',
    icon_electricidad:    'icon_electricidad_s2ymmv.png',
    icon_fontaneria:      'icon_fontaneria_r4tgdy.png',
    icon_climatizacion:   'icon_climatizacion_cmgom2.png',
    item_bombilla:        'item_bombilla_mvheyq.png',
    item_cable:           'item_cable_xdceew.png',
    item_enchufe:         'item_enchufe_jojgxc.png',
    item_interruptor:     'item_interruptor_myfbma.png',
    item_cuadro:          'item_cuadro_nf2j0d.png',
    item_tubo:            'item_tubo_clzudf.png',
    item_grifo:           'item_grifo_a4qtyl.png',
    item_llave:           'item_llave_vqixy7.png',
    item_valvula:         'item_valvula_rxkwrz.png',
    item_sifon:           'item_sifon_gekdcd.png',
    item_radiador:        'item_radiador_ycjgcu.png',
    item_split:           'item_split_xs7imv.png',
    item_termostato:      'item_termostato_j6iyco.png',
    item_caldera:         'item_caldera_hzgnmf.png',
    item_rejilla:         'item_rejilla_wfe055.png',
  };
  const ASSET_URL = (key) => CDN_BASE + ASSET_MAP[key];
  const ITEM_URL  = (key) => ASSET_URL('item_' + key);
  const SWIPE_THRESHOLD = 45;         // min horizontal travel (px) to register as a swipe
  const SWIPE_DOMINANCE = 1.4;         // horizontal travel must beat vertical by this factor
  const SWIPE_MAX_DURATION = 600;      // ms — slow drags are ignored (they're probably drifts)

  const WRONG_DECAY_MIN_MS = 1200;     // at tier 10, wrong pieces fade fast
  const WRONG_DECAY_MAX_MS = 2500;     // at tier 1, wrong pieces linger
  const WRONG_PENALTY = 50;            // score penalty on wrong landing (clamped so score stays ≥ 0)

  const ITEM_POOL = [
    { key: 'bombilla',    category: 'electricidad',   label: 'Bombilla'   },
    { key: 'cable',       category: 'electricidad',   label: 'Cable'      },
    { key: 'enchufe',     category: 'electricidad',   label: 'Enchufe'    },
    { key: 'interruptor', category: 'electricidad',   label: 'Interruptor'},
    { key: 'cuadro',      category: 'electricidad',   label: 'Cuadro'     },
    { key: 'tubo',        category: 'fontaneria',     label: 'Tubo'       },
    { key: 'grifo',       category: 'fontaneria',     label: 'Grifo'      },
    { key: 'llave',       category: 'fontaneria',     label: 'Llave'      },
    { key: 'valvula',     category: 'fontaneria',     label: 'Válvula'    },
    { key: 'sifon',       category: 'fontaneria',     label: 'Sifón'      },
    { key: 'radiador',    category: 'climatizacion',  label: 'Radiador'   },
    { key: 'split',       category: 'climatizacion',  label: 'Split'      },
    { key: 'termostato',  category: 'climatizacion',  label: 'Termostato' },
    { key: 'caldera',     category: 'climatizacion',  label: 'Caldera'    },
    { key: 'rejilla',     category: 'climatizacion',  label: 'Rejilla'    },
  ];

  const TIERS = [
    // tier 1..10 — speed (px/s), spawn interval range (ms)
    { speed: 120, spawnMin: 1200, spawnMax: 1800 },
    { speed: 160, spawnMin: 1000, spawnMax: 1500 },
    { speed: 200, spawnMin:  900, spawnMax: 1300 },
    { speed: 240, spawnMin:  800, spawnMax: 1100 },
    { speed: 290, spawnMin:  700, spawnMax: 1000 },
    { speed: 340, spawnMin:  600, spawnMax:  900 },
    { speed: 400, spawnMin:  550, spawnMax:  800 },
    { speed: 460, spawnMin:  500, spawnMax:  700 },
    { speed: 520, spawnMin:  450, spawnMax:  650 },
    { speed: 600, spawnMin:  400, spawnMax:  600 },
  ];

  const TIER_TIME_MS = 20000;
  const TIER_CLEARS = 3;

  // ─────────────── DOM refs ───────────────

  const $ = (sel) => document.querySelector(sel);
  const intro       = $('#intro');
  const play        = $('#play');
  const results     = $('#results');
  const btnStart    = $('#btn-start');
  const btnReplay   = $('#btn-replay');
  const hudScore    = $('#hud-score');
  const playfield   = $('#playfield');
  const fallZone   = $('#fall-zone');
  const laneStacks  = [0, 1, 2].map(i => document.querySelector(`.lane-stack[data-lane="${i}"]`));
  const laneHeaders = [0, 1, 2].map(i => document.querySelector(`.lane-header[data-lane="${i}"]`));
  const particlesEl = $('#particles');
  const comboTextEl = $('#combo-text');
  const flashOverlay = $('#flash-overlay');
  const countdown   = $('#countdown');
  const countdownNumber = $('#countdown-number');
  const resultsScore = $('#results-score');
  const resultsRecord = $('#results-record');
  const resultsStats  = $('#results-stats');
  const shatterStage  = $('#shatter-stage');

  // ─────────────── State ───────────────

  const state = {
    running: false,
    paused: false,          // true while a tutorial step is active
    tier: 1,                // 1..10
    tierTimer: 0,           // ms since last tier up
    clearsSinceTierUp: 0,
    score: 0,
    combo: 1,
    maxCombo: 1,
    linesCleared: 0,
    maxTier: 1,
    spawnCooldown: 0,       // ms until next spawn
    currentItem: null,      // active falling item (or null)
    stacks: [[], [], []],   // array of stacked item descriptors
    bag: [],                // shuffle bag
    lastPicks: [],          // track last 3 picks for anti-streak
    lastFrameTime: 0,
    rafId: null,
    // Tutorial flags — reset every game
    tut_firstPieceShown: false,
    tut_firstWrongShown: false,
    tut_forceFirstElectricidad: false,
  };

  // ─────────────── Utilities ───────────────

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmtScore(n) { return n.toLocaleString('es-ES'); }

  function vibrate(level, pattern) {
    // Standalone kiosk: navigator.vibrate fallback
    const bridgedMsg = { action: 'VIBRATE', level };
    if (pattern) bridgedMsg.pattern = pattern;
    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(bridgedMsg)); } catch (_) {}
      return;
    }
    if (navigator.vibrate) {
      const durations = { light: 20, medium: 40, heavy: 80, success: 60, error: 120 };
      navigator.vibrate(pattern || durations[level] || 30);
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickItem() {
    if (state.bag.length === 0) state.bag = shuffle([...ITEM_POOL]);

    // Tutorial: force the first spawn to be an Electricidad item so the
    // directional hint ("desliza a la izquierda") is deterministic.
    if (state.tut_forceFirstElectricidad) {
      state.tut_forceFirstElectricidad = false;
      const idx = state.bag.findIndex(it => it.category === 'electricidad');
      if (idx > 0) {
        const [forced] = state.bag.splice(idx, 1);
        state.bag.unshift(forced);
      } else if (idx === -1) {
        // Bag has no electricidad — pull one directly from the pool
        const pick = ITEM_POOL.filter(p => p.category === 'electricidad')[0];
        state.lastPicks.push(pick);
        if (state.lastPicks.length > 5) state.lastPicks.shift();
        return pick;
      }
    }

    // Anti-streak: if last 3 picks are same category, force different
    if (state.lastPicks.length >= 3) {
      const lastCat = state.lastPicks[state.lastPicks.length - 1].category;
      if (state.lastPicks.slice(-3).every(p => p.category === lastCat)) {
        const idx = state.bag.findIndex(it => it.category !== lastCat);
        if (idx > 0) {
          const [forced] = state.bag.splice(idx, 1);
          state.bag.unshift(forced);
        }
      }
    }
    const item = state.bag.shift();
    state.lastPicks.push(item);
    if (state.lastPicks.length > 5) state.lastPicks.shift();
    return item;
  }

  function currentTierCfg() { return TIERS[state.tier - 1]; }

  // All X coordinates are relative to fall-zone (same width as playfield).
  // All Y coordinates for the falling item are relative to fall-zone top.
  // Fall-zone height = playfield height - header (60px) - stack area (STACK_ROWS * 80) - 4px floor.
  //
  // The falling item's Y=0 is the top of the fall zone (just below headers).
  // Landing Y for a lane = fall-zone height - (stack.length * ITEM_SIZE) - ITEM_SIZE
  //   (i.e. the item's top is at the position where its bottom meets the top of the stack).

  function laneXCenter(laneIdx) {
    const fieldW = fallZone.clientWidth;
    const laneW  = fieldW / 3;
    return (laneIdx * laneW) + (laneW / 2);
  }

  function landingYForLane(laneIdx) {
    // Y (in fall-zone coordinates) where the falling item's top rests on arrival.
    // Empty lane → item sits just above the floor line.
    // Stack size N → item sits N * ITEM_SIZE higher.
    const fzH = fallZone.clientHeight;
    return fzH - ITEM_SIZE - (state.stacks[laneIdx].length * ITEM_SIZE);
  }

  // ─────────────── Screen management ───────────────

  function showScreen(id) {
    [intro, play, results].forEach(s => s.classList.remove('active'));
    document.querySelector(`#${id}`).classList.add('active');
  }

  // ─────────────── Tutorial overlays ───────────────

  const tutorialEl   = $('#tutorial');
  const tutAnnosEl   = $('#tutorial-annotations');
  const tutHintEl    = $('#tutorial-tap-hint');

  let tutorialResume = null;

  function showTutorialLanes(onDismiss) {
    // Step 1: label each lane with a hint + arrow above the lane header
    tutAnnosEl.innerHTML = '';
    const pfRect = playfield.getBoundingClientRect();
    const headers = [0, 1, 2].map(i => document.querySelector(`.lane-header[data-lane="${i}"]`));
    const msgs = ['Electricidad', 'Fontanería', 'Climatización'];
    headers.forEach((h, idx) => {
      const hr = h.getBoundingClientRect();
      const cx = hr.left - pfRect.left + hr.width / 2;
      const cy = hr.top  - pfRect.top;
      const anno = document.createElement('div');
      anno.className = 'anno';
      anno.style.left = `${cx}px`;
      anno.style.top  = `${cy - 110}px`;
      anno.innerHTML = `
        <div class="anno-text">${msgs[idx]}</div>
        <div class="anno-arrow"></div>
      `;
      tutAnnosEl.appendChild(anno);
    });
    // Center headline
    const headline = document.createElement('div');
    headline.className = 'anno';
    headline.style.left = `${pfRect.width / 2}px`;
    headline.style.top  = `40px`;
    headline.innerHTML = `
      <div class="anno-text" style="max-width: 320px; font-size: 17px;">
        Clasifica cada pieza en su carril deslizando a izquierda o derecha.
      </div>
    `;
    tutAnnosEl.appendChild(headline);

    openTutorial(onDismiss);
  }

  function showTutorialFirstPiece(laneIdx) {
    // Step 2: freeze the falling item and point at the correct lane
    state.paused = true;
    tutAnnosEl.innerHTML = '';
    const pfRect = playfield.getBoundingClientRect();
    const pfW = pfRect.width;
    const header = document.querySelector(`.lane-header[data-lane="${laneIdx}"]`);
    const hr = header.getBoundingClientRect();
    const arrowX = hr.left - pfRect.left + hr.width / 2;
    const cy = hr.top  - pfRect.top;

    const dir = laneIdx === 0 ? '←' : (laneIdx === 2 ? '→' : null);
    const text = dir
      ? `Desliza ${dir} para llevar la pieza aquí`
      : `Déjala caer recta, esta pieza ya está en su carril`;

    // The arrow sits at the lane header center; the text+arrow group is
    // anchored there, but we split text and arrow so the text can be
    // centered on the playfield and the arrow can point to the lane.
    const arrow = document.createElement('div');
    arrow.className = 'anno';
    arrow.style.left = `${arrowX}px`;
    arrow.style.top  = `${cy - 50}px`;
    arrow.innerHTML = `<div class="anno-arrow"></div>`;
    tutAnnosEl.appendChild(arrow);

    const msg = document.createElement('div');
    msg.className = 'anno';
    msg.style.left = `${pfW / 2}px`;
    msg.style.top  = `${cy - 180}px`;
    msg.innerHTML = `<div class="anno-text">${text}</div>`;
    tutAnnosEl.appendChild(msg);

    openTutorial(() => { state.paused = false; });
  }

  function showTutorialFirstWrong(entry) {
    // Step 3: freeze game and circle the wrong piece
    state.paused = true;
    // Pause its dissolve timer too
    if (entry.dissolveHandle) {
      clearTimeout(entry.dissolveHandle);
      entry.dissolveHandle = null;
    }
    tutAnnosEl.innerHTML = '';
    const pfRect = playfield.getBoundingClientRect();
    const er = entry.el.getBoundingClientRect();
    const cx = er.left - pfRect.left + er.width / 2;
    const cy = er.top  - pfRect.top  + er.height / 2;

    // Pulsing Rojo circle right over the piece
    const circleWrap = document.createElement('div');
    circleWrap.className = 'anno';
    circleWrap.style.left = `${cx}px`;
    circleWrap.style.top  = `${cy - 55}px`;
    circleWrap.innerHTML = `<div class="anno-circle"></div>`;
    tutAnnosEl.appendChild(circleWrap);

    // Message above it (or below, if too close to the top)
    const msgAbove = (cy - 55 - 110) > 60;
    const msg = document.createElement('div');
    msg.className = 'anno';
    msg.style.left = `${pfRect.width / 2}px`;
    msg.style.top  = msgAbove ? `${cy - 190}px` : `${cy + 90}px`;
    msg.innerHTML = `
      <div class="anno-text" style="max-width: 300px;">
        ¡Pieza mal colocada! Se desvanecerá en unos segundos.
      </div>
    `;
    tutAnnosEl.appendChild(msg);

    openTutorial(() => {
      state.paused = false;
      // Reschedule the dissolve with the remaining time
      if (entry.dissolveRemaining) {
        entry.dissolveHandle = setTimeout(
          () => dissolveWrongPiece(findLaneOf(entry), entry),
          entry.dissolveRemaining
        );
      }
    });
  }

  function findLaneOf(entry) {
    for (let i = 0; i < 3; i++) {
      if (state.stacks[i].includes(entry)) return i;
    }
    return -1;
  }

  function openTutorial(onDismiss) {
    tutorialEl.classList.remove('hidden');
    tutorialResume = () => {
      closeTutorial();
      if (onDismiss) onDismiss();
    };
    // Wait one frame so the click that opened us doesn't close us
    setTimeout(() => {
      tutorialEl.addEventListener('click', handleTutorialTap, { once: true });
      tutorialEl.addEventListener('touchend', handleTutorialTap, { once: true });
    }, 50);
  }

  function handleTutorialTap(e) {
    e.stopPropagation();
    if (tutorialResume) {
      const cb = tutorialResume;
      tutorialResume = null;
      cb();
    }
  }

  function closeTutorial() {
    tutorialEl.classList.add('hidden');
    tutAnnosEl.innerHTML = '';
  }

  function hideTutorial() {
    tutorialEl.classList.add('hidden');
    tutAnnosEl.innerHTML = '';
    tutorialResume = null;
  }

  // ─────────────── Start / replay ───────────────

  function resetGame() {
    state.running = false;
    state.paused = false;
    state.tier = 1;
    state.tierTimer = 0;
    state.clearsSinceTierUp = 0;
    state.score = 0;
    state.combo = 1;
    state.maxCombo = 1;
    state.linesCleared = 0;
    state.maxTier = 1;
    state.spawnCooldown = 0;
    state.currentItem = null;
    state.stacks = [[], [], []];
    state.bag = [];
    state.lastPicks = [];
    state.tut_firstPieceShown = false;
    state.tut_firstWrongShown = false;
    state.tut_forceFirstElectricidad = true;
    hideTutorial();

    // clear DOM — preserve fall-zone structure (#lanes-stacks lives inside it)
    laneStacks.forEach(el => { el.innerHTML = ''; });
    fallZone.querySelectorAll('.falling-item').forEach(el => el.remove());
    particlesEl.innerHTML = '';
    comboTextEl.innerHTML = '';
    shatterStage.innerHTML = '';
    hudScore.textContent = '0';
  }

  function startGame() {
    resetGame();
    showScreen('play');
    // Tutorial step 1: explain the 3 lanes. Tap anywhere to continue.
    showTutorialLanes(() => {
      runCountdown(() => {
        state.running = true;
        state.spawnCooldown = 300;
        state.lastFrameTime = performance.now();
        state.rafId = requestAnimationFrame(tick);
      });
    });
  }

  function runCountdown(cb) {
    countdown.classList.remove('hidden');
    const seq = ['3', '2', '1', '¡YA!'];
    let i = 0;
    const next = () => {
      if (i >= seq.length) {
        countdown.classList.add('hidden');
        cb();
        return;
      }
      const n = seq[i];
      countdownNumber.textContent = n;
      countdownNumber.classList.toggle('go', n === '¡YA!');
      // retrigger animation
      countdownNumber.style.animation = 'none';
      countdownNumber.offsetHeight;
      countdownNumber.style.animation = '';
      vibrate(n === '¡YA!' ? 'medium' : 'light');
      i++;
      setTimeout(next, n === '¡YA!' ? 900 : 800);
    };
    // flash headers sequentially to hint
    laneHeaders.forEach((h, idx) => {
      setTimeout(() => {
        h.classList.add('pulse');
        setTimeout(() => h.classList.remove('pulse'), 400);
      }, idx * 150);
    });
    setTimeout(next, 600);
  }

  // ─────────────── Item spawn ───────────────

  function spawnItem() {
    const picked = pickItem();
    const el = document.createElement('div');
    el.className = 'falling-item spawn-in';
    el.dataset.category = picked.category;
    el.dataset.key = picked.key;
    const chip = document.createElement('div');
    chip.className = 'name-chip';
    chip.textContent = picked.label;
    el.appendChild(chip);
    const img = document.createElement('img');
    img.src = ITEM_URL(picked.key);
    img.alt = picked.label;
    img.draggable = false;
    el.appendChild(img);

    // Position centered on middle lane (fontaneria)
    const centerX = laneXCenter(1);
    const startY  = 20;
    el.style.left = `${centerX - ITEM_SIZE / 2}px`;
    el.style.top  = `${startY}px`;
    fallZone.appendChild(el);

    state.currentItem = {
      el,
      item: picked,
      x: centerX - ITEM_SIZE / 2,
      y: startY,
      targetLane: 1,   // default: falls straight to center lane
      transitionStartX: null,
      transitionTargetX: null,
      transitionStartTime: null,
      transitionDuration: 200,
      landed: false,
    };

    // Tutorial step 2: first piece — freeze and point at the correct lane.
    if (!state.tut_firstPieceShown) {
      state.tut_firstPieceShown = true;
      const laneIdx = LANES.indexOf(picked.category);
      showTutorialFirstPiece(laneIdx);
    }

    // Schedule next spawn once this one lands (handled in tick after landing)
  }

  function setItemLane(laneIdx) {
    const ci = state.currentItem;
    if (!ci || ci.landed) return;
    if (ci.targetLane === laneIdx) return;
    const targetX = laneXCenter(laneIdx) - ITEM_SIZE / 2;
    ci.targetLane = laneIdx;
    ci.transitionStartX = ci.x;
    ci.transitionTargetX = targetX;
    ci.transitionStartTime = performance.now();
  }

  // ─────────────── Main tick ───────────────

  function tick(now) {
    if (!state.running) return;
    // Paused (tutorial active) — skip all logic but keep the raf loop alive
    if (state.paused) {
      state.lastFrameTime = now;
      state.rafId = requestAnimationFrame(tick);
      return;
    }
    const dt = Math.min(50, now - state.lastFrameTime);
    state.lastFrameTime = now;

    // Tier timer
    state.tierTimer += dt;
    if (state.tier < 10 && (state.tierTimer >= TIER_TIME_MS || state.clearsSinceTierUp >= TIER_CLEARS)) {
      tierUp();
    }

    // Spawn next item if none active and cooldown elapsed
    if (!state.currentItem) {
      state.spawnCooldown -= dt;
      if (state.spawnCooldown <= 0) {
        spawnItem();
      }
    } else {
      updateFallingItem(dt, now);
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function updateFallingItem(dt, now) {
    const ci = state.currentItem;
    const cfg = currentTierCfg();

    // Vertical fall
    ci.y += cfg.speed * (dt / 1000);

    // Horizontal interpolation
    if (ci.transitionStartTime !== null) {
      const t = clamp((now - ci.transitionStartTime) / ci.transitionDuration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      ci.x = ci.transitionStartX + (ci.transitionTargetX - ci.transitionStartX) * eased;
      if (t >= 1) ci.transitionStartTime = null;
    }

    ci.el.style.left = `${ci.x}px`;
    ci.el.style.top  = `${ci.y}px`;

    // Collision check — land when the item's top reaches its lane's landing Y.
    const landY = landingYForLane(ci.targetLane);
    if (ci.y >= landY) {
      ci.y = landY;
      ci.el.style.top = `${ci.y}px`;
      ci.landed = true;
      resolveLanding();
    }
  }

  // ─────────────── Landing resolution ───────────────

  function resolveLanding() {
    const ci = state.currentItem;
    const isCorrect = (ci.item.category === LANES[ci.targetLane]);

    if (isCorrect) {
      correctLanding(ci);
    } else {
      incorrectLanding(ci);
    }
  }

  function correctLanding(ci) {
    // Add to stack
    const stackedEl = document.createElement('div');
    stackedEl.className = 'stacked-item';
    stackedEl.dataset.category = ci.item.category;
    stackedEl.dataset.key = ci.item.key;
    const img = document.createElement('img');
    img.src = ITEM_URL(ci.item.key);
    img.alt = ci.item.label;
    img.draggable = false;
    stackedEl.appendChild(img);
    stackedEl.style.bottom = `${state.stacks[ci.targetLane].length * ITEM_SIZE}px`;
    laneStacks[ci.targetLane].appendChild(stackedEl);

    state.stacks[ci.targetLane].push({
      el: stackedEl,
      item: ci.item,
      wrong: false,
    });

    // Remove falling item + play squash
    ci.el.classList.add('landed');
    setTimeout(() => ci.el.remove(), 200);

    // Score
    const delta = 100 * state.combo;
    addScore(delta);

    // Particles
    const lx = laneXCenter(ci.targetLane);
    const ly = playfield.clientHeight - (state.stacks[ci.targetLane].length - 1) * ITEM_SIZE - ITEM_SIZE / 2;
    spawnParticles(lx, ly, laneColor(ci.targetLane), 8);

    vibrate('light');

    // Check line clear
    checkLineClear();

    // Check game over (any lane reached STACK_ROWS)
    // Wrong pieces don't count toward the ceiling — they'll dissolve.
    if (state.stacks.some(s => s.filter(e => !e.wrong).length >= STACK_ROWS)) {
      triggerGameOver();
      return;
    }

    // Schedule next spawn
    state.currentItem = null;
    state.spawnCooldown = rand(currentTierCfg().spawnMin, currentTierCfg().spawnMax);
  }

  function incorrectLanding(ci) {
    // Stack the piece in the wrong lane but mark it as wrong.
    const stackedEl = document.createElement('div');
    stackedEl.className = 'stacked-item wrong';
    stackedEl.dataset.category = ci.item.category;
    stackedEl.dataset.key = ci.item.key;
    const img = document.createElement('img');
    img.src = ITEM_URL(ci.item.key);
    img.alt = ci.item.label;
    img.draggable = false;
    stackedEl.appendChild(img);
    stackedEl.style.bottom = `${state.stacks[ci.targetLane].length * ITEM_SIZE}px`;
    laneStacks[ci.targetLane].appendChild(stackedEl);

    const stackEntry = { el: stackedEl, item: ci.item, wrong: true };
    state.stacks[ci.targetLane].push(stackEntry);

    // Remove the falling item element
    ci.el.classList.add('landed');
    setTimeout(() => ci.el.remove(), 200);

    // Particles red + flash + shake for impact
    const lx = ci.x + ITEM_SIZE / 2;
    const ly = ci.y + ITEM_SIZE / 2;
    spawnParticles(lx, ly, 'var(--rojo)', 12);
    triggerFlash('red');
    shake('heavy');
    vibrate('error', [0, 80, 40, 80]);

    // Reset combo + subtract points (clamp to 0)
    state.combo = 1;
    applyPenalty(WRONG_PENALTY);

    // Schedule this wrong piece to fade & collapse after a tier-scaled delay
    const tier = state.tier;
    const t = (tier - 1) / 9;
    const decayMs = WRONG_DECAY_MAX_MS - (WRONG_DECAY_MAX_MS - WRONG_DECAY_MIN_MS) * t;
    const dissolveHandle = setTimeout(() => dissolveWrongPiece(ci.targetLane, stackEntry), decayMs);
    stackEntry.dissolveHandle = dissolveHandle;
    stackEntry.dissolveRemaining = decayMs;

    // Tutorial step 3: first wrong landing — freeze and point at the red piece.
    if (!state.tut_firstWrongShown) {
      state.tut_firstWrongShown = true;
      showTutorialFirstWrong(stackEntry);
    }

    // Check game over (stacks may have grown into the ceiling)
    // Wrong pieces don't count toward the ceiling — they'll dissolve.
    if (state.stacks.some(s => s.filter(e => !e.wrong).length >= STACK_ROWS)) {
      triggerGameOver();
      return;
    }

    // Schedule next spawn — NO lockout
    state.currentItem = null;
    state.spawnCooldown = rand(currentTierCfg().spawnMin, currentTierCfg().spawnMax);
  }

  function dissolveWrongPiece(laneIdx, entry) {
    const stack = state.stacks[laneIdx];
    const idx = stack.indexOf(entry);
    if (idx === -1) return;  // already removed (e.g. game over shatter cleared it)

    // Animate the piece fading out
    entry.el.classList.add('dissolving');
    setTimeout(() => entry.el.remove(), 420);

    // Remove from logical stack
    stack.splice(idx, 1);

    // Drop remaining pieces above down by one row
    stack.forEach((s, i) => {
      s.el.style.bottom = `${i * ITEM_SIZE}px`;
    });
  }

  // ─────────────── Line clear ───────────────

  function checkLineClear() {
    // All 3 lanes have ≥ 1 item AND the bottom row of each lane is a CORRECT piece.
    // Wrong pieces don't trigger a clear — they must dissolve on their own first.
    if (state.stacks.every(s => s.length >= 1 && !s[0].wrong)) {
      performLineClear();
    }
  }

  function performLineClear() {
    const STAGGER_MS = 110;  // delay between each lane's destruction
    const laneColors = ['var(--lemon)', 'var(--turquesa)', 'var(--mint)'];

    state.stacks.forEach((stack, idx) => {
      const bottom = stack.shift();
      // Stagger the destruction left → right
      setTimeout(() => {
        // Burst of particles from the piece's center (in playfield coords)
        const rect = bottom.el.getBoundingClientRect();
        const pfRect = playfield.getBoundingClientRect();
        const cx = rect.left + rect.width / 2 - pfRect.left;
        const cy = rect.top + rect.height / 2 - pfRect.top;
        // Mixed color particles: lane color + Lime accent
        spawnParticles(cx, cy, laneColors[idx], 16, { spread: 160, size: 10 });
        spawnParticles(cx, cy, 'var(--lime)',    10, { spread: 200, size: 8 });
        spawnParticles(cx, cy, 'var(--cream)',   6,  { spread: 120, size: 6 });
        // Flash ring at the piece location
        spawnShockwave(cx, cy, laneColors[idx]);
        // Animate the piece itself exploding outward
        bottom.el.classList.add('clearing');
        vibrate('light');
        setTimeout(() => bottom.el.remove(), 500);
      }, idx * STAGGER_MS);

      // Drop remaining pieces above — with a delay matched to each lane's destruction
      setTimeout(() => {
        stack.forEach((s, i) => {
          s.el.style.bottom = `${i * ITEM_SIZE}px`;
        });
      }, idx * STAGGER_MS + 200);
    });

    state.linesCleared++;
    state.clearsSinceTierUp++;
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;

    const delta = 500 * state.combo;
    addScore(delta);

    // Full-screen flash + combo text fires immediately
    triggerFlash('lime');
    shake(state.combo >= 3 ? 'heavy' : 'light');
    showComboText();
    vibrate(state.combo >= 3 ? 'heavy' : 'success');

    // Cascade check after all lanes have finished destruction + drop
    setTimeout(() => {
      checkLineClear();
    }, (3 * STAGGER_MS) + 300);
  }

  function spawnShockwave(x, y, color) {
    const ring = document.createElement('div');
    ring.className = 'shockwave';
    ring.style.left = `${x}px`;
    ring.style.top  = `${y}px`;
    ring.style.borderColor = color;
    particlesEl.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
  }

  function showComboText() {
    const c = state.combo;
    const main = document.createElement('div');
    main.className = 'combo-burst';
    if (c >= 7) {
      main.textContent = '¡LEGENDARIO!';
      main.style.color = 'var(--lemon)';
      main.style.fontSize = '80px';
    } else {
      main.textContent = '¡LÍNEA!';
    }
    // random horizontal drift direction baked into the css anim; no extra offset
    comboTextEl.appendChild(main);
    setTimeout(() => main.remove(), 1200);

    if (c >= 2) {
      const sec = document.createElement('div');
      sec.className = 'combo-burst secondary';
      sec.textContent = `¡COMBO x${c}!`;
      if (c >= 5) sec.style.color = 'var(--lemon)';
      comboTextEl.appendChild(sec);
      setTimeout(() => sec.remove(), 1200);
    }
  }

  function laneColor(idx) {
    return ['var(--lemon)', 'var(--turquesa)', 'var(--mint)'][idx];
  }

  // ─────────────── Particles ───────────────

  function spawnParticles(x, y, color, count, opts) {
    const o = opts || {};
    const spreadMin = o.spread ? o.spread * 0.4 : 40;
    const spreadMax = o.spread ? o.spread : 100;
    const size = o.size || 8;
    const half = size / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.background = color;
      p.style.width  = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${x - half}px`;
      p.style.top  = `${y - half}px`;
      particlesEl.appendChild(p);
      // Jitter angle a bit so the ring isn't perfectly even
      const angle = ((i / count) * Math.PI * 2) + rand(-0.3, 0.3);
      const dist  = rand(spreadMin, spreadMax);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = rand(-540, 540);
      p.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: rand(500, 900), easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
      setTimeout(() => p.remove(), 1000);
    }
  }

  // ─────────────── Flash + shake ───────────────

  function triggerFlash(kind) {
    flashOverlay.classList.remove('flash-red', 'flash-lime', 'flash-green');
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add(`flash-${kind}`);
  }

  function shake(level) {
    playfield.classList.remove('shake-light', 'shake-heavy');
    void playfield.offsetWidth;
    playfield.classList.add(`shake-${level}`);
  }

  // ─────────────── Tier up ───────────────

  function tierUp() {
    state.tier = Math.min(10, state.tier + 1);
    state.maxTier = Math.max(state.maxTier, state.tier);
    state.tierTimer = 0;
    state.clearsSinceTierUp = 0;
    triggerFlash('lime');
    vibrate('medium', [0, 60, 30, 60, 30, 60]);
  }

  // ─────────────── Score ───────────────

  function addScore(delta) {
    state.score += delta;
    hudScore.textContent = fmtScore(state.score);
    hudScore.classList.add('bump');
    setTimeout(() => hudScore.classList.remove('bump'), 180);
  }

  function applyPenalty(amount) {
    state.score = Math.max(0, state.score - amount);
    hudScore.textContent = fmtScore(state.score);
    hudScore.classList.add('penalty');
    setTimeout(() => hudScore.classList.remove('penalty'), 260);
  }

  // ─────────────── Game over ───────────────

  function triggerGameOver() {
    state.running = false;
    cancelAnimationFrame(state.rafId);
    vibrate('heavy', [0, 200, 100, 400]);

    // Convert all stacked items to shatter bodies
    const fieldRect = playfield.getBoundingClientRect();
    state.stacks.forEach((stack, laneIdx) => {
      stack.forEach((s, rowIdx) => {
        const rect = s.el.getBoundingClientRect();
        s.el.remove();
        const body = document.createElement('div');
        body.className = 'shatter-body';
        body.dataset.category = s.item.category;
        const bimg = document.createElement('img');
        bimg.src = ITEM_URL(s.item.key);
        bimg.alt = s.item.label;
        bimg.draggable = false;
        body.appendChild(bimg);
        body.style.left = `${rect.left - fieldRect.left}px`;
        body.style.top  = `${rect.top  - fieldRect.top}px`;
        playfield.appendChild(body);
        animateShatterBody(body);
      });
    });
    state.stacks = [[], [], []];

    shake('heavy');

    setTimeout(() => showResults(), 1800);
  }

  function animateShatterBody(el) {
    const vx = rand(-400, 400);
    const vy = rand(-600, -200);
    const rot = rand(-720, 720);
    el.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${vx * 1.8}px, ${vy + 900}px) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 1600, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    setTimeout(() => el.remove(), 1700);
  }

  function showResults() {
    // record
    const prev = parseInt(localStorage.getItem('kampris_record') || '0', 10);
    const isNewRecord = state.score > prev;
    if (isNewRecord) localStorage.setItem('kampris_record', String(state.score));

    // counter-up score
    animateCounter(resultsScore, 0, state.score, 1200, (v) => `${fmtScore(v)} pts`);
    if (isNewRecord) {
      resultsRecord.textContent = '¡NUEVO RÉCORD!';
      resultsRecord.classList.add('new-record');
    } else {
      resultsRecord.textContent = `Récord: ${fmtScore(prev)} pts`;
      resultsRecord.classList.remove('new-record');
    }
    resultsStats.textContent = `Líneas: ${state.linesCleared} · Combo máx: ${state.maxCombo}`;

    showScreen('results');
  }

  function animateCounter(el, from, to, dur, fmt) {
    const start = performance.now();
    function step(now) {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = fmt(v);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ─────────────── Input handling ───────────────

  let touchStart = null;

  function onTouchStart(e) {
    if (!state.running) return;
    const t = e.touches ? e.touches[0] : e;
    touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
  }
  function onTouchMove(e) {
    if (!touchStart || !state.running) return;
    e.preventDefault();
  }
  function onTouchEnd(e) {
    if (!touchStart || !state.running) { touchStart = null; return; }
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const dur = performance.now() - touchStart.time;
    touchStart = null;

    // Too slow → probably a drift, not an intentional swipe
    if (dur > SWIPE_MAX_DURATION) return;

    const absX = Math.abs(dx), absY = Math.abs(dy);

    // Downward hard-drop: strong vertical dominance + downward direction
    if (dy >= SWIPE_THRESHOLD && absY > absX * SWIPE_DOMINANCE) {
      hardDrop();
      return;
    }

    // Horizontal swipe: require dominance over vertical, and enough travel
    if (absX < SWIPE_THRESHOLD) return;
    if (absX < absY * SWIPE_DOMINANCE) return;

    // Single-step lane change relative to current lane
    const ci = state.currentItem;
    if (!ci || ci.landed) return;
    const dir = dx < 0 ? -1 : 1;
    const next = clamp(ci.targetLane + dir, 0, 2);
    if (next !== ci.targetLane) setItemLane(next);
  }

  function hardDrop() {
    const ci = state.currentItem;
    if (!ci || ci.landed) return;
    // Snap horizontally to current target lane immediately (no easing),
    // then drop the Y to landing.
    const targetX = laneXCenter(ci.targetLane) - ITEM_SIZE / 2;
    ci.x = targetX;
    ci.transitionStartTime = null;
    ci.y = landingYForLane(ci.targetLane);
    ci.el.style.left = `${ci.x}px`;
    ci.el.style.top  = `${ci.y}px`;
    ci.landed = true;
    resolveLanding();
  }

  playfield.addEventListener('touchstart', onTouchStart, { passive: true });
  playfield.addEventListener('touchmove',  onTouchMove,  { passive: false });
  playfield.addEventListener('touchend',   onTouchEnd,   { passive: true });
  playfield.addEventListener('mousedown',  onTouchStart);
  playfield.addEventListener('mousemove',  onTouchMove);
  playfield.addEventListener('mouseup',    onTouchEnd);

  // ─────────────── Wire up buttons ───────────────

  btnStart.addEventListener('click', () => {
    vibrate('light');
    startGame();
  });
  btnReplay.addEventListener('click', () => {
    vibrate('light');
    resetGame();
    showScreen('intro');
  });

  // Initial state
  resetGame();
  showScreen('intro');

  // ─────────────── Preload assets ───────────────

  const ASSETS_TO_PRELOAD = [
    ASSET_URL('game_title'),
    ASSET_URL('icon_electricidad'),
    ASSET_URL('icon_fontaneria'),
    ASSET_URL('icon_climatizacion'),
    ...ITEM_POOL.map(it => ITEM_URL(it.key)),
  ];

  function preloadAssets() {
    const progress = document.querySelector('#preload-progress');
    const fill = document.querySelector('#preload-fill');
    const total = ASSETS_TO_PRELOAD.length;
    let loaded = 0;

    const done = () => {
      loaded++;
      if (fill) fill.style.width = `${Math.round((loaded / total) * 100)}%`;
      if (loaded >= total) {
        btnStart.disabled = false;
        btnStart.textContent = 'EMPEZAR';
        if (progress) setTimeout(() => progress.classList.add('done'), 250);
      }
    };

    ASSETS_TO_PRELOAD.forEach(src => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;  // don't block the game if one asset is missing
      img.src = src;
    });
  }
  preloadAssets();

})();
