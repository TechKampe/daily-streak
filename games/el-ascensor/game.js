/* ============================================================
   EL ASCENSOR — Kampe Daily Streak
   Puzzle de cards + slots por piso, contrarreloj
   ============================================================ */

// --- Cloudinary assets ---
const ASSETS = {
  paco_happy: 'https://res.cloudinary.com/kampe/image/upload/v1774963764/paco_happy_u2qi7b.png',
  paco_celebrating: 'https://res.cloudinary.com/kampe/image/upload/v1774963764/paco_celebrating_wx8sqs.png',
  paco_worried: 'https://res.cloudinary.com/kampe/image/upload/v1774963764/paco_worried_kicpyw.png',
  silueta: 'https://res.cloudinary.com/kampe/image/upload/v1774965336/silueta_candidato_pdog1a.png',
  bg_ascensor: 'https://res.cloudinary.com/kampe/image/upload/v1774964980/bg_ascensor_lccrb7.jpg',
  bg_puertas_abiertas: '',
  bg_error: ''
};

// --- Vibrate helper ---
function vibrate(level, pattern) {
  if (window.ReactNativeWebView) {
    const msg = { action: 'VIBRATE', level };
    if (pattern) msg.pattern = pattern;
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } else if (navigator.vibrate) {
    const ms = { light: 30, medium: 60, heavy: 100, success: 50, error: 80 };
    navigator.vibrate(pattern || ms[level] || 50);
  }
}

// --- Screen switching ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.documentElement.classList.toggle('results', id === 'results');
}

// --- State ---
const S = {
  lives: 3,
  floorsCompleted: 0,
  currentFloor: 5,
  timerInterval: null,
  timerRemaining: 0,
  timerTotal: 0,
  tutorialDone: false,
  tutorialStep: 0,
  dragCard: null,
  dragOffset: { x: 0, y: 0 },
  cardRetries: {},
  floorErrors: 0,
  taskCompleted: false,
  hintUsedThisFloor: false
};

