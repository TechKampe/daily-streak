'use strict';

/* ============================================================
   Vega Traza Limpio — S4D1-AM (Cableado de datos)
   DOS FASES:
   1) TRAZO LIBRE: el jugador dibuja la ruta con el dedo (rack→roseta).
      El trazo se simplifica (Douglas-Peucker) -> tramos rectos + esquinas
      detectadas automáticamente donde giró.
   2) AJUSTE DE CURVAS: arrastra cada esquina hacia dentro para abrir la
      curva. Indicador muestra N×Ø EN VIVO sin color (a ciegas); al soltar
      se revela ✅/❌. Clavar a 8×Ø sin fallos = estrella. Mín norma 4×Ø.
   ============================================================ */

const CFG = {
  DIAM_PX: 11, MULT_MIN: 4, MULT_PRO: 8, RADIO_MAX_PX: 130,
  CABLE_W: 11, HANDLE_R: 18, SNAP_TOL: 30,
  EXCL_HALO: 26,
  RDP_EPS: 22,        // tolerancia de simplificación (px) -> detecta giros reales
  MIN_PT_DIST: 4,     // distancia mínima entre puntos del trazo
  START_MOVE: 12,     // movimiento mínimo desde el rack para empezar a contar
};
CFG.RADIO_MIN_PX = CFG.MULT_MIN*CFG.DIAM_PX; // 44
CFG.RADIO_PRO_PX = CFG.MULT_PRO*CFG.DIAM_PX; // 88

const RECORD_KEY = 'vega_traza_limpio_record';
const CDN='https://res.cloudinary.com/kampe/image/upload/';
const ART={
  vega_happy:CDN+'v1780487714/vega_happy_pfvzas.png',
  vega_celebrating:CDN+'v1780487621/vega_celebrating_asjumn.png',
  vega_worried:CDN+'v1780487620/vega_worried_wf1qeg.png',
  rack:CDN+'v1780487609/rack_wyomvy.png',
  roseta:CDN+'v1780487608/roseta_ddbguh.png',
  canal_bandeja:CDN+'v1780487609/canal_bandeja_p5gd3k.png',
  canal_canaleta:CDN+'v1780487601/canal_canaleta_kefo9t.png',
  canal_tubo:CDN+'v1780487601/canal_tubo_kr82zs.png',
};

const LEVELS=[
  { puesto:'Recepción', canal:null, origin:[0.18,0.18], dest:[0.82,0.64], bands:[],
    brief:'Traza el cable con el dedo, del rack a la roseta. Sin soltar.' },
  { puesto:'Sala de reuniones', canal:ART.canal_bandeja, origin:[0.18,0.16], dest:[0.80,0.72], bands:[],
    brief:'Dibuja la ruta con el dedo. Luego abrirás la curva de la esquina.' },
  { puesto:'Despacho', canal:ART.canal_canaleta, origin:[0.82,0.16], dest:[0.20,0.72], bands:[[0.42,0.30,0.16,0.34]],
    brief:'Traza esquivando la línea eléctrica. Luego ajustas las curvas.' },
  { puesto:'Office', canal:ART.canal_tubo, origin:[0.18,0.16], dest:[0.82,0.16], bands:[[0.40,0.22,0.20,0.28]],
    brief:'Rodea la línea eléctrica con el dedo y luego abre las curvas.' },
  { puesto:'Open space', canal:ART.canal_bandeja, origin:[0.18,0.16], dest:[0.82,0.74], bands:[[0.00,0.34,0.30,0.09],[0.70,0.54,0.30,0.09]],
    brief:'Serpentea entre las dos líneas con el dedo. Luego ajusta cada curva.' },
  { puesto:'Rack final', canal:ART.canal_canaleta, origin:[0.82,0.16], dest:[0.18,0.78], bands:[[0.30,0.30,0.45,0.07],[0.30,0.62,0.45,0.07]],
    brief:'El último: traza entre las dos líneas y borda las curvas. 🎂' },
];

