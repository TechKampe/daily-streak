/* ================================================================
   SCHUKO MASTER — Kampe Games — Game Logic
   ================================================================ */

/* ===== ASSETS ===== */
var CLD = 'https://res.cloudinary.com/kampe/image/upload/';
var A = {
  base:        CLD + 'v1771938594/salva_base_x8eghx.png',
  happy:       CLD + 'v1771938597/salva_happy_ccjemp.png',
  celebrating: CLD + 'v1771938594/salva_celebrating_xki0p5.png',
  worried:     CLD + 'v1771938598/salva_worried_glnc2b.png'
};

/* N2 error images */
var ERR_IMG = {
  'no-tierra':        CLD + 'v1772627903/error_no_tierra_gtxa6e.png',
  'pelado-largo':     CLD + 'v1772627902/error_pelado_largo_kg52f6.png',
  'tornillo-flojo':   CLD + 'v1772627902/error_tornillo_flojo_ccogdn.png',
  'cables-cruzados':  CLD + 'v1772627903/error_cables_cruzados_rbxjnd.png',
  'cobre-cortado':    CLD + 'v1772627902/error_cobre_cortado_dt8kak.png',
  'enchufe-normal':   CLD + 'v1772632688/enchufe_normal_znowlq.png'
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

/* ===== GAME STATE ===== */
var MAX_LIVES = 5;
var TASK_THRESHOLD = 150;
var score = 0;
var lives = MAX_LIVES;
var level = 0;
var busy = false;
var taskSent = false;
var record = parseInt(localStorage.getItem('schuko_master_record')) || 0;
var levelErrors = 0;

/* N1 state */
var earthConnectedFirst = false;
var cablesConnected = 0;
var dragCable = null;
var ghostEl = null;

/* N2 state */
var n2Round = 0;
var n2ErrorsInRound = [];
var n2FoundInRound = [];

/* N3 state */

/* ===== INIT ===== */
(function init() {
  $('intro-av').src = A.happy;
  $('intro-btn').addEventListener('click', startGame);
  $('res-btn').addEventListener('click', function() { location.reload(); });
  $('fb-btn').addEventListener('click', closeFeedback);
})();

function startGame() {
  score = 0;
  lives = MAX_LIVES;
  level = 0;
  taskSent = false;
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

function loseLife() {
  lives--;
  updateHUD();
  $('hud-lives').classList.add('shaking');
  setTimeout(function() { $('hud-lives').classList.remove('shaking'); }, 400);
  flash('red');
  if (lives <= 0) {
    setTimeout(showResults, 600);
  }
}

function addScore(pts) {
  score += pts;
  updateHUD();
  flash('green');
}

function flash(color) {
  var el = $('flash-overlay');
  el.className = 'flash-overlay flash-' + color;
  setTimeout(function() { el.className = 'flash-overlay'; }, 400);
}

/* ===== CHARACTER ===== */
function setChar(state, msg) {
  $('char-av').src = A[state] || A.happy;
  if (msg) {
    $('char-bubble').textContent = msg;
    $('char-bubble').classList.add('show');
  } else {
    $('char-bubble').classList.remove('show');
  }
}

/* ===== FEEDBACK OVERLAY ===== */
function showFeedback(avatar, text, sub, btnText, cb) {
  $('fb-av').src = A[avatar] || A.happy;
  $('fb-text').textContent = text;
  $('fb-sub').textContent = sub || '';
  $('fb-btn').textContent = btnText || 'Entendido';
  $('feedback-overlay').classList.add('show');
  $('fb-btn').onclick = function() {
    closeFeedback();
    if (cb) cb();
  };
}

function closeFeedback() {
  $('feedback-overlay').classList.remove('show');
}

/* ===== MISSION ===== */
var MISSIONS = {
  1: {
    text: 'Arrastra los 3 cables al borne correcto. ¡Primero la tierra!',
    hints: [
      'Tierra (verde-amarillo) → borne PE (central)',
      'Fase (marrón) → borne L (izquierda)',
      'Neutro (azul) → borne N (derecha)'
    ]
  },
  2: {
    text: 'Encuentra el error de montaje. ¿Qué falla en este enchufe?',
    hints: [
      'Busca cobre visible fuera de los bornes',
      'Comprueba que la tierra esté conectada',
      'Fíjate en tornillos flojos o cables cruzados'
    ]
  },
  3: {
    text: 'Ordena los 5 pasos del chequeo profesional.',
    hints: [
      'Paso 1 siempre es comprobar la tierra',
      'Seguridad → Funcionalidad → Visual → Mecánico → Alineación'
    ]
  },
  4: {
    text: 'Inspección rápida: ¿pasa o no pasa? ¡Decide antes de que se acabe el tiempo!',
    hints: [
      'Fíjate en los 5 puntos del chequeo',
      'Si todo está correcto, pasa. Si hay cualquier fallo, no pasa.'
    ]
  }
};

var hintIdx = 0;
function setupMission() {
  var m = MISSIONS[level];
  $('mission-text').textContent = m.text;
  hintIdx = 0;
  var hintBtn = $('mission-hint');
  hintBtn.classList.remove('used');
  hintBtn.classList.add('pulse');
  hintBtn.onclick = function() {
    if (hintIdx < m.hints.length) {
      setChar('happy', '💡 ' + m.hints[hintIdx]);
      hintIdx++;
      if (hintIdx >= m.hints.length) {
        hintBtn.classList.add('used');
        hintBtn.classList.remove('pulse');
      }
    }
  };
}

/* ===== START LEVEL ===== */
function startLevel(lvl) {
  level = lvl;
  levelErrors = 0;
  updateHUD();
  setupMission();

  // Hide all trays
  $('cable-tray').classList.add('hidden');
  $('cable-tray').classList.remove('has-chips');
  $('cable-tray').innerHTML = '';
  $('error-tray').classList.remove('show');
  $('check-tray').classList.remove('show');
  $('check-tray').innerHTML = '';
  $('verdict-area').classList.remove('show');
  $('timer-wrap').classList.remove('show');

  if (lvl === 1) setupLevel1();
  else if (lvl === 2) setupLevel2();
  else if (lvl === 3) setupLevel3();
  else if (lvl === 4) setupLevel4();
}

/* ================================================================
   LEVEL 1 — MONTA EL ENCHUFE
   ================================================================ */

function setupLevel1() {
  earthConnectedFirst = false;
  cablesConnected = 0;

  setChar('happy', 'Tres cables, tres bornes. ¡Primero la tierra!');

  // Build schuko SVG
  $('circuit-area').innerHTML = buildSchuko_N1();

  // Cable tray
  var cables = [
    { id: 'tierra', label: 'Tierra', css: 'cable-verde-amarillo', accepts: 'PE' },
    { id: 'fase',   label: 'Fase',   css: 'cable-marron',        accepts: 'L' },
    { id: 'neutro', label: 'Neutro', css: 'cable-azul',          accepts: 'N' },
    { id: 'dist',   label: 'Gris',   css: 'cable-gris',          accepts: '_none' }
  ];
  shuffle(cables);

  var tray = $('cable-tray');
  tray.classList.remove('hidden');
  tray.classList.add('has-chips');
  cables.forEach(function(c) {
    var chip = document.createElement('div');
    chip.className = 'cable-chip ' + c.css;
    chip.dataset.id = c.id;
    chip.dataset.accepts = c.accepts;
    tray.appendChild(chip);
  });

  setupDrag();
}

/* ===== SCHUKO SVG — N1 (clean, empty bornes) ===== */
function buildSchuko_N1() {
  var w = 300, h = 280;
  var cx = 150, cy = 130;
  var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';

  // Backplate (wall plate)
  svg += '<rect x="50" y="30" width="200" height="220" rx="18" ry="18" fill="#E8E8E8" stroke="#BDBDBD" stroke-width="2"/>';

  // Inner cavity (circular recess)
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="65" fill="#D0D0D0" stroke="#AAAAAA" stroke-width="2"/>';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="60" fill="#F5F5F5" stroke="#CCCCCC" stroke-width="1"/>';

  // Earth clips (PE) — the two lateral metal tabs
  svg += '<rect x="88" y="82" width="4" height="30" rx="2" fill="#B0B0B0" stroke="#888" stroke-width="1"/>';
  svg += '<rect x="88" y="148" width="4" height="30" rx="2" fill="#B0B0B0" stroke="#888" stroke-width="1"/>';
  svg += '<rect x="208" y="82" width="4" height="30" rx="2" fill="#B0B0B0" stroke="#888" stroke-width="1"/>';
  svg += '<rect x="208" y="148" width="4" height="30" rx="2" fill="#B0B0B0" stroke="#888" stroke-width="1"/>';

  // Phase hole (L) — left
  svg += '<circle cx="120" cy="150" r="8" fill="#444" stroke="#333" stroke-width="1.5"/>';

  // Neutral hole (N) — right
  svg += '<circle cx="180" cy="150" r="8" fill="#444" stroke="#333" stroke-width="1.5"/>';

  // --- Interactive terminals (bornes) ---

  // PE (earth) terminal — top center
  svg += '<circle class="terminal" id="term-PE" cx="' + cx + '" cy="66" r="14" />';
  svg += '<text class="terminal-label" x="' + cx + '" y="70" text-anchor="middle" font-size="10">PE</text>';
  svg += '<circle class="terminal-hit" data-borne="PE" cx="' + cx + '" cy="66" r="22"/>';

  // L (phase) terminal — bottom left
  svg += '<circle class="terminal" id="term-L" cx="110" cy="210" r="14" />';
  svg += '<text class="terminal-label" x="110" y="214" text-anchor="middle" font-size="10">L</text>';
  svg += '<circle class="terminal-hit" data-borne="L" cx="110" cy="210" r="22"/>';

  // N (neutral) terminal — bottom right
  svg += '<circle class="terminal" id="term-N" cx="190" cy="210" r="14" />';
  svg += '<text class="terminal-label" x="190" y="214" text-anchor="middle" font-size="10">N</text>';
  svg += '<circle class="terminal-hit" data-borne="N" cx="190" cy="210" r="22"/>';

  // Wire paths (dashed, to be filled) — extended for larger drop area
  svg += '<line class="wire wire-empty" id="wire-PE" x1="' + cx + '" y1="66" x2="' + cx + '" y2="16"/>';
  svg += '<line class="wire wire-empty" id="wire-L" x1="110" y1="210" x2="60" y2="264"/>';
  svg += '<line class="wire wire-empty" id="wire-N" x1="190" y1="210" x2="240" y2="264"/>';

  // Invisible fat wire drop zones (easier to drop on the wire path)
  svg += '<line class="wire-drop" data-borne="PE" x1="' + cx + '" y1="66" x2="' + cx + '" y2="16"/>';
  svg += '<line class="wire-drop" data-borne="L" x1="110" y1="210" x2="60" y2="264"/>';
  svg += '<line class="wire-drop" data-borne="N" x1="190" y1="210" x2="240" y2="264"/>';

  // Labels at wire ends
  svg += '<text x="' + cx + '" y="12" fill="rgba(255,255,255,.5)" font-size="9" text-anchor="middle" font-family="Baloo 2" font-weight="700">⏚ TIERRA</text>';
  svg += '<text x="52" y="274" fill="rgba(255,255,255,.5)" font-size="9" text-anchor="middle" font-family="Baloo 2" font-weight="700">L FASE</text>';
  svg += '<text x="248" y="274" fill="rgba(255,255,255,.5)" font-size="9" text-anchor="middle" font-family="Baloo 2" font-weight="700">N NEUTRO</text>';

  svg += '</svg>';
  return svg;
}

/* ===== DRAG & DROP (N1) ===== */
function setupDrag() {
  ghostEl = $('drag-ghost');
  var tray = $('cable-tray');

  function onStart(e) {
    if (busy) return;
    var chip = e.target.closest('.cable-chip');
    if (!chip || chip.classList.contains('used')) return;
    e.preventDefault();
    dragCable = {
      id: chip.dataset.id,
      accepts: chip.dataset.accepts,
      el: chip
    };
    chip.classList.add('dragging');
    ghostEl.className = 'drag-ghost active cable-chip ' + chip.className.split(' ').filter(function(c){return c.startsWith('cable-');}).join(' ');
    ghostEl.textContent = '';
    ghostEl.style.width = chip.offsetWidth + 'px';
    ghostEl.style.height = chip.offsetHeight + 'px';
    moveGhost(e);

    // Highlight valid terminal
    var hits = document.querySelectorAll('.terminal-hit');
    hits.forEach(function(h) {
      if (h.dataset.borne === dragCable.accepts) {
        var term = document.getElementById('term-' + h.dataset.borne);
        if (term && !term.classList.contains('filled')) term.classList.add('highlight');
      }
    });
  }

  function onMove(e) {
    if (!dragCable) return;
    e.preventDefault();
    moveGhost(e);
  }

  function onEnd(e) {
    if (!dragCable) return;
    e.preventDefault();

    // Remove highlights
    document.querySelectorAll('.terminal.highlight').forEach(function(t) { t.classList.remove('highlight'); });

    // Check drop target — terminal hit zone OR wire drop zone
    var touch = e.changedTouches ? e.changedTouches[0] : e;
    var dropEl = document.elementFromPoint(touch.clientX, touch.clientY);
    var hit = dropEl ? dropEl.closest('.terminal-hit') : null;
    var wireDrop = !hit && dropEl ? dropEl.closest('.wire-drop') : null;

    if (hit) {
      processDrop(hit.dataset.borne, dragCable);
    } else if (wireDrop) {
      processDrop(wireDrop.dataset.borne, dragCable);
    }

    // Cleanup
    dragCable.el.classList.remove('dragging');
    ghostEl.className = 'drag-ghost';
    dragCable = null;
  }

  function moveGhost(e) {
    var t = e.touches ? e.touches[0] : e;
    ghostEl.style.left = (t.clientX - 30) + 'px';
    ghostEl.style.top = (t.clientY - 20) + 'px';
  }

  tray.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd, { passive: false });
  tray.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}

function processDrop(borne, cable) {
  var term = document.getElementById('term-' + borne);
  if (!term || term.classList.contains('filled')) return;

  // Check: must connect earth first
  if (cablesConnected === 0 && cable.accepts !== 'PE') {
    term.classList.add('error');
    setTimeout(function() { term.classList.remove('error'); }, 500);
    setChar('worried', '¡Para! Primero conecta la tierra. La tierra no es opcional.');
    loseLife();
    levelErrors++;
    return;
  }

  // Check: distractor
  if (cable.accepts === '_none') {
    term.classList.add('error');
    setTimeout(function() { term.classList.remove('error'); }, 500);
    setChar('worried', 'Ese cable no corresponde a esta instalación. Solo necesitas 3: fase, neutro y tierra.');
    loseLife();
    levelErrors++;
    return;
  }

  // Check: correct borne
  if (cable.accepts === borne) {
    // Success!
    term.classList.add('filled');
    cable.el.classList.add('used');
    cablesConnected++;

    // Color the wire
    var wireEl = document.getElementById('wire-' + borne);
    if (wireEl) {
      wireEl.classList.remove('wire-empty');
      wireEl.classList.add('wire-connected');
      var colors = { PE: '#27AE60', L: '#8B5E3C', N: '#2E86C1' };
      wireEl.style.stroke = colors[borne] || '#fff';
    }

    // Track earth first bonus
    if (cablesConnected === 1 && borne === 'PE') {
      earthConnectedFirst = true;
      setChar('celebrating', '¡Bien! La tierra siempre primero. Protege a la persona.');
    } else {
      setChar('celebrating', pick(['¡Borne correcto!', '¡Bien conectado!', '¡Perfecto!']));
    }

    addScore(40);

    // Check level complete
    if (cablesConnected >= 3) {
      busy = true;
      setTimeout(function() {
        // Bonuses
        if (earthConnectedFirst) addScore(30);
        if (levelErrors === 0) addScore(20);
        showFeedback('celebrating',
          '¡Montaje limpio!',
          'Un enchufe no es tres cables y listo. Es seguridad, orden y método.' +
          (earthConnectedFirst ? '\n+30pts bonus ¡Primero la tierra!' : '') +
          (levelErrors === 0 ? '\n+20pts bonus sin errores' : ''),
          'Siguiente nivel',
          function() { busy = false; startLevel(2); }
        );
      }, 500);
    }
  } else {
    // Wrong borne
    term.classList.add('error');
    setTimeout(function() { term.classList.remove('error'); }, 500);

    var explanations = {
      PE: 'Tierra (verde-amarillo) → borne PE central.',
      L: 'Fase (marrón) → borne L.',
      N: 'Neutro (azul) → borne N.'
    };
    setChar('worried', 'Ese cable no va ahí. ' + (explanations[cable.accepts] || ''));
    loseLife();
    levelErrors++;
  }
}

/* ================================================================
   LEVEL 2 — ENCUENTRA LOS ERRORES
   ================================================================ */

var N2_ERROR_POOL = [
  {
    id: 'no-tierra',
    label: 'Tierra no conectada',
    explain: 'La tierra NUNCA se omite. Sin tierra, una derivación puede electrocutar al usuario.'
  },
  {
    id: 'pelado-largo',
    label: 'Pelado demasiado largo',
    explain: 'El cobre NO puede quedar visible fuera del borne. Es un cortocircuito esperando a pasar.'
  },
  {
    id: 'tornillo-flojo',
    label: 'Tornillo flojo',
    explain: 'Un tornillo flojo genera calor por mal contacto. Con el tiempo, puede fundir el plástico.'
  },
  {
    id: 'cables-cruzados',
    label: 'Cables cruzados',
    explain: 'Fase y neutro están invertidos. Aunque funcione, no cumple normativa y es peligroso.'
  },
  {
    id: 'cobre-cortado',
    label: 'Cobre cortado por exceso de apriete',
    explain: 'Apretar demasiado corta los hilos. El cable pierde sección y se calienta.'
  }
];

var n2Errors = []; // errors picked for this game
var n2RoundErrors = 0; // errors in current round

function setupLevel2() {
  n2Round = 0;
  // Pick 3 unique errors for 3 rounds
  n2Errors = shuffle(N2_ERROR_POOL.slice()).slice(0, 3);
  setChar('happy', 'Alguien ha montado estos enchufes... ¿Qué falla?');
  startN2Round();
}

function startN2Round() {
  n2Round++;
  if (n2Round > 3) {
    busy = true;
    showFeedback('celebrating',
      '¡Inspector pro!',
      'Si se ve desordenado, en obra es no profesional.',
      'Siguiente nivel',
      function() { busy = false; startLevel(3); }
    );
    return;
  }

  n2RoundErrors = 0;
  updateHUD();

  var error = n2Errors[n2Round - 1];
  setChar('happy', 'Enchufe ' + n2Round + '/3 — ¿Qué error ves?');

  // Show error image
  $('circuit-area').innerHTML = '<img class="n2-error-img" src="' + ERR_IMG[error.id] + '" alt="Enchufe con error">';

  // Build multiple choice options
  var eTray = $('error-tray');
  eTray.classList.add('show');

  // Build options: correct + 2 wrong
  var wrongPool = N2_ERROR_POOL.filter(function(e) { return e.id !== error.id; });
  shuffle(wrongPool);
  var options = shuffle([
    { id: error.id, label: error.label, correct: true },
    { id: wrongPool[0].id, label: wrongPool[0].label, correct: false },
    { id: wrongPool[1].id, label: wrongPool[1].label, correct: false }
  ]);

  var html = '<div class="n2-options">';
  options.forEach(function(opt) {
    html += '<div class="n2-option" data-correct="' + opt.correct + '" data-id="' + opt.id + '">' + opt.label + '</div>';
  });
  html += '</div>';
  eTray.innerHTML = html;

  // Bind clicks
  eTray.querySelectorAll('.n2-option').forEach(function(btn) {
    btn.addEventListener('click', function() { handleN2Choice(btn, error); });
  });
}

function handleN2Choice(btn, error) {
  if (busy) return;
  busy = true;

  var isCorrect = btn.dataset.correct === 'true';

  // Disable all options
  $('error-tray').querySelectorAll('.n2-option').forEach(function(b) {
    b.style.pointerEvents = 'none';
  });

  if (isCorrect) {
    btn.classList.add('correct');
    addScore(35);
    if (n2RoundErrors === 0) addScore(25); // bonus first try
    setChar('celebrating', '¡Buen ojo! ' + error.explain);

    setTimeout(function() {
      busy = false;
      startN2Round();
    }, 1500);
  } else {
    btn.classList.add('wrong');
    n2RoundErrors++;
    loseLife();
    levelErrors++;
    setChar('worried', 'No es eso. Fíjate mejor en la imagen.');

    // Re-enable options after shake
    setTimeout(function() {
      btn.classList.remove('wrong');
      $('error-tray').querySelectorAll('.n2-option').forEach(function(b) {
        b.style.pointerEvents = '';
      });
      busy = false;
    }, 800);
  }
}

/* buildSchuko_N2 removed — N2 now uses Cloudinary error images */

/* ================================================================
   LEVEL 3 — CHEQUEO RAPIDO (drag to reorder)
   ================================================================ */

var CHECK_STEPS = [
  { id: 1, text: 'Confirmar tierra conectada' },
  { id: 2, text: 'Confirmar fase y neutro en sus bornes' },
  { id: 3, text: 'Visual: cero cobre fuera' },
  { id: 4, text: 'Tirón suave de cada conductor' },
  { id: 5, text: 'Mecanismo alineado y firme' }
];

var n3DragItem = null;
var n3Confirmed = false;

function setupLevel3() {
  n3Confirmed = false;
  setChar('happy', 'Chequeo rápido: ordena los 5 pasos. Primero seguridad, luego estética.');

  updateHUD();

  // Show enchufe image
  $('circuit-area').innerHTML = '<img class="n3-enchufe-img" src="' + ERR_IMG['enchufe-normal'] + '" alt="Enchufe">';

  // Build sortable check steps
  var tray = $('check-tray');
  tray.classList.add('show');
  tray.innerHTML = '';

  var shuffled = shuffle(CHECK_STEPS.slice());
  shuffled.forEach(function(step, i) {
    var row = document.createElement('div');
    row.className = 'check-row';
    row.dataset.stepId = step.id;
    row.innerHTML = '<span class="check-num">' + (i + 1) + '</span><span class="check-text">' + step.text + '</span><span class="check-grip">⠿</span>';
    tray.appendChild(row);
  });

  // Add confirm button
  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn check-confirm';
  confirmBtn.textContent = 'Confirmar orden';
  confirmBtn.addEventListener('click', function() { handleCheckConfirm(); });
  tray.appendChild(confirmBtn);

  // Setup drag-to-reorder
  setupCheckDrag(tray);

  $('verdict-area').classList.remove('show');
}

function renumberCheckRows() {
  var rows = document.querySelectorAll('.check-row');
  rows.forEach(function(r, i) {
    r.querySelector('.check-num').textContent = (i + 1);
  });
}

function setupCheckDrag(tray) {
  var dragRow = null;
  var placeholder = null;
  var offsetY = 0;

  function onStart(e) {
    if (busy || n3Confirmed) return;
    var row = e.target.closest('.check-row');
    if (!row) return;
    e.preventDefault();

    dragRow = row;
    var rect = row.getBoundingClientRect();
    var t = e.touches ? e.touches[0] : e;
    offsetY = t.clientY - rect.top;

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.className = 'check-placeholder';
    placeholder.style.height = rect.height + 'px';
    row.parentNode.insertBefore(placeholder, row);

    // Make row float
    row.classList.add('check-dragging');
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

    // Find which row we're over
    var rows = tray.querySelectorAll('.check-row:not(.check-dragging)');
    var placeholderInserted = false;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var rRect = r.getBoundingClientRect();
      var mid = rRect.top + rRect.height / 2;
      if (t.clientY < mid) {
        tray.insertBefore(placeholder, r);
        placeholderInserted = true;
        break;
      }
    }
    if (!placeholderInserted) {
      // Insert before confirm button
      var confirmBtn = tray.querySelector('.check-confirm');
      if (confirmBtn) {
        tray.insertBefore(placeholder, confirmBtn);
      }
    }
  }

  function onEnd(e) {
    if (!dragRow) return;
    e.preventDefault();

    // Put row back where placeholder is
    dragRow.classList.remove('check-dragging');
    dragRow.style.width = '';
    dragRow.style.top = '';
    dragRow.style.left = '';
    tray.insertBefore(dragRow, placeholder);
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    dragRow = null;
    placeholder = null;

    renumberCheckRows();
  }

  tray.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd, { passive: false });
  tray.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}