// --- Content Pool ---
const FLOORS = {
  5: {
    context: 'El método STAR sirve para contar ejemplos en una entrevista. Arrastra cada definición a su letra.',
    timer: 35,
    slots: [
      { id: 's1', label: 'S — Situación' },
      { id: 's2', label: 'T — Tarea' },
      { id: 's3', label: 'A — Acción' },
      { id: 's4', label: 'R — Resultado' }
    ],
    cards: [
      { id: 'c1', text: 'Dónde estaba y qué hacía', slot: 's1' },
      { id: 'c2', text: 'Qué tenía que conseguir', slot: 's2' },
      { id: 'c3', text: 'Qué hice exactamente', slot: 's3' },
      { id: 'c4', text: 'Cómo quedó el resultado', slot: 's4' },
      { id: 'c5', text: 'Cómo me sentí haciéndolo', slot: null }
    ],
    feedback: {
      'c1_s2': { l1: 'Has puesto la Situación en el hueco de Tarea', l2: 'La Situación es el contexto: dónde estabas y qué pasaba. La Tarea es lo que tenías que lograr.', l3: 'S = Situación: dónde y qué estaba haciendo' },
      'c1_s3': { l1: 'Has puesto la Situación en el hueco de Acción', l2: 'La Situación es el punto de partida. La Acción es lo que hiciste tú concretamente.', l3: 'S = Situación: el contexto de la historia' },
      'c1_s4': { l1: 'Has puesto la Situación en el hueco de Resultado', l2: 'La Situación va al principio — es el arranque de la historia, no el final.', l3: 'S = Situación: siempre va primero' },
      'c2_s1': { l1: 'Has puesto la Tarea en el hueco de Situación', l2: 'La Tarea es el objetivo que tenías. La Situación es dónde estabas antes de actuar.', l3: 'T = Tarea: qué tenías que conseguir' },
      'c2_s3': { l1: 'Has puesto la Tarea en el hueco de Acción', l2: 'La Tarea es lo que te pidieron. La Acción es lo que hiciste tú para conseguirlo.', l3: 'T = Tarea: el encargo, no la ejecución' },
      'c2_s4': { l1: 'Has puesto la Tarea en el hueco de Resultado', l2: 'La Tarea es el encargo. El Resultado es cómo acabó la historia.', l3: 'T = Tarea: va antes de la Acción' },
      'c3_s1': { l1: 'Has puesto la Acción en el hueco de Situación', l2: 'La Acción es lo que hiciste tú. La Situación es el contexto previo.', l3: 'A = Acción: qué hice yo, paso a paso' },
      'c3_s2': { l1: 'Has puesto la Acción en el hueco de Tarea', l2: 'La Acción es la ejecución. La Tarea es el encargo que te dieron.', l3: 'A = Acción: va después de la Tarea' },
      'c3_s4': { l1: 'Has puesto la Acción en el hueco de Resultado', l2: 'La Acción es lo que hiciste. El Resultado es lo que pasó después.', l3: 'A = Acción: antes del Resultado' },
      'c4_s1': { l1: 'Has puesto el Resultado en el hueco de Situación', l2: 'El Resultado va al final — es el cierre de la historia.', l3: 'R = Resultado: siempre va último' },
      'c4_s2': { l1: 'Has puesto el Resultado en el hueco de Tarea', l2: 'El Resultado es cómo terminó todo. La Tarea es lo que te encargaron.', l3: 'R = Resultado: el desenlace' },
      'c4_s3': { l1: 'Has puesto el Resultado en el hueco de Acción', l2: 'El Resultado es la consecuencia de tu acción, no la acción en sí.', l3: 'R = Resultado: qué pasó después de actuar' },
      'c5_any': { l1: '"Cómo me sentí" no forma parte del método STAR', l2: 'En una entrevista técnica buscan hechos y resultados, no cómo te sentiste. Guárdate las emociones.', l3: 'STAR = Situación, Tarea, Acción, Resultado. Nada más.' }
    }
  },
  4: {
    context: 'El que te entrevista busca tres cosas. Solo tres. Ponlas donde toca.',
    timer: 30,
    slots: [
      { id: 's1', label: '¿Sabe lo básico?' },
      { id: 's2', label: '¿Es fiable?' },
      { id: 's3', label: '¿Va a dar problemas?' },
      { id: 's4', label: 'Así lo demuestras' }
    ],
    cards: [
      { id: 'c1', text: 'No hay que enseñarle desde cero', slot: 's1' },
      { id: 'c2', text: 'Llega a su hora y avisa si no puede', slot: 's2' },
      { id: 'c3', text: 'No genera conflictos con el equipo', slot: 's3' },
      { id: 'c4', text: 'Tu portfolio Kämpe responde antes de que pregunten', slot: 's4' },
      { id: 'c5', text: 'Tiene un título universitario', slot: null }
    ],
    feedback: {
      'c1_s2': { l1: 'Eso no va con la fiabilidad', l2: 'Saber lo básico es una cosa — ser fiable es otra. Fiable = cumplir con lo que dices.', l3: '¿Sabe lo básico? = que no haya que enseñarle qué es un cable' },
      'c1_s3': { l1: 'Eso no va con los problemas', l2: 'Saber lo básico no tiene que ver con generar problemas. Va con tu nivel técnico mínimo.', l3: '¿Sabe lo básico? = competencia técnica mínima' },
      'c1_s4': { l1: 'Eso no es cómo lo demuestras — es lo que buscan', l2: '"No enseñarle desde cero" es lo que piensa el entrevistador. Lo que lo demuestra es tu portfolio.', l3: '¿Sabe lo básico? = lo que el entrevistador evalúa' },
      'c2_s1': { l1: 'Llegar puntual no es saber del oficio', l2: 'La puntualidad habla de fiabilidad, no de conocimientos técnicos.', l3: '¿Es fiable? = llega, avisa, cumple' },
      'c2_s3': { l1: 'Llegar puntual va con ser fiable', l2: 'No generar problemas es otra cosa: conflictos con compañeros, con el cliente, con el encargado.', l3: '¿Es fiable? = hace lo que dice que va a hacer' },
      'c2_s4': { l1: 'Eso no es cómo lo demuestras — es lo que valoran', l2: '"Llega a su hora" es un criterio del entrevistador. Tú lo demuestras con tu actitud.', l3: '¿Es fiable? = lo que el entrevistador observa' },
      'c3_s1': { l1: 'No generar conflictos no es saber del oficio', l2: 'Ser fácil de tratar va con la convivencia en obra, no con el conocimiento técnico.', l3: '¿Va a dar problemas? = con equipo, cliente o encargado' },
      'c3_s2': { l1: 'No es lo mismo ser fiable que no dar problemas', l2: 'Fiable = cumplir. No dar problemas = no generar conflictos. Son cosas distintas.', l3: '¿Va a dar problemas? = convivencia en obra' },
      'c3_s4': { l1: 'Eso no es cómo lo demuestras', l2: 'No generar conflictos se demuestra con actitud, no con el portfolio.', l3: '¿Va a dar problemas? = convivencia en obra' },
      'c4_s1': { l1: 'El portfolio demuestra lo básico, pero ese no es su hueco', l2: 'El portfolio es la herramienta que lo demuestra. "¿Sabe lo básico?" es la pregunta que el entrevistador se hace.', l3: 'Así lo demuestras = tu portfolio responde antes de que pregunten' },
      'c4_s2': { l1: 'El portfolio no demuestra fiabilidad', l2: 'El portfolio muestra competencia técnica. La fiabilidad se demuestra con tu comportamiento.', l3: 'Así lo demuestras = el portfolio responde a "¿sabe lo básico?"' },
      'c4_s3': { l1: 'El portfolio no tiene que ver con los problemas', l2: 'El portfolio demuestra que sabes. No generar problemas se demuestra con actitud.', l3: 'Así lo demuestras = tu portfolio cubre la competencia técnica' },
      'c5_any': { l1: 'Un título universitario no es lo que buscan en oficios técnicos', l2: 'En una instaladora no piden títulos — piden que sepas lo básico, seas fiable y no generes problemas.', l3: 'En oficios técnicos: experiencia práctica > títulos' }
    }
  },
  3: {
    context: 'Te van a decir "cuéntame algo de ti". Todos meten la pata. Pon solo lo que funciona.',
    timer: 30,
    slots: [
      { id: 's1', label: 'Frase 1' },
      { id: 's2', label: 'Frase 2' },
      { id: 's3', label: 'Frase 3' },
      { id: 's4', label: 'Frase 4' },
      { id: 's5', label: 'Frase 5' }
    ],
    cards: [
      { id: 'c1', text: 'Soy electricista en formación', slot: 's1' },
      { id: 'c2', text: 'He completado un Bootkämp intensivo con prácticas reales', slot: 's2' },
      { id: 'c3', text: 'Tengo portfolio con evidencias verificadas', slot: 's3' },
      { id: 'c4', text: 'Busco una empresa donde seguir aprendiendo', slot: 's4' },
      { id: 'c5', text: 'Puedo empezar de ayudante ya', slot: 's5' },
      { id: 'c6', text: 'Desde pequeño siempre me gustó la electricidad', slot: null }
    ],
    feedback: {
      'c1_s2': { l1: 'Eso va primero', l2: 'Lo primero que dices es quién eres profesionalmente ahora mismo. No tu historia — tu presente.', l3: 'Frase 1: quién eres. Directo, sin rodeos.' },
      'c1_s3': { l1: 'Eso va primero', l2: 'Lo primero que dices es quién eres profesionalmente ahora mismo.', l3: 'Frase 1: quién eres.' },
      'c1_s4': { l1: 'Eso va primero', l2: 'Lo primero que dices es quién eres profesionalmente ahora mismo.', l3: 'Frase 1: quién eres.' },
      'c1_s5': { l1: 'Eso va primero', l2: 'Lo primero que dices es quién eres profesionalmente ahora mismo.', l3: 'Frase 1: quién eres.' },
      'c2_s1': { l1: 'Eso no va primero', l2: 'Primero dices quién eres, luego qué has hecho. La formación es el segundo paso.', l3: 'Frase 2: qué has hecho para formarte' },
      'c2_s3': { l1: 'Eso va antes', l2: 'La formación va antes que el portfolio. Primero qué has hecho, luego qué tienes para demostrarlo.', l3: 'Frase 2: qué has hecho para formarte' },
      'c2_s4': { l1: 'Eso va antes', l2: 'La formación va antes de decir qué buscas.', l3: 'Frase 2: qué has hecho para formarte' },
      'c2_s5': { l1: 'Eso va antes', l2: 'La formación va antes del cierre.', l3: 'Frase 2: qué has hecho para formarte' },
      'c3_s1': { l1: 'El portfolio va después de presentarte', l2: 'Primero te presentas, luego dices qué has hecho, y luego mencionas las pruebas.', l3: 'Frase 3: qué tienes para demostrarlo' },
      'c3_s2': { l1: 'El portfolio va después de la formación', l2: 'Primero dices qué has hecho, luego mencionas que tienes pruebas de ello.', l3: 'Frase 3: qué tienes para demostrarlo' },
      'c3_s4': { l1: 'El portfolio va antes de lo que buscas', l2: 'Primero demuestras lo que sabes, luego dices qué quieres.', l3: 'Frase 3: qué tienes para demostrarlo' },
      'c3_s5': { l1: 'El portfolio va antes del cierre', l2: 'Primero demuestras lo que sabes.', l3: 'Frase 3: qué tienes para demostrarlo' },
      'c4_s1': { l1: 'Lo que buscas va casi al final', l2: 'Primero el entrevistador necesita saber quién eres y qué has hecho.', l3: 'Frase 4: qué buscas — siempre en positivo' },
      'c4_s2': { l1: 'Lo que buscas va casi al final', l2: 'Primero el entrevistador necesita saber quién eres y qué has hecho.', l3: 'Frase 4: qué buscas — siempre en positivo' },
      'c4_s3': { l1: 'Lo que buscas va casi al final', l2: 'Primero el entrevistador necesita saber quién eres y qué has hecho.', l3: 'Frase 4: qué buscas — siempre en positivo' },
      'c4_s5': { l1: 'Lo que buscas va antes del cierre', l2: 'Primero dices qué quieres, luego rematas con tu disponibilidad.', l3: 'Frase 4: qué buscas' },
      'c5_s1': { l1: 'Eso es el remate final', l2: '"Puedo empezar ya" es la frase de cierre. Demuestra disponibilidad y ganas.', l3: 'Frase 5: qué puedes aportar desde el primer día' },
      'c5_s2': { l1: 'Eso es el remate final', l2: '"Puedo empezar ya" es la frase de cierre.', l3: 'Frase 5: qué puedes aportar desde el primer día' },
      'c5_s3': { l1: 'Eso es el remate final', l2: '"Puedo empezar ya" es la frase de cierre.', l3: 'Frase 5: qué puedes aportar desde el primer día' },
      'c5_s4': { l1: 'Eso es el remate final', l2: '"Puedo empezar ya" es la frase de cierre.', l3: 'Frase 5: qué puedes aportar desde el primer día' },
      'c6_any': { l1: '"Desde pequeño" es exactamente lo que NO hay que decir', l2: 'El entrevistador no quiere tu historia personal. Quiere saber quién eres profesionalmente, qué has hecho y qué buscas. 60 segundos máximo.', l3: 'NO contar tu vida desde el colegio. SÍ ir al grano profesional.' }
    }
  },
  2: {
    context: 'Te van a preguntar si tienes experiencia — y no la tienes. Y te van a preguntar qué haces cuando metes la pata. A ver.',
    timer: 28,
    slots: [
      { id: 's1', label: '¿Experiencia? — SÍ decir' },
      { id: 's2', label: '¿Experiencia? — SÍ decir' },
      { id: 's3', label: 'Error en obra — Paso 1' },
      { id: 's4', label: 'Error en obra — Paso 2' },
      { id: 's5', label: 'Error en obra — Paso 3' }
    ],
    cards: [
      { id: 'c1', text: 'Formación práctica intensiva con prácticas reales verificadas', slot: 's1' },
      { id: 'c2', text: 'Tengo portfolio — no he trabajado en empresa pero sé lo básico', slot: 's2' },
      { id: 'c3', text: 'Reconocer el error', slot: 's3' },
      { id: 'c4', text: 'Avisar al encargado', slot: 's4' },
      { id: 'c5', text: 'Corregirlo', slot: 's5' },
      { id: 'c6', text: 'No, no tengo ninguna experiencia', slot: null },
      { id: 'c7', text: 'Intentar arreglarlo sin que nadie se entere', slot: null }
    ],
    feedback: {
      'c1_s3': { l1: 'Eso es una respuesta sobre experiencia, no sobre errores', l2: 'La formación práctica es lo que dices cuando te preguntan si tienes experiencia.', l3: '¿Experiencia? → reencuadra con formación + portfolio' },
      'c1_s4': { l1: 'Eso es una respuesta sobre experiencia, no sobre errores', l2: 'La formación práctica es lo que dices cuando te preguntan si tienes experiencia.', l3: '¿Experiencia? → reencuadra con formación + portfolio' },
      'c1_s5': { l1: 'Eso es una respuesta sobre experiencia, no sobre errores', l2: 'La formación práctica es lo que dices cuando te preguntan si tienes experiencia.', l3: '¿Experiencia? → reencuadra con formación + portfolio' },
      'c2_s3': { l1: 'Eso responde a la experiencia, no al error', l2: 'Mencionar el portfolio es para demostrar competencia. Ante un error: reconocer, avisar, corregir.', l3: '¿Experiencia? → formación + portfolio' },
      'c2_s4': { l1: 'Eso responde a la experiencia, no al error', l2: 'Mencionar el portfolio es para demostrar competencia.', l3: '¿Experiencia? → formación + portfolio' },
      'c2_s5': { l1: 'Eso responde a la experiencia, no al error', l2: 'Mencionar el portfolio es para demostrar competencia.', l3: '¿Experiencia? → formación + portfolio' },
      'c3_s1': { l1: 'Reconocer el error no es sobre experiencia', l2: 'Eso va con la pregunta de errores en obra, no con la de experiencia.', l3: 'Error → reconocer + avisar + corregir' },
      'c3_s2': { l1: 'Reconocer el error no es sobre experiencia', l2: 'Eso va con la pregunta de errores en obra.', l3: 'Error → reconocer + avisar + corregir' },
      'c3_s4': { l1: 'Reconocer va primero', l2: 'Antes de avisar o corregir, lo primero es reconocer que te has equivocado. Sin excusas.', l3: 'Paso 1: reconocer. Siempre primero.' },
      'c3_s5': { l1: 'Reconocer va primero', l2: 'Antes de avisar o corregir, lo primero es reconocer.', l3: 'Paso 1: reconocer. Siempre primero.' },
      'c4_s1': { l1: 'Avisar no es sobre experiencia', l2: 'Eso va con la pregunta de errores en obra.', l3: 'Error → reconocer + avisar + corregir' },
      'c4_s2': { l1: 'Avisar no es sobre experiencia', l2: 'Eso va con la pregunta de errores en obra.', l3: 'Error → reconocer + avisar + corregir' },
      'c4_s3': { l1: 'Avisar va en segundo lugar', l2: 'Primero reconoces el error, luego avisas al encargado, luego corriges.', l3: 'Paso 2: avisar al encargado. No esconderlo.' },
      'c4_s5': { l1: 'Avisar va en segundo lugar', l2: 'Primero reconoces, luego avisas, luego corriges.', l3: 'Paso 2: avisar al encargado.' },
      'c5_s1': { l1: 'Corregir no es sobre experiencia', l2: 'Eso va con la pregunta de errores en obra.', l3: 'Error → reconocer + avisar + corregir' },
      'c5_s2': { l1: 'Corregir no es sobre experiencia', l2: 'Eso va con la pregunta de errores en obra.', l3: 'Error → reconocer + avisar + corregir' },
      'c5_s3': { l1: 'Corregir va al final', l2: 'No puedes corregir sin antes haber reconocido el error y avisado. El orden importa.', l3: 'Paso 3: corregir. Después de reconocer y avisar.' },
      'c5_s4': { l1: 'Corregir va al final', l2: 'No puedes corregir sin antes haber avisado.', l3: 'Paso 3: corregir. Después de avisar.' },
      'c6_any': { l1: 'Eso es exactamente lo que NO hay que decir', l2: 'Decir "no, ninguna" cierra la puerta. Siempre reencuadra: tienes formación práctica, tienes portfolio, sabes lo básico.', l3: 'NUNCA decir "no tengo experiencia" a secas. Reencuadrar con lo que SÍ tienes.' },
      'c7_any': { l1: 'Eso es lo peor que puedes hacer en obra', l2: 'Esconder un error puede provocar un problema mayor. El entrevistador quiere saber que gestionas los problemas, no que los escondes.', l3: 'Error en obra: reconocer + avisar + corregir. NUNCA esconder.' }
    }
  },
  1: {
    context: 'Último piso. Las preguntas que te van a hacer y lo que quieren oír de verdad. Si aciertas esto, llegas a planta baja.',
    timer: 25,
    slots: [
      { id: 's1', label: '¿Por qué este oficio? → Quieren oír...' },
      { id: 's2', label: 'Buena pregunta para el entrevistador' },
      { id: 's3', label: 'Buena pregunta para el entrevistador' },
      { id: 's4', label: '¿Quién entrevista en una pyme?' },
      { id: 's5', label: '¿Qué NO hacer en una entrevista?' }
    ],
    cards: [
      { id: 'c1', text: 'Me gusta trabajar con las manos y ver el resultado', slot: 's1' },
      { id: 'c2', text: '¿Cómo es el primer mes para un ayudante?', slot: 's2' },
      { id: 'c3', text: '¿Con qué tipo de instalaciones trabajáis más?', slot: 's3' },
      { id: 'c4', text: 'El dueño de la empresa o el encargado de obra', slot: 's4' },
      { id: 'c5', text: 'Decir "no sé" y callarte', slot: 's5' },
      { id: 'c6', text: 'Porque no encontré otra cosa', slot: null },
      { id: 'c7', text: 'Mi madre dice que soy muy trabajador', slot: null }
    ],
    feedback: {
      'c1_s2': { l1: 'Eso responde a "¿por qué este oficio?"', l2: 'Cuando preguntan por qué este oficio, quieren motivación real.', l3: '¿Por qué este oficio? → motivación real, no historia épica' },
      'c1_s3': { l1: 'Eso responde a "¿por qué este oficio?"', l2: 'Cuando preguntan por qué este oficio, quieren motivación real.', l3: '¿Por qué este oficio? → motivación real' },
      'c1_s4': { l1: 'Eso responde a "¿por qué este oficio?"', l2: '"Me gusta trabajar con las manos" es motivación, no quién entrevista.', l3: '¿Por qué este oficio? → motivación real' },
      'c1_s5': { l1: 'Eso responde a "¿por qué este oficio?"', l2: '"Me gusta trabajar con las manos" es algo bueno que decir, no algo malo.', l3: '¿Por qué este oficio? → motivación real' },
      'c2_s1': { l1: 'Esa es una buena pregunta para el entrevistador', l2: 'Tener una pregunta preparada demuestra interés real.', l3: 'Siempre tener 1 pregunta preparada para el final' },
      'c2_s4': { l1: 'Esa es una pregunta, no una respuesta sobre quién entrevista', l2: 'Es una buena pregunta para el final de la entrevista.', l3: 'Buena pregunta para el entrevistador' },
      'c2_s5': { l1: 'Esa es una buena pregunta, no una mala', l2: 'Preguntar por el primer mes demuestra interés.', l3: 'Buena pregunta para el entrevistador' },
      'c3_s1': { l1: 'Esa es una buena pregunta para el entrevistador', l2: 'Preguntar por el tipo de trabajo demuestra interés técnico.', l3: 'Buenas preguntas: sobre el trabajo, el equipo, el día a día' },
      'c3_s4': { l1: 'Esa es una pregunta, no una respuesta sobre quién entrevista', l2: 'Es una buena pregunta para el final de la entrevista.', l3: 'Buena pregunta para el entrevistador' },
      'c3_s5': { l1: 'Esa es una buena pregunta, no una mala', l2: 'Preguntar por instalaciones demuestra interés técnico.', l3: 'Buena pregunta para el entrevistador' },
      'c4_s1': { l1: 'Eso responde a quién te entrevista', l2: 'En una pyme no te entrevista RRHH. Es el dueño o el encargado. Directo y técnico.', l3: 'En oficios técnicos: menos protocolo, más directo' },
      'c4_s2': { l1: 'Eso responde a quién te entrevista, no es una pregunta', l2: 'El dueño o encargado es quién te entrevista en una pyme.', l3: '¿Quién entrevista en pyme? = dueño o encargado' },
      'c4_s3': { l1: 'Eso responde a quién te entrevista, no es una pregunta', l2: 'El dueño o encargado es quién te entrevista en una pyme.', l3: '¿Quién entrevista en pyme? = dueño o encargado' },
      'c4_s5': { l1: 'Eso responde a quién te entrevista', l2: 'No es algo que NO debas preguntar — es un dato sobre quién entrevista.', l3: '¿Quién entrevista en pyme? = dueño o encargado' },
      'c5_s1': { l1: 'Eso es lo que NO debes hacer', l2: 'Decir "no sé" y callarte cierra la conversación. Siempre añade algo: "no sé, pero lo que haría es..."', l3: '¿Qué NO hacer? = decir "no sé" y parar' },
      'c5_s2': { l1: 'Eso no es una buena pregunta — es lo que NO debes hacer', l2: 'Decir "no sé" sin más demuestra falta de interés. Siempre intenta aportar algo.', l3: '¿Qué NO hacer? = quedarte en blanco' },
      'c5_s3': { l1: 'Eso no es una buena pregunta — es lo que NO debes hacer', l2: 'Decir "no sé" sin más demuestra falta de interés.', l3: '¿Qué NO hacer? = quedarte en blanco' },
      'c5_s4': { l1: 'Eso no es quién te entrevista — es lo que NO debes hacer', l2: 'Decir "no sé" y callarte es lo peor en una entrevista. Siempre añade algo.', l3: '¿Qué NO hacer? = decir "no sé" y parar' },
      'c6_any': { l1: 'Eso destruye una entrevista', l2: 'Si dices que estás ahí porque no encontraste otra cosa, el entrevistador entiende que te irás en cuanto puedas.', l3: '¿Por qué este oficio? → razón honesta y concreta. NUNCA "porque no había otra cosa".' },
      'c7_any': { l1: 'Lo que diga tu madre no cuenta en una entrevista', l2: 'El entrevistador quiere hechos y evidencias, no opiniones de terceros. Demuestra lo que vales con tu portfolio y tu actitud.', l3: 'En una entrevista: hechos propios y evidencias. Nunca referencias familiares.' }
    }
  }
};

