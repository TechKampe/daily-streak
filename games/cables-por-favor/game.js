/* ================================================================
   CABLES, POR FAVOR — Kampe Games — Game Logic
   ================================================================ */

/* ===== HELPERS ===== */
const $ = id => document.getElementById(id);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function showScreen(id) { document.querySelectorAll('.scr').forEach(s => s.classList.add('off')); $(id).classList.remove('off'); }

/* ===== APPRENTICE DATA ===== */
const APRENDICES = {
  jesus: {
    name: 'Jesús', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['Aquí tienes, jefe. Sin prisa.', 'Esta la he hecho con calma.'],
    approved: ['Como debe ser.'],
    rejected: ['Hmm, vale. La reviso. Gracias por el ojo.']
  },
  pedro: {
    name: 'Pedro', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['¡Jefe, mira! He hecho un montón hoy.', 'Venga, ¿qué tal está?'],
    approved: ['¡Vamos! ¡A por la siguiente!'],
    rejected: ['Uff, me he vuelto a precipitar... lo repito, gracias.']
  },
  sthefanny: {
    name: 'Sthefanny', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['He seguido todos los pasos del manual.', 'Mira, creo que esta queda bien.'],
    approved: ['Genial. Justo como tiene que ser.'],
    rejected: ['Vaya, ¿qué se me ha pasado? Dímelo y lo corrijo.']
  },
  arturo: {
    name: 'Arturo', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['Creo que esta me ha quedado bien. ¿Qué opinas?', 'A ver qué te parece, jefe.'],
    approved: ['¡Bien! Sabía que iba por buen camino.'],
    rejected: ['¿Ah sí? Vale, enséñame — así aprendo para la siguiente.']
  },
  joan: {
    name: 'Joan', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['No sé si está bien... ¿tú qué ves?', 'Es mi primera semana, espero que valga.'],
    approved: ['¿Sí? ¡Bien! Gracias, jefe, voy mejorando.'],
    rejected: ['Vale, vale, lo repito. Mejor saberlo ahora que luego.']
  },
  lydia: {
    name: 'Lydia', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['Listo. ¿Siguiente?', 'Otra más. Revísala cuando quieras.'],
    approved: ['Perfecto. A por la siguiente.'],
    rejected: ['Uy, ¿eso se me ha escapado? Vale, lo arreglo rápido. Gracias.']
  },
  yolanda: {
    name: 'Yolanda', img: '../cabledom/assets/alexia_happy.png',
    arrive: ['Esto estaba... sí, creo que bien.', '¡Hola! Toma, dímelo con confianza.'],
    approved: ['¿Ves? Cuando me concentro, sale bien.'],
    rejected: ['Jo, tenía que haber prestado más atención. Lo repito, gracias.']
  }
};

/* ===== RULES ===== */
const RULES = [
  { id: 'R1', name: 'Cero cobre fuera', desc: 'No puede verse cobre expuesto fuera del conector.', infraccion: 'Cobre visible' },
  { id: 'R2', name: 'Longitud correcta', desc: 'El pelado debe ser el justo para el conector — ni largo ni corto.', infraccion: 'Longitud incorrecta' },
  { id: 'R3', name: 'Sin hilos dañados', desc: 'Los hilos deben estar intactos, sin mordeduras ni cortes.', infraccion: 'Hilos dañados' }
];