function handleCheckConfirm() {
  if (busy || n3Confirmed) return;
  n3Confirmed = true;

  var rows = $('check-tray').querySelectorAll('.check-row');
  var order = [];
  rows.forEach(function(r) { order.push(parseInt(r.dataset.stepId)); });

  // Check if order is correct: 1,2,3,4,5
  var correct = true;
  for (var i = 0; i < order.length; i++) {
    if (order[i] !== i + 1) { correct = false; break; }
  }

  if (correct) {
    rows.forEach(function(r) { r.classList.add('correct'); });
    addScore(30);
    setChar('celebrating', '¡Perfecto! Ese es el orden profesional.');

    setTimeout(function() {
      busy = true;
      showFeedback('celebrating',
        '¡Buen técnico!',
        'Ahora toca inspeccionar enchufes. ¿Pasan o no pasan?',
        'Siguiente nivel',
        function() { busy = false; startLevel(4); }
      );
    }, 800);
  } else {
    rows.forEach(function(r, i) {
      if (parseInt(r.dataset.stepId) === i + 1) {
        r.classList.add('correct');
      } else {
        r.classList.add('wrong');
      }
    });
    loseLife();
    levelErrors++;
    setChar('worried', 'El check empieza por la tierra. Seguridad primero.');

    setTimeout(function() {
      n3Confirmed = false;
      rows.forEach(function(r) {
        r.classList.remove('wrong');
        r.classList.remove('correct');
      });
    }, 1200);
  }
}

