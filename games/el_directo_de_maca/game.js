'use strict';

/* ===== El Directo de Maca — Game Logic ===== */

/* ---------- CONSTANTS ---------- */
var ASSETS = 'assets/';
var RECORD_KEY = 'directo_maca_record';
var TASK_THRESHOLD = 700;
var TOTAL_ROUNDS = 6;
var MAX_LIVES = 3;

var MACA = {
  happy:       ASSETS + 'maca_happy.png',
  celebrating: ASSETS + 'maca_celebrating.png',
  worried:     ASSETS + 'maca_worried.png'
};

var BG = {
  cocina:      ASSETS + 'bg_cocina.jpg',
  resultado:   ASSETS + 'bg_cocina_resultado.png'
};

/* ---------- ROUNDS DATA ---------- */
var ROUNDS = [
  {
    id: 1,
    context: 'Obra nueva — cocina moderna. Instalación desde cero, queremos que quede ordenado.',
    material: 'multicapa',
    accesorio: 'manguito',
    bubbleTolerance: 20,
    macaMsg: '¡Cocina nueva, instálalo todo desde cero! ¿Qué material usas?',
    ghostHand: true,
    errorMaterial: {
      pex: 'El PEX es más flexible pero en obra nueva ordenada, el multicapa da mejor acabado y es más fácil de trazar limpio para un junior.',
      cobre: 'El cobre es para reparaciones o instalaciones existentes — aquí empezamos desde cero.'
    }
  },
  {
    id: 2,
    context: 'Reforma rápida — baño antiguo. Tirada larga por hueco muy estrecho, necesita doblar.',
    material: 'pex',
    accesorio: 'manguito',
    bubbleTolerance: 15,
    macaMsg: 'Tirada larga en hueco muy estrecho... ¿cuál te da más juego?',
    ghostHand: false,
    errorMaterial: {
      multicapa: 'El multicapa no dobla bien en huecos estrechos — necesita radios amplios y herramienta específica.',
      cobre: 'El cobre no dobla sin herramienta de curvado — en hueco estrecho y con prisa, no es la elección.'
    }
  },
  {
    id: 3,
    context: 'Reparación — fuga en tubería existente de cobre. Hay que reponer un tramo corto.',
    material: 'cobre',
    accesorio: 'manguito',
    bubbleTolerance: 15,
    macaMsg: 'Hay que empatar con lo que ya tiene. ¿Qué pones?',
    ghostHand: false,
    errorMaterial: {
      multicapa: 'En una reparación puntual lo correcto es respetar el material existente — menos adaptadores, menos puntos de fallo.',
      pex: 'El PEX con adaptadores en una reparación puntual añade complejidad innecesaria — el cobre empata directo.'
    }
  },
  {
    id: 4,
    context: 'Obra nueva — local comercial. Instalación vista, tiene que quedar perfectamente recta y limpia.',
    material: 'multicapa',
    accesorio: 'codo',
    bubbleTolerance: 10,
    macaMsg: 'Local comercial, instalación vista. Tiene que quedar perfectamente recto. ¿Qué material?',
    ghostHand: false,
    errorMaterial: {
      pex: 'El PEX es flexible pero en instalación vista necesitas que quede rígido y recto — el multicapa mantiene la forma.',
      cobre: 'El cobre en obra nueva desde cero requiere más tiempo y herramienta — el multicapa es la opción moderna.'
    }
  },
  {
    id: 5,
    context: 'Reforma urgente — piso de alquiler. Tirada larga por regata estrecha, poco espacio para maniobrar.',
    material: 'pex',
    accesorio: 'codo',
    bubbleTolerance: 10,
    macaMsg: 'El hueco es muy estrecho, necesita doblar. ¿Cuál es?',
    ghostHand: false,
    errorMaterial: {
      multicapa: 'El multicapa necesita más espacio para doblar y herramienta de curvado — en regata estrecha el PEX es mucho más manejable.',
      cobre: 'El cobre en reforma urgente y espacio estrecho es la opción más lenta y difícil — el PEX gana aquí.'
    }
  },
  {
    id: 6,
    context: 'Instalación existente — edificio de los 80. Todo es cobre, hay que reponer un tramo averiado.',
    material: 'cobre',
    accesorio: 'codo',
    bubbleTolerance: 8,
    macaMsg: 'Todo es cobre aquí. ¿Con qué empatas el tramo?',
    ghostHand: false,
    errorMaterial: {
      pex: 'Con adaptadores PEX-cobre se puede hacer, pero en una instalación 100% cobre lo correcto es empatar en el mismo material.',
      multicapa: 'El multicapa en un edificio antiguo todo cobre añade adaptadores innecesarios y no queda profesional.'
    }
  }
];

var ACIERTO_MSGS = [
  '¡Eso es! ¡Recto y limpio! ¡El algoritmo nos va a amar!',
  '¡Perfecto! ¡Mira qué línea! ¡Esto es contenido de oro!',
  '¡Así se hace! ¡Los seguidores van a flipar con este nivel de detalle!',
  '¡Recta y limpia! ¡Yo ya pongo el hashtag #fontaneriapro!'
];