const EDU={
  E_ROUTE_POWER:{t:'La ruta cruza la luz',what:'Tu trazo pasa sobre la línea eléctrica.',why:'Datos y potencia juntos = interferencia y errores.',rule:'Separación mínima 30 cm.',todo:'Vuelve a trazar rodeando la franja roja.'},
  E_ROUTE_INCOMPLETE:{t:'No llegaste a la roseta',what:'Soltaste el dedo antes de la roseta.',why:'Un cable a medias no conecta, y empalmar es chapuza.',rule:'El cable va de extremo a extremo.',todo:'Traza sin soltar hasta tocar la roseta.'},
  E_RADIO_TIGHT:{t:'Curva demasiado cerrada',what:'Esa curva quedó por debajo del mínimo.',why:'Un radio cerrado deforma los pares: +1‑3 dB, tumba el 10 Gbps.',rule:'Mínimo TIA‑568: 4×Ø. Pro: 8×Ø.',todo:'Arrastra la esquina para abrir más esa curva.'},
  E_RADIO_POWER:{t:'La curva roza la luz',what:'Al abrir el radio, la curva invade la línea.',why:'Acercarse a la potencia mete interferencia.',rule:'30 cm también en las curvas.',todo:'Reduce un poco esa curva o re-traza la ruta.'},
};
const WIN={rot:['¡Limpio! Así da gusto.','Ese radio es de catálogo. 👌','Un puesto menos para la fiesta.'],final:'¡Y FUERA! Red entera, limpia. Cojo la chaqueta y me piro. 🎉'};

const PHASE={DRAW:'draw',CURVE:'curve'};
const S={
  level:0, points:0, stars:0, phase:PHASE.DRAW,
  raw:[],          // trazo crudo del dedo (fase DRAW)
  nodes:[],        // polilínea simplificada [origin,...corners,dest]
  radii:[], fixed:[], starGot:[], cornerFailed:{},
  curCorner:0, dragIdx:-1, touchId:null, drawing:false,
};

const $=id=>document.getElementById(id);
const wall=$('wall'), canvas=$('cable'), ctx=canvas.getContext('2d');
let WALLW=0,WALLH=0,bandsPx=[],originPx=[0,0],destPx=[0,0];

/* ============ nav ============ */
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id).classList.add('active'); document.documentElement.className=(id==='results')?'results':'gameplay'; }
$('toHowto').onclick=()=>show('howto');
$('toPlay').onclick=()=>{ show('play'); startGame(); };
$('replay').onclick=()=>{ resetGame(); show('play'); startGame(); };
$('eduOk').onclick=()=>{ $('eduOverlay').classList.remove('show'); if(S.phase===PHASE.DRAW) restartDraw(); };

/* ============ háptica ============ */
function vibrate(level,pattern){ if(!window.ReactNativeWebView){ if(navigator.vibrate&&pattern)navigator.vibrate(pattern); else if(navigator.vibrate)navigator.vibrate(level==='error'?200:30); return; } const msg={action:'VIBRATE',level}; if(pattern)msg.pattern=pattern; window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }

/* ============ setup ============ */
function resetGame(){ S.level=0; S.points=0; S.stars=0; }
function startGame(){ buildPartyTrack(); loadLevel(0); }
function buildPartyTrack(){ const t=$('partyTrack'); t.innerHTML=''; for(let i=0;i<LEVELS.length;i++){ const s=document.createElement('span'); s.textContent=i===LEVELS.length-1?'🎂':'🔧'; t.appendChild(s);} }
function markParty(){ const sp=$('partyTrack').children; for(let i=0;i<sp.length;i++) sp[i].classList.toggle('done', i<S.level); }
function measureWall(){ const r=wall.getBoundingClientRect(); WALLW=r.width; WALLH=r.height; canvas.width=WALLW; canvas.height=WALLH; }

function loadLevel(i){
  S.level=i; S.phase=PHASE.DRAW; S.dragIdx=-1; S.drawing=false; S.raw=[]; S.cornerFailed={};
  const L=LEVELS[i];
  requestAnimationFrame(()=>{
    measureWall();
    originPx=[L.origin[0]*WALLW,L.origin[1]*WALLH];
    destPx=[L.dest[0]*WALLW,L.dest[1]*WALLH];
    bandsPx=L.bands.map(b=>({x:b[0]*WALLW,y:b[1]*WALLH,w:b[2]*WALLW,h:b[3]*WALLH}));
    S.nodes=[]; S.radii=[]; S.fixed=[]; S.starGot=[];
    placeBands(); placeCanal(L.canal); placeNodesArt(); placeAvatarSide(L.dest[0]);
    redraw(); setHint('Pon el dedo en el rack y traza hasta la roseta');
  });
  $('hudPts').textContent=`${S.points} pts`; markParty();
  sayBubble(L.brief,'happy',3500);
}
function restartDraw(){ S.raw=[]; S.drawing=false; S.nodes=[]; redraw(); setHint('Pon el dedo en el rack y traza hasta la roseta'); }