/* ===== FICHAS POOL ===== */
const FICHAS = {
  1: [
    { aprendiz: 'sthefanny', conector: 'Wago', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] },
    { aprendiz: 'pedro', conector: 'Clema', cobre: true, longitud: 'ok', hilos: 'ok', veredicto: 'RECHAZADO', infracciones: ['Cobre visible'] },
    { aprendiz: 'jesus', conector: 'Borna', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] },
    { aprendiz: 'arturo', conector: 'Wago', cobre: true, longitud: 'ok', hilos: 'ok', veredicto: 'RECHAZADO', infracciones: ['Cobre visible'] },
    { aprendiz: 'lydia', conector: 'Clema', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] }
  ],
  2: [
    { aprendiz: 'yolanda', conector: 'Borna', cobre: false, longitud: 'corto', hilos: 'ok', veredicto: 'RECHAZADO', infracciones: ['Longitud incorrecta'] },
    { aprendiz: 'sthefanny', conector: 'Wago', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] },
    { aprendiz: 'pedro', conector: 'Clema', cobre: true, longitud: 'largo', hilos: 'ok', veredicto: 'RECHAZADO', infracciones: ['Cobre visible', 'Longitud incorrecta'] },
    { aprendiz: 'joan', conector: 'Borna', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] },
    { aprendiz: 'arturo', conector: 'Wago', cobre: false, longitud: 'largo', hilos: 'ok', veredicto: 'RECHAZADO', infracciones: ['Longitud incorrecta'] }
  ],
  3: [
    { aprendiz: 'arturo', conector: 'Clema', cobre: false, longitud: 'ok', hilos: 'danados', veredicto: 'RECHAZADO', infracciones: ['Hilos dañados'] },
    { aprendiz: 'lydia', conector: 'Wago', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] },
    { aprendiz: 'pedro', conector: 'Borna', cobre: true, longitud: 'corto', hilos: 'danados', veredicto: 'RECHAZADO', infracciones: ['Cobre visible', 'Longitud incorrecta', 'Hilos dañados'] },
    { aprendiz: 'joan', conector: 'Clema', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] },
    { aprendiz: 'yolanda', conector: 'Wago', cobre: true, longitud: 'ok', hilos: 'danados', veredicto: 'RECHAZADO', infracciones: ['Cobre visible', 'Hilos dañados'] },
    { aprendiz: 'jesus', conector: 'Borna', cobre: false, longitud: 'ok', hilos: 'ok', veredicto: 'APROBADO', infracciones: [] }
  ]
};

/* ===== INCIDENTES ===== */
const INCIDENTES = {
  'Cobre visible': {
    icon: '🔥', title: 'Incendio en el 3B',
    text: 'Cortocircuito por cobre expuesto. Los bomberos han tenido que venir.',
    edu: 'Si se ve cobre fuera del conector, no puede pasar. El cobre expuesto causa cortocircuitos.',
    cardClass: 'fire'
  },
  'Longitud incorrecta_corto': {
    icon: '💡', title: 'Avería en el 5C',
    text: 'El cable no hacía buen contacto. Enchufe muerto.',
    edu: 'Con el pelado demasiado corto, el cable apenas entra en el conector y la conexión falla.',
    cardClass: 'dark'
  },
  'Longitud incorrecta_largo': {
    icon: '⚡', title: 'Falso contacto en el 2A',
    text: 'La conexión se aflojó porque sobraba cable pelado. Sin luz toda la noche.',
    edu: 'Si el pelado es demasiado largo, sobra cobre fuera y la conexión no es fiable.',
    cardClass: 'shock'
  },
  'Hilos dañados': {
    icon: '💥', title: 'Chispas en el 1D',
    text: 'Los hilos mordidos causaron un arco eléctrico. Vecinos asustados.',
    edu: 'Los hilos dañados reducen la sección efectiva y pueden causar arcos eléctricos.',
    cardClass: 'spark'
  }
};

/* ===== BRIEFINGS ===== */
const BRIEFINGS = {
  2: {
    text: '"A partir de hoy, también se revisa la LONGITUD DEL PELADO."',
    rule: 'El pelado debe ser el justo para el conector. Ni largo ni corto.'
  },
  3: {
    text: '"Último día de instalación. Ahora también reviso los HILOS."',
    rule: 'Si los hilos están mordidos, cortados o dañados, no pasa. Quiero terminaciones de profesional.'
  }
};