var ERROR_EDU = {
  corte: {
    que: 'El corte quedó torcido — tu gesto se desvió más de 15° de la perpendicular.',
    porQue: 'Una boca torcida no asienta bien en el accesorio — la unión queda forzada y puede trabajar o gotear con el tiempo.',
    regla: 'El corte debe ser siempre perpendicular a la tubería: 90° exactos.',
    que_hacer: 'Apoya el dedo en la parte superior del tubo y bájalo recto sin girar la muñeca — como si tiraras una línea vertical con escuadra.'
  },
  burbuja: {
    que: 'La tubería no estaba a nivel cuando intentaste confirmar.',
    porQue: "Una línea no nivelada es una 'línea banana' — parece recta pero al mirarla de perfil se ve el error, y el accesorio acaba forzado.",
    regla: 'Presenta siempre en seco y verifica con el nivel antes de montar — si la burbuja no está en verde, no confirmes.',
    que_hacer: 'Mueve la tubería despacio hasta que la burbuja entre en la zona verde — solo entonces pulsa confirmar.'
  },
  accesorio: {
    que: 'El accesorio quedó girado — no estaba a escuadra con la línea.',
    porQue: 'Un accesorio girado hace que la segunda línea salga torcida — el error se multiplica con cada accesorio mal alineado.',
    regla: 'El accesorio debe quedar a escuadra: alineado con la línea, sin rotación visible.',
    que_hacer: 'Gira despacio hasta que la marca de alineación apunte arriba y la burbuja quede centrada en verde.'
  }
};

/* ---------- GAME STATE ---------- */
var S = {
  round: 0,
  lives: 3,
  score: 0,
  phase: 'material', // 'material' | 'corte' | 'montaje'
  roundErrors: 0,
  roundResults: [], // true/false per round
  acierto_msg_idx: 0,
  drag: null,
  cutLine: null,
  bubbleOffset: 0,
  accesorioAngle: 0,
  followers: 12400,        // viewer count — drops on errors
  reactionInterval: null,  // periodic reaction spawner (error panel)
  ambientInterval: null    // ambient reactions during gameplay
};

/* ---------- DOM REFS ---------- */
var $ = function(id) { return document.getElementById(id); };

/* ---------- SCREEN SWITCHING ---------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  $(id).classList.add('active');
  if (id === 'results') {
    document.documentElement.classList.add('results');
    document.documentElement.classList.remove('gameplay');
  } else {
    document.documentElement.classList.remove('results');
    if (id === 'play') document.documentElement.classList.add('gameplay');
    else document.documentElement.classList.remove('gameplay');
  }
}

/* ---------- LIVES UI ---------- */
function updateLivesUI() {
  for (var i = 1; i <= MAX_LIVES; i++) {
    var el = $('life-' + i);
    if (el) {
      if (i > S.lives) el.classList.add('lost');
      else el.classList.remove('lost');
    }
  }
}

function loseLife() {
  if (S.lives > 0) S.lives--;
  S.roundErrors++;
  updateLivesUI();
}

/* ---------- CHARACTER MESSAGES ---------- */
function showCharMsg(msg, state) {
  var charArea = $('char-area');
  var avatar = $('char-avatar');
  var bubble = $('char-bubble');
  avatar.src = MACA[state || 'happy'];
  if (msg) {
    bubble.textContent = msg;
    bubble.classList.add('visible');
    avatar.classList.add('prominent');
    charArea.classList.remove('hidden');
  } else {
    bubble.classList.remove('visible');
    avatar.classList.remove('prominent');
    charArea.classList.add('hidden');
  }
}

function hideCharMsg() {
  $('char-bubble').classList.remove('visible');
  $('char-avatar').classList.remove('prominent');
  $('char-area').classList.add('hidden');
}

/* ---------- DIRECTO ERROR PANEL ---------- */
function showDirectoPanel(bodyHTML) {
  var body = $('overlay-body');
  body.innerHTML = bodyHTML;

  // Drop followers
  var drop = 80 + Math.floor(Math.random() * 120);
  dropFollowers(drop);

  // Add follower drop info to footer
  var footer = document.querySelector('.directo-followers');
  if (!footer) {
    footer = document.createElement('div');
    footer.className = 'directo-followers';
    $('directo-footer').insertBefore(footer, $('btn-understood'));
  }
  footer.innerHTML = '-' + drop + ' seguidores <span class="drop">▼</span>';

  // Clear old comments
  var commentsEl = $('directo-comments');
  if (commentsEl) commentsEl.innerHTML = '';

  $('overlay-edu').classList.add('active');
  startLiveReactions('error');
}

function showEduOverlay(type, extraMsg) {
  var data = ERROR_EDU[type] || {};
  showDirectoPanel(
    '<span class="edu-label">Qué hiciste</span>' +
    '<span class="edu-rule">' + (data.que || '') + '</span>' +
    '<span class="edu-label">Por qué está mal</span>' +
    (data.porQue || extraMsg || '') +
    '<span class="edu-label">La regla</span>' +
    '<span class="edu-rule">' + (data.regla || '') + '</span>' +
    '<span class="edu-label">Qué hacer</span>' +
    '<span class="edu-action">' + (data.que_hacer || '') + '</span>'
  );
}

function showMaterialEduOverlay(wrongMaterial, correctMaterial, errorMsg) {
  var materialNames = { multicapa: 'Multicapa', pex: 'PEX', cobre: 'Cobre' };
  showDirectoPanel(
    '<span class="edu-label">Material elegido</span>' +
    '<span class="edu-rule">' + (materialNames[wrongMaterial] || wrongMaterial) + ' ✗</span>' +
    '<span class="edu-label">Por qué no funciona aquí</span>' +
    '<span class="edu-action">' + (errorMsg || '') + '</span>' +
    '<span class="edu-label">Material correcto</span>' +
    '<span class="edu-rule">' + (materialNames[correctMaterial] || correctMaterial) + ' ✓</span>'
  );
}

/* ---------- VIEWER COUNT UI ---------- */
function updateViewerCount() {
  // Update both the directo panel count and the gameplay live-hud count
  var el1 = $('directo-viewer-count');
  if (el1) el1.textContent = S.followers.toLocaleString('es-ES');
  var el2 = $('live-viewer-count');
  if (el2) el2.textContent = S.followers.toLocaleString('es-ES');
}

