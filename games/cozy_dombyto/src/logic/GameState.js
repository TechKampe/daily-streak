// Cozy Dombyto — Game state singleton (persists across Phaser scene transitions)
(function () {

  window.GameState = {
    // "col,row" → { furnitureId, items: [itemId, ...], originCol, originRow }
    // Sub-cells (for multi-cell furniture) store { ref: "originCol,originRow" }
    grid: {},
    inventory: {},
    activeTab: 'muebles',
    roundNumber: 0,
    lastResult: null,

    floorItems: [], // [{ itemId, col, row }, ...]

    reset: function () {
      this.grid = {};
      this.floorItems = [];
      this.roundNumber = 0;
      this.lastResult = null;
      this.activeTab = 'muebles';
      this._buildInventory();
    },

    _buildInventory: function () {
      // Deep-copy items into inventory grouped by tab
      var D = window.ITEMS_DATA;
      this.inventory = {
        muebles:      D.furniture.map(function (d) { return Object.assign({}, d); }),
        herramientas: D.herramientas.map(function (d) { return Object.assign({}, d); }),
        material:     D.material.concat(D.residuos).map(function (d) { return Object.assign({}, d); }),
        otros:        D.decorativos_neutros.concat(D.decorativos_comicos).map(function (d) { return Object.assign({}, d); })
      };
    },

    // --- Furniture placement ---

    placeFurniture: function (col, row, furnitureDef) {
      var key = col + ',' + row;
      this.grid[key] = {
        furnitureId: furnitureDef.id,
        items: [],
        originCol: col,
        originRow: row,
        gridW: furnitureDef.gridW,
        gridH: furnitureDef.gridH
      };
      // Mark sub-cells
      for (var dc = 0; dc < furnitureDef.gridW; dc++) {
        for (var dr = 0; dr < furnitureDef.gridH; dr++) {
          if (dc === 0 && dr === 0) continue;
          this.grid[(col + dc) + ',' + (row + dr)] = { ref: key };
        }
      }
      // Remove from inventory
      this._removeFromInventory('muebles', furnitureDef.id);
    },

    returnFurniture: function (furnitureDef, col, row) {
      var cell = this.grid[col + ',' + row];
      if (!cell || cell.ref) return;
      // Return attached items first
      var self = this;
      cell.items.forEach(function (itemId) {
        var def = window.findItemDef(itemId);
        if (def) self._addToInventory(def);
      });
      // Free sub-cells
      for (var dc = 0; dc < cell.gridW; dc++) {
        for (var dr = 0; dr < cell.gridH; dr++) {
          delete this.grid[(col + dc) + ',' + (row + dr)];
        }
      }
      // Return furniture to inventory
      this._addToInventory(furnitureDef);
    },

    // --- Item placement ---

    placeItem: function (col, row, itemDef) {
      var key = col + ',' + row;
      var cell = this.grid[key];
      // Follow ref to origin cell
      if (cell && cell.ref) cell = this.grid[cell.ref];
      if (!cell) return false;
      cell.items.push(itemDef.id);
      // Remove from inventory
      this._removeFromInventory(this._tabForItem(itemDef), itemDef.id);
      return true;
    },

    returnItem: function (itemDef, furnitureOriginKey) {
      var cell = this.grid[furnitureOriginKey];
      if (!cell) return;
      var idx = cell.items.indexOf(itemDef.id);
      if (idx !== -1) cell.items.splice(idx, 1);
      this._addToInventory(itemDef);
    },

    // --- Floor items (items placed on empty grid cells, not on furniture) ---

    addFloorItem: function (itemDef, col, row) {
      this.floorItems.push({ itemId: itemDef.id, col: col, row: row });
    },

    removeFloorItem: function (itemId, col, row) {
      for (var i = 0; i < this.floorItems.length; i++) {
        var fi = this.floorItems[i];
        if (fi.itemId === itemId && fi.col === col && fi.row === row) {
          this.floorItems.splice(i, 1);
          // Return to inventory
          var def = window.findItemDef(itemId);
          if (def) this._addToInventory(def);
          return;
        }
      }
    },

    getFloorItemIds: function () {
      return this.floorItems.map(function (fi) { return fi.itemId; });
    },

    hasFloorItems: function () {
      return this.floorItems.length > 0;
    },

    // --- Queries ---

    getPlacedFurnitureIds: function () {
      var ids = [];
      var keys = Object.keys(this.grid);
      for (var i = 0; i < keys.length; i++) {
        var cell = this.grid[keys[i]];
        if (cell.furnitureId && !cell.ref) ids.push(cell.furnitureId);
      }
      return ids;
    },

    getItemsOnGrid: function () {
      var items = [];
      var keys = Object.keys(this.grid);
      for (var i = 0; i < keys.length; i++) {
        var cell = this.grid[keys[i]];
        if (cell.items) items = items.concat(cell.items);
      }
      // Include floor items too
      for (var j = 0; j < this.floorItems.length; j++) {
        items.push(this.floorItems[j].itemId);
      }
      return items;
    },

    getOriginCells: function () {
      var cells = [];
      var keys = Object.keys(this.grid);
      for (var i = 0; i < keys.length; i++) {
        var cell = this.grid[keys[i]];
        if (cell.furnitureId && !cell.ref) {
          cells.push({ key: keys[i], cell: cell });
        }
      }
      return cells;
    },

    getFurnitureAtCell: function (col, row) {
      var cell = this.grid[col + ',' + row];
      if (!cell) return null;
      if (cell.ref) cell = this.grid[cell.ref];
      return cell || null;
    },

    // --- Inventory helpers ---

    _tabForItem: function (def) {
      if (def.gridW !== undefined) return 'muebles';
      if (def.category === 'herramienta') return 'herramientas';
      if (def.category === 'material' || def.category === 'residuo') return 'material';
      return 'otros';
    },

    _removeFromInventory: function (tab, id) {
      var arr = this.inventory[tab];
      if (!arr) return;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === id) { arr.splice(i, 1); return; }
      }
    },

    _addToInventory: function (def) {
      var tab = this._tabForItem(def);
      // Only add if not already present
      var arr = this.inventory[tab];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === def.id) return;
      }
      arr.push(Object.assign({}, def));
    }
  };

})();
