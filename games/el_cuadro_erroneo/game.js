/* ============================================
   El Cuadro Erroneo — Game Logic
   Narrativa: "La Queja de Yolanda"
   ============================================ */

(() => {
    'use strict';

    // --- Constants ---
    const RECORD_KEY = 'el_cuadro_erroneo_record';
    const TASK_THRESHOLD = 180;
    const TOTAL_LIVES = 5;

    const CLOUDINARY_BASE = 'https://res.cloudinary.com/kampe/image/upload/';
    const SALVA = {
        base: `${CLOUDINARY_BASE}v1771938594/salva_base_x8eghx.png`,
        happy: `${CLOUDINARY_BASE}v1771938597/salva_happy_ccjemp.png`,
        celebrating: `${CLOUDINARY_BASE}v1771938594/salva_celebrating_xki0p5.png`,
        worried: `${CLOUDINARY_BASE}v1771938598/salva_worried_glnc2b.png`
    };

    const YOLANDA = {
        enfadada: `${CLOUDINARY_BASE}yolanda_enfadada_ypcdsj.png`,
        contenta: `${CLOUDINARY_BASE}yolanda_contenta_yigsxu.png`
    };

    const COMP_IMG = {
        iga: `${CLOUDINARY_BASE}iga_gc2r1r.png`,
        id:  `${CLOUDINARY_BASE}id_h0k5cr.png`,
        pia: `${CLOUDINARY_BASE}v1772807187/PIA_umn2cw.png`
    };

    // --- State ---
    let score = 0;
    let lives = TOTAL_LIVES;
    let taskCompleted = false;
    let phaseData = {};

    // --- DOM ---
    const $ = (sel) => document.querySelector(sel);
    const gameArea = () => $('#game-area');

    // --- Helpers ---
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        $(id).classList.add('active');
        document.documentElement.classList.toggle('results', id === '#results');
    }

    function updateHUD() {
        const hearts = '❤️'.repeat(lives) + '🖤'.repeat(TOTAL_LIVES - lives);
        $('#hud-lives').textContent = hearts;
        // Score hidden during gameplay, shown only in results
    }

    function loseLife() {
        lives--;
        updateHUD();
        if (lives <= 0) {
            setTimeout(() => showResults(true), 600);
            return true;
        }
        return false;
    }

    function addScore(pts) {
        score += pts;
        updateHUD();
        if (!taskCompleted && score >= TASK_THRESHOLD) {
            taskCompleted = true;
            try { window.ReactNativeWebView?.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' })); } catch (e) {}
        }
    }

    function charRow(avatarSrc, text, type = 'salva', hideAvatar = false) {
        const bubbleClass = type === 'yolanda' ? 'yolanda-bubble' : '';
        const avatarClass = type === 'yolanda' ? 'yolanda' : 'salva';
        const avatarHTML = hideAvatar ? '' : `<div class="avatar avatar-sm ${avatarClass}"><img src="${avatarSrc}" alt="${type}"></div>`;
        return `<div class="char-row">
            ${avatarHTML}
            <div class="speech-bubble ${bubbleClass}"><p>${text}</p></div>
        </div>`;
    }

    // =========================================================
    //  Component image helper
    // =========================================================
    function getComponentImg(type) {
        return `<img src="${COMP_IMG[type] || COMP_IMG.pia}" alt="${type.toUpperCase()}" class="comp-img">`;
    }

    // =========================================================
    //  INTRO — La Queja de Yolanda
    // =========================================================
    const introSteps = [
        {
            render: () => `
                <h1 class="game-title">El Cuadro Erroneo</h1>
                <p class="game-subtitle">La queja de Yolanda</p>
                <img class="intro-av" src="${SALVA.base}" alt="Salva">
                <div class="intro-bub">Tenemos un problema. Una clienta ha llamado quejandose del cuadro que le monto un aprendiz. A ver que nos encontramos...</div>
                <button class="btn-primary" id="intro-next">Siguiente</button>
            `
        },
        {
            render: () => `
                <p class="game-subtitle" style="color:var(--lemon)">Yolanda — clienta</p>
                <img class="intro-av" src="${YOLANDA.enfadada}" alt="Yolanda">
                <div class="intro-bub yolanda-bub">¡Cada vez que salta algo no se que tocar! He abierto el cuadro y no entiendo NADA. ¿Que es un PIA? ¿Quien ha montado esto?</div>
                <button class="btn-primary" id="intro-next">Siguiente</button>
            `
        },
        {
            render: () => `
                <img class="intro-av" src="${SALVA.base}" alt="Salva" style="height:200px;width:auto;margin-bottom:-28px">
                <div class="intro-bub" style="text-align:left;font-size:14px">
                    <p style="margin-bottom:8px">Tranquila, Yolanda. Vamos a arreglar esto.</p>
                    <p>Y vosotros... vamos a aprender lo que el ultimo aprendiz no aprendio: <strong style="color:var(--turquesa)">orden, etiquetas</strong> y saber explicar <strong style="color:var(--turquesa)">que protege que</strong>.</p>
                </div>
                <p class="game-desc mt-8">Identifica los componentes, monta el carril DIN con orden logico, etiqueta todo, y explicaselo a Yolanda para que no vuelva a llamar.</p>
                <button class="btn-primary" id="intro-next">¡Vamos a arreglarlo!</button>
            `
        }
    ];

    function initIntro() {
        let step = 0;
        function renderStep() {
            const container = $('#intro-content');
            container.innerHTML = introSteps[step].render();
            container.querySelector('#intro-next').addEventListener('click', () => {
                step++;
                if (step >= introSteps.length) {
                    startGame();
                } else {
                    renderStep();
                }
            });
        }
        renderStep();
    }

    // =========================================================
    //  START GAME
    // =========================================================
    function startGame() {
        score = 0;
        lives = TOTAL_LIVES;
        taskCompleted = false;
        updateHUD();
        showScreen('#play');
        startPhase1();
    }

    // =========================================================
    //  PHASE 1 — "¿Que le han puesto?"
    // =========================================================
    const phase1Questions = [
        {
            question: '¿Que componente es este?',
            component: 'iga',
            options: ['ID', 'PIA', 'IGA'],
            correct: 2,
            feedback: 'Esto es el <strong>IGA</strong> — Interruptor General Automatico. Es el "jefe" del cuadro: corta TODO.'
        },
        {
            question: '¿Para que sirve el IGA?',
            component: 'iga',
            options: ['Proteger personas', 'Cortar toda la instalacion', 'Proteger un circuito'],
            correct: 1,
            feedback: 'El IGA corta toda la instalacion de golpe. Es la proteccion general.'
        },
        {
            question: '¿Que componente es este?',
            component: 'id',
            options: ['PIA', 'IGA', 'ID'],
            correct: 2,
            feedback: 'Esto es el <strong>ID</strong> — Interruptor Diferencial. Vigila las fugas de corriente para proteger a las <strong>PERSONAS</strong>.'
        },
        {
            question: '¿Que "vigila" el ID?',
            component: 'id',
            options: ['Sobrecargas', 'Fugas de corriente', 'Cortocircuitos'],
            correct: 1,
            feedback: 'El ID vigila las fugas de corriente. Si detecta una diferencia entre lo que entra y lo que sale, corta. Protege a las personas.'
        },
        {
            question: '¿Que componente es este?',
            component: 'pia',
            options: ['IGA', 'PIA', 'ID'],
            correct: 1,
            feedback: 'Esto es un <strong>PIA</strong> — Pequeno Interruptor Automatico. Cada PIA protege UN circuito (luces, enchufes, horno...).'
        },
        {
            question: '¿Que protege un PIA?',
            component: 'pia',
            options: ['Toda la instalacion', 'A las personas', 'Un circuito concreto'],
            correct: 2,
            feedback: 'Cada PIA protege un circuito concreto: alumbrado, enchufes, horno... Si salta, solo se va ese circuito.'
        }
    ];

    function startPhase1() {
        $('#hud-phase').textContent = '¿Que le han puesto?';
        phaseData = { idx: 0, bonus: 0 };
        showP1Question();
    }

    function showP1Question() {
        const i = phaseData.idx;
        if (i >= phase1Questions.length) { endPhase1(); return; }
        const q = phase1Questions[i];
        let errored = false;
        const area = gameArea();

        area.innerHTML = `
            ${charRow(SALVA.base, q.question)}
            <div class="component-display">${getComponentImg(q.component)}</div>
            <div class="options-grid">
                ${q.options.map((o, j) => `<button class="option-chip" data-i="${j}">${o}</button>`).join('')}
            </div>
            <p class="progress-text mt-6">${i + 1}/${phase1Questions.length}</p>
        `;

        area.querySelectorAll('.option-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const chosen = parseInt(btn.dataset.i);
                area.querySelectorAll('.option-chip').forEach(c => c.classList.add('disabled'));

                if (chosen === q.correct) {
                    btn.classList.add('correct');
                    addScore(errored ? 15 : 20);
                    if (!errored) phaseData.bonus++;
                    showFeedback(q.feedback, true, () => { phaseData.idx++; showP1Question(); });
                } else {
                    btn.classList.add('incorrect');
                    errored = true;
                    if (!loseLife()) {
                        showFeedback(q.feedback, false, () => { phaseData.idx++; showP1Question(); });
                    }
                }
            });
        });
    }

    function endPhase1() {
        if (phaseData.bonus === phase1Questions.length) addScore(30);
        showTransition(
            '¿Que le han puesto? — Completado',
            'Bien, los conoces. Pero el anterior aprendiz los puso de cualquier manera. Reordena el carril como un profesional.',
            startPhase2
        );
    }

    // =========================================================
    //  PHASE 2 — "Reordena el Carril"
    // =========================================================
    const dinComponents = [
        { id: 'iga', label: 'IGA', imgType: 'iga', slot: 0 },
        { id: 'id', label: 'ID', imgType: 'id', slot: 1 },
        { id: 'pia1', label: 'PIA Alumbrado', imgType: 'pia', isPIA: true },
        { id: 'pia2', label: 'PIA Enchufes', imgType: 'pia', isPIA: true },
        { id: 'pia3', label: 'PIA Horno', imgType: 'pia', isPIA: true }
    ];

    function startPhase2() {
        $('#hud-phase').textContent = 'Reordena el carril';
        phaseData = { placed: [], errors: 0 };

        const shuffled = [...dinComponents].sort(() => Math.random() - 0.5);
        const area = gameArea();

        area.innerHTML = `
            ${charRow(SALVA.base, 'Mira como lo dejo el compañero... ¡Es un desastre! Reordena el carril como un profesional.')}
            <div class="pieces-pool" id="pieces-pool">
                ${shuffled.map(c => `<div class="draggable-piece" data-id="${c.id}"><img src="${COMP_IMG[c.imgType]}" alt="${c.label}" class="piece-img"><span class="piece-label">${c.label}</span></div>`).join('')}
            </div>
            <div class="din-rail-container">
                <div class="din-rail" id="din-rail">
                    ${Array(5).fill(0).map((_, i) => `<div class="din-slot" data-slot="${i}"><span>${i + 1}</span></div>`).join('')}
                </div>
            </div>
            <p class="progress-text"><span id="placed-count">0</span>/5 colocados</p>
        `;

        setupDrag();
    }

    function setupDrag() {
        const area = gameArea();
        const pieces = area.querySelectorAll('.draggable-piece');
        const slots = area.querySelectorAll('.din-slot');
        let dragged = null, ghost = null;

        function touch(e) { return e.touches ? e.touches[0] : e; }

        function onStart(e) {
            e.preventDefault();
            const p = e.currentTarget;
            if (p.classList.contains('placed')) return;
            dragged = p;
            p.classList.add('dragging');
            ghost = p.cloneNode(true);
            ghost.classList.add('drag-ghost');
            ghost.classList.remove('dragging');
            document.body.appendChild(ghost);
            const t = touch(e);
            ghost.style.left = (t.clientX - 40) + 'px';
            ghost.style.top = (t.clientY - 20) + 'px';
            slots.forEach(s => { if (!s.classList.contains('filled')) s.classList.add('highlight'); });
        }

        function onMove(e) {
            if (!ghost) return;
            e.preventDefault();
            const t = touch(e);
            ghost.style.left = (t.clientX - 40) + 'px';
            ghost.style.top = (t.clientY - 20) + 'px';
        }

        function onEnd(e) {
            if (!dragged || !ghost) return;
            e.preventDefault();
            const t = e.changedTouches ? e.changedTouches[0] : e;
            ghost.remove(); ghost = null;
            slots.forEach(s => s.classList.remove('highlight'));

            const el = document.elementFromPoint(t.clientX, t.clientY);
            const slot = el?.closest('.din-slot');

            if (slot && !slot.classList.contains('filled')) {
                const si = parseInt(slot.dataset.slot);
                const comp = dinComponents.find(c => c.id === dragged.dataset.id);

                if (isCorrectSlot(comp, si)) {
                    slot.classList.add('filled');
                    slot.innerHTML = `<div class="slot-component"><img src="${COMP_IMG[comp.imgType]}" alt="${comp.label}" class="slot-img"><span>${comp.label}</span></div>`;
                    dragged.classList.add('placed');
                    phaseData.placed.push(comp.id);
                    addScore(20);
                    area.querySelector('#placed-count').textContent = phaseData.placed.length;

                    const fb = {
                        iga: 'Bien. El IGA va primero — es el jefe del cuadro. Si Yolanda necesita cortar todo, sabe donde ir.',
                        id: 'Correcto. El ID va justo despues del IGA. Es lo que protege a Yolanda de verdad.',
                    };
                    updateBubble(area, SALVA.happy, fb[comp.id] || 'Eso es. Los PIAs van despues de las protecciones generales. Cada uno cuida un circuito.');

                    if (phaseData.placed.length === 5) setTimeout(endPhase2, 800);
                } else {
                    phaseData.errors++;
                    dragged.classList.remove('dragging');
                    dragged.style.animation = 'shake 0.4s ease';
                    setTimeout(() => { dragged.style.animation = ''; }, 400);

                    let msg = 'No va ahi. Piensa: primero IGA, luego ID, luego PIAs. Por eso Yolanda no entendia nada.';
                    if (comp.id === 'iga' && si > 0) msg = 'El IGA va ANTES de todo. Es la proteccion general.';
                    else if (comp.id === 'id' && si === 0) msg = 'El ID va despues del IGA, no en su puesto.';
                    else if (comp.isPIA && si < 2) msg = 'Los PIAs van DESPUES del ID. Primero las protecciones, luego los circuitos.';

                    if (!loseLife()) updateBubble(area, SALVA.worried, msg);
                    dragged = null;
                    return;
                }
            }
            if (dragged) dragged.classList.remove('dragging');
            dragged = null;
        }

        pieces.forEach(p => {
            p.addEventListener('touchstart', onStart, { passive: false });
            p.addEventListener('mousedown', onStart);
        });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mouseup', onEnd);
    }

    function isCorrectSlot(comp, si) {
        if (comp.id === 'iga') return si === 0;
        if (comp.id === 'id') return si === 1;
        if (comp.isPIA) return si >= 2;
        return false;
    }

    function endPhase2() {
        if (phaseData.errors === 0) addScore(30);
        showTransition(
            'Carril ordenado',
            'Carril ordenado. Pero el compañero no puso NI UNA etiqueta. Normal que Yolanda no entendia nada. Etiqueta tu.',
            startPhase3
        );
    }

    // =========================================================
    //  PHASE 3 — "Etiqueta como un profesional"
    // =========================================================
    const labelData = [
        { component: 'IGA', imgType: 'iga', correct: 'IGA', distractors: ['ID', 'PIA', 'General'] },
        { component: 'ID', imgType: 'id', correct: 'ID', distractors: ['IGA', 'Dif', 'PIA'] },
        { component: 'PIA 1', imgType: 'pia', correct: 'PIA 1 — Alumbrado', distractors: ['PIA 1 — Enchufes', 'PIA 2 — Alumbrado', 'IGA'] },
        { component: 'PIA 2', imgType: 'pia', correct: 'PIA 2 — Enchufes', distractors: ['PIA 1 — Enchufes', 'PIA 3 — Enchufes', 'ID'] },
        { component: 'PIA 3', imgType: 'pia', correct: 'PIA 3 — Horno', distractors: ['PIA 2 — Horno', 'PIA 3 — Enchufes', 'IGA'] }
    ];

    function startPhase3() {
        $('#hud-phase').textContent = 'Etiqueta';
        phaseData = { idx: 0, errors: 0 };
        showP3Label();
    }

    function showP3Label() {
        const i = phaseData.idx;
        if (i >= labelData.length) { endPhase3(); return; }
        const l = labelData[i];
        const opts = [l.correct, ...l.distractors.slice(0, 2)].sort(() => Math.random() - 0.5);
        const area = gameArea();

        const slotsHTML = labelData.map((ld, j) => {
            const labeled = j < i;
            const current = j === i;
            return `<div class="din-labeled-slot">
                <div class="component-box ${current ? 'active' : ''}"><img src="${COMP_IMG[ld.imgType]}" alt="${ld.component}" class="label-comp-img"></div>
                <div class="label-box ${labeled ? 'labeled' : ''}">${labeled ? ld.correct : '?'}</div>
            </div>`;
        }).join('');

        area.innerHTML = `
            ${charRow(SALVA.base, `El compañero no puso ni una etiqueta. Etiqueta: <strong>${l.component}</strong>. Grande, legible, consistente.`)}
            <div class="din-labeled">${slotsHTML}</div>
            <p class="progress-text mt-6">Selecciona la etiqueta correcta:</p>
            <div class="label-selector">
                ${opts.map(o => `<button class="label-option" data-label="${o}">${o}</button>`).join('')}
            </div>
            <p class="progress-text mt-6">${i + 1}/${labelData.length}</p>
        `;

        area.querySelectorAll('.label-option').forEach(btn => {
            btn.addEventListener('click', () => {
                area.querySelectorAll('.label-option').forEach(b => b.style.pointerEvents = 'none');

                if (btn.dataset.label === l.correct) {
                    btn.classList.add('correct');
                    addScore(15);
                    setTimeout(() => { phaseData.idx++; showP3Label(); }, 500);
                } else {
                    btn.classList.add('incorrect');
                    phaseData.errors++;
                    let msg = l.component === 'IGA' || l.component === 'ID'
                        ? 'No. El IGA es el general, el ID es el diferencial. Si los confundes en la etiqueta, imaginate Yolanda.'
                        : 'Cada PIA protege un circuito. Si la etiqueta dice "Enchufes" pero es el de alumbrado, Yolanda toca el que no es.';
                    if (!loseLife()) {
                        showFeedback(msg, false, () => { phaseData.idx++; showP3Label(); });
                    }
                }
            });
        });
    }

    function endPhase3() {
        if (phaseData.errors === 0) addScore(25);
        showTransition(
            'Cuadro etiquetado',
            'Bien etiquetado. Ahora vamos a montar una infografia para que Yolanda entienda que hace cada parte.',
            startPhase4
        );
    }

    // =========================================================
    //  PHASE 4 — "Infografia: ¿Que hace cada uno?"
    // =========================================================
    const infoDefs = [
        { id: 'iga', title: 'IGA', subtitle: 'Interruptor General Automatico', desc: 'Al superar la potencia de tu instalacion, corta el suministro electrico.' },
        { id: 'id',  title: 'ID',  subtitle: 'Interruptor Diferencial', desc: 'Interrumpe la electricidad si se producen fugas en la corriente. Protege a las personas.' },
        { id: 'pia', title: 'PIA', subtitle: 'Pequenos Interruptores Automaticos', desc: 'Controlan por separado la electricidad de cada equipo electrico (enchufes, luces, horno...).' }
    ];

    // Distractores que suenan parecidos pero son incorrectos
    const infoDistractors = {
        iga: [
            'Protege a las personas detectando fugas de corriente a tierra.',
            'Controla individualmente cada circuito de la vivienda.'
        ],
        id: [
            'Corta toda la instalacion cuando se supera la potencia contratada.',
            'Protege un solo circuito contra sobrecargas y cortocircuitos.'
        ],
        pia: [
            'Detecta fugas de corriente y desconecta para proteger a las personas.',
            'Corta todo el suministro electrico de la vivienda de golpe.'
        ]
    };

    function startPhase4() {
        $('#hud-phase').textContent = 'Infografia';
        phaseData = { idx: 0, errors: 0 };
        showInfoStep();
    }

    function showInfoStep() {
        const i = phaseData.idx;
        if (i >= infoDefs.length) { endPhase4(); return; }
        const def = infoDefs[i];
        const area = gameArea();

        // Build rows: asset left, definition right (or pending)
        const rowsHTML = infoDefs.map((d, j) => {
            const done = j < i;
            const current = j === i;
            return `<div class="info-row ${current ? 'info-active' : ''} ${done ? 'info-done' : ''}">
                <div class="info-row-left">
                    <img src="${COMP_IMG[d.id]}" alt="${d.title}" class="info-row-img">
                    <div class="info-row-title">${d.title}</div>
                </div>
                <div class="info-row-right" id="info-box-${d.id}">${done ? d.desc : '???'}</div>
            </div>`;
        }).join('');

        // Build options: correct + 2 distractors, shuffled
        const opts = [
            { text: def.desc, correct: true },
            { text: infoDistractors[def.id][0], correct: false },
            { text: infoDistractors[def.id][1], correct: false }
        ].sort(() => Math.random() - 0.5);

        area.innerHTML = `
            ${charRow(SALVA.base, `¿Que hace el <strong>${def.title}</strong>? Selecciona la definicion correcta.`)}
            <div class="info-grid">${rowsHTML}</div>
            <div class="info-options">
                ${opts.map((o, j) => `<button class="info-opt" data-correct="${o.correct}" data-i="${j}">${o.text}</button>`).join('')}
            </div>
            <p class="progress-text mt-6">${i + 1}/${infoDefs.length}</p>
        `;

        area.querySelectorAll('.info-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                area.querySelectorAll('.info-opt').forEach(b => b.style.pointerEvents = 'none');

                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                    addScore(20);
                    const box = area.querySelector(`#info-box-${def.id}`);
                    if (box) box.textContent = def.desc;
                    setTimeout(() => { phaseData.idx++; showInfoStep(); }, 600);
                } else {
                    btn.classList.add('incorrect');
                    phaseData.errors++;
                    const fbMsgs = {
                        iga: 'El IGA es el general: corta TODA la instalacion si se supera la potencia. No protege personas ni circuitos individuales.',
                        id: 'El ID detecta FUGAS de corriente — protege a las personas. No corta por potencia ni por circuitos.',
                        pia: 'Los PIAs protegen circuitos INDIVIDUALES (enchufes, luces...). No detectan fugas ni cortan todo.'
                    };
                    if (!loseLife()) {
                        showFeedback(fbMsgs[def.id], false, () => showInfoStep());
                    }
                }
            });
        });
    }

    function endPhase4() {
        if (phaseData.errors === 0) addScore(25);
        // Show completed infographic before moving on
        const area = gameArea();
        const rowsHTML = infoDefs.map(d => `<div class="info-row info-done">
            <div class="info-row-left">
                <img src="${COMP_IMG[d.id]}" alt="${d.title}" class="info-row-img">
                <div class="info-row-title">${d.title}</div>
                <div class="info-row-sub">${d.subtitle}</div>
            </div>
            <div class="info-row-right">${d.desc}</div>
        </div>`).join('');

        area.innerHTML = `
            <div class="phase-transition">
                <h2>Infografia completa</h2>
                <div class="info-grid info-final">${rowsHTML}</div>
                ${charRow(SALVA.happy, 'Asi se entiende. Ahora Yolanda tiene que verlo claro. Vamos a comprobarlo.')}
                <button class="btn-primary" id="btn-next">Siguiente</button>
            </div>
        `;
        area.querySelector('#btn-next').addEventListener('click', startPhase5);
    }

    // =========================================================
    //  PHASE 5 — "Explicaselo a Yolanda"
    // =========================================================
    const quizQuestions = [
        {
            yolanda: 'Se me ha ido la luz en TODA la casa. ¿Que ha saltado?',
            options: ['Un PIA', 'El ID', 'El IGA'],
            correct: 2,
            feedback: 'Si se va TODO, es el IGA. Es la proteccion general. Le dices a Yolanda: "Sube el IGA, el grande de la izquierda."'
        },
        {
            yolanda: 'Solo se me han apagado las luces, pero los enchufes van bien. ¿Que toco?',
            options: ['El IGA', 'El PIA de alumbrado', 'El ID'],
            correct: 1,
            feedback: 'Si solo se va un circuito, es su PIA. Le dices: "Busca el PIA que pone Alumbrado y subelo." Por eso las etiquetas importan.'
        },
        {
            yolanda: '¿Por que hay tantos cachivaches y no solo uno gordo que corte todo?',
            options: ['Para gastar mas dinero', 'Porque cada uno protege una cosa distinta', 'Porque queda mas profesional'],
            correct: 1,
            feedback: 'El IGA corta todo, el ID protege personas, cada PIA protege un circuito. Si solo hubiera uno, cada vez que saltara se iria toda la casa.'
        },
        {
            yolanda: 'Mi vecina dice que el ID es el mas importante. ¿Es verdad?',
            options: ['No, el IGA es mas importante', 'Si, porque protege a las personas', 'No, los PIAs son mas importantes'],
            correct: 1,
            feedback: 'El ID detecta fugas de corriente — si la corriente se escapa por donde no debe (por ejemplo, a traves de una persona), el ID corta. Los demas protegen cables y aparatos, pero el ID te protege A TI.'
        },
        {
            yolanda: '¿Y si no hubiera etiquetas, que pasa?',
            options: ['Nada, basta con saber de memoria', 'No sabes que ha saltado ni que circuito protege cada uno', 'Solo es un problema estetico'],
            correct: 1,
            feedback: 'Sin etiquetas, Yolanda abre el cuadro y no sabe que PIA subir. Pierde tiempo, se frustra, y nos llama. Las etiquetas son para que CUALQUIERA entienda el cuadro.'
        }
    ];

    function startPhase5() {
        $('#hud-phase').textContent = 'Explicaselo a Yolanda';
        phaseData = { idx: 0 };
        showP5Question();
    }

    function showP5Question() {
        const i = phaseData.idx;
        if (i >= quizQuestions.length) { showResults(false); return; }
        const q = quizQuestions[i];
        const area = gameArea();

        area.innerHTML = `
            <img class="quiz-yolanda" src="${YOLANDA.enfadada}" alt="Yolanda">
            <div class="quiz-bub">${q.yolanda}</div>
            <div class="options-grid mt-8">
                ${q.options.map((o, j) => `<button class="option-chip" data-i="${j}">${o}</button>`).join('')}
            </div>
            <p class="progress-text mt-8">${i + 1}/${quizQuestions.length}</p>
        `;

        area.querySelectorAll('.option-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const chosen = parseInt(btn.dataset.i);
                area.querySelectorAll('.option-chip').forEach(c => c.classList.add('disabled'));

                if (chosen === q.correct) {
                    btn.classList.add('correct');
                    addScore(20);
                    showFeedback(q.feedback, true, () => { phaseData.idx++; showP5Question(); }, SALVA.happy);
                } else {
                    btn.classList.add('incorrect');
                    if (!loseLife()) {
                        showFeedback(q.feedback, false, () => { phaseData.idx++; showP5Question(); }, SALVA.worried);
                    }
                }
            });
        });
    }

    // =========================================================
    //  Shared UI
    // =========================================================
    function showFeedback(text, success, onDismiss, avatar) {
        const av = avatar || (success ? SALVA.happy : SALVA.worried);
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay';
        overlay.innerHTML = `
            <div class="feedback-card ${success ? 'success' : 'error'}">
                <img class="fb-av" src="${av}" alt="Salva">
                <div class="fb-bub"><p>${text}</p></div>
                <button class="btn-primary mt-8" id="fb-dismiss">Entendido</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#fb-dismiss').addEventListener('click', () => {
            overlay.remove();
            if (onDismiss) onDismiss();
        });
    }

    function showTransition(title, message, onNext) {
        const area = gameArea();
        area.innerHTML = `
            <div class="phase-transition">
                <h2>${title}</h2>
                <img class="intro-av" src="${SALVA.happy}" alt="Salva" style="height:180px;width:auto;margin-bottom:-28px">
                <div class="intro-bub" style="font-size:14px">${message}</div>
                <button class="btn-primary" id="btn-next">Siguiente</button>
            </div>
        `;
        area.querySelector('#btn-next').addEventListener('click', onNext);
    }

    function updateBubble(area, avatarSrc, text) {
        const row = area.querySelector('.char-row');
        if (row) {
            row.querySelector('img').src = avatarSrc;
            row.querySelector('.speech-bubble p').innerHTML = text;
        }
    }

    // =========================================================
    //  RESULTS
    // =========================================================
    function showResults(isGameOver) {
        showScreen('#results');

        const record = parseInt(localStorage.getItem(RECORD_KEY) || '0');
        const newRecord = Math.max(record, score);
        localStorage.setItem(RECORD_KEY, newRecord);

        let salvaMsg, salvaAv, yolandaMsg, yolandaAv;

        if (isGameOver) {
            salvaMsg = 'Demasiados errores. Yolanda ha pedido otro electricista. Vuelve a estudiar y prueba otra vez.';
            salvaAv = SALVA.worried;
            yolandaMsg = 'Sigo sin enterarme. ¿No hay nadie en esta empresa que sepa explicar las cosas?';
            yolandaAv = YOLANDA.enfadada;
        } else if (score >= 350) {
            salvaMsg = 'Yolanda ha quedado encantada. Si todos trabajaran asi, no tendriamos quejas.';
            salvaAv = SALVA.celebrating;
            yolandaMsg = '¡Por fin! Ahora si que lo entiendo. Gracias, ¿eh? El otro chaval no tenia ni idea.';
            yolandaAv = YOLANDA.contenta;
        } else if (score >= TASK_THRESHOLD) {
            salvaMsg = 'Yolanda ya entiende su cuadro. No esta mal, pero repasa — que no queremos mas llamadas.';
            salvaAv = SALVA.happy;
            yolandaMsg = 'Bueno, ya entiendo algo mas. Pero como me vuelva a pasar, os llamo otra vez.';
            yolandaAv = YOLANDA.contenta;
        } else {
            salvaMsg = 'Yolanda sigue sin entenderlo. Hay que repasar IGA, ID y PIAs hasta que lo expliques dormido.';
            salvaAv = SALVA.worried;
            yolandaMsg = 'Sigo sin enterarme. ¿No hay nadie en esta empresa que sepa explicar las cosas?';
            yolandaAv = YOLANDA.enfadada;
        }

        const container = $('#results-content');
        container.innerHTML = `
            <div class="res-row">
                <img class="res-char" src="${yolandaAv}" alt="Yolanda">
                <div class="res-bubble yolanda-msg">${yolandaMsg}</div>
            </div>
            <div class="res-row res-row-reverse">
                <img class="res-char" src="${salvaAv}" alt="Salva">
                <div class="res-bubble">${salvaMsg}</div>
            </div>
            <div class="results-card">
                <h2>Resultado</h2>
                <div class="results-score">
                    <span class="label">Puntuacion</span>
                    <span class="value">${score}</span>
                </div>
                <div class="results-record">
                    <span class="label">Record</span>
                    <span class="value">${newRecord}</span>
                </div>
            </div>
            ${score >= TASK_THRESHOLD ? '<p class="completed-text">¡COMPLETADO!</p>' : ''}
            <button class="btn-primary" id="btn-replay">Repetir</button>
        `;
        container.querySelector('#btn-replay').addEventListener('click', () => location.reload());
    }

    // --- Boot ---
    initIntro();

})();
