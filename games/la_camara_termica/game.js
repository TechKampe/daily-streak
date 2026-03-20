'use strict';

// ─── VIBRACIÓN ──────────────────────────────────

function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else {
    try { navigator.vibrate && navigator.vibrate(80); } catch (e) {}
  }
}

// ─── UTILIDADES ─────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── CONSTANTES ─────────────────────────────────

const TOTAL_SECTIONS = 6;
const PASS_THRESHOLD = 75;
const RECORD_KEY = 'la_camara_termica_record';
const PIPE_WIDTH = 20;
const PIPE_COLOR = '#B87333';
const PIPE_HIGHLIGHT = '#D4975A';
const RIBBON_COLOR = '#444';
const RIBBON_THIN = '#666';
const START_DOT_RADIUS = 8;

const AVATARS = {
  happy:       'https://res.cloudinary.com/kampe/image/upload/v1774024685/arnaldo_happy_juodoe.png',
  celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1774024685/arnaldo_celebrating_vcgyse.png',
  worried:     'https://res.cloudinary.com/kampe/image/upload/v1774024686/arnaldo_worried_nkw2r9.png',
};
const BG_URL = 'https://res.cloudinary.com/kampe/image/upload/v1774024685/bg_gameplay_gsfvva.jpg';

// ─── MENSAJES ───────────────────────────────────

const MESSAGES = {
  scanStart: 'A ver qué dice la cámara…',
  // Tiered by score: just passed (75-84), good (85-94), excellent (95+)
  successJustPassed: [
    'Pasa, pero hay tramos con grosor irregular. Ritmo constante, chaval — esa es la clave.',
    'La continuidad está ahí, pero los radios necesitan más suavidad. Si fuerzas la curva, el aislante se pliega.',
    'Aprobado justo. Revisa los empalmes — si no solapas bien, entra humedad.',
  ],
  successGood: [
    'Buen trabajo. Los radios van bien y las juntas están cerradas. Afina el grosor y es perfecto.',
    'Continuidad sólida. Un encargado de obra no te devolvería esto — pero tú puedes dejarlo aún más limpio.',
    'Los empalmes sellan bien y las curvas son suaves. Solo falta un poco más de constancia en el ritmo.',
  ],
  successExcellent: [
    'Continuidad total: radios suaves, empalmes sellados, grosor uniforme. Así se aísla.',
    'Sin huecos, sin pliegues, sin excesos. Esto es trabajo de profesional.',
    'Esto lo enseñaría como ejemplo. Cada curva limpia, cada junta cerrada.',
  ],
  successPerfect: 'Impecable. Radios perfectos, continuidad total, ni un hueco. Nivel catálogo.',
  successEducational: [
    'El aislamiento es como una piel continua. Si hay un hueco, entra humedad y aparece condensación. Continuidad total es el estándar.',
    'Un radio forzado crea un pliegue. Un pliegue rompe la continuidad. Por eso la regla es: si el radio queda feo, el aislamiento queda peor.',
    'Cada empalme es un punto crítico. Si no solapas lo suficiente, ahí aparece la condensación primero. Solape generoso, siempre.',
    'Demasiado rápido = fino, demasiado lento = gordo. El grosor uniforme no es estética — es lo que garantiza que el aislamiento funcione.',
    'En una instalación real, el encargado de obra revisa continuidad, radios y empalmes. Si hay un hueco, se repite. Así de simple.',
    'Un mal aislamiento se nota enseguida: condensación, goteo, trabajo de principiante. Lo que has practicado aquí evita exactamente eso.',
  ],
  transition: [
    '', // section 0 has no transition msg (it's the first)
    'Vamos con la siguiente. Aquí hay un codo a 90° — el radio tiene que salir suave.',
    'Bajante de techo. Vertical a horizontal. Dos juntas — no me dejes ninguna abierta.',
    'Esta va alrededor de una ventana. Dos codos seguidos. Ritmo constante, chaval.',
    'Marco de puerta. Tres juntas, dos cambios de dirección. Aquí se nota quién tiene oficio.',
    'Última sección. La ruta completa interior-exterior. Tres codos. Esto es lo que cuenta.',
  ],
  defects: {
    uncovered:  'Eso rojo de ahí es tubería al aire — sin aislar. Da igual lo bien que hagas el resto si dejas un trozo pelado.',
    openJoint:  'Ese punto rojo en la junta… la has dejado abierta. Ahí va a sudar seguro. Solapa más la siguiente vez.',
    forcedRadius: 'Mira ese naranja en el codo — el radio ha quedado forzado. El aislante se pliega y entra calor por ahí.',
    subInsulation: 'Eso amarillo es aislamiento fino. Has ido demasiado rápido y casi no hay material — el frío lo atraviesa.',
    overInsulation: 'Eso cian es exceso de material. Parece una morcilla, chaval. Profesional no es meter más, es meter lo justo.',
  },
  defectLabels: {
    uncovered:     { title: 'Tubería descubierta', rule: 'El aislamiento es continuo de principio a fin.' },
    openJoint:     { title: 'Junta abierta', rule: 'Cada pieza nueva empieza solapando sobre la anterior — sin huecos.' },
    forcedRadius:  { title: 'Radio forzado', rule: 'Si el radio queda feo, el aislamiento queda peor.' },
    subInsulation: { title: 'Sub-aislamiento', rule: 'Demasiado rápido = demasiado fino = hueco funcional.' },
    overInsulation:{ title: 'Sobre-aislamiento', rule: 'Profesional = grosor uniforme, justo el necesario.' },
  },
  resultHigh: 'Seis secciones con continuidad total. Radios suaves, empalmes sellados, grosor uniforme. Esto es nivel profesional.',
  resultMedium: 'Buen trabajo, chaval. La continuidad está ahí. Practica los radios y el ritmo constante — la diferencia está en los detalles.',
  tutorial: [
    'Pon el dedo en el punto verde y traza sobre la tubería para aplicar el aislante.',
    'La velocidad importa: muy rápido y queda fino. Muy lento y queda gordo. Busca un ritmo constante.',
    'Cuando llegues al final de una pieza, levanta el dedo y empieza la siguiente solapando sobre la anterior — así sellas la junta.',
    'Después de cada sección, la cámara escanea tu trabajo. Azul = bien aislado. Rojo = puente térmico. Necesitas al menos 75% de continuidad.',
  ],
};

// ─── PIPE SECTION DEFINITIONS ───────────────────

