/* ================================================================
   SONIA Y LA FÁBRICA DE CAJAS ELÉCTRICAS — Kampe Games — Logic
   ================================================================ */

(function(){
'use strict';

/* ---------- ASSET PATHS ---------- */
const A = {
  sonia_happy:       'assets/sonia_happy.png',
  sonia_celebrating: 'assets/sonia_celebrating.png',
  sonia_worried:     'assets/sonia_worried.png',
  bg_intro:          'assets/background_intro.jpg',
  bg_play:           'assets/background_gameplay.jpg',
  caja_abierta:      'assets/caja_abierta.png',
  caja_cerrada:      'assets/caja_cerrada.png',
  caja_bust:         'assets/caja_bust.png'
};

/* ---------- CABLE POOL ---------- */
const CABLES = [
  {id:'in_cuadro',       name:'Alimentación cuadro',       desc:'Viene del cuadro general',           tag:'IN',  familia:'entrada',     icon:'assets/cable_in_cuadro.jpg'},
  {id:'in_diferencial',  name:'Alimentación diferencial',  desc:'Viene del diferencial',              tag:'IN',  familia:'entrada',     icon:'assets/cable_in_diferencial.jpg'},
  {id:'in_acometida',    name:'Acometida',                 desc:'Acometida desde contador',            tag:'IN',  familia:'entrada',     icon:'assets/cable_in_acometida.jpg'},
  {id:'v1_viajero',      name:'Viajero ida',               desc:'Viajero conmutada — ida',            tag:'V1',  familia:'derivacion',  icon:'assets/cable_v1_viajero.jpg'},
  {id:'v2_viajero',      name:'Viajero vuelta',            desc:'Viajero conmutada — vuelta',         tag:'V2',  familia:'derivacion',  icon:'assets/cable_v2_viajero.jpg'},
  {id:'v1_puente',       name:'Puente bornas',             desc:'Puente entre bornas',                tag:'V1',  familia:'derivacion',  icon:'assets/cable_v1_puente.jpg'},
  {id:'l1_luz_pasillo',  name:'Luz pasillo',               desc:'Línea a luz del pasillo',            tag:'L1',  familia:'salida',      icon:'assets/cable_l1_luz_pasillo.jpg'},
  {id:'l2_luz_cocina',   name:'Luz cocina',                desc:'Línea a luz de cocina',              tag:'L2',  familia:'salida',      icon:'assets/cable_l2_luz_cocina.jpg'},
  {id:'l3_luz_salon',    name:'Luz salón',                 desc:'Línea a luz del salón',              tag:'L3',  familia:'salida',      icon:'assets/cable_l3_luz_salon.jpg'},
  {id:'out_toma_salon',  name:'Toma salón',                desc:'Línea a toma del salón',             tag:'OUT', familia:'salida',      icon:'assets/cable_out_toma_salon.jpg'},
  {id:'out_toma_cocina', name:'Toma cocina',               desc:'Línea a toma de cocina',             tag:'OUT', familia:'salida',      icon:'assets/cable_out_toma_cocina.jpg'},
  {id:'out_horno',       name:'Horno',                     desc:'Línea al horno',                     tag:'OUT', familia:'salida',      icon:'assets/cable_out_horno.jpg'},
  {id:'out_aire',        name:'Aire acondicionado',        desc:'Línea al aire acondicionado',        tag:'OUT', familia:'salida',      icon:'assets/cable_out_aire.jpg'},
  {id:'out_termo',       name:'Termo',                     desc:'Línea al termo',                     tag:'OUT', familia:'salida',      icon:'assets/cable_out_termo.jpg'}
];

const FAMILIAS = ['entrada','derivacion','salida'];
const FAMILIA_LABELS = {entrada:'Entrada', derivacion:'Derivación', salida:'Salida'};

/* ---------- FEEDBACK MESSAGES ---------- */
const FEEDBACK_OK = {
  entrada: 'Bien. Este cable se etiqueta <b>IN</b> — viene del cuadro.',
  derivacion_v: 'Correcto. Los viajeros se etiquetan <b>V1</b> y <b>V2</b> — ida y vuelta.',
  derivacion_p: 'Bien. Los puentes internos se etiquetan <b>V1</b>.',
  salida_l: 'Perfecto. Las líneas de luz se etiquetan <b>L1, L2, L3</b>.',
  salida_out: 'Eso es. Las líneas de fuerza se etiquetan <b>OUT</b>.'
};

function getOkMsg(cable){
  if(cable.familia==='entrada') return FEEDBACK_OK.entrada;
  if(cable.familia==='derivacion') return cable.id.includes('puente') ? FEEDBACK_OK.derivacion_p : FEEDBACK_OK.derivacion_v;
  return cable.tag.startsWith('L') ? FEEDBACK_OK.salida_l : FEEDBACK_OK.salida_out;
}

const FEEDBACK_ERR = {
  'entrada_salida':     'Este cable llega a la caja — es entrada, no salida. Los que van juntos, juntos.',
  'entrada_derivacion': 'La alimentación no es una derivación interna. Va con la familia de entrada.',
  'salida_entrada':     'Este cable sale hacia un punto de consumo. No llega a la caja — va con la familia de salida.',
  'salida_derivacion':  'Este cable va a un aparato o punto de luz — es salida, no derivación interna.',
  'derivacion_entrada': 'Los viajeros son conexiones internas entre elementos. Van con la familia de derivación.',
  'derivacion_salida':  'Aunque el viajero conecta con un interruptor, es un cable interno. Va con derivación.'
};

const BJ_MSGS = [
  'Cuidado, Oompa Loompa. Como hemos visto en la lección, no debes llenar demasiado las cajas. ¿Quieres arriesgar?',
  'Recuerda: una caja ordenada es una caja contratable. Wonka no acepta chapuzas. ¿Seguimos llenando?',
  'En la fábrica, las cajas tienen un cierre suave. No las llenes demasiado o Wonka se enfadará. ¿Seguimos?'
];

/* Tutorial: shown BEFORE pieces 1-5 on first game */
const TUTORIAL = [
  {msg:()=>'Mira el cable que llega. El icono y el texto te dicen qué es. Este cable es de la familia <b>'+FAMILIA_LABELS[currentCable.familia]+'</b>.', when:'before'},
  {msg:()=>'Arrastra el cable a la zona <b>'+FAMILIA_LABELS[currentCable.familia]+'</b> de la caja. Los cables de la misma familia van juntos.', when:'before'},
  {msg:'Mira la barra: cada cable llena un 25% de su zona. Cuando todas las zonas lleguen al 50%, puedes cerrar la caja, pero solo te llevarás la puntuación mínima.', when:'after'},
  {msg:'Vas bien. Si llegas al 75% en cada zona... ¡299 puntos! Eso sí, al 100% la caja no cierra. Recuerda la lección: hay que dejar reserva. ¿Entendido?', when:'after'},
  {msg:'¡Ya lo tienes! A partir de ahora, tú solo.', when:'before'}
];

/* ---------- CONSTANTS ---------- */
const RECORD_KEY = 'sonia_fabrica_cajas_record';
const OBJ_POINTS = 300;
const STEP = 25;

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);

const el = {
  introBg:    $('intro-bg'),
  introAv:    $('intro-av'),
  introMsg:   $('intro-msg'),
  introBtn:   $('intro-btn'),
  playBg:     $('play-bg'),
  hudScore:   $('hud-score'),
  hudObj:     $('hud-obj'),
  pieceZone:  $('piece-zone'),
  cajaImg:    $('caja-img'),
  cajaWrapper:$('caja-wrapper'),
  zoneE:      $('zone-entrada'),
  zoneD:      $('zone-derivacion'),
  zoneS:      $('zone-salida'),
  multInfo:   $('multiplier-info'),
  avatarImg:  $('avatar-img'),
  charMsg:    $('char-msg'),
  charText:   $('char-msg-text'),
  eduBtn:     $('edu-btn'),
  eduOverlay: $('edu-overlay'),
  bjOverlay:  $('bj-overlay'),
  bjMsg:      $('bj-msg'),
  bjScore:    $('bj-score'),
  bjIncentive:$('bj-incentive'),
  bjClose:    $('bj-close'),
  bjContinue: $('bj-continue'),
  boxOverlay: $('box-result-overlay'),
  boxIcon:    $('box-result-icon'),
  boxMsg:     $('box-result-msg'),
  boxPts:     $('box-result-pts'),
  boxBtn:     $('box-result-btn'),
  resBadge:   $('res-badge'),
  resScore:   $('res-score'),
  resRecord:  $('res-record'),
  resNew:     $('res-new'),
  resAv:      $('res-av'),
  resMsg:     $('res-msg'),
  resStats:   $('res-stats'),
  resBtn:     $('res-btn'),
  dragGhost:  $('drag-ghost')
};

/* ---------- STATE ---------- */
let totalScore = 0;
let boxesCompleted = 0;
let boxesBusted = 0;
let taskCompleted = false;
let tutStep = 0;        // 0-4 = tutorial active, >=5 = done
let firstGame = true;
let busy = false;       // blocks drag while showing messages

// Current box state
let zones = {entrada:0, derivacion:0, salida:0};
let cableQueue = [];
let cableIndex = 0;
let currentCable = null;
let isDragging = false;
let piecesPlacedThisBox = 0;
let firstBlackjack = true;

/* ---------- HELPERS ---------- */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.random()*i+1|0;[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr;
}
function pickRandom(arr){return arr[Math.random()*arr.length|0]}
function cablesByFamilia(fam){return CABLES.filter(c=>c.familia===fam)}
function setAvatar(state){el.avatarImg.src = A['sonia_'+state]}

/* ---------- SCREENS ---------- */
function showScreen(name){
  document.querySelectorAll('.scr').forEach(s=>{
    s.classList.toggle('off',s.id!==name);
  });
}

/* ---------- SHUFFLE BAG ---------- */
function buildCableQueue(){
  cableQueue = [];
  if(boxesCompleted===0){
    // First box: balanced 2 per family so 50% is guaranteed
    const g1 = shuffle(FAMILIAS.map(f=>pickRandom(cablesByFamilia(f))));
    const g2 = shuffle(FAMILIAS.map(f=>pickRandom(cablesByFamilia(f))));
    cableQueue.push(...g1,...g2);
  } else {
    // Later boxes: random distribution — player must manage risk
    for(let i=0;i<6;i++){
      cableQueue.push(pickRandom(cablesByFamilia(FAMILIAS[Math.random()*3|0])));
    }
  }
  // Phase 2: more random cables
  for(let i=0;i<6;i++){
    cableQueue.push(pickRandom(cablesByFamilia(FAMILIAS[Math.random()*3|0])));
  }
  cableIndex = 0;
}

function nextCable(){
  if(cableIndex >= cableQueue.length){
    cableQueue.push(pickRandom(cablesByFamilia(FAMILIAS[Math.random()*3|0])));
  }
  currentCable = cableQueue[cableIndex++];
  renderPiece();

  // Tutorial BEFORE pieces 1,2,5 (indices 0,1,4)
  if(firstGame && tutStep < TUTORIAL.length && TUTORIAL[tutStep].when==='before'){
    showTutorialStep();
  }
}

/* ---------- SCORING ---------- */
function calcBoxPoints(){
  let n75 = 0;
  for(const f of FAMILIAS) if(zones[f]>=75) n75++;
  if(n75===3) return 299;
  if(n75===2) return 149;
  if(n75===1) return 99;
  return 75;
}
function allZonesMin50(){return FAMILIAS.every(f=>zones[f]>=50)}
function anyZone100(){return FAMILIAS.some(f=>zones[f]>=100)}

/* ---------- UI UPDATES ---------- */
function updateHUD(){
  el.hudScore.textContent = totalScore+' pts';
  if(totalScore>=OBJ_POINTS){
    el.hudObj.textContent = '¡Completado!';
    el.hudObj.classList.add('hud-obj-done');
  } else {
    el.hudObj.textContent = 'Objetivo: '+OBJ_POINTS+' pts';
    el.hudObj.classList.remove('hud-obj-done');
  }
}

function updateBars(){
  FAMILIAS.forEach(f=>{
    const fill = document.getElementById('fill-'+f);
    const pct = Math.min(zones[f],100);
    fill.style.height = pct+'%';
    fill.classList.remove('green','danger');
    if(pct>=75) fill.classList.add('danger');
    else if(pct>=50) fill.classList.add('green');
    // Percentage label
    let lbl = fill.parentElement.querySelector('.zone-pct');
    if(!lbl){lbl=document.createElement('div');lbl.className='zone-pct';fill.parentElement.appendChild(lbl)}
    lbl.textContent = pct+'%';
  });
}

function updateMultiplierInfo(){
  if(!allZonesMin50()){el.multInfo.textContent='';return}
  const p=calcBoxPoints();
  el.multInfo.innerHTML = p>=299
    ? '¡<b>'+p+' pts</b> si cierras ahora!'
    : '<b>'+p+' pts</b> si cierras ahora';
}

/* ---------- PIECE RENDERING ---------- */
function renderPiece(){
  if(!currentCable){el.pieceZone.innerHTML='';return}
  el.pieceZone.innerHTML = `
    <div class="piece-card pop-in" id="current-piece">
      <img class="piece-icon" src="${currentCable.icon}" alt="${currentCable.name}" onerror="this.style.background='rgba(255,255,255,.2)'">
      <div>
        <div class="piece-text">${currentCable.name}</div>
        <div class="piece-hint">${currentCable.desc}</div>
      </div>
    </div>`;
  bindDrag();
}

function clearPiece(){el.pieceZone.innerHTML=''}

/* ---------- DRAG & DROP ---------- */
function bindDrag(){
  const p = document.getElementById('current-piece');
  if(!p) return;
  p.addEventListener('touchstart',onDragStart,{passive:false});
  p.addEventListener('mousedown',onDragStart);
}

function onDragStart(e){
  e.preventDefault();
  if(isDragging||busy) return;
  isDragging = true;
  const p = document.getElementById('current-piece');
  if(p) p.classList.add('dragging');
  const pt = e.touches?e.touches[0]:e;
  const g = el.dragGhost;
  g.innerHTML = `<img class="drag-ghost-icon" src="${currentCable.icon}" alt="" onerror="this.style.background='rgba(255,255,255,.2)'"><span class="drag-ghost-text">${currentCable.name}</span>`;
  g.classList.add('active');
  g.classList.remove('hidden');
  moveGhost(pt.clientX,pt.clientY);
  document.addEventListener('touchmove',onDragMove,{passive:false});
  document.addEventListener('mousemove',onDragMove);
  document.addEventListener('touchend',onDragEnd);
  document.addEventListener('mouseup',onDragEnd);
}

function moveGhost(x,y){el.dragGhost.style.left=(x-60)+'px';el.dragGhost.style.top=(y-30)+'px'}

function onDragMove(e){
  e.preventDefault();
  const pt=e.touches?e.touches[0]:e;
  moveGhost(pt.clientX,pt.clientY);
  highlightZone(pt.clientX,pt.clientY);
}

function highlightZone(x,y){
  document.querySelectorAll('.caja-zone').forEach(z=>z.classList.remove('highlight'));
  const z=getZoneUnder(x,y);
  if(z) z.classList.add('highlight');
}

function getZoneUnder(x,y){
  for(const z of [el.zoneE,el.zoneD,el.zoneS]){
    const r=z.getBoundingClientRect();
    if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return z;
  }
  return null;
}

function onDragEnd(e){
  if(!isDragging) return;
  isDragging = false;
  document.removeEventListener('touchmove',onDragMove);
  document.removeEventListener('mousemove',onDragMove);
  document.removeEventListener('touchend',onDragEnd);
  document.removeEventListener('mouseup',onDragEnd);
  el.dragGhost.classList.remove('active');
  el.dragGhost.classList.add('hidden');
  document.querySelectorAll('.caja-zone').forEach(z=>z.classList.remove('highlight'));
  const p=document.getElementById('current-piece');
  if(p) p.classList.remove('dragging');
  const pt=e.changedTouches?e.changedTouches[0]:e;
  const zoneEl=getZoneUnder(pt.clientX,pt.clientY);
  if(!zoneEl) return; // dropped outside
  placeCable(zoneEl.dataset.zone);
}

/* ---------- CABLE PLACEMENT ---------- */
function placeCable(zone){
  const correct = currentCable.familia===zone;

  if(correct){
    zones[zone] += STEP;
    piecesPlacedThisBox++;
    updateBars();
    updateMultiplierInfo();
    clearPiece();
    zoneFlash(zone,'highlight');
    // Show brief OK feedback (auto-dismiss unless tutorial)
    const needBtn = firstGame && tutStep>=2 && tutStep<=3;
    showSoniaMsg(getOkMsg(currentCable),'happy', needBtn, ()=>{
      // After OK feedback, maybe show tutorial "after" step
      if(firstGame && tutStep < TUTORIAL.length && TUTORIAL[tutStep].when==='after'){
        showTutorialStep(()=>afterPlacement());
      } else {
        afterPlacement();
      }
    });
  } else {
    // Wrong zone — cable bounces back, show educational feedback
    zoneFlash(zone,'wrong-highlight');
    const errKey = currentCable.familia+'_'+zone;
    const msg = FEEDBACK_ERR[errKey]||'Este cable va en otra zona.';
    showSoniaMsg(msg,'worried', true, ()=>{
      renderPiece(); // return cable to top for retry
    });
  }
}

function afterPlacement(){
  // Check bust
  if(anyZone100()){
    bust();
    return;
  }
  // Check Blackjack
  if(allZonesMin50()){
    showBlackjackDecision();
    return;
  }
  nextCable();
}

function zoneFlash(zone,cls){
  const z=document.getElementById('zone-'+zone);
  z.classList.add(cls);
  setTimeout(()=>z.classList.remove(cls),600);
}

/* ---------- SONIA MESSAGES ---------- */
function showSoniaMsg(html, state, needBtn, onDone){
  busy = true;
  setAvatar(state);
  el.charText.innerHTML = html;
  el.charMsg.classList.add('show');
  el.eduOverlay.classList.add('show');

  if(needBtn){
    el.eduBtn.style.display = 'block';
    el.eduBtn.onclick = ()=>{
      hideSoniaMsg();
      if(onDone) onDone();
    };
  } else {
    el.eduBtn.style.display = 'none';
    setTimeout(()=>{
      hideSoniaMsg();
      if(onDone) onDone();
    }, 1800);
  }
}

function hideSoniaMsg(){
  busy = false;
  el.charMsg.classList.remove('show');
  el.eduOverlay.classList.remove('show');
  el.eduBtn.style.display = 'none';
}

/* ---------- TUTORIAL ---------- */
function showTutorialStep(onDone){
  if(tutStep >= TUTORIAL.length) {if(onDone) onDone(); return}
  const t = TUTORIAL[tutStep];
  tutStep++;
  const msg = typeof t.msg==='function' ? t.msg() : t.msg;
  showSoniaMsg(msg, 'happy', true, ()=>{
    if(onDone) onDone();
  });
}

/* ---------- BLACKJACK DECISION ---------- */
function showBlackjackDecision(){
  el.bjOverlay.classList.remove('hidden');
  if(firstBlackjack){
    firstBlackjack = false;
    el.bjMsg.textContent = '¡Bien, Oompa Loompa! Esta caja ya se puede cerrar. Pero puedes aprovechar más el espacio para ganar más puntos... sin pasarte, que al 100% la caja no cierra.';
  } else {
    el.bjMsg.textContent = pickRandom(BJ_MSGS);
  }
  const p=calcBoxPoints();
  // Show current score + what closing now gives
  el.bjScore.textContent = 'Cerrar ahora: +'+p+' pts';
  // Show what next tier would give
  if(p<99) el.bjIncentive.textContent = '... o sigue llenando: hasta 99, 149 o 299 pts!';
  else if(p<149) el.bjIncentive.textContent = '... o sigue llenando: hasta 149 o 299 pts!';
  else if(p<299) el.bjIncentive.textContent = '... o sigue llenando: hasta 299 pts!';
  else el.bjIncentive.textContent = '¡Máximo! Cierra para asegurar.';
}

function closeBox(){
  el.bjOverlay.classList.add('hidden');
  const pts = calcBoxPoints();
  totalScore += pts;
  boxesCompleted++;
  updateHUD();
  checkTaskCompleted();
  showBoxResult(pts, false);
}

function continueBox(){
  el.bjOverlay.classList.add('hidden');
  nextCable();
}

let justCompletedTask = false;
function checkTaskCompleted(){
  if(!taskCompleted && totalScore>=OBJ_POINTS){
    taskCompleted = true;
    justCompletedTask = true;
    try{window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}))}catch(e){}
  }
}

