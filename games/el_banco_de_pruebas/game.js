/* ===== El Banco de Pruebas — game.js (v2) =====
   Ficha de prueba de sensor: hasta 3 pasos por sensor.
   PASO 1 ubicar (tap) · PASO 2 ordenar la conexión (reordenar lista) · PASO 3 razonar NA/NC (tap).
   Sin osciloscopio. Ver GDD_EL_BANCO_DE_PRUEBAS.md para specs.
*/

'use strict';

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function point(e, end){
  const t = (e.touches && e.touches[0]) || (end && e.changedTouches && e.changedTouches[0]);
  return t ? {x:t.clientX, y:t.clientY} : {x:e.clientX, y:e.clientY};
}

/* ---------- Háptica ---------- */
function vibrate(level, pattern){
  if(window.ReactNativeWebView){
    const msg = {action:'VIBRATE', level};
    if(pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if(navigator.vibrate){
    const map={light:20,medium:40,heavy:80,success:[0,40,40,40],error:[0,80,40,120]};
    navigator.vibrate(pattern || map[level] || 20);
  }
}

/* ---------- Assets (Cloudinary) ---------- */
const CDN='https://res.cloudinary.com/kampe/image/upload/';
const ASSETS={
  pablo_p_happy:CDN+'v1780308733/pablo_p_happy_q3r4gi.png',
  pablo_p_celebrating:CDN+'v1780308733/pablo_p_celebrating_ikiecl.png',
  pablo_p_worried:CDN+'v1780308735/pablo_p_worried_shbsde.png',
  richi_happy:CDN+'v1780308739/richi_happy_dkc48z.png',
  richi_celebrating:CDN+'v1780308736/richi_celebrating_zywf5n.png',
  richi_worried:CDN+'v1780308736/richi_worried_dcbh9i.png',
  sensor_movimiento:CDN+'v1780308739/sensor_movimiento_vtmtzs.png',
  sensor_humo:CDN+'v1780308737/sensor_humo_bu3psd.png',
  sensor_fuga:CDN+'v1780308736/sensor_fuga_tyu57h.png',
  sensor_temperatura:CDN+'v1780308739/sensor_temperatura_vupiwa.png',
  sensor_magnetico:CDN+'v1780316682/sensor_magnetico_rbw2ox.png',
  sensor_gas:CDN+'v1780316682/sensor_gas_owykzd.png'
};

/* ---------- Ubicaciones (paso 1) ---------- */
const ZONE_LABELS={
  techo_paso:'Techo, zona de paso', ventana:'Junto a la ventana', radiador:'Sobre el radiador',
  techo_salon:'Techo del salón', techo_cocina:'Encima de la cocina', bano:'En el baño',
  suelo_fregadero:'Suelo, bajo el fregadero', pared_media:'Pared, a media altura', techo:'En el techo',
  marco_hoja:'Marco + hoja (juntas)', solo_hoja:'Solo en la hoja', centro_puerta:'Centro de la puerta',
  pared_interior:'Pared interior, ~1,5m', sobre_radiador:'Encima del radiador', junto_ventana:'Junto a la ventana',
  arriba_techo:'Arriba, cerca del techo', ras_suelo:'A ras de suelo'
};
const LOCATE_EDU={
  pir:{ porque:'El PIR detecta calor en movimiento: el sol o un radiador lo disparan solo.',
        regla:'El PIR va apuntando a la zona de paso, lejos de focos de calor.', hacer:'Ponlo en el techo, hacia donde pasa la gente.' },
  humo:{ porque:'Los humos de cocinar y el vapor del baño dan falsas alarmas.',
         regla:'El humo va en techo de zonas limpias, lejos de cocina y baño.', hacer:'Colócalo en el centro del salón.' },
  inundacion:{ porque:'El agua se acumula en el suelo; en alto no detectaría nada.',
               regla:'El sensor de inundación va a ras de suelo, en el punto bajo.', hacer:'Colócalo en el suelo, bajo el fregadero.' },
  magnetico:{ porque:'El magnético detecta por proximidad: necesita las dos partes enfrentadas.',
              regla:'Las dos piezas van juntas, marco + hoja, casi tocándose.', hacer:'Coloca imán y contacto enfrentados en la apertura.' },
  temperatura:{ porque:'Junto a un radiador o una ventana mide el foco de calor o las corrientes, no la sala.',
                regla:'El termostato va en pared interior, a ~1,5m, lejos de fuentes de calor.', hacer:'Colócalo en una pared interior del salón.' },
  gas:{ porque:'El gas natural es más ligero que el aire: sube. A ras de suelo no lo detectaría a tiempo.',
        regla:'Gas natural → arriba. Butano/propano → abajo.', hacer:'Súbelo cerca del techo.' }
};

/* ---------- Datos de sensores ---------- */
/* rest: estado del contacto en reposo ('open'|'closed'); read: 'NA'|'NC' */
const SENSORS=[
  { key:'pir', name:'PIR / movimiento', img:'sensor_movimiento',
    info:'Detecta presencia/movimiento (calor en movimiento). Se alimenta a batería o 230V. En reposo el contacto está ABIERTO (NA): al detectar, cierra.',
    context:'Este es el PIR del pasillo, que se encienda la luz al pasar.',
    beats:['locate','wire','read'],
    locate:{ correct:'techo_paso', zones:['techo_paso','ventana','radiador'] },
    wire:{ dry:false }, rest:'open', read:'NA',
    readQ:'En reposo, sin nadie delante, ¿cómo se comporta el contacto?' },

  { key:'humo', name:'Detector de humo', img:'sensor_humo',
    info:'Detecta humo de incendio. Autónomo a batería. Es de seguridad: en reposo CERRADO (NC), si falla la línea se nota.',
    context:'El detector de humo, que va para el salón.',
    beats:['locate','read'],
    locate:{ correct:'techo_salon', zones:['techo_salon','techo_cocina','bano'] },
    rest:'closed', read:'NC',
    readQ:'En reposo, sin humo, ¿cómo se comporta el contacto?' },

  { key:'inundacion', name:'Sensor de inundación', img:'sensor_fuga',
    info:'Detecta agua acumulada en el suelo. Batería. Las sondas se puentean al mojarse: en reposo ABIERTO (NA).',
    context:'El del agua, por si revienta algo en la cocina.',
    beats:['locate','wire'],
    locate:{ correct:'suelo_fregadero', zones:['suelo_fregadero','pared_media','techo'] },
    wire:{ dry:false }, rest:'open', read:'NA',
    readQ:'En reposo, sin agua, ¿cómo se comporta el contacto?' },

  { key:'magnetico', name:'Contacto magnético', img:'sensor_magnetico',
    info:'Detecta apertura/cierre por proximidad de un imán. Contacto seco (sin alimentación propia). En reposo (imán cerca) CERRADO (NC).',
    context:'El de la puerta, para saber si abren.',
    beats:['wire','read'],
    locate:{ correct:'marco_hoja', zones:['marco_hoja','solo_hoja','centro_puerta'] },
    wire:{ dry:true }, rest:'closed', read:'NC',
    readQ:'Con la puerta cerrada (en reposo), ¿cómo está el contacto?' },

  { key:'temperatura', name:'Sensor de temperatura', img:'sensor_temperatura',
    info:'Mide la temperatura ambiente. 230V o batería. Como termostato de calefacción: en reposo CERRADO (NC), demanda de calor.',
    context:'El de la temperatura, para la calefacción del salón.',
    beats:['locate','wire','read'],
    locate:{ correct:'pared_interior', zones:['pared_interior','sobre_radiador','junto_ventana'] },
    wire:{ dry:false }, rest:'closed', read:'NC',
    safety:{ q:'Si se corta el cable del sensor, ¿qué te interesa que pase?',
             good:'Que el sistema lo note (NC)', bad:'Que siga como estaba (NA)',
             lesson:'Con NC, si se corta o se rompe el cable el circuito se abre y el sistema lo detecta como fallo. Mantener el estado deja una avería sin avisar.' } },

  { key:'gas', name:'Detector de gas / CO', img:'sensor_gas',
    info:'Detecta gases peligrosos (gas natural, butano, CO). 230V (consumo continuo). De seguridad: en reposo CERRADO (NC).',
    context:'El del gas, que cocino con gas natural. Este es importante.',
    beats:['locate','wire','read'],
    locate:{ correct:'arriba_techo', zones:['arriba_techo','ras_suelo','junto_ventana'] },
    wire:{ dry:false }, rest:'closed', read:'NC',
    twoAM:'Son las 2am. Salta el detector. El cliente dice que no huele a nada.',
    safety:{ q:'Una alarma de gas, ¿NA o NC, y por qué?',
             good:'NC: si cortan o falla el cable, salta igual (fail-safe)',
             bad:'NA: solo salta cuando detecta, gasta menos',
             lesson:'Con NA, si cortan o se rompe el cable el sistema no se entera y la alarma no salta. Las alarmas usan NC: cualquier fallo de línea se detecta (fail-safe).' } }
];

/* ---------- Estado ---------- */
const S={ idx:0, score:0, lives:5, beatErr:false, record:0, tutorialDone:false, busy:false };
const REC_KEY='el_banco_de_pruebas_record';
const MAX_SCORE=600, PASS=420;

const OK_LOCATE=['Bien colocado. Ahí va a funcionar sin dar falsas alarmas.','Eso es. La ubicación es media instalación.'];
const OK_READ=['Pensado, no adivinado. Ese es el oficio.','Clavado. El reposo te lo dice todo.'];
let okLocateRot=0, okReadRot=0;

/* ---------- Pantallas ---------- */
function show(screen){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(screen).classList.add('active');
  document.documentElement.className = (screen==='results') ? 'results' : 'gameplay';
}
function setChar(who,state){ $(who).src = ASSETS[(who==='pablo'?'pablo_p_':'richi_')+state]; }

let speechTimer=null;
function say(text, ms=2200){
  const el=$('speech'); el.textContent=text; el.classList.add('show');
  clearTimeout(speechTimer);
  if(ms) speechTimer=setTimeout(()=>el.classList.remove('show'), ms);
}
function hideSpeech(){ clearTimeout(speechTimer); $('speech').classList.remove('show'); }

/* ---------- Init ---------- */
function init(){
  S.record = parseInt(localStorage.getItem(REC_KEY)||'0',10);
  S.tutorialDone = localStorage.getItem(REC_KEY+'_tut')==='1';
  $('intro-pablo').src = ASSETS.pablo_p_happy;
  $('intro-richi').src = ASSETS.richi_happy;
  $('btn-start').addEventListener('click', startGame);
  $('btn-retry').addEventListener('click', startGame);
  $('chip-info').addEventListener('click', openInfo);
}

function startGame(){
  S.idx=0; S.score=0; S.lives=5; S.busy=false;
  okLocateRot=okReadRot=0;
  setChar('pablo','happy'); setChar('richi','happy');
  $('richi').style.display='none';
  show('play');
  renderHUD();
  loadSensor();
}

function renderHUD(){
  $('lives').textContent = '❤'.repeat(S.lives) + '♡'.repeat(Math.max(0,5-S.lives));
  $('round-label').textContent = `Sensor ${S.idx+1}/6`;
  $('score').textContent = S.score;
}

/* ---------- Ficha "i" ---------- */
function openInfo(){
  const s=SENSORS[S.idx];
  $('overlay-card').innerHTML =
    `<h3>${s.name}</h3><div class="row">${s.info}</div><button class="btn-ok">Entendido</button>`;
  $('overlay').classList.add('show');
  $('overlay-card').querySelector('.btn-ok').onclick=()=>$('overlay').classList.remove('show');
}

/* ---------- Carga de sensor ---------- */
function loadSensor(){
  const s = SENSORS[S.idx];
  S.beatErr=false;
  S.beatQueue = s.beats.slice();
  S.beatTotal = s.beats.length;
  $('chip-img').src = ASSETS[s.img];
  $('chip-img').alt = s.name;
  $('sensor-name').textContent = s.name;
  renderHUD();
  setChar('pablo','happy');
  say(s.context, 2600);
  nextBeat();
}

function nextBeat(){
  clearBeats();
  const beat = S.beatQueue.shift();
  if(!beat){ sensorValidated(); return; }
  setChar('pablo','happy');   // vuelve a estado neutro al empezar cada paso
  S.curStepNo = S.beatTotal - S.beatQueue.length;   // 1-based
  const s=SENSORS[S.idx];
  const tut = (!S.tutorialDone && S.idx===0);
  if(beat==='locate') renderLocate(s,tut);
  else if(beat==='wire') renderWire(s,tut);
  else if(beat==='read') renderRead(s,tut);
}

function stepLabel(name){ return `PASO ${S.curStepNo}/${S.beatTotal} · ${name}`; }

function clearBeats(){
  ['beat-locate','beat-wire','beat-read'].forEach(id=>{ $(id).classList.remove('active'); $(id).innerHTML=''; });
}

/* =========================================================
   PASO 1 — Reconoce y ubica (tap)
   ========================================================= */
function renderLocate(s, tut){
  const box=$('beat-locate'); box.classList.add('active');
  const zones = shuffle(s.locate.zones.slice());
  let html=`<div class="step-tag">${stepLabel('¿Dónde va?')}</div>`;
  html+=`<div class="locate-title">Elige dónde se instala este sensor</div><div class="zone-grid">`;
  zones.forEach(z=>{
    html+=`<button class="zone" data-z="${z}">${ZONE_LABELS[z]}</button>`;
  });
  html+=`</div>`;
  box.innerHTML=html;
  if(tut) say('Lo primero: ¿qué es y dónde va? Pulsa la "i" si dudas, y elige la ubicación correcta.',4000);
  box.querySelectorAll('.zone').forEach(b=>{
    b.addEventListener('click',()=>{
      if(S.busy) return;
      const z=b.dataset.z;
      if(z===s.locate.correct){
        b.classList.add('ok'); vibrate('light'); setChar('pablo','celebrating');
        say(OK_LOCATE[okLocateRot++%OK_LOCATE.length],1600);
        S.busy=true; setTimeout(()=>{S.busy=false; nextBeat();},900);
      } else {
        b.classList.add('bad','shake'); vibrate('error'); setChar('pablo','worried');
        S.beatErr=true; const edu=LOCATE_EDU[s.key];
        setTimeout(()=>b.classList.remove('shake'),300);
        eduOverlay({titulo:'Mejor en otro sitio',
          hiciste:`Elegiste "${ZONE_LABELS[z]}".`, porque:edu.porque, regla:edu.regla, hacer:edu.hacer,
          onClose:()=>{ b.classList.remove('bad'); loseLifeIfNeeded(); setChar('pablo','happy'); }});
      }
    });
  });
}

/* =========================================================
   PASO 2 — Pon en orden la conexión (reordenar lista)
   ========================================================= */
function renderWire(s, tut){
  const box=$('beat-wire'); box.classList.add('active');
  // etapas en su orden CORRECTO; la lista se muestra barajada
  const correct = s.wire.dry
    ? [{k:'com',label:'COM',desc:'el común (referencia)'},
       {k:'sig',label:(s.read==='NC'?'NO/NC':'NO/NC'),desc:'el contacto (salida de señal)'}]
    : [{k:'ali',label:'Alimentación',desc:'dar tensión al sensor'},
       {k:'com',label:'COM',desc:'el común (referencia)'},
       {k:'sig',label:'NO/NC',desc:'el contacto (salida de señal)'}];
  S.wireCorrect = correct.map(x=>x.k);
  let order = correct.slice();
  // baraja asegurando que NO quede ya en orden
  do { shuffle(order); } while(order.map(x=>x.k).join()===S.wireCorrect.join() && correct.length>1);
  S.wireOrder = order.map(x=>x.k);

  let html=`<div class="step-tag">${stepLabel('El orden')}</div>`;
  html+=`<div class="wire-title">¿En qué orden se conecta?<br><span class="wire-sub">Ordena de arriba (1º) a abajo. Primero lo que da seguridad.</span></div>`;
  html+=`<div class="order-list" id="order-list">`;
  order.forEach((st,i)=>{
    html+=`<div class="orow" data-k="${st.k}">
      <span class="orow-num">${i+1}</span>
      <span class="orow-body"><b>${st.label}</b><small>${st.desc}</small></span>
      <span class="orow-grip">⋮⋮</span></div>`;
  });
  html+=`</div><button class="confirm-btn" id="confirm-order">Confirmar orden</button>`;
  box.innerHTML=html;
  if(tut) say('El orden no se improvisa. Arrastra las filas para ordenarlas y pulsa Confirmar. Piensa qué se conecta primero por seguridad.',4400);
  setupReorder();
  $('confirm-order').onclick=()=>confirmOrder(s);
}

function rowsCurrentOrder(){ return [...document.querySelectorAll('#order-list .orow')].map(r=>r.dataset.k); }
function renumber(){ document.querySelectorAll('#order-list .orow').forEach((r,i)=>r.querySelector('.orow-num').textContent=i+1); }

function setupReorder(){
  const list=$('order-list');
  let dragRow=null, startY=0, lastY=0, offsetY=0, dragging=false;

  function onDown(e){
    const row=e.target.closest('.orow');
    if(!row || S.busy) return;
    const p=point(e); dragRow=row; startY=p.y; lastY=p.y; offsetY=0; dragging=false;
    document.addEventListener('mousemove',onMove,{passive:false});
    document.addEventListener('touchmove',onMove,{passive:false});
    document.addEventListener('mouseup',onUp);
    document.addEventListener('touchend',onUp);
    e.preventDefault();
  }
  function onMove(e){
    if(!dragRow) return;
    const p=point(e);
    if(!dragging){
      if(Math.abs(p.y-startY)<8) return;
      dragging=true; vibrate('light');
      dragRow.classList.add('dragging');   // sin transición: sigue al dedo
    }
    e.preventDefault();
    // la fila levantada sigue al dedo
    offsetY += (p.y-lastY); lastY=p.y;
    dragRow.style.transform=`translateY(${offsetY}px) scale(1.03)`;
    // ¿hay que intercambiar con un vecino?
    const dragRect=dragRow.getBoundingClientRect();
    const dragMid=dragRect.top+dragRect.height/2;
    const sibs=[...list.querySelectorAll('.orow:not(.dragging)')];
    for(const r of sibs){
      const rect=r.getBoundingClientRect();
      const mid=rect.top+rect.height/2;
      const before = r.compareDocumentPosition(dragRow)&Node.DOCUMENT_POSITION_FOLLOWING; // dragRow va después de r
      if(dragMid<mid && before){ flipMove(r, ()=>list.insertBefore(dragRow, r)); reanchor(p.y); break; }
      if(dragMid>mid && !before){ flipMove(r, ()=>list.insertBefore(dragRow, r.nextSibling)); reanchor(p.y); break; }
    }
    renumber();
  }
  // tras reinsertar en el DOM, recalcula el offset para que la fila no salte
  function reanchor(py){
    dragRow.style.transform='';
    const rect=dragRow.getBoundingClientRect();
    offsetY = py - (rect.top+rect.height/2);
    dragRow.style.transform=`translateY(${offsetY}px) scale(1.03)`;
  }
  // FLIP: anima el deslizamiento de la fila vecina que cambia de sitio
  function flipMove(el, domChange){
    const first=el.getBoundingClientRect().top;
    domChange();
    const last=el.getBoundingClientRect().top;
    const dy=first-last;
    if(!dy) return;
    el.style.transition='none';
    el.style.transform=`translateY(${dy}px)`;
    requestAnimationFrame(()=>{ el.style.transition='transform .18s ease'; el.style.transform=''; });
  }
  function onUp(){
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('mouseup',onUp);
    document.removeEventListener('touchend',onUp);
    if(dragRow){
      dragRow.classList.remove('dragging');
      dragRow.classList.add('settling');     // transición de vuelta a su sitio
      dragRow.style.transform='';
      setTimeout(()=>{ if(dragRow) dragRow.classList.remove('settling'); },220);
    }
    dragRow=null; dragging=false;
  }
  list.addEventListener('mousedown',onDown);
  list.addEventListener('touchstart',onDown,{passive:false});
}

function confirmOrder(s){
  if(S.busy) return;
  const cur=rowsCurrentOrder();
  if(cur.join()===S.wireCorrect.join()){
    vibrate('success'); setChar('pablo','celebrating');
    document.querySelectorAll('#order-list .orow').forEach(r=>{ r.style.transform=''; r.style.transition=''; r.classList.add('ok'); });
    $('confirm-order').disabled=true;
    say('Alimentación, COM, contacto. En ese orden. Así no se rompe nada.',1600);
    S.busy=true; setTimeout(()=>{S.busy=false; nextBeat();},1100);
  } else {
    vibrate('error'); setChar('pablo','worried'); S.beatErr=true;
    const list=$('order-list'); list.classList.add('shake'); setTimeout(()=>list.classList.remove('shake'),300);
    eduOverlay({titulo:'Por orden',
      hiciste:'Confirmaste un orden incorrecto.',
      porque:'Sin identificar primero la alimentación, puedes meter tensión donde no va y romper algo.',
      regla: s.wire.dry ? 'Primero COM, luego el contacto NO/NC.' : 'El orden es: Alimentación → COM → NO/NC. Si adivinas bornes, romperás algo.',
      hacer:'Recoloca las filas en ese orden y vuelve a confirmar.',
      onClose:()=>{ loseLifeIfNeeded(); setChar('pablo','happy'); }});
  }
}

/* =========================================================
   PASO 3 — Decide NA o NC (razonar, tap)
   ========================================================= */
/* Mini-símbolo de contacto dentro de cada tarjeta de opción (leyenda, no respuesta) */
function miniContactSVG(state){
  const armY2 = state==='closed' ? 26 : 10;   // cerrado: horizontal; abierto: levantado
  return `<svg class="mini-contact ${state}" viewBox="0 0 90 36" aria-hidden="true">
    <line x1="4" y1="26" x2="22" y2="26" class="c-wire"/>
    <circle cx="26" cy="26" r="4.5" class="c-node"/>
    <line x1="26" y1="26" x2="64" y2="${armY2}" class="c-arm"/>
    <circle cx="68" cy="26" r="4.5" class="c-node"/>
    <line x1="68" y1="26" x2="86" y2="26" class="c-wire"/>
  </svg>`;
}

function renderRead(s, tut){
  const box=$('beat-read'); box.classList.add('active');

  let html=`<div class="step-tag">${stepLabel('NA o NC')}</div>`;
  if(s.twoAM) html+=`<div class="incidencia">🌙 ${s.twoAM}</div>`;

  if(s.safety){
    // escenario de seguridad: opciones de texto (sin gráfico de contacto)
    html+=`<div class="read-prompt">${s.safety.q}</div>`;
    const opts=shuffle([{t:s.safety.good,ok:true},{t:s.safety.bad,ok:false}]);
    html+=`<div class="safety-btns">`+opts.map(o=>`<button class="sbtn" data-ok="${o.ok}">${o.t}</button>`).join('')+`</div>`;
    box.innerHTML=html;
    bindSafety(s, tut);
  } else {
    // pregunta directa; cada tarjeta lleva su propio dibujo (leyenda de qué es cada opción)
    html+=`<div class="read-prompt">${s.readQ}</div>`;
    const opts=shuffle([
      {r:'NA', t:'Normalmente Abierto', tag:'NA', state:'open',   leg:'En reposo: contacto ABIERTO'},
      {r:'NC', t:'Normalmente Cerrado', tag:'NC', state:'closed', leg:'En reposo: contacto CERRADO'}
    ]);
    html+=`<div class="read-cards">`+opts.map(o=>
      `<button class="rcard" data-r="${o.r}">
         <span class="rcard-tag">${o.tag}</span>
         ${miniContactSVG(o.state)}
         <span class="rcard-name">${o.t}</span>
         <span class="rcard-leg">${o.leg}</span>
       </button>`).join('')+`</div>`;
    box.innerHTML=html;
    bindRead(s, tut);
  }
  if(tut) say('Piensa cómo está el contacto de este sensor EN REPOSO (sin detectar nada) y elige.',4200);
}

function bindRead(s, tut){
  const wrap=document.querySelector('#beat-read .read-cards');
  wrap.querySelectorAll('.rcard').forEach(b=>{
    b.onclick=()=>{
      if(S.busy) return;
      if(b.dataset.r===s.read){
        b.classList.add('ok'); b.classList.remove('hint'); vibrate('success'); setChar('pablo','celebrating');
        say(OK_READ[okReadRot++%OK_READ.length],1600);
        wrap.querySelectorAll('.rcard').forEach(x=>{x.disabled=true;x.classList.remove('hint');});
        S.busy=true; setTimeout(()=>{S.busy=false; nextBeat();},1200);
      } else {
        b.classList.add('bad','shake'); vibrate('error',[0,80,40,120]); setChar('pablo','worried');
        S.beatErr=true; setTimeout(()=>b.classList.remove('shake'),300);
        eduOverlay({titulo:'Piensa el reposo',
          hiciste:'Elegiste el estado contrario.',
          porque:'Hay que pensar cómo está el contacto en reposo, no al detectar.',
          regla:`Normal = estado en REPOSO. Este sensor, sin detectar nada, está ${s.rest==='closed'?'CERRADO → NC':'ABIERTO → NA'}.`,
          hacer:'Recuerda qué hace este sensor en reposo y vuelve a elegir.',
          onClose:()=>{ b.classList.remove('bad'); loseLifeIfNeeded(); setChar('pablo','happy'); }});
      }
    };
  });
}

function bindSafety(s, tut){
  const box=$('beat-read');
  box.querySelectorAll('.sbtn').forEach(b=>{
    b.onclick=()=>{
      if(S.busy) return;
      if(b.dataset.ok==='true'){
        b.classList.add('ok'); vibrate('success'); setChar('pablo','celebrating');
        say('Eso es. NC para seguridad: cualquier fallo de línea se nota.',1600);
        box.querySelectorAll('.sbtn').forEach(x=>x.disabled=true);
        S.busy=true; setTimeout(()=>{S.busy=false; nextBeat();},1300);
      } else {
        b.classList.add('bad','shake'); vibrate('error',[0,200]); setChar('pablo','worried');
        S.beatErr=true; setTimeout(()=>b.classList.remove('shake'),300);
        eduOverlay({titulo:'Piensa en el fallo',
          hiciste:'Elegiste la opción menos segura.', porque:s.safety.lesson, regla:'Las alarmas usan NC (fail-safe).',
          hacer:`Quédate con: ${s.safety.good}`,
          onClose:()=>{ b.classList.remove('bad'); loseLifeIfNeeded(); setChar('pablo','happy'); }});
      }
    };
  });
}

/* ---------- Validación de sensor ---------- */
function sensorValidated(){
  S.score += S.beatErr ? 50 : 100;
  renderHUD();
  setChar('pablo','celebrating'); say('Aprobado. Este sí sale a obra.',1600);
  vibrate('success');
  // sello APROBADO
  const tag=document.createElement('div'); tag.className='approved-stamp pop'; tag.textContent='APROBADO ✓';
  $('play').appendChild(tag);
  S.busy=true;
  setTimeout(()=>{
    tag.remove(); S.busy=false;
    if(S.idx >= SENSORS.length-1){ localStorage.setItem(REC_KEY+'_tut','1'); finish(); return; }
    if(S.idx===0 && !S.tutorialDone){ S.tutorialDone=true; localStorage.setItem(REC_KEY+'_tut','1'); }
    S.idx++;
    transitionTo(S.idx);
  },1300);
}

function transitionTo(idx){
  // fundido suave: atenúa la cabecera + zona de paso, carga el nuevo sensor y reaparece
  const bar=$('sensor-bar'), work=$('work');
  bar.classList.add('fade-out'); work.classList.add('fade-out');
  // Richi asoma un momento a comentar (cameo, no banner)
  const r=$('richi'); r.style.display='block'; setChar('richi','happy');
  setTimeout(()=>{ r.style.display='none'; },2400);
  setTimeout(()=>{
    loadSensor();
    requestAnimationFrame(()=>{ bar.classList.remove('fade-out'); work.classList.remove('fade-out'); });
  },360);
}

/* ---------- Vidas / overlay ---------- */
function loseLifeIfNeeded(){
  S.lives--; renderHUD(); vibrate('error');
  if(S.lives<=0){ vibrate('heavy'); finish(); }
}

function eduOverlay({titulo,hiciste,porque,regla,hacer,onClose}){
  $('overlay-card').innerHTML =
    `<h3>${titulo||'Ojo aquí'}</h3>`+
    (hiciste?`<div class="row"><b>Qué hiciste:</b> ${hiciste}</div>`:'')+
    (porque?`<div class="row"><b>Por qué está mal:</b> ${porque}</div>`:'')+
    (regla?`<div class="row"><b>La regla:</b> ${regla}</div>`:'')+
    (hacer?`<div class="row"><b>Qué hacer:</b> ${hacer}</div>`:'')+
    `<button class="btn-ok">Entendido</button>`;
  $('overlay').classList.add('show');
  $('overlay-card').querySelector('.btn-ok').onclick=()=>{
    $('overlay').classList.remove('show');
    if(onClose) onClose();
  };
}

/* ---------- Resultados ---------- */
function finish(){
  hideSpeech();
  show('results');
  $('res-score').textContent = S.score + ' pts';
  let tier, msg;
  if(S.score>=480){ tier='celebrating'; msg='Piensas los sensores como un técnico: ubicación, orden de conexión y NA/NC con criterio.'; }
  else if(S.score>=360){ tier='happy'; msg='Vas bien. Repasa NA/NC: normal es el estado en reposo, y por qué las alarmas usan NC.'; }
  else { tier='worried'; msg='Necesitas practicar: respeta el orden de conexión y razona el estado de reposo. No adivines bornes.'; }
  $('res-char').src = ASSETS['richi_'+tier];
  $('res-msg').textContent = msg;

  if(S.score>S.record){
    $('res-record').innerHTML = `Record: ${S.record} → <span class="beat-record">${S.score}</span>`;
    S.record=S.score; localStorage.setItem(REC_KEY, String(S.score));
  } else {
    $('res-record').textContent = `Record: ${S.record}`;
  }

  if(S.score>=PASS && window.ReactNativeWebView){
    window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}));
  }
}

document.addEventListener('DOMContentLoaded', init);
