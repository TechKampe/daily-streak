/* ============================================================
   La Mudanza — S4D2-AM (Redes) · Integración de red + SAI
   Vanilla HTML5/CSS3/JS. Ver GDD_LA_MUDANZA.md.
   3 fases (cadena → distancias → alimentación) + apagón final.
   ============================================================ */

'use strict';

/* ---------- Config (ver GDD §9) ---------- */
const CFG = {
  DRAG_START: 8, SNAP_TOL: 30, PORT_TOL_SRC: 30, PORT_TOL_DST: 36,
  MAX_SW_PANEL: 3, MAX_PANEL_ROSETA: 90, MAX_ROSETA_TERM: 6,
  SLIDER_SW_PANEL: 6, SLIDER_PANEL_ROSETA: 140, SLIDER_ROSETA_TERM: 12,
  SAI_CAP: 100, SAI_CRIT_TOTAL: 80,
  PTS_ORDER: 100, PTS_DIST: 100, PTS_CABLE: 50, PTS_POWER: 150, BONUS_BLACKOUT: 200,
  MAX_SCORE: 3650, TASK_THRESHOLD: 2190, TIER_HIGH: 2920, TIER_MID: 2190,
};

const RECORD_KEY = 'la_mudanza_record';

/* ---------- Assets (rellenar con URLs Cloudinary al integrar) ----------
   Si una URL está vacía, se dibuja un placeholder CSS/emoji para que el
   juego sea jugable sin imágenes. */
const CLD='https://res.cloudinary.com/kampe/image/upload/';
const ASSETS = {
  // Vega + rack + roseta reutilizados de S4D1 (kampe/game_assets/s4d1_redes)
  vega_happy:        CLD+'v1780487714/vega_happy_pfvzas.png',
  vega_celebrating:  CLD+'v1780487621/vega_celebrating_asjumn.png',
  vega_worried:      CLD+'v1780487620/vega_worried_wf1qeg.png',
  rack:              CLD+'v1780560352/rack_wyomvy.png',
  roseta:            CLD+'v1780487608/roseta_ddbguh.png',
  // Nuevos S4D2 (kampe/game_assets/S4D2_ELEC)
  el_switch:         CLD+'v1780586184/el_switch_akzha4.png',
  el_patchpanel:     CLD+'v1780585737/el_patchpanel_v8qvgg.png',
  el_sai:            CLD+'v1780585739/el_sai_rauflh.png',
  el_terminal:       CLD+'v1780585737/el_terminal_qdst1c.png',
  el_pc:             CLD+'v1780589112/el_pc_solo_cvzdvj.png',
  el_voip:           CLD+'v1780585871/el_voip_a75w4r.png',
  el_impresora:      CLD+'v1780585759/el_impresora_bw1237.png',
  el_microondas:     CLD+'v1780585758/el_microondas_w4kgkk.png',
  el_router:         CLD+'v1780588959/el_router_vf92lg.png',
  el_server:         CLD+'v1780588944/el_server_o8d1fc.png',
  el_cams:           CLD+'v1780589055/el_cams_remhhs.png',
};
const EMOJI = {
  rack:'🗄️', roseta:'🔌', el_switch:'🔀', el_patchpanel:'▦', el_sai:'🔋',
  el_terminal:'🖥️', el_pc:'💻', el_voip:'☎️', el_impresora:'🖨️', el_microondas:'📟',
};

/* ---------- Posiciones de planta (fracción 0..1) — GDD §5.1 ----------
   Layout en filas: switch y panel arriba (rack), 4 rosetas en una fila,
   4 terminales en la fila de abajo. Cables legibles, sin cruces. */
const POS = {
  portSwitch:  {x:.20, y:.09},
  portPanel:   {x:.20, y:.22},
  rosetas: [
    {x:.16, y:.46}, {x:.37, y:.46}, {x:.58, y:.46}, {x:.79, y:.46},
  ],
  terminals: [
    {x:.16, y:.70}, {x:.37, y:.70}, {x:.58, y:.70}, {x:.79, y:.70},
  ],
};

/* ---------- Tramos (fase 2) — GDD §5.2 ----------
   type: 'sw_panel' | 'panel_roseta' | 'roseta_term'
   def: valor de arranque del slider · cable: 'lat' | 'fix' */
const TRAMOS = [
  {id:'t_sw',  type:'sw_panel',     label:'switch → patch panel', max:3,  def:2.4, cable:'lat'},
  {id:'t_pr1', type:'panel_roseta', label:'patch panel → roseta P1', max:90, def:110, cable:'fix'},
  {id:'t_pr2', type:'panel_roseta', label:'patch panel → roseta P2', max:90, def:70,  cable:'fix'},
  {id:'t_pr3', type:'panel_roseta', label:'patch panel → roseta P3', max:90, def:120, cable:'fix'},
  {id:'t_pr4', type:'panel_roseta', label:'patch panel → roseta P4', max:90, def:55,  cable:'fix'},
  {id:'t_rt1', type:'roseta_term',  label:'roseta P1 → terminal', max:6, def:8,   cable:'lat'},
  {id:'t_rt2', type:'roseta_term',  label:'roseta P2 → terminal', max:6, def:4,   cable:'lat'},
  {id:'t_rt3', type:'roseta_term',  label:'roseta P3 → terminal', max:6, def:9,   cable:'lat'},
  {id:'t_rt4', type:'roseta_term',  label:'roseta P4 → terminal', max:6, def:3.5, cable:'lat'},
];
function sliderMax(type){
  return type==='sw_panel'?CFG.SLIDER_SW_PANEL:type==='panel_roseta'?CFG.SLIDER_PANEL_ROSETA:CFG.SLIDER_ROSETA_TERM;
}
function tramoLegalMax(type){
  return type==='sw_panel'?CFG.MAX_SW_PANEL:type==='panel_roseta'?CFG.MAX_PANEL_ROSETA:CFG.MAX_ROSETA_TERM;
}

/* ---------- Equipos (fase 3) — un ejemplo de cada tipo (8) ----------
   icon: clave de ASSETS si hay imagen propia; emoji: fallback. */
