// === El SAT — Game Logic ===
// Deduction game: diagnose split AC component failures via visual novel dialogue

(function () {
  'use strict';

  // ── State ──
  const S = {
    currentCase: 0,
    currentTurn: 0,
    phase: 'intro',
    expectedElim: null,
    diagnosisChoice: null,
    caseResults: [],
    seniorUsed: false,
    eliminatedComponents: new Set(),
    record: parseInt(localStorage.getItem('el_sat_record') || '0', 10),
    tutorialShown: false,
  };

  // ── DOM ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    hud: $('#hud-case'),
    portrait: $('#client-portrait'),
    bubble: $('#speech-bubble'),
    dialogueArea: $('#dialogue-area'),
    options: $('#options-area'),
    optionsModal: $('#options-modal'),
    optionsModalTitle: $('#options-modal-title'),
    optionsModalSubtitle: $('#options-modal-subtitle'),
    hudAction: $('#hud-action'),
    seniorHint: $('#senior-hint'),
    seniorText: $('#senior-text'),
    overlayResult: $('#overlay-result'),
    overlayTransition: $('#overlay-transition'),
    resultNarrative: $('#result-narrative'),
    resultClientBubble: $('#result-client-bubble'),
    resultClientImg: $('#result-client-img'),
    resultClientText: $('#result-client-text'),
    resultEduCard: $('#result-edu-card'),
    btnContinue: $('#btn-continue'),
    resultsSummary: $('#results-summary'),
    resultsTotal: $('#results-total'),
    resultsRecord: $('#results-record'),
    resultsMessage: $('#results-message'),
  };

  // ── Case Data ──
  // Each turn: { type: 'passive'|'active', text?, options?, eliminate?, ... }
  // eliminate: component key or null (no elimination this turn)
  // For active turns, all non-humor options lead to same eliminate target
  const CASES = [
    // ─── CASO 1: Doña Carmen — Ventilador exterior ───
    {
      client: {
        name: 'Doña Carmen',
        subtitle: 'Jubilada. Habla mucho y hace galletas.',
        portrait: 'https://res.cloudinary.com/kampe/image/upload/v1773838692/carmen_qcv7hz.png',
        intro: 'Primera visita del día. Doña Carmen, C/ Rosales 4, 3ºB. Dice que el aire se para solo.',
      },
      culprit: 'vent_ext',
      runnerUp: 'condensador',
      seniorHint: 'Espera. Repasa lo que ha dicho: la de fuera se recalienta y se para. ¿Qué componente podría estar funcionando bien ahí?',
      turns: [
        {
          type: 'passive',
          text: 'Pues mire, yo estaba regando las begonias del balcón y he notado que la caja esa de fuera hacía un ruido raro, como que se esforzaba mucho. Y luego se ha parado sola. He esperado un rato y ha vuelto a arrancar, pero se para otra vez al rato. Ah, y el mando funciona bien, ¿eh? Le doy a encender y responde.',
          eliminate: 'sensor',
        },
        {
          type: 'active',
          options: [
            { text: '¿El aire sale por dentro de casa?', response: 'Sí, sí, sale aire. Pero no enfría como antes. Bueno, un poquito al principio sí, pero luego nada.' },
            { text: '¿Puedo comer una de esas galletas? Tienen muy buena pinta', isHumor: true, playerLine: '¡Por supuesto!', clientResponse: '¡Así me gusta! Un técnico que come bien trabaja mejor. Las hago con mantequilla de la buena, ¿eh? Mi vecina Paquita dice que le salen mejor, pero no se crea.' },
            { text: '¿Ha tocado algo del mando?', response: 'No, no, yo al mando no le toco más que para encender y apagar. Funciona bien, ¿eh? Le pongo a 24 y se enciende.' },
          ],
          eliminate: 'vent_int',
        },
        {
          type: 'passive',
          text: 'Ah, y otra cosa. He salido al balcón a mirar la caja de fuera y estaba muy caliente. Mucho más de lo normal, ¿eh? Que yo la toco a veces cuando riego y nunca quema así.',
          eliminate: 'compresor',
        },
        {
          type: 'active',
          options: [
            { text: '¿La unidad de dentro gotea o tiene hielo?', response: 'No, no, está seca. Ni gota ni hielo ni nada raro por dentro.' },
            { text: '¿La unidad de fuera hace un zumbido fuerte o está en silencio?', response: 'Pues hace el zumbido ese de siempre del motor, pero lo que no oigo es el ventilador. Antes hacía como un soplido fuerte y ahora nada.' },
          ],
          eliminate: 'evaporador',
        },
      ],
      consequence: {
        success: {
          narrative: 'El técnico abre la unidad exterior y comprueba que el ventilador está bloqueado por suciedad. Lo limpia, lo prueba, y a los diez minutos la casa vuelve a estar fresca.',
          clientText: '¡Qué maravilla! ¿Quiere que le fría un huevo antes de irse?',
        },
        failure: {
          narrative: 'El técnico revisa el {component}. Todo está en orden. Dos horas perdidas. Carmen llama al día siguiente: el equipo se sigue parando.',
        },
      },
      eduCard: {
        component: 'Ventilador exterior',
        func: 'Ventila el condensador para que disipe el calor',
        symptom: 'La unidad exterior se recalienta y el equipo se para por protección térmica',
      },
    },

    // ─── CASO 2: Óscar — Sensor ───
    {
      client: {
        name: 'Óscar',
        subtitle: 'Trabaja remoto. Impaciente y vago con las explicaciones.',
        portrait: 'https://res.cloudinary.com/kampe/image/upload/v1773838691/oscar_mupreq.png',
        intro: 'Segunda visita. Óscar, C/ Goya 12, 1ºA. Dice que el aire «no va bien».',
      },
      culprit: 'sensor',
      runnerUp: 'evaporador',
      seniorHint: 'Para. Ha dicho que enfría bien cuando funciona, pero se enciende y se apaga solo. ¿Qué componente controla cuándo se enciende y se apaga?',
      turns: [
        {
          type: 'passive',
          text: 'Tío, el aire no va bien. Sale aire y enfría, pero se enciende y se apaga solo todo el rato. Cinco minutos funcionando y se para. Estoy en una call y es insoportable.',
          eliminate: 'vent_int',
        },
        {
          type: 'active',
          options: [
            { text: '¿Sale aire cuando está encendido?', response: 'Sí, sí, sale aire y enfría bien. Pero dura cinco minutos y se apaga. Luego vuelve a arrancar y otra vez. Como si no supiera en qué temperatura está la habitación.' },
            { text: '¿Y ese póster de Goku? Mola mucho', isHumor: true, playerLine: 'Mola el póster.', clientResponse: 'Es edición limitada, ¿eh? Me costó 40 pavos en Wallapop. Tengo el de Vegeta también pero está en el cuarto de mi compi.' },
            { text: '¿Hace mucho que pasa esto?', response: 'Desde ayer. Anteayer iba perfecto. No he tocado nada, ¿eh? Bueno, mi compi limpió la unidad de dentro con un trapo mojado, pero no creo que sea eso.' },
          ],
          eliminate: 'compresor',
        },
        {
          type: 'passive',
          text: 'Ah, y otra cosa. He mirado el mando y marca 24 grados, pero aquí hace mucho más calor que eso. El número que sale en la pantalla del split no tiene sentido.',
          eliminate: 'vent_ext',
        },
        {
          type: 'active',
          options: [
            { text: '¿La unidad de fuera hace ruido normal?', response: 'Sí, suena igual que siempre. El ventilador gira y todo.' },
            { text: '¿Has comprobado si los filtros están limpios?', response: 'No sé ni dónde están los filtros, tío. Pero el aire sale con fuerza, ¿eso no vale?' },
          ],
          eliminate: 'condensador',
        },
      ],
      consequence: {
        success: {
          narrative: 'El técnico localiza el sensor en la unidad interior. Está húmedo — el compañero de Óscar lo mojó al limpiar. Lo seca, lo recoloca, y el split estabiliza la temperatura en minutos.',
          clientText: 'Genial. Oye, ¿podéis iros ya? Que me entra la call en dos minutos.',
        },
        failure: {
          narrative: 'El técnico desmonta el {component}. Todo en orden. El split sigue apagándose solo. Hay que volver mañana con otra hipótesis.',
        },
      },
      eduCard: {
        component: 'Sensor / sonda',
        func: 'Mide la temperatura ambiente para que la placa controle el ciclo',
        symptom: 'El equipo se enciende y se apaga solo, o no responde al mando',
      },
    },

    // ─── CASO 3: Rosa — Compresor ───
    {
      client: {
        name: 'Rosa',
        subtitle: 'Panadera. Práctica y directa, vocabulario propio.',
        portrait: 'https://res.cloudinary.com/kampe/image/upload/v1773838691/rosa_bl1ndt.png',
        intro: 'Tercera visita. Rosa, Panadería La Espiga, Avda. del Parque 8. El aire no enfría.',
      },
      culprit: 'compresor',
      runnerUp: 'condensador',
      seniorHint: 'Piénsalo. Ha dicho que la de fuera no vibra y no se oye el arranque. ¿Qué pieza es la que arranca y vibra?',
      turns: [
        {
          type: 'passive',
          text: 'Oye, que la máquina del aire ha dejado de enfriar. El aparato de dentro sopla normal, pero el aire sale del tiempo. Y la caja de fuera no hace ese ruido de motor que hacía antes, está muda.',
          eliminate: 'vent_int',
        },
        {
          type: 'active',
          options: [
            { text: '¿Me puedo llevar un cruasán para luego?', isHumor: true, playerLine: '¿Me llevo un cruasán?', clientResponse: 'Coge dos, anda. Los de chocolate están de muerte. Y si arregláis el aire os pongo una bolsa de las buenas para llevar.' },
            { text: '¿La unidad de fuera vibra o está quieta?', response: 'Quieta, quieta. Antes temblaba un poco, se notaba que el motor ese gordo de dentro trabajaba. Ahora nada, como si estuviera apagada. Pero el piloto está encendido.' },
            { text: '¿El mando responde cuando tocas los botones?', response: 'Sí, el mando va bien. Le doy al botón y se enciende el aparato de dentro, sale aire, pero tibio.' },
          ],
          eliminate: 'sensor',
        },
        {
          type: 'passive',
          text: 'Y mira, antes la caja de fuera echaba aire caliente por detrás, ¿no? Pues ahora no echa nada. Ni caliente ni frío. El ventilador ese de fuera sí que gira, eso sí.',
          eliminate: 'vent_ext',
        },
        {
          type: 'active',
          options: [
            { text: '¿La unidad de dentro gotea o tiene escarcha?', response: 'No, está seca. Limpia. Yo la limpio todos los domingos que tengo la manía. Los filtros y todo.' },
            { text: '¿Ha notado algún olor raro?', response: 'No, oler no huele a nada raro. Solo que no enfría, vamos.' },
          ],
          eliminate: 'evaporador',
        },
      ],
      consequence: {
        success: {
          narrative: 'El técnico mide el compresor con la pinza amperimétrica: no consume. Compresor bloqueado. Lo anota para presupuesto de sustitución. Rosa asiente — al menos sabe qué pasa.',
          clientText: 'Bueno, al menos ya sé qué es. ¿Seguro que no queréis los cruasanes?',
        },
        failure: {
          narrative: 'El técnico revisa el {component}. Funciona perfectamente. Rosa os mira con cara de «os estoy pagando por hora». Hay que volver con otro diagnóstico.',
        },
      },
      eduCard: {
        component: 'Compresor',
        func: 'Comprime el refrigerante para que circule por el sistema',
        symptom: 'La unidad exterior no vibra y el aire sale sin enfriar',
      },
    },

    // ─── CASO 4: Sr. Herrera — Evaporador ───
    {
      client: {
        name: 'Sr. Herrera',
        subtitle: 'Administrador de finca. Cree que sabe más que tú.',
        portrait: 'https://res.cloudinary.com/kampe/image/upload/v1773838690/herrera_mvwhpm.png',
        intro: 'Cuarta visita. Sr. Herrera, Comunidad Pza. España 3. Administrador. Ya tiene su propio diagnóstico.',
      },
      culprit: 'evaporador',
      runnerUp: 'vent_int',
      seniorHint: null, // no senior help for case 4+
      turns: [
        {
          type: 'passive',
          text: 'Miren, yo creo que es el compresor. Mi cuñado tiene una empresa de aires y me ha dicho que cuando no enfría siempre es el compresor. Pero bueno, el caso es que enfría poco y sale poca fuerza de aire por dentro. La de fuera parece que va bien, el ventilador gira y todo.',
          eliminate: 'vent_ext',
        },
        {
          type: 'active',
          options: [
            { text: '¿Su cuñado no puede echarle un vistazo?', isHumor: true, playerLine: '¿Y su cuñado?', clientResponse: 'Hombre... es que ahora está con un tema de criptomonedas y no le pillo nunca. Pero sabe mucho, ¿eh? Lo que pasa es que cerró la empresa, pero por temas fiscales, no por incompetente.' },
            { text: '¿La unidad de fuera funciona normal?', response: 'Pues sí, la de fuera suena normal. Vibra, el ventilador gira, echa aire caliente por detrás. Todo como siempre.' },
            { text: '¿Ha mirado la unidad de dentro por dentro? ¿Tiene hielo o escarcha?', response: 'Pues ahora que lo dice... sí, tiene como una capa blanca. ¿Eso es hielo? Pensaba que era normal.' },
          ],
          eliminate: 'compresor',
        },
        {
          type: 'passive',
          text: 'Ahora que me fijo, sale aire pero muy flojito. Y por los lados de la tapa se ve esa capa de hielo. Antes salía con mucha más fuerza.',
          eliminate: 'condensador',
        },
        {
          type: 'active',
          options: [
            { text: '¿El equipo se enciende y se apaga solo, o funciona continuo?', response: 'No, funciona continuo. No se apaga. Pero enfría cada vez menos.' },
            { text: '¿Ha limpiado los filtros recientemente?', response: 'Los filtros... pues la verdad es que no. Mi cuñado dice que eso es un mito.' },
          ],
          eliminate: 'sensor',
        },
      ],
      consequence: {
        success: {
          narrative: 'El técnico abre la unidad interior. El evaporador está cubierto de hielo — los filtros sucios han reducido el flujo de aire y la serpentina se ha congelado. Limpieza de filtros + descongelado. En una hora, enfría como nuevo.',
          clientText: 'Entonces no era el compresor... Se lo voy a decir a mi cuñado.',
        },
        failure: {
          narrative: 'El técnico cambia el {component}. 150€ en mano de obra. Al día siguiente, Herrera llama: sigue con hielo y sin enfriar. Su cuñado opina que ahora sí que es el compresor.',
        },
      },
      eduCard: {
        component: 'Evaporador',
        func: 'Absorbe el calor del aire interior para enfriarlo',
        symptom: 'El aire sale con fuerza pero no enfría, o se forma hielo en la unidad interior',
      },
    },

    // ─── CASO 5: Nerea — Condensador ───
    {
      client: {
        name: 'Nerea',
        subtitle: 'Recién mudada. Primer split de su vida.',
        portrait: 'https://res.cloudinary.com/kampe/image/upload/v1773838689/nerea_tjn6ue.png',
        intro: 'Última visita. Nerea, C/ Luna 22, 5ºC. Recién mudada, primer split de su vida.',
      },
      culprit: 'condensador',
      runnerUp: 'evaporador',
      seniorHint: null,
      turns: [
        {
          type: 'passive',
          text: 'Perdona, es que no entiendo mucho de esto. El aire de dentro funciona, sale aire, pero cada vez enfría menos. Y la cosa de fuera echa aire pero no tan caliente como al principio. Como si se estuviera cansando.',
          eliminate: 'vent_int',
        },
        {
          type: 'active',
          options: [
            { text: '¿Nos recomienda algún sitio después para la hora de comer?', isHumor: true, playerLine: '¿Algún sitio para comer por aquí?', clientResponse: 'Pues el bar de abajo tiene unas croquetas increíbles. Bueno, solo he probado esas y las del chino de la esquina, pero las de abajo ganan seguro.' },
            { text: '¿La unidad de fuera vibra?', response: 'Sí, vibra. Se oye el motor y todo. Y el ventilador gira. Pero el aire que echa por detrás no quema como al principio. Los primeros días sí que quemaba.' },
            { text: '¿El equipo se enciende y apaga solo o funciona continuo?', response: 'No, funciona continuo. No se para. Es solo que cada vez enfría menos.' },
          ],
          eliminate: 'compresor',
        },
        {
          type: 'passive',
          text: 'Ah, una cosa. He mirado la cosa de fuera desde la ventana y tiene como pelusas y hojas pegadas por detrás. ¿Eso es normal? Es que está al lado de un árbol.',
          eliminate: 'vent_ext',
        },
        {
          type: 'active',
          options: [
            { text: '¿La unidad de dentro tiene hielo o gotea?', response: 'No, no tiene hielo. Está seca. Sale aire pero tibio. Como si no le quedara fuerza para enfriar del todo.' },
            { text: '¿El mando funciona bien?', response: 'Sí, el mando funciona. Le pongo 22 grados y se enciende y todo. Solo que no llega a esa temperatura.' },
          ],
          eliminate: 'sensor',
        },
      ],
      consequence: {
        success: {
          narrative: 'El técnico limpia las aletas del condensador — estaban bloqueadas con hojas y polvo del árbol. El intercambio de calor se recupera y el split enfría a pleno rendimiento en minutos.',
          clientText: '¡Ostras, era eso! ¿Y eso lo puedo hacer yo con una aspiradora o algo?',
        },
        failure: {
          narrative: 'El técnico revisa el {component}. Todo bien. El split sigue sin enfriar como debería. Las hojas siguen ahí, bloqueando las aletas. Hay que volver.',
        },
      },
      eduCard: {
        component: 'Condensador',
        func: 'Libera al exterior el calor que el refrigerante ha absorbido',
        symptom: 'La unidad exterior expulsa aire poco caliente y el equipo pierde rendimiento',
      },
    },
  ];

  // Component display names for results/narratives
  const COMP_NAMES = {
    compresor: 'Compresor',
    evaporador: 'Evaporador',
    condensador: 'Condensador',
    vent_int: 'Vent. interior',
    vent_ext: 'Vent. exterior',
    sensor: 'Sensor',
  };

  // ── Screen Management ──
  function showScreen(id) {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
    if (id === '#results') {
      document.documentElement.classList.remove('gameplay');
      document.documentElement.classList.add('results');
    } else {
      document.documentElement.classList.remove('results');
      document.documentElement.classList.add('gameplay');
    }
  }

  // ── UI Helpers ──
  // Paginated bubble: splits long text into chunks, tap to advance, calls onDone when finished
  let bubblePages = [];
  let bubblePageIndex = 0;
  let bubbleOnDone = null;
  let bubbleIsPlayer = false;

  function setBubble(text, isPlayer, onDone) {
    if (!text) {
      els.bubble.classList.add('hidden');
      return;
    }
    els.bubble.classList.remove('hidden');
    bubbleIsPlayer = !!isPlayer;
    // Split into pages at sentence boundaries (~120 chars per page)
    bubblePages = paginateText(text, 120);
    bubblePageIndex = 0;
    bubbleOnDone = onDone || null;
    showBubblePage();
  }

  function showBubblePage() {
    const b = els.bubble;
    b.classList.toggle('player', bubbleIsPlayer);
    const isLast = bubblePageIndex >= bubblePages.length - 1;
    const pageText = bubblePages[bubblePageIndex];
    if (isLast) {
      b.innerHTML = pageText;
    } else {
      b.innerHTML = pageText + '<span class="tap-hint">toca para continuar ▸</span>';
    }
    b.style.animation = 'none';
    void b.offsetHeight;
    b.style.animation = '';
  }

  function handleBubbleTap() {
    if (bubblePages.length === 0) return;
    if (bubblePageIndex < bubblePages.length - 1) {
      bubblePageIndex++;
      showBubblePage();
    } else if (bubbleOnDone) {
      const cb = bubbleOnDone;
      bubbleOnDone = null;
      cb();
    }
  }

  function paginateText(text, maxLen) {
    if (text.length <= maxLen) return [text];
    const pages = [];
    let remaining = text;
    while (remaining.length > maxLen) {
      // Find last sentence break within maxLen
      let cut = -1;
      for (let i = maxLen; i >= maxLen * 0.5; i--) {
        if (remaining[i] === '.' || remaining[i] === ',' || remaining[i] === '?' || remaining[i] === '!') {
          cut = i + 1;
          break;
        }
      }
      if (cut === -1) {
        // Fallback: break at last space
        cut = remaining.lastIndexOf(' ', maxLen);
        if (cut === -1) cut = maxLen;
      }
      pages.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining) pages.push(remaining);
    return pages;
  }

  const VISIT_LABELS = ['Primera visita', 'Segunda visita', 'Tercera visita', 'Cuarta visita', 'Última visita'];

  function showVisitTransition(c, onDone) {
    S.phase = 'transition';
    const label = VISIT_LABELS[S.currentCase];
    $('.transition-text').innerHTML = `${label}: ${c.client.name}<br><span style="font-size:13px;opacity:0.7;font-weight:400">${c.client.subtitle}</span>`;
    els.overlayTransition.classList.remove('hidden');

    const van = $('#van-img');
    van.style.animation = 'none';
    void van.offsetHeight;
    van.style.animation = 'vanSlide 2s linear forwards';

    setTimeout(() => {
      els.overlayTransition.classList.add('hidden');
      onDone();
    }, 2200);
  }

  function clearOptions() {
    els.options.innerHTML = '';
    els.optionsModal.classList.add('hidden');
  }

  function renderChips(options, onTap) {
    els.options.innerHTML = '';
    const c = CASES[S.currentCase];
    els.optionsModalTitle.textContent = `Escoge la pregunta a hacer a ${c.client.name}`;
    els.optionsModalSubtitle.classList.add('hidden');
    els.optionsModal.classList.remove('hidden');

    // Build full option list: turn options + unused humor from a previous turn
    const allOpts = [...options];
    if (S.unusedHumor && !options.some((o) => o.isHumor)) {
      allOpts.push(S.unusedHumor);
    }

    allOpts.forEach((opt, i) => {
      const chip = document.createElement('button');
      chip.className = 'option-chip';
      chip.textContent = opt.text;
      chip.style.animationDelay = `${i * 0.08}s`;
      if (opt.isHumor) chip.dataset.humor = '1';
      chip.addEventListener('click', () => onTap(opt, chip, allOpts));
      els.options.appendChild(chip);
    });
  }

  function fadeOtherChips(selectedChip) {
    els.options.querySelectorAll('.option-chip').forEach((c) => {
      if (c !== selectedChip) c.classList.add('fading');
    });
  }

  function showEliminationPrompt() {
    // Pulse active components
    $$('.comp-slot').forEach((slot) => {
      if (!slot.classList.contains('eliminated')) {
        slot.classList.add('pulse');
      }
    });

    // First elimination ever: show tutorial modal
    if (!S.tutorialShown) {
      S.tutorialShown = true;
      els.optionsModalTitle.textContent = 'Descarta un componente';
      els.optionsModalSubtitle.textContent = 'Según lo que ha dicho el cliente, hay componentes que puedes descartar. Toca en el esquema el que creas que NO es el problema.';
      els.optionsModalSubtitle.classList.remove('hidden');
      els.options.innerHTML = '';

      const btn = document.createElement('button');
      btn.className = 'btn-primary';
      btn.textContent = 'Entendido';
      btn.style.marginTop = '12px';
      btn.addEventListener('click', () => {
        clearOptions();
        S.phase = 'elimination';
        showHudAction('Descarta un componente');
      });
      els.options.appendChild(btn);
      els.optionsModal.classList.remove('hidden');
      return;
    }

    S.phase = 'elimination';
    showHudAction('Descarta un componente');
  }

  function showHudAction(text) {
    els.hudAction.textContent = text;
    els.hudAction.classList.remove('hidden');
    els.hudAction.style.animation = 'none';
    void els.hudAction.offsetHeight;
    els.hudAction.style.animation = '';
  }

  function hideEliminationPrompt() {
    els.hudAction.classList.add('hidden');
    $$('.comp-slot').forEach((s) => s.classList.remove('pulse'));
  }

  // ── Init ──
  function init() {
    $('#btn-start').addEventListener('click', startGame);
    $('#btn-retry').addEventListener('click', startGame);
    els.btnContinue.addEventListener('click', handleContinue);

    $$('.comp-slot').forEach((slot) => {
      slot.addEventListener('click', () => handleComponentTap(slot));
    });

    // Bubble tap to advance pages
    els.bubble.addEventListener('click', handleBubbleTap);
  }

  // ── Game Start ──
  function startGame() {
    S.currentCase = 0;
    S.caseResults = [];
    S.tutorialShown = false;
    showScreen('#play');
    startCase();
  }

  // ── Case Flow ──
  function startCase() {
    const c = CASES[S.currentCase];
    S.currentTurn = 0;
    S.phase = 'investigation';
    S.diagnosisChoice = null;
    S.diagnosisChoice = null;
    S.seniorUsed = false;
    S.eliminatedComponents = new Set();
    S.expectedElim = null;
    S.unusedHumor = null;

    // Reset schema
    $$('.comp-slot').forEach((slot) => {
      slot.classList.remove('eliminated', 'selected', 'pulse', 'blink-lemon');
    });

    // Update HUD
    els.hud.textContent = `Caso ${S.currentCase + 1}/5`;

    // Hide overlays
    els.overlayResult.classList.add('hidden');
    els.overlayTransition.classList.add('hidden');
    els.seniorHint.classList.add('hidden');
    hideEliminationPrompt();
    clearOptions();

    // Show client
    els.portrait.src = c.client.portrait;
    els.portrait.alt = c.client.name;
    els.bubble.innerHTML = '';
    els.bubble.classList.add('hidden');

    // Show van transition with visit info
    showVisitTransition(c, () => renderTurn());
  }

  // ── Turn Rendering ──
  function renderTurn() {
    const c = CASES[S.currentCase];
    const turn = c.turns[S.currentTurn];

    // If no more turns or already at 2 remaining, go to diagnosis
    if (!turn || S.eliminatedComponents.size >= 4) {
      startDiagnosis();
      return;
    }

    if (turn.type === 'passive') {
      // Show client dialogue with pagination
      if (turn.eliminate) {
        setBubble(turn.text, false, () => {
          S.expectedElim = turn.eliminate;
          showEliminationPrompt();
        });
      } else {
        setBubble(turn.text, false, () => {
          S.currentTurn++;
          renderTurn();
        });
      }
    } else if (turn.type === 'active') {
      // Show options modal
      S.phase = 'investigation';
      renderChips(turn.options, (opt, chip, allOpts) => handleOptionTap(opt, chip, allOpts, turn));
    }
  }

  function handleOptionTap(opt, chip, allOpts, turn) {
    if (S.phase !== 'investigation') return;
    S.phase = 'busy'; // prevent double-taps

    if (opt.isHumor) {
      // Humor consumed — clear it
      S.unusedHumor = null;
      chip.classList.add('selected');
      fadeOtherChips(chip);

      setTimeout(() => {
        els.optionsModal.classList.add('hidden');
        setBubble(opt.clientResponse, false, () => {
          // Re-render without humor option after player finishes reading
          S.phase = 'investigation';
          renderChips(allOpts.filter((o) => !o.isHumor), (o2, c2, a2) => handleOptionTap(o2, c2, a2, turn));
        });
      }, 300);
      return;
    }

    // Normal option — save unused humor for future turns
    const humorOpt = allOpts.find((o) => o.isHumor);
    if (humorOpt) S.unusedHumor = humorOpt;

    chip.classList.add('selected');
    fadeOtherChips(chip);

    setTimeout(() => {
      clearOptions();
      setBubble(opt.response);

      if (turn.eliminate) {
        S.expectedElim = turn.eliminate;
        setTimeout(() => showEliminationPrompt(), 800);
      } else {
        setTimeout(() => {
          S.currentTurn++;
          renderTurn();
        }, 1200);
      }
    }, 300);
  }

  // ── Component Tap (Elimination) ──
  function handleComponentTap(slot) {
    if (S.phase === 'diagnosis_component') {
      handleDiagnosisComponentTap(slot);
      return;
    }

    if (S.phase !== 'elimination') return;
    if (slot.classList.contains('eliminated')) return;

    const comp = slot.dataset.comp;
    const c = CASES[S.currentCase];

    if (comp === c.culprit) {
      // Trying to eliminate the actual culprit — this is wrong
      if (S.currentCase < 3 && !S.seniorUsed && c.seniorHint) {
        // Senior hint (cases 0-2 only, first wrong only)
        S.seniorUsed = true;
        showSeniorHint(c.seniorHint);
        slot.classList.add('blink-lemon');
        setTimeout(() => slot.classList.remove('blink-lemon'), 600);
      } else {
        // Silent failure — culprit eliminated, will lead to wrong diagnosis
        eliminateComponent(slot);
        S.expectedElim = null;
        S.currentTurn++;
        setTimeout(() => renderTurn(), 400);
      }
    } else {
      // Any non-culprit component is a valid elimination
      eliminateComponent(slot);
      S.expectedElim = null;
      S.currentTurn++;
      setTimeout(() => renderTurn(), 400);
    }
  }

  function eliminateComponent(slot) {
    slot.classList.add('eliminated');
    S.eliminatedComponents.add(slot.dataset.comp);
    hideEliminationPrompt();
  }

  function showSeniorHint(text) {
    els.seniorText.textContent = text;
    els.seniorHint.classList.remove('hidden');
    els.seniorHint.style.animation = 'none';
    void els.seniorHint.offsetHeight;
    els.seniorHint.style.animation = '';
    setTimeout(() => els.seniorHint.classList.add('hidden'), 6000);
  }

  // ── Diagnosis ──
  function removePendingHumorChip() {
    S.unusedHumor = null;
    const old = $('#play > .option-chip');
    if (old) old.remove();
  }

  function startDiagnosis() {
    S.diagnosisChoice = null;
    clearOptions();
    removePendingHumorChip();

    // Show diagnosis interstitial modal
    const c = CASES[S.currentCase];
    els.optionsModalTitle.textContent = 'Hora del diagnóstico';
    els.optionsModalSubtitle.textContent = `Has escuchado a ${c.client.name} y descartado componentes. ¿Cuál crees que está fallando?`;
    els.optionsModalSubtitle.classList.remove('hidden');
    els.options.innerHTML = '';

    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = 'Hacer diagnóstico';
    btn.style.marginTop = '12px';
    btn.addEventListener('click', () => {
      clearOptions();
      enterDiagnosisMode();
    });
    els.options.appendChild(btn);
    els.optionsModal.classList.remove('hidden');
  }

  function enterDiagnosisMode() {
    S.phase = 'diagnosis_component';

    // Pulse remaining components
    $$('.comp-slot').forEach((slot) => {
      if (!slot.classList.contains('eliminated')) {
        slot.classList.add('pulse');
      }
    });

    showHudAction('Toca el componente');

    // Hide bubble, keep portrait
    els.bubble.classList.add('hidden');
  }

  function handleDiagnosisComponentTap(slot) {
    if (slot.classList.contains('eliminated')) return;

    $$('.comp-slot').forEach((s) => s.classList.remove('selected', 'pulse'));
    slot.classList.add('selected');
    S.diagnosisChoice = slot.dataset.comp;

    els.hudAction.classList.add('hidden');
    els.bubble.classList.remove('hidden');

    const c = CASES[S.currentCase];
    const correct = S.diagnosisChoice === c.culprit;

    // Flash schema
    const frame = $('#schema-frame');
    frame.classList.add(correct ? 'flash-correct' : 'flash-error');
    setTimeout(() => frame.classList.remove('flash-correct', 'flash-error'), 400);

    setTimeout(() => showConsequence(correct), 500);
  }

  // ── Consequence ──
  function showConsequence(correct) {
    S.phase = 'consequence';
    S.caseResults.push(correct);

    const c = CASES[S.currentCase];
    const chosenName = COMP_NAMES[S.diagnosisChoice] || S.diagnosisChoice;

    if (correct) {
      // Show client reaction in the VN bubble
      setBubble(c.consequence.success.clientText);
      els.resultNarrative.textContent = c.consequence.success.narrative;
      els.resultClientBubble.classList.add('hidden');
      els.resultEduCard.classList.remove('error');
      els.resultEduCard.innerHTML = `<strong>${c.eduCard.component}</strong>: ${c.eduCard.func.charAt(0).toLowerCase() + c.eduCard.func.slice(1)}. Si falla, ${c.eduCard.symptom.toLowerCase()}.`;
      els.btnContinue.textContent = 'Siguiente';
    } else {
      const narrative = c.consequence.failure.narrative.replace('{component}', chosenName);
      // Show empty bubble (hidden by setBubble)
      setBubble('');
      els.resultNarrative.textContent = narrative;
      els.resultClientBubble.classList.add('hidden');
      els.resultEduCard.classList.add('error');
      els.resultEduCard.innerHTML = `Has elegido el <strong>${chosenName}</strong>, pero las pistas indicaban otra cosa. Repasa lo que dijo el cliente sobre la unidad interior y exterior.`;
      els.btnContinue.textContent = 'Entendido';
    }

    els.overlayResult.classList.remove('hidden');
    document.getElementById('vn-zone').classList.add('on-top');
  }

  function handleContinue() {
    els.overlayResult.classList.add('hidden');
    document.getElementById('vn-zone').classList.remove('on-top');

    if (S.currentCase >= 4) {
      showResults();
    } else {
      showTransition();
    }
  }

  // ── Transition ──
  function showTransition() {
    S.currentCase++;
    startCase();
  }

  // ── Results ──
  function showResults() {
    const solved = S.caseResults.filter(Boolean).length;

    if (solved > S.record) {
      S.record = solved;
      localStorage.setItem('el_sat_record', String(solved));
    }

    if (solved >= 3) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
      } catch (e) { /* not in RN */ }
    }

    const clientNames = ['Doña Carmen', 'Óscar', 'Rosa', 'Sr. Herrera', 'Nerea'];
    const components = ['Vent. exterior', 'Sensor', 'Compresor', 'Evaporador', 'Condensador'];
    let html = '';
    for (let i = 0; i < 5; i++) {
      const ok = S.caseResults[i];
      const icon = ok ? '✓' : '✗';
      const color = ok ? 'var(--lime)' : 'var(--rojo)';
      html += `<div class="results-row">
        <span>${clientNames[i]} — ${components[i]}</span>
        <span class="result-icon" style="color:${color}">${icon}</span>
      </div>`;
    }
    els.resultsSummary.innerHTML = html;
    els.resultsTotal.textContent = `${solved} de 5 diagnósticos correctos`;
    els.resultsRecord.textContent = `Récord: ${S.record}/5`;

    const messages = [
      'Cero de cinco. Antes de diagnosticar, necesitas dominar los 6 componentes del split.',
      'Uno de cinco. Vuelve a repasar qué hace cada componente y qué síntoma delata cada fallo.',
      'Dos de cinco. Necesitas más práctica con la función de cada componente.',
      'Tres de cinco. Aprobado. Repasa los componentes que fallaste.',
      'Cuatro de cinco. Muy buen turno, solo un diagnóstico se torció.',
      'Cinco de cinco. Si el SAT tuviera aprendices así, sobraría el cuñado.',
    ];
    els.resultsMessage.textContent = messages[solved];

    showScreen('#results');
  }

  // ── Boot ──
  init();
})();
