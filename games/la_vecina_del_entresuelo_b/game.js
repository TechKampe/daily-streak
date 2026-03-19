/* ════════════════════════════════════════════════
   La Vecina del Entresuelo B — game.js
   Lección: S5D3-AM — Vibración / soporte-escuadra
════════════════════════════════════════════════ */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

'use strict';

// ─── VIBRACIÓN ──────────────────────────────────

function vibrate(level, pattern) {
  if (!window.ReactNativeWebView) return;
  const msg = { action: 'VIBRATE', level };
  if (pattern) msg.pattern = pattern;
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

let vibIntensity3d = 0; // drives 3D shake in render loop
let rotY = 0.3, rotX = 0, rotYBase = 0.3, rotXBase = 0;

const VIBRATION = {
  loopId: null,
  start(intensity) {
    this.stop();
    vibIntensity3d = intensity;
    const cfg = this._config(intensity);
    if (!cfg) return;
    vibrate(cfg.level, cfg.pattern);
    this.loopId = setInterval(() => vibrate(cfg.level, cfg.pattern), cfg.ms);
  },
  stop() {
    clearInterval(this.loopId);
    this.loopId = null;
    vibIntensity3d = 0;
    vibrate('success');
  },
  _config(intensity) {
    if (intensity >= 0.8) return { level: 'heavy',  pattern: [0,200,80,200,80,200], ms: 600  };
    if (intensity >= 0.5) return { level: 'heavy',  pattern: [0,200,100,200],       ms: 750  };
    if (intensity >= 0.3) return { level: 'heavy',  pattern: [0,160,120],           ms: 950  };
    if (intensity >  0)   return { level: 'medium', pattern: [0,120],               ms: 1200 };
    return null;
  }
};

// ─── FONDOS POR INTENSIDAD ──────────────────────

const BACKGROUNDS = [
  { id: 'bg-furious', threshold: 0.55 },
  { id: 'bg-angry',   threshold: 0.30 },
  { id: 'bg-calming', threshold: 0.01 },
  { id: 'bg-calm',    threshold: 0.00 },
];

function updateBackground(intensity) {
  let activeId = 'bg-calm';
  if      (intensity >= 0.55) activeId = 'bg-furious';
  else if (intensity >= 0.30) activeId = 'bg-angry';
  else if (intensity >  0.00) activeId = 'bg-calming';

  BACKGROUNDS.forEach(bg => {
    document.getElementById(bg.id).classList.toggle('active', bg.id === activeId);
  });
}

// ─── CONTENIDO — RONDAS ─────────────────────────

const ROUNDS = [
  // ─── RONDA 1 — Tornillo suelto ───
  {
    roundIntro: {
      badge: 'Ronda 1 de 6',
      title: 'Fijación mecánica',
      hint:  'La unidad vibra desde que arrancó. Gira el soporte y busca el tornillo que no está bien apretado al muro.',
    },
    intensity: 0.80,
    faults: [
      {
        id: 'screw-loose',
        elementIds: ['s1'],
        type: 'screw',
        weight: 0.80,
        inspect: {
          icon: '',
          title: 'Tornillo suelto',
          desc: 'Este tornillo de fijación no está apretado al muro.',
          options: [
            { text: 'Apretar el tornillo con la llave', correct: true },
            { text: 'Añadir un taco de goma extra debajo', correct: false },
          ],
          error: {
            what:  'Intentaste añadir aislamiento elástico cuando el problema es de fijación mecánica.',
            why:   'Un taco de goma absorbe las vibraciones que llegan al muro — pero si el tornillo está suelto, el soporte se mueve entero y ningún taco puede compensarlo.',
            rule:  'Primero fijación, luego aislamiento. Sin fijación correcta, el aislamiento no sirve de nada.',
            todo:  'Aprieta el tornillo antes de pensar en los tacos.',
          },
        },
      },
    ],
  },

  // ─── RONDA 2 — Sin tacos de goma ───
  {
    roundIntro: {
      badge: 'Ronda 2 de 6',
      title: 'Aislamiento elástico',
      hint:  'El tornillo está apretado, pero la vibración sigue. Algo falta entre el soporte y la pared.',
    },
    intensity: 0.65,
    faults: [
      {
        id: 'no-pads',
        elementIds: ['p1', 'p2', 'p3', 'p4'],
        type: 'pad',
        weight: 0.65,
        inspect: {
          icon: '',
          title: 'Sin tacos de goma',
          desc: 'No hay tacos de goma entre el soporte y la pared. La vibración se transmite directamente a la estructura.',
          options: [
            { text: 'Instalar tacos de goma antivibración', correct: true },
            { text: 'Apretar más fuerte los tornillos', correct: false },
          ],
          error: {
            what:  'Apretaste más los tornillos pensando que eso reduciría la vibración.',
            why:   'Más tensión en los tornillos crea más superficie de contacto rígido con el muro — transmite más vibración a la estructura, no menos.',
            rule:  'Los tacos de goma son elementos elásticos que interrumpen el camino de transmisión de vibración. Sin ellos, el contacto soporte-muro es 100% rígido.',
            todo:  'Instala los tacos de goma entre el soporte y la pared. Luego aprieta los tornillos sobre ellos.',
          },
        },
      },
    ],
  },

  // ─── RONDA 3 — Tres fallos simultáneos ───
  {
    roundIntro: {
      badge: 'Ronda 3 de 6',
      title: 'Todo a la vez',
      hint:  'Esta vez hay tres fallos simultáneos: nivel, tornillos y un taco de goma. Resuélvelos todos para calmar a Doña Concha.',
    },
    intensity: 0.90,
    faults: [
      {
        id: 'bad-level',
        elementIds: ['lvl'],
        type: 'level',
        weight: 0.30,
        inspect: {
          icon: '',
          title: 'Nivel incorrecto',
          desc: 'El soporte-escuadra no está perfectamente horizontal. La unidad carga más en un lado que en el otro.',
          options: [
            { text: 'Nivelar el soporte con calzos', correct: true },
            { text: 'Apretar los tornillos del lado más alto', correct: false },
          ],
          error: {
            what:  'Apretaste los tornillos del lado alto para compensar la inclinación.',
            why:   'Los tornillos no corrigen el ángulo del soporte — solo añaden tensión asimétrica al soporte y al muro, que puede agrietarlo con el tiempo.',
            rule:  'El nivelado se consigue con calzos o ajustando la posición de la escuadra antes del anclaje. Los tornillos se aprietan después, con el soporte ya horizontal.',
            todo:  'Nivela el soporte primero, luego aprieta los tornillos uniformemente.',
          },
        },
      },
      {
        id: 'two-screws',
        elementIds: ['s2', 's3'],
        type: 'screw',
        weight: 0.35,
        inspect: {
          icon: '',
          title: 'Dos tornillos sueltos',
          desc: 'Dos tornillos de fijación están sin apretar. El soporte no está correctamente anclado.',
          options: [
            { text: 'Apretar los dos tornillos', correct: true },
            { text: 'Reemplazar los tacos de goma por unos nuevos', correct: false },
          ],
          error: {
            what:  'Cambiaste los tacos de goma creyendo que estaban desgastados.',
            why:   'Los tacos en buen estado no pueden compensar unos tornillos sueltos — el soporte sigue sin estar firmemente anclado independientemente del estado de los tacos.',
            rule:  'Sin fijación mecánica correcta, el aislamiento elástico no puede funcionar. El orden siempre es: anclar primero, aislar después.',
            todo:  'Aprieta los dos tornillos sueltos.',
          },
        },
      },
      {
        id: 'missing-pad',
        elementIds: ['p2'],
        type: 'pad',
        weight: 0.25,
        inspect: {
          icon: '',
          title: 'Un taco de goma falta',
          desc: 'Uno de los tacos de goma antivibración no está instalado. La vibración sigue transmitiéndose por ese punto de apoyo.',
          options: [
            { text: 'Instalar el taco de goma que falta', correct: true },
            { text: 'Ajustar la inclinación del soporte para compensar', correct: false },
          ],
          error: {
            what:  'Inclinaste el soporte intentando compensar la falta de aislamiento en ese punto.',
            why:   'Inclinar el soporte para compensar un taco ausente crea un nuevo problema de nivelado y no elimina la transmisión de vibración por ese punto de apoyo.',
            rule:  'Todos los puntos de apoyo del soporte deben tener su taco de goma. Un solo punto sin taco transmite vibración directamente a la estructura del edificio.',
            todo:  'Instala el taco de goma que falta.',
          },
        },
      },
    ],
  },

  // ─── RONDA 4 — Secuencia de montaje incorrecta ───
  {
    roundIntro: {
      badge: 'Ronda 4 de 6',
      title: 'El orden del proceso',
      hint:  'Los tornillos se apretaron antes de verificar el nivel. El soporte quedó bloqueado en una posición incorrecta.',
    },
    intensity: 0.85,
    faults: [
      {
        id: 'level-pre-tightened',
        elementIds: ['lvl'],
        type: 'level',
        weight: 0.45,
        inspect: {
          icon: '',
          title: 'Nivel bloqueado por tornillos',
          desc: 'El soporte se apretó antes de verificar el nivel. La burbuja no puede centrarse porque el soporte está forzado contra la pared.',
          options: [
            { text: 'Aflojar tornillos, nivelar el soporte y volver a apretar', correct: true },
            { text: 'Añadir calzos bajo la esquina más baja para compensar', correct: false },
          ],
          error: {
            what:  'Intentaste compensar la inclinación con calzos.',
            why:   'Un calzo añadido al final es un "arreglo", no una solución. El soporte sigue sin estar correctamente nivelado desde el replanteo.',
            rule:  'La secuencia correcta es: replantear → presentar → fijar a mitad → nivelar fino → apretar final. El nivel debe salir del replanteo, no de trucos posteriores.',
            todo:  'Afloja los tornillos, ajusta el soporte hasta que la burbuja centre y luego aprieta uniformemente.',
          },
        },
      },
      {
        id: 'screws-diagonal',
        elementIds: ['s1', 's4'],
        type: 'screw',
        weight: 0.40,
        inspect: {
          icon: '',
          title: 'Tornillos apretados en orden incorrecto',
          desc: 'Los tornillos se apretaron en diagonal simultáneamente en lugar de seguir el orden cruzado. El soporte está torcido.',
          options: [
            { text: 'Aflojar y volver a apretar en orden cruzado (↖↘ → ↗↙)', correct: true },
            { text: 'Añadir arandelas para distribuir la presión', correct: false },
          ],
          error: {
            what:  'Intentaste añadir arandelas para compensar la torsión.',
            why:   'Las arandelas distribuyen presión pero no corrigen la torsión del soporte causada por el orden incorrecto de apretado.',
            rule:  'El apretado final siempre se hace en orden cruzado: primero un tornillo, luego el opuesto en diagonal, luego los otros dos. Así el soporte asienta uniformemente.',
            todo:  'Afloja los cuatro tornillos y vuelve a apretar en orden cruzado.',
          },
        },
      },
    ],
  },

  // ─── RONDA 5 — Consecuencias de mala ubicación ───
  {
    roundIntro: {
      badge: 'Ronda 5 de 6',
      title: 'Consecuencias de la ubicación',
      hint:  'La unidad se instaló demasiado cerca de la bajante. Para encajar el soporte, el técnico tuvo que comprometer la instalación. Busca los daños.',
    },
    intensity: 0.75,
    faults: [
      {
        id: 'pad-corner-skipped',
        elementIds: ['p2'],
        type: 'pad',
        weight: 0.38,
        inspect: {
          icon: '',
          title: 'Taco de goma omitido — esquina interior',
          desc: 'El técnico no instaló el taco de la esquina interior porque la bajante dejaba poco espacio. La vibración se transmite por ese punto directamente al muro.',
          options: [
            { text: 'Reubicar el soporte para ganar espacio e instalar el taco', correct: true },
            { text: 'Dejar sin taco — esa esquina transmite poca vibración', correct: false },
          ],
          error: {
            what:  'Decidiste dejar esa esquina sin taco porque "transmite poca vibración".',
            why:   'Cada punto de apoyo sin taco es un puente rígido directo entre el soporte y la estructura. No hay puntos "de poca vibración" — todos cuentan.',
            rule:  'Si la ubicación no permite instalar todos los tacos de goma correctamente, la ubicación está mal elegida. Reubica primero.',
            todo:  'Selecciona una posición donde todos los tacos puedan instalarse correctamente.',
          },
        },
      },
      {
        id: 'level-bad-location',
        elementIds: ['lvl'],
        type: 'level',
        weight: 0.37,
        inspect: {
          icon: '',
          title: 'Soporte inclinado por replanteo impreciso',
          desc: 'Al montar en una ubicación ajustada, el replanteo no fue riguroso. El soporte quedó 2 mm inclinado hacia la pared.',
          options: [
            { text: 'Remarcar la posición correcta y volver a instalar', correct: true },
            { text: 'Compensar apretando más los tornillos del lado alto', correct: false },
          ],
          error: {
            what:  'Intentaste compensar la inclinación apretando más los tornillos del lado alto.',
            why:   'Apretar más en un lado añade tensión asimétrica al soporte y al muro — no corrige el ángulo y puede agrietar la fijación con el tiempo.',
            rule:  'Un replanteo impreciso no se corrige con tornillos. Se corrige marcando de nuevo con nivel y reposicionando el soporte antes del anclaje.',
            todo:  'Vuelve al replanteo: marca los puntos con nivel, taladra en la posición correcta y reinstala.',
          },
        },
      },
    ],
  },

  // ─── RONDA 6 — Verificación final completa ───
  {
    roundIntro: {
      badge: 'Ronda 6 de 6',
      title: 'Verificación final',
      hint:  'Revisión completa antes de arrancar el equipo. Tres puntos críticos están fallando. Encuéntralos todos — Doña Concha no perdona.',
    },
    intensity: 0.95,
    faults: [
      {
        id: 'final-level',
        elementIds: ['lvl'],
        type: 'level',
        weight: 0.30,
        inspect: {
          icon: '',
          title: 'Nivel — verificación final',
          desc: 'La verificación final detecta que el soporte no está perfectamente horizontal. El compresor cargará asimétricamente desde el primer arranque.',
          options: [
            { text: 'Nivelar el soporte antes de la puesta en marcha', correct: true },
            { text: 'Arrancar y esperar a ver si la vibración es tolerable', correct: false },
          ],
          error: {
            what:  'Decidiste arrancar el equipo y esperar a ver si vibra demasiado.',
            why:   'Un soporte mal nivelado somete al compresor a cargas asimétricas desde el primer ciclo. El daño es progresivo y puede invalidar la garantía.',
            rule:  'La verificación final incluye nivel + fijación antes del arranque, siempre. Un "medio bien" no vale.',
            todo:  'Nivela el soporte ahora, antes de encender el equipo.',
          },
        },
      },
      {
        id: 'final-screw',
        elementIds: ['s3'],
        type: 'screw',
        weight: 0.30,
        inspect: {
          icon: '',
          title: 'Tornillo sin apretar — verificación final',
          desc: 'Un tornillo quedó sin el apretado final. En la verificación de firmeza se detecta movimiento en ese punto de anclaje.',
          options: [
            { text: 'Apretar el tornillo y verificar firmeza del conjunto', correct: true },
            { text: 'El resto de tornillos compensan — es suficiente', correct: false },
          ],
          error: {
            what:  'Decidiste que los demás tornillos compensan el que falta por apretar.',
            why:   'Un soporte con cuatro puntos de anclaje pero solo tres efectivos no está bien fijado. El punto suelto concentrará vibración y fatiga el soporte.',
            rule:  'La verificación de firmeza se hace empujando el soporte con fuerza en todas las direcciones. Si hay movimiento, hay problema.',
            todo:  'Aprieta el tornillo y repite la verificación de firmeza.',
          },
        },
      },
      {
        id: 'final-pads',
        elementIds: ['p1', 'p4'],
        type: 'pad',
        weight: 0.35,
        inspect: {
          icon: '',
          title: 'Dos tacos de goma ausentes',
          desc: 'La verificación final detecta dos tacos de goma sin instalar en las esquinas opuestas. El aislamiento anti-vibración está incompleto.',
          options: [
            { text: 'Instalar los dos tacos antes de la puesta en marcha', correct: true },
            { text: 'Con dos tacos es suficiente para reducir la vibración', correct: false },
          ],
          error: {
            what:  'Decidiste que dos tacos de goma son suficientes.',
            why:   'Los dos puntos sin taco son puentes rígidos directos entre soporte y muro. La vibración se transmite por ellos aunque los otros dos estén aislados.',
            rule:  'El aislamiento anti-vibratorio es efectivo solo cuando todos los puntos de contacto tienen su elemento elástico. Uno solo que falte anula el sistema.',
            todo:  'Instala los dos tacos que faltan y verifica que todos los puntos están aislados antes de arrancar.',
          },
        },
      },
    ],
  },
];

// ─── ESTADO DEL JUEGO ───────────────────────────

let state = {
  round:        0,
  intensity:    0,
  activeFaults: [],
  currentFault: null,
  gameState:    'IDLE', // IDLE | TUTORIAL | SIMULATING | INSPECT | ERROR | ROUND_COMPLETE | RESULTS
};

// ─── UTILS ──────────────────────────────────────

const ALL_OVERLAYS = ['overlay-intro', 'overlay-tutorial', 'overlay-round-intro', 'overlay-inspect', 'overlay-error', 'overlay-results'];

function showOverlay(id) {
  ALL_OVERLAYS.forEach(oid => {
    document.getElementById(oid).classList.toggle('hidden', oid !== id);
  });
}

function hideAllOverlays() {
  ALL_OVERLAYS.forEach(oid => {
    document.getElementById(oid).classList.add('hidden');
  });
}

function showFloatingText(text, extraClass = '') {
  const el = document.getElementById('floating-text');
  el.textContent = text;
  el.className = `floating-text${extraClass ? ' ' + extraClass : ''}`;
  void el.offsetWidth;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 1600);
}