const EQUIPOS = [
  {id:'switch', name:'Switch',        icon:'el_switch',     emoji:'🔀', crit:true,  load:20},
  {id:'router', name:'Router',        icon:'el_router',     emoji:'📶', crit:true,  load:12},
  {id:'server', name:'Servidor/NAS',  icon:'el_server',     emoji:'🖧', crit:true,  load:30},
  {id:'cams',   name:'Cámaras',       icon:'el_cams',       emoji:'📹', crit:true,  load:18},
  {id:'voip',   name:'Teléfono VoIP', icon:'el_voip',       emoji:'☎️', crit:true,  load:10},
  {id:'pc',     name:'PC + monitor',  icon:'el_pc',         emoji:'💻', crit:false, load:0},
  {id:'print',  name:'Impresora',     icon:'el_impresora',  emoji:'🖨️', crit:false, load:110, absurd:true},
  {id:'micro',  name:'Microondas',    icon:'el_microondas', emoji:'📟', crit:false, load:120, absurd:true},
];

/* ---------- Estado ---------- */
const S = {
  phase: 0,
  score: 0,
  critSaved: 0, critTotal: 5,
  saiLoad: 0,
  chain: {},           // fase 1: estado de conexiones
  tramoState: {},      // id -> {dist, cable, done}
  assign: {},          // fase 3: equipoId -> 'red' | 'white'
  groupIdx: 0,         // fase 3: grupo de equipos actual
  tramoPending: 0,     // fase 2: tramos con ⚠ por resolver
};

/* ---------- Háptica (GDD §4.8) ---------- */
function vibrate(level, pattern){
  if(!window.ReactNativeWebView){
    if(navigator.vibrate && pattern) navigator.vibrate(pattern);
    else if(navigator.vibrate) navigator.vibrate(level==='error'?200:30);
    return;
  }
  const msg={action:'VIBRATE',level}; if(pattern) msg.pattern=pattern;
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

/* ---------- TASK_COMPLETED ---------- */
let taskFired=false;
function fireTaskCompleted(){
  if(taskFired) return; taskFired=true;
  if(window.ReactNativeWebView)
    window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}));
}

/* ---------- Record ---------- */
function getRecord(){ return parseInt(localStorage.getItem(RECORD_KEY)||'0',10); }
function setRecord(v){ if(v>getRecord()) localStorage.setItem(RECORD_KEY,String(v)); }

/* ---------- Navegación ---------- */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.documentElement.className = (id==='results') ? 'results' : 'gameplay';
}

/* ---------- Puntuación ---------- */
function addScore(pts){ S.score+=pts; const el=document.getElementById('score'); if(el) el.textContent=S.score+' pts'; }

/* ---------- Avatar / burbuja ---------- */
let vegaHidden=false; // en fases 2 y 3 Vega no aparece
function hideVega(){ vegaHidden=true; const a=document.getElementById('avatarGame'); a.style.display='none';
  document.getElementById('gameSpeech').classList.remove('show'); }
function showVega(){ vegaHidden=false; const a=document.getElementById('avatarGame'); a.style.display=''; a.style.visibility='visible'; }
function setAvatar(id, state){
  const el=document.getElementById(id); if(!el) return;
  // si es la Vega de gameplay y está marcada como oculta, solo cambia src (no reactiva display)
  if(id==='avatarGame' && vegaHidden){ if(ASSETS[state]) el.src=ASSETS[state]; return; }
  if(ASSETS[state]){ el.src=ASSETS[state]; el.style.display=''; }
  else { el.style.display='none'; }
}
function say(text, ms){
  const el=document.getElementById('gameSpeech'); el.textContent=text; el.classList.add('show');
  if(ms){ clearTimeout(say._t); say._t=setTimeout(()=>el.classList.remove('show'), ms); }
}

/* ---------- Briefing / transición: Vega grande + burbuja al lado ----------
   Durante el gameplay Vega va pequeña (avatar-game). En las transiciones
   entre fases se muestra este overlay a pantalla completa con Vega grande. */
function briefing(text, state, onDone){
  const ov=document.getElementById('briefOverlay');
  document.getElementById('briefBubble').textContent=text;
  const av=document.getElementById('briefAvatar');
  if(ASSETS[state||'vega_happy']) av.src=ASSETS[state||'vega_happy'];
  ov.classList.add('show');
  // ocultar la Vega pequeña mientras está el briefing
  document.getElementById('avatarGame').style.visibility='hidden';
  document.getElementById('gameSpeech').classList.remove('show');
  document.getElementById('briefBtn').onclick=()=>{
    ov.classList.remove('show');
    document.getElementById('avatarGame').style.visibility='visible';
    if(onDone) onDone();
  };
}

/* ---------- Partículas de éxito (patrón compartido del proyecto) ---------- */
function successBurst(x, y){
  const N=20, colors=['#04FFB4','#00E6BC','#C5FFDF','#FFFFAB','#FFFFFF'];
  const frag=document.createDocumentFragment(); const nodes=[];
  for(let i=0;i<N;i++){
    const p=document.createElement('div'); p.className='particle';
    const ang=(Math.PI*2*i)/N+(i%2?0.3:0); const dist=60+(i%5)*20;
    p.style.left=x+'px'; p.style.top=y+'px'; p.style.background=colors[i%colors.length];
    p.style.setProperty('--dx',(Math.cos(ang)*dist).toFixed(0)+'px');
    p.style.setProperty('--dy',(Math.sin(ang)*dist).toFixed(0)+'px');
    frag.appendChild(p); nodes.push(p);
  }
  document.body.appendChild(frag);
  requestAnimationFrame(()=>requestAnimationFrame(()=>nodes.forEach(p=>p.classList.add('go'))));
  setTimeout(()=>nodes.forEach(p=>p.remove()), 800);
}
function flashAt(x,y){
  const f=document.createElement('div'); f.className='success-flash';
  f.style.left=x+'px'; f.style.top=y+'px'; document.body.appendChild(f);
  requestAnimationFrame(()=>requestAnimationFrame(()=>f.classList.add('go')));
  setTimeout(()=>f.remove(), 500);
}
function burstAtNode(elId){
  const el=document.getElementById(elId)||document.querySelector('.avatar-game');
  if(!el) return; const r=el.getBoundingClientRect();
  successBurst(r.left+r.width/2, r.top+r.height/2);
}
/* Vega celebra brevemente y vuelve a happy (durante gameplay va en happy) */
function celebrateBriefly(ms){
  setAvatar('avatarGame','vega_celebrating');
  clearTimeout(celebrateBriefly._t);
  celebrateBriefly._t=setTimeout(()=>setAvatar('avatarGame','vega_happy'), ms||1200);
}
function pill(text){ document.getElementById('pill').textContent=text; }
function setPhaseLabel(n){ document.getElementById('phaseLabel').textContent='Montaje · Fase '+n+'/3'; updateProgress(n); }
function updateProgress(active){
  document.querySelectorAll('.progress-seg').forEach(seg=>{
    const p=+seg.dataset.phase;
    seg.classList.toggle('done', p<active);
    seg.classList.toggle('active', p===active);
  });
}

