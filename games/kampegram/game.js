/* ============================================================
   Kämpegram — Game Logic
   Instagram-clone educational game about junction box organization
   ============================================================ */

/* --- Helpers --- */
const $ = id => document.getElementById(id);

/* ============================================================
   DATA: Accounts & Stories
   ============================================================ */

const ACCOUNTS_TEMPLATE = [
  {
    id: 'maestro_diego',
    username: 'maestro_diego',
    avatar: 'assets/diego_avatar.png',
    avatarFallback: '👨‍🔧',
    time: '2h',
    stories: [
      {
        type: 'text',
        bg: 'linear-gradient(135deg, #0B214A, #1a3a6e)',
        title: 'CAJA PRO CHALLENGE 🔧',
        text: '¿Tienes ojo de inspector?\nVamos a verlo...'
      },
      {
        type: 'slider',
        image: 'assets/caja_terror_1.jpg',
        placeholderBg: 'linear-gradient(135deg, #8B0000, #4a0000)',
        placeholderEmoji: '🔌',
        question: '¿Pro o Terror?',
        correct: 0.08,
        points: 15,
        explanation: 'Cables sueltos sin agrupar, sin reservas y sin orden. Imposible mantener.'
      },
      {
        type: 'poll',
        image: 'assets/caja_terror_1.jpg',
        placeholderBg: 'linear-gradient(135deg, #8B0000, #4a0000)',
        placeholderEmoji: '🔌',
        question: '¿Cuál es el PRIMER fallo que ves?',
        options: ['Cables sin agrupar por función', 'Falta un empalme'],
        correct: 0,
        points: 15,
        feedback: '💡 Lo primero que salta a la vista es el desorden — sin agrupar por función no se puede ni trabajar.',
        explanation: 'Sin agrupar por función no puedes ni identificar circuitos. Paso 1 siempre: ordenar.'
      },
      {
        type: 'slider',
        image: 'assets/caja_pro_1.jpg',
        placeholderBg: 'linear-gradient(135deg, #006644, #003322)',
        placeholderEmoji: '✅',
        question: '¿Pro o Terror?',
        correct: 0.92,
        points: 15,
        explanation: 'Cables agrupados, reservas visibles, empalmes accesibles. Cierre suave garantizado.'
      },
      {
        type: 'slider',
        image: 'assets/caja_terror_sutil.jpg',
        placeholderBg: 'linear-gradient(135deg, #8B4500, #4a2500)',
        placeholderEmoji: '🤔',
        question: '¿Pro o Terror?',
        correct: 0.25,
        points: 15,
        explanation: 'Parece OK pero fíjate: cables tirantes, sin reservas, y la tapa no cerraría suave.'
      }
    ]
  },
  {
    id: 'obra_en_vivo',
    username: 'obra_en_vivo',
    avatar: 'assets/obra_avatar.png',
    avatarFallback: '🏗️',
    time: '4h',
    stories: [
      {
        type: 'text',
        bg: 'linear-gradient(135deg, #FCAF45, #FD1D1D)',
        title: 'ANTES vs DESPUÉS 👷',
        text: 'Toca para ver la transformación'
      },
      {
        type: 'reveal',
        beforeImage: 'assets/caja_terror_1.jpg',
        afterImage: 'assets/caja_terror_1_fixed.jpg',
        beforeBg: 'linear-gradient(135deg, #8B0000, #4a0000)',
        afterBg: 'linear-gradient(135deg, #006644, #003322)',
        beforeEmoji: '💀',
        afterEmoji: '✨',
        beforeLabel: 'ANTES',
        afterLabel: 'DESPUÉS ✨',
        explanation: 'Vaciar, separar por función, dejar reservas y verificar cierre suave.'
      },
      {
        type: 'reveal',
        beforeImage: 'assets/caja_serpientes_antes.jpg',
        afterImage: 'assets/caja_serpientes_despues.jpg',
        beforeBg: 'linear-gradient(135deg, #8B4500, #4a2500)',
        afterBg: 'linear-gradient(135deg, #006644, #003322)',
        beforeEmoji: '🐍',
        afterEmoji: '👌',
        beforeLabel: 'DE NIDO...',
        afterLabel: '...A PRO ✨',
        explanation: 'De nido de serpientes a caja pro: agrupar, reservas y empalmes accesibles.'
      }
    ]
  },
  {
    id: 'bootkamp_oficial',
    username: 'bootkamp_oficial',
    avatar: 'assets/bootkamp_avatar.png',
    avatarFallback: '🔥',
    time: '6h',
    isAd: true,
    stories: [
      {
        type: 'ad',
        image: 'assets/ad_bootkamp_1.jpg',
        logo: 'assets/kampe_logo_blanco.png',
        placeholderBg: 'linear-gradient(135deg, #FF6B00, #FD1D1D)',
        placeholderEmoji: '⚡',
        title: 'Bootkämp by Kämpe',
        subtitle: 'De 0 a electricista en 12 semanas.\nSin rodeos. Sin excusas.\nEl curso intensivo que te pone a trabajar.',
        banner: 'DE 0 A ELECTRICISTA',
        bannerSub: 'En solo 12 semanas',
        promo: 'Empieza tu Bootkämp',
        cta: 'Apúntate ya',
        joke: 'Tranqui, ya estás dentro 😂 Vuelve al challenge'
      },
      {
        type: 'ad',
        image: 'assets/ad_bootkamp_arnold.jpg',
        logo: 'assets/kampe_logo_blanco.png',
        placeholderBg: 'linear-gradient(135deg, #1a1a1a, #333)',
        placeholderEmoji: '💪',
        title: 'Bootkämp by Kämpe',
        subtitle: '"I used to terminate cables like amateur...\nthen I found Bootkämp.\nNow every box I touch is PRO."\n— Arnold',
        banner: 'I\'LL BE BACK...',
        bannerSub: 'Con Bootkämp, siempre vuelves mejor',
        promo: 'Train like Arnold',
        cta: 'Inscríbete ahora',
        joke: 'Arnold no existe 😂 Pero Bootkämp sí'
      },
      {
        type: 'ad',
        image: 'assets/ad_bootkamp_2.jpg',
        logo: 'assets/kampe_logo_blanco.png',
        placeholderBg: 'linear-gradient(135deg, #0a0a2e, #1a3a6e)',
        placeholderEmoji: '👷',
        title: 'Bootkämp by Kämpe',
        subtitle: 'Tu madre decía que estudiaras.\nElla tenía razón.\nPero no dijo QUÉ estudiar. 😏',
        banner: 'TU MADRE TENÍA RAZÓN',
        bannerSub: 'Pero no dijo QUÉ estudiar 😏',
        promo: 'Infórmate gratis',
        cta: 'Más info',
        joke: 'Ya lo estás viviendo 💪 Sigue con el challenge'
      }
    ]
  },
  {
    id: 'quiz_electrico',
    username: 'quiz_electrico',
    avatar: 'assets/quiz_avatar.png',
    avatarFallback: '⚡',
    time: '3h',
    stories: [
      {
        type: 'text',
        bg: 'linear-gradient(135deg, #833AB4, #FD1D1D)',
        title: '⚡ QUIZ RÁPIDO',
        text: '4 preguntas, ¿cuántas aciertas?'
      },
      {
        type: 'quiz',
        bg: 'linear-gradient(135deg, #1a1a3e, #0a0a2e)',
        question: '¿Qué son las "reservas" en una caja?',
        options: [
          'Cable de sobra por si falla',
          'Margen para retrabajar en el futuro',
          'Un tipo de empalme',
          'El espacio vacío de la caja'
        ],
        correct: 1,
        points: 15,
        feedback: '💡 Las reservas son margen de cable extra que dejamos para poder rehacer conexiones en el futuro. Sin reservas, si algo falla no puedes arreglarlo sin tirar cable nuevo.',
        explanation: 'Reservas = margen de cable para poder rehacer conexiones en el futuro.'
      },
      {
        type: 'quiz',
        bg: 'linear-gradient(135deg, #1a1a3e, #0a0a2e)',
        question: 'Un cable tirante es un problema porque...',
        options: [
          'Se ve feo',
          'No puedes rehacer la conexión',
          'Gasta más cobre',
          'Hace ruido'
        ],
        correct: 1,
        points: 15,
        feedback: '💡 Un cable demasiado corto no te deja retrabajar la conexión. Si falla un empalme, necesitas margen para rehacerlo.',
        explanation: 'Cable tirante = sin margen para retrabajar. Si falla un empalme, no puedes rehacerlo.'
      },
      {
        type: 'poll',
        bg: 'linear-gradient(135deg, #1a1a3e, #0a0a2e)',
        question: '¿Qué significa "cierre suave"?',
        options: ['La tapa cierra sin empujar fuerte', 'Usamos una tapa de goma'],
        correct: 0,
        points: 15,
        feedback: '💡 Cierre suave = la tapa cierra sin empujar fuerte. Si tienes que forzar, hay cables mal enroutados que se están pillando. Regla: "Si no cierra suave, está mal."',
        explanation: 'Si la tapa no cierra suave, hay cables pillados. Regla: "si no cierra suave, está mal."'
      },
      {
        type: 'quiz',
        bg: 'linear-gradient(135deg, #1a1a3e, #0a0a2e)',
        question: '¿Qué es lo primero que haces para arreglar una caja terrorífica?',
        options: [
          'Cerrar y olvidar',
          'Vaciar y ordenar por funciones',
          'Cortar todos los cables',
          'Llamar al jefe'
        ],
        correct: 1,
        points: 15,
        feedback: '💡 Siempre se empieza vaciando y ordenando por funciones. Sin orden no puedes ni evaluar longitudes ni reservas.',
        explanation: 'Siempre se empieza vaciando y separando por funciones. Sin orden no hay nada.'
      }
    ]
  }
];

