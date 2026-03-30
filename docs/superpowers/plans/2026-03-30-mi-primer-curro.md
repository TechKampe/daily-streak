# Mi Primer Curro [SIMULADOR] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Roblox-styled conversational adventure game where the player explores a street, talks to NPCs, finds job offers, and evaluates them — teaching employability skills for trade apprentices.

**Architecture:** Single-page vanilla HTML5 app (no framework). Three files: `index.html` (structure, already scaffolded), `style.css` (Roblox palette, already scaffolded), `game.js` (all logic). The game is data-driven: two zone data objects (urban/rural) contain all locations, NPCs, dialogues, offers, and chat overlay messages. The game engine reads from these data objects to render locations, drive conversations, and evaluate outcomes. Assets (character PNGs, scene JPGs) are provided separately by the user and placed in `assets/`.

**Tech Stack:** Vanilla HTML5/CSS3/JS. No build tools, no npm, no framework. Google Fonts (Fredoka + Nunito). Runs in React Native WebView.

**Reference GDD:** `GDDs/GDD_MI_PRIMER_CURRO.md`

**Existing scaffolding:** `games/mi_primer_curro/index.html`, `style.css`, `game.js` — all have basic structure. The implementation completes the TODO placeholders in game.js and adds missing CSS.

---

## File Structure

All work happens in `games/mi_primer_curro/`:

| File | Responsibility | Status |
|------|---------------|--------|
| `index.html` | Screen structure, overlays, all DOM elements | Scaffolded — minor tweaks needed |
| `style.css` | Roblox palette, all component styles, animations | Scaffolded — additions needed for phone UI mockups and secondary NPC tappable areas |
| `game.js` | All game logic: state, data, dialogue engine, scoring, results | Scaffolded — bulk of implementation needed |
| `assets/` | Character PNGs + scene JPGs | Empty — user provides these separately |

The JS is intentionally kept in a single file (following existing Kampe game conventions). It's organized into sections:
1. Helpers (vibrate, $, screen/overlay management)
2. Content data (zones, locations, NPCs, offers, chat messages, badges)
3. State
4. Chat overlay system
5. Street overview (markers, avatar movement)
6. Location engine (dialogue, choices, NPC interactions)
7. Offer evaluation
8. Scoring + badges
9. Results screen
10. Init + event wiring

---

## Task 1: Content Data Structures

**Files:**
- Modify: `games/mi_primer_curro/game.js` (top of file, after existing helpers)

This task defines ALL game content as data. No rendering logic yet — pure data.

- [ ] **Step 1: Define zone configuration**

Add after the `AMBIENT_MESSAGES` array in game.js:

```javascript
// === ZONE-SPECIFIC AMBIENT MESSAGES ===
const ZONE_AMBIENT = {
  urban: [
    { user: 'ElectricistaPRO_99', text: 'en Valencia hay bastante movimiento en portales' },
    { user: 'InstaladorJefe', text: 'las ETTs de ciudad tienen más ofertas de industria' },
    { user: 'ChispaVolt', text: 'aquí hay muchas empresas medianas, eso es bueno' },
  ],
  rural: [
    { user: 'CableMan420', text: 'en pueblo el boca a boca es lo que funciona' },
    { user: 'InstaladorJefe', text: 'aquí las ETTs provinciales conocen a todos' },
    { user: 'ElectricistaPRO_99', text: 'no te fíes de los portales en zona rural, busca de otra forma' },
  ],
};

// === CHARACTER CONFIG ===
const CHARACTERS = {
  urban: {
    name: 'Nico',
    happy: 'assets/nico_happy.png',
    celebrating: 'assets/nico_celebrating.png',
    worried: 'assets/nico_worried.png',
    introMsg: 'Bueno, es martes. Hoy busco curro de verdad. Vamos a ver qué hay por aquí.',
  },
  rural: {
    name: 'Vega',
    happy: 'assets/vega_happy.png',
    celebrating: 'assets/vega_celebrating.png',
    worried: 'assets/vega_worried.png',
    introMsg: 'Venga, hoy toca moverse. A ver qué encuentro por el pueblo.',
  },
};

// === STREET BACKGROUNDS ===
const STREET_BG = {
  urban: 'assets/bg_street_urban.jpg',
  rural: 'assets/bg_street_rural.jpg',
};
```

- [ ] **Step 2: Define location data for urban zone**

