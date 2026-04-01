/* ==============================
   El Encargado Elige — game.js
   ============================== */

// --- Assets ---
const ASSETS = {
  paco_happy: 'https://res.cloudinary.com/kampe/image/upload/v1774963764/paco_happy_u2qi7b.png',
  paco_celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1774963764/paco_celebrating_wx8sqs.png',
  paco_worried: 'https://res.cloudinary.com/kampe/image/upload/v1774963764/paco_worried_kicpyw.png',
};

// --- Helpers ---
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    const ms = { light: 10, medium: 20, heavy: 40, success: 30, error: 50 };
    navigator.vibrate(ms[level] || 20);
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

const $ = sel => document.querySelector(sel);

// --- Pool: questions with multiple answers (2 buenas + 1 mala each) ---
const QUESTIONS = [
  {
    q: 'Cuéntame algo de ti.',
    answers: [
      { a: 'Estuve 3 meses en una empresa de fontanería haciendo instalaciones en viviendas. Aprendí a leer planos básicos y a montar en seco. Quiero seguir formándome en electricidad.', correct: 'call', critical: false, fb: 'Da datos concretos: tiempo, empresa, lo que aprendió y lo que quiere. Eso es una respuesta que se recuerda.' },
      { a: 'Hice el curso de electricidad en Kämpe. Aprendí a montar cuadros, a cablear y a trabajar en equipo. Ahora quiero aplicarlo en una empresa real.', correct: 'call', critical: false, fb: 'Formación concreta, habilidades específicas y objetivo claro. Así se presenta alguien que sabe lo que quiere.' },
      { a: 'Pues nada, que soy buen trabajador, me gusta el tema de la electricidad y eso.', correct: 'pass', critical: false, fb: 'No dice nada concreto. «Buen trabajador» lo dice todo el mundo. Un encargado necesita hechos, no adjetivos.' },
    ]
  },
  {
    q: 'Veo que hiciste una práctica de montaje. ¿Cómo fue?',
    answers: [
      { a: 'Tenía que montar un cuadro eléctrico con IGA, ID y PIAs. Lo hice siguiendo el esquema paso a paso. El profesor lo revisó y no tuvo que corregir nada.', correct: 'call', critical: false, fb: 'Situación, tarea, acción, resultado. Eso es una respuesta STAR perfecta. Y el resultado es verificable.' },
      { a: 'Me tocó cablear un cuadro para una vivienda. Tardé más que otros, pero el etiquetado y las conexiones estaban perfectas. El profesor lo puso de ejemplo.', correct: 'call', critical: false, fb: 'Honesto con el tiempo, pero destaca calidad. Y tiene un resultado concreto: el profesor lo validó.' },
      { a: 'Sí, bueno, fue bien, hicimos cosas de cuadros y eso. Normal.', correct: 'pass', critical: false, fb: '«Hicimos cosas» no dice nada. Sin detalles, el encargado no sabe si participaste o estabas mirando.' },
    ]
  },
  {
    q: '¿Qué harías si te dan una instrucción que no entiendes?',
    answers: [
      { a: 'Le pediría al encargado que me lo explique otra vez. Prefiero preguntar antes que hacerlo mal y tener que repetir.', correct: 'call', critical: false, fb: 'Honestidad + sentido común. Preguntar ahorra tiempo y errores. Eso es lo que queremos oír.' },
      { a: 'Primero intento entenderlo con lo que sé. Si sigo sin verlo claro, le pido al encargado que me lo muestre una vez y tomo nota.', correct: 'call', critical: false, fb: 'Muestra iniciativa Y sabe cuándo pedir ayuda. Además, tomar nota demuestra que no quiere preguntar lo mismo dos veces.' },
      { a: 'Yo me busco la vida. Si no me sale, ya pregunto.', correct: 'pass', critical: true, fb: 'Buscarse la vida sin preguntar puede ser peligroso. En una obra, improvisar sale caro.' },
    ]
  },
  {
    q: '¿Por qué debería contratarte a ti?',
    answers: [
      { a: 'Llego puntual, no me quejo, y si me enseñas algo lo hago igual al día siguiente. Lo que busco es aprender.', correct: 'call', critical: false, fb: 'Puntualidad, actitud y ganas de aprender. Tres cosas que un encargado valora más que experiencia.' },
      { a: 'No tengo mucha experiencia, pero soy ordenado, cuido el material y no me da miedo preguntar. Quiero ser útil desde el primer día.', correct: 'call', critical: false, fb: 'Reconoce su nivel pero ofrece actitud. «Ser útil desde el primer día» es exactamente lo que un encargado quiere oír.' },
      { a: 'Porque soy el mejor. Aprendo más rápido que cualquiera.', correct: 'pass', critical: true, fb: 'Decir que eres el mejor sin demostrarlo es una señal de alarma. El encargado quiere hechos, no ego.' },
    ]
  },
  {
    q: '¿Tienes experiencia trabajando en empresa?',
    answers: [
      { a: 'No, pero en las prácticas monté 6 cuadros eléctricos y el profesor dijo que mi cableado era limpio. Tengo ganas de empezar en una empresa real.', correct: 'call', critical: false, fb: 'No tiene experiencia pero da evidencias concretas de lo que sabe hacer. Eso compensa.' },
      { a: 'Aún no, pero en el curso hicimos simulaciones de obra real: preparar material, organizar por zonas y seguir checklist. Estoy preparado para dar el salto.', correct: 'call', critical: false, fb: 'Traduce la formación a lenguaje de obra. El encargado ve que entiende cómo funciona el trabajo real.' },
      { a: 'No. Es que nunca me han dado la oportunidad...', correct: 'pass', critical: false, fb: 'Victimismo. Un encargado busca actitud, no excusas. Mejor decir qué has hecho aunque no sea en empresa.' },
    ]
  },
  {
    q: '¿Alguna pregunta para mí?',
    answers: [
      { a: 'Sí. ¿Qué herramientas vais a necesitar que traiga yo? ¿Y cómo es un día normal en la obra?', correct: 'call', critical: false, fb: 'Preguntar demuestra interés real. Y preguntar por herramientas y rutina demuestra que ya piensa como alguien del equipo.' },
      { a: '¿Qué es lo que más valoras en un junior? Así sé en qué centrarme desde el principio.', correct: 'call', critical: false, fb: 'Pregunta inteligente. Demuestra que quiere adaptarse al encargado, no que el encargado se adapte a él.' },
      { a: 'No, la verdad. Ya me lo iréis diciendo.', correct: 'pass', critical: false, fb: 'No preguntar transmite desinterés. El encargado quiere ver curiosidad, no pasividad.' },
    ]
  },
  {
    q: '¿Qué sabes hacer?',
    answers: [
      { a: 'Sé preparar material, etiquetar cables, montar mecanismos en seco y seguir un checklist de revisión. Lo básico de un junior.', correct: 'call', critical: false, fb: 'Sabe exactamente qué puede hacer y qué no. Eso es conocer tu rol.' },
      { a: 'Sé usar el multímetro con supervisión, tirar canaleta siguiendo instrucciones y dejar la zona de trabajo recogida. Poco a poco voy aprendiendo más.', correct: 'call', critical: false, fb: 'Concreto y realista. «Con supervisión» demuestra que conoce sus límites. Eso da confianza.' },
      { a: 'Yo sé hacer de todo. Cuadros, instalaciones, averías... lo que me pongas.', correct: 'pass', critical: true, fb: 'Nadie que empieza sabe hacer de todo. Esto huele a mentira y un encargado lo nota al minuto.' },
    ]
  },
  {
    q: 'Cuéntame un error que hayas cometido.',
    answers: [
      { a: 'Una vez conecté un cable sin comprobar el esquema y tuve que desmontar todo. Desde entonces, siempre reviso el plano primero.', correct: 'call', critical: false, fb: 'Reconoce el error y explica qué cambió después. Eso demuestra que aprende de verdad.' },
      { a: 'En una práctica me confundí de sección de cable. El profesor me lo pilló y me explicó cómo calcularlo. Ahora lo compruebo siempre antes de cortar.', correct: 'call', critical: false, fb: 'Error concreto, alguien se lo corrigió, y cambió su método. Estructura STAR natural.' },
      { a: 'Pues la verdad, nunca me ha pasado nada grave.', correct: 'pass', critical: false, fb: 'Todos cometen errores. Decir que no demuestra poca autocrítica o poca experiencia real.' },
    ]
  },
  {
    q: 'Si el encargado te dice que algo está mal, ¿cómo reaccionas?',
    answers: [
      { a: 'Le pregunto qué he hecho mal para no repetirlo. Si no entiendo, pido que me lo enseñe.', correct: 'call', critical: false, fb: 'Querer entender el error es señal de profesionalidad. Así se aprende de verdad.' },
      { a: 'Paro lo que estoy haciendo, escucho, y si puedo lo corrijo yo mismo. Si no sé cómo, pido que me guíe.', correct: 'call', critical: false, fb: 'Parar, escuchar y actuar. Eso es exactamente la actitud que un encargado espera de un junior.' },
      { a: 'Le doy la razón y hago lo que me diga, aunque no lo entienda.', correct: 'pass', critical: false, fb: 'Dar la razón sin entender no es actitud profesional. Lo correcto es preguntar POR QUÉ está mal para no repetirlo.' },
    ]
  },
];