const MAX_SCORE = 135; // 3 sliders×15 + 2 polls×15 + 4 quizzes×15

const FEED_POSTS = [
  {
    username: 'maestro_diego',
    avatar: 'assets/diego_avatar.png',
    avatarFallback: '👨‍🔧',
    video: 'https://res.cloudinary.com/kampe/video/upload/c_fill,ar_4:5,g_auto,w_1080/v1772562003/feed_diego_challenge_t5trvy.mp4',
    imageBg: 'linear-gradient(135deg, #0B214A, #00E6BC)',
    imageEmoji: '🔧',
    likes: 247,
    caption: 'Hoy toca inspección de cajas. ¿Sabes distinguir una caja PRO de una TERRORÍFICA? 💀✨ Desliza mis stories para el challenge 👆🔧',
    time: 'Hace 2 horas'
  }
];

/* Deep-clone accounts so we can safely mutate stories (insert feedback) */
function cloneAccounts() {
  return ACCOUNTS_TEMPLATE.map(acc => ({
    ...acc,
    stories: acc.stories.map(s => ({ ...s }))
  }));
}

let ACCOUNTS = cloneAccounts();

/* ============================================================
   STATE
   ============================================================ */

let state = {
  score: 0,
  record: parseInt(localStorage.getItem('kampegram_record')) || 0,
  viewed: {},
  currentAccount: -1,
  currentStory: -1,
  answered: false,
  taskSent: false,
  resultsShown: false,
  sliderActive: false,   // true while dragging slider
  adBlocked: false,       // true during ad countdown
  transitionTimer: null   // tracks pending story transition
};