const PACO_MESSAGES = {
  aciertoRotation: ['Ahí va.', 'Correcto.', 'Eso.'],
  aciertoRapido: 'No está mal.',
  pisoLimpio: 'Limpio. Así se hace.',
  pisoConErrores: 'Has llegado, pero raspando.',
  timerExpired: 'Se acabó el tiempo. Sin bonus, pero sigue.',
  errorGenerico: 'No.',
  distractorGenerico: 'Esa no va en ningún sitio. Piensa.',
  ultimaVida: 'Te queda una vida. Céntrate.',
  gameOver: 'Se acabó. No has llegado abajo.',
  resultadoAlto: 'No está mal. Pásate el lunes por la obra.',
  resultadoMedio: 'Algo sabes. Pero repasa lo del STAR, ¿eh?',
  resultadoBajo: 'Chaval… hazte un favor y repasa antes de ir a ninguna entrevista.'
};

let aciertoIdx = 0;

// --- DOM refs ---
const $ = id => document.getElementById(id);

// --- Init ---
(function initAssets() {
  // Set all image sources from Cloudinary
  document.querySelectorAll('.silhouette').forEach(el => el.src = ASSETS.silueta);
  document.querySelectorAll('.paco-avatar').forEach(el => el.src = ASSETS.paco_happy);
  // Set backgrounds
  $('intro').style.backgroundImage = `url('${ASSETS.bg_ascensor}')`;
  $('play').style.backgroundImage = `url('${ASSETS.bg_ascensor}')`;
})();