function placeNodesArt(){
  const rack=$('rack'),roseta=$('roseta'),oh=$('originHalo'),dh=$('destHalo');
  if(rack.getAttribute('src')!==ART.rack){ rack.classList.remove('ph-rack'); rack.src=ART.rack; }
  if(roseta.getAttribute('src')!==ART.roseta){ roseta.classList.remove('ph-roseta'); roseta.src=ART.roseta; }
  rack.style.left=(originPx[0]-39)+'px'; rack.style.top=(originPx[1]-50)+'px';
  roseta.style.left=(destPx[0]-26)+'px'; roseta.style.top=(destPx[1]-26)+'px';
  oh.style.left=originPx[0]+'px'; oh.style.top=originPx[1]+'px';
  dh.style.left=destPx[0]+'px'; dh.style.top=destPx[1]+'px';
}
function placeBands(){ const c=$('bands'); c.innerHTML=''; bandsPx.forEach(b=>{ const horiz=b.w>b.h; const d=document.createElement('div'); d.className='band'+(horiz?' horiz':''); d.style.left=b.x+'px'; d.style.top=b.y+'px'; d.style.width=b.w+'px'; d.style.height=b.h+'px'; const l=document.createElement('span'); l.className='band-label'; l.innerHTML='⚡ LÍNEA ELÉCTRICA<br>NO PASAR'; d.appendChild(l); c.appendChild(d); }); }
function placeCanal(src){ const c=$('canal'); if(!src){c.hidden=true;return;} c.hidden=false; c.src=src; const w=Math.min(110,WALLW*0.40); c.style.width=w+'px'; c.style.left=(WALLW*0.5-w/2)+'px'; c.style.top='4px'; }

/* ============ utilidades ============ */
function dist(a,b){ return Math.hypot(a[0]-b[0],a[1]-b[1]); }
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,s)=>[a[0]*s,a[1]*s];
const norm=a=>{const l=Math.hypot(a[0],a[1])||1;return[a[0]/l,a[1]/l];};

/* Douglas-Peucker: simplifica el trazo a vértices = esquinas reales */
function rdp(points, eps){
  if(points.length<3) return points.slice();
  let dmax=0, idx=0; const a=points[0], b=points[points.length-1];
  for(let i=1;i<points.length-1;i++){ const d=segPointDist(points[i],a,b); if(d>dmax){ dmax=d; idx=i; } }
  if(dmax>eps){ const l=rdp(points.slice(0,idx+1),eps), r=rdp(points.slice(idx),eps); return l.slice(0,-1).concat(r); }
  return [a,b];
}
function segPointDist(p,a,b){ const ab=sub(b,a), L2=(ab[0]**2+ab[1]**2)||1; let t=((p[0]-a[0])*ab[0]+(p[1]-a[1])*ab[1])/L2; t=Math.max(0,Math.min(1,t)); const proj=add(a,mul(ab,t)); return dist(p,proj); }

/* colisión segmento-franja */
function segHitsPower(a,b){ const m=CFG.EXCL_HALO,N=24; for(let i=0;i<=N;i++){ const t=i/N,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]; if(bandsPx.some(bd=>p[0]>=bd.x-m&&p[0]<=bd.x+bd.w+m&&p[1]>=bd.y-m&&p[1]<=bd.y+bd.h+m))return true; } return false; }
function rawHitsPower(){ for(let i=1;i<S.raw.length;i++) if(segHitsPower(S.raw[i-1],S.raw[i])) return true; return false; }

/* radio efectivo y colisión por curva */
function effRadius(i){ const A=S.nodes[i],P=S.nodes[i+1],B=S.nodes[i+2]; return Math.min(S.radii[i],Math.min(dist(P,A),dist(P,B))*0.5); }
function multOf(i){ return effRadius(i)/CFG.DIAM_PX; }
function cornerArcPts(i){ const A=S.nodes[i],P=S.nodes[i+1],B=S.nodes[i+2],r=effRadius(i); const dA=norm(sub(A,P)),dB=norm(sub(B,P)); const t1=add(P,mul(dA,r)),t2=add(P,mul(dB,r)),out=[t1]; for(let s=1;s<=14;s++){const t=s/14,mt=1-t;out.push([mt*mt*t1[0]+2*mt*t*P[0]+t*t*t2[0],mt*mt*t1[1]+2*mt*t*P[1]+t*t*t2[1]]);} return out; }
function cornerHitsPower(i){ const m=CFG.EXCL_HALO; return cornerArcPts(i).some(p=>bandsPx.some(b=>p[0]>=b.x-m&&p[0]<=b.x+b.w+m&&p[1]>=b.y-m&&p[1]<=b.y+b.h+m)); }