/* ===== RESULT MESSAGES ===== */
const RES_MSG = {
  0: 'Inspector de primera. Ni un solo fallo. El edificio está seguro.',
  1: 'Buen trabajo. Un susto, pero la obra sale adelante.',
  2: 'Por los pelos. Dos incidentes es demasiado. Repasa las normas.',
  3: 'El jefe te ha retirado. Tres incidentes en un edificio nuevo es inaceptable.'
};

/* ===== GAME STATE ===== */
let turno = 1;
let fichaIdx = 0;
let fichas = [];
let incidents = 0;
let score = 0;
let turnoErrors = 0;
let taskSent = false;
let record = parseInt(localStorage.getItem('cables_por_favor_record')) || 0;
let incidentLog = [];
let blocked = false;

/* ===== INTRO ===== */
let introPage = 0;

function setupIntro() {
  const pages = document.querySelectorAll('.intro-page');
  const inner = document.querySelector('.intro-inner');

  // Tap to advance (except last page with button)
  inner.addEventListener('click', (e) => {
    if (e.target.closest('.skip-btn') || e.target.closest('#intro-start-btn')) return;
    if (introPage < pages.length - 1) {
      pages[introPage].classList.remove('active');
      introPage++;
      pages[introPage].classList.add('active');
    }
  });

  $('skip-intro-btn').onclick = () => startGame();
  $('intro-start-btn').onclick = () => startGame();
}

/* ===== GAME START ===== */
function startGame() {
  turno = 1;
  fichaIdx = 0;
  incidents = 0;
  score = 0;
  turnoErrors = 0;
  taskSent = false;
  incidentLog = [];
  blocked = false;

  // Reset intro for replay
  introPage = 0;

  // Deactivate all intro pages so they don't capture clicks over the play screen
  document.querySelectorAll('.intro-page').forEach(p => p.classList.remove('active'));

  // Reset tracker
  document.querySelectorAll('.tracker-b').forEach(b => b.classList.remove('burned'));

  prepareTurno();
  showScreen('play');
  showFicha();
}

/* ===== TURNO MANAGEMENT ===== */
function prepareTurno() {
  // Shuffle but avoid consecutive same aprendiz
  let attempts = 0;
  do {
    fichas = shuffle([...FICHAS[turno]]);
    attempts++;
  } while (attempts < 20 && hasConsecutiveAprendiz(fichas));
  fichaIdx = 0;
  turnoErrors = 0;
}

function hasConsecutiveAprendiz(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].aprendiz === arr[i - 1].aprendiz) return true;
  }
  return false;
}

function activeRulesCount() { return turno; }

function getActiveRules() { return RULES.slice(0, activeRulesCount()); }

/* ===== FICHA RENDERING ===== */
function showFicha() {
  if (fichaIdx >= fichas.length) {
    endTurno();
    return;
  }

  const ficha = fichas[fichaIdx];
  const ap = APRENDICES[ficha.aprendiz];

  // Update HUD
  $('hud-turno').textContent = 'Día ' + turno;
  $('hud-progress').textContent = (fichaIdx + 1) + '/' + fichas.length;

  // Show aprendiz
  $('aprendiz-img').src = ap.img;
  $('aprendiz-img').onerror = function() { this.style.display = 'none'; };
  $('aprendiz-img').onload = function() { this.style.display = ''; };
  const msg = ap.arrive[Math.floor(Math.random() * ap.arrive.length)];
  const bubble = $('aprendiz-bubble');
  bubble.textContent = msg;
  bubble.classList.remove('show');
  setTimeout(() => bubble.classList.add('show'), 100);

  // Render terminacion
  renderTerminacion(ficha);

  // Show action buttons
  $('action-zone').style.display = 'flex';
  blocked = false;
}