```javascript
// === LOCATION DATA ===
// Each location has: id, label, position (% from top-left for marker),
// bg (scene image), isDeadEnd, interactions (main NPC + secondary NPCs),
// offer (if findable), and chat messages per outcome.

const LOCATIONS = {
  urban: [
    {
      id: 'ett',
      label: 'ETT',
      pos: { top: 25, left: 20 },
      scale: 0.7,
      bg: 'assets/bg_ett_urban.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: 'Buenos días. ¿Vienes a registrarte?',
        choices: [
          {
            text: 'Busco trabajo de lo que sea',
            correct: false,
            kampePitch: false,
            npcResponse: 'Vale, rellena este formulario y ya te llamaremos.',
            chatMsg: { user: 'InstaladorJefe', text: '"de lo que sea" es lo peor que puedes decir en una ETT' },
            offersOffer: false,
          },
          {
            text: 'Soy electricista, busco trabajo en instalaciones. Tengo prácticas verificadas',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Verificadas? Eso no me lo dicen mucho. A ver, déjame mirar en el sistema...',
            chatMsg: { user: 'ChispaVolt', text: 'ha reaccionado diferente cuando has dicho lo del portfolio' },
            offersOffer: true,
          },
          {
            text: 'Soy electricista, busco trabajo en instalaciones',
            correct: true,
            kampePitch: false,
            npcResponse: 'Ok, electricista. Tenemos una cosa abierta, déjame ver...',
            chatMsg: { user: 'ElectricistaPRO_99', text: 'bien, pero te ha faltado mencionar tu portfolio, eso diferencia' },
            offersOffer: true,
          },
        ],
      },
      secondary: [
        {
          id: 'painter',
          tappableArea: { top: 60, left: 10, width: 25, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Tú también vienes a lo de RandStaff?',
              choices: [
                { text: 'Sí, a lo de electricidad', response: 'Ah, electricidad. A mí me han dicho que para pintores ahora mismo no hay mucho, pero para vosotros hay movimiento. He visto a dos pasar antes de ti preguntando lo mismo.' },
                { text: 'Estoy mirando qué hay', response: 'Yo llevo una hora. Me han dicho que espere. Creo que depende del sector, los de industria van más rápido. ¿Tú de qué vas?' },
              ],
              chatMsg: { user: 'TuboMaster_3000', text: 'este tío lleva ahí un rato, pide cita la próxima vez' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante de electricista',
        company: 'RandStaff — para empresa cliente',
        type: 'Empresa grande (a través de ETT)',
        requirements: [
          { text: 'Formación en electricidad', met: true },
          { text: 'Disponibilidad inmediata', met: true },
          { text: 'Vehículo propio', met: false },
          { text: 'Mayor de 18', met: true },
        ],
        matchPct: 75,
        correctDecision: 'apply',
      },
    },
    {
      id: 'taller',
      label: 'Taller',
      pos: { top: 25, left: 65 },
      scale: 0.7,
      bg: 'assets/bg_taller_urban.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null, // NPC doesn't speak first
        choices: [
          {
            text: '¿Está el jefe?',
            correct: false,
            kampePitch: false,
            npcResponse: 'Soy yo. ¿Y tú eres...?',
            chatMsg: { user: 'InstaladorJefe', text: 'nunca preguntes por "el jefe" cuando es empresa pequeña, preséntate directo' },
            offersOffer: false,
          },
          {
            text: 'Buenos días, soy electricista, busco trabajo. Tengo portfolio de prácticas verificadas, te lo puedo enseñar',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Portfolio? Eso es nuevo. A ver.',
            chatMsg: { user: 'CableMan420', text: 'le has pillado la atención, eso no se lo dice nadie' },
            offersOffer: true,
          },
          {
            text: 'Buenos días, ¿necesitáis ayuda? Soy electricista',
            correct: true,
            kampePitch: false,
            npcResponse: 'Ahora mismo no busco a nadie, pero déjame el teléfono.',
            chatMsg: { user: 'ChispaVolt', text: 'no está mal, pero podías haber mostrado algo que te diferencie' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'apprentice',
          tappableArea: { top: 50, left: 65, width: 25, height: 35 },
          exchanges: [
            {
              npcBubble: 'Ey, ¿vienes a preguntar por curro?',
              choices: [
                { text: 'Sí, ¿sabes si cogen a alguien?', response: 'El jefe dice que no, pero siempre dice que no. Yo vine tres veces hasta que me dijo que sí. Eso sí, anda, ¿tú haces el BootKämp? Mi prima Nerea también lo está haciendo.' },
                { text: '¿Tú trabajas aquí?', response: 'Desde hace cuatro meses. Empecé como tú, buscando por ahí. Al final llamé a la puerta directamente. Si entras, háblale claro, que es buen tío pero no le gusta que le mareen.' },
              ],
              chatMsg: { user: 'xX_Rookie_Xx', text: 'tres veces fue, yo me habría rajado a la segunda' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante instalador — obra nueva',
        company: 'Instalaciones López',
        type: 'Empresa mediana local',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Experiencia 1 año', met: false },
          { text: 'Trabajo en altura', met: false },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 40,
        correctDecision: 'pass',
      },
    },
    {
      id: 'bar',
      label: 'Bar',
      pos: { top: 45, left: 45 },
      scale: 0.8,
      bg: 'assets/bg_bar_urban.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: 'Perdona, he visto el logo de tu polo. ¿Trabajas en instalaciones?',
            correct: true,
            kampePitch: false,
            npcResponse: 'Sí, en Electrovall. ¿Por qué? ... Anda, pues justo estaban buscando un ayudante. Dile a mi jefe que te manda Carlos.',
            chatMsg: { user: 'InstaladorJefe', text: 'la red local es oro, fíjate en los detalles' },
            offersOffer: true,
          },
          {
            text: 'Sentarte y mirar el móvil',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'xX_Rookie_Xx', text: 'tienes a un tío con polo de empresa eléctrica a 2 metros y miras el movil' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'barista',
          tappableArea: { top: 20, left: 10, width: 30, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Qué te pongo?',
              choices: [
                { text: 'Un café, por favor', response: 'Marchando. ¿Eres del barrio? No te había visto. ... Ah, pues mira, ese de ahí del polo trabaja en una empresa de instalaciones. Lleva aquí todas las mañanas. No es mala persona, pero hay que pillarle antes del segundo café.' },
                { text: 'Nada, solo vengo a preguntar una cosa', response: 'Tú dirás. ... Yo de cables no sé nada, pero el del polo de ahí viene todas las mañanas. Creo que trabaja en algo de eso.' },
              ],
              chatMsg: { user: 'CableMan420', text: 'el barista sabe más de lo que parece' },
            },
          ],
        },
        {
          id: 'cat',
          tappableArea: { top: 55, left: 60, width: 20, height: 20 },
          exchanges: [
            {
              npcBubble: null,
              choices: [],
              chatMsg: [
                { user: 'TuboMaster_3000', text: 'bro estás tocando al gato en vez de buscar curro' },
                { user: 'Ohm_Dulce_Ohm', text: 'ese gato tiene más contactos que yo' },
              ],
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante electricista',
        company: 'Electrovall S.L.',
        type: 'Empresa mediana local (contacto red local)',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 67,
        correctDecision: 'apply',
      },
    },
    {
      id: 'portal',
      label: 'Portal',
      pos: { top: 65, left: 20 },
      scale: 0.9,
      bg: null, // HTML/CSS mockup, no Nano Banana bg
      isDeadEnd: false,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué buscas en el portal?',
        choices: [
          {
            text: '"electricista"',
            correct: true,
            kampePitch: false,
            npcResponse: 'Resultados: "electricista de coches", "tienda eléctrica"... y 1 oferta real entre el ruido.',
            chatMsg: { user: 'ElectricistaPRO_99', text: '"ayudante electricista" + tu zona funciona mejor' },
            offersOffer: true,
          },
          {
            text: '"ayudante electricista Valencia"',
            correct: true,
            kampePitch: false,
            npcResponse: 'Resultados limpios. La mejor oferta aparece directamente.',
            chatMsg: { user: 'ChispaVolt', text: 'las keywords importan, así se busca' },
            offersOffer: true,
          },
        ],
      },
      secondary: [
        {
          id: 'bench_lady',
          tappableArea: { top: 60, left: 55, width: 30, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Buscando trabajo en el móvil? Mi hijo hace lo mismo todo el día.',
              choices: [
                { text: 'Sí, estoy mirando ofertas de electricista', response: 'Ah, electricista. Pues mira, el del taller de ahí abajo creo que buscaba a alguien. Pero eso ya se lo dije a un chico que también hace vuestro curso, Darwin creo que se llamaba. ¿Le conoces? ... Pues eso, buen curso será, que ya vais varios por aquí buscando. Suerte, hijo.' },
                { text: 'Ignorarla y seguir buscando', response: null },
              ],
              chatMsg: { user: 'Ohm_Dulce_Ohm', text: 'esa señora te estaba dando info gratis y la has ignorado' },
            },
          ],
        },
      ],
      offer: {
        title: 'Oficial electricista 2a',
        company: 'Grupo Electra',
        type: 'Empresa grande',
        requirements: [
          { text: 'Titulación FP electricidad', met: false },
          { text: 'Experiencia 2 años', met: false },
          { text: 'Carnet B', met: false },
          { text: 'Disponibilidad', met: true },
          { text: 'Trabajo en equipo', met: true },
        ],
        matchPct: 40,
        correctDecision: 'pass',
      },
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      pos: { top: 65, left: 65 },
      scale: 0.9,
      bg: null,
      isDeadEnd: true,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué haces en el grupo?',
        choices: [
          {
            text: 'Escribir: "Busco trabajo de electricista en Valencia, ¿alguien sabe?"',
            correct: false,
            kampePitch: false,
            npcResponse: '... Silencio. Un meme. Alguien escribe "bienvenido" y nada más.',
            chatMsg: { user: 'CableMan420', text: 'en ciudad los grupos son más para memes que para curro' },
            offersOffer: false,
          },
          {
            text: 'Escuchar el audio de Milane',
            correct: false,
            kampePitch: false,
            npcResponse: '"Eh bonjour, alguien sabe dónde puedo comprar tubo corrugado por aquí? En France lo pedía online y llegaba al día siguiente, esto es otro mundo..."',
            chatMsg: { user: 'TuboMaster_3000', text: 'Milane adaptándose al sistema español, respeto' },
            offersOffer: false,
          },
          {
            text: 'Salir del grupo',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'InstaladorJefe', text: 'en Valencia tira más de portales y ETTs que de WhatsApp' },
            offersOffer: false,
          },
        ],
      },
      secondary: [],
      offer: null,
    },
  ],

  rural: [
    {
      id: 'portal',
      label: 'Portal',
      pos: { top: 25, left: 20 },
      scale: 0.7,
      bg: null,
      isDeadEnd: true,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué buscas?',
        choices: [
          {
            text: '"ayudante electricista Teruel"',
            correct: false,
            kampePitch: false,
            npcResponse: 'No se han encontrado ofertas en tu zona. 1 resultado lejano: "Técnico senior — Zaragoza."',
            chatMsg: { user: 'CableMan420', text: 'en pueblo los portales no funcionan, pero hay curro por otros lados' },
            offersOffer: false,
          },
          {
            text: '"electricista" (sin zona)',
            correct: false,
            kampePitch: false,
            npcResponse: 'Ofertas de Madrid, Barcelona, Zaragoza. Nada local.',
            chatMsg: { user: 'ElectricistaPRO_99', text: 'sin filtrar sale de todo menos de aquí' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'dog',
          tappableArea: { top: 70, left: 15, width: 20, height: 20 },
          exchanges: [
            {
              npcBubble: null,
              choices: [],
              chatMsg: [
                { user: 'xX_Rookie_Xx', text: 'el perro es el único que no te pide el carnet B' },
                { user: 'Ohm_Dulce_Ohm', text: 'contratado, empieza el lunes' },
              ],
            },
          ],
        },
      ],
      offer: null,
    },
    {
      id: 'ett',
      label: 'ETT',
      pos: { top: 25, left: 65 },
      scale: 0.7,
      bg: 'assets/bg_ett_rural.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: 'Hola, ¿tú no eres la de los cursos de electricidad? Pasa, pasa.',
        choices: [
          {
            text: 'Sí, estoy buscando trabajo de instaladora. Tengo prácticas verificadas con portfolio',
            correct: true,
            kampePitch: true,
            npcResponse: 'Uy, ¿portfolio verificado? Eso me gusta. Mira, los de Hermanos Gracia llevan semanas buscando. Les paso tu perfil directamente.',
            chatMsg: { user: 'InstaladorJefe', text: 'en la ETT del pueblo te conocen, eso es una ventaja enorme' },
            offersOffer: true,
          },
          {
            text: 'Sí, a ver si hay algo por aquí...',
            correct: true,
            kampePitch: false,
            npcResponse: 'Algo siempre hay, pero cuéntame bien qué buscas. ¿De qué vas exactamente? ... Mira, los de Hermanos Gracia llevan semanas buscando.',
            chatMsg: { user: 'ChispaVolt', text: 'está interesada pero le has hecho currar para sacarte la info' },
            offersOffer: true,
          },
          {
            text: 'Solo venía a dejar el CV',
            correct: false,
            kampePitch: false,
            npcResponse: 'Vale, lo dejo aquí con los demás.',
            chatMsg: { user: 'ElectricistaPRO_99', text: 'dejar el CV sin hablar es como mandar un WhatsApp sin esperar respuesta' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'nerea_mom',
          tappableArea: { top: 55, left: 5, width: 25, height: 35 },
          exchanges: [
            {
              npcBubble: 'Anda, ¿tú eres la chica nueva del BootKämp? Mi hija Nerea también lo está haciendo. No para de hablar de cables y no sé qué de secciones. A mí me suena a chino, pero ella está encantada.',
              choices: [],
              chatMsg: { user: 'CableMan420', text: 'pueblo es pueblo, aquí se sabe todo' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante instaladora — mantenimiento',
        company: 'Hermanos Gracia (vía ETT provincial)',
        type: 'Empresa familiar local',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 67,
        correctDecision: 'apply',
      },
    },
    {
      id: 'taller',
      label: 'Taller',
      pos: { top: 45, left: 45 },
      scale: 0.8,
      bg: 'assets/bg_taller_rural.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: 'Buenos días, soy electricista, acabo de terminar formación con prácticas verificadas. ¿Necesitas ayudante?',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Prácticas verificadas? Eso no lo oigo mucho. Enséñame qué has hecho.',
            chatMsg: { user: 'CableMan420', text: 'en pueblo el contacto directo es EL canal' },
            offersOffer: true,
          },
          {
            text: '¿Estáis cogiendo gente?',
            correct: true,
            kampePitch: false,
            npcResponse: 'Ahora mismo no, pero déjame el teléfono.',
            chatMsg: { user: 'InstaladorJefe', text: 'está bien pero podías haber dicho más de ti' },
            offersOffer: false,
          },
          {
            text: 'Mirar desde fuera y no entrar',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'xX_Rookie_Xx', text: 'yo la primera vez tampoco me atreví, pero hay que lanzarse' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'neighbor',
          tappableArea: { top: 10, left: 60, width: 30, height: 25 },
          exchanges: [
            {
              npcBubble: '¿Buscas a Paco? Está dentro, siempre está dentro. Lleva trabajando solo desde que se jubiló el otro. Fijo que necesita ayuda, aunque no lo diga.',
              choices: [],
              chatMsg: { user: 'InstaladorJefe', text: 'en pueblo la gente sabe quién necesita ayuda antes que el propio dueño' },
            },
          ],
        },
      ],
      offer: {
        title: 'Ayudante instalador — obras y mantenimiento',
        company: 'Eléctrica Villahornos (Paco)',
        type: 'Autónomo / microempresa',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Ganas de aprender', met: true },
          { text: 'Vehículo propio', met: false },
        ],
        matchPct: 75,
        correctDecision: 'apply',
      },
    },
    {
      id: 'bar',
      label: 'Bar',
      pos: { top: 65, left: 20 },
      scale: 0.9,
      bg: 'assets/bg_bar_rural.jpg',
      isDeadEnd: false,
      main: {
        npcBubble: null,
        choices: [
          {
            text: 'Perdona, ¿has dicho que buscan electricista?',
            correct: true,
            kampePitch: false,
            npcResponse: 'Sí, lo pusieron en el grupo del gremio. Mira, te lo paso.',
            chatMsg: { user: 'InstaladorJefe', text: 'boca a boca en pueblo mueve mucho curro' },
            offersOffer: true,
          },
          {
            text: 'No acercarte',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: { user: 'ElectricistaPRO_99', text: 'ese tío estaba hablando de curro y no te has acercado' },
            offersOffer: false,
          },
        ],
      },
      secondary: [
        {
          id: 'barman',
          tappableArea: { top: 15, left: 10, width: 30, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Qué va a ser? ¿Una caña? Aquí todo el mundo acaba hablando de trabajo. El otro día vino un chaval, Darwin, que también está haciendo vuestro curso ese del BootKämp. Preguntó por fontanería, le dije que aquí lo que hay es de electricista. Se quedó desayunando igualmente, buen chaval.',
              choices: [],
              chatMsg: { user: 'ChispaVolt', text: 'Darwin anda buscando también, qué crack' },
            },
          ],
        },
        {
          id: 'old_man',
          tappableArea: { top: 50, left: 65, width: 25, height: 30 },
          exchanges: [
            {
              npcBubble: '¿Tú eres nueva por aquí?',
              choices: [
                { text: 'Sí, estoy buscando trabajo de electricista', response: 'Electricista, ¿eh? Yo en mis tiempos no teníamos ni portales ni ETTs. Llamabas a la puerta y listo. Eso sí, ahora hay más trabajo que nunca, lo que pasa es que la gente no sabe buscarlo. ... Oye, ¿y sabes algo de enchufes? Que tengo uno en casa que hace chispas.' },
                { text: 'De aquí de toda la vida, pero buscando curro', response: 'Pues con lo que están montando en la nave nueva, seguro que sale algo. Aquí en Villahornos siempre ha habido curro para quien sabe buscarlo. Lo que pasa es que no sale en el Google ese.' },
              ],
              chatMsg: { user: 'InstaladorJefe', text: 'este señor sabe de lo que habla' },
            },
          ],
        },
      ],
      offer: {
        title: 'Electricista para instalación nave industrial',
        company: 'Construcciones Pérez (subcontrata)',
        type: 'Empresa mediana comarcal',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Experiencia previa', met: false },
          { text: 'Carnet B', met: false },
          { text: 'Botas de seguridad', met: true },
        ],
        matchPct: 60,
        correctDecision: 'apply',
      },
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      pos: { top: 65, left: 65 },
      scale: 0.9,
      bg: null,
      isDeadEnd: false,
      isPhoneUI: true,
      main: {
        npcBubble: '¿Qué haces?',
        choices: [
          {
            text: 'Llamar: "Buenos días, soy instaladora eléctrica. Tengo portfolio verificado, ¿puedo mandároslo?"',
            correct: true,
            kampePitch: true,
            npcResponse: '¿Portfolio verificado? Sí, mándalo. Y pásate mañana si puedes, estamos justos de personal.',
            chatMsg: { user: 'CableMan420', text: 'llamar en frío funciona en pueblo' },
            offersOffer: true,
          },
          {
            text: 'Llamar: "Hola, eh... ¿tenéis trabajo?"',
            correct: false,
            kampePitch: false,
            npcResponse: '¿De qué? ... Mira, llámanos cuando sepas lo que buscas.',
            chatMsg: { user: 'InstaladorJefe', text: 'nombre + oficio + qué ofreces, en los primeros 10 segundos' },
            offersOffer: false,
          },
          {
            text: 'Buscar en Google Maps pero no llamar',
            correct: false,
            kampePitch: false,
            npcResponse: null,
            chatMsg: [
              { user: 'xX_Rookie_Xx', text: 'la empresa está ahí, el número está ahí, ¿qué más necesitas?' },
              { user: 'ChispaVolt', text: 'yo también tardo en llamar, pero hay que hacerlo' },
            ],
            offersOffer: false,
          },
        ],
      },
      secondary: [],
      offer: {
        title: 'Ayudante electricista — mantenimiento comarcal',
        company: 'Electricidad Comarcal',
        type: 'Empresa pequeña local',
        requirements: [
          { text: 'Formación eléctrica', met: true },
          { text: 'Disponibilidad', met: true },
          { text: 'Carnet B', met: false },
        ],
        matchPct: 67,
        correctDecision: 'apply',
      },
    },
  ],
};
```

