'use strict';

/* ============================================================
   Vega Traza Limpio — S4D1-AM (Cableado de datos)
   DOS FASES por nivel:
   1) TRAZADO: el jugador toca puntos -> polilínea de rectas rack→roseta
      (roseta fija; nº de esquinas sugerido; no cruzar la línea eléctrica).
   2) RADIOS: por cada esquina ajusta el radio (se muestra N×Ø EN VIVO,
      sin color). Pulsa "Fijar": entonces se revela si es correcto.
      Clavarlo a la primera = estrella. Errar resta nota pero se reajusta.
   ============================================================ */

const CFG = {
  DIAM_PX: 11,          // "diámetro" del cable en px (para expresar radio en ×Ø)
  MULT_MIN: 4,          // norma TIA-568: 4× diámetro (mínimo aceptable)
  MULT_PRO: 8,          // buena práctica: 8× diámetro (clavado = estrella)
  RADIO_MAX_PX: 130,
  CABLE_W: 11,
  HANDLE_R: 17,
  SNAP_TOL: 28,         // agarre de vértice / toque sobre roseta
  EXCL_HALO: 26,        // halo de exclusión de la franja (= 30 cm)
};
// radios derivados (px)
CFG.RADIO_MIN_PX = CFG.MULT_MIN * CFG.DIAM_PX; // 44px
CFG.RADIO_PRO_PX = CFG.MULT_PRO * CFG.DIAM_PX; // 88px

const RECORD_KEY = 'vega_traza_limpio_record';

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
   origin/dest en fracción del wall. nCorners = esquinas sugeridas.
   bands = franjas de potencia. */
const LEVELS = [
  { puesto:'Recepción', canal:null,
    origin:[0.18,0.18], dest:[0.82,0.64], nCorners:0, bands:[],
    brief:'Empieza fácil: une el rack con la roseta. Toca en la roseta para cerrar la línea.' },
  { puesto:'Sala de reuniones', canal:ART.canal_bandeja,
    origin:[0.18,0.16], dest:[0.80,0.72], nCorners:1, bands:[],
    brief:'Esta ruta necesita 1 codo. Toca dónde gira y cierra en la roseta.' },
  { puesto:'Despacho', canal:ART.canal_canaleta,
    origin:[0.82,0.16], dest:[0.20,0.72], nCorners:1, bands:[[0.42,0.30,0.16,0.34]],
    brief:'1 codo, y esquiva la línea eléctrica con la ruta. Ni un segmento sobre el rojo.' },
  { puesto:'Office', canal:ART.canal_tubo,
    origin:[0.18,0.16], dest:[0.82,0.16], nCorners:2, bands:[[0.40,0.20,0.20,0.30]],
    brief:'2 codos: baja, cruza por debajo de la línea y sube a la roseta.' },
  { puesto:'Open space', canal:ART.canal_bandeja,
    origin:[0.18,0.16], dest:[0.82,0.74], nCorners:2, bands:[[0.00,0.34,0.30,0.09],[0.70,0.54,0.30,0.09]],
    brief:'2 codos para serpentear entre las dos líneas. Traza sin tocar el rojo.' },
  { puesto:'Rack final', canal:ART.canal_canaleta,
    origin:[0.82,0.16], dest:[0.18,0.78], nCorners:3, bands:[[0.30,0.30,0.45,0.07],[0.30,0.62,0.45,0.07]],
    brief:'El último: 3 codos entre dos líneas. Hazlo perfecto y nos vamos. 🎂' },
];

