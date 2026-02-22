// Cozy Dombyto — Evaluation of the 4 rules
(function () {

  window.RulesEngine = {

    evaluate: function (state) {
      var result = { score: 0, failedRule: null, failMessage: '', successes: [] };

      // ---- Rule 1: Main furniture placed (tablero, mesa, estantería, contenedor) ----
      var mainFurniture = ['tablero', 'mesa', 'estanteria', 'contenedor'];
      var placed = state.getPlacedFurnitureIds();
      for (var i = 0; i < mainFurniture.length; i++) {
        if (placed.indexOf(mainFurniture[i]) === -1) {
          result.failedRule = 1;
          result.failMessage = RULES_DATA.rule1.messages[mainFurniture[i]];
          return result;
        }
      }
      result.score += 25;
      result.successes.push('Muebles principales colocados');

      // ---- Rule 2: Lamp placed ----
      if (placed.indexOf('lampara') === -1) {
        result.failedRule = 2;
        result.failMessage = RULES_DATA.rule2.messages.lampara;
        return result;
      }
      result.score += 25;
      result.successes.push('Luz preparada');

      // ---- Rule 3: 5 required items on grid (not in inventory) ----
      var requiredItems = ['destornillador', 'alicates', 'pelacables', 'multimetro', 'diferencial', 'soporte'];
      var onGrid = state.getItemsOnGrid();
      for (var k = 0; k < requiredItems.length; k++) {
        if (onGrid.indexOf(requiredItems[k]) === -1) {
          result.failedRule = 3;
          result.failMessage = RULES_DATA.rule3.messages[requiredItems[k]];
          return result;
        }
      }
      result.score += 25;
      result.successes.push('Herramientas necesarias preparadas');

      // ---- Rule 4: No floor items, no comic decoratives, items on correct furniture ----
      var origins = state.getOriginCells();

      // 4a: Check for items on the floor (not on any furniture)
      if (state.hasFloorItems()) {
        var floorItemId = state.floorItems[0].itemId;
        var floorDef = window.findItemDef(floorItemId);
        // Check if it's a comic decorative first
        if (floorDef && floorDef.category === 'decorativo_comico') {
          result.failedRule = 4;
          result.failMessage = floorDef.failMessage;
          return result;
        }
        result.failedRule = 4;
        result.failMessage = '¡Hay cosas por el suelo! ¡' + (floorDef ? floorDef.label : 'Algo') + ' me ha hecho tropezar!';
        return result;
      }

      // 4b: Check for comic decoratives on furniture
      for (var m = 0; m < origins.length; m++) {
        var cell = origins[m].cell;
        for (var n = 0; n < cell.items.length; n++) {
          var def = window.findItemDef(cell.items[n]);
          if (def && def.category === 'decorativo_comico') {
            result.failedRule = 4;
            result.failMessage = def.failMessage;
            return result;
          }
        }
      }

      // 4c: Check items are on correct furniture type
      for (var p = 0; p < origins.length; p++) {
        var c = origins[p].cell;
        for (var q = 0; q < c.items.length; q++) {
          var itemDef = window.findItemDef(c.items[q]);
          if (!itemDef || !itemDef.correctFurniture) continue;
          if (itemDef.correctFurniture.length === 0) continue; // decorativo_neutro — anywhere is fine
          if (itemDef.correctFurniture.indexOf(c.furnitureId) === -1) {
            result.failedRule = 4;
            var furnitureDef = window.findItemDef(c.furnitureId);
            var furnitureName = furnitureDef ? furnitureDef.label : c.furnitureId;
            result.failMessage = RULES_DATA.rule4.misplaced
              .replace('{item}', itemDef.label)
              .replace('{furniture}', furnitureName);
            return result;
          }
        }
      }

      result.score += 25;
      result.successes.push('Todo en su sitio correcto');
      return result; // 100%
    }
  };

})();