- [ ] **Step 3: Define badges data**

```javascript
// === BADGES ===
const BADGES = [
  { id: 'buscador_activo', icon: '🔍', label: 'Buscador Activo', desc: 'Visita las 5 localizaciones' },
  { id: 'canal_portal', icon: '💻', label: 'Canal Portal', desc: 'Encuentra oferta por portal' },
  { id: 'canal_ett', icon: '🏢', label: 'Canal ETT', desc: 'Encuentra oferta por ETT' },
  { id: 'contacto_directo', icon: '🚪', label: 'Contacto Directo', desc: 'Encuentra oferta por contacto directo' },
  { id: 'red_local', icon: '💬', label: 'Red Local', desc: 'Encuentra oferta por red local' },
  { id: 'pitch_kampe', icon: '📋', label: 'Pitch Kampe', desc: 'Menciona portfolio verificado' },
  { id: 'regla_60', icon: '✅', label: 'Regla del 60%', desc: 'Envía candidatura con >=60% ajuste' },
  { id: 'lectura_critica', icon: '👁', label: 'Lectura Critica', desc: 'Pasa correctamente oferta <60%' },
  { id: 'primera_candidatura', icon: '✉️', label: 'Primera Candidatura', desc: 'Envía tu primera candidatura' },
  { id: 'no_hay_curro', icon: '🗺', label: 'No Hay Curro? Si Lo Hay', desc: 'Encuentra 3+ ofertas en zona rural', ruralOnly: true },
];

// Map location IDs to badge channel types
const CHANNEL_BADGES = {
  portal: 'canal_portal',
  ett: 'canal_ett',
  taller: 'contacto_directo',
  bar: 'red_local',
  telefono: 'contacto_directo',
};
```