const EDU = {
  E_ROUTE_POWER:{ t:'La ruta cruza la luz',
    what:'Un tramo recto pasa sobre la línea eléctrica.',
    why:'Datos y potencia juntos generan interferencia y errores de comunicación.',
    rule:'Separación mínima: 30 cm respecto a la electricidad.',
    todo:'Replantea la ruta: pon los codos para rodear la franja roja.' },
  E_ROUTE_INCOMPLETE:{ t:'La ruta no cierra',
    what:'No has llegado a la roseta.',
    why:'Un cable a medias no conecta — y alargarlo con un empalme sería una chapuza.',
    rule:'El cable va de extremo a extremo, sin empalmes.',
    todo:'Toca la roseta para cerrar la línea.' },
  E_RADIO_TIGHT:{ t:'Radio demasiado cerrado',
    what:'Fijaste una curva por debajo del mínimo.',
    why:'Un radio cerrado deforma los pares: +1‑3 dB de pérdida, tumba el 10 Gbps.',
    rule:'Mínimo TIA‑568: 4×Ø. Un buen instalador deja 8×Ø.',
    todo:'Reajusta esa curva por encima de 4×Ø (mejor 8×).' },
  E_RADIO_POWER:{ t:'La curva roza la luz',
    what:'Al abrir el radio, la curva invade la línea eléctrica.',
    why:'Acercarse a la potencia mete interferencia en los datos.',
    rule:'Separación mínima 30 cm, también en las curvas.',
    todo:'Reduce un poco esa curva o cambia la ruta para alejarla.' },
};

const WIN = {
  rot:['¡Limpio! Así da gusto.','Ese radio es de catálogo. 👌','Un puesto menos para la fiesta.'],
  final:'¡Y FUERA! Red entera, limpia. Cojo la chaqueta y me piro. 🎉',
};

/* ---------------- estado ---------------- */
const PHASE = { ROUTE:'route', RADII:'radii' };
const S = {
  level:0, points:0, stars:0,
  phase:PHASE.ROUTE,
  nodes:[],        // polilínea en px: [origin, ...corners, dest]
  radii:[],        // radio por corner (px)
  fixed:[],        // bool: corner ya fijado
  starGot:[],      // bool: corner clavado a la primera (>=8×)
  curCorner:0,     // índice de corner en ajuste (fase RADII)
  cornerFailed:{}, // {idx:true} corners que fallaron al menos una vez (sin estrella)
  dragIdx:-1, touchId:null,
  routeClosed:false,
};

const $ = id => document.getElementById(id);
const wall=$('wall'), canvas=$('cable'), ctx=canvas.getContext('2d');
let WALLW=0, WALLH=0, bandsPx=[], originPx=[0,0], destPx=[0,0];

/* ============ navegación ============ */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
  document.documentElement.className=(id==='results')?'results':'gameplay';
}
$('toHowto').onclick=()=>show('howto');
$('toPlay').onclick=()=>{ show('play'); startGame(); };
$('replay').onclick=()=>{ resetGame(); show('play'); startGame(); };
$('eduOk').onclick=()=>{ $('eduOverlay').classList.remove('show'); };