/* ===== TERMINACION ASSET MAP ===== */
// Maps ficha properties to flat image filenames
function getTerminacionAsset(ficha) {
  const c = ficha.conector.toLowerCase(); // wago, clema, borna
  const defects = [];
  if (ficha.cobre) defects.push('cobre');
  if (ficha.longitud === 'largo') defects.push('largo');
  if (ficha.longitud === 'corto') defects.push('corto');
  if (ficha.hilos === 'danados') defects.push('danados');
  if (defects.length === 0) return 'assets/' + c + '_ok.jpg';
  return 'assets/' + c + '_' + defects.join('_') + '.jpg';
}

function renderTerminacion(ficha) {
  const layers = $('terminacion-layers');
  layers.innerHTML = '';

  const img = document.createElement('img');
  img.src = getTerminacionAsset(ficha);
  img.alt = ficha.conector;
  layers.appendChild(img);

  $('terminacion-label').textContent = 'Conector: ' + ficha.conector;
}

/* ===== PLAYER ACTIONS ===== */
function onApprove() {
  if (blocked) return;
  blocked = true;
  $('action-zone').style.display = 'none';

  const ficha = fichas[fichaIdx];

  if (ficha.veredicto === 'APROBADO') {
    // Correct! Good termination approved
    showStamp('approve');
    score += 15;
    const ap = APRENDICES[ficha.aprendiz];
    setTimeout(() => {
      $('aprendiz-bubble').textContent = ap.approved[Math.floor(Math.random() * ap.approved.length)];
      setTimeout(() => nextFicha(), 1000);
    }, 600);
  } else {
    // ERROR: approved a bad termination → INCIDENTE
    showStamp('approve');
    setTimeout(() => showIncidente(ficha), 700);
  }
}

function onReject() {
  if (blocked) return;
  blocked = true;
  $('action-zone').style.display = 'none';

  const ficha = fichas[fichaIdx];

  if (ficha.veredicto === 'APROBADO') {
    // ERROR: rejected a good termination → QUEJA
    showStamp('reject');
    setTimeout(() => showQueja(ficha), 700);
  } else {
    // Correct decision to reject — now ask for infractions
    showStamp('reject');
    setTimeout(() => showInfraccionesPanel(), 700);
  }
}

/* ===== STAMP ===== */
function showStamp(type) {
  const el = type === 'approve' ? $('stamp-approve') : $('stamp-reject');
  el.classList.remove('show');
  void el.offsetWidth; // force reflow
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 600);
}

/* ===== INFRACCIONES PANEL ===== */
function showInfraccionesPanel() {
  const list = $('infracciones-list');
  list.innerHTML = '';

  const activeRules = getActiveRules();
  activeRules.forEach(rule => {
    const opt = document.createElement('div');
    opt.className = 'infraccion-option';
    opt.dataset.infraccion = rule.infraccion;
    opt.innerHTML = '<div class="infraccion-check"></div><div class="infraccion-label">' + rule.infraccion + '</div>';
    opt.onclick = () => opt.classList.toggle('selected');
    list.appendChild(opt);
  });

  $('infracciones-overlay').classList.add('show');
}