- [ ] **Step 4: Commit**

```bash
git add games/mi_primer_curro/game.js
git commit -m "feat(mi_primer_curro): add complete content data structures for both zones"
```

---

## Task 2: Game State + Zone Initialization

**Files:**
- Modify: `games/mi_primer_curro/game.js`

- [ ] **Step 1: Expand state object and add reset/init functions**

Replace the existing `state` object and add initialization logic:

```javascript
// === STATE ===
let S = {
  zone: null,
  score: 0,
  offersFound: 0,
  candidaturesSent: 0,
  kampePitchCount: 0,
  badges: {},
  locations: {},
  currentLocation: null,
  currentSecondary: null,
  taskCompleted: false,
  otherZonePlayed: false,
  firstOfferFound: false,
  firstCandidatureSent: false,
};

function resetState(zone) {
  S.zone = zone;
  S.score = 0;
  S.offersFound = 0;
  S.candidaturesSent = 0;
  S.kampePitchCount = 0;
  S.badges = {};
  S.currentLocation = null;
  S.currentSecondary = null;
  S.taskCompleted = false;
  S.firstOfferFound = false;
  S.firstCandidatureSent = false;
  // Initialize location states
  S.locations = {};
  const locs = LOCATIONS[zone];
  locs.forEach(loc => {
    S.locations[loc.id] = {
      state: 'available', // 'available' | 'entered' | 'completed'
      mainDone: false,
      secondaryDone: {},
      offerFound: false,
      offerHandled: false,
    };
    loc.secondary.forEach(sec => {
      S.locations[loc.id].secondaryDone[sec.id] = false;
    });
  });
}

function initZone(zone) {
  resetState(zone);
  const char = CHARACTERS[zone];
  // Set avatar images
  document.getElementById('street-avatar').src = char.happy;
  document.getElementById('loc-avatar').src = char.happy;
  // Set street background
  document.getElementById('street-bg').src = STREET_BG[zone];
  // Update stats display
  updateStats();
  // Build location markers
  buildMarkers();
  // Show intro message
  showScreen('street');
  startAmbientChat();
  setTimeout(() => {
    addChatMessage(char.introMsg, char.name, false);
  }, 800);
  // Zone-specific first ambient
  setTimeout(() => {
    const zoneAmb = ZONE_AMBIENT[zone];
    const msg = zoneAmb[Math.floor(Math.random() * zoneAmb.length)];
    addChatMessage(msg.text, msg.user);
  }, 2500);
}
```

- [ ] **Step 2: Add stats update helper**

```javascript
function updateStats() {
  document.getElementById('stat-offers').textContent = S.offersFound;
  document.getElementById('stat-candidatures').textContent = S.candidaturesSent;
}
```

- [ ] **Step 3: Wire zone init into server card click**

Update the existing server card event listener:

```javascript
// In DOMContentLoaded, replace the server-card handler:
document.querySelectorAll('.server-card').forEach(card => {
  card.addEventListener('click', () => {
    vibrate('light');
    initZone(card.dataset.zone);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add games/mi_primer_curro/game.js
git commit -m "feat(mi_primer_curro): add game state management and zone initialization"
```

---

## Task 3: Street Overview — Markers + Avatar Movement

**Files:**
- Modify: `games/mi_primer_curro/game.js`
- Modify: `games/mi_primer_curro/style.css` (minor: tappable secondary NPC areas)

- [ ] **Step 1: Implement marker building**