/* ============ háptica ============ */
function vibrate(level, pattern){
  if(!window.ReactNativeWebView){
    if(navigator.vibrate&&pattern) navigator.vibrate(pattern);
    else if(navigator.vibrate) navigator.vibrate(level==='error'?200:30);
    return;
  }
  const msg={action:'VIBRATE',level}; if(pattern) msg.pattern=pattern;
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

/* ============ setup ============ */
function resetGame(){ S.level=0; S.points=0; S.stars=0; }
function startGame(){ buildPartyTrack(); loadLevel(0); }

function buildPartyTrack(){
  const t=$('partyTrack'); t.innerHTML='';
  for(let i=0;i<LEVELS.length;i++){ const s=document.createElement('span'); s.textContent=i===LEVELS.length-1?'🎂':'🔧'; t.appendChild(s); }
}
function markParty(){ const sp=$('partyTrack').children; for(let i=0;i<sp.length;i++) sp[i].classList.toggle('done', i<S.level); }

function measureWall(){ const r=wall.getBoundingClientRect(); WALLW=r.width; WALLH=r.height; canvas.width=WALLW; canvas.height=WALLH; }

function loadLevel(i){
  S.level=i; S.dragIdx=-1; S.phase=PHASE.ROUTE; S.routeClosed=false; S.curCorner=0; S.cornerFailed={};
  const L=LEVELS[i];

  requestAnimationFrame(()=>{
    measureWall();
    originPx=[L.origin[0]*WALLW, L.origin[1]*WALLH];
    destPx  =[L.dest[0]*WALLW,   L.dest[1]*WALLH];
    bandsPx=L.bands.map(b=>({x:b[0]*WALLW,y:b[1]*WALLH,w:b[2]*WALLW,h:b[3]*WALLH}));
    // fase trazado empieza solo con el origen puesto
    S.nodes=[originPx.slice()];
    S.radii=[]; S.fixed=[]; S.starGot=[];
    placeBands(); placeCanal(L.canal); placeNodesArt(); placeAvatarSide(L.dest[0]);
    redraw();
  });

  $('hudPts').textContent=`${S.points} pts`;
  markParty();
  sayBubble(L.brief,'happy',4000);
  setMode('route');
}

function placeNodesArt(){
  const rack=$('rack'), roseta=$('roseta'), oh=$('originHalo'), dh=$('destHalo');
  if(rack.getAttribute('src')!==ART.rack){ rack.classList.remove('ph-rack'); rack.src=ART.rack; }
  if(roseta.getAttribute('src')!==ART.roseta){ roseta.classList.remove('ph-roseta'); roseta.src=ART.roseta; }
  rack.style.left=(originPx[0]-39)+'px'; rack.style.top=(originPx[1]-50)+'px';
  roseta.style.left=(destPx[0]-26)+'px'; roseta.style.top=(destPx[1]-26)+'px';
  oh.style.left=originPx[0]+'px'; oh.style.top=originPx[1]+'px';
  dh.style.left=destPx[0]+'px'; dh.style.top=destPx[1]+'px';
}
function placeBands(){
  const c=$('bands'); c.innerHTML='';
  bandsPx.forEach(b=>{
    const horiz=b.w>b.h;
    const d=document.createElement('div'); d.className='band'+(horiz?' horiz':'');
    d.style.left=b.x+'px'; d.style.top=b.y+'px'; d.style.width=b.w+'px'; d.style.height=b.h+'px';
    const lbl=document.createElement('span'); lbl.className='band-label'; lbl.innerHTML='⚡ LÍNEA ELÉCTRICA<br>NO PASAR';
    d.appendChild(lbl); c.appendChild(d);
  });
}
function placeCanal(src){ const c=$('canal'); if(!src){ c.hidden=true; return; } c.hidden=false; c.src=src; const w=Math.min(110,WALLW*0.40); c.style.width=w+'px'; c.style.left=(WALLW*0.5-w/2)+'px'; c.style.top='4px'; }

/* ============ geometría ============ */
function dist(a,b){ return Math.hypot(a[0]-b[0],a[1]-b[1]); }
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], add=(a,b)=>[a[0]+b[0],a[1]+b[1]], mul=(a,s)=>[a[0]*s,a[1]*s];
const norm=a=>{const l=Math.hypot(a[0],a[1])||1;return[a[0]/l,a[1]/l];};