/* ================================================================
   LEVEL 4 — INSPECCIÓN RÁPIDA (timed pass/fail on images)
   ================================================================ */

var VERDICT_TIME = 8000; // ms per image
var verdictPool = [];
var verdictRound = 0;
var verdictTimer = null;

function buildVerdictPool() {
  // 5 error images + 1 normal = 6 total
  var pool = N2_ERROR_POOL.map(function(e) {
    return { id: e.id, correct: false, img: ERR_IMG[e.id], flaw: e.label };
  });
  pool.push({ id: 'enchufe-normal', correct: true, img: ERR_IMG['enchufe-normal'], flaw: null });
  return shuffle(pool);
}

function setupLevel4() {
  verdictRound = 0;
  verdictPool = buildVerdictPool();
  setChar('happy', '¡Inspección final! ¿Pasa o no pasa?');
  startVerdictRound();
}

function startVerdictRound() {
  verdictRound++;
  if (verdictRound > verdictPool.length) {
    if (verdictTimer) clearInterval(verdictTimer);
    busy = true;
    setTimeout(showResults, 500);
    return;
  }

  var item = verdictPool[verdictRound - 1];
  updateHUD();
  setChar('happy', 'Enchufe ' + verdictRound + '/' + verdictPool.length + ' — ¿Pasa la inspección?');

  // Show image in circuit area (same size as N2)
  $('circuit-area').innerHTML = '<img class="n2-error-img" src="' + item.img + '" alt="Enchufe">';

  // Show verdict buttons
  var vArea = $('verdict-area');
  vArea.classList.add('show');

  var btnPasa = $('btn-pasa');
  var btnNoPasa = $('btn-no-pasa');
  btnPasa.className = 'verdict-btn verdict-ok';
  btnNoPasa.className = 'verdict-btn verdict-no';

  // Start timer
  $('timer-wrap').classList.add('show');
  var fill = $('timer-fill');
  fill.className = 'timer-fill';
  fill.style.width = '100%';
  var tStart = Date.now();

  if (verdictTimer) clearInterval(verdictTimer);
  verdictTimer = setInterval(function() {
    var elapsed = Date.now() - tStart;
    var pct = Math.max(0, 1 - elapsed / VERDICT_TIME) * 100;
    fill.style.width = pct + '%';
    if (pct < 30) fill.classList.add('warning');
    if (elapsed >= VERDICT_TIME) {
      clearInterval(verdictTimer);
      verdictTimer = null;
      handleVerdictTimeout(item);
    }
  }, 50);

  function onVerdict(playerSaysPasa) {
    if (busy) return;
    busy = true;
    if (verdictTimer) { clearInterval(verdictTimer); verdictTimer = null; }

    btnPasa.onclick = null;
    btnNoPasa.onclick = null;
    btnPasa.classList.add('disabled');
    btnNoPasa.classList.add('disabled');

    var isCorrect = (playerSaysPasa === item.correct);
    if (isCorrect) {
      addScore(25);
      var msg = item.correct ? '¡Bien! Montaje correcto.' : '¡Buen ojo! ' + item.flaw;
      setChar('celebrating', msg);
      (playerSaysPasa ? btnPasa : btnNoPasa).classList.add('correct');
    } else {
      loseLife();
      var errMsg = item.correct ? 'Este enchufe estaba bien montado.' : 'Fallo: ' + item.flaw;
      setChar('worried', errMsg);
      (playerSaysPasa ? btnPasa : btnNoPasa).classList.add('wrong');
    }

    setTimeout(function() {
      vArea.classList.remove('show');
      $('timer-wrap').classList.remove('show');
      busy = false;
      startVerdictRound();
    }, 1500);
  }

  btnPasa.onclick = function() { onVerdict(true); };
  btnNoPasa.onclick = function() { onVerdict(false); };
}