```javascript
function buildMarkers() {
  const container = document.getElementById('location-markers');
  container.innerHTML = '';
  const locs = LOCATIONS[S.zone];
  locs.forEach((loc, i) => {
    const marker = document.createElement('div');
    marker.className = 'loc-marker';
    marker.dataset.locId = loc.id;
    marker.style.top = loc.pos.top + '%';
    marker.style.left = loc.pos.left + '%';
    marker.style.transform = `scale(${loc.scale})`;
    marker.innerHTML = `
      <div class="marker-dot"></div>
      <span class="marker-label">${loc.label}</span>
    `;
    // Staggered pop-in
    marker.style.opacity = '0';
    setTimeout(() => {
      marker.style.transition = 'opacity 0.3s ease';
      marker.style.opacity = '1';
    }, 200 + i * 100);
    marker.addEventListener('click', () => onMarkerTap(loc));
    container.appendChild(marker);
  });
}

function updateMarkerState(locId) {
  const marker = document.querySelector(`.loc-marker[data-loc-id="${locId}"]`);
  if (!marker) return;
  const locState = S.locations[locId];
  if (locState.state === 'completed') {
    marker.classList.add('visited');
    // Add checkmark
    if (!marker.querySelector('.marker-check')) {
      const check = document.createElement('span');
      check.className = 'marker-check';
      check.textContent = '✓';
      marker.querySelector('.marker-dot').appendChild(check);
    }
  } else if (locState.state === 'entered') {
    marker.classList.add('entered');
  }
}
```

- [ ] **Step 2: Implement avatar movement + scene transition**

```javascript
function onMarkerTap(loc) {
  vibrate('light');
  const avatar = document.getElementById('street-avatar');
  // Move avatar toward marker position with scale
  const scaleVal = 0.5 + (loc.pos.top / 100) * 0.5;
  avatar.style.transform = `translate(${loc.pos.left - 10}vw, ${-(100 - loc.pos.top) * 0.5}%) scale(${scaleVal})`;
  // After movement animation, enter location
  setTimeout(() => {
    enterLocation(loc);
  }, 500);
}
```

- [ ] **Step 3: Add CSS for marker checkmark and entered state**

Add to style.css:

```css
.marker-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: 700;
  color: var(--white);
}

.loc-marker.entered .marker-dot {
  border-color: var(--gold);
  background: rgba(255, 204, 0, 0.2);
}
```

- [ ] **Step 4: Commit**

```bash
git add games/mi_primer_curro/game.js games/mi_primer_curro/style.css
git commit -m "feat(mi_primer_curro): street overview markers and avatar movement"
```

---

## Task 4: Location Engine — Dialogue System

**Files:**
- Modify: `games/mi_primer_curro/game.js`
- Modify: `games/mi_primer_curro/style.css` (phone UI mockup styles)

This is the core of the game — entering a location, showing NPC dialogue, presenting choices, and handling outcomes.

- [ ] **Step 1: Implement location entry**

```javascript
function enterLocation(loc) {
  S.currentLocation = loc;
  const locState = S.locations[loc.id];
  if (locState.state === 'available') locState.state = 'entered';

  // Set background
  const locBg = document.getElementById('loc-bg');
  if (loc.isPhoneUI) {
    locBg.style.display = 'none';
    showPhoneUI(loc);
  } else {
    locBg.style.display = '';
    locBg.src = loc.bg;
    hidePhoneUI();
  }

  // Set avatar
  const char = CHARACTERS[S.zone];
  document.getElementById('loc-avatar').src = char.happy;

  // Clear previous dialogue
  clearDialogue();

  // Show screen
  showScreen('location');

  // Build secondary NPC tappable areas
  buildSecondaryNPCs(loc);

  // If main interaction not done, start it
  if (!locState.mainDone) {
    startMainDialogue(loc);
  } else {
    // Already done — just show back button
    showBackButton();
  }
}

function clearDialogue() {
  const npcBubble = document.getElementById('npc-bubble');
  const playerBubble = document.getElementById('player-bubble');
  const choiceButtons = document.getElementById('choice-buttons');
  npcBubble.classList.add('hidden');
  npcBubble.textContent = '';
  playerBubble.classList.add('hidden');
  playerBubble.textContent = '';
  choiceButtons.classList.add('hidden');
  choiceButtons.innerHTML = '';
  document.getElementById('btn-back').classList.add('hidden');
}
```

- [ ] **Step 2: Implement typewriter effect + main dialogue flow**

```javascript
function typewriter(element, text, speed, callback) {
  element.classList.remove('hidden');
  element.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (callback) setTimeout(callback, 500);
    }
  }, speed);
  return interval;
}

function startMainDialogue(loc) {
  const main = loc.main;
  if (main.npcBubble) {
    // NPC speaks first
    const npcBubble = document.getElementById('npc-bubble');
    typewriter(npcBubble, main.npcBubble, 30, () => {
      showChoices(main.choices, loc);
    });
  } else {
    // NPC doesn't speak first — show choices immediately
    showChoices(main.choices, loc);
  }
}

function showChoices(choices, loc) {
  const container = document.getElementById('choice-buttons');
  container.innerHTML = '';
  container.classList.remove('hidden');
  choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.style.animationDelay = (idx * 0.1) + 's';
    btn.addEventListener('click', () => onChoiceTap(choice, loc));
    container.appendChild(btn);
  });
}
```

- [ ] **Step 3: Implement choice handling + outcomes**

```javascript
function onChoiceTap(choice, loc) {
  vibrate('light');
  const locState = S.locations[loc.id];
  locState.mainDone = true;

  // Hide choices
  document.getElementById('choice-buttons').classList.add('hidden');

  // Show player bubble
  const playerBubble = document.getElementById('player-bubble');
  typewriter(playerBubble, choice.text, 25, () => {
    // After player speaks, show NPC response
    setTimeout(() => {
      if (choice.npcResponse) {
        const npcBubble = document.getElementById('npc-bubble');
        npcBubble.textContent = '';
        typewriter(npcBubble, choice.npcResponse, 30, () => {
          afterMainResponse(choice, loc);
        });
      } else {
        afterMainResponse(choice, loc);
      }
    }, 500);
  });
}

function afterMainResponse(choice, loc) {
  const locState = S.locations[loc.id];
  const char = CHARACTERS[S.zone];

  // Chat overlay feedback (delay 0.8s)
  setTimeout(() => {
    const msgs = Array.isArray(choice.chatMsg) ? choice.chatMsg : [choice.chatMsg];
    msgs.forEach((msg, i) => {
      setTimeout(() => addChatMessage(msg.text, msg.user), i * 600);
    });
  }, 800);

  // Handle Kampe pitch
  if (choice.kampePitch) {
    S.kampePitchCount++;
    earnBadge('pitch_kampe');
  }

  // Handle offer found
  if (choice.offersOffer && loc.offer) {
    locState.offerFound = true;
    S.offersFound++;
    updateStats();

    // Set avatar celebrating
    document.getElementById('loc-avatar').src = char.celebrating;
    vibrate('success');

    // Badge for channel
    const channelBadge = CHANNEL_BADGES[loc.id];
    if (channelBadge) earnBadge(channelBadge);

    // First offer message
    if (!S.firstOfferFound) {
      S.firstOfferFound = true;
      setTimeout(() => {
        addChatMessage('Mira, hay algo. Vamos a ver si me encaja.', char.name, false);
      }, 1200);
    }

    // Show offer card after delay
    setTimeout(() => showOfferCard(loc.offer), 1500);
  } else {
    // No offer — avatar worried briefly if it was a bad choice
    if (!choice.correct) {
      document.getElementById('loc-avatar').src = char.worried;
      vibrate('error');
      setTimeout(() => {
        document.getElementById('loc-avatar').src = char.happy;
      }, 1500);
    }
    // Mark location completed
    locState.state = 'completed';
    showBackButton();
  }
}

function showBackButton() {
  const btn = document.getElementById('btn-back');
  btn.classList.remove('hidden');
}
```