$('btn-start').addEventListener('click', startGame);
$('btn-retry').addEventListener('click', () => { resetGame(); startGame(); });
$('btn-understood').addEventListener('click', closeOverlay);
$('btn-hint').addEventListener('click', useHint);

function resetGame() {
  S.lives = 3;
  S.floorsCompleted = 0;
  S.currentFloor = 5;
  S.tutorialStep = 0;
  S.cardRetries = {};
  S.floorErrors = 0;
  S.taskCompleted = false;
  clearInterval(S.timerInterval);
  updateHUD();
}

function startGame() {
  resetGame();
  showScreen('play');
  showFloorTransition(5, () => loadFloor(5));
}

// --- HUD ---
function updateHUD() {
  const hearts = $('hud-lives').querySelectorAll('.heart');
  hearts.forEach((h, i) => h.classList.toggle('lost', i >= S.lives));
}

// --- Floor transition ---
function showFloorTransition(floor, cb) {
  const el = $('floor-transition');
  const label = floor === 0 ? 'PB' : 'PISO ' + floor;
  $('transition-floor').textContent = label;
  el.classList.remove('hidden');

  // Update display
  $('floor-display').textContent = floor === 0 ? 'PB' : floor;

  // Elevator move effect
  const play = $('play');
  play.classList.add('elevator-move');
  setTimeout(() => play.classList.remove('elevator-move'), 300);

  setTimeout(() => {
    el.classList.add('hidden');
    if (cb) cb();
  }, 1200);
}