function fillDots() {
  for (let i = 1; i <= ROUNDS.length; i++) {
    document.getElementById(`dot-${i}`).classList.toggle('filled', i <= state.round);
  }
}

// ─── 3D FAULT STYLES ────────────────────────────

// faultMeshMap populated by initThree(): { 's1': mesh, 'p1': mesh, 'lvl': mesh, ... }
// Each mesh has: mesh._normalMat (material when not a fault), mesh._state ('normal'|'fault'|'fixed')
let faultMeshMap = {};

function makeFaultMat() {
  return new THREE.MeshLambertMaterial({ color: 0xE74C3C, emissive: new THREE.Color(0x2A0000) });
}
function makeFixedMat() {
  return new THREE.MeshLambertMaterial({ color: 0x00E6BC, emissive: new THREE.Color(0x003B2A) });
}

function applyFaultStyles(fault, mode) {
  fault.elementIds.forEach(id => {
    const mesh = faultMeshMap[id];
    if (!mesh) return;
    if (mode === 'fault') {
      mesh.material = makeFaultMat();
      mesh._state   = 'fault';
    } else if (mode === 'fixed') {
      mesh.material = makeFixedMat();
      mesh._state   = 'fixed';
    }
  });
}

function resetAllBracketStyles() {
  Object.entries(faultMeshMap).forEach(([, mesh]) => {
    mesh.material = mesh._normalMat.clone();
    mesh._state   = 'normal';
  });
}