/* ---------- Feedback educativo bloqueante (GDD §4.7) ---------- */
const ERRORS = {
  E_ORDER:{t:'Conexión fuera de orden',what:'Conectaste saltándote un elemento de la cadena.',why:'El switch comunica y el patch panel organiza: el cableado fijo siempre pasa por el panel antes de llegar al puesto.',rule:'El recorrido es switch → patch panel → roseta → terminal.',doIt:'Conecta primero al elemento anterior de la cadena.'},
  E_DIST:{t:'Distancia excedida',what:'Ese tramo supera la distancia máxima.',why:'Pasarse de longitud causa pérdidas, errores y fallos intermitentes que no se certifican.',rule:'switch→panel ≤3m · panel→roseta ≤90m · roseta→terminal ≤6m.',doIt:'Baja la distancia del tramo por debajo de su máximo.'},
  E_CABLE:{t:'Cable equivocado',what:'Usaste el cable equivocado para este tramo.',why:'El latiguillo es flexible para conectar equipos; el cableado fijo estructura la instalación. No son intercambiables.',rule:'Equipos (switch→panel, roseta→terminal) = latiguillo. Obra (panel→roseta) = cable fijo.',doIt:'Cambia el tipo de cable de este tramo.'},
};
function showEdu(code, cb){
  const e=ERRORS[code]; if(!e) return;
  document.getElementById('eduTitle').textContent=e.t;
  document.getElementById('eduWhat').textContent=e.what;
  document.getElementById('eduWhy').textContent=e.why;
  document.getElementById('eduRule').textContent=e.rule;
  document.getElementById('eduDo').textContent=e.doIt;
  const ov=document.getElementById('eduOverlay'); ov.classList.add('show');
  vibrate('error',[0,120,60,120]);
  setAvatar('avatarGame','vega_worried');
  document.getElementById('eduBtn').onclick=()=>{
    ov.classList.remove('show'); setAvatar('avatarGame','vega_happy'); if(cb) cb();
  };
}

/* ---------- Geometría de planta ---------- */
let floorRect={x:0,y:0,w:0,h:0};
function measureFloor(){
  const f=document.getElementById('floor'); const r=f.getBoundingClientRect();
  floorRect={x:r.left, y:r.top, w:r.width, h:r.height};
}
function P(frac){ return {x:floorRect.w*frac.x, y:floorRect.h*frac.y}; } // px relativo a floor

/* ---------- Canvas ---------- */
let ctx, canvas;
function setupCanvas(){
  canvas=document.getElementById('cables'); ctx=canvas.getContext('2d');
  resizeCanvas();
}
function resizeCanvas(){
  if(!canvas) return;
  const dpr=window.devicePixelRatio||1;
  canvas.width=floorRect.w*dpr; canvas.height=floorRect.h*dpr;
  canvas.style.width=floorRect.w+'px'; canvas.style.height=floorRect.h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawCables();
}
/* cables dibujados (lista de {a:{x,y},b:{x,y},color}) */
let cableLines=[];
function drawCables(){
  if(!ctx) return;
  ctx.clearRect(0,0,floorRect.w,floorRect.h);
  cableLines.forEach(l=>{
    ctx.strokeStyle=l.color||'#00E6BC'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(l.a.x,l.a.y); ctx.lineTo(l.b.x,l.b.y); ctx.stroke();
  });
  if(tracePts.length>1){
    ctx.strokeStyle='#04FFB4'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(tracePts[0].x,tracePts[0].y);
    for(let i=1;i<tracePts.length;i++) ctx.lineTo(tracePts[i].x,tracePts[i].y);
    ctx.stroke();
  }
}

/* ============================================================
   FASE 1 — Montar la cadena (GDD §4.3)
   ============================================================ */
/* Construcción simplificada: los elementos se "auto-colocan" en su sitio
   al avanzar; el jugador TRAZA las conexiones en orden. Cada trazo válido
   añade un eslabón. 9 conexiones: 1 sw→panel, 4 panel→roseta, 4 roseta→term. */

let nodes={};   // id -> {x,y,el,placed}
let conns=[];   // lista de conexiones hechas {from,to}
const CHAIN_STEPS = [
  {from:'switch', to:'panel'},
  {from:'panel', to:'roseta0'},{from:'roseta0', to:'term0'},
  {from:'panel', to:'roseta1'},{from:'roseta1', to:'term1'},
  {from:'panel', to:'roseta2'},{from:'roseta2', to:'term2'},
  {from:'panel', to:'roseta3'},{from:'roseta3', to:'term3'},
];
let chainStep=0;

function nodePos(id){
  if(id==='switch') return P(POS.portSwitch);
  if(id==='panel')  return P(POS.portPanel);
  if(id.startsWith('roseta')) return P(POS.rosetas[+id.slice(6)]);
  if(id.startsWith('term'))   return P(POS.terminals[+id.slice(4)]);
  return {x:0,y:0};
}