function buildSections(W, H) {
  // All coords relative to a canvas of W x H
  // Pipes are centered, fitting within ~380px width
  const mx = W / 2;        // midpoint x
  const pad = 30;           // padding from edges
  const bendR = 40;         // bend radius
  const sectionData = [];

  // Helper: sample points along a line
  function sampleLine(a, b, step) {
    const pts = [];
    const d = dist(a, b);
    const n = Math.max(1, Math.round(d / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
    }
    return pts;
  }

  // Helper: sample points along an arc
  function sampleArc(cx, cy, r, startA, endA, step) {
    const pts = [];
    const totalAngle = endA - startA;
    const arcLen = Math.abs(totalAngle) * r;
    const n = Math.max(4, Math.round(arcLen / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = startA + totalAngle * t;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  // Helper: build canvas path from segments for drawing
  function segmentsToDrawPath(segs) {
    return function(ctx) {
      ctx.beginPath();
      let first = true;
      for (const seg of segs) {
        if (seg.type === 'line') {
          if (first) { ctx.moveTo(seg.from.x, seg.from.y); first = false; }
          ctx.lineTo(seg.to.x, seg.to.y);
        } else if (seg.type === 'arc') {
          if (first) {
            const sp = { x: seg.cx + Math.cos(seg.startA) * seg.r, y: seg.cy + Math.sin(seg.startA) * seg.r };
            ctx.moveTo(sp.x, sp.y);
            first = false;
          }
          ctx.arc(seg.cx, seg.cy, seg.r, seg.startA, seg.endA, seg.ccw || false);
        }
      }
    };
  }

  // Helper: sample full ideal path from segments
  function sampleSegments(segs, step) {
    let pts = [];
    for (const seg of segs) {
      if (seg.type === 'line') {
        const lp = sampleLine(seg.from, seg.to, step);
        if (pts.length > 0) lp.shift(); // avoid duplicate join point
        pts = pts.concat(lp);
      } else if (seg.type === 'arc') {
        const ap = sampleArc(seg.cx, seg.cy, seg.r, seg.startA, seg.endA, step);
        if (pts.length > 0) ap.shift();
        pts = pts.concat(ap);
      }
    }
    return pts;
  }

  // Helper: compute cumulative distances along ideal path
  function cumulativeDist(pts) {
    const d = [0];
    for (let i = 1; i < pts.length; i++) {
      d.push(d[i-1] + dist(pts[i-1], pts[i]));
    }
    return d;
  }

  // Helper: find piece marker indices from fractional positions
  function markerIndices(cumDist, fractions) {
    const totalLen = cumDist[cumDist.length - 1];
    return fractions.map(f => {
      const target = f * totalLen;
      let closest = 0;
      for (let i = 1; i < cumDist.length; i++) {
        if (Math.abs(cumDist[i] - target) < Math.abs(cumDist[closest] - target)) closest = i;
      }
      return closest;
    });
  }

  const PI = Math.PI;
  const HALF_PI = PI / 2;

  // ── Section 1: Horizontal + gentle 120° curve ──
  {
    const y0 = H * 0.35;
    const x0 = pad + 20;
    const x1 = x0 + 140;
    // Gentle curve: 60° turn downward (120° arc opening), radius 60
    const cr = 60;
    const cx = x1, cy = y0 + cr;
    const arcStart = -HALF_PI;
    const arcEnd = -HALF_PI + PI / 3; // 60 degrees
    const arcEndPt = { x: cx + Math.cos(arcEnd) * cr, y: cy + Math.sin(arcEnd) * cr };
    const x2 = arcEndPt.x + 80;
    const y2 = arcEndPt.y;

    const segs = [
      { type: 'line', from: {x: x0, y: y0}, to: {x: x1, y: y0} },
      { type: 'arc', cx, cy, r: cr, startA: arcStart, endA: arcEnd },
      { type: 'line', from: arcEndPt, to: {x: x2, y: y2} },
    ];
    const ideal = sampleSegments(segs, 2);
    const cum = cumulativeDist(ideal);
    const markers = markerIndices(cum, [0.5]);
    sectionData.push({
      segments: segs, drawPath: segmentsToDrawPath(segs),
      ideal, cumDist: cum, markers, tolerance: 30,
      scenario: 'Tramo de pared', bendIndices: [ideal.length * 0.35 | 0],
    });
  }

  // ── Section 2: Horizontal + 90° down + horizontal (L-shape) ──
  {
    const x0 = pad + 10, y0 = H * 0.25;
    const x1 = x0 + 150;
    const cy1 = y0 + bendR, cx1 = x1;
    // arc from -PI/2 to 0 (going right then down)
    const arcEnd1 = { x: cx1 + bendR, y: cy1 };
    const y2 = cy1 + 120;

    const segs = [
      { type: 'line', from: {x: x0, y: y0}, to: {x: x1, y: y0} },
      { type: 'arc', cx: cx1, cy: cy1, r: bendR, startA: -HALF_PI, endA: 0 },
      { type: 'line', from: arcEnd1, to: {x: arcEnd1.x, y: y2} },
    ];
    const ideal = sampleSegments(segs, 2);
    const cum = cumulativeDist(ideal);
    const markers = markerIndices(cum, [0.5]);
    sectionData.push({
      segments: segs, drawPath: segmentsToDrawPath(segs),
      ideal, cumDist: cum, markers, tolerance: 25,
      scenario: 'Esquina de habitación',
      bendIndices: [markerIndices(cum, [0.45])[0]],
    });
  }

  // ── Section 3: Vertical down + 90° right + horizontal ──
  {
    const x0 = pad + 40, y0 = H * 0.15;
    const y1 = y0 + 140;
    const cx1 = x0 + bendR, cy1 = y1;
    const arcEnd1 = { x: cx1, y: cy1 + bendR };
    // After arc: go right
    const x2 = cx1 + 160;

    const segs = [
      { type: 'line', from: {x: x0, y: y0}, to: {x: x0, y: y1} },
      { type: 'arc', cx: cx1, cy: cy1, r: bendR, startA: PI, endA: HALF_PI, ccw: true },
      { type: 'line', from: {x: cx1, y: cy1 + bendR}, to: {x: x2, y: cy1 + bendR} },
    ];
    const ideal = sampleSegments(segs, 2);
    const cum = cumulativeDist(ideal);
    const markers = markerIndices(cum, [0.33, 0.66]);
    sectionData.push({
      segments: segs, drawPath: segmentsToDrawPath(segs),
      ideal, cumDist: cum, markers, tolerance: 25,
      scenario: 'Bajante de techo',
      bendIndices: [markerIndices(cum, [0.42])[0]],
    });
  }

  // ── Section 4: Horizontal + 90° down + 90° right (U-shape) ──
  {
    const x0 = pad + 10, y0 = H * 0.2;
    const x1 = x0 + 130;
    // First bend: down
    const cx1 = x1, cy1 = y0 + bendR;
    const y2 = cy1 + 100;
    // Second bend: right
    const cx2 = x1 + bendR, cy2 = y2;
    const x3 = cx2 + 100;

    const segs = [
      { type: 'line', from: {x: x0, y: y0}, to: {x: x1, y: y0} },
      { type: 'arc', cx: cx1, cy: cy1, r: bendR, startA: -HALF_PI, endA: 0 },
      { type: 'line', from: {x: x1 + bendR, y: cy1}, to: {x: x1 + bendR, y: y2} },
      { type: 'arc', cx: cx2, cy: cy2, r: bendR, startA: PI, endA: HALF_PI, ccw: true },
      { type: 'line', from: {x: cx2, y: cy2 + bendR}, to: {x: x3, y: cy2 + bendR} },
    ];
    const ideal = sampleSegments(segs, 2);
    const cum = cumulativeDist(ideal);
    const markers = markerIndices(cum, [0.33, 0.66]);
    sectionData.push({
      segments: segs, drawPath: segmentsToDrawPath(segs),
      ideal, cumDist: cum, markers, tolerance: 20,
      scenario: 'Rodear ventana',
      bendIndices: markerIndices(cum, [0.28, 0.65]),
    });
  }

  // ── Section 5: Vertical + 90° right + horizontal + 90° down + vertical ──
  {
    const x0 = pad + 30, y0 = H * 0.12;
    const y1 = y0 + 100;
    // Bend 1: right
    const cx1 = x0 + bendR, cy1 = y1;
    const x2 = cx1 + 120;
    // Bend 2: down
    const cx2 = x2, cy2 = y1 + bendR + bendR;
    const y3 = cy2 + 100;

    const segs = [
      { type: 'line', from: {x: x0, y: y0}, to: {x: x0, y: y1} },
      { type: 'arc', cx: cx1, cy: cy1, r: bendR, startA: PI, endA: HALF_PI, ccw: true },
      { type: 'line', from: {x: cx1, y: cy1 + bendR}, to: {x: x2, y: cy1 + bendR} },
      { type: 'arc', cx: x2, cy: cy1 + bendR + bendR, r: bendR, startA: -HALF_PI, endA: 0 },
      { type: 'line', from: {x: x2 + bendR, y: cy1 + bendR + bendR}, to: {x: x2 + bendR, y: y3} },
    ];
    const ideal = sampleSegments(segs, 2);
    const cum = cumulativeDist(ideal);
    const markers = markerIndices(cum, [0.25, 0.5, 0.75]);
    sectionData.push({
      segments: segs, drawPath: segmentsToDrawPath(segs),
      ideal, cumDist: cum, markers, tolerance: 18,
      scenario: 'Marco de puerta',
      bendIndices: markerIndices(cum, [0.23, 0.58]),
    });
  }

  // ── Section 6: Horizontal + 90° down + 90° right + 90° up ──
  {
    const x0 = pad + 10, y0 = H * 0.25;
    const x1 = x0 + 100;
    // Bend 1: right→down (arc center below the horizontal line)
    const cx1 = x1, cy1 = y0 + bendR;
    // Vertical segment going down
    const bend1Exit = { x: x1 + bendR, y: cy1 };
    const y2 = cy1 + 80;
    // Bend 2: down→right (arc center to the right)
    const cx2 = x1 + bendR + bendR, cy2 = y2;
    const bend2Exit = { x: cx2, y: y2 + bendR };
    // Horizontal segment going right
    const x3 = cx2 + 60;
    // Bend 3: right→up (arc center above the horizontal line)
    const cx3 = x3, cy3 = y2 + bendR - bendR; // = y2
    const bend3Exit = { x: x3 + bendR, y: cy3 };
    // Vertical segment going up
    const y4 = y0 - 10;

    const segs = [
      // Horizontal right
      { type: 'line', from: {x: x0, y: y0}, to: {x: x1, y: y0} },
      // Bend 1: turn downward
      { type: 'arc', cx: cx1, cy: cy1, r: bendR, startA: -HALF_PI, endA: 0 },
      // Vertical down
      { type: 'line', from: bend1Exit, to: {x: bend1Exit.x, y: y2} },
      // Bend 2: turn rightward
      { type: 'arc', cx: cx2, cy: cy2, r: bendR, startA: PI, endA: HALF_PI, ccw: true },
      // Horizontal right
      { type: 'line', from: bend2Exit, to: {x: x3, y: bend2Exit.y} },
      // Bend 3: turn upward (arc from HALF_PI going CCW to PI)
      { type: 'arc', cx: x3, cy: cy3, r: bendR, startA: HALF_PI, endA: PI },
      // Vertical up
      { type: 'line', from: {x: x3 - bendR, y: cy3}, to: {x: x3 - bendR, y: y4} },
    ];
    const ideal = sampleSegments(segs, 2);
    const cum = cumulativeDist(ideal);
    const markers = markerIndices(cum, [0.25, 0.5, 0.75]);
    sectionData.push({
      segments: segs, drawPath: segmentsToDrawPath(segs),
      ideal, cumDist: cum, markers, tolerance: 15,
      scenario: 'Ruta interior-exterior',
      bendIndices: markerIndices(cum, [0.22, 0.48, 0.72]),
    });
  }

  return sectionData;
}

// ─── ESTADO ─────────────────────────────────────

const S = {
  currentSection: 0,
  scores: [],
  totalScore: 0,
  tutorialDone: false,
  tracing: false,
  currentPiece: 0,
  tracePoints: [],   // current piece: [{x,y,width,time}]
  allPieces: [],     // completed pieces for this section
  joints: [],        // [{overlap, idx}]
  velocitySamples: [],
  lastPoint: null,
  lastTime: 0,
  sections: null,
  ctx: null,
  W: 0, H: 0,
  pipeCanvas: null,
  ribbonCanvas: null,
  thermalCanvas: null,
  animFrame: null,
  startPulseTime: 0,
  successMsgIdx: 0,
  scanning: false,
  _jointFlash: null,
};

// ─── DOM ────────────────────────────────────────

const dom = {
  intro:       document.getElementById('intro'),
  play:        document.getElementById('play'),
  results:     document.getElementById('results'),
  tutorial:    document.getElementById('tutorial'),
  defectPanel: document.getElementById('defect-panel'),
  canvas:      document.getElementById('game-canvas'),
  hudDots:     document.getElementById('hud-dots'),
  hudSection:  document.getElementById('hud-section'),
  btnStart:    document.getElementById('btn-start'),
  btnTutorial: document.getElementById('btn-tutorial'),
  btnRedo:     document.getElementById('btn-redo'),
  btnRetry:    document.getElementById('btn-retry'),
  playAvatar:  document.getElementById('play-avatar'),
  speechBubble:document.getElementById('speech'),
  speechText:  document.getElementById('speech-text'),
  continuity:  document.getElementById('continuity-display'),
  tutorialText:document.getElementById('tutorial-text'),
  successPanel: document.getElementById('success-panel'),
  successScore: document.getElementById('success-score'),
  successDetail: document.getElementById('success-detail'),
  successArnaldo: document.getElementById('success-arnaldo'),
  btnNext:     document.getElementById('btn-next'),
  defectList:  document.getElementById('defect-list'),
  defectArnaldo: document.getElementById('defect-arnaldo'),
  resultsAvatar: document.getElementById('results-avatar'),
  resultsMessage: document.getElementById('results-message'),
  resultsCards: document.getElementById('results-cards'),
  resultsTotalValue: document.getElementById('results-total-value'),
  resultsRecord: document.getElementById('results-record'),
};

// ─── PANTALLAS ──────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.documentElement.className = id === 'results' ? 'results' : 'gameplay';
}

// ─── PUNTUACIÓN Y RECORD ────────────────────────

function getRecord() { return parseInt(localStorage.getItem(RECORD_KEY)) || 0; }

function saveRecord(score) {
  const prev = getRecord();
  if (score > prev) { localStorage.setItem(RECORD_KEY, score); return true; }
  return false;
}

function taskCompleted() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

// ─── AVATAR ─────────────────────────────────────

function setAvatar(state) {
  const src = AVATARS[state] || AVATARS.happy;
  dom.playAvatar.src = src;
}

function setPlayAvatarProminent(prominent) {
  dom.playAvatar.classList.toggle('prominent', prominent);
}

// ─── HUD ────────────────────────────────────────

function updateHUD() {
  dom.hudDots.innerHTML = '';
  for (let i = 0; i < TOTAL_SECTIONS; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i < S.currentSection) dot.classList.add('filled');
    if (i === S.currentSection) dot.classList.add('current');
    dom.hudDots.appendChild(dot);
  }
  dom.hudSection.textContent = `Sección ${S.currentSection + 1}/${TOTAL_SECTIONS}`;
}

// ─── SPEECH ─────────────────────────────────────

function showSpeech(text, duration) {
  dom.speechText.textContent = text;
  dom.speechBubble.classList.remove('hidden');
  if (duration) {
    setTimeout(() => dom.speechBubble.classList.add('hidden'), duration);
  }
}

function hideSpeech() { dom.speechBubble.classList.add('hidden'); }

// ─── CANVAS SETUP ───────────────────────────────

function initCanvas() {
  const canvas = dom.canvas;
  // Compute size from the play screen minus HUD
  const playEl = document.getElementById('play');
  const hudEl = document.getElementById('hud');
  S.W = Math.min(playEl.clientWidth, 430);
  S.H = playEl.clientHeight - hudEl.offsetHeight;
  canvas.width = S.W * 2;   // retina
  canvas.height = S.H * 2;
  canvas.style.width = S.W + 'px';
  canvas.style.height = S.H + 'px';
  S.ctx = canvas.getContext('2d');
  S.ctx.scale(2, 2); // retina scaling

  // Offscreen canvases
  S.pipeCanvas = createOffscreen(S.W, S.H);
  S.ribbonCanvas = createOffscreen(S.W, S.H);
  S.thermalCanvas = createOffscreen(S.W, S.H);

  // Build section data with current dimensions
  S.sections = buildSections(S.W, S.H);
}

function createOffscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  return { canvas: c, ctx };
}

// ─── PIPE DRAWING ───────────────────────────────

function drawPipe() {
  const sec = S.sections[S.currentSection];
  const ctx = S.pipeCanvas.ctx;
  ctx.clearRect(0, 0, S.W, S.H);

  // Center the pipe in the canvas by computing offset
  const ideal = sec.ideal;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of ideal) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  const pipeW = maxX - minX;
  const pipeH = maxY - minY;
  const offsetX = (S.W - pipeW) / 2 - minX;
  const offsetY = (S.H - pipeH) / 2 - minY;

  // Store offset so other drawing functions can use it
  sec._offset = { x: offsetX, y: offsetY };

  // Apply offset to all ideal points (only once)
  if (!sec._centered) {
    for (const pt of sec.ideal) {
      pt.x += offsetX;
      pt.y += offsetY;
    }
    // Offset the path segments too
    for (const seg of sec.segments) {
      if (seg.type === 'line') {
        seg.from.x += offsetX; seg.from.y += offsetY;
        seg.to.x += offsetX; seg.to.y += offsetY;
      } else if (seg.type === 'arc') {
        seg.cx += offsetX; seg.cy += offsetY;
      }
    }
    // Rebuild the draw path with updated coords
    sec.drawPath = (function(segs) {
      return function(ctx) {
        ctx.beginPath();
        let first = true;
        for (const seg of segs) {
          if (seg.type === 'line') {
            if (first) { ctx.moveTo(seg.from.x, seg.from.y); first = false; }
            ctx.lineTo(seg.to.x, seg.to.y);
          } else if (seg.type === 'arc') {
            if (first) {
              const sp = { x: seg.cx + Math.cos(seg.startA) * seg.r, y: seg.cy + Math.sin(seg.startA) * seg.r };
              ctx.moveTo(sp.x, sp.y);
              first = false;
            }
            ctx.arc(seg.cx, seg.cy, seg.r, seg.startA, seg.endA, seg.ccw || false);
          }
        }
      };
    })(sec.segments);
    sec._centered = true;
  }

  // Recalculate bounding box after centering
  minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
  for (const pt of sec.ideal) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  // Dark bounding box behind pipe area with rounded corners
  const pad = 45;
  ctx.save();
  ctx.fillStyle = 'rgba(11, 21, 40, 0.78)';
  ctx.beginPath();
  ctx.roundRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2, 20);
  ctx.fill();
  ctx.restore();

  // Main pipe
  ctx.save();
  ctx.lineWidth = PIPE_WIDTH;
  ctx.strokeStyle = PIPE_COLOR;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  sec.drawPath(ctx);
  ctx.stroke();

  // Highlight
  ctx.lineWidth = 5;
  ctx.strokeStyle = PIPE_HIGHLIGHT;
  ctx.globalCompositeOperation = 'lighter';
  sec.drawPath(ctx);
  ctx.stroke();
  ctx.restore();

  // Piece markers
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (const mIdx of sec.markers) {
    const pt = sec.ideal[mIdx];
    // Find direction to draw perpendicular
    const prev = sec.ideal[Math.max(0, mIdx - 3)];
    const next = sec.ideal[Math.min(sec.ideal.length - 1, mIdx + 3)];
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(pt.x + nx * 18, pt.y + ny * 18);
    ctx.lineTo(pt.x - nx * 18, pt.y - ny * 18);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── START POINT ANIMATION ──────────────────────

function getStartPoint() {
  const sec = S.sections[S.currentSection];
  if (S.currentPiece === 0) return sec.ideal[0];
  const mIdx = sec.markers[S.currentPiece - 1];
  return sec.ideal[mIdx];
}

function getEndMarkerIndex() {
  const sec = S.sections[S.currentSection];
  if (S.currentPiece < sec.markers.length) return sec.markers[S.currentPiece];
  return sec.ideal.length - 1;
}

// Helper: draw offscreen canvas onto main (retina-aware)
function blitOffscreen(src) {
  const ctx = S.ctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to physical pixels
  ctx.drawImage(src.canvas, 0, 0, S.W, S.H, 0, 0, S.W * 2, S.H * 2);
  ctx.restore();
}

function compositeFrame(time) {
  if (S.scanning) return; // thermal scan handles its own drawing
  const ctx = S.ctx;
  ctx.clearRect(0, 0, S.W, S.H);

  // Draw pipe layer
  blitOffscreen(S.pipeCanvas);

  // Draw ribbon layer
  blitOffscreen(S.ribbonCanvas);

  // Draw joint seal flash (if active)
  if (S._jointFlash) {
    const elapsed = time - S._jointFlash.start;
    if (elapsed < 300) {
      const opacity = 0.5 * (1 - elapsed / 300);
      ctx.save();
      ctx.beginPath();
      ctx.arc(S._jointFlash.x, S._jointFlash.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,230,188,${opacity})`;
      ctx.fill();
      ctx.restore();
    } else {
      S._jointFlash = null;
    }
  }

  // No visible start point — tracing begins automatically when the player touches near the pipe

  S.animFrame = requestAnimationFrame(compositeFrame);
}

// ─── VELOCITY & WIDTH ───────────────────────────

function computeVelocity() {
  if (S.velocitySamples.length === 0) return 150; // default
  let totalDist = 0, totalTime = 0;
  for (const s of S.velocitySamples) {
    totalDist += s.d;
    totalTime += s.dt;
  }
  return totalTime > 0 ? (totalDist / totalTime) * 1000 : 150;
}

function velocityToWidth(v) {
  if (v > 500) return lerp(10, 6, clamp((v - 500) / 300, 0, 1));
  if (v > 300) return lerp(16, 10, (v - 300) / 200);
  if (v > 100) return lerp(24, 16, (v - 100) / 200);
  if (v > 60)  return lerp(32, 24, (v - 60) / 40);
  return lerp(36, 32, clamp(v / 60, 0, 1));
}

// ─── RIBBON DRAWING ─────────────────────────────

function drawRibbonSegment(p1, p2) {
  const ctx = S.ribbonCanvas.ctx;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const w = (p1.width + p2.width) / 2;

  // Color based on width
  if (w < 12) {
    ctx.strokeStyle = RIBBON_THIN;
    ctx.globalAlpha = 0.7;
  } else if (w > 28) {
    ctx.strokeStyle = '#3a3a3a';
    ctx.globalAlpha = 0.9;
  } else {
    ctx.strokeStyle = RIBBON_COLOR;
    ctx.globalAlpha = 0.85;
  }

  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Wrinkle lines for over-insulation
  if (w > 28) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len > 2) {
      const nx = -dy / len, ny = dx / len;
      ctx.strokeStyle = 'rgba(100,100,100,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x + nx * w * 0.3, p1.y + ny * w * 0.3);
      ctx.lineTo(p2.x + nx * w * 0.3, p2.y + ny * w * 0.3);
      ctx.stroke();
    }
  }

  // Fold marks at curves (check deviation from ideal)
  const sec = S.sections[S.currentSection];
  const nearBend = sec.bendIndices.some(bi => {
    const bp = sec.ideal[bi];
    return dist(p2, bp) < 50;
  });
  if (nearBend) {
    const closest = findClosestIdealPoint(p2);
    if (closest.dist > 20) {
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      ctx.strokeStyle = 'rgba(231,76,60,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p2.x + nx * w * 0.4, p2.y + ny * w * 0.4);
      ctx.lineTo(p2.x - nx * w * 0.4, p2.y - ny * w * 0.4);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ─── IDEAL PATH PROXIMITY ───────────────────────

function findClosestIdealPoint(pt) {
  const sec = S.sections[S.currentSection];
  let minD = Infinity, minIdx = 0;
  for (let i = 0; i < sec.ideal.length; i++) {
    const d = dist(pt, sec.ideal[i]);
    if (d < minD) { minD = d; minIdx = i; }
  }
  return { dist: minD, idx: minIdx };
}

// ─── TOUCH HANDLING ─────────────────────────────

function getTouchPos(e) {
  const rect = dom.canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return {
    x: (t.clientX - rect.left) * (S.W / rect.width),
    y: (t.clientY - rect.top) * (S.H / rect.height),
  };
}

function onTouchStart(e) {
  e.preventDefault();
  if (S.scanning) return;
  const pos = getTouchPos(e);

  // Check if touch is near the pipe (within tolerance of any ideal point)
  const sec = S.sections[S.currentSection];
  const closest = findClosestIdealPoint(pos);
  if (closest.dist > sec.tolerance + 20) return; // too far from pipe

  // Start tracing — one continuous stroke for the whole section
  const sp = getStartPoint();
  S.tracing = true;
  S.lastPoint = sp;
  S.lastTime = performance.now();
  S.velocitySamples = [];

  const width = 20;
  const pt = { x: sp.x, y: sp.y, width, time: S.lastTime };
  S.tracePoints = [pt];
}

function findClosestOnIdealFromPoint(pt) {
  const sec = S.sections[S.currentSection];
  let minD = Infinity, minIdx = 0;
  for (let i = 0; i < sec.ideal.length; i++) {
    const d = dist(pt, sec.ideal[i]);
    if (d < minD) { minD = d; minIdx = i; }
  }
  return { idx: minIdx, cumDist: sec.cumDist[minIdx] };
}

function flashJointSeal(pos) {
  // Draw a single green flash circle on the main canvas (not ribbon)
  // Uses a temporary overlay drawn during compositeFrame
  S._jointFlash = { x: pos.x, y: pos.y, start: performance.now() };
}

function onTouchMove(e) {
  e.preventDefault();
  if (!S.tracing) return;
  const pos = getTouchPos(e);
  const now = performance.now();
  const d = dist(pos, S.lastPoint);

  // Minimum drag distance
  if (S.tracePoints.length === 1 && d < 10) return;
  if (d < 2) return; // skip very tiny moves

  const dt = now - S.lastTime;
  S.velocitySamples.push({ d, dt });
  if (S.velocitySamples.length > 5) S.velocitySamples.shift();

  const vel = computeVelocity();
  const width = velocityToWidth(vel);

  const pt = { x: pos.x, y: pos.y, width, time: now };
  S.tracePoints.push(pt);

  // Draw ribbon segment
  drawRibbonSegment(S.tracePoints[S.tracePoints.length - 2], pt);

  S.lastPoint = pos;
  S.lastTime = now;
}

function onTouchEnd(e) {
  e.preventDefault();
  if (!S.tracing) return;
  S.tracing = false;

  // Store the single continuous trace as one piece
  S.allPieces = [S.tracePoints.slice()];

  // Evaluate joints from how the trace covers marker positions
  evaluateJointsFromTrace();

  // Fire thermal scan immediately
  runThermalScan();
}

function evaluateJointsFromTrace() {
  const sec = S.sections[S.currentSection];
  S.joints = [];

  // For each piece marker, check if the trace covers it well
  for (let m = 0; m < sec.markers.length; m++) {
    const mIdx = sec.markers[m];
    const markerPt = sec.ideal[mIdx];

    // Find the closest trace point to the marker
    let minDist = Infinity;
    for (const pt of S.tracePoints) {
      const d = dist(pt, markerPt);
      if (d < minDist) minDist = d;
    }

    // Good coverage near marker = sealed joint, poor = open
    // Overlap is expressed as "how well covered" — 20px means fully sealed
    const overlap = Math.max(0, 20 - minDist);
    S.joints.push({ overlap, pieceIdx: m + 1 });
  }
}

// ─── EVALUATION ─────────────────────────────────

function evaluateSection() {
  const sec = S.sections[S.currentSection];

  // 1. Path proximity (40%)
  let proxSamples = [];
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      const c = findClosestIdealPoint(pt);
      let score;
      if (c.dist <= 10) score = 100;
      else if (c.dist <= 25) score = lerp(100, 50, (c.dist - 10) / 15);
      else score = 0;
      proxSamples.push(score);
    }
  }
  // Add 0% for uncovered pipe segments
  const coveredIndices = new Set();
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      const c = findClosestIdealPoint(pt);
      if (c.dist < sec.tolerance) {
        for (let i = Math.max(0, c.idx - 3); i <= Math.min(sec.ideal.length - 1, c.idx + 3); i++) {
          coveredIndices.add(i);
        }
      }
    }
  }
  const uncoveredCount = sec.ideal.length - coveredIndices.size;
  const uncoveredFraction = uncoveredCount / sec.ideal.length;
  // Add 0-score samples proportional to uncovered
  const uncoveredSamples = Math.round(uncoveredFraction * proxSamples.length * 0.5);
  for (let i = 0; i < uncoveredSamples; i++) proxSamples.push(0);

  const proximityScore = proxSamples.length > 0
    ? proxSamples.reduce((a, b) => a + b, 0) / proxSamples.length
    : 0;

  // 2. Thickness uniformity (30%)
  const widths = [];
  for (const piece of S.allPieces) {
    for (const pt of piece) widths.push(pt.width);
  }
  let uniformityScore = 100;
  if (widths.length > 0) {
    const mean = widths.reduce((a, b) => a + b, 0) / widths.length;
    const variance = widths.reduce((a, w) => a + (w - mean) ** 2, 0) / widths.length;
    const stdDev = Math.sqrt(variance);
    uniformityScore = Math.max(0, 100 - stdDev * 5);
    // Penalties for extremes
    const thinCount = widths.filter(w => w < 12).length;
    const thickCount = widths.filter(w => w > 30).length;
    uniformityScore -= thinCount * 5;
    uniformityScore -= thickCount * 3;
    uniformityScore = clamp(uniformityScore, 0, 100);
  }

  // 3. Joint quality (30%)
  let jointScore = 100;
  if (S.joints.length > 0) {
    const jScores = S.joints.map(j => {
      if (j.overlap >= 15) return 100;
      if (j.overlap >= 5) return lerp(30, 90, (j.overlap - 5) / 10);
      return 0;
    });
    jointScore = jScores.reduce((a, b) => a + b, 0) / jScores.length;
  } else {
    // No joints: redistribute weight
    const total = proximityScore * 0.57 + uniformityScore * 0.43;
    return Math.round(clamp(total, 0, 100));
  }

  const continuity = proximityScore * 0.4 + uniformityScore * 0.3 + jointScore * 0.3;
  return Math.round(clamp(continuity, 0, 100));
}

// ─── DEFECT DETECTION ───────────────────────────

function detectDefects() {
  const sec = S.sections[S.currentSection];
  const defects = [];

  // Uncovered pipe
  const coveredIndices = new Set();
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      const c = findClosestIdealPoint(pt);
      if (c.dist < sec.tolerance + 10) {
        for (let i = Math.max(0, c.idx - 3); i <= Math.min(sec.ideal.length - 1, c.idx + 3); i++) {
          coveredIndices.add(i);
        }
      }
    }
  }
  if (coveredIndices.size < sec.ideal.length * 0.85) {
    defects.push('uncovered');
  }

  // Open joints
  for (const j of S.joints) {
    if (j.overlap < 5) { defects.push('openJoint'); break; }
  }

  // Forced radius
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      const nearBend = sec.bendIndices.some(bi => dist(pt, sec.ideal[bi]) < 50);
      if (nearBend) {
        const c = findClosestIdealPoint(pt);
        if (c.dist > 20) { defects.push('forcedRadius'); break; }
      }
    }
    if (defects.includes('forcedRadius')) break;
  }

  // Sub-insulation
  let hasThin = false;
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      if (pt.width < 12) { hasThin = true; break; }
    }
    if (hasThin) break;
  }
  if (hasThin) defects.push('subInsulation');

  // Over-insulation
  let hasThick = false;
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      if (pt.width > 30) { hasThick = true; break; }
    }
    if (hasThick) break;
  }
  if (hasThick) defects.push('overInsulation');

  // Deduplicate and take top 3 by priority order
  const priority = ['uncovered', 'openJoint', 'forcedRadius', 'subInsulation', 'overInsulation'];
  const unique = [...new Set(defects)];
  unique.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  return unique.slice(0, 3);
}

// ─── THERMAL SCAN ───────────────────────────────

// Thermal palette: maps 0-1 heat to RGB (blue→green→yellow→orange→red→white)
function thermalColor(heat) {
  const stops = [
    [0.00, 10,  5,   60 ],
    [0.20, 20,  10,  120],
    [0.35, 10,  80,  10 ],
    [0.50, 200, 200, 0  ],
    [0.70, 255, 120, 0  ],
    [0.85, 255, 30,  0  ],
    [1.00, 255, 220, 200],
  ];
  const h = clamp(heat, 0, 1);
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (h >= stops[i][0] && h <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const t = (h - lo[0]) / (hi[0] - lo[0] || 1);
  return `rgb(${Math.round(lerp(lo[1], hi[1], t))},${Math.round(lerp(lo[2], hi[2], t))},${Math.round(lerp(lo[3], hi[3], t))})`;
}

function buildThermalCanvas() {
  const ctx = S.thermalCanvas.ctx;
  const sec = S.sections[S.currentSection];
  ctx.clearRect(0, 0, S.W, S.H);

  // 1. Neutral dark background — distinct from both cold (blue) and hot (red)
  const bgGrad = ctx.createLinearGradient(0, 0, S.W, S.H);
  bgGrad.addColorStop(0, '#1a1a20');
  bgGrad.addColorStop(0.5, '#1c1c24');
  bgGrad.addColorStop(1, '#18181e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, S.W, S.H);

  // 2. Bare pipe — slightly warm green signature (metal conducts heat)
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = PIPE_WIDTH + 8;
  ctx.strokeStyle = thermalColor(0.30);
  ctx.globalAlpha = 0.5;
  sec.drawPath(ctx); ctx.stroke();
  ctx.lineWidth = PIPE_WIDTH;
  ctx.strokeStyle = thermalColor(0.35);
  ctx.globalAlpha = 0.7;
  sec.drawPath(ctx); ctx.stroke();
  ctx.restore();

  // 3. Insulation — good = cold (invisible), bad = hot (bright)
  for (const piece of S.allPieces) {
    for (let i = 1; i < piece.length; i++) {
      const p1 = piece[i - 1], p2 = piece[i];
      const w = (p1.width + p2.width) / 2;
      const c = findClosestIdealPoint(p2);

      let heat;
      if (w < 12) {
        heat = lerp(0.65, 0.95, clamp((12 - w) / 8, 0, 1));
      } else if (w > 28) {
        heat = lerp(0.30, 0.45, clamp((w - 28) / 10, 0, 1));
      } else if (c.dist > 20) {
        heat = lerp(0.55, 0.80, clamp((c.dist - 20) / 15, 0, 1));
      } else {
        heat = lerp(0.05, 0.15, clamp(c.dist / 15, 0, 1));
      }

      ctx.save();
      ctx.lineCap = 'round';
      // Outer glow — bleed
      ctx.lineWidth = w + 4;
      ctx.strokeStyle = thermalColor(heat);
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      // Inner — sharp
      ctx.lineWidth = w;
      ctx.globalAlpha = 1.0;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.restore();
    }
  }

  // 4. Unsealed joints — radial hot glow
  for (const j of S.joints) {
    if (j.overlap < 5) {
      const mIdx = sec.markers[j.pieceIdx - 1];
      if (mIdx !== undefined) {
        const pt = sec.ideal[mIdx];
        const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, 16);
        grad.addColorStop(0, thermalColor(0.95));
        grad.addColorStop(0.4, thermalColor(0.75));
        grad.addColorStop(1, 'transparent');
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(pt.x - 16, pt.y - 16, 32, 32);
        ctx.restore();
      }
    }
  }

  // 5. Uncovered pipe — bright hot streaks
  const coveredSet = new Set();
  for (const piece of S.allPieces) {
    for (const pt of piece) {
      const c = findClosestIdealPoint(pt);
      if (c.dist < sec.tolerance + 10) {
        for (let i = Math.max(0, c.idx - 3); i <= Math.min(sec.ideal.length - 1, c.idx + 3); i++) coveredSet.add(i);
      }
    }
  }
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineWidth = PIPE_WIDTH + 6;
  for (let i = 1; i < sec.ideal.length; i++) {
    if (!coveredSet.has(i)) {
      ctx.strokeStyle = thermalColor(0.85);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(sec.ideal[i - 1].x, sec.ideal[i - 1].y);
      ctx.lineTo(sec.ideal[i].x, sec.ideal[i].y);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 6. Noise/grain for realistic thermal camera look
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < S.H; y += 4) {
    for (let x = 0; x < S.W; x += 4) {
      const v = Math.random() * 255;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }
  ctx.restore();

  // 7. Temperature scale bar (right edge)
  const scaleX = S.W - 22, scaleW = 10, scaleH = S.H * 0.35;
  const scaleY = (S.H - scaleH) / 2;
  const scaleGrad = ctx.createLinearGradient(0, scaleY, 0, scaleY + scaleH);
  scaleGrad.addColorStop(0, thermalColor(1.0));
  scaleGrad.addColorStop(0.3, thermalColor(0.7));
  scaleGrad.addColorStop(0.5, thermalColor(0.5));
  scaleGrad.addColorStop(0.7, thermalColor(0.3));
  scaleGrad.addColorStop(1, thermalColor(0.0));
  ctx.fillStyle = scaleGrad;
  ctx.fillRect(scaleX, scaleY, scaleW, scaleH);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(scaleX, scaleY, scaleW, scaleH);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('40°', scaleX - 3, scaleY + 8);
  ctx.fillText('20°', scaleX - 3, scaleY + scaleH / 2 + 3);
  ctx.fillText('0°', scaleX - 3, scaleY + scaleH);
}

async function runThermalScan() {
  S.scanning = true;
  cancelAnimationFrame(S.animFrame);

  // Pre-scan pause
  setPlayAvatarProminent(true);
  setAvatar('happy');
  showSpeech(MESSAGES.scanStart);
  vibrate('medium');
  await delay(800);

  // Build thermal canvas
  buildThermalCanvas();

  // Sweep animation
  const sweepDuration = 1500;
  const startTime = performance.now();
  const sec = S.sections[S.currentSection];

  // Track which defect hotspots have triggered haptics
  const hotspotTriggered = new Set();

  await new Promise(resolve => {
    function sweepFrame(now) {
      const elapsed = now - startTime;
      const progress = clamp(elapsed / sweepDuration, 0, 1);
      const sweepX = progress * S.W;

      const ctx = S.ctx;
      ctx.clearRect(0, 0, S.W, S.H);

      // Right side: normal view (pipe + ribbon)
      ctx.save();
      ctx.beginPath();
      ctx.rect(sweepX, 0, S.W - sweepX, S.H);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(S.pipeCanvas.canvas, 0, 0, S.W, S.H, 0, 0, S.W * 2, S.H * 2);
      ctx.drawImage(S.ribbonCanvas.canvas, 0, 0, S.W, S.H, 0, 0, S.W * 2, S.H * 2);
      ctx.restore();

      // Left side: thermal view
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, sweepX, S.H);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(S.thermalCanvas.canvas, 0, 0, S.W, S.H, 0, 0, S.W * 2, S.H * 2);
      ctx.restore();

      // Sweep line
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, S.H);
      ctx.stroke();
      ctx.restore();

      // Haptic for hotspots
      for (const j of S.joints) {
        if (j.overlap < 5 && !hotspotTriggered.has('j' + j.pieceIdx)) {
          const mIdx = sec.markers[j.pieceIdx - 1];
          if (mIdx !== undefined && sec.ideal[mIdx].x <= sweepX) {
            vibrate('light', [0, 80]);
            hotspotTriggered.add('j' + j.pieceIdx);
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(sweepFrame);
      } else {
        // Final frame: full thermal
        ctx.clearRect(0, 0, S.W, S.H);
        blitOffscreen(S.thermalCanvas);
        resolve();
      }
    }
    requestAnimationFrame(sweepFrame);
  });

  hideSpeech();

  // Compute score
  const score = evaluateSection();

  // Animate continuity percentage
  await showContinuityPercent(score);

  // React based on result
  if (score >= PASS_THRESHOLD) {
    S.scanning = false;
    vibrate('success');
    setAvatar('celebrating');
    showSuccessPanel(score);
  } else {
    // S.scanning stays true — prevents touch until redoSection() clears it
    vibrate('error');
    setAvatar('worried');
    showDefectPanel();
  }
}

async function showContinuityPercent(target) {
  dom.continuity.classList.remove('hidden');
  const duration = 800;
  const start = performance.now();

  await new Promise(resolve => {
    function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 2); // ease-out
      const val = Math.round(target * eased);
      dom.continuity.textContent = val + '%';
      dom.continuity.style.color = target >= PASS_THRESHOLD ? '#00E6BC' : '#E74C3C';
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });

  await delay(800);
  dom.continuity.classList.add('hidden');
}

// ─── SUCCESS PANEL ──────────────────────────────

function showSuccessPanel(score) {
  dom.successScore.textContent = score + '%';

  // Arnaldo's line — tiered by score
  let celebPool;
  if (score >= 95) celebPool = [MESSAGES.successPerfect];
  else if (score >= 85) celebPool = MESSAGES.successExcellent;
  else if (score >= 80) celebPool = MESSAGES.successGood;
  else celebPool = MESSAGES.successJustPassed;
  const celebLine = celebPool[S.successMsgIdx % celebPool.length];
  S.successMsgIdx++;
  dom.successArnaldo.textContent = '"' + celebLine + '"';

  // Educational detail — rotates through pool
  const eduIdx = (S.currentSection + S.successMsgIdx) % MESSAGES.successEducational.length;
  dom.successDetail.textContent = MESSAGES.successEducational[eduIdx];

  // Button text
  const isLast = S.currentSection >= TOTAL_SECTIONS - 1;
  dom.btnNext.textContent = isLast ? 'Ver resultados' : 'Siguiente sección';

  dom.successPanel.classList.remove('hidden');
}

function onNextSection() {
  dom.successPanel.classList.add('hidden');
  const score = parseInt(dom.successScore.textContent);
  sectionPassed(score);
}

// ─── DEFECT PANEL ───────────────────────────────

function showDefectPanel() {
  const defects = detectDefects();
  dom.defectList.innerHTML = '';

  for (const d of defects) {
    const info = MESSAGES.defectLabels[d];
    const div = document.createElement('div');
    div.className = 'defect-item';
    div.innerHTML = `<strong>${info.title}</strong><em>${info.rule}</em>`;
    dom.defectList.appendChild(div);
  }

  const primaryDefect = defects[0] || 'subInsulation';
  dom.defectArnaldo.textContent = MESSAGES.defects[primaryDefect];

  dom.defectPanel.classList.remove('hidden');
}

// ─── SECTION FLOW ───────────────────────────────

function sectionPassed(score) {
  S.scores.push(score);
  S.currentSection++;

  if (S.currentSection >= TOTAL_SECTIONS) {
    showResults();
    return;
  }

  updateHUD();
  resetSectionState();
  drawPipe();

  // Show transition message
  const msg = MESSAGES.transition[S.currentSection];
  if (msg) {
    setAvatar('happy');
    setPlayAvatarProminent(true);
    showSpeech(msg, 2500);
    setTimeout(() => setPlayAvatarProminent(false), 2500);
  }

  S.startPulseTime = performance.now();
  S.animFrame = requestAnimationFrame(compositeFrame);
}

function redoSection() {
  dom.defectPanel.classList.add('hidden');
  hideSpeech();
  resetSectionState();
  drawPipe();
  setAvatar('happy');
  setPlayAvatarProminent(false);
  S.startPulseTime = performance.now();
  S.scanning = false;
  S.animFrame = requestAnimationFrame(compositeFrame);
}

function resetSectionState() {
  S.currentPiece = 0;
  S.tracePoints = [];
  S.allPieces = [];
  S.joints = [];
  S.velocitySamples = [];
  S.lastPoint = null;
  S.tracing = false;
  S.ribbonCanvas.ctx.clearRect(0, 0, S.W, S.H);
  S.thermalCanvas.ctx.clearRect(0, 0, S.W, S.H);
}

// ─── TUTORIAL ───────────────────────────────────

function showTutorial() {
  return new Promise(resolve => {
    let step = 0;
    dom.tutorialText.textContent = MESSAGES.tutorial[step];
    dom.btnTutorial.textContent = 'Siguiente';
    dom.tutorial.classList.remove('hidden');

    function advance() {
      step++;
      if (step >= MESSAGES.tutorial.length) {
        dom.tutorial.classList.add('hidden');
        dom.btnTutorial.removeEventListener('click', advance);
        S.tutorialDone = true;
        resolve();
        return;
      }
      dom.tutorialText.textContent = MESSAGES.tutorial[step];
      if (step === MESSAGES.tutorial.length - 1) {
        dom.btnTutorial.textContent = 'Entendido';
      }
    }

    dom.btnTutorial.addEventListener('click', advance);
  });
}

// ─── RESULTS ────────────────────────────────────

function showResults() {
  S.totalScore = S.scores.reduce((a, b) => a + b, 0);
  const avg = S.totalScore / TOTAL_SECTIONS;
  const isHigh = S.totalScore >= 540;

  // Avatar & message
  const state = isHigh ? 'celebrating' : 'happy';
  dom.resultsAvatar.src = AVATARS[state];
  dom.resultsMessage.textContent = isHigh ? MESSAGES.resultHigh : MESSAGES.resultMedium;

  // Score cards with section header
  dom.resultsCards.innerHTML = '<h3 class="results-section-title">Resultados por sección</h3>';
  S.scores.forEach((score, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = (i * 0.2) + 's';
    card.innerHTML = `
      <span class="label">Sección ${i + 1}</span>
      <span class="score" style="color: ${score >= 90 ? '#04FFB4' : '#00E6BC'}">${score}%</span>
    `;
    dom.resultsCards.appendChild(card);
  });

  // Total counter animation
  dom.resultsTotalValue.textContent = '0';
  showScreen('results');

  const start = performance.now();
  function countUp(now) {
    const t = clamp((now - start) / 1000, 0, 1);
    const eased = 1 - Math.pow(1 - t, 2);
    dom.resultsTotalValue.textContent = Math.round(S.totalScore * eased);
    if (t < 1) requestAnimationFrame(countUp);
  }
  requestAnimationFrame(countUp);

  // Record
  const newRecord = saveRecord(S.totalScore);
  const record = getRecord();
  dom.resultsRecord.textContent = newRecord
    ? `Nuevo record: ${record}`
    : `Record: ${record}`;

  // Haptic + task completed
  vibrate('success', [0, 100, 50, 100, 50, 200]);
  taskCompleted();
}

// ─── INIT ───────────────────────────────────────

function init() {
  dom.btnStart.addEventListener('click', startGame);
  dom.btnRetry.addEventListener('click', restart);
  dom.btnRedo.addEventListener('click', redoSection);
  dom.btnNext.addEventListener('click', onNextSection);

  // Touch events on canvas
  dom.canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  dom.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  dom.canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  dom.canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

  // Mouse fallback
  dom.canvas.addEventListener('mousedown', onTouchStart);
  dom.canvas.addEventListener('mousemove', (e) => { if (S.tracing) onTouchMove(e); });
  dom.canvas.addEventListener('mouseup', onTouchEnd);
  dom.canvas.addEventListener('mouseleave', (e) => { if (S.tracing) onTouchEnd(e); });

  showScreen('intro');
}

async function startGame() {
  cancelAnimationFrame(S.animFrame);
  S.currentSection = 0;
  S.scores = [];
  S.totalScore = 0;
  S.successMsgIdx = 0;
  S.scanning = false;
  S.tracing = false;

  showScreen('play');
  // Wait a frame for layout to settle before measuring canvas
  await delay(50);
  initCanvas();
  updateHUD();
  resetSectionState();
  drawPipe();

  setAvatar('happy');
  setPlayAvatarProminent(false);

  // Tutorial on first section
  if (!S.tutorialDone) {
    await showTutorial();
  }

  S.startPulseTime = performance.now();
  S.animFrame = requestAnimationFrame(compositeFrame);
}

function restart() {
  cancelAnimationFrame(S.animFrame);
  S.scanning = false;
  showScreen('intro');
}

// ─── ARRANQUE ───────────────────────────────────

init();
