'use strict';

/* ============================================================
   Vega Traza Limpio — S4D1-AM (Cableado de datos)
   Mecánica: cable rack→roseta con esquinas. El jugador arrastra
   cada vértice para REDONDEAR el codo (abrir el radio). Curva
   amplia = OK; codo cerrado o pegado a la luz = mal.
   ============================================================ */

const CFG = {
  RADIO_MIN_PX: 60,    // radio de redondeo mínimo seguro (8× diámetro, margen pro)
  RADIO_MAX_PX: 130,   // radio máximo permitido (no infinito)
  CABLE_W: 11,         // grosor cable normal
  HANDLE_R: 16,        // radio del punto arrastrable (touch target ±)
  SNAP_TOL: 26,        // tolerancia de agarre del vértice
  EXCL_HALO: 26,       // halo de exclusión de la franja (= 30 cm)
};

const RECORD_KEY = 'vega_traza_limpio_record';

/* ---- Assets (Cloudinary: kampe/game_assets/s4d1_redes) ---- */
const CDN = 'https://res.cloudinary.com/kampe/image/upload/';
const ART = {
  vega_happy:       CDN+'v1780487714/vega_happy_pfvzas.png',
  vega_celebrating: CDN+'v1780487621/vega_celebrating_asjumn.png',
  vega_worried:     CDN+'v1780487620/vega_worried_wf1qeg.png',
  rack:             CDN+'v1780487609/rack_wyomvy.png',
  roseta:           CDN+'v1780487608/roseta_ddbguh.png',
  canal_bandeja:    CDN+'v1780487609/canal_bandeja_p5gd3k.png',
  canal_canaleta:   CDN+'v1780487601/canal_canaleta_kefo9t.png',
  canal_tubo:       CDN+'v1780487601/canal_tubo_kr82zs.png',
};

/* --------- NIVELES ---------
   origin / dest / corners en fracción del wall (0..1).
   corners = vértices intermedios (las esquinas a redondear).
   bands = franjas de potencia [x,y,w,h] en fracción. */
const LEVELS = [
  { puesto:'Recepción', canal:null,
    origin:[0.18,0.16], dest:[0.82,0.66], corners:[], bands:[],
    brief:'Empezamos fácil: solo una recta del rack a la roseta. Pulsa "Tender cable".' },
  { puesto:'Sala de reuniones', canal:ART.canal_bandeja,
    origin:[0.18,0.16], dest:[0.80,0.72], corners:[[0.80,0.16]], bands:[],
    brief:'Hay una esquina. Arrastra el punto para abrir la curva: cuanto más amplia, mejor.' },
  { puesto:'Despacho', canal:ART.canal_canaleta,
    origin:[0.82,0.16], dest:[0.20,0.72], corners:[[0.20,0.16]], bands:[[0.42,0.30,0.16,0.34]],
    brief:'Cuidado con la línea eléctrica. Abre la curva sin que el cable toque el rojo.' },
  { puesto:'Office', canal:ART.canal_tubo,
    origin:[0.18,0.16], dest:[0.82,0.16], corners:[[0.18,0.74],[0.82,0.74]], bands:[[0.40,0.20,0.20,0.30]],
    brief:'Dos esquinas y la línea eléctrica en medio. Baja, cruza por debajo y sube limpio.' },
  { puesto:'Open space', canal:ART.canal_bandeja,
    origin:[0.18,0.16], dest:[0.82,0.74], corners:[[0.50,0.16],[0.50,0.74]], bands:[[0.00,0.34,0.30,0.09],[0.70,0.54,0.30,0.09]],
    brief:'Serpentea entre las dos líneas. Abre cada curva sin rozar el rojo.' },
  { puesto:'Rack final', canal:ART.canal_canaleta,
    origin:[0.82,0.16], dest:[0.18,0.78], corners:[[0.20,0.16],[0.20,0.50],[0.80,0.50]], bands:[[0.30,0.30,0.45,0.07],[0.30,0.62,0.45,0.07]],
    brief:'El último: tres curvas y dos líneas. Hazlo perfecto y nos vamos. 🎂' },
];