function onConfirmInfracciones() {
  const selected = [];
  document.querySelectorAll('.infraccion-option.selected').forEach(el => {
    selected.push(el.dataset.infraccion);
  });

  if (selected.length === 0) return; // Must select at least one

  $('infracciones-overlay').classList.remove('show');

  const ficha = fichas[fichaIdx];
  const correct = ficha.infracciones;

  // Check if selected matches exactly
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  const allCorrect = selected.length === correct.length && selected.every(s => correctSet.has(s));
  const partialCorrect = selected.some(s => correctSet.has(s));

  if (allCorrect) {
    // Perfect rejection
    score += 25;
    const ap = APRENDICES[ficha.aprendiz];
    $('aprendiz-bubble').textContent = ap.rejected[Math.floor(Math.random() * ap.rejected.length)];
    setTimeout(() => nextFicha(), 1200);
  } else if (partialCorrect && selected.every(s => correctSet.has(s))) {
    // Partial: got some right, missed some — still OK but lower score
    score += 10;
    const missed = correct.filter(c => !selectedSet.has(c));
    const ap = APRENDICES[ficha.aprendiz];
    $('aprendiz-bubble').textContent = ap.rejected[0];

    $('wrong-infractions-text').innerHTML =
      'Has identificado parte de los fallos, pero te has dejado:<br><br><strong>' +
      missed.join(', ') + '</strong><br><br>Revisa con más cuidado la próxima vez.';
    $('wrong-infractions-overlay').classList.add('show');
  } else {
    // Wrong infractions cited → incident
    const wrongOnes = selected.filter(s => !correctSet.has(s));
    const missedOnes = correct.filter(c => !selectedSet.has(c));
    let msg = '';
    if (wrongOnes.length > 0) msg += 'Has marcado <strong>' + wrongOnes.join(', ') + '</strong> pero eso no era un problema.<br><br>';
    if (missedOnes.length > 0) msg += 'Te faltó identificar: <strong>' + missedOnes.join(', ') + '</strong>';

    addIncident();
    $('wrong-infractions-text').innerHTML = msg;
    $('wrong-infractions-overlay').classList.add('show');
  }
}

/* ===== INCIDENTE (approved a bad one) ===== */
function showIncidente(ficha) {
  // Pick the most severe defect for the incidente
  let incKey;
  if (ficha.cobre) incKey = 'Cobre visible';
  else if (ficha.hilos === 'danados') incKey = 'Hilos dañados';
  else if (ficha.longitud === 'largo') incKey = 'Longitud incorrecta_largo';
  else if (ficha.longitud === 'corto') incKey = 'Longitud incorrecta_corto';
  else incKey = 'Cobre visible'; // fallback

  const inc = INCIDENTES[incKey];
  $('incidente-icon').textContent = inc.icon;
  $('incidente-title').textContent = inc.title;
  $('incidente-text').textContent = inc.text;
  $('incidente-edu').textContent = inc.edu;
  $('incidente-card').className = 'incidente-card ' + inc.cardClass;

  incidentLog.push(inc.title);
  addIncident();

  $('incidente-overlay').classList.add('show');
}

function addIncident() {
  incidents++;
  turnoErrors++;

  // Update tracker
  const trackers = document.querySelectorAll('.tracker-b');
  if (incidents <= 3 && trackers[incidents - 1]) {
    trackers[incidents - 1].classList.add('burned');
  }

  if (incidents >= 3) {
    // Game over after closing current overlay
    return;
  }
}

/* ===== QUEJA (rejected a good one) ===== */
function showQueja(ficha) {
  const ap = APRENDICES[ficha.aprendiz];
  $('queja-title').textContent = 'Queja del equipo';
  $('queja-text').innerHTML = '<strong>' + ap.name + '</strong>: "¡Pero si estaba bien hecha!"<br><br>Has rechazado trabajo correcto. El jefe de obra toma nota.';

  incidentLog.push('Queja: rechazaste el trabajo de ' + ap.name);
  addIncident();

  $('queja-overlay').classList.add('show');
}

/* ===== NEXT FICHA ===== */
function nextFicha() {
  if (incidents >= 3) {
    showGameOver();
    return;
  }
  fichaIdx++;
  showFicha();
}

/* ===== END TURNO ===== */
function endTurno() {
  // Turno bonus
  if (turnoErrors === 0) {
    score += 20;
  }

  if (turno >= 3) {
    // Game completed!
    if (!taskSent) {
      taskSent = true;
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch (e) {}
    }
    showResults();
    return;
  }

  // Show briefing for next turno
  turno++;
  showBriefing();
}

/* ===== BRIEFING ===== */
function showBriefing() {
  const b = BRIEFINGS[turno];
  $('briefing-text').textContent = b.text;
  $('briefing-rule').textContent = b.rule;
  $('briefing-overlay').classList.add('show');
}