function dropFollowers(amount) {
  S.followers = Math.max(0, S.followers - amount);
  updateViewerCount();
  // Flash red on directo panel viewers
  var el = $('directo-viewers');
  if (el) {
    el.style.background = 'rgba(231,76,60,0.7)';
    setTimeout(function() { el.style.background = 'rgba(0,0,0,0.5)'; }, 600);
  }
  // Flash on live-bar (whole bar)
  var bar = $('live-hud');
  if (bar) {
    bar.style.background = 'rgba(231,76,60,0.5)';
    setTimeout(function() { bar.style.background = 'rgba(0,0,0,0.55)'; }, 600);
  }
}

/* ---------- EMOJI RAIN (acierto — lado derecho) ---------- */
function spawnEmojis() {
  var container = $('emoji-rain');
  var emojis = ['🔥','❤️','👏','✨','💯','🏆'];
  var count = 5 + Math.floor(Math.random() * 4);
  for (var i = 0; i < count; i++) {
    (function(idx) {
      setTimeout(function() {
        var el = document.createElement('span');
        el.className = 'emoji-float';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.bottom = '0px';
        el.style.left = (4 + Math.floor(Math.random() * 120)) + 'px';
        container.appendChild(el);
        setTimeout(function() { el.remove(); }, 1400);
      }, idx * 100);
    })(i);
  }
}

/* ---------- LIVE REACTIONS (periódicas durante el juego) ---------- */
var VIEWER_COMMENTS_OK = [
  ['fontanero_pro', '¡Recto! 🔥'],
  ['obra_master', '¡Crack!'],
  ['maca_fan1', '¡Multicapa siempre! ✅'],
  ['instalador22', '¡Así se hace! 💪'],
  ['DIY_Paco', '¡El nivel perfecto!'],
  ['tools_fan', '¡Qué corte! ✂️'],
];
var VIEWER_COMMENTS_ERROR = [
  ['fontanero_pro', 'nooo 😱'],
  ['CuriosaMaria', '¿eso qué es? 😂'],
  ['instalador22', 'uy uy uy...'],
  ['DIY_Paco', 'mi abuela lo hace mejor'],
  ['maca_fan1', 'Maca no mires 🙈'],
  ['tools_fan', '💀💀💀'],
];

function spawnLiveReaction(emoji) {
  // Use panel reactions if panel is open, else left emoji-rain strip
  var panelOpen = $('overlay-edu').classList.contains('active');
  var container = panelOpen ? $('directo-reactions') : $('emoji-rain');
  if (!container) return;
  var el = document.createElement('span');
  el.className = panelOpen ? 'directo-reaction' : 'emoji-float';
  el.textContent = emoji;
  el.style.bottom = '0px';
  el.style.left = (4 + Math.floor(Math.random() * 120)) + 'px';
  container.appendChild(el);
  setTimeout(function() { el.remove(); }, 1400);
}

function addDirectoComment(user, text) {
  // Use panel comments if panel is open, else gameplay comments strip
  var panelOpen = $('overlay-edu').classList.contains('active');
  var container = panelOpen ? $('directo-comments') : $('live-comments');
  if (!container) return;
  var el = document.createElement('div');
  el.className = panelOpen ? 'directo-comment' : 'live-comment';
  el.innerHTML = '<strong>' + user + '</strong> ' + text;
  container.appendChild(el);
  var max = panelOpen ? 3 : 3;
  while (container.children.length > max) {
    container.removeChild(container.firstChild);
  }
  // Auto-remove gameplay comments after 4s
  if (!panelOpen) {
    setTimeout(function() { if (el.parentNode) el.remove(); }, 4000);
  }
}

function startLiveReactions(type) {
  stopLiveReactions();
  var emojis = type === 'error'
    ? ['💀','😂','😱','🙈','❌','👎']
    : ['🔥','❤️','👏','✨','💯'];
  var comments = type === 'error' ? VIEWER_COMMENTS_ERROR : VIEWER_COMMENTS_OK;
  var commentIdx = 0;

  // Spawn reactions every 400ms
  S.reactionInterval = setInterval(function() {
    spawnLiveReaction(emojis[Math.floor(Math.random() * emojis.length)]);
  }, 400);

  // Add a couple comments with delay
  comments.slice(0, 3).forEach(function(c, i) {
    setTimeout(function() {
      addDirectoComment(c[0], c[1]);
    }, i * 700);
  });
}

function stopLiveReactions() {
  if (S.reactionInterval) {
    clearInterval(S.reactionInterval);
    S.reactionInterval = null;
  }
}

/* Ambient reactions during normal gameplay — occasional ok emojis + viewer comments */
var AMBIENT_EMOJIS = ['🔥','❤️','👏','✨','💯','🏆','👀','😍'];
var AMBIENT_COMMENTS_POOL = [
  ['fontanero_pro', 'qué maña! 🔥'],
  ['obra_master', 'yo aprendí así'],
  ['maca_fan1', 'viendoooo 👀'],
  ['instalador22', 'que buen corte!'],
  ['DIY_Paco', 'yo lo hago con sierra 😂'],
  ['tools_fan', 'el nivel de burbuja!! ✨'],
  ['CuriosaMaria', 'primera vez viendo esto'],
  ['ElectroLuis', 'multicapa siempre gana'],
  ['ObraTV', 'contenido de calidad 💯'],
];
var _ambientCommentIdx = 0;