const MSGS = {
  aciertoRot: ['¡Bien visto!', '¡Eso es!', '¡Justo lo que yo habría hecho!'],
  errorRot: ['¡No! Fíjate bien.', '¡Esa no era!'],
  errorCritico: ['¡Cuidado! Eso un encargado no lo pasa.', '¡Para! Eso es señal de alarma.'],
  resultAlto: 'Tienes buen ojo. Si yo fuera el que busca curro, te querría en mi equipo.',
  resultMedio: 'Vas bien. Pero repasa los errores — en una entrevista real, esos detalles importan.',
  resultBajo: 'Necesitas repasar. Un encargado nota enseguida quién sabe de qué habla y quién no.',
};

const MAX_LIVES = 3;

// --- State ---
const S = {
  deck: [],       // flat array of { q, a, correct, critical, fb }
  current: 0,
  totalCards: 0,
  hits: 0,
  lives: MAX_LIVES,
  criticalErrors: [],
  record: parseInt(localStorage.getItem('el_encargado_elige_record') || '0', 10),
  hintShown: false,
  dragging: false,
  startX: 0,
  dx: 0,
  answered: false,
  aciertoIdx: 0,
  errorIdx: 0,
  errorCritIdx: 0,
  lastUsedAnswers: [], // answer texts used in previous round
};

