// Cozy Dombyto — Item & rule definitions
(function () {

  window.ITEMS_DATA = {
    furniture: [
      { id: 'tablero',    emoji: '🔲', label: 'Tablero',        gridW: 2, gridH: 1, accepts: ['herramienta'], required: true },
      { id: 'mesa',       emoji: '🪑', label: 'Mesa',           gridW: 2, gridH: 2, accepts: ['herramienta'], required: true },
      { id: 'estanteria', emoji: '🗄️', label: 'Estantería',    gridW: 1, gridH: 2, accepts: ['material'],    required: true },
      { id: 'contenedor', emoji: '🗑️', label: 'Contenedor',    gridW: 1, gridH: 1, accepts: ['residuo'],     required: true },
      { id: 'lampara',    emoji: '💡', label: 'Lámpara',        gridW: 1, gridH: 1, accepts: [],              required: true },
      { id: 'soporte',    emoji: '📱', label: 'Soporte móvil',  gridW: 1, gridH: 1, accepts: [],              required: true }
    ],

    herramientas: [
      { id: 'destornillador', emoji: '🪛', label: 'Destornillador', category: 'herramienta', requiredByYaiza: true,  correctFurniture: ['tablero', 'mesa'] },
      { id: 'alicates',      emoji: '🔧', label: 'Alicates',       category: 'herramienta', requiredByYaiza: true,  correctFurniture: ['tablero', 'mesa'] },
      { id: 'pelacables',    emoji: '✂️', label: 'Pelacables',     category: 'herramienta', requiredByYaiza: true,  correctFurniture: ['tablero', 'mesa'] },
      { id: 'multimetro',    emoji: '📟', label: 'Multímetro',     category: 'herramienta', requiredByYaiza: true,  correctFurniture: ['tablero', 'mesa'] },
      { id: 'tijera',        emoji: '✂️', label: 'Tijera eléctr.', category: 'herramienta', requiredByYaiza: false, correctFurniture: ['tablero', 'mesa'] },
      { id: 'llave',         emoji: '🔩', label: 'Llave inglesa',  category: 'herramienta', requiredByYaiza: false, correctFurniture: ['tablero', 'mesa'] },
      { id: 'taladro',       emoji: '🔨', label: 'Taladro',        category: 'herramienta', requiredByYaiza: false, correctFurniture: ['tablero', 'mesa'] },
      { id: 'nivel_laser',   emoji: '📐', label: 'Nivel láser',    category: 'herramienta', requiredByYaiza: false, correctFurniture: ['tablero', 'mesa'] }
    ],

    material: [
      { id: 'diferencial',    emoji: '⚡', label: 'Diferencial',     category: 'material', requiredByYaiza: true,  correctFurniture: ['estanteria'] },
      { id: 'magnetotermico', emoji: '🔌', label: 'Magnetotérmico', category: 'material', requiredByYaiza: false, correctFurniture: ['estanteria'] },
      { id: 'cable',          emoji: '🔌', label: 'Cable unipolar', category: 'material', requiredByYaiza: false, correctFurniture: ['estanteria'] },
      { id: 'tubo',           emoji: '🟫', label: 'Tubo corrugado', category: 'material', requiredByYaiza: false, correctFurniture: ['estanteria'] },
      { id: 'bridas',         emoji: '🔗', label: 'Bridas',         category: 'material', requiredByYaiza: false, correctFurniture: ['estanteria'] },
      { id: 'cinta',          emoji: '🟦', label: 'Cinta aislante', category: 'material', requiredByYaiza: false, correctFurniture: ['estanteria'] },
      { id: 'guantes',        emoji: '🧤', label: 'Guantes',        category: 'material', requiredByYaiza: false, correctFurniture: ['estanteria'] }
    ],

    residuos: [
      { id: 'retales',        emoji: '🪢', label: 'Retales cable',   category: 'residuo', requiredByYaiza: false, correctFurniture: ['contenedor'] },
      { id: 'fundas',         emoji: '🟡', label: 'Fundas peladas',  category: 'residuo', requiredByYaiza: false, correctFurniture: ['contenedor'] },
      { id: 'envases',        emoji: '📦', label: 'Envases vacíos',  category: 'residuo', requiredByYaiza: false, correctFurniture: ['contenedor'] },
      { id: 'bridas_cortadas', emoji: '〰️', label: 'Bridas cortadas', category: 'residuo', requiredByYaiza: false, correctFurniture: ['contenedor'] }
    ],

    decorativos_neutros: [
      { id: 'poster',     emoji: '🖼️', label: 'Póster',     category: 'decorativo_neutro', correctFurniture: [] },
      { id: 'calendario', emoji: '📅', label: 'Calendario', category: 'decorativo_neutro', correctFurniture: [] },
      { id: 'radio',      emoji: '📻', label: 'Radio',      category: 'decorativo_neutro', correctFurniture: [] }
    ],

    decorativos_comicos: [
      { id: 'perro',     emoji: '🐕', label: 'Perro',     category: 'decorativo_comico', failMessage: '¡El perro quería caricias y no he podido salir!' },
      { id: 'consola',   emoji: '🎮', label: 'Consola',   category: 'decorativo_comico', failMessage: '¡Me he tropezado con el mando de la consola!' },
      { id: 'monopatin', emoji: '🛹', label: 'Monopatín', category: 'decorativo_comico', failMessage: '¡He resbalado con el monopatín!' },
      { id: 'pelota',    emoji: '⚽', label: 'Pelota',    category: 'decorativo_comico', failMessage: '¡He pisado la pelota y he salido volando!' },
      { id: 'hamaca',    emoji: '🏖️', label: 'Hamaca',    category: 'decorativo_comico', failMessage: '¡Me he sentado en la hamaca y no me he podido levantar!' }
    ]
  };

  // Inventory tabs map to data keys
  window.INVENTORY_TABS = [
    { id: 'muebles',       label: '🔧 Muebles',  dataKey: 'furniture' },
    { id: 'herramientas',  label: '🛠️ Herr.',     dataKey: 'herramientas' },
    { id: 'material',      label: '📦 Mat.',       dataKeys: ['material', 'residuos'] },
    { id: 'otros',         label: '🎲 Otros',      dataKeys: ['decorativos_neutros', 'decorativos_comicos'] }
  ];

  // Rule failure messages
  window.RULES_DATA = {
    rule1: {
      messages: {
        tablero:    '¡No tengo dónde colgar las herramientas! ¡Falta el tablero!',
        mesa:       '¡No tengo ni una mesa! ¿Dónde preparo la bolsa?',
        estanteria: '¡No hay estantería! ¿Dónde guardo el material?',
        contenedor: '¡No hay contenedor de residuos! ¡Esto es un desastre!'
      }
    },
    rule2: {
      messages: {
        lampara: '¡No veo nada! ¡La luz no está puesta!',
        soporte: '¡No tengo el móvil a mano! ¡No puedo ver la dirección de Yaiza!'
      }
    },
    rule3: {
      messages: {
        destornillador: '¡El destornillador sigue en la caja sin abrir! No me lo puedo llevar.',
        alicates:       '¡Los alicates no están en el taller! ¡Los necesito!',
        pelacables:     '¡El pelacables no está! ¿Cómo pelo los cables?',
        multimetro:     '¡El multímetro sigue en la caja sin abrir! No me lo puedo llevar.',
        diferencial:    '¡El diferencial de repuesto no está en la estantería! Lo necesito.'
      }
    },
    rule4: {
      misplaced: '¡{item} estaba en {furniture}! He tardado un montón buscando.'
    }
  };

  // Helper: find any item definition by id
  window.findItemDef = function (id) {
    var cats = Object.keys(ITEMS_DATA);
    for (var c = 0; c < cats.length; c++) {
      var arr = ITEMS_DATA[cats[c]];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === id) return arr[i];
      }
    }
    return null;
  };

})();