// ─── INICIO DE RONDA ────────────────────────────

function startRound(roundIndex) {
  state.round        = roundIndex;
  const roundData    = ROUNDS[roundIndex];
  state.intensity    = roundData.intensity;
  state.activeFaults = roundData.faults.map(f => ({ ...f }));

  // Reset 3D rotation to initial front-facing position
  rotY = 0.3; rotX = 0;
  rotYBase = 0.3; rotXBase = 0;

  resetAllBracketStyles();
  state.activeFaults.forEach(fault => applyFaultStyles(fault, 'fault'));

  fillDots();
  updateBackground(state.intensity);
  VIBRATION.start(state.intensity);

  state.gameState = 'SIMULATING';
  hideAllOverlays();
}

// ─── TAP EN ELEMENTO 3D ─────────────────────────

function handleCanvasTap(cx, cy, camera, raycaster, ptr) {
  if (state.gameState !== 'SIMULATING') return;

  ptr.set(
    (cx / window.innerWidth)  * 2 - 1,
   -(cy / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(ptr, camera);

  const meshes = Object.values(faultMeshMap);
  const hits   = raycaster.intersectObjects(meshes);
  if (!hits.length) return;

  const hitMesh = hits[0].object;
  const hitId   = Object.entries(faultMeshMap).find(([, m]) => m === hitMesh)?.[0];
  if (!hitId) return;

  const fault = state.activeFaults.find(f => f.elementIds.includes(hitId));
  if (!fault) {
    showFloatingText('Esto está bien ✓');
    return;
  }
  openInspect(fault);
}

// ─── OVERLAY DE INSPECCIÓN ──────────────────────

function openInspect(fault) {
  state.currentFault = fault;
  state.gameState    = 'INSPECT';

  const insp = fault.inspect;
  document.getElementById('inspect-icon').textContent  = insp.icon;
  document.getElementById('inspect-title').textContent = insp.title;
  document.getElementById('inspect-desc').textContent  = insp.desc;

  const options = [...insp.options];
  if (Math.random() < 0.5) options.reverse();

  const btnA = document.getElementById('option-a');
  const btnB = document.getElementById('option-b');
  btnA.textContent = options[0].text; btnA.dataset.correct = options[0].correct;
  btnB.textContent = options[1].text; btnB.dataset.correct = options[1].correct;
  [btnA, btnB].forEach(btn => { btn.classList.remove('flash-correct', 'flash-wrong'); btn.disabled = false; });

  showOverlay('overlay-inspect');
}

function onOptionTap(e) {
  if (state.gameState !== 'INSPECT') return;
  const btn       = e.currentTarget;
  const isCorrect = btn.dataset.correct === 'true';

  document.getElementById('option-a').disabled = true;
  document.getElementById('option-b').disabled = true;

  if (isCorrect) {
    btn.classList.add('flash-correct');
    showFloatingText('✓ ' + btn.textContent);
    setTimeout(() => { hideAllOverlays(); applyFix(state.currentFault); }, 900);
  } else {
    btn.classList.add('flash-wrong');
    showFloatingText('✗ ' + btn.textContent, ' toast-wrong');
    VIBRATION.start(Math.min(1.0, state.intensity + 0.3));
    setTimeout(() => VIBRATION.start(state.intensity), 1000);
    setTimeout(() => { hideAllOverlays(); openError(state.currentFault.inspect.error); }, 900);
  }
}

// ─── APLICAR ARREGLO ────────────────────────────

function applyFix(fault) {
  state.activeFaults = state.activeFaults.filter(f => f.id !== fault.id);
  applyFaultStyles(fault, 'fixed');

  state.intensity = Math.max(0, state.intensity - fault.weight);
  updateBackground(state.intensity);

  if (state.activeFaults.length > 0) {
    VIBRATION.start(state.intensity);
    state.gameState = 'SIMULATING';
  } else {
    completeRound();
  }
}

// ─── OVERLAY DE ERROR ───────────────────────────

function openError(err) {
  state.gameState = 'ERROR';
  document.getElementById('err-what').textContent = err.what;
  document.getElementById('err-why').textContent  = err.why;
  document.getElementById('err-rule').textContent = err.rule;
  document.getElementById('err-do').textContent   = err.todo;
  showOverlay('overlay-error');
}

// ─── COMPLETAR RONDA ────────────────────────────

function completeRound() {
  state.gameState = 'ROUND_COMPLETE';
  VIBRATION.stop();
  updateBackground(0);

  document.getElementById(`dot-${state.round + 1}`).classList.add('filled');
  const isLastRound = state.round === ROUNDS.length - 1;

  setTimeout(() => {
    if (isLastRound) {
      showResults();
    } else {
      showRoundIntro(state.round + 1);
    }
  }, 1500);
}

// ─── RESULTADOS ─────────────────────────────────

function showResults() {
  state.gameState = 'RESULTS';
  document.documentElement.classList.add('results');
  showOverlay('overlay-results');
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
  }
}

// ─── RESET ──────────────────────────────────────

function resetGame() {
  VIBRATION.stop();
  document.documentElement.classList.remove('results');
  state = { round: 0, intensity: 0, activeFaults: [], currentFault: null, gameState: 'IDLE' };
  resetAllBracketStyles();
  fillDots();
  updateBackground(ROUNDS[0].intensity);
  showOverlay('overlay-intro');
}

// ─── INTRO DE RONDA ─────────────────────────────

function showRoundIntro(roundIndex) {
  const intro = ROUNDS[roundIndex].roundIntro;
  document.getElementById('round-intro-badge').textContent = intro.badge;
  document.getElementById('round-intro-title').textContent = intro.title;
  document.getElementById('round-intro-hint').textContent  = intro.hint;
  state.pendingRound = roundIndex;
  state.gameState = 'ROUND_INTRO';
  showOverlay('overlay-round-intro');
}

// ─── TUTORIAL ───────────────────────────────────

function onTutorialNext() { showRoundIntro(0); }

// ════════════════════════════════════════════════
//  THREE.JS — ESCENA 3D
// ════════════════════════════════════════════════

function initThree() {
  const canvas = document.getElementById('game-canvas');

  // ── Renderer (transparent background — scene-bg images show through) ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene(); // background = null → transparent
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8.0);
  camera.lookAt(0, 0.5, 0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.lookAt(0, 0.5, 0);
  });

  // ── Lights ──
  scene.add(new THREE.HemisphereLight(0xFFF4E0, 0x1A3060, 0.65));
  const sun = new THREE.DirectionalLight(0xFFFDF0, 1.2);
  sun.position.set(5, 8, 6);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xAAD0FF, 0.40); fill.position.set(-5, -2, -4); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0x00E6BC, 0.20); rim.position.set(0, -5, -6);   scene.add(rim);

  // ── Canvas textures ──
  function makeFinTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#DCDCDA'; ctx.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 38; i++) { ctx.fillStyle = i % 2 === 0 ? '#C4C4C2' : '#E8E8E6'; ctx.fillRect(0, i * 13.5, 64, 7); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function makeTopVentTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#E0E0DE'; ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#C8C8C6';
    for (let i = 0; i < 28; i++) ctx.fillRect(i * 18, 8, 10, 48);
    return new THREE.CanvasTexture(c);
  }

  // ── Materials ──
  const lam = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
  const MAT = {
    body:        lam(0xF2F1ED),
    bodyShade:   lam(0xE0DFD9),
    bodyDark:    lam(0xC8C7C2),
    finSide:     lam(0xE0E0DE, { map: makeFinTex() }),
    topVent:     lam(0xE4E4E2, { map: makeTopVentTex() }),
    accent:      lam(0x00E6BC),
    accentDark:  lam(0x009E82),
    grilleDark:  lam(0x303030),
    grilleMid:   lam(0x2E2E2E),
    blade:       lam(0x3A3A3A),
    bracket:     lam(0x8E8E8E),
    bracketRail: lam(0xA0A0A0),
    // Normal states for fault elements
    normalScrew: lam(0x8A8A8A),
    normalPad:   lam(0x04FFB4),
    normalLevel: lam(0xBBBBBB),
  };

  // ── Unit group ──
  const unitGroup  = new THREE.Group();
  const bladeGroup = new THREE.Group();
  scene.add(unitGroup);
  unitGroup.rotation.y = 0.3;
  unitGroup.scale.setScalar(0.72);

  function add(mesh, x, y, z) { mesh.position.set(x, y, z); unitGroup.add(mesh); return mesh; }
  function box(w, h, d, mat)  { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
  function cyl(r, h, segs, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat);
    m.rotation.x = Math.PI / 2; return m;
  }

  const BW = 2.7, BH = 2.0, BD = 1.35;
  const fz = BD / 2, bz = -BD / 2;

  // Main body (rounded)
  unitGroup.add(new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 4, 0.13), MAT.body));

  // Side fin overlays
  for (const side of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(BD * 0.82, BH * 0.82), MAT.finSide);
    m.rotation.y = side * Math.PI / 2; m.position.set(side * (BW / 2 + 0.001), 0, 0);
    unitGroup.add(m);
  }
  // Top vent overlay
  const topVentMesh = new THREE.Mesh(new THREE.PlaneGeometry(BW * 0.84, BD * 0.80), MAT.topVent);
  topVentMesh.rotation.x = -Math.PI / 2; topVentMesh.position.set(0, BH / 2 + 0.001, 0);
  unitGroup.add(topVentMesh);

  // Structural trim
  add(box(BW + 0.06, 0.08, BD + 0.06, MAT.bodyShade), 0, BH/2 + 0.04, 0);
  add(box(BW + 0.04, 0.12, BD + 0.04, MAT.bodyDark),  0, -BH/2 - 0.06, 0);

  // Brand strip
  add(box(BW, 0.18, 0.03, MAT.accent),      0, BH/2 - 0.09, fz + 0.015);
  add(box(BW, 0.04, 0.025, MAT.accentDark), 0, BH/2 - 0.20, fz + 0.012);

  // Fan grille
  const fanCX = -0.30, fanCY = -0.05, fanR = 0.72;
  const fanHousing = new THREE.Mesh(new THREE.CylinderGeometry(fanR, fanR, 0.10, 48), MAT.grilleDark);
  fanHousing.rotation.x = Math.PI / 2; add(fanHousing, fanCX, fanCY, fz + 0.04);

  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.56, 0.025), MAT.blade);
    b.rotation.z = (i / 5) * Math.PI * 2;
    b.position.set(Math.sin((i / 5) * Math.PI * 2) * 0.18, Math.cos((i / 5) * Math.PI * 2) * 0.18, 0);
    bladeGroup.add(b);
  }
  bladeGroup.position.set(fanCX, fanCY, fz + 0.05);
  unitGroup.add(bladeGroup);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.04, 16), MAT.grilleMid);
  hub.rotation.x = Math.PI / 2; add(hub, fanCX, fanCY, fz + 0.07);

  add(new THREE.Mesh(new THREE.RingGeometry(fanR - 0.07, fanR + 0.015, 48),
      new THREE.MeshLambertMaterial({ color: 0x282828, side: THREE.DoubleSide })), fanCX, fanCY, fz + 0.09);
  for (let r = 0.22; r < fanR - 0.10; r += 0.175) {
    add(new THREE.Mesh(new THREE.RingGeometry(r, r + 0.028, 40),
        new THREE.MeshLambertMaterial({ color: 0x333333, side: THREE.DoubleSide })), fanCX, fanCY, fz + 0.09);
  }
  for (let i = 0; i < 8; i++) {
    const spoke = box(0.022, (fanR - 0.08) * 2, 0.015, MAT.grilleMid);
    spoke.rotation.z = (i / 8) * Math.PI; add(spoke, fanCX, fanCY, fz + 0.09);
  }

  // LED indicator
  const led = cyl(0.032, 0.022, 10, lam(0x00FF88, { emissive: new THREE.Color(0x004422) }));
  add(led, 0.72, BH/2 - 0.38, fz + 0.022);

  // Pipe stubs
  for (const [px, pr] of [[-0.05, 0.065], [0.28, 0.048]]) {
    add(cyl(pr, 0.22, 12, lam(0xC49A50)), px + 0.42, -BH/2 - 0.11, 0.1);
  }
  const insul = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.20, 12), lam(0x222222));
  insul.rotation.x = Math.PI / 2; add(insul, 0.42 - 0.05, -BH/2 - 0.11, 0.1);

  // Back bracket
  add(box(BW - 0.25, BH - 0.30, 0.08, MAT.bracket),     0, 0.05, bz - 0.04);
  add(box(BW - 0.35, 0.12, 0.06, MAT.bracketRail),       0,  0.52, bz - 0.08);
  add(box(BW - 0.35, 0.12, 0.06, MAT.bracketRail),       0, -0.42, bz - 0.08);
  for (const rx of [-0.5, 0.5]) add(box(0.06, BH * 0.60, 0.05, MAT.bracket), rx, 0.05, bz - 0.085);

  // ── Fault elements ──
  // Positions: s1=top-left, s2=top-right, s3=bottom-left, s4=bottom-right
  const screwDefs = [
    { id: 's1', x: -0.85, y:  0.55 },
    { id: 's2', x:  0.85, y:  0.55 },
    { id: 's3', x: -0.85, y: -0.52 },
    { id: 's4', x:  0.85, y: -0.52 },
  ];
  screwDefs.forEach(({ id, x, y }) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 6), MAT.normalScrew.clone());
    m.rotation.x = Math.PI / 2; m.position.set(x, y, bz - 0.09);
    m._normalMat = MAT.normalScrew; m._state = 'normal';
    unitGroup.add(m);
    faultMeshMap[id] = m;
  });

  // Positions: p1=top-left, p2=top-right, p3=bottom-left, p4=bottom-right
  const padDefs = [
    { id: 'p1', x: -0.62, y:  0.50 },
    { id: 'p2', x:  0.62, y:  0.50 },
    { id: 'p3', x: -0.62, y: -0.44 },
    { id: 'p4', x:  0.62, y: -0.44 },
  ];
  padDefs.forEach(({ id, x, y }) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.08), MAT.normalPad.clone());
    m.position.set(x, y, bz - 0.09);
    m._normalMat = MAT.normalPad; m._state = 'normal';
    unitGroup.add(m);
    faultMeshMap[id] = m;
  });

  // Level indicator with movable bubble child
  const lvlMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.80, 6, 14), MAT.normalLevel.clone());
  lvlMesh.rotation.z = Math.PI / 2; lvlMesh.position.set(0, -0.68, bz - 0.09);
  lvlMesh._normalMat = MAT.normalLevel; lvlMesh._state = 'normal';
  unitGroup.add(lvlMesh);
  faultMeshMap['lvl'] = lvlMesh;

  // Bubble inside level (child — moves in local x when fault)
  const bubbleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0x00E6BC })
  );
  bubbleMesh.position.set(0, 0, 0.08);
  lvlMesh.add(bubbleMesh);

  // ── Drag-to-rotate (direct: unit follows finger, no inertia) ──
  let isDragging = false;
  let downX = 0, downY = 0;

  const raycaster = new THREE.Raycaster();
  const ptr       = new THREE.Vector2();

  canvas.addEventListener('pointerdown', e => {
    isDragging = true;
    downX = e.clientX; downY = e.clientY;
    rotYBase = rotY;   rotXBase = rotX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!isDragging) return;
    rotY = rotYBase + (e.clientX - downX) * 0.012;
    rotX = Math.max(-0.58, Math.min(0.58, rotXBase + (e.clientY - downY) * 0.010));
  });
  canvas.addEventListener('pointerup', e => {
    isDragging = false;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (Math.sqrt(dx*dx + dy*dy) < 9) handleCanvasTap(e.clientX, e.clientY, camera, raycaster, ptr);
  });
  canvas.addEventListener('pointercancel', () => { isDragging = false; });

  // ── Render loop ──
  const UNIT_Y = 1.6;
  let t = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    unitGroup.rotation.y = rotY;
    unitGroup.rotation.x = rotX;

    // Vibration shake
    if (vibIntensity3d > 0.01) {
      const s = vibIntensity3d * 0.048;
      unitGroup.position.x = Math.sin(t * 44) * s;
      unitGroup.position.y = UNIT_Y + Math.cos(t * 39) * s * 0.55;
    } else {
      unitGroup.position.x *= 0.88;
      unitGroup.position.y += (UNIT_Y - unitGroup.position.y) * 0.12;
    }

    // Fan spin
    bladeGroup.rotation.z -= dt * (1.5 + vibIntensity3d * 3.0);

    // Fault pulse + level bubble
    Object.values(faultMeshMap).forEach(mesh => {
      if (mesh._state === 'fault') {
        const p = 0.5 + 0.5 * Math.sin(t * 3.8);
        mesh.material.emissive.setRGB(p * 0.38, 0, 0);
      }
    });

    // Animate level bubble offset
    const lvl    = faultMeshMap['lvl'];
    const bubble = lvl?.children[0];
    if (bubble) {
      const targetX = lvl._state === 'fault' ? 0.30 : 0;
      bubble.position.x += (targetX - bubble.position.x) * 0.08;
    }

    renderer.render(scene, camera);
  }

  animate();
}