// --- Deck builder ---
// Picks 6 questions, selects 2 of 3 answers per question (1 good + 1 bad, or 2 good if bad was last round)
// Avoids repeating the same answer combo from last round
function buildDeck() {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 6);

  const deck = [];
  const usedThisRound = [];

  picked.forEach(question => {
    const good = question.answers.filter(a => a.correct === 'call');
    const bad = question.answers.filter(a => a.correct === 'pass');

    // Prefer answers not used last round
    const preferNew = arr => {
      const fresh = arr.filter(a => !S.lastUsedAnswers.includes(a.a));
      return fresh.length > 0 ? fresh : arr;
    };

    const goodPool = preferNew(good);
    const badPool = preferNew(bad);

    // Pick 1 good + 1 bad
    const pickedGood = goodPool[Math.floor(Math.random() * goodPool.length)];
    const pickedBad = badPool[Math.floor(Math.random() * badPool.length)];

    // Shuffle order within the question
    const pair = [pickedGood, pickedBad].sort(() => Math.random() - 0.5);
    pair.forEach(ans => {
      deck.push({ q: question.q, ...ans });
      usedThisRound.push(ans.a);
    });
  });

  S.lastUsedAnswers = usedThisRound;
  return deck;
}

// --- DOM refs ---
const els = {};
function initRefs() {
  els.introAvatar = $('#intro-avatar');
  els.card = $('#card');
  els.cardA = $('.card-answer');
  els.hintL = $('#hint-left');
  els.hintR = $('#hint-right');
  els.fixedQ = $('#fixed-question');
  els.fb = $('#feedback');
  els.fbAvatar = $('#fb-avatar');
  els.fbTitle = $('.fb-title');
  els.fbText = $('.fb-text');
  els.hudCounter = $('#hud-counter');
  els.hudLives = $('#hud-lives');
  els.btnPass = $('#btn-pass');
  els.btnCall = $('#btn-call');
  els.btnNext = $('#btn-next');
  els.swipeHint = $('#swipe-hint');
  els.resScore = $('#res-score');
  els.resRecord = $('#res-record');
  els.resAvatar = $('#res-avatar');
  els.resMessage = $('#res-message');
  els.btnErrors = $('#btn-errors');
  els.btnRetry = $('#btn-retry');
  els.modal = $('#modal-errors');
  els.modalList = $('#modal-errors-list');
  els.btnCloseModal = $('#btn-close-modal');
}

// --- Lives display ---
function renderLives() {
  let html = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    html += i < S.lives ? '❤️' : '<span class="life-lost">❤️</span>';
  }
  els.hudLives.innerHTML = html;
}