function buildPhase1DOM(){
  const floor=document.getElementById('floor');
  // limpiar nodos previos
  floor.querySelectorAll('.node').forEach(n=>n.remove());
  nodes={}; conns=[]; cableLines=[]; chainStep=0;
  const defs=[
    {id:'switch', icon:'el_switch', label:'Switch'},
    {id:'panel',  icon:'el_patchpanel', label:'Panel'},
    {id:'roseta0',icon:'roseta', label:'P1'},{id:'term0', icon:'el_terminal', label:''},
    {id:'roseta1',icon:'roseta', label:'P2'},{id:'term1', icon:'el_terminal', label:''},
    {id:'roseta2',icon:'roseta', label:'P3'},{id:'term2', icon:'el_terminal', label:''},
    {id:'roseta3',icon:'roseta', label:'P4'},{id:'term3', icon:'el_terminal', label:''},
  ];
  defs.forEach(d=>{
    const pos=nodePos(d.id);
    const el=document.createElement('div'); el.className='node'; el.dataset.id=d.id;
    el.style.left=pos.x+'px'; el.style.top=pos.y+'px';
    if(ASSETS[d.icon]){ const im=document.createElement('img'); im.src=ASSETS[d.icon]; el.appendChild(im); }
    else { el.textContent=EMOJI[d.icon]||'●'; el.classList.add('node-emoji'); }
    if(d.label){ const lb=document.createElement('span'); lb.className='node-label'; lb.textContent=d.label; el.appendChild(lb); }
    floor.appendChild(el);
    nodes[d.id]={x:pos.x,y:pos.y,el};
  });
  highlightStep();
}

function highlightStep(){
  Object.values(nodes).forEach(n=>n.el.classList.remove('hl-src','hl-dst'));
  if(chainStep>=CHAIN_STEPS.length) return;
  const st=CHAIN_STEPS[chainStep];
  nodes[st.from].el.classList.add('hl-src');
  nodes[st.to].el.classList.add('hl-dst');
  pill('Conecta: '+labelOf(st.from)+' → '+labelOf(st.to));
}
function labelOf(id){
  if(id==='switch')return'switch'; if(id==='panel')return'patch panel';
  if(id.startsWith('roseta'))return'roseta '+'P'+(+id.slice(6)+1);
  if(id.startsWith('term'))return'terminal '+'P'+(+id.slice(4)+1); return id;
}

/* Trazado con el dedo */
let tracing=false, traceFrom=null, tracePts=[];
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function localPt(ev){
  const t=ev.touches?ev.touches[0]:ev;
  return {x:t.clientX-floorRect.x, y:t.clientY-floorRect.y};
}
function nearestNode(pt, maxD){
  let best=null,bd=maxD;
  for(const id in nodes){ const d=dist(pt,nodes[id]); if(d<bd){bd=d;best=id;} }
  return best;
}

function onTraceStart(ev){
  if(S.phase!==1) return;
  const pt=localPt(ev);
  const id=nearestNode(pt, CFG.PORT_TOL_SRC+10);
  if(id===null) return;
  ev.preventDefault();
  tracing=true; traceFrom=id; tracePts=[{x:nodes[id].x,y:nodes[id].y}];
  vibrate('light');
}
function onTraceMove(ev){
  if(!tracing) return;
  ev.preventDefault();
  const pt=localPt(ev); tracePts.push(pt); drawCables();
}
function onTraceEnd(ev){
  if(!tracing) return;
  tracing=false;
  const pt=tracePts[tracePts.length-1];
  const to=nearestNode(pt, CFG.PORT_TOL_DST);
  tracePts=[];
  if(to===null || to===traceFrom){ drawCables(); return; } // soltó al aire
  validateConnection(traceFrom, to);
  drawCables();
}

function validateConnection(from, to){
  const expected=CHAIN_STEPS[chainStep];
  // ¿coincide con el eslabón esperado (en cualquier orden de from/to)?
  const ok = (from===expected.from && to===expected.to) || (from===expected.to && to===expected.from);
  if(ok){
    addCable(expected.from, expected.to, '#00E6BC');
    addScore(CFG.PTS_ORDER);
    vibrate('success');
    // partículas en el nodo destino + Vega celebra brevemente y vuelve a happy
    const dn=nodes[to]&&nodes[to].el; if(dn){const r=dn.getBoundingClientRect(); successBurst(r.left+r.width/2, r.top+r.height/2);}
    celebrateBriefly();
    say(rot(ACIERTO_CONN), 1400);
    chainStep++;
    if(chainStep>=CHAIN_STEPS.length){ setTimeout(endPhase1, 700); }
    else highlightStep();
  } else {
    // intento de saltar un eslabón → E_ORDER
    showEdu('E_ORDER');
  }
}
function addCable(a,b,color){
  conns.push({from:a,to:b});
  cableLines.push({a:{x:nodes[a].x,y:nodes[a].y}, b:{x:nodes[b].x,y:nodes[b].y}, color});
}

const ACIERTO_CONN=['¡Eslabón listo! Así, en orden.','Limpio. Switch, panel, roseta, terminal.','Un puesto menos. 👌'];
let _rot=0; function rot(arr){ return arr[(_rot++)%arr.length]; }

function startPhase1(){
  S.phase=1; setPhaseLabel(1);
  // fase 1 no usa bandeja: planta a pantalla completa
  document.getElementById('floor').classList.add('tall');
  document.getElementById('tray').style.display='none';
  measureFloor(); resizeCanvas();
  buildPhase1DOM();
  showVega();
  setAvatar('avatarGame','vega_happy');
  pill('Conecta: switch → patch panel');
}
function endPhase1(){
  celebrateBriefly();
  setTimeout(startPhase2, 700);
}

/* ============================================================
   FASE 2 — Distancias + cable (GDD §4.4)
   ============================================================ */
/* Modelo: los tramos con default CORRECTO (dist≤máx y cable bien) se
   auto-fijan al entrar en la fase. Los tramos con default MALO llevan un
   marcador ⚠️ clicable en la planta; al tocarlo aparece slider+toggle.
   Cuando todos los marcados quedan resueltos → fase 3. */