- [ ] **Step 4: Implement secondary NPC system**

```javascript
function buildSecondaryNPCs(loc) {
  // Remove old tappable areas
  document.querySelectorAll('.secondary-tap').forEach(el => el.remove());

  const locScene = document.getElementById('loc-scene');
  const locState = S.locations[loc.id];

  loc.secondary.forEach(sec => {
    if (locState.secondaryDone[sec.id]) return; // Already interacted

    const tap = document.createElement('div');
    tap.className = 'secondary-tap';
    tap.style.position = 'absolute';
    tap.style.top = sec.tappableArea.top + '%';
    tap.style.left = sec.tappableArea.left + '%';
    tap.style.width = sec.tappableArea.width + '%';
    tap.style.height = sec.tappableArea.height + '%';
    tap.style.zIndex = '15';
    tap.style.cursor = 'pointer';
    // Subtle pulse to indicate tappable
    tap.style.border = '2px dashed rgba(255,255,255,0.15)';
    tap.style.borderRadius = '8px';

    tap.addEventListener('click', () => {
      locState.secondaryDone[sec.id] = true;
      tap.remove();
      playSecondaryExchange(sec);
    });

    locScene.appendChild(tap);
  });
}

function playSecondaryExchange(sec) {
  const exchange = sec.exchanges[0]; // Currently only 1 exchange per secondary
  if (!exchange) return;

  // If no bubble (like cat/dog), just fire chat messages
  if (!exchange.npcBubble && exchange.choices.length === 0) {
    const msgs = Array.isArray(exchange.chatMsg) ? exchange.chatMsg : [exchange.chatMsg];
    msgs.forEach((msg, i) => {
      setTimeout(() => addChatMessage(msg.text, msg.user), i * 600);
    });
    return;
  }

  // Show NPC bubble
  const npcBubble = document.getElementById('npc-bubble');
  clearDialogue();

  if (exchange.npcBubble) {
    typewriter(npcBubble, exchange.npcBubble, 30, () => {
      if (exchange.choices.length > 0) {
        showSecondaryChoices(exchange);
      } else {
        // No choices — just flavor text + chat
        const msgs = Array.isArray(exchange.chatMsg) ? exchange.chatMsg : [exchange.chatMsg];
        msgs.forEach((msg, i) => {
          setTimeout(() => addChatMessage(msg.text, msg.user), 800 + i * 600);
        });
        setTimeout(() => showBackButton(), 2000);
      }
    });
  }
}

function showSecondaryChoices(exchange) {
  const container = document.getElementById('choice-buttons');
  container.innerHTML = '';
  container.classList.remove('hidden');
  exchange.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      vibrate('light');
      container.classList.add('hidden');
      // Show player bubble
      const playerBubble = document.getElementById('player-bubble');
      typewriter(playerBubble, choice.text, 25, () => {
        if (choice.response) {
          const npcBubble = document.getElementById('npc-bubble');
          npcBubble.textContent = '';
          typewriter(npcBubble, choice.response, 30);
        }
        // Chat messages
        const msgs = Array.isArray(exchange.chatMsg) ? exchange.chatMsg : [exchange.chatMsg];
        setTimeout(() => {
          msgs.forEach((msg, i) => {
            setTimeout(() => addChatMessage(msg.text, msg.user), i * 600);
          });
        }, 800);
      });
    });
    container.appendChild(btn);
  });
}
```

- [ ] **Step 5: Add phone UI mockup styles**

Add to style.css:

```css
/* Phone UI mockup (portal, WhatsApp, phone) */
.phone-ui {
  position: absolute;
  inset: 5%;
  background: var(--dark-bg);
  border-radius: 24px;
  border: 3px solid var(--grey);
  padding: 16px;
  display: flex;
  flex-direction: column;
  z-index: 5;
}

.phone-ui.hidden { display: none; }

.phone-ui .phone-header {
  font-family: var(--font-title);
  font-size: 14px;
  color: var(--grey);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--panel);
}

.phone-ui .phone-content {
  flex: 1;
  overflow-y: auto;
  font-size: 13px;
  color: var(--grey);
  line-height: 1.5;
}

/* Secondary NPC tappable areas */
.secondary-tap {
  transition: border-color 0.3s ease;
}
.secondary-tap:active {
  border-color: rgba(255, 255, 255, 0.4) !important;
}
```

- [ ] **Step 6: Add phone UI show/hide helpers to game.js**

```javascript
function showPhoneUI(loc) {
  let phoneUI = document.getElementById('phone-ui');
  if (!phoneUI) {
    phoneUI = document.createElement('div');
    phoneUI.id = 'phone-ui';
    phoneUI.className = 'phone-ui';
    document.getElementById('loc-scene').appendChild(phoneUI);
  }
  phoneUI.classList.remove('hidden');

  // Set content based on location type
  if (loc.id === 'portal') {
    phoneUI.innerHTML = `
      <div class="phone-header">Infojobs — Buscar empleo</div>
      <div class="phone-content">
        <div style="background:var(--panel);padding:10px;border-radius:8px;margin-bottom:12px;">
          <span style="color:var(--grey);">🔍 Buscar...</span>
        </div>
        <p style="color:var(--grey);font-size:12px;text-align:center;margin-top:20px;">Escribe lo que buscas para ver resultados</p>
      </div>
    `;
  } else if (loc.id === 'whatsapp') {
    phoneUI.innerHTML = `
      <div class="phone-header">Electricistas Valencia 🔌 · 247 miembros</div>
      <div class="phone-content">
        <p style="margin:8px 0;"><span style="color:var(--green);">Juan_Elec:</span> 😂😂😂</p>
        <p style="margin:8px 0;"><span style="color:var(--green);">Milane 🇫🇷:</span> 🎤 0:47</p>
        <p style="margin:8px 0;"><span style="color:var(--green);">Carlos_Instala:</span> Alguien vende taladro Bosch?</p>
        <p style="margin:8px 0;"><span style="color:var(--green);">Pedro_ETT:</span> [imagen de meme]</p>
      </div>
    `;
  } else if (loc.id === 'telefono') {
    phoneUI.innerHTML = `
      <div class="phone-header">Google Maps — Empresas cercanas</div>
      <div class="phone-content">
        <div style="background:var(--panel);padding:12px;border-radius:8px;margin-bottom:8px;">
          <strong style="color:var(--white);">📍 Electricidad Comarcal</strong>
          <p style="font-size:11px;margin-top:4px;">Carretera de Teruel, km 3 · ⭐ 4.2</p>
          <p style="font-size:11px;color:var(--green);">📞 978 XX XX XX</p>
        </div>
      </div>
    `;
  }
}

function hidePhoneUI() {
  const phoneUI = document.getElementById('phone-ui');
  if (phoneUI) phoneUI.classList.add('hidden');
}
```

- [ ] **Step 7: Commit**

```bash
git add games/mi_primer_curro/game.js games/mi_primer_curro/style.css
git commit -m "feat(mi_primer_curro): dialogue system, secondary NPCs, phone UI mockups"
```

---

## Task 5: Offer Evaluation + 60% Rule

**Files:**
- Modify: `games/mi_primer_curro/game.js`

- [ ] **Step 1: Implement offer card display**