// ─── INIT ────────────────────────────────────────

function init() {
  // Initialize 3D scene
  initThree();

  // Intro
  document.getElementById('btn-start').addEventListener('click', () => {
    state.intensity    = ROUNDS[0].intensity;
    state.activeFaults = ROUNDS[0].faults.map(f => ({ ...f }));
    resetAllBracketStyles();
    state.activeFaults.forEach(fault => applyFaultStyles(fault, 'fault'));
    updateBackground(state.intensity);
    VIBRATION.start(state.intensity);
    state.gameState = 'TUTORIAL';
    showOverlay('overlay-tutorial');
  });

  // Tutorial
  document.getElementById('btn-tutorial-next').addEventListener('click', onTutorialNext);

  // Round intro
  document.getElementById('btn-round-start').addEventListener('click', () => {
    startRound(state.pendingRound);
  });

  // Inspect options
  document.getElementById('option-a').addEventListener('click', onOptionTap);
  document.getElementById('option-b').addEventListener('click', onOptionTap);

  // Error understood
  document.getElementById('btn-understood').addEventListener('click', () => {
    hideAllOverlays();
    state.gameState = 'SIMULATING';
  });

  // Replay
  document.getElementById('btn-replay').addEventListener('click', resetGame);

  // Initial state
  fillDots();
  updateBackground(ROUNDS[0].intensity);
  showOverlay('overlay-intro');
}

document.addEventListener('DOMContentLoaded', init);