/* Central cleanup for slider document-level listeners */
let sliderCleanup = null;

function cleanupSlider() {
  if (sliderCleanup) {
    sliderCleanup();
    sliderCleanup = null;
  }
  state.sliderActive = false;
}

/* ============================================================
   HOME SCREEN
   ============================================================ */

function renderHome() {
  renderStoryBubbles();
  renderFeed();
}

function renderStoryBubbles() {
  const container = $('story-bubbles-container');
  container.innerHTML = '';
  ACCOUNTS.forEach((acc, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'story-bubble-wrap' + (state.viewed[acc.id] ? ' viewed' : '');
    const isViewed = state.viewed[acc.id];
    wrap.innerHTML = `
      <div class="story-bubble${isViewed ? ' viewed' : ''}">
        <div class="bubble-avatar-fallback" style="display:flex;font-size:28px;background:#ddd;border:3px solid #fff;width:58px;height:58px;border-radius:50%;align-items:center;justify-content:center">${acc.avatarFallback || '👤'}</div>
      </div>
      <span class="story-name">${acc.username.length > 10 ? acc.username.slice(0, 9) + '…' : acc.username}</span>
    `;
    // Try loading real avatar
    if (acc.avatar) {
      const img = new Image();
      img.onload = () => {
        const fallback = wrap.querySelector('.bubble-avatar-fallback');
        if (fallback) {
          fallback.style.display = 'none';
          const imgEl = document.createElement('img');
          imgEl.src = acc.avatar;
          imgEl.alt = acc.username;
          imgEl.style.cssText = 'width:100%;height:100%;border-radius:50%;border:3px solid #fff;object-fit:cover;display:block';
          fallback.parentNode.insertBefore(imgEl, fallback);
        }
      };
      img.src = acc.avatar;
    }
    wrap.addEventListener('click', () => openStories(i));
    container.appendChild(wrap);
  });
}