```javascript
function showOfferCard(offer) {
  const overlay = document.getElementById('offer-overlay');
  document.querySelector('.offer-title').textContent = offer.title;
  document.querySelector('.offer-company').textContent = `${offer.company} · ${offer.type}`;

  // Build requirements
  const reqContainer = document.querySelector('.offer-requirements');
  reqContainer.innerHTML = '';
  offer.requirements.forEach(req => {
    const item = document.createElement('div');
    item.className = 'req-item ' + (req.met ? 'req-met' : 'req-not');
    item.innerHTML = `<span>${req.met ? '✅' : '❌'}</span> <span>${req.text}</span>`;
    reqContainer.appendChild(item);
  });

  // Match bar
  const fill = document.querySelector('.match-fill');
  const pct = document.querySelector('.match-pct');
  fill.style.width = '0%';
  fill.style.background = offer.matchPct >= 60 ? 'var(--green)' : 'var(--red)';
  pct.textContent = offer.matchPct + '%';
  pct.style.color = offer.matchPct >= 60 ? 'var(--green)' : 'var(--red)';

  // Animate bar
  setTimeout(() => {
    fill.style.width = offer.matchPct + '%';
  }, 100);

  // Store current offer for button handlers
  S._currentOffer = offer;

  overlay.classList.remove('hidden');
}
```

- [ ] **Step 2: Implement apply/pass handlers**

```javascript
function onApply() {
  const offer = S._currentOffer;
  if (!offer) return;
  hideOverlay('offer-overlay');

  const locState = S.locations[S.currentLocation.id];
  locState.offerHandled = true;
  locState.state = 'completed';

  const isCorrect = offer.matchPct >= 60;

  if (isCorrect) {
    S.score += 50;
    earnBadge('regla_60');
  } else {
    S.score += 25; // Still counts but no bonus
  }

  S.candidaturesSent++;
  updateStats();

  if (!S.firstCandidatureSent) {
    S.firstCandidatureSent = true;
    earnBadge('primera_candidatura');
    const char = CHARACTERS[S.zone];
    addChatMessage('Enviada. La primera. Ya no vale eso de que no he buscado.', char.name, false);
  }

  vibrate('success');

  // Check task completion
  checkTaskCompleted();

  showBackButton();
}

function onPass() {
  const offer = S._currentOffer;
  if (!offer) return;
  hideOverlay('offer-overlay');

  const locState = S.locations[S.currentLocation.id];
  locState.offerHandled = true;
  locState.state = 'completed';

  if (offer.matchPct >= 60) {
    // Wrong pass — show 60% rule toast
    vibrate('error');
    const char = CHARACTERS[S.zone];
    document.getElementById('loc-avatar').src = char.worried;

    const metCount = offer.requirements.filter(r => r.met).length;
    const totalCount = offer.requirements.length;
    document.getElementById('toast-text').textContent =
      `Cumples ${metCount} de ${totalCount} requisitos obligatorios (${offer.matchPct}%). La regla: si llegas al 60%, se envía. No esperes al 100%.`;
    showOverlay('toast-overlay');

    // After toast dismissed, score 0 for this
    // (handled in btn-understood listener)
  } else {
    // Correct pass
    S.score += 25;
    earnBadge('lectura_critica');
    addChatMessage('bien visto, esa no encajaba', 'CableMan420');
    vibrate('light');
  }

  showBackButton();
}
```

- [ ] **Step 3: Wire the buttons (update existing handlers)**

Replace the existing btn-apply and btn-pass handlers in DOMContentLoaded:

```javascript
document.getElementById('btn-apply').addEventListener('click', onApply);
document.getElementById('btn-pass').addEventListener('click', onPass);

// Toast dismiss — also restore avatar
document.getElementById('btn-understood').addEventListener('click', () => {
  vibrate('light');
  hideOverlay('toast-overlay');
  const char = CHARACTERS[S.zone];
  document.getElementById('loc-avatar').src = char.happy;
  addChatMessage('recuerda la regla del 60%, no esperes al 100%', 'InstaladorJefe');
});
```

- [ ] **Step 4: Commit**

```bash
git add games/mi_primer_curro/game.js
git commit -m "feat(mi_primer_curro): offer evaluation with 60% rule enforcement"
```

---

## Task 6: Scoring + Badges + Task Completion

**Files:**
- Modify: `games/mi_primer_curro/game.js`

- [ ] **Step 1: Implement badge system**

```javascript
function earnBadge(badgeId) {
  if (S.badges[badgeId]) return; // Already earned
  S.badges[badgeId] = true;

  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;

  const char = CHARACTERS[S.zone];
  addChatMessage(`🏆 ${char.name} desbloqueó: ${badge.label}`, null, true);
  vibrate('medium');
}

function checkAllBadges() {
  // Buscador Activo — visited all 5
  const locs = LOCATIONS[S.zone];
  const allVisited = locs.every(l => S.locations[l.id].state !== 'available');
  if (allVisited) earnBadge('buscador_activo');

  // No Hay Curro? Si Lo Hay (rural only)
  if (S.zone === 'rural' && S.offersFound >= 3) {
    earnBadge('no_hay_curro');
  }
}

function checkTaskCompleted() {
  if (!S.taskCompleted && S.score >= TASK_THRESHOLD) {
    S.taskCompleted = true;
    fireTaskCompleted();
    addChatMessage('🏆 TAREA COMPLETADA — Has demostrado que sabes buscar trabajo', null, true);
    vibrate('success', [0, 100, 50, 200]);
  }
}
```

- [ ] **Step 2: Add score tracking to offer discovery**

In the `afterMainResponse` function, after `S.offersFound++`, add:

```javascript
S.score += 25; // Points for finding offer
```

- [ ] **Step 3: Commit**

```bash
git add games/mi_primer_curro/game.js
git commit -m "feat(mi_primer_curro): badge system and task completion"
```

---

## Task 7: Results Screen

**Files:**
- Modify: `games/mi_primer_curro/game.js`

- [ ] **Step 1: Implement "end morning" flow**

```javascript
function endMorning() {
  const visitedCount = Object.values(S.locations).filter(l => l.state !== 'available').length;

  if (visitedCount < 2) {
    addChatMessage('tío aún no has mirado ni la mitad de sitios', 'InstaladorJefe');
    showOverlay('confirm-overlay');
    return;
  }

  if (visitedCount < 5) {
    showOverlay('confirm-overlay');
    return;
  }

  goToResults();
}

function goToResults() {
  stopAmbientChat();
  checkAllBadges();
  saveRecord(S.score);
  showScreen('results');
  populateResults();
}
```

- [ ] **Step 2: Implement results population with staggered reveals**