// --- Load floor ---
function loadFloor(floor) {
  S.currentFloor = floor;
  S.floorErrors = 0;
  S.cardRetries = {};
  S.hintUsedThisFloor = false;
  $('btn-hint').classList.remove('used');
  $('btn-hint').textContent = 'Pista';

  const data = FLOORS[floor];
  if (!data) { endGame(); return; }

  // Show context — stays visible until first correct card
  showBubble(data.context, true);
  setPaco('happy');

  // Render slots
  const slotsArea = $('slots-area');
  slotsArea.innerHTML = '';
  data.slots.forEach(s => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.dataset.slotId = s.id;
    div.textContent = s.label;
    slotsArea.appendChild(div);
  });

  // Render cards (shuffled)
  const cardsArea = $('cards-area');
  cardsArea.innerHTML = '';
  // Floors with many cards: single column on the left to not cover Paco
  cardsArea.classList.toggle('single-column', floor <= 3 && floor >= 1);
  const shuffled = [...data.cards].sort(() => Math.random() - 0.5);
  shuffled.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.cardId = c.id;
    div.dataset.correctSlot = c.slot || '';
    div.textContent = c.text;
    div.style.animationDelay = (i * 0.1) + 's';
    div.classList.add('pop-in');
    cardsArea.appendChild(div);
    setupCardDrag(div);
  });

  // Start timer after context bubble
  setTimeout(() => {
    if (S.tutorialDone || floor !== 5) {
      startTimer(data.timer);
    } else {
      startTutorial();
    }
  }, 1200);
}

