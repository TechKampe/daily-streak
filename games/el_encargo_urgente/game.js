/* ============================================
   El Encargo Urgente — Game Logic
   Narrativa: Primer encargo solo, Fer por WhatsApp
   ============================================ */
(() => {
  'use strict';

  // ── Constants ──
  const RECORD_KEY = 'el_encargo_urgente_record';
  const TASK_THRESHOLD = 1500;
  const TOTAL_LIVES = 4;

  const CB = 'https://res.cloudinary.com/kampe/image/upload/';
  const FER = {
    happy:       `${CB}v1772019465/fer_happy_aotwxw.png`,
    celebrating: `${CB}v1772019464/fer_celebrating_yrrvkj.png`,
    worried:     `${CB}v1772019465/fer_worried_g1z3jz.png`
  };
  const COMP = {
    iga: `${CB}iga_gc2r1r.png`,
    id:  `${CB}id_h0k5cr.png`,
    pia: `${CB}v1772807187/PIA_umn2cw.png`
  };

  // Cable colors
  const COLORS = { n: '#3498DB', pe: '#2ECC40', sal: '#95A5A6', ali: '#E74C3C' };

  // ── Level definitions ──
  // Each cable: { id, from:{comp,term}, to:{comp,term}, family, label, color, name }
  // Terminals are keyed like "id_out_l", "bar_n_2" etc.
  const LEVELS = [
    { // Level 1: Tutorial — 2 cables (N and PE from ID down to bars)
      cables: [
        { id:'n1',  from:'id_out_l',  to:'bar_n_1',  family:'n',  label:'N',  color:COLORS.n,  name:'Neutro' },
        { id:'pe1', from:'id_out_r',  to:'bar_pe_1', family:'pe', label:'PE', color:COLORS.pe, name:'Tierra' }
      ],
      labels: ['N','PE'],
      components: ['id'],
      briefing: null // tutorial handles it
    },
    { // Level 2: 4 cables (ID N/PE + 2 circuit outputs)
      cables: [
        { id:'n1',  from:'id_out_l',  to:'bar_n_1',  family:'n',  label:'N',  color:COLORS.n,  name:'Neutro' },
        { id:'pe1', from:'id_out_r',  to:'bar_pe_1', family:'pe', label:'PE', color:COLORS.pe, name:'Tierra' },
        { id:'c1',  from:'pia1_out',  to:'sal_1',    family:'sal',label:'C1', color:COLORS.sal,name:'Alumbrado' },
        { id:'c2',  from:'pia2_out',  to:'sal_2',    family:'sal',label:'C2', color:COLORS.sal,name:'Enchufes' }
      ],
      labels: ['N','PE','C1','C2'],
      components: ['id','pia1','pia2'],
      briefing: { text:'Bien el primero. Ahora te toca uno con 4 cables. Aparecen los circuitos de alumbrado y enchufes. Misma secuencia: rutas, etiquetas, reservas.', time:'15:47' }
    },
    { // Level 3: 6 cables (IGA→ID feed + N/PE + 3 circuits)
      cables: [
        { id:'ali1',from:'iga_out',   to:'id_in',    family:'ali',label:'ALI',color:COLORS.ali,name:'Alimentación' },
        { id:'n1',  from:'id_out_l',  to:'bar_n_1',  family:'n',  label:'N',  color:COLORS.n,  name:'Neutro' },
        { id:'pe1', from:'id_out_r',  to:'bar_pe_1', family:'pe', label:'PE', color:COLORS.pe, name:'Tierra' },
        { id:'c1',  from:'pia1_out',  to:'sal_1',    family:'sal',label:'C1', color:COLORS.sal,name:'Alumbrado' },
        { id:'c2',  from:'pia2_out',  to:'sal_2',    family:'sal',label:'C2', color:COLORS.sal,name:'Enchufes' },
        { id:'c3',  from:'pia3_out',  to:'sal_3',    family:'sal',label:'C3', color:COLORS.sal,name:'Horno' }
      ],
      labels: ['N','PE','C1','C2','C3','ALI'],
      components: ['iga','id','pia1','pia2','pia3'],
      briefing: { text:'Vas bien. Este tiene 6 cables y aparece la alimentación del IGA al diferencial. Planifica las rutas antes de trazar — con 6 cables, si no piensas primero, cruzas seguro.', time:'16:12' }
    },
    { // Level 4: 8 cables (IGA→ID + N/PE + phase bridge + 4 circuits)
      cables: [
        { id:'ali1',from:'iga_out',   to:'id_in',    family:'ali',label:'ALI',color:COLORS.ali,name:'Alimentación IGA→ID' },
        { id:'n1',  from:'id_out_l',  to:'bar_n_1',  family:'n',  label:'N',  color:COLORS.n,  name:'Neutro' },
        { id:'pe1', from:'id_out_r',  to:'bar_pe_1', family:'pe', label:'PE', color:COLORS.pe, name:'Tierra' },
        { id:'ali2',from:'id_out_f',  to:'pia1_in',  family:'ali',label:'ALI',color:COLORS.ali,name:'Puente fase' },
        { id:'c1',  from:'pia1_out',  to:'sal_1',    family:'sal',label:'C1', color:COLORS.sal,name:'Alumbrado' },
        { id:'c2',  from:'pia2_out',  to:'sal_2',    family:'sal',label:'C2', color:COLORS.sal,name:'Enchufes' },
        { id:'c3',  from:'pia3_out',  to:'sal_3',    family:'sal',label:'C3', color:COLORS.sal,name:'Horno' },
        { id:'c4',  from:'pia4_out',  to:'sal_4',    family:'sal',label:'C4', color:COLORS.sal,name:'Lavadora' }
      ],
      labels: ['N','PE','C1','C2','C3','C4','ALI'],
      components: ['iga','id','pia1','pia2','pia3','pia4'],
      briefing: { text:'Último cuadro. El gordo: 8 cables, 4 circuitos, puente de fase. Si sacas este limpio, el cliente firma sin mirar.', time:'16:38' }
    }
  ];

  // ── Terminal positions (relative to cuadro 380x460) ──
  // Layout: HORIZONTAL row like a real panel — IGA | ID | PIAs left-to-right on DIN rail
  // Cables go DOWN from components to bars below
  // Bar N at y:350, Bar PE at y:410
  const TERMINALS = {
    // IGA output → bottom of IGA, feeds into ID
    iga_out:  { x:38,  y:100, family:'ali' },
    // ID input ← top of ID
    id_in:    { x:98,  y:50,  family:'ali' },
    // ID outputs: N (left bottom), PE (right bottom), phase feed (center bottom)
    id_out_l: { x:82,  y:100, family:'n' },
    id_out_r: { x:114, y:100, family:'pe' },
    id_out_f: { x:98,  y:100, family:'ali' },
    // PIA inputs (top) and outputs (bottom)
    pia1_in:  { x:172, y:50,  family:'ali' },
    pia1_out: { x:172, y:100, family:'sal' },
    pia2_in:  { x:228, y:50,  family:'ali' },
    pia2_out: { x:228, y:100, family:'sal' },
    pia3_in:  { x:284, y:50,  family:'ali' },
    pia3_out: { x:284, y:100, family:'sal' },
    pia4_in:  { x:340, y:50,  family:'ali' },
    pia4_out: { x:340, y:100, family:'sal' },
    // Bar N connection points — spaced along the bar at y:350
    bar_n_1:  { x:82,  y:350, family:'n' },
    bar_n_2:  { x:140, y:350, family:'n' },
    bar_n_3:  { x:190, y:350, family:'n' },
    bar_n_4:  { x:240, y:350, family:'n' },
    // Bar PE connection points — at y:410
    bar_pe_1: { x:114, y:410, family:'pe' },
    bar_pe_2: { x:170, y:410, family:'pe' },
    bar_pe_3: { x:226, y:410, family:'pe' },
    bar_pe_4: { x:282, y:410, family:'pe' },
    // Circuit outputs (salidas) — below each PIA, mid-height
    sal_1:    { x:172, y:260, family:'sal' },
    sal_2:    { x:228, y:260, family:'sal' },
    sal_3:    { x:284, y:260, family:'sal' },
    sal_4:    { x:340, y:260, family:'sal' }
  };

  // ── Component positions on cuadro (horizontal DIN rail layout) ──
  const COMP_POS = {
    iga:  { x:8,   y:28, w:56, h:70, img:'iga', lbl:'IGA' },
    id:   { x:68,  y:28, w:56, h:70, img:'id',  lbl:'ID' },
    pia1: { x:146, y:28, w:50, h:70, img:'pia', lbl:'PIA C1' },
    pia2: { x:202, y:28, w:50, h:70, img:'pia', lbl:'PIA C2' },
    pia3: { x:258, y:28, w:50, h:70, img:'pia', lbl:'PIA C3' },
    pia4: { x:314, y:28, w:50, h:70, img:'pia', lbl:'PIA C4' }
  };

  // ── State ──
  let S = {};
  function resetState() {
    S = {
      level: 0,
      score: 0,
      lives: TOTAL_LIVES,
      phase: 1,
      tracedCables: [],    // {id, from, to, family, color, label, segments:[[x,y],...], labeled:false, reserveSet:false, reserveVal:3}
      currentCable: null,  // cable def being traced
      drawPoints: [],      // current touch points
      dragging: false,
      selectedCable: null, // for labeling
      levelErrors: 0,
      tutorialDone: false,
      tutorialStep: 0,
      taskCompleted: false,
      record: parseInt(localStorage.getItem(RECORD_KEY)) || 0,
      eduCallback: null
    };
  }

  // ── DOM helpers ──
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    document.documentElement.classList.toggle('results', id === '#results');
  }

  // ── HUD ──
  function updateHUD() {
    $('#hud-level').textContent = `Nivel ${S.level + 1}/4`;
    $('#hud-score').textContent = `${S.score} pts`;
    const livesEl = $('#hud-lives');
    livesEl.innerHTML = '';
    for (let i = 0; i < TOTAL_LIVES; i++) {
      const sp = document.createElement('span');
      sp.className = 'heart' + (i < S.lives ? '' : ' lost');
      sp.textContent = '♥';
      livesEl.appendChild(sp);
    }
  }

  // ── Fer helpers ──
  function setFer(state) {
    $('#fer-img').src = FER[state] || FER.happy;
  }
  function ferBubble(text, dur) {
    const b = $('#fer-bubble');
    $('#fer-msg').textContent = text;
    b.classList.remove('hidden');
    if (dur) setTimeout(() => b.classList.add('hidden'), dur);
  }
  function hideFerBubble() { $('#fer-bubble').classList.add('hidden'); }

  // ── Scoring ──
  function addScore(pts) {
    S.score += pts;
    updateHUD();
    if (!S.taskCompleted && S.score >= TASK_THRESHOLD) {
      S.taskCompleted = true;
      try { window.ReactNativeWebView?.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch(e) {}
    }
  }

  // ── Lives ──
  function loseLife() {
    S.lives--;
    S.levelErrors++;
    updateHUD();
    // red flash
    const fl = document.createElement('div');
    fl.className = 'red-flash';
    document.body.appendChild(fl);
    setTimeout(() => fl.remove(), 300);
    if (S.lives <= 0) {
      setTimeout(() => showEdu('Chaval, para. Me han llamado y voy para allá. Esto hay que repasarlo.', 'worried', () => showResults()), 400);
      return true;
    }
    return false;
  }

  // ── Overlays ──
  function showEdu(text, state, callback) {
    $('#edu-av').src = FER[state || 'worried'];
    $('#edu-txt').textContent = text;
    $('#edu-overlay').classList.remove('hidden');
    S.eduCallback = callback || null;
  }
  function dismissEdu() {
    $('#edu-overlay').classList.add('hidden');
    const cb = S.eduCallback;
    S.eduCallback = null;
    if (cb) cb();
  }

  function showWA(text, time, btnText, callback) {
    $('#wa-av').src = FER.happy;
    $('#wa-txt').textContent = text;
    $('#wa-time').textContent = time;
    const btn = $('#wa-btn');
    btn.textContent = btnText || 'Siguiente cuadro';
    $('#wa-overlay').classList.remove('hidden');
    btn.onclick = () => {
      $('#wa-overlay').classList.add('hidden');
      if (callback) callback();
    };
  }

  // ── Canvas ──
  let canvas, ctx, cuadroEl;
  function setupCanvas() {
    cuadroEl = $('#cuadro');
    canvas = $('#cable-canvas');
    const wrap = $('#cuadro-wrap');
    canvas.width = cuadroEl.offsetWidth;
    canvas.height = cuadroEl.offsetHeight;
    // Position canvas exactly over cuadro
    canvas.style.left = cuadroEl.offsetLeft + 'px';
    canvas.style.top = cuadroEl.offsetTop + 'px';
    canvas.style.width = cuadroEl.offsetWidth + 'px';
    canvas.style.height = cuadroEl.offsetHeight + 'px';
    ctx = canvas.getContext('2d');
  }

  function drawAllCables() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width / 380;
    const scaleY = canvas.height / 460;

    // Draw ghost guides for pending cables (phase 1 only)
    if (S.phase === 1) {
      const level = LEVELS[S.level];
      level.cables.forEach(c => {
        if (S.tracedCables.find(tc => tc.id === c.id)) return; // already traced
        const a = TERMINALS[c.from];
        const b = TERMINALS[c.to];
        if (!a || !b) return;
        ctx.save();
        ctx.strokeStyle = c.color + '33'; // very transparent
        ctx.lineWidth = 2 * scaleX;
        ctx.setLineDash([4 * scaleX, 6 * scaleX]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Draw the L-shape guide
        if (Math.abs(a.x - b.x) < 15) {
          ctx.moveTo(a.x * scaleX, a.y * scaleY);
          ctx.lineTo(a.x * scaleX, b.y * scaleY);
        } else if (Math.abs(a.y - b.y) < 15) {
          ctx.moveTo(a.x * scaleX, a.y * scaleY);
          ctx.lineTo(b.x * scaleX, a.y * scaleY);
        } else {
          ctx.moveTo(a.x * scaleX, a.y * scaleY);
          ctx.lineTo(a.x * scaleX, b.y * scaleY);
          ctx.lineTo(b.x * scaleX, b.y * scaleY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });
    }

    // Draw traced cables
    S.tracedCables.forEach(c => {
      ctx.beginPath();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3 * scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (c.segments.length > 0) {
        ctx.moveTo(c.segments[0][0] * scaleX, c.segments[0][1] * scaleY);
        for (let i = 1; i < c.segments.length; i++) {
          ctx.lineTo(c.segments[i][0] * scaleX, c.segments[i][1] * scaleY);
        }
      }
      ctx.stroke();

      // Reserve visual: if in phase 3 or done
      if (S.phase >= 3 && c.reserveVal !== undefined) {
        drawReserveIndicator(c, scaleX, scaleY);
      }
    });

    // Draw ghost cable being drawn
    if (S.dragging && S.drawPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = S.currentCable ? (S.currentCable.color + '88') : '#ffffff55';
      ctx.lineWidth = 3 * scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([6 * scaleX, 4 * scaleX]);
      ctx.moveTo(S.drawPoints[0][0] * scaleX, S.drawPoints[0][1] * scaleY);
      for (let i = 1; i < S.drawPoints.length; i++) {
        ctx.lineTo(S.drawPoints[i][0] * scaleX, S.drawPoints[i][1] * scaleY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawReserveIndicator(cable, sx, sy) {
    if (cable.segments.length < 2) return;
    // Draw a small curve at midpoint to show reserve
    const mid = Math.floor(cable.segments.length / 2);
    const p = cable.segments[mid];
    const rv = cable.reserveVal;
    let rad = 0;
    let col = '#fff';
    if (rv === 1) { rad = 0; col = COLORS.ali; }      // too short — no curve
    else if (rv === 2) { rad = 3; col = '#FFFFAB'; }   // short
    else if (rv === 3) { rad = 6; col = COLORS.n; }    // correct — turquesa
    else if (rv === 4) { rad = 10; col = '#FFFFAB'; }  // long
    else if (rv === 5) { rad = 16; col = COLORS.ali; } // peluca

    if (rad > 0) {
      ctx.beginPath();
      ctx.arc(p[0] * sx, p[1] * sy, rad * sx, 0, Math.PI * 2);
      ctx.fillStyle = col + '44';
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5 * sx;
      ctx.stroke();
    }
  }

  // ── Get touch position relative to cuadro (in 380x460 coords) ──
  function getTouchPos(e) {
    const t = e.touches ? e.touches[0] : e;
    const rect = cuadroEl.getBoundingClientRect();
    const x = (t.clientX - rect.left) / rect.width * 380;
    const y = (t.clientY - rect.top) / rect.height * 460;
    return { x, y };
  }

  // ── Find terminal near point ──
  function findTerminal(x, y, radius) {
    const r = radius || 24;
    const level = LEVELS[S.level];
    // Only terminals relevant to this level
    const relevantTerms = new Set();
    level.cables.forEach(c => { relevantTerms.add(c.from); relevantTerms.add(c.to); });
    let best = null, bestDist = r;
    relevantTerms.forEach(tKey => {
      const t = TERMINALS[tKey];
      if (!t) return;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < bestDist) { bestDist = d; best = tKey; }
    });
    return best;
  }

  // ── Route: snap to H/V segments ──
  function buildRoute(fromKey, points) {
    const start = TERMINALS[fromKey];
    if (!start || points.length === 0) return [];
    const segments = [[start.x, start.y]];
    const last = points[points.length - 1];

    // Simple L-route: go horizontal first, then vertical
    const dx = last.x - start.x;
    const dy = last.y - start.y;

    if (Math.abs(dx) > 5) {
      segments.push([start.x + dx, start.y]);
    }
    segments.push([last.x, last.y]);
    return segments;
  }

  // Build final route from A to B with L-shape
  // In horizontal layout, cables go DOWN first, then horizontal to reach the bar point
  function buildFinalRoute(fromKey, toKey) {
    const a = TERMINALS[fromKey];
    const b = TERMINALS[toKey];
    if (!a || !b) return [];

    // If mostly vertical (same column ±15px), go straight down
    if (Math.abs(a.x - b.x) < 15) {
      return [[a.x, a.y], [a.x, b.y]];
    }
    // If mostly horizontal (same row), go straight across
    if (Math.abs(a.y - b.y) < 15) {
      return [[a.x, a.y], [b.x, a.y]];
    }
    // L-shape: go DOWN first from component, then horizontal to bar point
    return [[a.x, a.y], [a.x, b.y], [b.x, b.y]];
  }

  // ── Check if two segments cross ──
  function segmentsCross(a1, a2, b1, b2) {
    function ccw(A, B, C) { return (C[1]-A[1])*(B[0]-A[0]) > (B[1]-A[1])*(C[0]-A[0]); }
    if (a1[0]===a2[0] && a1[1]===a2[1]) return false;
    if (b1[0]===b2[0] && b1[1]===b2[1]) return false;
    return ccw(a1,b1,b2) !== ccw(a2,b1,b2) && ccw(a1,a2,b1) !== ccw(a1,a2,b2);
  }

  function checkCrossings(newSegs) {
    for (const existing of S.tracedCables) {
      for (let i = 0; i < existing.segments.length - 1; i++) {
        for (let j = 0; j < newSegs.length - 1; j++) {
          if (segmentsCross(existing.segments[i], existing.segments[i+1], newSegs[j], newSegs[j+1])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // ── Check if cable goes to wrong bar (N to PE or vice versa) ──
  function checkNPEMix(cableDef, toKey) {
    if (cableDef.family === 'n' && toKey.startsWith('bar_pe')) return true;
    if (cableDef.family === 'pe' && toKey.startsWith('bar_n')) return true;
    return false;
  }

  // ── Render cuadro for current level ──
  function renderCuadro() {
    const cuadro = $('#cuadro');
    cuadro.innerHTML = '';
    const level = LEVELS[S.level];

    // Render components
    level.components.forEach(cKey => {
      const cp = COMP_POS[cKey];
      if (!cp) return;
      const div = document.createElement('div');
      div.className = 'comp';
      div.style.cssText = `left:${cp.x}px;top:${cp.y}px;width:${cp.w}px`;
      div.innerHTML = `<img src="${COMP[cp.img]}" alt="${cp.lbl}"><span class="comp-label">${cp.lbl}</span>`;
      cuadro.appendChild(div);
    });

    // Render DIN rail (visual reference line behind components)
    const rail = document.createElement('div');
    rail.style.cssText = 'position:absolute;left:4px;top:58px;width:372px;height:8px;background:#666;border-radius:2px;z-index:1;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)';
    cuadro.appendChild(rail);

    // Render bars
    const barN = document.createElement('div');
    barN.className = 'bar bar-n';
    barN.style.cssText = 'left:30px;top:344px;width:320px';
    barN.innerHTML = '<span class="bar-label">N</span>';
    cuadro.appendChild(barN);

    const barPE = document.createElement('div');
    barPE.className = 'bar bar-pe';
    barPE.style.cssText = 'left:30px;top:404px;width:320px';
    barPE.innerHTML = '<span class="bar-label">PE</span>';
    cuadro.appendChild(barPE);

    // Render salida labels (where circuit cables end)
    const salLabels = { sal_1:'C1', sal_2:'C2', sal_3:'C3', sal_4:'C4' };
    level.cables.forEach(c => {
      if (c.to.startsWith('sal_') && salLabels[c.to]) {
        const t = TERMINALS[c.to];
        const lbl = document.createElement('div');
        lbl.className = 'sal-label';
        lbl.textContent = '→ ' + salLabels[c.to];
        lbl.style.cssText = `left:${t.x + 14}px;top:${t.y - 6}px`;
        cuadro.appendChild(lbl);
      }
    });

    // Render terminals
    const relevantTerms = new Set();
    level.cables.forEach(c => { relevantTerms.add(c.from); relevantTerms.add(c.to); });
    relevantTerms.forEach(tKey => {
      const t = TERMINALS[tKey];
      if (!t) return;
      const el = document.createElement('div');
      el.className = 'terminal pulse';
      el.dataset.term = tKey;
      el.dataset.family = t.family;
      el.style.cssText = `left:${t.x - 12}px;top:${t.y - 12}px`;
      cuadro.appendChild(el);
    });

    setupCanvas();
    setupTouchHandlers();
  }

  // ── Touch handlers for Phase 1 (Routing) ──
  let touchHandlersAttached = false;
  function setupTouchHandlers() {
    if (touchHandlersAttached) return;
    touchHandlersAttached = true;

    const cuadro = $('#cuadro');
    cuadro.addEventListener('touchstart', onTouchStart, { passive: false });
    cuadro.addEventListener('touchmove', onTouchMove, { passive: false });
    cuadro.addEventListener('touchend', onTouchEnd);
    cuadro.addEventListener('mousedown', onTouchStart);
    document.addEventListener('mousemove', onTouchMove);
    document.addEventListener('mouseup', onTouchEnd);
  }

  function onTouchStart(e) {
    if (S.phase !== 1) return;
    e.preventDefault();
    const pos = getTouchPos(e);
    const termKey = findTerminal(pos.x, pos.y, 28);
    if (!termKey) return;

    // Check it's a valid "from" terminal for an untraced cable
    const level = LEVELS[S.level];
    const cable = level.cables.find(c => c.from === termKey && !S.tracedCables.find(tc => tc.id === c.id));
    if (!cable) return;

    // Check tutorial constraints
    if (S.level === 0 && !S.tutorialDone) {
      const expected = level.cables[S.tutorialStep];
      if (!expected || cable.id !== expected.id) return;
    }

    S.dragging = true;
    S.currentCable = cable;
    S.drawPoints = [{ x: TERMINALS[termKey].x, y: TERMINALS[termKey].y }];

    // Highlight active terminal
    const termEl = cuadro.querySelector(`[data-term="${termKey}"]`);
    if (termEl) termEl.classList.add('active-t');

    // Highlight valid destinations
    const destEl = cuadro.querySelector(`[data-term="${cable.to}"]`);
    if (destEl) destEl.style.boxShadow = '0 0 14px ' + cable.color;
  }

  function onTouchMove(e) {
    if (!S.dragging || S.phase !== 1) return;
    e.preventDefault();
    const pos = getTouchPos(e);
    S.drawPoints.push({ x: pos.x, y: pos.y });
    // Only keep start + last for L-route preview
    if (S.drawPoints.length > 2) {
      S.drawPoints = [S.drawPoints[0], S.drawPoints[S.drawPoints.length - 1]];
    }
    drawAllCables();
  }

  function onTouchEnd(e) {
    if (!S.dragging || S.phase !== 1) return;
    S.dragging = false;

    const pos = e.changedTouches ? {
      x: (e.changedTouches[0].clientX - cuadroEl.getBoundingClientRect().left) / cuadroEl.getBoundingClientRect().width * 380,
      y: (e.changedTouches[0].clientY - cuadroEl.getBoundingClientRect().top) / cuadroEl.getBoundingClientRect().height * 460
    } : getTouchPos(e);

    const termKey = findTerminal(pos.x, pos.y, 28);
    const cable = S.currentCable;

    // Clear highlights
    $$('.terminal.active-t').forEach(el => el.classList.remove('active-t'));
    $$('.terminal').forEach(el => el.style.boxShadow = '');

    if (!cable) { S.drawPoints = []; drawAllCables(); return; }

    // Not dropped on any terminal
    if (!termKey) { S.drawPoints = []; S.currentCable = null; drawAllCables(); return; }

    // Dropped on correct destination
    if (termKey === cable.to) {
      const route = buildFinalRoute(cable.from, cable.to);

      // Check for crossings
      if (checkCrossings(route)) {
        S.drawPoints = []; S.currentCable = null; drawAllCables();
        setFer('worried');
        showEdu('Has cruzado cables. En un cuadro limpio, los cables van peinados: paralelos, sin cruces. Si los peinas, cualquiera entiende el cuadro en 10 segundos.', 'worried', () => {
          // Still add the cable but mark error
          S.tracedCables.push({ ...cable, segments: route, labeled: false, reserveSet: false, reserveVal: 3 });
          markTerminalConnected(cable.from);
          markTerminalConnected(cable.to);
          setFer('happy');
          if (!loseLife()) afterCableTraced();
        });
        return;
      }

      // Check N/PE mix
      if (checkNPEMix(cable, termKey)) {
        S.drawPoints = []; S.currentCable = null; drawAllCables();
        const msg = cable.family === 'n'
          ? 'El neutro va a la barra N, no a la de tierra. El neutro es la vuelta del circuito. La tierra es seguridad. No se mezclan.'
          : 'La tierra va a la barra PE. Si la mezclas con el neutro, el cuadro no es seguro. Cada uno a lo suyo.';
        setFer('worried');
        showEdu(msg, 'worried', () => { setFer('happy'); if (!loseLife()) {} });
        return;
      }

      // Success!
      S.tracedCables.push({ ...cable, segments: route, labeled: false, reserveSet: false, reserveVal: 3 });
      markTerminalConnected(cable.from);
      markTerminalConnected(cable.to);
      addScore(100);
      S.drawPoints = []; S.currentCable = null;
      drawAllCables();

      // Fer acierto rotation
      const msgs = ['Limpio.', 'Así.', 'Sin cruces. Eso es.'];
      ferBubble(msgs[S.tracedCables.length % msgs.length], 1500);
      setFer('happy');

      afterCableTraced();
      return;
    }

    // Dropped on wrong terminal
    if (termKey !== cable.from) {
      S.drawPoints = []; S.currentCable = null; drawAllCables();

      // Check if it's a N/PE swap
      if (checkNPEMix(cable, termKey)) {
        const msg = cable.family === 'n'
          ? 'El neutro va a la barra N, no a la de tierra. El neutro es la vuelta del circuito. La tierra es seguridad. No se mezclan.'
          : 'La tierra va a la barra PE. Si la mezclas con el neutro, el cuadro no es seguro. Cada uno a lo suyo.';
        setFer('worried');
        showEdu(msg, 'worried', () => { setFer('happy'); loseLife(); });
      } else {
        setFer('worried');
        showEdu('Ese cable no va ahí. Piensa: ¿de dónde sale y adónde tiene que llegar?', 'worried', () => { setFer('happy'); loseLife(); });
      }
      return;
    }

    // Dropped back on origin — cancel
    S.drawPoints = []; S.currentCable = null; drawAllCables();
  }

  function markTerminalConnected(tKey) {
    const el = cuadroEl.querySelector(`[data-term="${tKey}"]`);
    if (el) { el.classList.add('connected'); el.classList.remove('pulse'); }
  }

  function afterCableTraced() {
    const level = LEVELS[S.level];

    // Tutorial step advance
    if (S.level === 0 && !S.tutorialDone) {
      S.tutorialStep++;
      if (S.tutorialStep < level.cables.length) {
        setTimeout(() => showTutorialStep(S.tutorialStep), 600);
        return;
      } else {
        // All tutorial cables traced, move to phase 2
        S.tutorialDone = false; // will set true after all phases
        setTimeout(() => startTutorialPhase2(), 600);
        return;
      }
    }

    // Check if all cables traced
    if (S.tracedCables.length >= level.cables.length) {
      setTimeout(() => transitionToPhase2(), 600);
    }
  }

  // ── Phase transitions ──
  function transitionToPhase2() {
    S.phase = 2;
    $('#phase-text').textContent = 'FASE 2: Etiquetas';
    setFer('happy');
    ferBubble('Rutas hechas. Ahora toca etiquetar: cada cable necesita su nombre.', 2500);
    renderLabelPanel();
    highlightNextUnlabeled();
  }

  function transitionToPhase3() {
    S.phase = 3;
    $('#phase-text').textContent = 'FASE 3: Reservas';
    $('#label-panel').classList.add('hidden');
    setFer('happy');
    ferBubble('Etiquetas puestas. Última fase: las reservas. Deja margen para que se pueda rehacer sin romper.', 2500);
    renderSliderPanel();
  }

  // ── Phase 2: Label panel ──
  function renderLabelPanel() {
    const panel = $('#label-panel');
    panel.classList.remove('hidden');
    panel.innerHTML = '';
    const level = LEVELS[S.level];
    level.labels.forEach(lbl => {
      const btn = document.createElement('button');
      btn.className = 'lbl-btn';
      btn.textContent = lbl;
      btn.onclick = () => applyLabel(lbl);
      panel.appendChild(btn);
    });
  }

  function highlightNextUnlabeled() {
    // Remove old highlights from cable badges area
    S.selectedCable = null;
    const next = S.tracedCables.find(c => !c.labeled);
    if (!next) { transitionToPhase3(); return; }
    S.selectedCable = next;
    drawAllCables();
    // Highlight the cable visually by drawing it thicker
    highlightCable(next);
  }

  function highlightCable(cable) {
    if (!ctx) return;
    const sx = canvas.width / 380;
    const sy = canvas.height / 460;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6 * sx;
    ctx.globalAlpha = 0.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (cable.segments.length > 0) {
      ctx.beginPath();
      ctx.moveTo(cable.segments[0][0] * sx, cable.segments[0][1] * sy);
      for (let i = 1; i < cable.segments.length; i++) {
        ctx.lineTo(cable.segments[i][0] * sx, cable.segments[i][1] * sy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function applyLabel(lbl) {
    if (S.phase !== 2 || !S.selectedCable) return;
    const cable = S.selectedCable;

    if (lbl === cable.label) {
      // Correct
      cable.labeled = true;
      addScore(cable._labelAttempts ? 25 : 50);
      placeBadge(cable);
      const msgs = ['Bien puesto.', 'Legible y claro.', 'Eso se lee a la primera.'];
      ferBubble(msgs[Math.floor(Math.random() * msgs.length)], 1500);
      setFer('happy');
      setTimeout(() => highlightNextUnlabeled(), 400);
    } else {
      cable._labelAttempts = (cable._labelAttempts || 0) + 1;
      // Grave: N<->PE confusion
      if ((cable.label === 'N' && lbl === 'PE') || (cable.label === 'PE' && lbl === 'N')) {
        const msg = cable.label === 'N'
          ? 'Ese cable azul es el neutro — se etiqueta N. La tierra es PE. Si los confundes en la etiqueta, el siguiente que abra el cuadro no sabrá cuál es cuál.'
          : 'Ese cable verde-amarillo es la tierra — se etiqueta PE. Si pones N en la tierra, creas un problema de seguridad para el que venga después.';
        setFer('worried');
        showEdu(msg, 'worried', () => { setFer('happy'); loseLife(); });
      } else {
        // Leve: wrong circuit label
        const msg = cable.family === 'ali'
          ? 'Ese cable conecta el IGA con el diferencial. Es la alimentación — se etiqueta ALI.'
          : `Ese circuito sale del PIA de ${cable.name} — se etiqueta ${cable.label}. Fíjate a qué PIA va conectado.`;
        setFer('happy');
        ferBubble(msg, 3000);
      }
    }
  }

  function placeBadge(cable) {
    if (cable.segments.length < 2) return;
    const mid = Math.floor(cable.segments.length / 2);
    const p = cable.segments[mid];
    const badge = document.createElement('div');
    badge.className = 'cable-badge';
    badge.textContent = cable.label;
    badge.style.left = (p[0] - 12) + 'px';
    badge.style.top = (p[1] - 16) + 'px';
    cuadroEl.appendChild(badge);
  }

  // ── Phase 3: Reserve sliders ──
  function renderSliderPanel() {
    const panel = $('#slider-panel');
    panel.classList.remove('hidden');
    panel.innerHTML = '';

    // Randomize initial values (never 3)
    S.tracedCables.forEach(c => {
      const opts = [1, 2, 4, 5];
      c.reserveVal = opts[Math.floor(Math.random() * opts.length)];
      c.reserveSet = false;
    });

    S._currentSliderIdx = 0;
    renderSliderForCable(0);
  }

  function renderSliderForCable(idx) {
    const panel = $('#slider-panel');
    panel.innerHTML = '';
    if (idx >= S.tracedCables.length) { finishLevel(); return; }

    const cable = S.tracedCables[idx];
    S._currentSliderIdx = idx;

    // Highlight this cable
    drawAllCables();
    highlightCable(cable);

    const labels = ['Tenso', 'Corto', 'OK', 'Largo', 'Peluca'];
    const emojis = ['⚠️', '↙️', '✅', '↗️', '🔴'];
    const colors = ['var(--rojo)', 'var(--lemon)', 'var(--turq)', 'var(--lemon)', 'var(--rojo)'];

    const row = document.createElement('div');
    row.className = 'slider-row';

    const lbl = document.createElement('span');
    lbl.className = 'slider-label';
    lbl.textContent = cable.label;
    row.appendChild(lbl);

    const track = document.createElement('div');
    track.className = 'slider-track';

    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    const knob = document.createElement('div');
    knob.className = 'slider-knob';
    track.appendChild(fill);
    track.appendChild(knob);
    row.appendChild(track);

    const status = document.createElement('span');
    status.className = 'slider-status';
    row.appendChild(status);

    panel.appendChild(row);

    // Info text
    const info = document.createElement('div');
    info.style.cssText = 'text-align:center;font-size:12px;color:#aaa;margin:4px 0';
    info.id = 'slider-info';
    panel.appendChild(info);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'slider-confirm';
    confirmBtn.textContent = 'Fijar reserva';
    confirmBtn.onclick = () => confirmReserve(idx);
    panel.appendChild(confirmBtn);

    function updateSlider(val) {
      cable.reserveVal = val;
      const pct = ((val - 1) / 4) * 100;
      fill.style.width = pct + '%';
      fill.style.background = colors[val - 1];
      knob.style.left = pct + '%';
      knob.style.borderColor = colors[val - 1];
      status.textContent = emojis[val - 1];
      info.textContent = labels[val - 1];
      drawAllCables();
    }

    // Slider drag
    let sliderDragging = false;
    function getSliderVal(clientX) {
      const rect = track.getBoundingClientRect();
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      return Math.round(pct * 4) + 1; // 1-5
    }

    function onSStart(e) {
      e.preventDefault();
      sliderDragging = true;
      const t = e.touches ? e.touches[0] : e;
      updateSlider(getSliderVal(t.clientX));
    }
    function onSMove(e) {
      if (!sliderDragging) return;
      e.preventDefault();
      const t = e.touches ? e.touches[0] : e;
      updateSlider(getSliderVal(t.clientX));
    }
    function onSEnd() { sliderDragging = false; }

    track.addEventListener('touchstart', onSStart, { passive: false });
    track.addEventListener('touchmove', onSMove, { passive: false });
    track.addEventListener('touchend', onSEnd);
    track.addEventListener('mousedown', onSStart);
    document.addEventListener('mousemove', onSMove);
    document.addEventListener('mouseup', onSEnd);
    knob.addEventListener('touchstart', onSStart, { passive: false });
    knob.addEventListener('mousedown', onSStart);

    updateSlider(cable.reserveVal);
  }

  function confirmReserve(idx) {
    const cable = S.tracedCables[idx];
    const v = cable.reserveVal;

    if (v === 3) {
      // Perfect
      cable.reserveSet = true;
      addScore(cable._reserveAttempts ? 35 : 50);
      const msgs = ['Reserva justa.', 'Margen perfecto.', 'Si mañana lo rehago, puedo. Eso es.'];
      ferBubble(msgs[Math.floor(Math.random() * msgs.length)], 1500);
      setFer('happy');
      setTimeout(() => renderSliderForCable(idx + 1), 500);
    } else if (v === 2 || v === 4) {
      // Acceptable
      cable.reserveSet = true;
      addScore(25);
      ferBubble('Puede estar mejor. Ajusta un poco.', 2000);
      setFer('happy');
      setTimeout(() => renderSliderForCable(idx + 1), 500);
    } else if (v === 1) {
      cable._reserveAttempts = (cable._reserveAttempts || 0) + 1;
      setFer('worried');
      showEdu('Demasiado corto. Si mañana hay que rehacer ese cable, no hay margen. Siempre deja reserva — es lo profesional.', 'worried', () => { setFer('happy'); });
    } else if (v === 5) {
      cable._reserveAttempts = (cable._reserveAttempts || 0) + 1;
      setFer('worried');
      showEdu('Eso es una peluca. Demasiado cable suelto dentro del cuadro. Reserva sí, pero con orden. El cuadro tiene que respirar, no ahogarse.', 'worried', () => { setFer('happy'); });
    }
  }

  // ── Level complete ──
  function finishLevel() {
    $('#slider-panel').classList.add('hidden');
    const bonus = S.levelErrors === 0 ? 200 : 0;
    if (bonus > 0) {
      addScore(bonus);
      setFer('celebrating');
      ferBubble('Nivel limpio. Ni un fallo. Así se hace.', 2000);
    } else {
      setFer('happy');
      ferBubble('Hecho. Algunos fallos, pero el cuadro está. Venga, al siguiente.', 2000);
    }

    // Tutorial done flag
    if (S.level === 0) S.tutorialDone = true;

    setTimeout(() => {
      if (S.level < LEVELS.length - 1) {
        const next = LEVELS[S.level + 1];
        showWA(next.briefing.text, next.briefing.time, 'Siguiente cuadro', () => {
          S.level++;
          S.levelErrors = 0;
          startLevel();
        });
      } else {
        showResults();
      }
    }, 2200);
  }

  // ── Start a level ──
  function startLevel() {
    S.phase = 1;
    S.tracedCables = [];
    S.drawPoints = [];
    S.currentCable = null;
    S.dragging = false;
    S.selectedCable = null;
    S.levelErrors = 0;
    S._currentSliderIdx = 0;

    $('#phase-text').textContent = 'FASE 1: Rutas';
    $('#label-panel').classList.add('hidden');
    $('#slider-panel').classList.add('hidden');
    hideFerBubble();
    setFer('happy');
    updateHUD();
    renderCuadro();

    if (S.level === 0 && !S.tutorialDone) {
      setTimeout(() => showTutorialStep(0), 500);
    } else {
      // Brief reminder for non-tutorial levels
      ferBubble('Arrastra de cada borne a su destino. Las líneas punteadas te guían.', 3000);
    }

    drawAllCables(); // draw ghost guides immediately
  }

  // ── Tutorial ──
  const TUTORIAL_MSGS = [
    'Primero, las rutas. Toca el borne de salida del diferencial y arrastra hasta la barra de neutro. Recto, sin líos.',
    'Bien. Ahora la tierra: del diferencial a la barra PE. Recuerda: neutro y tierra van separados. Cada uno por su canal.'
  ];

  function showTutorialStep(step) {
    S.tutorialStep = step;
    if (step < TUTORIAL_MSGS.length) {
      setFer('happy');
      showEdu(TUTORIAL_MSGS[step], 'happy');

      // Highlight relevant terminals
      const cable = LEVELS[0].cables[step];
      if (cable) {
        const fromEl = cuadroEl.querySelector(`[data-term="${cable.from}"]`);
        const toEl = cuadroEl.querySelector(`[data-term="${cable.to}"]`);
        if (fromEl) fromEl.style.boxShadow = '0 0 14px ' + cable.color;
        if (toEl) toEl.style.boxShadow = '0 0 14px ' + cable.color;
      }
    }
  }

  function startTutorialPhase2() {
    showEdu('Ahora toca etiquetar. Toca el cable azul y ponle su nombre: N de neutro.', 'happy', () => {
      transitionToPhase2();
    });
  }

  // ── Results ──
  function showResults() {
    const inner = $('#res-inner');
    let tier, avSrc, msg;
    if (S.score >= 3000) {
      tier = 'alto'; avSrc = FER.celebrating;
      msg = 'Crack. El cliente ha firmado sin pestañear. Le he dicho que te he enseñado yo.';
    } else if (S.score >= TASK_THRESHOLD) {
      tier = 'medio'; avSrc = FER.happy;
      msg = 'Bien, chaval. El cuadro está limpio. Algún detalle que pulir, pero el cliente ha firmado.';
    } else {
      tier = 'bajo'; avSrc = FER.worried;
      msg = 'Uf. El cliente ha puesto mala cara. Hay que repasar la secuencia: rutas, peine, etiquetas, reservas. En ese orden.';
    }

    let recHTML = '';
    if (S.score > S.record) {
      S.record = S.score;
      localStorage.setItem(RECORD_KEY, S.record);
      recHTML = `<span class="new-rec">¡Nuevo récord! ${S.record} pts</span>`;
    } else {
      recHTML = `Tu mejor marca: ${S.record} pts`;
    }

    inner.innerHTML = `
      <h2>Resultado del encargo</h2>
      <img class="res-av" src="${avSrc}" alt="Fer">
      <div class="wa-bub-static">
        <p>${msg}</p>
        <span class="bub-time">18:02 <span class="bub-check">✓✓</span></span>
      </div>
      <div class="res-score">${S.score} pts</div>
      <div class="res-record">${recHTML}</div>
      ${S.taskCompleted ? '<div style="color:var(--lime);font-weight:700;font-size:16px">¡COMPLETADO!</div>' : ''}
      <button class="cta" onclick="window._restart()">Volver a intentar</button>
    `;
    showScreen('#results');
  }

  // ── INTRO ──
  function renderIntro() {
    $('#intro-inner').innerHTML = `
      <img class="intro-av" src="${FER.happy}" alt="Fer">
      <div class="wa-bub-static">
        <p>Eh, chaval. Me ha surgido otra obra y te dejo solo con el cuadro de la calle Rosales. El cliente viene a las 18:00 a revisar. Necesito rutas limpias, cables peinados, etiquetas que se lean y reservas sin peluca. Si el cliente ve un nido... mejor no lo veas. Venga, que tú puedes.</p>
        <span class="bub-time">15:23 <span class="bub-check">✓✓</span></span>
      </div>
      <button class="cta" id="start-btn">Vamos allá</button>
    `;
    $('#start-btn').onclick = () => {
      showScreen('#play');
      startLevel();
    };
  }

  // ── Help ──
  const HELP = {
    1: 'FASE 1 — Rutas: Arrastra desde cada borne de salida (punto pulsando) hasta su destino. Las líneas punteadas te muestran el camino. Intenta no cruzar cables.',
    2: 'FASE 2 — Etiquetas: El cable resaltado necesita su nombre. Pulsa el botón correcto (N, PE, C1, C2...).',
    3: 'FASE 3 — Reservas: Desliza para ajustar la reserva de cada cable. Ni muy tenso ni peluca — busca el punto OK.'
  };

  function showHelp() {
    showEdu(HELP[S.phase] || HELP[1], 'happy');
  }

  // ── Init ──
  function init() {
    resetState();

    // Wire up edu overlay button
    $('#edu-btn').onclick = dismissEdu;

    // Help button
    $('#help-btn').onclick = showHelp;

    // Global restart
    window._restart = () => {
      resetState();
      touchHandlersAttached = false;
      showScreen('#intro');
      renderIntro();
    };

    renderIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