function renderFeed() {
  const feed = $('home-feed');
  feed.innerHTML = '';
  FEED_POSTS.forEach(post => {
    const div = document.createElement('div');
    div.className = 'feed-post';
    div.innerHTML = `
      <div class="feed-header">
        <div class="feed-avatar-placeholder" id="feed-avatar-${post.username}" style="background:#0B214A;color:#fff">${post.avatarFallback}</div>
        <span class="feed-username">${post.username}</span>
        <span class="feed-more">•••</span>
      </div>
      <div class="feed-media-wrap" style="background:${post.imageBg}">
        <div class="feed-image-placeholder">${post.imageEmoji}</div>
      </div>
      <div class="feed-actions">
        <svg viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <svg class="feed-action-save" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      </div>
      <div class="feed-likes">${post.likes.toLocaleString()} Me gusta</div>
      <div class="feed-caption"><strong>${post.username}</strong> ${post.caption}<br><span style="color:#8e8e8e;font-size:12px">${post.time}</span></div>
    `;
    feed.appendChild(div);

    // Try loading video
    if (post.video) {
      const mediaWrap = div.querySelector('.feed-media-wrap');
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.className = 'feed-video';
      video.oncanplay = () => {
        const placeholder = mediaWrap.querySelector('.feed-image-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        mediaWrap.style.background = '#000';
      };
      video.onerror = () => console.warn('Video failed to load:', post.video);
      mediaWrap.appendChild(video);
      video.src = post.video;

      // Mute toggle button (IG style)
      const muteBtn = document.createElement('div');
      muteBtn.className = 'feed-mute-btn';
      muteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="#fff" width="16" height="16"><path d="M16.5 12A4.5 4.5 0 0014 8.14V4l-5 4H5v8h4l5 4v-4.14A4.5 4.5 0 0016.5 12z"/><path class="feed-mute-slash" d="M19 12l3-3M19 12l3 3" stroke="#fff" stroke-width="2" fill="none"/></svg>';
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtn.classList.toggle('unmuted', !video.muted);
      });
      mediaWrap.appendChild(muteBtn);
    }

    // Try loading real avatar
    if (post.avatar) {
      const img = new Image();
      img.onload = () => {
        const placeholder = div.querySelector(`#feed-avatar-${post.username}`);
        if (placeholder) {
          placeholder.innerHTML = '';
          placeholder.style.background = 'none';
          const imgEl = document.createElement('img');
          imgEl.src = post.avatar;
          imgEl.className = 'feed-avatar';
          imgEl.alt = post.username;
          placeholder.appendChild(imgEl);
        }
      };
      img.src = post.avatar;
    }
  });
}

/* ============================================================
   STORIES ENGINE
   ============================================================ */

function openStories(accountIndex) {
  state.currentAccount = accountIndex;
  state.currentStory = 0;
  state.answered = false;
  const viewer = $('stories-viewer');
  viewer.classList.remove('hidden');
  $('home').style.display = 'none';
  renderStory();
}

function closeStories() {
  cleanupSlider();
  clearTimeout(state.transitionTimer);

  const acc = ACCOUNTS[state.currentAccount];
  if (acc) state.viewed[acc.id] = true;

  $('stories-viewer').classList.add('hidden');
  $('home').style.display = 'flex';
  renderStoryBubbles();

  // Check if all viewed — but don't double-show results
  const allViewed = ACCOUNTS.every(a => state.viewed[a.id]);
  if (allViewed && !state.resultsShown) {
    showResults();
  }
}

function renderProgressBars() {
  const acc = ACCOUNTS[state.currentAccount];
  const bar = $('sv-progress');
  bar.innerHTML = '';
  acc.stories.forEach((_, i) => {
    const seg = document.createElement('div');
    seg.className = 'sv-bar' + (i < state.currentStory ? ' done' : '') + (i === state.currentStory ? ' active' : '');
    seg.innerHTML = '<div class="sv-bar-fill"></div>';
    bar.appendChild(seg);
  });
}

function renderStoryHeader() {
  const acc = ACCOUNTS[state.currentAccount];

  // Avatar with fallback
  const avatarEl = $('sv-avatar');
  const avatarFallback = $('sv-avatar-fallback');
  avatarEl.src = acc.avatar || '';
  avatarEl.style.display = '';
  avatarFallback.textContent = acc.avatarFallback || '👤';
  avatarFallback.style.display = 'none';
  avatarEl.onerror = function() {
    this.style.display = 'none';
    avatarFallback.style.display = 'flex';
  };

  $('sv-username').textContent = acc.username;
  $('sv-time').textContent = acc.time;

  const sponsored = $('sv-sponsored');
  if (acc.isAd) {
    sponsored.classList.remove('hidden');
  } else {
    sponsored.classList.add('hidden');
  }
}

function renderStory() {
  cleanupSlider();
  clearTimeout(state.transitionTimer);

  const acc = ACCOUNTS[state.currentAccount];
  if (state.currentStory >= acc.stories.length) {
    state.viewed[acc.id] = true;
    if (state.currentAccount < ACCOUNTS.length - 1) {
      state.currentAccount++;
      state.currentStory = 0;
      state.answered = false;
      renderStory();
    } else {
      closeStories();
    }
    return;
  }

  state.answered = false;
  state.adBlocked = false;
  renderProgressBars();
  renderStoryHeader();

  const story = acc.stories[state.currentStory];
  const content = $('sv-content');

  // Transition with tracked timer
  content.classList.add('transitioning');
  content.classList.remove('visible');
  state.transitionTimer = setTimeout(() => {
    content.innerHTML = '';
    renderStoryContent(story, content);
    content.classList.remove('transitioning');
    content.classList.add('visible');
  }, 120);

  const bottom = $('sv-bottom');
  bottom.style.display = story.type === 'ad' ? 'none' : '';
}

function renderStoryContent(story, container) {
  switch (story.type) {
    case 'text': renderTextCard(story, container); break;
    case 'slider': renderSlider(story, container); break;
    case 'poll': renderPoll(story, container); break;
    case 'quiz': renderQuiz(story, container); break;
    case 'reveal': renderReveal(story, container); break;
    case 'ad': renderAd(story, container); break;
    case 'feedback': renderFeedback(story, container); break;
  }
}