// --- Tutorial ---
function startTutorial() {
  S.tutorialStep = 1;
  showBubble('¿Ves esas tarjetas? Arrástralas al hueco que les toque. Prueba con esa.');
  // Highlight first correct card
  highlightFirstCard();
}

function highlightFirstCard() {
  const cards = $('cards-area').querySelectorAll('.card:not(.placed)');
  cards.forEach(c => c.style.opacity = '1');
  const data = FLOORS[S.currentFloor];
  const firstCorrect = data.cards.find(c => c.slot);
  if (firstCorrect) {
    const el = $('cards-area').querySelector(`[data-card-id="${firstCorrect.id}"]`);
    if (el) { el.style.opacity = '1'; el.style.border = '2px solid ' + getComputedStyle(document.documentElement).getPropertyValue('--lemon').trim(); }
  }
}

function advanceTutorial() {
  S.tutorialStep++;
  if (S.tutorialStep === 2) {
    showBubble('Ojo — hay tarjetas trampa que no van en ningún hueco. Si no encaja, déjala.');
    highlightFirstCard();
  } else if (S.tutorialStep >= 3) {
    S.tutorialDone = true;
    showBubble('Venga, el resto por tu cuenta. Date prisa, que esto se mueve.');
    // Restore all cards
    $('cards-area').querySelectorAll('.card:not(.placed)').forEach(c => {
      c.style.opacity = '1';
      c.style.border = '2px solid var(--turquesa)';
    });
    setTimeout(() => startTimer(FLOORS[S.currentFloor].timer), 800);
  }
}

// --- Timer ---
function startTimer(seconds) {
  S.timerTotal = seconds;
  S.timerRemaining = seconds;
  clearInterval(S.timerInterval);
  S.timerInterval = setInterval(() => {
    S.timerRemaining -= 0.1;
    updateTimerVisuals();
    if (S.timerRemaining <= 0) {
      clearInterval(S.timerInterval);
      onTimerExpired();
    }
  }, 100);
}

function pauseTimer() { clearInterval(S.timerInterval); }