/* distancia de un punto a un segmento (para colisión ruta-franja) */
function segPointDist(p,a,b){
  const ab=sub(b,a), t=Math.max(0,Math.min(1,(sub(p,a)[0]*ab[0]+sub(p,a)[1]*ab[1])/((ab[0]**2+ab[1]**2)||1)));
  const proj=add(a,mul(ab,t)); return dist(p,proj);
}
/* ¿un segmento recto cruza una franja+halo? muestreo */
function segHitsPower(a,b){
  const m=CFG.EXCL_HALO, N=24;
  for(let i=0;i<=N;i++){ const t=i/N, p=[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
    if(bandsPx.some(bd=>p[0]>=bd.x-m&&p[0]<=bd.x+bd.w+m&&p[1]>=bd.y-m&&p[1]<=bd.y+bd.h+m)) return true; }
  return false;
}
function routeHitsPower(){
  for(let i=1;i<S.nodes.length;i++) if(segHitsPower(S.nodes[i-1],S.nodes[i])) return true;
  return false;
}

/* radio efectivo recortado por geometría */
function effRadius(i){
  const A=S.nodes[i], P=S.nodes[i+1], B=S.nodes[i+2];
  const maxg=Math.min(dist(P,A),dist(P,B))*0.5;
  return Math.min(S.radii[i], maxg);
}
function multOf(i){ return effRadius(i)/CFG.DIAM_PX; } // radio en ×Ø

/* muestrea el cable con redondeo en cada corner */
function samplePath(){
  const n=S.nodes, pts=[n[0].slice()];
  for(let i=0;i<n.length-2;i++){
    const A=n[i],P=n[i+1],B=n[i+2], r=effRadius(i);
    const dA=norm(sub(A,P)), dB=norm(sub(B,P));
    const t1=add(P,mul(dA,r)), t2=add(P,mul(dB,r));
    pts.push(t1);
    for(let s=1;s<=14;s++){ const t=s/14,mt=1-t; pts.push([mt*mt*t1[0]+2*mt*t*P[0]+t*t*t2[0], mt*mt*t1[1]+2*mt*t*P[1]+t*t*t2[1]]); }
  }
  pts.push(n[n.length-1].slice());
  return pts;
}
function cornerArcPts(i){
  const A=S.nodes[i],P=S.nodes[i+1],B=S.nodes[i+2], r=effRadius(i);
  const dA=norm(sub(A,P)), dB=norm(sub(B,P));
  const t1=add(P,mul(dA,r)), t2=add(P,mul(dB,r)), out=[t1];
  for(let s=1;s<=14;s++){ const t=s/14,mt=1-t; out.push([mt*mt*t1[0]+2*mt*t*P[0]+t*t*t2[0], mt*mt*t1[1]+2*mt*t*P[1]+t*t*t2[1]]); }
  return out;
}
function cornerHitsPower(i){ return cornerArcPts(i).some(p=>{ const m=CFG.EXCL_HALO; return bandsPx.some(b=>p[0]>=b.x-m&&p[0]<=b.x+b.w+m&&p[1]>=b.y-m&&p[1]<=b.y+b.h+m); }); }

/* ============ render ============ */
function redraw(){
  ctx.clearRect(0,0,WALLW,WALLH);
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=CFG.CABLE_W;

  if(S.phase===PHASE.ROUTE){
    // polilínea de rectas (turquesa); el segmento al cursor se ve "pendiente"
    if(S.nodes.length>=2){
      ctx.beginPath(); ctx.moveTo(S.nodes[0][0],S.nodes[0][1]);
      for(let i=1;i<S.nodes.length;i++) ctx.lineTo(S.nodes[i][0],S.nodes[i][1]);
      ctx.strokeStyle = routeHitsPower() ? '#E74C3C' : '#00E6BC'; ctx.stroke();
    }
    // puntos colocados
    for(let i=1;i<S.nodes.length;i++){ const P=S.nodes[i];
      ctx.beginPath(); ctx.arc(P[0],P[1],7,0,Math.PI*2); ctx.fillStyle='#04FFB4'; ctx.fill(); }
  } else {
    // FASE RADII: cable con redondeos; sin color de validación (neutro)
    const pts=samplePath();
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.strokeStyle='#9fd9ff'; ctx.stroke(); // azul neutro, NO indica ok/mal
    // resalta corners ya fijados en su color real
    for(let i=0;i<S.nodes.length-2;i++){
      if(S.fixed[i]){
        const arc=cornerArcPts(i), ok=multOf(i)>=CFG.MULT_MIN && !cornerHitsPower(i);
        ctx.beginPath(); ctx.moveTo(arc[0][0],arc[0][1]); for(const p of arc) ctx.lineTo(p[0],p[1]);
        ctx.strokeStyle=ok?'#04FFB4':'#E74C3C'; ctx.lineWidth=CFG.CABLE_W; ctx.stroke(); ctx.lineWidth=CFG.CABLE_W;
      }
    }
    // handle del corner actual (neutro, sin color de juicio)
    const i=S.curCorner, P=S.nodes[i+1];
    if(P && !S.fixed[i]){
      ctx.beginPath(); ctx.arc(P[0],P[1],CFG.HANDLE_R,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,.16)'; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle='#fff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(P[0],P[1],4,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    }
  }
}

/* ============ FASE 1: trazado ============ */
function onTapRoute(p){
  // ¿cierra en la roseta?
  if(dist(p,destPx)<=CFG.SNAP_TOL){
    // cerrar: añade dest como último nodo
    S.nodes.push(destPx.slice());
    S.routeClosed=true;
    redraw(); updateRouteHint();
    vibrate('light');
    return;
  }
  if(S.routeClosed) return; // ya cerrada
  // límite de esquinas sugerido (permitimos +1 de margen)
  const placed=S.nodes.length-1; // sin contar origin
  const maxCorners=LEVELS[S.level].nCorners+1;
  if(placed>=maxCorners){ flashHint('Demasiados codos — toca la roseta para cerrar'); return; }
  S.nodes.push(p);
  redraw(); updateRouteHint(); vibrate('light');
}
function updateRouteHint(){
  if(S.routeClosed){
    if(routeHitsPower()) setHint('La ruta cruza la luz — replantéala','bad');
    else setHint('Ruta lista — pulsa "A las curvas"','ok');
  } else {
    const need=LEVELS[S.level].nCorners, have=S.nodes.length-1;
    setHint(`Toca los codos (${have}/${need}) y cierra en la roseta`);
  }
}

/* ============ FASE 2: radios ============ */
function startRadiiPhase(){
  const corners=S.nodes.length-2;
  if(corners<=0){ // recta: no hay radios -> termina directo
    succeedLevel(); return;
  }
  S.phase=PHASE.RADII;
  S.radii=new Array(corners).fill(CFG.RADIO_MIN_PX*0.7); // empieza por debajo del mínimo
  S.fixed=new Array(corners).fill(false);
  S.starGot=new Array(corners).fill(false);
  S.curCorner=0;
  setMode('radii');
  focusCorner();
  redraw();
}
function focusCorner(){
  const i=S.curCorner;
  sayBubble(`Curva ${i+1} de ${S.nodes.length-2}: ajusta el radio y fíjalo.`,'happy',2500);
  updateRadiiPill();
}
function updateRadiiPill(){
  const i=S.curCorner;
  const m=multOf(i);
  setHint(`Radio: ${m.toFixed(1)}×Ø  ·  arrastra y pulsa Fijar`); // SIN color (no revela si es ok)
}

/* ============ input ============ */
function localXY(cx,cy){ const r=wall.getBoundingClientRect(); return [cx-r.left, cy-r.top]; }

function pointerDown(x,y){
  if($('eduOverlay').classList.contains('show')) return;
  const p=localXY(x,y);
  if(S.phase===PHASE.ROUTE){ onTapRoute(p); }
  else { // RADII: agarrar el handle del corner actual
    const i=S.curCorner, P=S.nodes[i+1];
    if(P && !S.fixed[i] && dist(p,P)<=CFG.SNAP_TOL+8){ S.dragIdx=i; vibrate('light'); }
  }
}
function pointerMove(x,y){
  if(S.phase!==PHASE.RADII || S.dragIdx<0) return;
  const p=localXY(x,y), i=S.dragIdx;
  const A=S.nodes[i],P=S.nodes[i+1],B=S.nodes[i+2];
  const dA=norm(sub(A,P)),dB=norm(sub(B,P));
  let bis=norm(add(dA,dB)); if(bis[0]===0&&bis[1]===0) bis=[-dA[1],dA[0]];
  const fv=sub(p,P); let depth=Math.max(0, fv[0]*bis[0]+fv[1]*bis[1]);
  S.radii[i]=Math.max(0,Math.min(CFG.RADIO_MAX_PX, depth*0.9));
  updateRadiiPill(); redraw();
}
function pointerUp(){ S.dragIdx=-1; }

/* ============ botón de acción (cambia según fase) ============ */
function onActionBtn(){
  if($('eduOverlay').classList.contains('show')) return;
  if(S.phase===PHASE.ROUTE){
    if(!S.routeClosed){ flashHint('Cierra la ruta tocando la roseta'); return; }
    if(routeHitsPower()){ failEdu('E_ROUTE_POWER'); return; }
    startRadiiPhase();
  } else {
    // fijar el radio del corner actual
    fixCurrentCorner();
  }
}
function fixCurrentCorner(){
  const i=S.curCorner;
  const m=multOf(i);
  const tooTight = m < CFG.MULT_MIN;
  const hitsPow = cornerHitsPower(i);

  if(tooTight){ failEdu('E_RADIO_TIGHT'); return; }
  if(hitsPow){ failEdu('E_RADIO_POWER'); return; }

  // correcto. Estrella si llegó a >=8×Ø y nunca falló este corner.
  S.fixed[i]=true;
  const failedBefore = S.cornerFailed && S.cornerFailed[i]===true;
  S.starGot[i] = (m >= CFG.MULT_PRO) && !failedBefore;
  vibrate('success');
  redraw();

  const corners=S.nodes.length-2;
  if(i+1<corners){ S.curCorner++; focusCorner(); redraw(); }
  else { succeedLevel(); }
}

/* registra fallo por corner (para quitar estrella) */
function markCornerFailed(){
  if(!S.cornerFailed) S.cornerFailed={};
  S.cornerFailed[S.curCorner]=true;
}

function failEdu(code){
  markCornerFailed();
  canvas.classList.add('shake'); setTimeout(()=>canvas.classList.remove('shake'),350);
  vibrate('error',[0,120,60,120]);
  const e=EDU[code];
  $('eduTitle').textContent=e.t; $('eduWhat').textContent=e.what; $('eduWhy').textContent=e.why;
  $('eduRule').textContent=e.rule; $('eduDo').textContent=e.todo;
  sayBubble('', 'worried', 0);
  $('eduOverlay').classList.add('show');
}

/* ============ fin de nivel ============ */
function succeedLevel(){
  // dibujo final limpio + bridas
  S.phase=PHASE.RADII;
  const pts=samplePath();
  ctx.clearRect(0,0,WALLW,WALLH);
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=CFG.CABLE_W; ctx.strokeStyle='#04FFB4';
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke();
  drawBridas(pts);

  // puntuación: estrellas por corners clavados a 8× sin fallo (recta = estrella gratis)
  const corners=S.nodes.length-2;
  let starsThis = corners===0 ? 1 : S.starGot.filter(Boolean).length;
  let maxStars = corners===0 ? 1 : corners;
  S.stars += starsThis;
  S.points += starsThis*100 + (starsThis===maxStars?50:0); // bonus si todas a 8×
  S.cornerFailed={};

  $('hudPts').textContent=`${S.points} pts`;
  const isFinal=S.level===LEVELS.length-1;
  setHint(isFinal?'¡Instalación terminada!':'¡Tramo limpio!','ok');
  vibrate('success', isFinal?[0,80,50,80,50,160]:undefined);
  sayBubble(isFinal?WIN.final:WIN.rot[S.level%WIN.rot.length],'celebrating',1700);
  setMode('done');
  setTimeout(()=>{ isFinal?finish():loadLevel(S.level+1); }, 1600);
}

function drawBridas(pts){
  if(pts.length<2) return; let acc=0; const step=78;
  ctx.strokeStyle='#04FFB4'; ctx.lineWidth=3;
  for(let i=1;i<pts.length;i++){ acc+=dist(pts[i-1],pts[i]);
    if(acc>=step){ acc=0; const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
      ctx.beginPath(); ctx.moveTo(pts[i][0]-nx*8,pts[i][1]-ny*8); ctx.lineTo(pts[i][0]+nx*8,pts[i][1]+ny*8); ctx.stroke(); } }
}

/* ============ modos UI (botón de acción) ============ */
function setMode(mode){
  const btn=$('tendBtn');
  if(mode==='route'){ btn.textContent='A las curvas →'; btn.style.display=''; }
  else if(mode==='radii'){ btn.textContent='Fijar radio ✓'; btn.style.display=''; }
  else { btn.style.display='none'; }
}
let hintTimer=null;
function flashHint(txt){ setHint(txt,'bad'); clearTimeout(hintTimer); hintTimer=setTimeout(()=>{ if(S.phase===PHASE.ROUTE) updateRouteHint(); else updateRadiiPill(); },1600); }
function setHint(txt,state){
  const p=$('radioPill'); p.className='radio-pill'+(state==='bad'?' bad':'');
  $('radioTxt').textContent=txt; $('radioDots').textContent = state==='bad'?'●○○○○':'●●●●●';
}

/* ============ avatar + burbuja ============ */
function setAvatar(img,state){ img.classList.remove('ph-vega'); img.onerror=()=>{img.classList.add('ph-vega');img.removeAttribute('src');}; img.src=ART['vega_'+state]; }
function placeAvatarSide(destX){ const av=$('gameAvatar'),b=$('vegaBubble'); const left=destX>0.5; av.classList.toggle('left',left); b.classList.toggle('bub-left',left); }
let bubbleTimer=null;
function sayBubble(text,state,ms){ const av=$('gameAvatar'),b=$('vegaBubble'); setAvatar(av,state); av.classList.toggle('show',state!=='happy');
  if(text){ b.innerHTML=text; b.classList.add('show'); } else b.classList.remove('show');
  clearTimeout(bubbleTimer); if(ms>0) bubbleTimer=setTimeout(()=>{ b.classList.remove('show'); av.classList.remove('show'); setAvatar(av,'happy'); },ms); }

/* ============ resultados ============ */
function finish(){
  const totalStars=S.stars;
  // estrellas máximas posibles = suma de corners de cada nivel (recta cuenta 1)
  let maxStars=0; LEVELS.forEach(l=> maxStars += (l.nCorners===0?1:l.nCorners));
  const pct=Math.round((totalStars/maxStars)*100);
  if(totalStars===maxStars) S.points+=200;

  let state,msg,medal=false,title;
  if(pct>=90){ state='celebrating'; medal=true; title='¡Red lista!'; msg='¡Radios de catálogo a la primera! Instalación impecable. <b>Nos vamos de cumple.</b> 🎂'; }
  else if(pct>=60){ state='happy'; title='¡Red lista!'; msg='Buen trabajo. Algún radio se quedó justo, pero la red está limpia. ¡A celebrar!'; }
  else { state='worried'; title='Red terminada'; msg='Funciona, pero apura los radios: recuerda 4×Ø mínimo, 8×Ø de margen pro. La próxima, a la primera.'; }

  setAvatar($('resAvatar'),state);
  $('resTitle').textContent=title; $('resMedal').hidden=!medal; $('resMsg').innerHTML=msg;
  $('resQuality').textContent=`${totalStars}/${maxStars}★`; $('resPts').textContent=S.points;

  const prev=parseInt(localStorage.getItem(RECORD_KEY)||'0',10);
  if(S.points>prev){ localStorage.setItem(RECORD_KEY,String(S.points)); $('resRecord').textContent=`Nuevo récord: ${prev} → ${S.points}`; }
  else $('resRecord').textContent=`Récord: ${prev}`;

  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}));
  show('results');
}

/* ============ listeners ============ */
$('tendBtn') && ($('tendBtn').onclick=onActionBtn);
canvas.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.changedTouches[0]; S.touchId=t.identifier; pointerDown(t.clientX,t.clientY); },{passive:false});
canvas.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier===S.touchId){ pointerMove(t.clientX,t.clientY); break; } } },{passive:false});
canvas.addEventListener('touchend',e=>{ e.preventDefault(); pointerUp(); },{passive:false});
let md=false;
canvas.addEventListener('mousedown',e=>{ md=true; pointerDown(e.clientX,e.clientY); });
canvas.addEventListener('mousemove',e=>{ if(md) pointerMove(e.clientX,e.clientY); });
window.addEventListener('mouseup',()=>{ md=false; pointerUp(); });
window.addEventListener('resize',()=>{ if($('play').classList.contains('active')) loadLevel(S.level); });