function startAmbientReactions() {
  stopAmbientReactions();
  // Only fire if user hasn't interacted for a while — every 10-18s
  function scheduleNext() {
    S.ambientInterval = setTimeout(function() {
      if (!$('overlay-edu').classList.contains('active')) {
        // One emoji + occasionally a comment
        spawnLiveReaction(AMBIENT_EMOJIS[Math.floor(Math.random() * AMBIENT_EMOJIS.length)]);
        if (Math.random() < 0.5) {
          var c = AMBIENT_COMMENTS_POOL[_ambientCommentIdx % AMBIENT_COMMENTS_POOL.length];
          _ambientCommentIdx++;
          addDirectoComment(c[0], c[1]);
        }
      }
      scheduleNext();
    }, 10000 + Math.floor(Math.random() * 8000));
  }
  scheduleNext();
}

function stopAmbientReactions() {
  if (S.ambientInterval) {
    clearTimeout(S.ambientInterval);
    S.ambientInterval = null;
  }
}

/* ---------- TASK COMPLETED ---------- */
function fireTaskCompleted() {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  } catch(e) {}
}

/* ---------- RECORD ---------- */
function getRecord() {
  return parseInt(localStorage.getItem(RECORD_KEY) || '0', 10);
}

function saveRecord(score) {
  var prev = getRecord();
  if (score > prev) { localStorage.setItem(RECORD_KEY, score); return true; }
  return false;
}

/* ---------- HOWTO SLIDES ---------- */
var currentSlide = 1;

function goToSlide(n) {
  document.querySelectorAll('.howto-slide').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.dot').forEach(function(d) { d.classList.remove('active'); });
  $('slide-' + n).classList.add('active');
  document.querySelector('[data-slide="' + n + '"]').classList.add('active');
  currentSlide = n;
  $('btn-howto-next').textContent = n < 3 ? 'Siguiente →' : '¡A montar!';
}

/* ---------- ROUND INIT ---------- */
function startRound(idx) {
  S.round = idx;
  S.lives = MAX_LIVES;
  S.roundErrors = 0;
  S.phase = 'material';
  updateLivesUI();

  var r = ROUNDS[idx];
  $('hud-round').textContent = 'Ronda ' + (idx + 1) + ' / ' + TOTAL_ROUNDS;

  // Show maca header with context + question
  $('maca-header').classList.remove('hidden');
  $('maca-header-avatar').src = MACA.happy;
  $('maca-header-bubble').textContent = r.macaMsg;

  // Hide char-area bottom during material phase
  hideCharMsg();

  // Show material tray
  $('material-tray').classList.remove('hidden');

  // Reset material buttons
  document.querySelectorAll('.material-btn').forEach(function(b) {
    b.classList.remove('wrong');
  });

  $('btn-confirm').classList.add('hidden');

  // Clear play area
  $('play-area').innerHTML = '';
  $('instruction-banner').textContent = '';

  // Hide play-area during material phase so tray sits right below maca-header
  $('play-area').style.display = 'none';
}

/* ---------- MATERIAL SELECTION ---------- */
function handleMaterialChoice(chosen) {
  var r = ROUNDS[S.round];
  if (chosen === r.material) {
    // Correct — no green flash, just proceed
    $('material-tray').classList.add('hidden');
    $('maca-header').classList.add('hidden');
    startCutPhase();
  } else {
    // Wrong
    loseLife();
    var btn2 = $('btn-' + chosen);
    btn2.classList.add('wrong');
    setTimeout(function() { btn2.classList.remove('wrong'); }, 500);

    // Update maca header to worried — specific to the wrong material chosen
    var macaErrorMsgs = {
      multicapa: '¡Uy, multicapa aquí no! Mira los comentarios... esto no queda bien en el directo.',
      pex: '¡PEX aquí no, cariño! El chat se está riendo... Escúchame un momento.',
      cobre: '¡Cobre aquí no! La gente lo está viendo todo... Vamos a explicar por qué.'
    };
    $('maca-header-avatar').src = MACA.worried;
    $('maca-header-bubble').textContent = macaErrorMsgs[chosen] || 'Ay… eso no era… espera, espera.';

    // Fire error reactions immediately (visible before panel opens)
    startLiveReactions('error');

    var errorMsg = r.errorMaterial[chosen] || '';
    showMaterialEduOverlay(chosen, r.material, errorMsg);

    if (S.lives <= 0) {
      $('overlay-edu').classList.remove('active');
      showRoundFailed();
    }
  }
}

/* ---------- CUT PHASE ---------- */
function startCutPhase() {
  S.phase = 'corte';
  var r = ROUNDS[S.round];

  $('maca-header').classList.add('hidden');
  $('instruction-banner').textContent = 'Desliza para cortar — perpendicular a la tubería';

  var area = $('play-area');
  area.style.display = '';
  area.innerHTML = '';

  // Draw pipe image
  var pipe = document.createElement('img');
  pipe.src = ASSETS + 'tuberia_' + r.material + '.png';
  pipe.className = 'cut-pipe';
  pipe.style.cssText = 'width:240px; height:40px; object-fit:contain; display:block; margin:auto; position:relative; z-index:20;';
  area.appendChild(pipe);

  // Draw canvas for cut gesture
  var canvas = document.createElement('canvas');
  canvas.id = 'cut-canvas';
  canvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:25;';
  canvas.width = area.offsetWidth;
  canvas.height = area.offsetHeight;
  area.appendChild(canvas);

  S.cutLine = null;
  bindCutGesture(canvas, pipe, area);

  // Ghost hand ronda 1
  if (r.ghostHand) {
    var ghost = document.createElement('div');
    ghost.id = 'ghost-hand';
    ghost.style.cssText = 'position:absolute; top:30%; left:50%; transform:translateX(-50%); font-size:32px; z-index:210; pointer-events:none; animation:floatUp 1.5s ease-in-out infinite;';
    ghost.textContent = '👆';
    area.appendChild(ghost);
    setTimeout(function() { if (ghost.parentNode) ghost.remove(); }, 2500);
  }
}