function resumeTimer() {
  S.timerInterval = setInterval(() => {
    S.timerRemaining -= 0.1;
    updateTimerVisuals();
    if (S.timerRemaining <= 0) {
      clearInterval(S.timerInterval);
      onTimerExpired();
    }
  }, 100);
}

function updateTimerVisuals() {
  const pct = S.timerRemaining / S.timerTotal;
  const ll = $('light-left');
  const lr = $('light-right');

  ll.className = 'light';
  lr.className = 'light';

  if (pct <= 0.1) {
    ll.classList.add('blink-frantic');
    lr.classList.add('blink-frantic');
  } else if (pct <= 0.25) {
    ll.classList.add('blink-fast');
    lr.classList.add('blink-fast');
  } else if (pct <= 0.5) {
    ll.classList.add('blink-slow');
    lr.classList.add('blink-slow');
  }
}

function onTimerExpired() {
  // Timer expired = no bonus, but NO life lost. Just restart timer.
  vibrate('medium');
  setPaco('worried');
  showBubble('Se acabó el tiempo. Sin bonus de velocidad, pero sigue.');

  // Restart timer, keep placed cards
  setTimeout(() => {
    setPaco('happy');
    startTimer(FLOORS[S.currentFloor].timer);
  }, 1500);
}

// --- Hint ---
function useHint() {
  if (S.hintUsedThisFloor) return;
  S.hintUsedThisFloor = true;
  $('btn-hint').classList.add('used');
  $('btn-hint').textContent = 'Pista usada';

  // Find the first unplaced correct card and highlight its target slot
  const data = FLOORS[S.currentFloor];
  const placedIds = new Set();
  $('cards-area').querySelectorAll('.card.placed').forEach(c => placedIds.add(c.dataset.cardId));

  const nextCard = data.cards.find(c => c.slot && !placedIds.has(c.id));
  if (!nextCard) return;

  // Highlight the target slot briefly
  const slotEl = $('slots-area').querySelector(`[data-slot-id="${nextCard.slot}"]`);
  const cardEl = $('cards-area').querySelector(`[data-card-id="${nextCard.id}"]`);

  if (slotEl) {
    slotEl.style.borderColor = 'var(--lemon)';
    slotEl.style.borderStyle = 'solid';
    slotEl.style.boxShadow = '0 0 12px rgba(255, 255, 171, 0.4)';
    setTimeout(() => {
      slotEl.style.borderColor = '';
      slotEl.style.borderStyle = '';
      slotEl.style.boxShadow = '';
    }, 3000);
  }

  if (cardEl) {
    cardEl.style.borderColor = 'var(--lemon)';
    cardEl.style.boxShadow = '0 0 12px rgba(255, 255, 171, 0.4)';
    setTimeout(() => {
      cardEl.style.borderColor = '';
      cardEl.style.boxShadow = '';
    }, 3000);
  }

  showBubble('Esa tarjeta va en ese hueco. Fíjate.');
  vibrate('light');
}

// --- Floor completion ---
function checkFloorComplete() {
  const data = FLOORS[S.currentFloor];
  const correctCards = data.cards.filter(c => c.slot);
  const placed = $('cards-area').querySelectorAll('.card.placed');
  if (placed.length >= correctCards.length) {
    clearInterval(S.timerInterval);
    S.floorsCompleted++;

    vibrate('success', [0, 100, 50, 100, 50, 200]);
    setPaco(S.floorErrors === 0 ? 'celebrating' : 'happy');
    showBubble(S.floorErrors === 0 ? PACO_MESSAGES.pisoLimpio : PACO_MESSAGES.pisoConErrores);

    // Flash all slots green
    $('slots-area').querySelectorAll('.slot').forEach(s => {
      s.classList.add('correct', 'flash-green');
    });

    setTimeout(() => nextFloor(), 1800);
  }
}

function nextFloor() {
  const next = S.currentFloor - 1;
  if (next < 1) {
    endGame();
  } else {
    showFloorTransition(next, () => loadFloor(next));
  }
}

// --- End game ---
function endGame() {
  clearInterval(S.timerInterval);

  const completed = S.floorsCompleted;
  const total = 5;

  // TASK_COMPLETED if all 5 floors done
  if (completed >= total && !S.taskCompleted) {
    S.taskCompleted = true;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
    }
    vibrate('success', [0, 100, 50, 100, 50, 100, 50, 300]);
  } else {
    vibrate('medium');
  }

  // Determine tier
  let msg, avatar;
  if (completed >= total) {
    msg = PACO_MESSAGES.resultadoAlto; avatar = 'celebrating';
  } else if (completed >= 3) {
    msg = PACO_MESSAGES.resultadoMedio; avatar = 'happy';
  } else {
    msg = PACO_MESSAGES.resultadoBajo; avatar = 'worried';
  }

  // Set background
  const resultsScreen = $('results');
  if (completed >= total && ASSETS.bg_puertas_abiertas) {
    resultsScreen.style.backgroundImage = `url('${ASSETS.bg_puertas_abiertas}')`;
  } else if (ASSETS.bg_error) {
    resultsScreen.style.backgroundImage = `url('${ASSETS.bg_error}')`;
  }

  // Update results screen
  $('paco-results').src = ASSETS['paco_' + avatar];
  $('results-bubble').textContent = msg;
  $('results-floor').textContent = completed >= total
    ? 'Has llegado a planta baja'
    : `Has llegado al piso ${S.currentFloor}`;

  showScreen('results');
}