/* ---------- BUST ---------- */
function bust(){
  boxesBusted++;
  el.cajaImg.src = A.caja_bust;
  el.multInfo.textContent = '';
  showSoniaMsg('¡Demasiado llena! Si Wonka ve esto... hay que dejar margen de manipulación, Oompa Loompa.','worried', true, ()=>{
    showBoxResult(0, true);
  });
}

/* ---------- BOX RESULT ---------- */
function showBoxResult(pts, isBust){
  el.boxOverlay.classList.remove('hidden');
  if(isBust){
    el.boxIcon.textContent = '';
    el.boxMsg.textContent = 'La caja no se puede cerrar. 0 puntos. Fin de partida.';
    el.boxPts.textContent = '0 pts';
    el.boxPts.classList.add('bust');
    el.boxBtn.textContent = 'Ver resultados';
    el.boxBtn.onclick = ()=>{ el.boxOverlay.classList.add('hidden'); showResults(); };
  } else {
    el.boxIcon.textContent = '';
    el.boxMsg.textContent = pts>=299
      ? '¡INCREÍBLE! 75% en cada zona. ¡Puntuación máxima!'
      : '¡Caja cerrada! Eso es una caja contratable.';
    el.boxPts.textContent = '+'+pts+' pts';
    el.boxPts.classList.remove('bust');
    el.cajaImg.src = A.caja_cerrada;
    setAvatar('celebrating');
    el.avatarImg.style.zIndex = '120';
    el.avatarImg.style.left = '50%';
    el.avatarImg.style.transform = 'translateX(-50%)';
    el.avatarImg.style.height = '28%';
    el.avatarImg.style.top = '36px';
    el.boxBtn.textContent = 'Siguiente caja';
    el.boxBtn.onclick = nextBox;
  }
}