function bindCutGesture(canvas, pipe, area) {
  var ctx = canvas.getContext('2d');
  var startX, startY, drawing = false;

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function onStart(e) {
    e.preventDefault();
    var p = getPos(e);
    startX = p.x; startY = p.y;
    drawing = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function onMove(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#00E6BC';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function onEnd(e) {
    e.preventDefault();
    if (!drawing) return;
    drawing = false;
    var src = e.changedTouches ? e.changedTouches[0] : e;
    var rect = canvas.getBoundingClientRect();
    var endX = src.clientX - rect.left;
    var endY = src.clientY - rect.top;

    var dx = endX - startX;
    var dy = endY - startY;
    // Angle from vertical (perpendicular to horizontal pipe = 90° = straight down)
    // We measure deviation from vertical
    var angleFromVertical = Math.abs(Math.atan2(dx, Math.abs(dy)) * (180 / Math.PI));

    if (angleFromVertical <= 15) {
      // Correct cut
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#04FFB4';
      ctx.lineWidth = 3;
      ctx.stroke();

      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onEnd);

      $('instruction-banner').textContent = '✓ Corte recto';
      setTimeout(function() { startMontajePhase(); }, 800);
    } else {
      // Wrong cut — draw red line, shake, show Maca big + reactions, then clear and retry
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 3;
      ctx.stroke();

      pipe.style.animation = 'shake 0.3s ease';
      setTimeout(function() { pipe.style.animation = ''; }, 400);

      loseLife();

      // Show Maca big (full overlay) + error reactions for 2.5s, then let retry
      startLiveReactions('error');

      if (S.lives <= 0) {
        stopLiveReactions();
        showRoundFailed();
        return;
      }

      showRoundTransition(MACA.worried, 'Ay no, ay no, ay no… eso no va a quedar bonito en cámara. Ni fuera de cámara.', true, function() {
        stopLiveReactions();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $('instruction-banner').textContent = 'Desliza para cortar — perpendicular a la tubería';
      });
    }
  }

  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove,  { passive: false });
  canvas.addEventListener('touchend',   onEnd,   { passive: false });
  canvas.addEventListener('mousedown',  onStart);
  canvas.addEventListener('mousemove',  onMove);
  canvas.addEventListener('mouseup',    onEnd);
}