/* ============================================================
   STICKER RENDERERS
   ============================================================ */

/* --- Text Card --- */
function renderTextCard(story, container) {
  container.innerHTML = `
    <div class="story-text-card" style="background:${story.bg}">
      <h1>${story.title}</h1>
      <p>${story.text.replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

/* --- Slider --- */
function renderSlider(story, container) {
  container.innerHTML = `
    <div class="sv-bg-placeholder" style="background:${story.placeholderBg}">${story.placeholderEmoji}</div>
    <div class="sv-bg-overlay"></div>
    <div class="sticker-slider">
      <div class="slider-question">${story.question}</div>
      <div class="slider-container">
        <div class="slider-labels">
          <span>💀 Terror</span>
          <span>Pro ✨</span>
        </div>
        <div class="slider-track" id="slider-track">
          <div class="slider-fill" id="slider-fill"></div>
          <div class="slider-correct-zone" id="slider-correct"></div>
          <div class="slider-thumb" id="slider-thumb">🤔</div>
        </div>
        <div class="slider-result" id="slider-result"></div>
      </div>
    </div>
  `;

  tryLoadBgImage(story.image, container);

  const track = container.querySelector('#slider-track');
  const thumb = container.querySelector('#slider-thumb');
  const fill = container.querySelector('#slider-fill');
  const correctZone = container.querySelector('#slider-correct');
  const resultEl = container.querySelector('#slider-result');
  let value = 0.5;
  let dragging = false;
  let answered = false;

  function updateSlider(v) {
    value = Math.max(0, Math.min(1, v));
    thumb.style.left = (value * 100) + '%';
    fill.style.width = (value * 100) + '%';
    if (value < 0.3) thumb.textContent = '💀';
    else if (value > 0.7) thumb.textContent = '✨';
    else thumb.textContent = '🤔';
  }

  function getPositionFromEvent(e) {
    const rect = track.getBoundingClientRect();
    const touch = e.touches && e.touches.length > 0 ? e.touches[0] : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e);
    const x = touch.clientX - rect.left;
    return x / rect.width;
  }

  function onStart(e) {
    if (answered) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    state.sliderActive = true;
    thumb.classList.add('grabbing');
    updateSlider(getPositionFromEvent(e));
  }

  function onMove(e) {
    if (!dragging || answered) return;
    e.preventDefault();
    e.stopPropagation();
    updateSlider(getPositionFromEvent(e));
  }

  function onEnd(e) {
    if (!dragging || answered) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    state.sliderActive = false;
    thumb.classList.remove('grabbing');
    answered = true;
    state.answered = true;

    // Show correct zone
    const cMin = Math.max(0, story.correct - 0.12);
    const cMax = Math.min(1, story.correct + 0.12);
    correctZone.style.left = (cMin * 100) + '%';
    correctZone.style.width = ((cMax - cMin) * 100) + '%';
    correctZone.classList.add('show');

    // Score
    const dist = Math.abs(value - story.correct);
    const pts = dist < 0.12 ? story.points : dist < 0.25 ? Math.round(story.points * 0.6) : dist < 0.4 ? Math.round(story.points * 0.3) : 0;
    state.score += pts;

    if (pts >= story.points * 0.8) {
      resultEl.textContent = `¡Buen ojo! +${pts} pts`;
      resultEl.style.color = '#00E6BC';
    } else if (pts > 0) {
      resultEl.textContent = `Casi... +${pts} pts`;
      resultEl.style.color = '#FCAF45';
    } else {
      resultEl.textContent = `Fallaste — +0 pts`;
      resultEl.style.color = '#E74C3C';
    }
    resultEl.classList.add('show');
    showExplanationBanner(container, story.explanation);
  }

  track.addEventListener('mousedown', onStart);
  track.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);

  // Register cleanup globally
  sliderCleanup = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
  };
}

/* --- Poll --- */
function renderPoll(story, container) {
  const bgStyle = story.image
    ? `background:${story.placeholderBg || '#1a1a3e'}`
    : `background:${story.bg || 'linear-gradient(135deg, #1a1a3e, #0a0a2e)'}`;

  container.innerHTML = `
    <div class="sv-bg-placeholder" style="${bgStyle}">${story.placeholderEmoji || ''}</div>
    <div class="sv-bg-overlay"></div>
    <div class="sticker-poll">
      <div class="poll-question">${story.question}</div>
      <div class="poll-container">
        ${story.options.map((opt, i) => `
          <div class="poll-option" data-index="${i}">
            <div class="poll-bar" id="poll-bar-${i}"></div>
            <div class="poll-text">
              <span>${opt}</span>
              <span class="poll-pct" id="poll-pct-${i}"></span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (story.image) tryLoadBgImage(story.image, container);

  container.querySelectorAll('.poll-option').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.answered) return;
      state.answered = true;
      const chosen = parseInt(el.dataset.index);
      const isCorrect = chosen === story.correct;

      if (isCorrect) state.score += story.points;

      container.querySelectorAll('.poll-option').forEach((opt, i) => {
        opt.classList.add('answered');
        const bar = container.querySelector(`#poll-bar-${i}`);
        const pct = container.querySelector(`#poll-pct-${i}`);
        const isThis = i === story.correct;
        bar.classList.add(isThis ? 'correct' : 'wrong');
        bar.style.width = isThis ? '75%' : '25%';
        pct.textContent = isThis ? '75%' : '25%';
        pct.classList.add('show');
      });

      showExplanationBanner(container, story.explanation);

      if (!isCorrect && story.feedback) {
        insertFeedbackStory(story.feedback);
      }
    });
  });
}