// --- Show card ---
function showCard() {
  const c = S.deck[S.current];
  els.fixedQ.textContent = '«' + c.q + '»';
  els.cardA.textContent = '«' + c.a + '»';
  els.hudCounter.textContent = (S.current + 1) + '/' + S.totalCards;

  // Reset card state
  els.card.classList.remove('hidden', 'animating');
  els.card.classList.add('entering');
  els.card.style.transform = '';
  els.card.style.opacity = '';
  els.hintL.style.opacity = 0;
  els.hintR.style.opacity = 0;

  els.fb.classList.add('hidden');
  els.btnPass.classList.remove('hidden');
  els.btnCall.classList.remove('hidden');
  els.btnNext.classList.add('hidden');

  S.answered = false;
  S.dx = 0;

  setTimeout(() => els.card.classList.remove('entering'), 260);
}

// --- Handle answer ---
function handleAnswer(choice) {
  if (S.answered) return;
  S.answered = true;

  const c = S.deck[S.current];
  const isCorrect = choice === c.correct;

  if (isCorrect) {
    S.hits++;
    vibrate('success');
  } else {
    S.lives--;
    renderLives();
    vibrate('error');
    if (c.critical) {
      S.criticalErrors.push(c);
    }
  }

  // Animate card out
  const dir = choice === 'call' ? 1 : -1;
  els.card.classList.add('animating');
  els.card.style.transform = `translate3d(${dir * 400}px, 0, 0) rotate(${dir * 12}deg)`;
  els.card.style.opacity = '0';

  setTimeout(() => showFeedback(c, isCorrect), 280);
}

// --- Show feedback ---
function showFeedback(card, isCorrect) {
  els.card.classList.add('hidden');

  if (isCorrect) {
    els.fbAvatar.src = ASSETS.paco_celebrating;
    els.fbTitle.textContent = MSGS.aciertoRot[S.aciertoIdx % MSGS.aciertoRot.length];
    els.fbTitle.style.color = 'var(--turquesa)';
    S.aciertoIdx++;
    els.fb.className = 'card feedback correct entering';
  } else {
    els.fbAvatar.src = ASSETS.paco_worried;
    if (card.critical) {
      els.fbTitle.textContent = MSGS.errorCritico[S.errorCritIdx % MSGS.errorCritico.length];
      S.errorCritIdx++;
      els.fb.className = 'card feedback critical entering';
    } else {
      els.fbTitle.textContent = MSGS.errorRot[S.errorIdx % MSGS.errorRot.length];
      S.errorIdx++;
      els.fb.className = 'card feedback incorrect entering';
    }
    els.fbTitle.style.color = 'var(--rojo)';
  }

  els.fbText.textContent = card.fb;

  els.btnPass.classList.add('hidden');
  els.btnCall.classList.add('hidden');
  els.btnNext.classList.remove('hidden');

  setTimeout(() => els.fb.classList.remove('entering'), 260);
}

// --- Next card or results ---
function nextCard() {
  // Game over by lives
  if (S.lives <= 0) {
    showResults();
    return;
  }

  S.current++;
  if (S.current >= S.deck.length) {
    showResults();
  } else {
    showCard();
  }
}

// --- Results ---
function showResults() {
  const total = S.totalCards;
  // Update record
  if (S.hits > S.record) {
    S.record = S.hits;
    localStorage.setItem('el_encargado_elige_record', S.record);
  }

  // TASK_COMPLETED: passed enough answers
  if (S.hits >= 8 && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }

  els.resScore.textContent = S.hits + ' de ' + total;
  els.resRecord.textContent = 'Record: ' + S.record + ' de ' + total;

  let avatar, message;
  if (S.lives > 0 && S.hits >= 10) {
    avatar = 'paco_celebrating';
    message = MSGS.resultAlto;
  } else if (S.hits >= 8) {
    avatar = 'paco_happy';
    message = MSGS.resultMedio;
  } else {
    avatar = 'paco_worried';
    message = MSGS.resultBajo;
  }

  els.resAvatar.src = ASSETS[avatar];
  els.resMessage.textContent = message;

  // Critical errors button
  if (S.criticalErrors.length > 0) {
    els.btnErrors.classList.remove('hidden');
    els.btnErrors.textContent = 'Ver ' + S.criticalErrors.length + ' error' + (S.criticalErrors.length > 1 ? 'es' : '') + ' crítico' + (S.criticalErrors.length > 1 ? 's' : '');
  } else {
    els.btnErrors.classList.add('hidden');
  }

  // Haptic
  if (S.lives > 0 && S.hits >= 10) {
    vibrate('success', [0, 100, 50, 100, 50, 200]);
  } else {
    vibrate('light');
  }

  showScreen('results');
}