/* ---------- MONTAJE PHASE (drag pipe + rotate accessory + bubble level) ----------
   Unified phase: user drags pipe toward accessory AND rotates accessory freely.
   When pipe is within snap distance, bubble level appears.
   Confirm enabled only when pipe is snapped AND bubble is green.
-------------------------------------------------------------------- */
function startMontajePhase() {
  S.phase = 'montaje';
  var r = ROUNDS[S.round];
  var tol = r.bubbleTolerance;

  $('instruction-banner').textContent = 'Arrastra la tubería al accesorio y gíralo hasta alinear';

  var area = $('play-area');
  area.style.display = '';
  area.innerHTML = '';
  area.style.position = 'relative';

  var areaW = area.offsetWidth;
  var areaH = area.offsetHeight;

  // --- LAYOUT: calculate positions first so everything is consistent ---
  // Accessory: fixed right with minimal padding so pipe can reach it
  var ACC_SIZE = 64;
  var accX = areaW - ACC_SIZE - 4;
  var accY = Math.round((areaH - ACC_SIZE) / 2);

  // Pipe: 60% of area width, starts at left edge
  // Snap target puts pipe right edge flush against acc left edge
  var PIPE_H = 30;
  var PIPE_W = Math.round(areaW * 0.60);
  var pipeStartX = 4;
  var pipeCenterY = Math.round((areaH - PIPE_H) / 2);

  // snapX: left edge of pipe when its right edge touches acc left edge
  var snapX = accX - PIPE_W;
  var snapY = pipeCenterY;
  var SNAP_DIST = 50;

  // --- PIPE (draggable, starts far left) ---
  var pipe = document.createElement('img');
  pipe.src = ASSETS + 'tuberia_' + r.material + '.png';
  pipe.className = 'pipe-img';
  pipe.style.cssText = 'position:absolute; width:' + PIPE_W + 'px; height:' + PIPE_H + 'px; object-fit:contain; left:' + pipeStartX + 'px; top:' + pipeCenterY + 'px; z-index:20; touch-action:none; cursor:grab;';
  area.appendChild(pipe);

  // --- ACCESSORY (rotatable, fixed right) ---
  var accWrap = document.createElement('div');
  accWrap.style.cssText = 'position:absolute; width:' + ACC_SIZE + 'px; height:' + ACC_SIZE + 'px; left:' + accX + 'px; top:' + accY + 'px; z-index:10; cursor:pointer; touch-action:none;';
  var accImg = document.createElement('img');
  accImg.src = ASSETS + 'accesorio_' + r.accesorio + '.png';
  // Codo: mirror horizontally so the open end faces left (toward the pipe)
  var accMirror = (r.accesorio === 'codo') ? 'scaleX(-1)' : '';
  accImg.style.cssText = 'width:100%; height:100%; object-fit:contain; display:block; pointer-events:none;' + (accMirror ? ' transform:' + accMirror + ';' : '');
  accWrap.appendChild(accImg);
  area.appendChild(accWrap);

  // Alignment mark on accessory
  var mark = document.createElement('div');
  mark.style.cssText = 'position:absolute; top:2px; left:50%; transform:translateX(-50%); width:4px; height:10px; background:#00E6BC; border-radius:2px; z-index:25; pointer-events:none;';
  accWrap.appendChild(mark);

  // --- BUBBLE LEVEL (hidden until pipe snapped, centered above snap zone) ---
  var BUB_W = Math.min(200, areaW - 16), BUB_H = 50;
  var bubLeft = Math.max(4, Math.round((areaW - BUB_W) / 2));
  var bubTop  = Math.max(8, pipeCenterY - BUB_H - 20);
  var bubWrap = document.createElement('div');
  bubWrap.style.cssText = 'position:absolute; left:' + bubLeft + 'px; top:' + bubTop + 'px; z-index:30; pointer-events:none; width:' + BUB_W + 'px; height:' + BUB_H + 'px; display:none;';
  bubWrap.innerHTML = buildBubbleMontaje(BUB_W, BUB_H);
  area.appendChild(bubWrap);

  // --- CONFIRM BUTTON ---
  var confirmBtn = $('btn-confirm');
  confirmBtn.classList.remove('hidden');
  confirmBtn.classList.add('disabled');
  confirmBtn.textContent = 'Montar ✓';

  // --- STATE ---
  var isSnapped = false;
  var currentAngle = Math.random() * 100 - 50; // start off-center
  accWrap.style.transform = 'rotate(' + currentAngle + 'deg)';

  function isBubbleGreen() {
    var bub = bubWrap.querySelector('.bub-h-circle');
    return bub && bub.style.background === 'rgb(0, 230, 188)';
  }

  function updateConfirmState() {
    if (isSnapped && isBubbleGreen()) {
      confirmBtn.classList.remove('disabled');
    } else {
      confirmBtn.classList.add('disabled');
    }
  }

  // --- HORIZONTAL BUBBLE UPDATE (angle drives left/right offset) ---
  function updateRotBubble(angle) {
    var a = angle % 360;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;

    // Map angle ±90° → bubble left offset within container
    var dotW = 18;
    var centerPx = (BUB_W - dotW) / 2;
    var maxSwing = centerPx - 8;
    var swing = Math.max(-maxSwing, Math.min(maxSwing, a * 1.2));
    var bubLeft = centerPx + swing;

    var bub = bubWrap.querySelector('.bub-h-circle');
    if (!bub) return;
    bub.style.left = bubLeft + 'px';

    var absA = Math.abs(a);
    if (absA <= tol) {
      bub.style.background = '#00E6BC';
    } else if (absA <= tol * 2) {
      bub.style.background = 'orange';
    } else {
      bub.style.background = '#E74C3C';
    }
    updateConfirmState();
  }

  // --- PIPE DRAG ---
  bindDrag(pipe, area,
    function onDragMove(x, y) {
      pipe.style.left = x + 'px';
      pipe.style.top  = y + 'px';

      // Show/hide bubble level based on proximity
      var distX = Math.abs(x - snapX);
      var distY = Math.abs(y - snapY);
      if (distX < SNAP_DIST && distY < SNAP_DIST * 2) {
        if (!isSnapped) {
          bubWrap.style.display = 'block';
          updateRotBubble(currentAngle);
        }
      } else {
        if (!isSnapped) {
          bubWrap.style.display = 'none';
          confirmBtn.classList.add('disabled');
        }
      }
    },
    function onDragEnd(x, y) {
      var distX = Math.abs(x - snapX);
      var distY = Math.abs(y - snapY);

      if (distX < SNAP_DIST && distY < SNAP_DIST * 2) {
        // Snap pipe into place
        isSnapped = true;
        pipe.classList.add('snapping');
        pipe.style.left = snapX + 'px';
        pipe.style.top  = snapY + 'px';
        setTimeout(function() { pipe.classList.remove('snapping'); }, 250);
        bubWrap.style.display = 'block';
        updateRotBubble(currentAngle);
        $('instruction-banner').textContent = 'Gira el accesorio — centra la burbuja en verde';
      } else {
        // Return pipe to start
        isSnapped = false;
        pipe.classList.add('snapping');
        pipe.style.left = pipeStartX + 'px';
        pipe.style.top  = pipeCenterY + 'px';
        setTimeout(function() { pipe.classList.remove('snapping'); }, 300);
        bubWrap.style.display = 'none';
        confirmBtn.classList.add('disabled');
      }
    }
  );

  // --- ACCESSORY ROTATION (touch anywhere on area when not dragging pipe) ---
  var lastAngle = null;

  function getAngleFromAcc(clientX, clientY) {
    var rect = accWrap.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    return Math.atan2(clientX - cx, -(clientY - cy)) * (180 / Math.PI);
  }

  function onRotStart(e) {
    e.preventDefault();
    var src = e.touches ? e.touches[0] : e;
    lastAngle = getAngleFromAcc(src.clientX, src.clientY) - currentAngle;
  }

  function onRotMove(e) {
    if (lastAngle === null) return;
    var src = e.touches ? e.touches[0] : e;
    currentAngle = getAngleFromAcc(src.clientX, src.clientY) - lastAngle;
    accWrap.style.transform = 'rotate(' + currentAngle + 'deg)';
    if (bubWrap.style.display !== 'none') {
      updateRotBubble(currentAngle);
    }
  }

  function onRotEnd() {
    lastAngle = null;
  }

  accWrap.addEventListener('touchstart', onRotStart, { passive: false });
  area.addEventListener('touchmove',  onRotMove, { passive: false });
  area.addEventListener('touchend',   onRotEnd,  { passive: false });
  accWrap.addEventListener('mousedown', onRotStart);
  area.addEventListener('mousemove',  onRotMove);
  area.addEventListener('mouseup',    onRotEnd);

  // --- CONFIRM ---
  confirmBtn.onclick = function() {
    if (confirmBtn.classList.contains('disabled')) return;
    confirmBtn.onclick = null;

    // Snap acc to 0
    accWrap.style.transition = 'transform 0.15s ease-out';
    accWrap.style.transform = 'rotate(0deg)';

    // Flash turquesa
    accImg.style.filter = 'drop-shadow(0 0 8px #00E6BC)';
    pipe.style.filter   = 'drop-shadow(0 0 8px #00E6BC)';
    setTimeout(function() {
      accImg.style.filter = '';
      pipe.style.filter   = '';
    }, 500);

    confirmBtn.classList.add('hidden');
    setTimeout(function() { roundSuccess(); }, 600);
  };
}