function handleVerdictTimeout(item) {
  busy = true;
  var btnPasa = $('btn-pasa');
  var btnNoPasa = $('btn-no-pasa');
  btnPasa.onclick = null;
  btnNoPasa.onclick = null;
  btnPasa.classList.add('disabled');
  btnNoPasa.classList.add('disabled');

  loseLife();
  setChar('worried', '¡Se acabó el tiempo! Hay que decidir rápido.');

  setTimeout(function() {
    $('verdict-area').classList.remove('show');
    $('timer-wrap').classList.remove('show');
    busy = false;
    startVerdictRound();
  }, 1500);
}

/* ================================================================
   RESULTS
   ================================================================ */

function showResults() {
  if (verdictTimer) clearInterval(verdictTimer);
  busy = false;

  // Check TASK_COMPLETED
  if (score >= TASK_THRESHOLD && !taskSent) {
    taskSent = true;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    } catch(e) {}
  }

  // Update record
  var isNew = score > record;
  if (isNew) {
    record = score;
    localStorage.setItem('schuko_master_record', record);
  }

  // Badge
  var badge, avatar, msg;
  if (score >= 350) {
    badge = '⚡ ELECTRICISTA PRO';
    avatar = 'celebrating';
    msg = '¡Eres un crack del montaje! Enchufes profesionales.';
  } else if (score >= 150) {
    badge = '🔌 BUEN TRABAJO';
    avatar = 'happy';
    msg = '¡Buen trabajo! Vas pillando el montaje schuko.';
  } else {
    badge = '🔧 SIGUE PRACTICANDO';
    avatar = 'worried';
    msg = 'Hay que repasar los bornes. ¡La próxima será mejor!';
  }

  $('res-badge').textContent = badge;
  $('res-score').textContent = score;
  $('res-record').textContent = record;
  $('res-av').src = A[avatar];
  $('res-msg').textContent = msg;

  if (isNew) {
    $('res-new').classList.add('show');
  } else {
    $('res-new').classList.remove('show');
  }

  showScreen('results');
}