function samplePath(){ const n=S.nodes,pts=[n[0].slice()]; for(let i=0;i<n.length-2;i++){ const A=n[i],P=n[i+1],B=n[i+2],r=effRadius(i); const dA=norm(sub(A,P)),dB=norm(sub(B,P)); const t1=add(P,mul(dA,r)),t2=add(P,mul(dB,r)); pts.push(t1); for(let s=1;s<=14;s++){const t=s/14,mt=1-t;pts.push([mt*mt*t1[0]+2*mt*t*P[0]+t*t*t2[0],mt*mt*t1[1]+2*mt*t*P[1]+t*t*t2[1]]);} } pts.push(n[n.length-1].slice()); return pts; }

/* ============ render ============ */
function redraw(){
  ctx.clearRect(0,0,WALLW,WALLH);
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=CFG.CABLE_W;
  if(S.phase===PHASE.DRAW){
    if(S.raw.length>=2){
      ctx.beginPath(); ctx.moveTo(S.raw[0][0],S.raw[0][1]);
      for(let i=1;i<S.raw.length;i++) ctx.lineTo(S.raw[i][0],S.raw[i][1]);
      ctx.strokeStyle = rawHitsPower()?'#E74C3C':'#00E6BC'; ctx.stroke();
    }
  } else { // CURVE
    const pts=samplePath();
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.strokeStyle='#9fd9ff'; ctx.stroke(); // neutro: NO revela ok/mal en vivo
    // codos fijados: color real
    for(let i=0;i<S.nodes.length-2;i++) if(S.fixed[i]){ const arc=cornerArcPts(i),ok=multOf(i)>=CFG.MULT_MIN&&!cornerHitsPower(i); ctx.beginPath(); ctx.moveTo(arc[0][0],arc[0][1]); for(const p of arc)ctx.lineTo(p[0],p[1]); ctx.strokeStyle=ok?'#04FFB4':'#E74C3C'; ctx.stroke(); }
    // handles de todas las esquinas (la actual más grande)
    for(let i=0;i<S.nodes.length-2;i++){ const P=S.nodes[i+1], cur=(i===S.curCorner); ctx.beginPath(); ctx.arc(P[0],P[1],cur?CFG.HANDLE_R:12,0,Math.PI*2); ctx.fillStyle=cur?'rgba(255,255,255,.18)':'rgba(255,255,255,.10)'; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=S.fixed[i]?(multOf(i)>=CFG.MULT_MIN&&!cornerHitsPower(i)?'#04FFB4':'#E74C3C'):'#fff'; ctx.stroke(); ctx.lineWidth=CFG.CABLE_W; ctx.beginPath(); ctx.arc(P[0],P[1],4,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill(); }
  }
}

/* ============ FASE 1: trazo libre ============ */
function drawStart(p){ if(dist(p,originPx)>CFG.SNAP_TOL) return; S.drawing=true; S.raw=[originPx.slice()]; $('originHalo').style.display='none'; vibrate('light'); }
function drawMove(p){ if(!S.drawing) return; p=[Math.max(0,Math.min(WALLW,p[0])),Math.max(0,Math.min(WALLH,p[1]))]; if(dist(p,S.raw[S.raw.length-1])<CFG.MIN_PT_DIST) return; S.raw.push(p); redraw(); if(rawHitsPower()) setHint('Estás tocando la luz — rodéala','bad'); else setHint('Sigue hasta la roseta'); }
function drawEnd(p){
  if(!S.drawing) return; S.drawing=false;
  $('originHalo').style.display='block';
  const moved = S.raw.length>1 ? dist(S.raw[S.raw.length-1],originPx) : 0;
  if(moved<CFG.START_MOVE){ S.raw=[]; redraw(); return; }
  if(dist(p,destPx)>CFG.SNAP_TOL+12){ failEdu('E_ROUTE_INCOMPLETE'); return; }
  if(rawHitsPower()){ failEdu('E_ROUTE_POWER'); return; }
  // cerrar el trazo en la roseta y simplificar
  S.raw.push(destPx.slice());
  const simplified = rdp(S.raw, CFG.RDP_EPS);
  // garantizar extremos exactos
  simplified[0]=originPx.slice(); simplified[simplified.length-1]=destPx.slice();
  S.nodes = simplified;
  vibrate('success');
  startCurvePhase();
}

/* ============ FASE 2: ajustar curvas ============ */
function startCurvePhase(){
  const corners=S.nodes.length-2;
  if(corners<=0){ succeedLevel(); return; } // recta pura, sin curvas
  S.phase=PHASE.CURVE;
  S.radii=new Array(corners).fill(CFG.RADIO_MIN_PX*0.6); // empieza cerrado
  S.fixed=new Array(corners).fill(false); S.starGot=new Array(corners).fill(false);
  S.curCorner=0; redraw(); focusCorner();
}
function focusCorner(){ const i=S.curCorner,t=S.nodes.length-2; sayBubble(`Curva ${i+1} de ${t}: arrástrala para abrirla y suelta.`,'happy',2600); updateCurvePill(); }
function updateCurvePill(){ const i=S.curCorner,t=S.nodes.length-2,m=multOf(i); setHint(`Curva ${i+1}/${t} · Radio ${m.toFixed(1)}×Ø · arrastra y suelta`); }

function fixCorner(i){
  const m=multOf(i);
  if(m<CFG.MULT_MIN){ S.cornerFailed[i]=true; failEdu('E_RADIO_TIGHT'); return; }
  if(cornerHitsPower(i)){ S.cornerFailed[i]=true; failEdu('E_RADIO_POWER'); return; }
  S.fixed[i]=true; S.starGot[i]=(m>=CFG.MULT_PRO)&&(S.cornerFailed[i]!==true); vibrate('success'); redraw();
  const next=S.fixed.findIndex(f=>!f);
  if(next>=0){ S.curCorner=next; focusCorner(); redraw(); } else succeedLevel();
}

/* ============ input ============ */
function localXY(cx,cy){ const r=wall.getBoundingClientRect(); return [cx-r.left,cy-r.top]; }
function pointerDown(x,y){
  if($('eduOverlay').classList.contains('show')) return;
  const p=localXY(x,y);
  if(S.phase===PHASE.DRAW){ drawStart(p); }
  else { let best=-1,bd=CFG.SNAP_TOL+12; for(let i=0;i<S.nodes.length-2;i++){const d=dist(p,S.nodes[i+1]); if(d<bd){bd=d;best=i;}} if(best>=0){ S.dragIdx=best; S.curCorner=best; updateCurvePill(); vibrate('light'); } }
}
function pointerMove(x,y){
  const p=localXY(x,y);
  if(S.phase===PHASE.DRAW){ drawMove(p); return; }
  if(S.dragIdx<0) return;
  const i=S.dragIdx, A=S.nodes[i],P=S.nodes[i+1],B=S.nodes[i+2];
  const dA=norm(sub(A,P)),dB=norm(sub(B,P)); let bis=norm(add(dA,dB)); if(bis[0]===0&&bis[1]===0)bis=[-dA[1],dA[0]];
  const fv=sub(p,P); let depth=Math.max(0,fv[0]*bis[0]+fv[1]*bis[1]);
  S.radii[i]=Math.max(0,Math.min(CFG.RADIO_MAX_PX,depth*0.9)); updateCurvePill(); redraw();
}
function pointerUp(x,y){
  if(S.phase===PHASE.DRAW){ drawEnd(localXY(x,y)); return; }
  if(S.dragIdx>=0){ const i=S.dragIdx; S.dragIdx=-1; if(S.radii[i]>4){ fixCorner(i); } }
}

/* ============ fin nivel ============ */
function succeedLevel(){
  S.phase=PHASE.CURVE;
  const pts=samplePath();
  ctx.clearRect(0,0,WALLW,WALLH); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=CFG.CABLE_W; ctx.strokeStyle='#04FFB4';
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke();
  drawBridas(pts);
  const corners=S.nodes.length-2;
  const starsThis = corners===0?1:S.starGot.filter(Boolean).length;
  const maxStars = corners===0?1:corners;
  S.stars+=starsThis; S.points += starsThis*100 + (starsThis===maxStars?50:0); S.cornerFailed={};
  $('hudPts').textContent=`${S.points} pts`;
  const isFinal=S.level===LEVELS.length-1;
  setHint(isFinal?'¡Instalación terminada!':'¡Tramo limpio!','ok');
  vibrate('success', isFinal?[0,80,50,80,50,160]:undefined);
  sayBubble(isFinal?WIN.final:WIN.rot[S.level%WIN.rot.length],'celebrating',1700);
  setTimeout(()=>{ isFinal?finish():loadLevel(S.level+1); },1600);
}
function drawBridas(pts){ if(pts.length<2)return; let acc=0; const step=78; ctx.strokeStyle='#04FFB4'; ctx.lineWidth=3; for(let i=1;i<pts.length;i++){ acc+=dist(pts[i-1],pts[i]); if(acc>=step){ acc=0; const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l; ctx.beginPath(); ctx.moveTo(pts[i][0]-nx*8,pts[i][1]-ny*8); ctx.lineTo(pts[i][0]+nx*8,pts[i][1]+ny*8); ctx.stroke(); } } }

/* ============ overlays / hint ============ */
function failEdu(code){ canvas.classList.add('shake'); setTimeout(()=>canvas.classList.remove('shake'),350); vibrate('error',[0,120,60,120]); const e=EDU[code]; $('eduTitle').textContent=e.t; $('eduWhat').textContent=e.what; $('eduWhy').textContent=e.why; $('eduRule').textContent=e.rule; $('eduDo').textContent=e.todo; sayBubble('','worried',0); $('eduOverlay').classList.add('show'); }
function setHint(txt,state){ const p=$('radioPill'); p.className='radio-pill'+(state==='bad'?' bad':''); $('radioTxt').textContent=txt; $('radioDots').textContent=state==='bad'?'●○○○○':'●●●●●'; }

/* ============ avatar ============ */
function setAvatar(img,state){ img.classList.remove('ph-vega'); img.onerror=()=>{img.classList.add('ph-vega');img.removeAttribute('src');}; img.src=ART['vega_'+state]; }
function placeAvatarSide(destX){ const av=$('gameAvatar'),b=$('vegaBubble'); const left=destX>0.5; av.classList.toggle('left',left); b.classList.toggle('bub-left',left); }
let bubbleTimer=null;
function sayBubble(text,state,ms){ const av=$('gameAvatar'),b=$('vegaBubble'); setAvatar(av,state); av.classList.toggle('show',state!=='happy'); if(text){b.innerHTML=text;b.classList.add('show');}else b.classList.remove('show'); clearTimeout(bubbleTimer); if(ms>0)bubbleTimer=setTimeout(()=>{b.classList.remove('show');av.classList.remove('show');setAvatar(av,'happy');},ms); }

/* ============ resultados ============ */
function finish(){
  // tier por puntos (cada nivel da 100/curva + 50 bonus si todas a 8×).
  // umbral "perfecto" ~ 6 niveles bien = 600+. medio ~ 300+. bajo < 300.
  const p=S.points;
  let state,msg,medal=false,title;
  if(p>=600){ state='celebrating'; medal=true; title='¡Red lista!'; msg='¡Curvas de catálogo! Instalación impecable. <b>Nos vamos de cumple.</b> 🎂'; }
  else if(p>=300){ state='happy'; title='¡Red lista!'; msg='Buen trabajo. Alguna curva justa, pero la red está limpia. ¡A celebrar!'; }
  else { state='worried'; title='Red terminada'; msg='Funciona, pero apura los radios: 4×Ø mínimo, 8×Ø de margen pro. La próxima, a la primera.'; }
  setAvatar($('resAvatar'),state); $('resTitle').textContent=title; $('resMedal').hidden=!medal; $('resMsg').innerHTML=msg;
  $('resQuality').textContent=`${S.stars}★`; $('resPts').textContent=S.points;
  const prev=parseInt(localStorage.getItem(RECORD_KEY)||'0',10);
  if(S.points>prev){ localStorage.setItem(RECORD_KEY,String(S.points)); $('resRecord').textContent=`Nuevo récord: ${prev} → ${S.points}`; } else $('resRecord').textContent=`Récord: ${prev}`;
  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}));
  show('results');
}

/* ============ listeners ============ */
canvas.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.changedTouches[0]; S.touchId=t.identifier; pointerDown(t.clientX,t.clientY); },{passive:false});
canvas.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier===S.touchId){ pointerMove(t.clientX,t.clientY); break; } } },{passive:false});
canvas.addEventListener('touchend',e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier===S.touchId){ pointerUp(t.clientX,t.clientY); break; } } },{passive:false});
let md=false;
canvas.addEventListener('mousedown',e=>{ md=true; pointerDown(e.clientX,e.clientY); });
canvas.addEventListener('mousemove',e=>{ if(md) pointerMove(e.clientX,e.clientY); });
window.addEventListener('mouseup',e=>{ if(md){ md=false; pointerUp(e.clientX,e.clientY); } });
window.addEventListener('resize',()=>{ if($('play').classList.contains('active')) loadLevel(S.level); });