const EDU = {
  E1:{ t:'Curva ahogada',
    what:'Dejaste una esquina demasiado cerrada.',
    why:'Un radio cerrado deforma los pares trenzados: +1‑3 dB de pérdida, suficiente para tumbar el 10 Gbps.',
    rule:'Norma TIA‑568: radio mínimo 4× el diámetro. Buen instalador: 8× de margen.',
    todo:'Arrastra el punto de esa esquina para abrir más la curva.' },
  E2:{ t:'Demasiado cerca de la luz',
    what:'El cable pasa pegado a la línea eléctrica.',
    why:'Datos y potencia juntos generan interferencia electromagnética y errores de comunicación.',
    rule:'Separación mínima: 30 cm respecto a la electricidad.',
    todo:'Ajusta las curvas para alejar el cable de la franja roja.' },
};

const WIN = {
  rot:['¡Limpio! Así da gusto. Siguiente.','Ese radio es de catálogo. 👌','Toma. Un puesto menos para la fiesta.'],
  final:'¡Y FUERA! Red entera, limpia. Cojo la chaqueta y me piro. 🎉',
};

/* ---------------- estado ---------------- */
const S = {
  level:0, points:0, cleanFirstTry:0, retriedThisLevel:false,
  nodes:[],        // [origin, ...corners, dest] en px
  radii:[],        // radio de redondeo por corner (índice i = corner i)
  dragIdx:-1, touchId:null,
};

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const wall = $('wall'), canvas = $('cable'), ctx = canvas.getContext('2d');
let WALLW = 0, WALLH = 0, bandsPx = [];

/* ============ navegación ============ */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
  document.documentElement.className = (id==='results') ? 'results' : 'gameplay';
}
$('toHowto').onclick = ()=>show('howto');
$('toPlay').onclick = ()=>{ show('play'); startGame(); };
$('replay').onclick = ()=>{ resetGame(); show('play'); startGame(); };
$('eduOk').onclick = ()=>{ $('eduOverlay').classList.remove('show'); };