```javascript
function populateResults() {
  const char = CHARACTERS[S.zone];

  // Avatar state based on score
  const avatarImg = document.getElementById('results-avatar');
  if (S.candidaturesSent >= 2) {
    avatarImg.src = char.celebrating;
  } else if (S.candidaturesSent >= 1) {
    avatarImg.src = char.happy;
  } else {
    avatarImg.src = char.worried;
  }

  // Stats with staggered reveal
  const statsContainer = document.getElementById('results-stats');
  statsContainer.innerHTML = '';
  const stats = [
    `Ofertas encontradas: ${S.offersFound}/4`,
    `Candidaturas enviadas: ${S.candidaturesSent}`,
    `Pitch Kampe: ${S.kampePitchCount} veces`,
    `Puntuación: ${S.score} pts`,
  ];
  stats.forEach((text, i) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    statsContainer.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'all 0.4s ease-out';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
      vibrate('light');
    }, 400 + i * 400);
  });

  // Badges with staggered pop-in
  const badgesContainer = document.getElementById('results-badges');
  badgesContainer.innerHTML = '';
  const delayBase = 400 + stats.length * 400 + 400;
  BADGES.forEach((badge, i) => {
    if (badge.ruralOnly && S.zone !== 'rural') return;
    const el = document.createElement('div');
    const earned = S.badges[badge.id];
    el.className = 'badge' + (earned ? '' : ' locked');
    el.textContent = earned ? badge.icon : '🔒';
    el.title = badge.label;
    el.style.transform = 'scale(0)';
    badgesContainer.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = 'scale(1)';
      if (earned && i === 0) vibrate('success');
    }, delayBase + i * 200);
  });

  // Missed opportunities
  const missedContainer = document.getElementById('results-missed');
  missedContainer.innerHTML = '';
  const locs = LOCATIONS[S.zone];
  const missed = locs.filter(l =>
    !l.isDeadEnd && l.offer && !S.locations[l.id].offerFound
  );
  if (missed.length > 0) {
    const h4 = document.createElement('h4');
    h4.textContent = 'Oportunidades perdidas:';
    missedContainer.appendChild(h4);
    missed.forEach(loc => {
      const p = document.createElement('p');
      p.textContent = `En ${loc.label.toLowerCase()} había una oferta de "${loc.offer.title}". La próxima vez, prueba otro enfoque.`;
      missedContainer.appendChild(p);
    });
  }

  // Result message
  const msgDelay = delayBase + BADGES.length * 200 + 400;
  setTimeout(() => {
    let msg;
    if (S.score >= 250) {
      msg = S.zone === 'urban'
        ? 'Tres candidaturas en una mañana. No está mal para ser martes.'
        : 'Decían que aquí no había curro. Pues mira.';
    } else if (S.score >= TASK_THRESHOLD) {
      msg = S.zone === 'urban'
        ? 'Algo he sacado. La próxima vez pregunto más.'
        : 'Hay más de lo que creía. La próxima vez entro en todos los sitios.';
    } else {
      msg = S.zone === 'urban'
        ? 'Me ha faltado atreverme. Mañana vuelvo y hablo con más gente.'
        : 'El curro estaba ahí pero no lo he encontrado. Tengo que buscar de otra forma.';
    }
    addChatMessage(msg, char.name, false);
  }, msgDelay);

  // "Connect to other server" button
  const otherBtn = document.getElementById('btn-other-server');
  if (!S.otherZonePlayed) {
    otherBtn.classList.remove('hidden');
  } else {
    otherBtn.classList.add('hidden');
  }
}
```

- [ ] **Step 3: Wire end/results buttons**

Update existing handlers in DOMContentLoaded:

```javascript
document.getElementById('btn-end-morning').addEventListener('click', () => {
  vibrate('light');
  endMorning();
});

document.getElementById('btn-confirm-end').addEventListener('click', () => {
  hideOverlay('confirm-overlay');
  goToResults();
});

document.getElementById('btn-other-server').addEventListener('click', () => {
  vibrate('light');
  S.otherZonePlayed = true;
  showScreen('server-select');
});

document.getElementById('btn-replay').addEventListener('click', () => {
  vibrate('light');
  initZone(S.zone);
});

document.getElementById('btn-exit').addEventListener('click', () => {
  vibrate('light');
  showScreen('title');
});
```

- [ ] **Step 4: Also auto-trigger results when all 5 locations completed**

In the `enterLocation` function (or after returning to street), add a check:

```javascript
// Add to the btn-back click handler:
document.getElementById('btn-back').addEventListener('click', () => {
  vibrate('light');
  const loc = S.currentLocation;
  if (loc) {
    updateMarkerState(loc.id);
  }
  showScreen('street');
  // Check if all locations done
  const allDone = Object.values(S.locations).every(l => l.state === 'completed');
  if (allDone) {
    setTimeout(() => {
      addChatMessage('Ya he mirado por todos lados. Vamos a ver qué tal ha ido.', CHARACTERS[S.zone].name, false);
      setTimeout(goToResults, 2000);
    }, 500);
  }
});
```

- [ ] **Step 5: Commit**

```bash
git add games/mi_primer_curro/game.js
git commit -m "feat(mi_primer_curro): results screen with staggered reveals, badges, missed opportunities"
```

---

## Task 8: Polish + Integration Testing

**Files:**
- Modify: `games/mi_primer_curro/game.js` (final cleanup)
- Modify: `games/mi_primer_curro/style.css` (transitions)
- Modify: `games/mi_primer_curro/index.html` (minor)

- [ ] **Step 1: Add screen transition animations**

Add to style.css:

```css
/* Screen transitions */
.screen {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.screen.active {
  opacity: 1;
}

/* Offer card slide-up */
#offer-card {
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.4s ease-out;
}

.overlay:not(.hidden) #offer-card {
  transform: translateY(0);
  opacity: 1;
}

/* Toast slide-up */
#toast-card {
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.3s ease-out;
}

.overlay:not(.hidden) #toast-card {
  transform: translateY(0);
  opacity: 1;
}
```

- [ ] **Step 2: Add random player count animation on title screen**

In game.js, in DOMContentLoaded:

```javascript
// Animate player count on title screen
setInterval(() => {
  const el = document.getElementById('player-count');
  if (el) {
    const base = 800 + Math.floor(Math.random() * 200);
    el.textContent = base;
  }
}, 5000);
```

- [ ] **Step 3: Ensure ambient chat uses zone-specific messages**

Update `startAmbientChat` to mix general + zone messages:

```javascript
function startAmbientChat() {
  stopAmbientChat();
  const allMessages = [...AMBIENT_MESSAGES, ...(ZONE_AMBIENT[S.zone] || [])];
  let lastIdx = -1;
  ambientTimer = setInterval(() => {
    let idx;
    do { idx = Math.floor(Math.random() * allMessages.length); } while (idx === lastIdx);
    lastIdx = idx;
    const msg = allMessages[idx];
    addChatMessage(msg.text, msg.user);
  }, 10000 + Math.random() * 8000);
}
```

- [ ] **Step 4: Final commit**

```bash
git add games/mi_primer_curro/
git commit -m "feat(mi_primer_curro): polish, transitions, ambient chat, player count animation"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Title screen (Roblox meta-wrapper) — Task 8 (player count), scaffolding
- [x] Server select (zone choice) — Task 2
- [x] Street overview (markers, avatar, stats) — Task 3
- [x] Location entry + dialogue — Task 4
- [x] NPC dialogue with choices — Task 4
- [x] Secondary NPCs (flavor) — Task 4
- [x] Chat overlay (ambient + educational + achievements) — Tasks 1, 4, 6
- [x] Offer evaluation + 60% rule — Task 5
- [x] Kampe pitch tracking (integrated in choices, not separate screen) — Task 4, 5
- [x] Scoring (offers + candidatures + pitch + lectura critica) — Task 5, 6
- [x] Badges (10 defined, earned during play, shown in results) — Task 6, 7
- [x] Results screen (staggered reveals, badge wall, missed opportunities) — Task 7
- [x] TASK_COMPLETED at >=150 pts — Task 6
- [x] localStorage record — Task 2 (getRecord/saveRecord)
- [x] "Connect to other server" — Task 7
- [x] Free exploration (enter/exit any location) — Task 4
- [x] Phone UI mockups (portal, WhatsApp, phone) — Task 4
- [x] Dead ends (urban WhatsApp, rural portal) — Task 1 (data)
- [x] Haptic feedback — throughout all tasks
- [x] No audio — N/A (not added)

**Not covered (intentionally — requires assets):**
- Placeholder images will show broken until user provides Nano Banana PNGs/JPGs
- The pseudo-3D avatar scaling on street is simplified (CSS transform) — will need tuning with real backgrounds