function nextBox(){
  el.boxOverlay.classList.add('hidden');
  el.avatarImg.style.zIndex = '';
  el.avatarImg.style.left = '';
  el.avatarImg.style.transform = '';
  el.avatarImg.style.height = '';
  el.avatarImg.style.top = '';
  zones = {entrada:0, derivacion:0, salida:0};
  piecesPlacedThisBox = 0;
  el.cajaImg.src = A.caja_abierta;
  updateBars();
  updateMultiplierInfo();
  setAvatar('happy');
  buildCableQueue();
  if(justCompletedTask){
    justCompletedTask = false;
    showSoniaMsg('¡Objetivo cumplido, Oompa Loompa! Pero en esta fábrica siempre hay más cajas... ¡a ver hasta dónde llegas!','celebrating', true, ()=>{ nextCable(); });
  } else {
    nextCable();
  }
}

/* ---------- RESULTS SCREEN ---------- */
function showResults(){
  const record = parseInt(localStorage.getItem(RECORD_KEY)||'0',10);
  const isNew = totalScore>record;
  if(isNew) localStorage.setItem(RECORD_KEY,totalScore);
  const best = Math.max(record,totalScore);

  showScreen('results');
  el.resBadge.textContent = totalScore>=OBJ_POINTS ? 'NIVEL SUPERADO' : 'FIN DE PARTIDA';
  el.resScore.textContent = totalScore;
  el.resRecord.textContent = best;
  el.resNew.classList.toggle('hidden',!isNew);

  if(totalScore>=600){
    el.resAv.src = A.sonia_celebrating;
    el.resMsg.innerHTML = 'Wonka estaría orgulloso. ¡Eres el mejor Oompa Loompa que ha pasado por mi fábrica!';
  } else if(totalScore>=OBJ_POINTS){
    el.resAv.src = A.sonia_celebrating;
    el.resMsg.innerHTML = '¡Objetivo cumplido! Buen trabajo, Oompa Loompa. La fábrica sigue funcionando gracias a ti.';
  } else {
    el.resAv.src = A.sonia_worried;
    el.resMsg.innerHTML = 'La fábrica necesita más práctica, Oompa Loompa. Recuerda: cada cable tiene su familia y su sitio.';
  }
  el.resStats.textContent = boxesCompleted+' cajas cerradas \u00B7 '+boxesBusted+' cajas fallidas';
}