function onBriefingContinue() {
  $('briefing-overlay').classList.remove('show');
  prepareTurno();
  showFicha();
}

/* ===== GAME OVER ===== */
function showGameOver() {
  // Close any open overlays first
  document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));
  setTimeout(() => {
    $('gameover-overlay').classList.add('show');
  }, 300);
}

/* ===== REGLAMENTO ===== */
function showReglamento() {
  const container = $('reglamento-rules');
  container.innerHTML = '';

  RULES.forEach((rule, i) => {
    const item = document.createElement('div');
    const isActive = i < activeRulesCount();
    item.className = 'rule-item' + (isActive ? '' : ' locked');
    item.innerHTML =
      '<div class="rule-num">' + (isActive ? '✓ ' : '🔒 ') + rule.id + '</div>' +
      '<div class="rule-name">' + (isActive ? rule.name : '???') + '</div>' +
      '<div class="rule-desc">' + (isActive ? rule.desc : 'Se desbloquea en el siguiente turno.') + '</div>';
    container.appendChild(item);
  });

  $('reglamento-overlay').classList.add('show');
}

/* ===== RESULTS ===== */
function showResults() {
  // Close overlays
  document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));

  const isNew = score > record;
  if (isNew) { record = score; localStorage.setItem('cables_por_favor_record', record); }

  $('res-score').textContent = score;
  $('res-record').textContent = record;
  $('res-new').classList.toggle('show', isNew);

  const gameOver = incidents >= 3;
  if (gameOver) {
    $('res-badge').textContent = 'RETIRADO';
    $('res-badge').style.color = 'var(--fire)';
  } else if (incidents === 0) {
    $('res-badge').textContent = 'INSPECTOR DE PRIMERA';
    $('res-badge').style.color = 'var(--lime)';
  } else {
    $('res-badge').textContent = 'INSPECCIÓN COMPLETADA';
    $('res-badge').style.color = 'var(--turq)';
  }

  $('res-msg').textContent = RES_MSG[Math.min(incidents, 3)];
  $('res-stats').textContent = score + ' puntos · ' + incidents + ' incidente' + (incidents !== 1 ? 's' : '');

  if (incidentLog.length > 0) {
    $('res-incidents').innerHTML = incidentLog.map(i => '• ' + i).join('<br>');
  } else {
    $('res-incidents').textContent = '¡Sin incidentes!';
  }

  showScreen('results');
}

/* ===== EVENT SETUP ===== */
function setupEvents() {
  $('btn-approve').onclick = onApprove;
  $('btn-reject').onclick = onReject;
  $('infracciones-confirm').onclick = onConfirmInfracciones;
  $('incidente-continue').onclick = () => {
    $('incidente-overlay').classList.remove('show');
    if (incidents >= 3) { showGameOver(); return; }
    nextFicha();
  };
  $('queja-continue').onclick = () => {
    $('queja-overlay').classList.remove('show');
    if (incidents >= 3) { showGameOver(); return; }
    nextFicha();
  };
  $('wrong-infractions-continue').onclick = () => {
    $('wrong-infractions-overlay').classList.remove('show');
    if (incidents >= 3) { showGameOver(); return; }
    nextFicha();
  };
  $('briefing-continue').onclick = onBriefingContinue;
  $('gameover-continue').onclick = () => {
    $('gameover-overlay').classList.remove('show');
    showResults();
  };
  $('hud-reglamento').onclick = showReglamento;
  $('reglamento-close').onclick = () => $('reglamento-overlay').classList.remove('show');
  $('res-btn').onclick = () => {
    // Reset intro page
    introPage = 0;
    document.querySelectorAll('.intro-page').forEach((p, i) => p.classList.toggle('active', i === 0));
    showScreen('intro');
  };
}

/* ===== INIT ===== */
function init() {
  setupIntro();
  setupEvents();
  showScreen('intro');

}

init();