/* --- Quiz --- */
function renderQuiz(story, container) {
  container.innerHTML = `
    <div class="sv-bg-placeholder" style="background:${story.bg || 'linear-gradient(135deg, #1a1a3e, #0a0a2e)'}"></div>
    <div class="sticker-quiz">
      <div class="quiz-question">${story.question}</div>
      <div class="quiz-options">
        ${story.options.map((opt, i) => `
          <div class="quiz-option" data-index="${i}">
            <span class="quiz-letter">${String.fromCharCode(65 + i)}</span>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.quiz-option').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.answered) return;
      state.answered = true;
      const chosen = parseInt(el.dataset.index);
      const isCorrect = chosen === story.correct;

      if (isCorrect) state.score += story.points;

      container.querySelectorAll('.quiz-option').forEach((opt, i) => {
        opt.classList.add('answered');
        if (i === story.correct) {
          opt.classList.add('correct');
        } else if (i === chosen && !isCorrect) {
          opt.classList.add('wrong');
        } else {
          opt.classList.add('dimmed');
        }
      });

      showExplanationBanner(container, story.explanation);

      if (!isCorrect && story.feedback) {
        insertFeedbackStory(story.feedback);
      }
    });
  });
}

/* --- Tap-to-Reveal --- */
function renderReveal(story, container) {
  container.innerHTML = `
    <div class="sticker-reveal" id="reveal-sticker">
      <div class="reveal-placeholder" style="background:${story.beforeBg}">${story.beforeEmoji}</div>
      <div class="reveal-overlay" id="reveal-overlay">
        <div class="reveal-label">${story.beforeLabel}</div>
        <div class="reveal-tap-hint">👆 Toca para ver</div>
      </div>
      <div class="reveal-after" id="reveal-after">
        <div class="reveal-placeholder" style="background:${story.afterBg}">${story.afterEmoji}</div>
        <div class="reveal-after-label">${story.afterLabel}</div>
      </div>
    </div>
  `;

  if (story.beforeImage) {
    const img = new Image();
    img.onload = () => {
      const placeholder = container.querySelector('.sticker-reveal > .reveal-placeholder');
      if (placeholder) {
        placeholder.style.backgroundImage = `url(${story.beforeImage})`;
        placeholder.style.backgroundSize = 'cover';
        placeholder.style.backgroundPosition = 'center';
        placeholder.textContent = '';
      }
    };
    img.src = story.beforeImage;
  }
  if (story.afterImage) {
    const img = new Image();
    img.onload = () => {
      const afterPlaceholder = container.querySelector('#reveal-after .reveal-placeholder');
      if (afterPlaceholder) {
        afterPlaceholder.style.backgroundImage = `url(${story.afterImage})`;
        afterPlaceholder.style.backgroundSize = 'cover';
        afterPlaceholder.style.backgroundPosition = 'center';
        afterPlaceholder.textContent = '';
      }
    };
    img.src = story.afterImage;
  }

  let revealed = false;
  const sticker = container.querySelector('#reveal-sticker');
  sticker.addEventListener('click', (e) => {
    if (revealed) {
      // After reveal, let taps pass through to advance story
      sticker.style.pointerEvents = 'none';
      return;
    }
    e.stopPropagation();
    revealed = true;
    container.querySelector('#reveal-overlay').classList.add('revealed');
    container.querySelector('#reveal-after').classList.add('show');
    showExplanationBanner(container, story.explanation);
    // After a moment, allow tapping through to next story
    setTimeout(() => { sticker.style.pointerEvents = 'none'; }, 1500);
  });
}