// --- Modal ---
function showErrorsModal() {
  els.modalList.innerHTML = '';
  S.criticalErrors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'modal-error-item';
    div.innerHTML =
      '<p class="modal-error-q">' + c.q + '</p>' +
      '<p class="modal-error-a">«' + c.a + '»</p>' +
      '<p class="modal-error-fb">' + c.fb + '</p>';
    els.modalList.appendChild(div);
  });
  els.modal.classList.remove('hidden');
}

// --- Restart ---
function restart() {
  S.deck = buildDeck();
  S.totalCards = S.deck.length;
  S.current = 0;
  S.hits = 0;
  S.lives = MAX_LIVES;
  S.criticalErrors = [];
  S.aciertoIdx = 0;
  S.errorIdx = 0;
  S.errorCritIdx = 0;
  S.hintShown = false;
  renderLives();
  $('#swipe-hint').classList.remove('hidden');
  showScreen('play');
  showCard();
}

// --- Touch handling for swipe ---
function initTouch() {
  const zone = $('#card-zone');

  zone.addEventListener('touchstart', onTouchStart, { passive: true });
  zone.addEventListener('touchmove', onTouchMove, { passive: false });
  zone.addEventListener('touchend', onTouchEnd, { passive: true });

  // Mouse fallback
  zone.addEventListener('mousedown', e => {
    const t = { clientX: e.clientX, clientY: e.clientY };
    onTouchStart({ touches: [t] });
    const mm = ev => { ev.preventDefault(); onTouchMove({ touches: [{ clientX: ev.clientX }], preventDefault(){} }); };
    const mu = () => { onTouchEnd(); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
  });
}

function onTouchStart(e) {
  if (S.answered || !e.touches.length) return;
  S.dragging = true;
  S.startX = e.touches[0].clientX;
  S.dx = 0;
  els.card.classList.remove('animating');
}

function onTouchMove(e) {
  if (!S.dragging || S.answered) return;
  S.dx = e.touches[0].clientX - S.startX;

  const rot = (S.dx / 400) * 12;
  els.card.style.transform = `translate3d(${S.dx}px, 0, 0) rotate(${rot}deg)`;

  // Hint opacity
  const progress = Math.min(Math.abs(S.dx) / 80, 1);
  if (S.dx < 0) {
    els.hintL.style.opacity = progress;
    els.hintR.style.opacity = 0;
  } else {
    els.hintR.style.opacity = progress;
    els.hintL.style.opacity = 0;
  }

  // Hide swipe hint after first drag
  if (!S.hintShown && Math.abs(S.dx) > 10) {
    S.hintShown = true;
    $('#swipe-hint').classList.add('hidden');
  }
}

function onTouchEnd() {
  if (!S.dragging || S.answered) return;
  S.dragging = false;

  if (Math.abs(S.dx) >= 80) {
    handleAnswer(S.dx > 0 ? 'call' : 'pass');
  } else {
    // Spring back
    els.card.style.transition = 'transform 0.3s cubic-bezier(.15,1.2,.5,1)';
    els.card.style.transform = 'translate3d(0,0,0) rotate(0deg)';
    els.hintL.style.opacity = 0;
    els.hintR.style.opacity = 0;
    setTimeout(() => { els.card.style.transition = ''; }, 320);
  }
}

// --- Init ---
function init() {
  initRefs();

  // Intro avatar
  els.introAvatar.src = ASSETS.paco_happy;

  // Events
  $('#btn-start').addEventListener('click', () => {
    S.deck = buildDeck();
    S.totalCards = S.deck.length;
    S.current = 0;
    S.hits = 0;
    S.lives = MAX_LIVES;
    S.criticalErrors = [];
    renderLives();
    showScreen('play');
    showCard();
  });

  els.btnPass.addEventListener('click', () => {
    vibrate('light');
    if (!S.hintShown) { S.hintShown = true; $('#swipe-hint').classList.add('hidden'); }
    handleAnswer('pass');
  });

  els.btnCall.addEventListener('click', () => {
    vibrate('light');
    if (!S.hintShown) { S.hintShown = true; $('#swipe-hint').classList.add('hidden'); }
    handleAnswer('call');
  });

  els.btnNext.addEventListener('click', nextCard);
  els.btnRetry.addEventListener('click', restart);
  els.btnErrors.addEventListener('click', showErrorsModal);
  els.btnCloseModal.addEventListener('click', () => els.modal.classList.add('hidden'));

  // Close modal on background tap
  els.modal.addEventListener('click', e => {
    if (e.target === els.modal) els.modal.classList.add('hidden');
  });

  initTouch();
}

document.addEventListener('DOMContentLoaded', init);