let warnMarks={}; // tramoId -> elemento DOM del marcador
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()* (i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
let _seed=1; function rng(){ _seed=(_seed*1103515245+12345)&0x7fffffff; return _seed/0x7fffffff; }

function tramoDefaultOk(t){ return t.def<=tramoLegalMax(t.type); } // cable default siempre coincide con t.cable en datos
function startPhase2(){
  S.phase=2; setPhaseLabel(2);
  // fase 2 usa la bandeja para el panel de tramo: planta vuelve a altura normal
  const floor=document.getElementById('floor');
  floor.classList.remove('tall');
  document.getElementById('tray').style.display='';
  // Vega no aparece en fase 2 (cuando sale el slider y elegir cable)
  hideVega();
  measureFloor(); syncNodes();
  S.tramoState={};
  warnMarks={};
  floor.querySelectorAll('.warn-mark').forEach(m=>m.remove());

  // auto-fija los correctos, marca los malos
  let pending=0;
  TRAMOS.forEach(t=>{
    if(tramoDefaultOk(t)){
      S.tramoState[t.id]={dist:t.def, cable:t.cable, done:true};
      addScore(CFG.PTS_DIST); addScore(CFG.PTS_CABLE);
      paintTramo(t,'#04FFB4');
    } else {
      S.tramoState[t.id]={dist:t.def, cable:null, done:false};
      addWarnMark(t);
      pending++;
    }
  });
  drawCables();
  pill('Toca los tramos en ⚠ y corrígelos');
  S.tramoPending=pending;
  if(pending===0){ endPhase2(); }
}
function addWarnMark(t){
  const floor=document.getElementById('floor');
  const eps=tramoEndpoints(t);
  const a=nodes[eps[0]], b=nodes[eps[1]];
  const mid={x:(a.x+b.x)/2, y:(a.y+b.y)/2};
  const m=document.createElement('div'); m.className='warn-mark'; m.textContent='⚠';
  m.style.left=mid.x+'px'; m.style.top=mid.y+'px';
  m.onclick=()=>openTramo(t);
  floor.appendChild(m);
  warnMarks[t.id]=m;
  paintTramo(t,'#E74C3C');
}
function paintTramo(t,color){
  const eps=tramoEndpoints(t);
  cableLines.forEach(l=>{ if(samePair(l,eps)) l.color=color; });
}
function tramoEndpoints(t){
  if(t.type==='sw_panel') return ['switch','panel'];
  const i=(+t.id.slice(-1))-1;
  if(t.type==='panel_roseta') return ['panel','roseta'+i];
  return ['roseta'+i,'term'+i];
}
function samePair(line, eps){
  const a=nodes[eps[0]], b=nodes[eps[1]]; if(!a||!b) return false;
  const la=line.a, lb=line.b;
  const m=(p,q)=>Math.abs(p.x-q.x)<2&&Math.abs(p.y-q.y)<2;
  return (m(la,a)&&m(lb,b))||(m(la,b)&&m(lb,a));
}

let activeTramo=null;
function openTramo(t){
  activeTramo=t;
  pill('Tramo: '+t.label);
  // resalta este tramo en turquesa, atenúa el resto de marcados
  cableLines.forEach(l=>{ if(l.color==='#E74C3C') l.color='#7a3a35'; });
  paintTramo(t,'#00E6BC'); drawCables();
  buildTramoTray(t);
}

function buildTramoTray(t){
  const tray=document.getElementById('tray'); tray.innerHTML='';
  tray.className='tray tray-tramo';
  const cur = S.tramoState[t.id];
  const legalMax=tramoLegalMax(t.type), sMax=sliderMax(t.type);

  const wrap=document.createElement('div'); wrap.className='tramo-wrap';
  // lectura
  const read=document.createElement('div'); read.className='tramo-read';
  const val=document.createElement('span'); val.className='tramo-val'; val.textContent=fmt(cur.dist)+' m';
  const lim=document.createElement('span'); lim.className='tramo-lim'; lim.textContent='máx '+legalMax+' m';
  read.appendChild(val); read.appendChild(lim); wrap.appendChild(read);

  // slider
  const track=document.createElement('div'); track.className='slider-track';
  const fill=document.createElement('div'); fill.className='slider-fill';
  const limMark=document.createElement('div'); limMark.className='slider-limit'; limMark.style.left=(legalMax/sMax*100)+'%';
  const thumb=document.createElement('div'); thumb.className='slider-thumb';
  track.appendChild(fill); track.appendChild(limMark); track.appendChild(thumb); wrap.appendChild(track);

  function render(){
    const pct=cur.dist/sMax*100;
    thumb.style.left=pct+'%'; fill.style.width=pct+'%';
    const over=cur.dist>legalMax;
    fill.style.background = over? 'var(--rojo)':'var(--mint)';
    val.textContent=fmt(cur.dist)+' m'; val.style.color=over?'#ffb3ab':'#fff';
  }
  render();

  // slider drag
  function setFromX(clientX){
    const r=track.getBoundingClientRect();
    let p=(clientX-r.left)/r.width; p=Math.max(0,Math.min(1,p));
    cur.dist=Math.round(p*sMax*10)/10; render();
  }
  function sStart(e){ e.preventDefault(); setFromX((e.touches?e.touches[0]:e).clientX);
    const mv=(ev)=>setFromX((ev.touches?ev.touches[0]:ev).clientX);
    const up=()=>{document.removeEventListener('touchmove',mv);document.removeEventListener('mousemove',mv);
      document.removeEventListener('touchend',up);document.removeEventListener('mouseup',up);};
    document.addEventListener('touchmove',mv,{passive:false}); document.addEventListener('mousemove',mv);
    document.addEventListener('touchend',up); document.addEventListener('mouseup',up);
  }
  track.addEventListener('touchstart',sStart,{passive:false});
  track.addEventListener('mousedown',sStart);

  // toggle cable
  const toggle=document.createElement('div'); toggle.className='cable-toggle';
  const bLat=document.createElement('button'); bLat.textContent='Latiguillo'; bLat.className='cable-btn';
  const bFix=document.createElement('button'); bFix.textContent='Cable fijo'; bFix.className='cable-btn';
  function selCable(c){ cur.cable=c; bLat.classList.toggle('sel',c==='lat'); bFix.classList.toggle('sel',c==='fix'); }
  bLat.onclick=()=>selCable('lat'); bFix.onclick=()=>selCable('fix');
  if(cur.cable) selCable(cur.cable);
  toggle.appendChild(bLat); toggle.appendChild(bFix); wrap.appendChild(toggle);

  // confirmar
  const btn=document.createElement('button'); btn.className='cta tramo-confirm'; btn.textContent='Confirmar tramo';
  btn.onclick=()=>confirmTramo(t,cur);
  wrap.appendChild(btn);

  tray.appendChild(wrap);
}
function fmt(n){ return (Math.round(n*10)/10).toString().replace('.',','); }

function confirmTramo(t,cur){
  if(cur.cable===null){ say('Elige el tipo de cable de este tramo.',1800); return; }
  const legalMax=tramoLegalMax(t.type);
  if(cur.dist>legalMax){ showEdu('E_DIST'); return; }
  if(cur.cable!==t.cable){ showEdu('E_CABLE'); return; }
  // OK
  cur.done=true;
  addScore(CFG.PTS_DIST); addScore(CFG.PTS_CABLE);
  vibrate('success');
  paintTramo(t,'#04FFB4'); drawCables();
  // partículas en la marca del tramo resuelto
  if(warnMarks[t.id]){ const r=warnMarks[t.id].getBoundingClientRect(); successBurst(r.left+r.width/2, r.top+r.height/2); }
  // quita el marcador de advertencia
  if(warnMarks[t.id]){ warnMarks[t.id].remove(); delete warnMarks[t.id]; }
  S.tramoPending--;
  activeTramo=null;
  document.getElementById('tray').innerHTML='';
  if(S.tramoPending<=0){ pill('¡Tramos corregidos!'); setTimeout(endPhase2, 800); }
  else { pill('Quedan '+S.tramoPending+' tramos en ⚠'); }
}
const ACIERTO_TRAMO=['Distancia y cable correctos. Esto se certifica.','Bien dimensionado. Sin pérdidas.'];

function endPhase2(){
  cableLines.forEach(l=>l.color='#04FFB4'); drawCables();
  setTimeout(startPhase3, 600);
}

/* ============================================================
   FASE 3 — Alimentar y proteger (GDD §4.5)
   ============================================================ */
/* Un solo grupo: un ejemplo de cada tipo de equipo (8). */
const POWER_GROUPS = [
  {key:'all', title:'Reparte cada equipo', ids:['switch','router','server','cams','voip','pc','print','micro'],
   msg:'Arrastra cada equipo a su toma. La roja es el SAI (solo lo crítico); la blanca, red normal.'},
];
function eqById(id){ return EQUIPOS.find(e=>e.id===id); }

function startPhase3(){
  S.phase=3; setPhaseLabel(3);
  S.assign={}; S.saiLoad=0; S.groupIdx=0;
  buildPhase3Zones();
  nextGroup();
}

function buildPhase3Zones(){
  const floor=document.getElementById('floor');
  // Vega no aparece en fase 3 (tapaba la toma blanca)
  hideVega();
  // fondo liso: ocultar del todo la planta del montaje (nodos, cables, marcas)
  floor.querySelectorAll('.node').forEach(n=>n.style.display='none');
  floor.querySelectorAll('.warn-mark').forEach(m=>m.remove());
  cableLines=[]; if(ctx) ctx.clearRect(0,0,floorRect.w,floorRect.h);
  floor.classList.add('floor-flat');

  let zonesEl=document.getElementById('zones');
  if(!zonesEl){ zonesEl=document.createElement('div'); zonesEl.id='zones'; floor.appendChild(zonesEl); }
  zonesEl.innerHTML=`
    <div class="zone zone-red" id="zoneRed">
      <div class="zone-title">🔴 TOMA ROJA (SAI)</div>
      <div class="sai-meter"><div class="sai-fill" id="saiFill"></div><span class="sai-label" id="saiLabel">0%</span></div>
      <div class="zone-drop" id="dropRed"></div>
    </div>
    <div class="zone zone-white" id="zoneWhite">
      <div class="zone-title">⚪ TOMA BLANCA (red normal)</div>
      <div class="zone-drop" id="dropWhite"></div>
    </div>`;
  updateSai();
}

function nextGroup(){
  if(S.groupIdx>=POWER_GROUPS.length){ showBlackoutBtn(); return; }
  const g=POWER_GROUPS[S.groupIdx];
  pill(g.title+' · arrastra a su toma');
  renderGroup(g);
}
function renderGroup(g){
  const tray=document.getElementById('tray'); tray.className='tray tray-equip'; tray.innerHTML='';
  const done=Object.keys(S.assign).length;
  document.getElementById('phaseLabel').textContent='Alimentar · '+done+'/'+EQUIPOS.length;
  g.ids.filter(id=>!S.assign[id]).forEach(id=>{
    const e=eqById(id);
    const chip=document.createElement('div'); chip.className='equip-chip'; chip.dataset.id=e.id;
    if(e.icon && ASSETS[e.icon]){ const im=document.createElement('img'); im.src=ASSETS[e.icon]; chip.appendChild(im); }
    else { const ic=document.createElement('div'); ic.className='chip-emoji'; ic.textContent=e.emoji||'●'; chip.appendChild(ic); }
    const lb=document.createElement('span'); lb.textContent=e.name; chip.appendChild(lb);
    attachChipDrag(chip,e);
    tray.appendChild(chip);
  });
}
function showBlackoutBtn(){
  const tray=document.getElementById('tray'); tray.className='tray tray-equip'; tray.innerHTML='';
  const btn=document.createElement('button'); btn.className='cta blackout-go pulse'; btn.textContent='⚡ Se va la luz';
  btn.onclick=runBlackout; tray.appendChild(btn);
  pill('Todo alimentado. ¡Dale al apagón!');
}

/* drag de equipo a una zona */
function attachChipDrag(chip,e){
  let ghost=null,startX=0,startY=0,dragging=false;
  function down(ev){
    ev.preventDefault();
    const t=ev.touches?ev.touches[0]:ev; startX=t.clientX; startY=t.clientY; dragging=false;
    const mv=( e2)=>{
      const p=e2.touches?e2.touches[0]:e2;
      if(!dragging && Math.hypot(p.clientX-startX,p.clientY-startY)>CFG.DRAG_START){
        dragging=true; ghost=chip.cloneNode(true); ghost.classList.add('drag-ghost'); document.body.appendChild(ghost);
        vibrate('light');
      }
      if(dragging && ghost){ ghost.style.left=p.clientX+'px'; ghost.style.top=p.clientY+'px'; }
    };
    const up=(e2)=>{
      document.removeEventListener('touchmove',mv);document.removeEventListener('mousemove',mv);
      document.removeEventListener('touchend',up);document.removeEventListener('mouseup',up);
      if(dragging && ghost){
        const p=(e2.changedTouches?e2.changedTouches[0]:e2);
        ghost.remove(); ghost=null;
        const zone=zoneAt(p.clientX,p.clientY);
        if(zone) dropEquipo(e,zone);
      }
    };
    document.addEventListener('touchmove',mv,{passive:false}); document.addEventListener('mousemove',mv);
    document.addEventListener('touchend',up); document.addEventListener('mouseup',up);
  }
  chip.addEventListener('touchstart',down,{passive:false});
  chip.addEventListener('mousedown',down);
}
function zoneAt(x,y){
  const r=document.getElementById('zoneRed'), w=document.getElementById('zoneWhite');
  if(hit(r,x,y)) return 'red'; if(hit(w,x,y)) return 'white'; return null;
}
function hit(el,x,y){ if(!el) return false; const r=el.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; }

function dropEquipo(e,zone){
  S.assign[e.id]=zone;
  // colocar mini-ficha en la zona
  const drop=document.getElementById(zone==='red'?'dropRed':'dropWhite');
  const mini=document.createElement('div'); mini.className='equip-mini'; mini.title=e.name;
  if(e.icon && ASSETS[e.icon]){ const im=document.createElement('img'); im.src=ASSETS[e.icon]; mini.appendChild(im); }
  else { mini.textContent=(e.emoji||'●'); }
  drop.appendChild(mini);
  // efectos según corrección (hints no bloqueantes)
  if(zone==='red'){
    S.saiLoad += e.load;
    if(e.absurd){ vibrate('heavy',[0,150,80,150]); saiSatHint(e); }
    else { vibrate('light'); }
  } else {
    vibrate('light');
    if(e.crit){ critHint(e); }
  }
  updateSai();
  // ¿queda algún equipo del grupo actual sin colocar?
  const g=POWER_GROUPS[S.groupIdx];
  const pend = g.ids.some(id=>!S.assign[id]);
  if(pend){ renderGroup(g); }
  else { S.groupIdx++; document.getElementById('tray').innerHTML='';
    document.getElementById('phaseLabel').textContent='Alimentar · '+Object.keys(S.assign).length+'/'+EQUIPOS.length;
    setTimeout(nextGroup, 650); }
}
/* Hints de fase 3 — Vega no aparece aquí: se muestran como toast (píldora) */
function hintToast(text, ms){
  const p=document.getElementById('pill'); const prev=p.textContent;
  p.textContent=text; p.classList.add('pill-warn');
  clearTimeout(hintToast._t);
  hintToast._t=setTimeout(()=>{ p.classList.remove('pill-warn'); p.textContent=prev; }, ms||2600);
}
function critHint(e){ hintToast('Ojo: '+e.name+' es crítico → mejor a la roja (SAI).', 2600); }
function saiSatHint(e){ hintToast(e.name+' al SAI no: lo satura y deja sin respaldo lo importante.', 2800); }
function updateSai(){
  const fill=document.getElementById('saiFill'), label=document.getElementById('saiLabel');
  if(!fill) return;
  const pct=Math.min(100,S.saiLoad);
  fill.style.width=pct+'%';
  const sat=S.saiLoad>CFG.SAI_CAP;
  fill.style.background=sat?'var(--rojo)':'var(--lime)';
  fill.classList.toggle('sat',sat);
  label.textContent=Math.round(S.saiLoad)+'%'+(sat?' ⚠':'');
}

/* ============================================================
   EL APAGÓN — clímax (GDD §4.6)
   ============================================================ */
function runBlackout(){
  S.phase=4;
  const bo=document.getElementById('blackout'); bo.classList.add('show');
  const title=document.getElementById('blackoutTitle');
  const summary=document.getElementById('blackoutSummary');
  const btn=document.getElementById('blackoutBtn');
  summary.innerHTML=''; btn.style.display='none';
  vibrate('medium',[0,200]);
  title.textContent='🌙 CORTE DE LUZ';

  const saturated = S.saiLoad>CFG.SAI_CAP;
  // calcular puntuación de reparto + crítico salvado
  S.critSaved=0; let absurdInRed=0;
  EQUIPOS.forEach(e=>{
    const z=S.assign[e.id];
    const correct = e.crit ? (z==='red') : (z==='white');
    if(correct) addScore(CFG.PTS_POWER);
    if(e.absurd && z==='red') absurdInRed++;
  });

  // revelado secuencial — cada fila muestra estado físico (luz) + veredicto (✓/✗/⚠)
  const list=EQUIPOS.slice();
  let i=0;
  function reveal(){
    if(i>=list.length){ finishBlackout(saturated,absurdInRed); return; }
    const e=list[i++];
    const z=S.assign[e.id];
    // ¿sigue con luz? (efecto físico del corte)
    let alive;
    if(saturated){ alive=false; }                 // SAI saturado: cae todo lo de roja; lo de blanca ya estaba caído
    else if(z==='red' && !e.absurd){ alive=true; } // roja con SAI ok
    else { alive=false; }
    if(alive && e.crit) S.critSaved++;

    // veredicto de la decisión (independiente de la luz)
    // correcto = crítico→roja  |  no-crítico→blanca
    const decisionOK = e.crit ? (z==='red') : (z==='white');
    let cls, icon, statusText;
    if(e.absurd && z==='red'){
      cls='bad'; icon='✗'; statusText='saturó el SAI';
    } else if(e.crit && z==='white'){
      cls='bad'; icon='✗'; statusText='sin luz · debía ir al SAI';
    } else if(saturated && z==='red'){
      cls='warn'; icon='⚠'; statusText='cayó por sobrecarga';
    } else if(!e.crit && z==='red'){
      // no-crítico ocupando el SAI: gasta respaldo que necesita lo importante
      cls='bad'; icon='✗'; statusText='no necesita SAI · iba en la blanca';
    } else if(decisionOK && alive){
      cls='ok'; icon='✓'; statusText='protegido · sigue activo';
    } else if(decisionOK && !alive){
      cls='ok'; icon='✓'; statusText='bien en la blanca · sin luz';
    } else {
      cls='warn'; icon='⚠'; statusText=alive?'sigue activo':'sin luz';
    }

    const row=document.createElement('div'); row.className='reveal-row '+cls;
    row.innerHTML=`<span class="rv-icon">${icon}</span>`+
                  `<span class="rv-name">${e.name}</span>`+
                  `<span class="rv-status">${statusText}</span>`;
    summary.appendChild(row);
    setTimeout(reveal, 280);
  }
  reveal();
}
function finishBlackout(saturated,absurdInRed){
  const summary=document.getElementById('blackoutSummary');
  const btn=document.getElementById('blackoutBtn');
  const perfect = !saturated && S.critSaved===S.critTotal && absurdInRed===0;
  if(perfect){ addScore(CFG.BONUS_BLACKOUT); }

  const head=document.createElement('div'); head.className='reveal-head';
  if(saturated){
    head.innerHTML='<b>El SAI se sobrecargó. Cayó hasta lo crítico.</b>';
    vibrate('error',[0,300,100,300]);
    setAvatar('avatarGame','vega_worried');
  } else if(perfect){
    head.innerHTML='<b>Crítico salvado: '+S.critSaved+'/'+S.critTotal+'</b> · ¡La oficina aguanta!';
    vibrate('success',[0,80,50,80,50,160]);
    // celebración con partículas en el centro de la pantalla
    const cx=window.innerWidth/2, cy=window.innerHeight/2;
    successBurst(cx,cy); setTimeout(()=>successBurst(cx-60,cy-40),150); setTimeout(()=>successBurst(cx+60,cy-40),300);
  } else {
    head.innerHTML='<b>Crítico salvado: '+S.critSaved+'/'+S.critTotal+'</b> · Consumos absurdos en SAI: '+absurdInRed;
    vibrate('medium');
  }
  summary.insertBefore(head, summary.firstChild);
  btn.style.display=''; btn.textContent='Ver resultados';
}

/* ---------- Resultados ---------- */
function showResults(){
  document.getElementById('blackout').classList.remove('show');
  show('results');
  const score=S.score;
  const rec=getRecord();
  let tier, state, title, medal, msg;
  if(score>=CFG.TIER_HIGH){ tier='Alto'; state='vega_celebrating'; title='¡Red a prueba de apagón!';
    medal='Instalación a prueba de apagón ✨';
    msg='Recorrido, distancias, cable y SAI: todo pro. La gestoría llega mañana y no se entera de nada. 🎉'; }
  else if(score>=CFG.TIER_MID){ tier='Medio'; state='vega_happy'; title='Buen montaje'; medal='';
    msg='Buen trabajo, la red está montada. Repasa qué equipos son críticos para el SAI y lo bordas.'; }
  else { tier='Bajo'; state='vega_worried'; title='Sigue practicando'; medal='';
    msg='Funciona a medias. Repasa el recorrido en orden y, sobre todo, qué protege el SAI. La continuidad no se improvisa.'; }
  setAvatar('avatarResults', state);
  document.getElementById('resTitle').textContent=title;
  document.getElementById('resMedal').textContent=medal;
  document.getElementById('resMsg').textContent=msg;
  document.getElementById('resCrit').textContent=S.critSaved+'/'+S.critTotal;
  document.getElementById('resScore').textContent=score;
  document.getElementById('resRecord').textContent=Math.max(rec,score);
  setRecord(score);
  if(score>=CFG.TASK_THRESHOLD) fireTaskCompleted();
}

/* ---------- Reset ---------- */
function resetGame(){
  S.phase=0; S.score=0; S.critSaved=0; S.saiLoad=0;
  S.chain={}; S.tramoState={}; S.assign={}; S.groupIdx=0; S.tramoPending=0;
  cableLines=[]; conns=[]; tracePts=[]; _rot=0; _seed=1; warnMarks={}; activeTramo=null;
  taskFired=false;
  document.getElementById('score').textContent='0 pts';
  const z=document.getElementById('zones'); if(z) z.remove();
  document.getElementById('tray').innerHTML='';
  document.querySelectorAll('.warn-mark').forEach(m=>m.remove());
  const floor=document.getElementById('floor');
  floor.classList.remove('floor-flat');
  floor.querySelectorAll('.node').forEach(n=>n.remove());
  document.getElementById('briefOverlay').classList.remove('show');
  showVega();
  document.getElementById('tray').style.display='';
  document.getElementById('floor').classList.remove('tall');
  show('intro');
}

/* ---------- Init ---------- */
function init(){
  setAvatar('avatarIntro','vega_happy');
  document.getElementById('introSpeech').textContent =
    'La gestoría se muda mañana y la red tiene que estar lista: cuatro puestos, todo ordenado y a prueba de apagón. Montamos la cadena, medimos los tramos y decidimos qué proteger con el SAI. ¿Empezamos?';

  setupCanvas();
  // listeners de trazado (fase 1) sobre el canvas/floor
  const floor=document.getElementById('floor');
  floor.addEventListener('touchstart',onTraceStart,{passive:false});
  floor.addEventListener('touchmove',onTraceMove,{passive:false});
  floor.addEventListener('touchend',onTraceEnd);
  floor.addEventListener('mousedown',onTraceStart);
  floor.addEventListener('mousemove',onTraceMove);
  floor.addEventListener('mouseup',onTraceEnd);

  window.addEventListener('resize',()=>{ measureFloor(); resizeCanvas(); syncNodes(); });

  document.getElementById('btnStart').onclick=()=>show('howto');
  document.getElementById('btnGo').onclick=()=>{ show('play'); requestAnimationFrame(()=>startPhase1()); };
  document.getElementById('btnRetry').onclick=resetGame;
  document.getElementById('blackoutBtn').onclick=showResults;
}
function syncNodes(){
  // reposiciona nodos y cables tras un resize
  if(S.phase<1) return;
  for(const id in nodes){ const p=nodePos(id); nodes[id].x=p.x; nodes[id].y=p.y;
    nodes[id].el.style.left=p.x+'px'; nodes[id].el.style.top=p.y+'px'; }
  cableLines=[]; conns.forEach(c=>cableLines.push({a:{x:nodes[c.from].x,y:nodes[c.from].y},b:{x:nodes[c.to].x,y:nodes[c.to].y},color:'#04FFB4'}));
  drawCables();
}

document.addEventListener('DOMContentLoaded', init);