// --- Card drag ---
function setupCardDrag(el) {
  let startX, startY, moved, origLeft, origTop;

  function onStart(e) {
    if (el.classList.contains('placed')) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    moved = false;

    const rect = el.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;

    el.classList.add('dragging');
    el.style.position = 'fixed';
    el.style.left = origLeft + 'px';
    el.style.top = origTop + 'px';
    el.style.width = rect.width + 'px';
    el.style.zIndex = '500';

    vibrate('light');

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchend', onEnd);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchcancel', onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 8) return;
    moved = true;
    el.style.left = (origLeft + dx) + 'px';
    el.style.top = (origTop + dy) + 'px';
  }

  function onEnd(e) {
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchend', onEnd);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchcancel', onEnd);

    el.classList.remove('dragging');

    if (!moved) {
      resetCardPosition(el);
      return;
    }

    // Check slot proximity
    const cardRect = el.getBoundingClientRect();
    const cardCX = cardRect.left + cardRect.width / 2;
    const cardCY = cardRect.top + cardRect.height / 2;

    let closestSlot = null;
    let closestDist = Infinity;

    $('slots-area').querySelectorAll('.slot:not(.correct)').forEach(slot => {
      const sr = slot.getBoundingClientRect();
      const sx = sr.left + sr.width / 2;
      const sy = sr.top + sr.height / 2;
      const dist = Math.hypot(cardCX - sx, cardCY - sy);
      if (dist < closestDist) {
        closestDist = dist;
        closestSlot = slot;
      }
    });

    if (closestSlot && closestDist <= 60) {
      handleDrop(el, closestSlot);
    } else {
      resetCardPosition(el);
    }
  }

  el.addEventListener('touchstart', onStart, { passive: false });
  el.addEventListener('mousedown', onStart);
}

function handleDrop(card, slot) {
  const cardId = card.dataset.cardId;
  const correctSlot = card.dataset.correctSlot;
  const slotId = slot.dataset.slotId;

  // Distractor on any slot
  if (!correctSlot) {
    onError(card, slot, cardId, slotId, true);
    return;
  }

  // Correct
  if (correctSlot === slotId) {
    onCorrect(card, slot);
  } else {
    onError(card, slot, cardId, slotId, false);
  }
}

function onCorrect(card, slot) {
  // Hide card from cards area and fill the slot with its text
  card.classList.add('placed');
  card.style.display = 'none';
  slot.textContent = card.textContent;
  slot.classList.add('correct', 'flash-green');
  slot.style.color = '#fff';
  slot.style.fontWeight = '700';

  vibrate('success');

  // Paco reaction
  aciertoIdx = (aciertoIdx + 1) % PACO_MESSAGES.aciertoRotation.length;
  showBubble(PACO_MESSAGES.aciertoRotation[aciertoIdx]);

  // Tutorial advance
  if (!S.tutorialDone && S.currentFloor === 5) {
    advanceTutorial();
  }

  checkFloorComplete();
}

function onError(card, slot, cardId, slotId, isDistractor) {
  S.floorErrors++;
  S.cardRetries[cardId] = true;

  // Lose a life on every wrong placement
  S.lives--;
  updateHUD();

  vibrate('error');
  slot.classList.add('flash-red');
  setTimeout(() => slot.classList.remove('flash-red'), 400);

  card.classList.add('shake');
  setTimeout(() => { card.classList.remove('shake'); resetCardPosition(card); }, 400);

  setPaco('worried');
  showBubble(isDistractor ? PACO_MESSAGES.distractorGenerico : PACO_MESSAGES.errorGenerico);

  // Get feedback
  const floor = FLOORS[S.currentFloor];
  const key = isDistractor ? cardId + '_any' : cardId + '_' + slotId;
  const fb = floor.feedback[key] || floor.feedback[cardId + '_any'];

  if (fb) {
    pauseTimer();
    setTimeout(() => showOverlay(fb.l1, fb.l2, fb.l3), 500);
  }

  // Check game over
  if (S.lives <= 0) {
    clearInterval(S.timerInterval);
    showBubble(PACO_MESSAGES.gameOver);
    setTimeout(() => endGame(), 1500);
    return;
  }

  if (S.lives === 1) {
    setTimeout(() => showBubble(PACO_MESSAGES.ultimaVida), 1500);
  }

  // Tutorial advance on distractor attempt
  if (!S.tutorialDone && S.currentFloor === 5 && isDistractor) {
    advanceTutorial();
  }
}

function resetCardPosition(card) {
  card.style.position = '';
  card.style.left = '';
  card.style.top = '';
  card.style.width = '';
  card.style.zIndex = '';
}

// --- Overlay ---
function showOverlay(l1, l2, l3) {
  $('overlay-line1').textContent = l1;
  $('overlay-line2').textContent = l2;
  $('overlay-line3').textContent = l3;
  $('overlay').classList.remove('hidden');
}

function closeOverlay() {
  $('overlay').classList.add('hidden');
  resumeTimer();
}

// --- Bubble ---
function showBubble(text, persistent) {
  const bubble = $('play-bubble');
  bubble.textContent = text;
  bubble.classList.add('visible');
  clearTimeout(S.bubbleTimeout);
  if (!persistent) {
    S.bubbleTimeout = setTimeout(() => bubble.classList.remove('visible'), 3000);
  }
}

function hideBubble() {
  clearTimeout(S.bubbleTimeout);
  $('play-bubble').classList.remove('visible');
}

// --- Paco state ---
function setPaco(state) {
  $('paco-play').src = ASSETS['paco_' + state];
}

// --- Floating points ---
function showFloatingPoints(text, refEl) {
  const el = document.createElement('div');
  el.className = 'floating-points';
  el.textContent = text;
  const rect = refEl.getBoundingClientRect();
  el.style.left = rect.left + 'px';
  el.style.top = (rect.top - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}