function buildBubbleH() {
  return '<div style="position:relative;width:160px;height:40px;">' +
    '<img src="assets/nivel_burbuja_h.png" style="width:160px;height:40px;object-fit:contain;display:block;" alt="">' +
    '<div class="bub-circle" style="position:absolute;top:50%;left:50%;width:16px;height:16px;border-radius:50%;background:#E74C3C;transform:translate(-50%,-50%);transition:left 0.1s,background 0.15s;"></div>' +
    '</div>';
}

function buildBubbleMontaje(w, h) {
  // Large horizontal bubble level using nivel_burbuja_h.png
  // Bubble dot 18px wide, starts centered
  var dotW = 18;
  var dotTop = Math.round(h / 2 - dotW / 2);
  var dotLeft = Math.round((w - dotW) / 2);
  return '<div style="position:relative;width:' + w + 'px;height:' + h + 'px;">' +
    '<img src="assets/nivel_burbuja_h.png" style="width:100%;height:100%;object-fit:contain;display:block;" alt="">' +
    '<div class="bub-h-circle" style="position:absolute;top:' + dotTop + 'px;left:' + dotLeft + 'px;width:18px;height:18px;border-radius:50%;background:#E74C3C;transition:left 0.1s,background 0.15s;"></div>' +
    '</div>';
}

function buildBubbleR() {
  return '<div style="position:relative;width:80px;height:80px;">' +
    '<img src="assets/nivel_burbuja_r.png" style="width:80px;height:80px;object-fit:contain;display:block;" alt="">' +
    '<div class="bub-r-circle" style="position:absolute;width:14px;height:14px;border-radius:50%;background:#E74C3C;top:12px;left:33px;transition:top 0.1s,left 0.1s,background 0.15s;"></div>' +
    '</div>';
}

/* ---------- DRAG HELPER ---------- */
function bindDrag(el, container, onMove, onEnd) {
  var startX, startY, startElX, startElY, dragging = false, moved = false;

  function getPos(e) {
    var src = e.touches ? e.touches[0] : e;
    return { x: src.clientX, y: src.clientY };
  }

  function start(e) {
    e.preventDefault();
    var p = getPos(e);
    startX = p.x; startY = p.y;
    startElX = parseFloat(el.style.left) || 0;
    startElY = parseFloat(el.style.top)  || 0;
    dragging = true; moved = false;
    el.classList.add('dragging');
    el.style.zIndex = '500';
  }

  function move(e) {
    e.preventDefault();
    if (!dragging) return;
    var p = getPos(e);
    var dx = p.x - startX;
    var dy = p.y - startY;
    if (!moved && Math.sqrt(dx*dx + dy*dy) < 8) return;
    moved = true;
    var newX = startElX + dx;
    var newY = startElY + dy;
    onMove(newX, newY);
  }

  function end(e) {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    el.style.zIndex = '20';
    if (moved) {
      var p = e.changedTouches ? e.changedTouches[0] : e;
      var newX = startElX + (p.clientX - startX);
      var newY = startElY + (p.clientY - startY);
      onEnd(newX, newY);
    }
  }

  el.addEventListener('touchstart', start, { passive: false });
  document.addEventListener('touchmove',  move,  { passive: false });
  document.addEventListener('touchend',   end);
  el.addEventListener('mousedown',  start);
  document.addEventListener('mousemove',  move);
  document.addEventListener('mouseup',    end);
}

/* ---------- ROUND TRANSITION OVERLAY ---------- */
function showRoundTransition(avatarSrc, msg, big, onDone) {
  var overlay = $('round-transition');
  var avatar  = $('rt-avatar');
  var bubble  = $('rt-bubble');
  avatar.src = avatarSrc;
  bubble.textContent = msg;
  avatar.classList.toggle('big', !!big);
  overlay.classList.add('active');
  var delay = big ? 2800 : 2200;
  setTimeout(function() {
    overlay.classList.remove('active');
    if (onDone) onDone();
  }, delay);
}

/* ---------- ROUND SUCCESS ---------- */
function roundSuccess() {
  var pts = S.roundErrors === 0 ? 200 : 150;
  S.score += pts;
  S.roundResults.push(true);

  spawnEmojis();

  // Burst of live reactions from viewers
  var okEmojis = ['🔥','❤️','👏','💯','✨','🏆'];
  for (var i = 0; i < 6; i++) {
    (function(idx) {
      setTimeout(function() {
        var container = $('emoji-rain');
        var el = document.createElement('span');
        el.className = 'emoji-float';
        el.textContent = okEmojis[Math.floor(Math.random() * okEmojis.length)];
        el.style.bottom = '0px';
        el.style.left = (4 + Math.floor(Math.random() * 120)) + 'px';
        if (container) { container.appendChild(el); setTimeout(function() { el.remove(); }, 1400); }
      }, idx * 150);
    })(i);
  }

  // Burst of ok reactions in live-hud strip
  startLiveReactions('ok');
  setTimeout(stopLiveReactions, 2000);
  // Add 2 viewer comments in gameplay strip
  var okPool = VIEWER_COMMENTS_OK;
  var c1 = okPool[Math.floor(Math.random() * okPool.length)];
  var c2 = okPool[Math.floor(Math.random() * okPool.length)];
  addDirectoComment(c1[0], c1[1]);
  setTimeout(function() { addDirectoComment(c2[0], c2[1]); }, 600);

  var msg = ACIERTO_MSGS[S.acierto_msg_idx % ACIERTO_MSGS.length];
  S.acierto_msg_idx++;

  // Show full-screen transition with Maca celebrating
  showRoundTransition(MACA.celebrating, msg, false, function() {
    nextRound();
  });
}