/* ============ háptica ============ */
function vibrate(level, pattern){
  if(!window.ReactNativeWebView){
    if(navigator.vibrate && pattern) navigator.vibrate(pattern);
    else if(navigator.vibrate) navigator.vibrate(level==='error'?200:30);
    return;
  }
  const msg = { action:'VIBRATE', level };
  if(pattern) msg.pattern = pattern;
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

/* ============ setup ============ */
function resetGame(){ S.level=0; S.points=0; S.cleanFirstTry=0; }
function startGame(){ buildPartyTrack(); loadLevel(0); }

function buildPartyTrack(){
  const t = $('partyTrack'); t.innerHTML='';
  for(let i=0;i<LEVELS.length;i++){
    const s=document.createElement('span'); s.textContent = i===LEVELS.length-1?'🎂':'🔧';
    t.appendChild(s);
  }
}
function markPartyProgress(){
  const spans = $('partyTrack').children;
  for(let i=0;i<spans.length;i++) spans[i].classList.toggle('done', i < S.level);
}

function measureWall(){
  const r = wall.getBoundingClientRect();
  WALLW = r.width; WALLH = r.height;
  canvas.width = WALLW; canvas.height = WALLH;
}

function loadLevel(i){
  S.level = i; S.retriedThisLevel = false; S.dragIdx=-1;
  const L = LEVELS[i];

  requestAnimationFrame(()=>{
    measureWall();
    const o=[L.origin[0]*WALLW, L.origin[1]*WALLH];
    const d=[L.dest[0]*WALLW,   L.dest[1]*WALLH];
    const c=L.corners.map(p=>[p[0]*WALLW, p[1]*WALLH]);
    S.nodes = [o, ...c, d];
    // radio inicial pequeño (codo casi afilado -> el jugador debe abrirlo)
    S.radii = c.map(()=> 28);
    bandsPx = L.bands.map(b=>({x:b[0]*WALLW, y:b[1]*WALLH, w:b[2]*WALLW, h:b[3]*WALLH}));

    placeBands();
    placeCanal(L.canal);
    placeNodesArt();
    placeAvatarSide(L.dest[0]);
    redraw();
  });

  $('hudPts').textContent = `${S.points} pts`;
  markPartyProgress();
  sayBubble(L.brief, 'happy', 3500);
  setHint(LEVELS[i].corners.length ? 'Arrastra los puntos para abrir las curvas' : 'Pulsa "Tender cable"');
}

function placeNodesArt(){
  const rack=$('rack'), roseta=$('roseta'), oh=$('originHalo'), dh=$('destHalo');
  if(rack.getAttribute('src')!==ART.rack){ rack.classList.remove('ph-rack'); rack.src=ART.rack; }
  if(roseta.getAttribute('src')!==ART.roseta){ roseta.classList.remove('ph-roseta'); roseta.src=ART.roseta; }
  const o=S.nodes[0], d=S.nodes[S.nodes.length-1];
  rack.style.left=(o[0]-39)+'px';   rack.style.top=(o[1]-50)+'px';
  roseta.style.left=(d[0]-26)+'px'; roseta.style.top=(d[1]-26)+'px';
  oh.style.left=o[0]+'px'; oh.style.top=o[1]+'px';
  dh.style.left=d[0]+'px'; dh.style.top=d[1]+'px';
}

function placeBands(){
  const c = $('bands'); c.innerHTML='';
  bandsPx.forEach(b=>{
    const horiz = b.w > b.h;
    const d=document.createElement('div'); d.className='band'+(horiz?' horiz':'');
    d.style.left=b.x+'px'; d.style.top=b.y+'px'; d.style.width=b.w+'px'; d.style.height=b.h+'px';
    const lbl=document.createElement('span'); lbl.className='band-label';
    lbl.innerHTML='⚡ LÍNEA ELÉCTRICA<br>NO PASAR';
    d.appendChild(lbl); c.appendChild(d);
  });
}
function placeCanal(src){
  const c=$('canal');
  if(!src){ c.hidden=true; return; }
  c.hidden=false; c.src=src;
  const w=Math.min(110, WALLW*0.40);
  c.style.width=w+'px'; c.style.left=(WALLW*0.5-w/2)+'px'; c.style.top='4px';
}

/* ============ geometría del cable redondeado ============
   Construye el path: para cada vértice interno, recorta un arco
   de radio r entre los dos segmentos adyacentes. Devuelve también
   los puntos muestreados para validar (radio efectivo y colisión). */
function dist(a,b){ return Math.hypot(a[0]-b[0],a[1]-b[1]); }
function sub(a,b){ return [a[0]-b[0],a[1]-b[1]]; }
function add(a,b){ return [a[0]+b[0],a[1]+b[1]]; }
function mul(a,s){ return [a[0]*s,a[1]*s]; }
function norm(a){ const l=Math.hypot(a[0],a[1])||1; return [a[0]/l,a[1]/l]; }

/* radio efectivo recortado: no puede exceder la mitad del segmento más corto */
function effRadius(i){
  const n=S.nodes, P=n[i+1], A=n[i], B=n[i+2];
  const maxByGeom = Math.min(dist(P,A), dist(P,B))*0.5;
  return Math.min(S.radii[i], maxByGeom);
}

/* muestrea el cable completo en puntos (para validación + colisión) */
function samplePath(){
  const n=S.nodes, pts=[];
  pts.push(n[0].slice());
  for(let i=0;i<n.length-2;i++){
    const A=n[i], P=n[i+1], B=n[i+2];
    const r=effRadius(i);
    const dirA=norm(sub(A,P)), dirB=norm(sub(B,P));
    const t1=add(P, mul(dirA, r));  // punto de tangencia entrada
    const t2=add(P, mul(dirB, r));  // punto de tangencia salida
    // recta hasta t1
    pts.push(t1.slice());
    // arco cuadrático aproximado P como control entre t1 y t2
    const STEPS=14;
    for(let s=1;s<=STEPS;s++){
      const t=s/STEPS, mt=1-t;
      pts.push([mt*mt*t1[0]+2*mt*t*P[0]+t*t*t2[0],
                mt*mt*t1[1]+2*mt*t*P[1]+t*t*t2[1]]);
    }
  }
  pts.push(n[n.length-1].slice());
  return pts;
}

/* ¿el codo i tiene radio seguro? */
function cornerOk(i){ return effRadius(i) >= CFG.RADIO_MIN_PX; }

/* ¿algún punto del cable invade una franja+halo? */
function pathHitsPower(pts){
  const m=CFG.EXCL_HALO;
  return pts.some(p=> bandsPx.some(b=>
    p[0]>=b.x-m && p[0]<=b.x+b.w+m && p[1]>=b.y-m && p[1]<=b.y+b.h+m));
}

/* ============ render ============ */
function redraw(){
  ctx.clearRect(0,0,WALLW,WALLH);
  const pts=samplePath();

  // estado global para color de cada arco: dibujamos por segmentos
  // 1) determinar si cada corner ok
  const okCorner = S.radii.map((_,i)=>cornerOk(i));
  const hitsPower = pathHitsPower(pts);

  // dibuja el cable: turquesa si todo ok; tramos problemáticos en rojo
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=CFG.CABLE_W;
  ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
  const allOk = okCorner.every(Boolean) && !hitsPower;
  ctx.strokeStyle = allOk ? '#00E6BC' : '#E74C3C';
  ctx.stroke();

  // si hay potencia tocada, marca el cable punteado encima
  if(hitsPower){
    ctx.setLineDash([6,7]); ctx.strokeStyle='#ff8a80'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.stroke(); ctx.setLineDash([]);
  }

  // dibuja los handles (puntos arrastrables) en cada corner
  for(let i=0;i<S.nodes.length-2;i++){
    const P=S.nodes[i+1];
    const ok=okCorner[i];
    ctx.beginPath(); ctx.arc(P[0],P[1],CFG.HANDLE_R,0,Math.PI*2);
    ctx.fillStyle = ok ? 'rgba(4,255,180,.25)' : 'rgba(231,76,60,.28)';
    ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle = ok ? '#04FFB4' : '#E74C3C';
    ctx.stroke();
    // icono de "arrastra" (cuatro flechas simplificado: punto central)
    ctx.beginPath(); ctx.arc(P[0],P[1],4,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
  }

  // actualiza hint en vivo
  updateLiveHint(okCorner, hitsPower);
}

function updateLiveHint(okCorner, hitsPower){
  if(S.nodes.length===2){ setHint('Recta lista — pulsa "Tender cable"','ok'); return; }
  if(hitsPower){ setHint('El cable toca la luz — sepáralo','bad'); return; }
  const bad = okCorner.filter(x=>!x).length;
  if(bad>0) setHint(`Abre más ${bad} curva${bad>1?'s':''} (arrastra el punto rojo)`,'bad');
  else setHint('¡Curvas perfectas! Pulsa "Tender cable"','ok');
}

/* ============ input: arrastrar vértices ============ */
function localXY(cx,cy){ const r=wall.getBoundingClientRect(); return [cx-r.left, cy-r.top]; }

function grabAt(p){
  for(let i=0;i<S.nodes.length-2;i++){
    if(dist(p, S.nodes[i+1]) <= CFG.SNAP_TOL) return i;
  }
  return -1;
}

function pointerDown(x,y){
  if($('eduOverlay').classList.contains('show')) return;
  const p=localXY(x,y);
  S.dragIdx = grabAt(p);
  if(S.dragIdx>=0) vibrate('light');
}

function pointerMove(x,y){
  if(S.dragIdx<0) return;
  const p=localXY(x,y);
  const i=S.dragIdx;
  const A=S.nodes[i], P=S.nodes[i+1], B=S.nodes[i+2];
  // el radio = distancia del dedo a la esquina P, proyectada hacia el interior del codo.
  // bisectriz interior:
  const dirA=norm(sub(A,P)), dirB=norm(sub(B,P));
  let bis=norm(add(dirA,dirB));
  if(bis[0]===0&&bis[1]===0) bis=[-dirA[1],dirA[0]]; // segmentos opuestos: usa perpendicular
  // proyección del vector (dedo-P) sobre la bisectriz -> profundidad
  const fv=sub(p,P);
  let depth=Math.max(0, fv[0]*bis[0]+fv[1]*bis[1]);
  // mapear profundidad a radio (factor suave)
  let r = depth*0.9;
  r = Math.max(0, Math.min(CFG.RADIO_MAX_PX, r));
  const prevOk = cornerOk(i);
  S.radii[i]=r;
  const nowOk = cornerOk(i);
  if(prevOk!==nowOk) vibrate('medium');
  redraw();
}

function pointerUp(){ S.dragIdx=-1; }

/* ============ validar / tender ============ */
$('tendBtn') && ($('tendBtn').onclick = tryTend);
function tryTend(){
  if($('eduOverlay').classList.contains('show')) return;
  const pts=samplePath();
  const badCorner = S.radii.findIndex((_,i)=>!cornerOk(i));
  const hitsPower = pathHitsPower(pts);

  if(hitsPower){ fail('E2'); return; }
  if(badCorner>=0){ fail('E1'); return; }
  succeed();
}

function fail(code){
  canvas.classList.add('shake'); setTimeout(()=>canvas.classList.remove('shake'),350);
  vibrate('error',[0,120,60,120]);
  S.retriedThisLevel=true;
  const e=EDU[code];
  $('eduTitle').textContent=e.t; $('eduWhat').textContent=e.what;
  $('eduWhy').textContent=e.why; $('eduRule').textContent=e.rule; $('eduDo').textContent=e.todo;
  sayBubble('', 'worried', 0);
  $('eduOverlay').classList.add('show');
}

function succeed(){
  // dibujo final limpio + bridas
  const pts=samplePath();
  ctx.clearRect(0,0,WALLW,WALLH);
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=CFG.CABLE_W; ctx.strokeStyle='#04FFB4';
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.stroke();
  drawBridas(pts);

  const add = S.retriedThisLevel ? 50 : 100;
  if(!S.retriedThisLevel) S.cleanFirstTry++;
  S.points += add;
  $('hudPts').textContent=`${S.points} pts`;

  const isFinal = S.level===LEVELS.length-1;
  setHint(isFinal?'¡Instalación terminada!':'¡Tramo limpio!','ok');
  vibrate('success', isFinal?[0,80,50,80,50,160]:undefined);
  sayBubble(isFinal?WIN.final:WIN.rot[S.level%WIN.rot.length],'celebrating',1800);
  setTimeout(()=>{ isFinal?finish():loadLevel(S.level+1); }, 1500);
}

function drawBridas(pts){
  if(pts.length<2) return;
  let acc=0; const step=78;
  ctx.strokeStyle='#04FFB4'; ctx.lineWidth=3;
  for(let i=1;i<pts.length;i++){
    acc+=dist(pts[i-1],pts[i]);
    if(acc>=step){ acc=0;
      const dx=pts[i][0]-pts[i-1][0], dy=pts[i][1]-pts[i-1][1];
      const l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l;
      ctx.beginPath(); ctx.moveTo(pts[i][0]-nx*8,pts[i][1]-ny*8); ctx.lineTo(pts[i][0]+nx*8,pts[i][1]+ny*8); ctx.stroke();
    }
  }
}

/* ============ hint pill ============ */
function setHint(txt, state){
  const p=$('radioPill');
  p.className='radio-pill'+(state==='bad'?' bad':state==='ok'?'':'');
  $('radioTxt').textContent=txt;
  $('radioDots').textContent = state==='bad'?'●○○○○':'●●●●●';
}

/* ============ avatar + burbuja ============ */
function setAvatar(img, state){
  img.classList.remove('ph-vega');
  img.onerror=()=>{ img.classList.add('ph-vega'); img.removeAttribute('src'); };
  img.src=ART['vega_'+state];
}
function placeAvatarSide(destX){
  const av=$('gameAvatar'), b=$('vegaBubble');
  const left = destX>0.5;
  av.classList.toggle('left',left); b.classList.toggle('bub-left',left);
}
let bubbleTimer=null;
function sayBubble(text, state, ms){
  const av=$('gameAvatar'), b=$('vegaBubble');
  setAvatar(av,state);
  av.classList.toggle('show', state!=='happy');
  if(text){ b.innerHTML=text; b.classList.add('show'); } else b.classList.remove('show');
  clearTimeout(bubbleTimer);
  if(ms>0) bubbleTimer=setTimeout(()=>{ b.classList.remove('show'); av.classList.remove('show'); setAvatar(av,'happy'); }, ms);
}

/* ============ resultados ============ */
function finish(){
  const clean=S.cleanFirstTry, total=LEVELS.length;
  const quality=Math.round((clean/total)*100);
  if(clean===total) S.points+=200;

  let state, msg, medal=false, title;
  if(clean===total){ state='celebrating'; medal=true; title='¡Red lista!';
    msg='¡PERFECTO a la primera! Instalación de catálogo. Nadie va a volver a tocar esto. <b>Nos vamos de cumple.</b> 🎂'; }
  else if(clean>=4){ state='happy'; title='¡Red lista!';
    msg='Buen trabajo. Alguna curva se te quedó corta pero la arreglaste. La red está limpia. ¡A celebrar!'; }
  else { state='worried'; title='Red terminada';
    msg='La red funciona, pero te costó. Recuerda: abre bien las curvas y sepárate de la luz. La próxima, a la primera.'; }

  setAvatar($('resAvatar'),state);
  $('resTitle').textContent=title;
  $('resMedal').hidden=!medal;
  $('resMsg').innerHTML=msg;
  $('resQuality').textContent=quality+'%';
  $('resPts').textContent=S.points;

  const prev=parseInt(localStorage.getItem(RECORD_KEY)||'0',10);
  if(S.points>prev){ localStorage.setItem(RECORD_KEY,String(S.points)); $('resRecord').textContent=`Nuevo récord: ${prev} → ${S.points}`; }
  else $('resRecord').textContent=`Récord: ${prev}`;

  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}));
  show('results');
}

/* ============ listeners ============ */
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); const t=e.changedTouches[0]; S.touchId=t.identifier; pointerDown(t.clientX,t.clientY); }, {passive:false});
canvas.addEventListener('touchmove', e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier===S.touchId){ pointerMove(t.clientX,t.clientY); break; } } }, {passive:false});
canvas.addEventListener('touchend', e=>{ e.preventDefault(); pointerUp(); }, {passive:false});

let md=false;
canvas.addEventListener('mousedown', e=>{ md=true; pointerDown(e.clientX,e.clientY); });
canvas.addEventListener('mousemove', e=>{ if(md) pointerMove(e.clientX,e.clientY); });
window.addEventListener('mouseup', ()=>{ md=false; pointerUp(); });

window.addEventListener('resize', ()=>{ if($('play').classList.contains('active')) loadLevel(S.level); });
