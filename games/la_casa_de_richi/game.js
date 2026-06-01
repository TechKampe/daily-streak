/* La Casa de Richi — domótica: SENSOR -> NODO -> ACTUADOR
   Scaffold jugable. Ver GDD_LA_CASA_DE_RICHI.md */

'use strict';

/* ---------- Haptics ---------- */
function vibrate(level, pattern){
  if(window.ReactNativeWebView){
    const msg={action:'VIBRATE',level};
    if(pattern) msg.pattern=pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if(navigator.vibrate){
    const map={light:10,medium:25,heavy:60,success:[0,30,40,30],error:[0,60,40,60]};
    navigator.vibrate(pattern||map[level]||10);
  }
}
function taskCompleted(){
  if(window.ReactNativeWebView)
    window.ReactNativeWebView.postMessage(JSON.stringify({action:'TASK_COMPLETED'}));
}

/* ---------- URLs de assets (Cloudinary) ---------- */
const CDN='https://res.cloudinary.com/kampe/image/upload/';
const ASSETS={
  pablo_p_happy:CDN+'v1780308733/pablo_p_happy_q3r4gi.png',
  pablo_p_celebrating:CDN+'v1780308733/pablo_p_celebrating_ikiecl.png',
  pablo_p_worried:CDN+'v1780308735/pablo_p_worried_shbsde.png',
  richi_happy:CDN+'v1780308739/richi_happy_dkc48z.png',
  richi_celebrating:CDN+'v1780308736/richi_celebrating_zywf5n.png',
  richi_worried:CDN+'v1780308736/richi_worried_dcbh9i.png',
  sensor_movimiento:CDN+'v1780308739/sensor_movimiento_vtmtzs.png',
  sensor_temperatura:CDN+'v1780308739/sensor_temperatura_vupiwa.png',
  sensor_luminosidad:CDN+'v1780308738/sensor_luminosidad_s2cjdv.png',
  sensor_humo:CDN+'v1780308737/sensor_humo_bu3psd.png',
  sensor_fuga:CDN+'v1780308736/sensor_fuga_tyu57h.png',
  sensor_humedad:CDN+'v1780308736/sensor_humedad_sq4v64.png',
  actuador_rele_luz:CDN+'v1780308732/actuador_rele_luz_hszofn.png',
  actuador_persiana:CDN+'v1780308732/actuador_persiana_g9rx0o.png',
  actuador_valvula:CDN+'v1780308732/actuador_valvula_onzdcq.png',
  actuador_clima:CDN+'v1780308732/actuador_clima_vyotop.png',
  actuador_enchufe:CDN+'v1780308732/actuador_enchufe_eztxru.png',
  nodo_controlador:CDN+'v1780308732/nodo_controlador_tj272u.png'
};

/* ---------- Datos de piezas ---------- */
const PIECES={
  // sensores — DETECTAN información
  movimiento:{role:'sensor',img:ASSETS.sensor_movimiento,name:'Sensor de movimiento',
    info:'SENSOR. Detecta presencia o movimiento de personas. No ejecuta nada: solo avisa al nodo de que hay alguien.'},
  temperatura:{role:'sensor',img:ASSETS.sensor_temperatura,name:'Sensor de temperatura',
    info:'SENSOR. Mide la temperatura del ambiente y se la comunica al nodo. No enfría ni calienta: solo detecta.'},
  luminosidad:{role:'sensor',img:ASSETS.sensor_luminosidad,name:'Sensor de luminosidad',
    info:'SENSOR. Mide cuánta luz hay (día/noche). Le dice al nodo el nivel de luz; no acciona nada por sí mismo.'},
  humo:{role:'sensor',img:ASSETS.sensor_humo,name:'Detector de humo',
    info:'SENSOR. Detecta humo de un incendio y avisa al nodo. Es de seguridad: solo detecta, no apaga el fuego.'},
  fuga:{role:'sensor',img:ASSETS.sensor_fuga,name:'Sensor de fuga de agua',
    info:'SENSOR. Detecta agua acumulada en el suelo (una fuga). Avisa al nodo; no corta el agua por sí solo.'},
  humedad:{role:'sensor',img:ASSETS.sensor_humedad,name:'Sensor de humedad',
    info:'SENSOR. Mide la humedad del aire (vapor, vaho). Distinto del de fuga: este mide el ambiente, no charcos.'},
  // actuadores — EJECUTAN acciones
  rele:{role:'actuador',img:ASSETS.actuador_rele_luz,name:'Relé de iluminación',
    info:'ACTUADOR. Enciende y apaga la luz cuando el nodo se lo ordena. Ejecuta la acción; no detecta nada.'},
  persiana:{role:'actuador',img:ASSETS.actuador_persiana,name:'Motor de persiana',
    info:'ACTUADOR. Sube y baja la persiana por orden del nodo. Ejecuta movimiento; no decide cuándo.'},
  valvula:{role:'actuador',img:ASSETS.actuador_valvula,name:'Válvula de corte de agua',
    info:'ACTUADOR. Corta el paso del agua cuando el nodo lo ordena. Ejecuta; no detecta la fuga por sí misma.'},
  clima:{role:'actuador',img:ASSETS.actuador_clima,name:'Climatización',
    info:'ACTUADOR. Da frío o calor cuando el nodo lo manda. Ejecuta; el que mide la temperatura es el sensor.'},
  enchufe:{role:'actuador',img:ASSETS.actuador_enchufe,name:'Enchufe inteligente',
    info:'ACTUADOR. Da o corta la corriente a un aparato (extractor, electrodoméstico) por orden del nodo.'},
  // nodo — GESTIONA la lógica
  nodo:{role:'nodo',img:ASSETS.nodo_controlador,name:'Nodo / controlador',
    info:'NODO (el cerebro). Recibe la señal del sensor, aplica la regla ("si pasa X, haz Y") y ordena al actuador. Sin él, el sensor no le dice nada al actuador. Va siempre en medio.'}
};

/* ---------- Cadenas por estancia ---------- */
const LEVELS=[
  {room:'Salón',
   need:'Quiero que la luz del pasillo se encienda sola al entrar, que siempre me dejo el interruptor.',
   solution:{sensor:'movimiento',nodo:'nodo',actuador:'rele'},
   distractors:['temperatura','luminosidad'],
   justify:{q:'¿Dónde colocamos el sensor de movimiento para que funcione bien?',
            good:'En el techo, apuntando a la zona de paso del pasillo',
            bad:'Justo encima del radiador, que ahí tiene corriente fácil',
            lesson:'El PIR detecta cambios de calor. Cerca de un radiador o fuente de calor da falsos positivos y se dispara solo. Se coloca apuntando a la zona de paso, lejos de focos de calor.'}},
  {room:'Cocina',
   need:'Si hay una fuga de agua que se corte sola, ¿eh? Que me da pánico inundar al vecino.',
   solution:{sensor:'fuga',nodo:'nodo',actuador:'valvula'},
   distractors:['humo','rele','luminosidad'],
   justify:{q:'Richi: "¿Y si un día se va la luz en casa? ¿Qué hace la válvula?"',
            good:'Se cierra sola al quedarse sin alimentación (modo seguro)',
            bad:'Se queda en la última posición que tenía guardada',
            lesson:'Mantener la última posición parece lógico, pero si la fuga ocurre con la luz cortada, la válvula no se cierra y te inundas. En seguridad se diseña a prueba de fallos: sin alimentación, cierra.'}},
  {room:'Baño',
   need:'Y aquí que si hay mucha humedad se ventile solo, que se me llena de moho.',
   solution:{sensor:'humedad',nodo:'nodo',actuador:'enchufe'},
   distractors:['fuga','luminosidad','humo','rele'],
   justify:{q:'El extractor irá conectado al nodo. ¿Dónde dejamos el nodo?',
            good:'En una caja de registro accesible, donde se pueda revisar',
            bad:'Dentro del falso techo del baño, bien protegido de la humedad',
            lesson:'Protegerlo de la humedad está bien, pero metido en el falso techo sin registro, una avería obliga a romper. Va en un punto accesible: todo elemento debe poder revisarse o sustituirse sin obras.'}},
  {room:'Dormitorio',
   need:'Que las persianas bajen solas al anochecer, sin tener que levantarme.',
   solution:{sensor:'luminosidad',nodo:'nodo',actuador:'persiana'},
   distractors:['movimiento','temperatura','clima','rele'],
   justify:{q:'Richi: "Para toda la casa, ¿sistema centralizado o distribuido?"',
            good:'Distribuido: la inteligencia repartida, si falla uno el resto sigue',
            bad:'Centralizado: más simple de programar y todo controlado desde un punto',
            lesson:'El centralizado es más simple y barato, sí, pero si falla la central cae toda la casa. En distribuido (tipo KNX) cada elemento tiene lógica propia: más robusto y ampliable, que es lo que pide una vivienda entera.'}}
];

/* ---------- Feedback educativo ---------- */
const EDU={
  wrongSlotActuator:{did:'Pusiste un actuador donde va el sensor',
    why:'Un actuador ejecuta, no detecta',
    rule:'El sensor detecta. El actuador ejecuta.',
    fix:'Pon algo que detecte: movimiento, temperatura, agua…'},
  wrongSlotSensor:{did:'Pusiste un sensor donde va el actuador',
    why:'Un sensor solo detecta, no ejecuta nada',
    rule:'El actuador es lo que hace la acción',
    fix:'Pon lo que ejecuta: relé, válvula, motor, enchufe…'},
  nodoEnd:{did:'Pusiste el nodo en una punta',
    why:'El nodo es el cerebro: procesa entre el sensor y el actuador',
    rule:'SENSOR → NODO → ACTUADOR',
    fix:'El nodo va siempre en medio'},
  wrongSensor:{did:'Ese sensor detecta otra cosa',
    why:'No resuelve lo que pide Richi',
    rule:'Primero lee qué necesita el cliente',
    fix:'Elige el sensor que detecta justo lo que se pide'},
  fugaVsHumedad:{did:'Pusiste el sensor de fuga de agua',
    why:'El de fuga detecta agua acumulada en el suelo; aquí el problema es la humedad del aire',
    rule:'Cada sensor mide algo distinto, aunque se parezcan',
    fix:'Usa el sensor de humedad: mide la humedad del ambiente'},
  wrongActuator:{did:'Ese actuador hace otra cosa',
    why:'No resuelve la necesidad real',
    rule:'El actuador tiene que resolver la necesidad real',
    fix:'Elige el actuador que ejecuta lo que se pide'},
  postureo:{did:'Elegiste el capricho caro',
    why:'Eso no ahorra ni protege nada, y Richi no tiene presupuesto',
    rule:'Domótica no es lujo, es automatización útil',
    fix:'Justifica por ahorro, seguridad o confort real'}
};

const ACIERTOS=[
  '¡Hecho! Mira cómo responde la casa. Esto sí es útil.',
  'Sensor detecta, nodo decide, actuador ejecuta. Lo has clavado.',
  'No es magia: es lógica bien montada. Bien ahí.'
];
const TRANS={Cocina:'¡La cocina! Aquí cocino como un chef… bueno, casi. ¿Qué le metemos?',
  Baño:'El baño. Quiero que sea tipo hotel de cinco estrellas, ¿eh?',
  Dormitorio:'Mi cuarto. Aquí sí que quiero tecnología punta. Con cabeza, dices tú, ya, ya…'};

const KEY='la_casa_de_richi_record';
const MAX_SCORE=600, GOAL=420;

/* ---------- Estado ---------- */
let S={};
function resetState(){
  S={level:0,score:0,lives:5,placed:{},chainErrored:false,tutorial:!localStorage.getItem(KEY+'_tut'),aciertoRot:0};
}

/* ---------- DOM ---------- */
const $=id=>document.getElementById(id);
const play=$('play'), tray=$('tray'), ghost=$('ghost');

/* ---------- Pantallas ---------- */
function show(scr){
  ['intro','play','results'].forEach(s=>$(s).classList.toggle('off',s!==scr));
  document.documentElement.className = scr==='results' ? 'results' : 'gameplay';
}

/* ---------- HUD ---------- */
function renderHud(){
  let h='';for(let i=0;i<5;i++)h+=`<span class="heart${i<S.lives?'':' lost'}">❤</span>`;
  $('hud-lives').innerHTML=h;
  $('hud-room').textContent=`${LEVELS[S.level].room} ${S.level+1}/4`;
  $('hud-score').textContent=S.score;
}

/* ---------- Burbujas ---------- */
function bubble(who,text){
  const b=$('play-bubble');
  b.textContent=text;
  b.classList.remove('off');
  if(who==='richi')$('richi').classList.remove('off');
}
function hideBubble(){$('play-bubble').classList.add('off');}
const CHAR_PREFIX={pablo:'pablo_p',richi:'richi'};
function setChar(who,state){$(who).src=ASSETS[`${CHAR_PREFIX[who]}_${state}`];}

/* ---------- Cargar nivel ---------- */
function loadLevel(){
  const L=LEVELS[S.level];
  S.placed={};S.chainErrored=false;
  $('need-card').textContent='Richi: '+L.need;
  // ranuras
  document.querySelectorAll('.slot').forEach(sl=>{
    sl.className='slot';sl.innerHTML=`<span class="slot-label">${sl.dataset.role.toUpperCase()}</span>`;
  });
  document.querySelectorAll('.arrow').forEach(a=>a.classList.remove('live'));
  // bandeja: solución + distractores, barajada — todas dentro de una card única, sin nombre
  const keys=[L.solution.sensor,L.solution.nodo,L.solution.actuador,...L.distractors];
  shuffle(keys);
  tray.innerHTML='';
  keys.forEach(k=>{
    const el=document.createElement('div');
    el.className='piece';el.dataset.key=k;el.dataset.role=PIECES[k].role;
    el.innerHTML=`<img src="${PIECES[k].img}" alt="${PIECES[k].name}">`
      +`<button class="piece-info" data-info="${k}" aria-label="Info">i</button>`;
    tray.appendChild(el);
  });
  applyTutorialHint();
  setChar('pablo','happy');setChar('richi','happy');
  $('richi').classList.add('off');
  renderHud();
  if(S.tutorial&&S.level===0) startTutorial(); else hideBubble();
}

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(seededRand()* (i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// rand sin Math.random dependiente de fecha — pseudo basado en contador de estado
let _seed=12345;
function seededRand(){_seed=(_seed*1103515245+12345)&0x7fffffff;return _seed/0x7fffffff;}

/* ---------- Tutorial (nivel 1) ---------- */
function startTutorial(){
  bubble('pablo','Una automatización es una cadena: un SENSOR detecta, el NODO decide y un ACTUADOR ejecuta. Empieza por el sensor: arrástralo a la primera ranura.');
}
/* Resalta la pieza y la ranura correctas para el siguiente hueco.
   Durante el tutorial (nivel 1). Orden: sensor -> nodo -> actuador. */
function applyTutorialHint(){
  document.querySelectorAll('.piece').forEach(p=>p.classList.remove('hint'));
  document.querySelectorAll('.slot').forEach(s=>s.classList.remove('hint'));
  if(!(S.tutorial&&S.level===0))return;
  const L=LEVELS[S.level];
  const order=['sensor','nodo','actuador'];
  const next=order.find(r=>!S.placed[r]);
  if(!next)return;
  const wantKey=L.solution[next];
  document.querySelectorAll('.piece').forEach(p=>{
    if(p.dataset.key===wantKey&&!p.classList.contains('placed'))p.classList.add('hint');
  });
  const slot=document.querySelector(`.slot[data-role="${next}"]`);
  if(slot)slot.classList.add('hint');
}

/* ---------- Drag & drop ---------- */
let dragging=null,startX=0,startY=0,moved=false;
tray.addEventListener('touchstart',onDown,{passive:false});
tray.addEventListener('mousedown',onDown);
function onDown(e){
  // tap en la "i" -> abrir ficha, no arrastrar
  const infoBtn=e.target.closest('.piece-info');
  if(infoBtn){e.preventDefault();showInfo(infoBtn.dataset.info);return;}
  const piece=e.target.closest('.piece');if(!piece||piece.classList.contains('placed'))return;
  e.preventDefault();
  dragging=piece;moved=false;
  const p=point(e);startX=p.x;startY=p.y;
  ghost.src=piece.querySelector('img').src;
  ghost.style.left=p.x+'px';ghost.style.top=p.y+'px';
  vibrate('light');
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('mousemove',onMove);
  document.addEventListener('touchend',onUp);
  document.addEventListener('mouseup',onUp);
}
function onMove(e){
  if(!dragging)return;e.preventDefault();
  const p=point(e);
  if(!moved&&Math.hypot(p.x-startX,p.y-startY)<8)return;
  moved=true;ghost.classList.remove('off');
  ghost.style.left=p.x+'px';ghost.style.top=p.y+'px';
  const slot=slotAt(p.x,p.y);
  document.querySelectorAll('.slot').forEach(s=>s.classList.toggle('hover',s===slot));
}
function onUp(e){
  document.removeEventListener('touchmove',onMove);document.removeEventListener('mousemove',onMove);
  document.removeEventListener('touchend',onUp);document.removeEventListener('mouseup',onUp);
  ghost.classList.add('off');
  if(!dragging)return;
  const piece=dragging;dragging=null;
  document.querySelectorAll('.slot').forEach(s=>s.classList.remove('hover'));
  if(!moved){ // tap: tooltip simple via bubble
    return;
  }
  const p=point(e);const slot=slotAt(p.x,p.y);
  if(slot&&!slot.classList.contains('filled')) tryPlace(piece,slot);
}
function point(e){const t=e.touches&&e.touches[0]||e.changedTouches&&e.changedTouches[0]||e;return {x:t.clientX,y:t.clientY};}
function slotAt(x,y){
  let best=null,bestD=1e9,bd=55;
  document.querySelectorAll('.slot').forEach(s=>{
    const r=s.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const d=Math.hypot(x-cx,y-cy);
    if(d<r.width/2+bd&&d<bestD){best=s;bestD=d;}
  });
  return best;
}

/* ---------- Colocar pieza ---------- */
function tryPlace(piece,slot){
  const key=piece.dataset.key, def=PIECES[key], slotRole=slot.dataset.role, L=LEVELS[S.level];
  // ¿el rol coincide con la ranura?
  if(def.role!==slotRole){
    let edu;
    if(slotRole==='sensor') edu=def.role==='actuador'?EDU.wrongSlotActuator:EDU.nodoEnd;
    else if(slotRole==='actuador') edu=def.role==='sensor'?EDU.wrongSlotSensor:EDU.nodoEnd;
    else edu=EDU.nodoEnd; // ranura nodo con sensor/actuador
    return failPlace(slot,edu);
  }
  // rol correcto pero ¿es la pieza que resuelve la necesidad?
  if(key!==L.solution[slotRole]){
    let edu=EDU.wrongSensor;
    if(slotRole==='actuador') edu=EDU.wrongActuator;
    else if(slotRole==='sensor'&&L.solution.sensor==='humedad'&&key==='fuga') edu=EDU.fugaVsHumedad;
    return failPlace(slot,edu);
  }
  // correcto
  placePiece(piece,slot,key);
}
function placePiece(piece,slot,key){
  slot.classList.add('filled','pop');
  slot.innerHTML=`<img src="${PIECES[key].img}" alt=""><span class="slot-label">${slot.dataset.role.toUpperCase()}</span>`;
  piece.classList.add('placed');
  S.placed[slot.dataset.role]=key;
  vibrate('light');
  // avance tutorial
  if(S.tutorial&&S.level===0){
    if(slot.dataset.role==='sensor')bubble('pablo','Ahora el NODO: es el cerebro que procesa la señal. Va siempre en medio.');
    else if(slot.dataset.role==='nodo')bubble('pablo','Y el ACTUADOR: lo que ejecuta la acción. Aquí, el relé que enciende la luz. ¡Mira cómo reacciona la casa!');
  }
  applyTutorialHint();
  if(Object.keys(S.placed).length===3) chainComplete();
}
function failPlace(slot,edu){
  slot.classList.add('bad');setTimeout(()=>slot.classList.remove('bad'),300);
  vibrate('error');
  S.chainErrored=true;
  setChar('pablo','worried');
  showEdu(edu,()=>{loseLife();setChar('pablo','happy');});
}

/* ---------- Cadena completa ---------- */
function chainComplete(){
  document.querySelectorAll('.arrow').forEach((a,i)=>setTimeout(()=>a.classList.add('live'),i*250));
  setChar('pablo','celebrating');setChar('richi','celebrating');
  $('richi').classList.remove('off');
  S.score += S.chainErrored?50:100;
  renderHud();vibrate('success');
  bubble('pablo',ACIERTOS[S.aciertoRot++%ACIERTOS.length]);
  setTimeout(justifyTap,1800);
}

/* ---------- Justify-tap ---------- */
function justifyTap(){
  hideBubble();
  const L=LEVELS[S.level];
  $('play').classList.add('justifying');   // mantiene HUD + sube personajes
  $('justify').classList.remove('off');
  $('richi').classList.remove('off');setChar('richi','happy');
  setChar('pablo','happy');
  $('justify-q').textContent='Richi: '+L.justify.q;
  const opts=[{t:L.justify.good,ok:true},{t:L.justify.bad,ok:false}];
  if(seededRand()<.5)opts.reverse();
  const a=$('justify-a'),b=$('justify-b');
  a.textContent=opts[0].t;b.textContent=opts[1].t;
  a.onclick=()=>chooseJustify(opts[0].ok);
  b.onclick=()=>chooseJustify(opts[1].ok);
}
function chooseJustify(ok){
  $('justify').classList.add('off');
  $('play').classList.remove('justifying');
  const L=LEVELS[S.level];
  if(ok){
    S.score+=50;renderHud();vibrate('success');
    setChar('richi','celebrating');
    bubble('richi','¡Buena decisión, crack! Así sí.');
    setTimeout(nextLevel,1500);
  } else {
    vibrate('error',[0,80,40,120]);
    setChar('richi','worried');
    const edu={did:'Elegiste la opción incorrecta',
      why:'No es lo que haría un buen instalador',
      rule:L.justify.lesson,
      fix:'Quédate con: "'+L.justify.good+'"'};
    showEdu(edu,()=>{loseLife(true);if(S.lives>0)nextLevel();});
  }
}

/* ---------- Ficha de info de pieza ---------- */
function showInfo(key){
  const d=PIECES[key];if(!d)return;
  $('info-img').src=d.img;
  $('info-name').textContent=d.name;
  $('info-text').textContent=d.info;
  $('info-overlay').classList.remove('off');
  vibrate('light');
}
$('info-btn').onclick=()=>$('info-overlay').classList.add('off');

/* ---------- Overlay educativo ---------- */
function showEdu(edu,onClose){
  $('edu-did').textContent=edu.did;$('edu-why').textContent=edu.why;
  $('edu-rule').textContent=edu.rule;$('edu-fix').textContent=edu.fix;
  $('edu-overlay').classList.remove('off');
  $('edu-btn').onclick=()=>{$('edu-overlay').classList.add('off');onClose&&onClose();};
}

/* ---------- Vidas ---------- */
function loseLife(){
  S.lives--;renderHud();
  if(S.lives<=0){vibrate('heavy');setTimeout(()=>endGame(),300);}
}

/* ---------- Avance ---------- */
function nextLevel(){
  if(S.lives<=0)return endGame();
  S.tutorial=false;localStorage.setItem(KEY+'_tut','1');
  S.level++;
  if(S.level>=LEVELS.length)return endGame();
  hideBubble();$('richi').classList.add('off');
  const room=LEVELS[S.level].room;
  loadLevel();
  if(TRANS[room]){bubble('richi',TRANS[room]);setTimeout(hideBubble,2600);}
}

/* ---------- Fin ---------- */
function endGame(){
  const prev=parseInt(localStorage.getItem(KEY)||'0',10);
  const isNew=S.score>prev;
  if(isNew)localStorage.setItem(KEY,String(S.score));
  let tier,msg;
  if(S.score>=480){tier='celebrating';msg='¡Mi casa es la más lista del barrio! Y encima sin arruinarme. Eres un fenómeno, Pablo.';}
  else if(S.score>=360){tier='happy';msg='Está chula la casa, oye. Repasa qué detecta cada sensor y qué resuelve cada actuador y queda perfecta.';}
  else {tier='worried';msg='Mmm… esto no acaba de funcionar. Recuerda: el sensor detecta, el actuador ejecuta, el nodo decide. Y nada de postureo.';}
  $('res-char').src=ASSETS[`richi_${tier}`];
  $('res-score').textContent=S.score+' pts';
  $('res-record').textContent= isNew?`¡Nuevo récord! ${prev} → ${S.score}`:`Récord: ${prev}`;
  $('res-record').classList.toggle('new',isNew);
  $('res-msg').textContent=msg;
  if(S.score>=GOAL)taskCompleted();
  show('results');
}

/* ---------- Fallback de imágenes que aún no existen ----------
   Mientras se generan los assets de personajes/fondos, una imagen que
   no cargue se oculta en vez de mostrar el icono roto. */
document.addEventListener('error',e=>{
  if(e.target&&e.target.tagName==='IMG'){e.target.style.visibility='hidden';}
},true);

/* ---------- Init ---------- */
$('intro-btn').onclick=()=>{resetState();show('play');loadLevel();};
$('res-btn').onclick=()=>{resetState();show('play');loadLevel();};
resetState();
show('intro');