/* ---------- ROUND FAILED ---------- */
function showRoundFailed() {
  S.roundResults.push(false);
  $('overlay-edu').classList.remove('active');
  $('overlay-failed').classList.add('active');
}

/* ---------- NEXT ROUND ---------- */
function nextRound() {
  if (S.round + 1 >= TOTAL_ROUNDS) {
    showResults();
  } else {
    startRound(S.round + 1);
  }
}

/* ---------- RESULTS ---------- */
function showResults() {
  stopAmbientReactions();
  stopLiveReactions();
  showScreen('results');

  var score = S.score;
  $('results-score').textContent = score + ' pts';

  // Record
  var isNew = saveRecord(score);
  var prev  = getRecord();
  var recEl = $('results-record');
  if (isNew) {
    recEl.textContent = '¡Nuevo récord! ' + score + ' pts';
    recEl.classList.add('new-record');
  } else {
    recEl.textContent = 'Récord: ' + prev + ' pts';
    recEl.classList.remove('new-record');
  }

  // Avatar + message
  var avatar = $('results-avatar');
  var bubble = $('results-bubble');
  if (score >= 900) {
    avatar.src = MACA.celebrating;
    avatar.classList.add('celebrating');
    bubble.textContent = '¡Increíble! ¡Seis líneas rectas y limpias! ¡Eres el fontanero más fotogénico que he tenido! ¡El directo ha sido un éxito total!';
  } else if (score >= 700) {
    avatar.src = MACA.happy;
    bubble.textContent = '¡Bastante bien! Alguna línea no quedó perfecta, pero en general se ve muy bien en cámara. Repasa la elección de material y repetimos.';
  } else {
    avatar.src = MACA.worried;
    bubble.textContent = 'Bueno… el filtro puede arreglar muchas cosas, pero no una tubería torcida. Practica la secuencia completa: medir, cortar, presentar, alinear. ¡Tú puedes!';
  }

  // Progress chunks
  var prog = $('results-progress');
  prog.innerHTML = '';
  for (var i = 0; i < TOTAL_ROUNDS; i++) {
    var chunk = document.createElement('div');
    chunk.className = 'progress-chunk' + (S.roundResults[i] ? ' ok' : '');
    prog.appendChild(chunk);
  }

  // TASK_COMPLETED
  if (score >= TASK_THRESHOLD) {
    setTimeout(fireTaskCompleted, 300);
  }
}

/* ---------- RESET ---------- */
function resetGame() {
  S.round = 0;
  S.lives = MAX_LIVES;
  S.score = 0;
  S.phase = 'material';
  S.roundErrors = 0;
  S.roundResults = [];
  S.acierto_msg_idx = 0;
  S.followers = 12400;
  stopLiveReactions();
  stopAmbientReactions();
  document.documentElement.classList.remove('results');
  document.getElementById('results-avatar').classList.remove('celebrating');
  $('char-area').classList.add('hidden');
  $('play-area').style.display = '';
  $('maca-header').classList.remove('hidden');
}

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', function() {

  // Intro → Howto
  $('btn-start').addEventListener('click', function() {
    showScreen('howto');
    goToSlide(1);
  });

  // Howto slides
  $('btn-howto-next').addEventListener('click', function() {
    if (currentSlide < 3) {
      goToSlide(currentSlide + 1);
    } else {
      showScreen('play');
      resetGame();
      startRound(0);
      startAmbientReactions();
    }
  });

  document.querySelectorAll('.dot').forEach(function(d) {
    d.addEventListener('click', function() {
      goToSlide(parseInt(d.dataset.slide));
    });
  });

  // Material buttons
  ['multicapa', 'pex', 'cobre'].forEach(function(m) {
    $('btn-' + m).addEventListener('click', function() {
      if (S.phase !== 'material') return;
      handleMaterialChoice(m);
    });
  });

  // Hints
  $('btn-hint').addEventListener('click', function() {
    $('overlay-hints').classList.add('active');
  });
  $('btn-hints-close').addEventListener('click', function() {
    $('overlay-hints').classList.remove('active');
  });

  // Educational overlay "Entendido"
  $('btn-understood').addEventListener('click', function() {
    $('overlay-edu').classList.remove('active');
    stopLiveReactions();
    if (S.phase === 'material') {
      $('maca-header-avatar').src = MACA.happy;
      var r = ROUNDS[S.round];
      $('maca-header-bubble').textContent = r.macaMsg;
      document.querySelectorAll('.material-btn').forEach(function(b) {
        b.classList.remove('wrong');
      });
    } else {
      hideCharMsg();
    }
  });

  // Round failed "Continuar"
  $('btn-continue').addEventListener('click', function() {
    $('overlay-failed').classList.remove('active');
    nextRound();
  });

  // Retry
  $('btn-retry').addEventListener('click', function() {
    resetGame();
    showScreen('play');
    startRound(0);
    startAmbientReactions();
  });
});