/* ---------- START / RESTART ---------- */
function startGame(){
  totalScore = 0;
  boxesCompleted = 0;
  boxesBusted = 0;
  taskCompleted = false;
  piecesPlacedThisBox = 0;
  if(!firstGame) tutStep = TUTORIAL.length;

  zones = {entrada:0, derivacion:0, salida:0};
  updateHUD();
  updateBars();
  updateMultiplierInfo();
  setAvatar('happy');
  el.cajaImg.src = A.caja_abierta;

  showScreen('play');
  buildCableQueue();

  // Tutorial step 0: "Mira el cable..." — show before first piece
  if(firstGame && tutStep===0){
    // Reveal first piece, then show tutorial
    nextCable(); // will trigger showTutorialStep because tutStep 0 is 'before'
  } else {
    nextCable();
  }
}

/* ---------- INIT ---------- */
function init(){
  el.introBg.src = A.bg_intro;
  el.playBg.src = A.bg_play;
  el.introAv.src = A.sonia_happy;
  el.avatarImg.src = A.sonia_happy;
  el.cajaImg.src = A.caja_abierta;
  el.introMsg.innerHTML = '¡Oompa Loompa! Necesito tu ayuda en la fábrica. Hay que montar las <b>cajas eléctricas</b> y cada cable tiene su sitio. Clasifica bien los cables, llena las cajas sin pasarte... y no me hagas quedar mal con Wonka. ¿Listo?';

  el.introBtn.addEventListener('click', startGame);
  el.bjClose.addEventListener('click', closeBox);
  el.bjContinue.addEventListener('click', continueBox);
  el.boxBtn.addEventListener('click', nextBox);
  el.resBtn.addEventListener('click', ()=>{
    firstGame = false;
    startGame();
  });

  showScreen('intro');
}

init();

})();