/* --- Fake Ad --- */
function renderAd(story, container) {
  container.innerHTML = `
    <div class="sticker-ad">
      <div class="ad-image-wrap">
        <div class="ad-placeholder" style="background:${story.placeholderBg}">
          <div class="ad-placeholder-emoji">${story.placeholderEmoji}</div>
          <div class="ad-placeholder-title">${story.title}</div>
          <div class="ad-placeholder-sub">${story.subtitle.replace(/\n/g, '<br>')}</div>
        </div>
        ${story.banner ? `
        <div class="ad-text-overlay">
          <div class="ad-text-headline">${story.banner}</div>
          <div class="ad-text-tagline">${story.bannerSub || ''}</div>
        </div>` : ''}
      </div>
      <div class="ad-promo-banner" id="ad-promo-banner">
        <span class="ad-promo-text">${story.promo || story.title}</span>
        <span class="ad-promo-arrow">›</span>
      </div>
      <div class="ad-cta-bar">
        <div class="ad-cta-text">${story.title}</div>
        <button class="ad-cta-btn" id="ad-cta-btn">${story.cta}</button>
      </div>
      <div class="ad-countdown" id="ad-countdown">3</div>
    </div>
  `;

  // Block skipping for 3 seconds
  state.adBlocked = true;
  let remaining = 3;
  const countdownEl = container.querySelector('#ad-countdown');
  const countdownInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      countdownEl.textContent = remaining;
    } else {
      clearInterval(countdownInterval);
      countdownEl.classList.add('done');
      state.adBlocked = false;
    }
  }, 1000);

  if (story.image) {
    const img = new Image();
    img.onload = () => {
      const wrap = container.querySelector('.ad-image-wrap');
      const overlay = wrap.querySelector('.ad-text-overlay');
      const logoHtml = story.logo
        ? `<img class="ad-logo" src="${story.logo}" alt="Kämpe">`
        : '';
      wrap.innerHTML = `<img class="ad-image" src="${story.image}" alt="">${logoHtml}`;
      if (overlay) wrap.appendChild(overlay);
    };
    img.src = story.image;
  }

  container.querySelector('#ad-cta-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target;
    btn.classList.add('shaking');
    setTimeout(() => btn.classList.remove('shaking'), 500);
    showToast(story.joke);
  });

  container.querySelector('#ad-promo-banner').addEventListener('click', (e) => {
    e.stopPropagation();
    showToast(story.joke);
  });
}

/* --- Feedback Screen --- */
function renderFeedback(story, container) {
  container.innerHTML = `
    <div class="story-feedback" style="background:linear-gradient(135deg, #1a1a2e, #0a0a1e)">
      <div class="feedback-icon">${story.icon || '💡'}</div>
      <div class="feedback-text">${story.text}</div>
    </div>
  `;
}

/* ============================================================
   STORY NAVIGATION
   ============================================================ */

function advanceStory() {
  // Block if slider is being dragged or ad countdown active
  if (state.sliderActive) return;
  if (state.adBlocked) return;

  const acc = ACCOUNTS[state.currentAccount];
  const story = acc.stories[state.currentStory];

  // Block advance if interactive story not answered
  if (!state.answered && story && (story.type === 'slider' || story.type === 'poll' || story.type === 'quiz')) {
    return;
  }

  cleanupSlider();
  state.currentStory++;
  renderStory();
}

function goBackStory() {
  if (state.sliderActive) return;
  if (state.adBlocked) return;
  if (state.currentStory > 0) {
    cleanupSlider();
    state.currentStory--;
    state.answered = false;
    renderStory();
  }
}

function insertFeedbackStory(text) {
  const acc = ACCOUNTS[state.currentAccount];
  const insertAt = state.currentStory + 1;
  if (acc.stories[insertAt] && acc.stories[insertAt].type === 'feedback' && acc.stories[insertAt].text === text) return;
  acc.stories.splice(insertAt, 0, {
    type: 'feedback',
    icon: '💡',
    text: text
  });
}

/* ============================================================
   SWIPE BETWEEN ACCOUNTS
   ============================================================ */

let swipeStartX = 0;
let swipeStartY = 0;
let swiping = false;

function handleSwipeStart(e) {
  // Don't track swipe if slider is active
  if (state.sliderActive) return;
  const t = e.touches ? e.touches[0] : e;
  swipeStartX = t.clientX;
  swipeStartY = t.clientY;
  swiping = true;
}

function handleSwipeEnd(e) {
  if (!swiping || state.sliderActive) { swiping = false; return; }
  swiping = false;
  const t = e.changedTouches ? e.changedTouches[0] : e;
  const dx = t.clientX - swipeStartX;
  const dy = t.clientY - swipeStartY;

  if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
    if (dx < 0 && state.currentAccount < ACCOUNTS.length - 1) {
      cleanupSlider();
      state.viewed[ACCOUNTS[state.currentAccount].id] = true;
      state.currentAccount++;
      state.currentStory = 0;
      state.answered = false;
      renderStory();
    } else if (dx > 0 && state.currentAccount > 0) {
      cleanupSlider();
      state.currentAccount--;
      state.currentStory = 0;
      state.answered = false;
      renderStory();
    }
  }
}

/* ============================================================
   RESULTS
   ============================================================ */

function showResults() {
  if (state.resultsShown) return;
  state.resultsShown = true;

  cleanupSlider();
  clearTimeout(state.transitionTimer);

  $('stories-viewer').classList.add('hidden');
  $('home').style.display = 'none';

  const isNewRecord = state.score > state.record;
  if (isNewRecord) {
    state.record = state.score;
    localStorage.setItem('kampegram_record', state.record);
  }

  let badge, msg;
  if (state.score >= 120) {
    badge = '🏆';
    msg = '¡Ojo clínico de inspector veterano! Compártelo y reta a tu equipo.';
  } else if (state.score >= 80) {
    badge = '👷';
    msg = 'Buen nivel, pero te has dejado alguna. Repasa y vuelve a intentarlo.';
  } else {
    badge = '🔧';
    msg = 'Hay que repasar las bases. Recuerda: orden, longitudes, reservas, cierre suave. ¡Tú puedes!';
  }

  $('results-badge').textContent = badge;
  $('results-score').textContent = `${state.score} / ${MAX_SCORE}`;
  $('results-record').textContent = state.record;
  $('results-msg').textContent = msg;

  const newEl = $('results-new');
  if (isNewRecord) {
    newEl.classList.remove('hidden');
    spawnConfetti();
  } else {
    newEl.classList.add('hidden');
  }

  $('results-screen').classList.remove('hidden');

  // TASK_COMPLETED: >= 60% of max
  if (state.score >= Math.round(MAX_SCORE * 0.6) && !state.taskSent) {
    state.taskSent = true;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    } catch (e) { /* not in RN */ }
  }
}

function resetGame() {
  // Fresh clone of accounts (removes feedback stories)
  ACCOUNTS = cloneAccounts();

  state.score = 0;
  state.viewed = {};
  state.currentAccount = -1;
  state.currentStory = -1;
  state.answered = false;
  state.taskSent = false;
  state.resultsShown = false;
  state.sliderActive = false;

  // Clear any lingering confetti
  document.querySelectorAll('.confetti-piece').forEach(p => p.remove());

  $('results-screen').classList.add('hidden');
  $('home').style.display = 'flex';
  renderStoryBubbles();
}

/* ============================================================
   SHARE
   ============================================================ */

function shareResults() {
  let badgeName;
  if (state.score >= 120) badgeName = '🏆 Inspector Veterano';
  else if (state.score >= 80) badgeName = '👷 Aprendiz Pro';
  else badgeName = '🔧 En Formación';

  const text = `🔧 He sacado ${state.score}/${MAX_SCORE} en Kämpegram\n${badgeName}\n¿Tú sabes distinguir una caja PRO de una TERRORÍFICA? 💀✨\n#Kämpegram #Bootkamp`;

  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    // Show toast on results screen (global toast)
    showGlobalToast('¡Haz captura y compártelo!');
  }
}

/* ============================================================
   UTILS
   ============================================================ */

function showExplanationBanner(container, text) {
  if (!text) return;
  const banner = document.createElement('div');
  banner.className = 'explanation-banner';
  banner.textContent = text;
  container.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));
}

function showToast(msg) {
  const toast = $('sv-toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

function showGlobalToast(msg) {
  const toast = $('global-toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

function tryLoadBgImage(src, container) {
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    const placeholder = container.querySelector('.sv-bg-placeholder');
    if (placeholder) {
      placeholder.style.backgroundImage = `url(${src})`;
      placeholder.style.backgroundSize = 'cover';
      placeholder.style.backgroundPosition = 'center';
      placeholder.textContent = '';
    }
  };
  img.src = src;
}

function spawnConfetti() {
  const colors = ['#833AB4', '#FD1D1D', '#FCAF45', '#00E6BC', '#FFFFAB', '#0095F6'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.8 + 's';
    piece.style.animationDuration = (1.5 + Math.random()) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    piece.style.width = (6 + Math.random() * 6) + 'px';
    piece.style.height = (6 + Math.random() * 6) + 'px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function init() {
  renderHome();

  // Story tap zones — use touchend to avoid click delay, but guard against slider
  $('sv-tap-right').addEventListener('click', (e) => {
    if (state.sliderActive) return;
    e.stopPropagation();
    advanceStory();
  });
  $('sv-tap-left').addEventListener('click', (e) => {
    if (state.sliderActive) return;
    e.stopPropagation();
    goBackStory();
  });

  // Close stories
  $('sv-close').addEventListener('click', closeStories);

  // Swipe between accounts
  const viewer = $('stories-viewer');
  viewer.addEventListener('touchstart', handleSwipeStart, { passive: true });
  viewer.addEventListener('touchend', handleSwipeEnd, { passive: true });
  viewer.addEventListener('touchcancel', () => { swiping = false; }, { passive: true });

  // Results buttons
  $('results-share').addEventListener('click', shareResults);
  $('results-replay').addEventListener('click', resetGame);
}

init();
