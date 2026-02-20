// Cozy Dombyto — Core gameplay scene
(function () {

  var W = 430, H = 932;
  var HEADER_H = 56;
  var INVENTORY_H = 200;
  var GRID_AREA_TOP = HEADER_H + 8;

  window.WorkshopScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function WorkshopScene() {
      Phaser.Scene.call(this, { key: 'WorkshopScene' });
    },

    create: function () {
      this.grid = null;
      this.inventory = null;
      this.placedFurnitures = {};  // furnitureId → FurnitureObject
      this.placedItems = [];       // ItemObject[]
      this.floorItems = [];        // ItemObject[] placed on empty floor cells
      this.activeDrag = null;

      this._buildBackground();
      this._buildHeader();
      this._buildGrid();
      this._buildInventory();
      this._restoreGridFromState();
      this._setupInput();
    },

    _buildBackground: function () {
      // Warm cream background
      this.add.rectangle(W / 2, H / 2, W, H, 0xfff5eb);

      // Room walls (isometric room frame)
      var g = this.add.graphics().setDepth(0);
      // Back wall left
      g.fillStyle(0xf5e1d0, 0.8);
      g.fillTriangle(10, GRID_AREA_TOP, W / 2, GRID_AREA_TOP + 20, 10, GRID_AREA_TOP + 300);
      // Back wall right
      g.fillStyle(0xefe0d2, 0.8);
      g.fillTriangle(W - 10, GRID_AREA_TOP, W / 2, GRID_AREA_TOP + 20, W - 10, GRID_AREA_TOP + 300);
    },

    _buildHeader: function () {
      // Header bar — soft coral
      this.add.rectangle(W / 2, HEADER_H / 2, W, HEADER_H, 0xe8917a, 0.95).setDepth(200);

      var roundNum = window.GameState.roundNumber;
      var msg = roundNum <= 1
        ? '📞 ¡Yaiza necesita a Dombyto!'
        : '🔄 Intento #' + roundNum + ' — ¡Corrige!';

      this.add.text(14, HEADER_H / 2, msg, {
        fontSize: '13px', fontFamily: '"Baloo 2", cursive', color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(201);

      // "¡Dombyto, sal!" button — 60px from right for RN close button
      var btn = this.add.text(W - 72, HEADER_H / 2, '▶️ ¡Sal!', {
        fontSize: '14px', fontFamily: '"Baloo 2", cursive',
        backgroundColor: '#c0392b', color: '#ffffff',
        padding: { x: 12, y: 6 }
      }).setOrigin(1, 0.5).setDepth(201).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', function () {
        this.scene.start('EvalScene');
      }, this);
    },

    _buildGrid: function () {
      var originX = W / 2;
      var originY = GRID_AREA_TOP + 40;
      this.grid = new IsometricGrid(this, originX, originY);
      this.inventoryTop = H - INVENTORY_H;
    },

    _buildInventory: function () {
      var invY = H - INVENTORY_H;
      this.inventory = new Inventory(this, 0, invY, W, INVENTORY_H);
    },

    _restoreGridFromState: function () {
      var origins = window.GameState.getOriginCells();
      for (var i = 0; i < origins.length; i++) {
        var cell = origins[i].cell;
        var parts = origins[i].key.split(',');
        var col = parseInt(parts[0]);
        var row = parseInt(parts[1]);
        var furnitureDef = window.findItemDef(cell.furnitureId);
        if (!furnitureDef) continue;

        var furn = new FurnitureObject(this, furnitureDef, col, row, this.grid);
        this.placedFurnitures[furnitureDef.id] = furn;
        this.grid.occupyCells(col, row, furnitureDef.gridW, furnitureDef.gridH, furnitureDef.id);
        this._setupFurnitureTap(furn);

        for (var j = 0; j < cell.items.length; j++) {
          var itemDef = window.findItemDef(cell.items[j]);
          if (!itemDef) continue;
          var item = new ItemObject(this, itemDef);
          item.placedOnFurniture = furn;
          item.furnitureOriginKey = origins[i].key;
          furn.attachItem(item);
          this.placedItems.push(item);
          this._setupItemTap(item);
        }
      }

      // Restore floor items
      var floorItems = window.GameState.floorItems || [];
      for (var k = 0; k < floorItems.length; k++) {
        var fi = floorItems[k];
        var fiDef = window.findItemDef(fi.itemId);
        if (!fiDef) continue;
        var floorItem = new ItemObject(this, fiDef);
        var pos = this.grid.cellToScreen(fi.col, fi.row);
        floorItem.setPosition(pos.x, pos.y - 10);
        floorItem.floorCol = fi.col;
        floorItem.floorRow = fi.row;
        this.floorItems.push(floorItem);
        this._setupFloorItemTap(floorItem);
      }
    },

    _setupInput: function () {
      this.input.on('pointermove', this._onPointerMove, this);
      this.input.on('pointerup', this._onPointerUp, this);
    },

    // --- Drag from inventory (called by Inventory on drag-up gesture) ---

    startItemDrag: function (def, pointer) {
      if (this.activeDrag) return;
      var isFurniture = def.gridW !== undefined;

      var ghost = this.add.text(pointer.x, pointer.y, def.emoji, {
        fontSize: isFurniture ? '44px' : '32px',
        padding: { x: 4, y: 4 }
      }).setOrigin(0.5, 0.5).setDepth(500).setAlpha(0.85);

      this.activeDrag = {
        def: def,
        ghost: ghost,
        isFurniture: isFurniture
      };
    },

    // --- Drag from placed item on furniture ---

    _startItemDragFromGrid: function (item) {
      if (this.activeDrag) return;

      var def = item.def;
      var ghost = this.add.text(item.container.x, item.container.y, def.emoji, {
        fontSize: '32px', padding: { x: 4, y: 4 }
      }).setOrigin(0.5, 0.5).setDepth(500).setAlpha(0.85);

      if (item.placedOnFurniture) {
        item.placedOnFurniture.detachItem(item);
      }
      if (item.furnitureOriginKey) {
        window.GameState.returnItem(def, item.furnitureOriginKey);
      }

      var idx = this.placedItems.indexOf(item);
      if (idx !== -1) this.placedItems.splice(idx, 1);
      item.destroy();

      this.activeDrag = { def: def, ghost: ghost, isFurniture: false };
    },

    // --- Drag from floor item ---

    _startFloorItemDragFromGrid: function (floorItem) {
      if (this.activeDrag) return;

      var def = floorItem.def;
      var ghost = this.add.text(floorItem.container.x, floorItem.container.y, def.emoji, {
        fontSize: '32px', padding: { x: 4, y: 4 }
      }).setOrigin(0.5, 0.5).setDepth(500).setAlpha(0.85);

      // Remove from GameState floor items
      window.GameState.removeFloorItem(def.id, floorItem.floorCol, floorItem.floorRow);

      var idx = this.floorItems.indexOf(floorItem);
      if (idx !== -1) this.floorItems.splice(idx, 1);
      floorItem.destroy();

      this.activeDrag = { def: def, ghost: ghost, isFurniture: false };
    },

    // --- Drag from placed furniture ---

    _startFurnitureDragFromGrid: function (furn) {
      if (this.activeDrag) return;

      var def = furn.def;
      var ghost = this.add.text(furn.container.x, furn.container.y, def.emoji, {
        fontSize: '44px', padding: { x: 4, y: 4 }
      }).setOrigin(0.5, 0.5).setDepth(500).setAlpha(0.85);

      window.GameState.returnFurniture(def, furn.col, furn.row);
      this.grid.freeCells(furn.col, furn.row, def.gridW, def.gridH);

      for (var i = 0; i < furn.attachedItems.length; i++) {
        var idx = this.placedItems.indexOf(furn.attachedItems[i]);
        if (idx !== -1) this.placedItems.splice(idx, 1);
      }

      delete this.placedFurnitures[def.id];
      furn.destroy();
      this.inventory.refreshItems();

      this.activeDrag = { def: def, ghost: ghost, isFurniture: true };
    },

    // --- Pointer events ---

    _onPointerMove: function (pointer) {
      if (!this.activeDrag) return;
      var drag = this.activeDrag;
      drag.ghost.setPosition(pointer.x, pointer.y);

      // Highlight grid cells (gray)
      if (pointer.y < this.inventoryTop) {
        var cell = this.grid.screenToCell(pointer.x, pointer.y);
        if (this.grid.isValidCell(cell.col, cell.row)) {
          if (drag.isFurniture) {
            this.grid.highlightCells(cell.col, cell.row, drag.def.gridW, drag.def.gridH);
          } else {
            this.grid.highlightSingleCell(cell.col, cell.row);
          }
        } else {
          this.grid.clearHighlights();
        }
      } else {
        this.grid.clearHighlights();
      }
    },

    _onPointerUp: function (pointer) {
      if (!this.activeDrag) return;
      var drag = this.activeDrag;
      this.activeDrag = null;
      this.grid.clearHighlights();

      var cell = this.grid.screenToCell(pointer.x, pointer.y);
      var isOnGrid = pointer.y < this.inventoryTop && this.grid.isValidCell(cell.col, cell.row);

      if (isOnGrid && drag.isFurniture) {
        this._tryPlaceFurniture(drag, cell.col, cell.row);
      } else if (isOnGrid && !drag.isFurniture) {
        this._tryPlaceItem(drag, cell.col, cell.row);
      } else {
        // Dropped outside grid → return to inventory
        this._cancelDrag(drag);
      }
    },

    _tryPlaceFurniture: function (drag, col, row) {
      var def = drag.def;
      if (!this.grid.canPlaceFurniture(col, row, def.gridW, def.gridH)) {
        this._cancelDrag(drag);
        return;
      }

      drag.ghost.destroy();
      window.GameState.placeFurniture(col, row, def);
      this.grid.occupyCells(col, row, def.gridW, def.gridH, def.id);

      var furn = new FurnitureObject(this, def, col, row, this.grid);
      this.placedFurnitures[def.id] = furn;
      this._setupFurnitureTap(furn);
      this.inventory.refreshItems();
    },

    _tryPlaceItem: function (drag, col, row) {
      var def = drag.def;

      // Check if there's furniture at this cell
      var furnCell = window.GameState.getFurnitureAtCell(col, row);

      if (furnCell) {
        // Place on furniture
        drag.ghost.destroy();
        var originKey = furnCell.originCol + ',' + furnCell.originRow;
        window.GameState.placeItem(furnCell.originCol, furnCell.originRow, def);

        var furnObj = this.placedFurnitures[furnCell.furnitureId];
        if (furnObj) {
          var item = new ItemObject(this, def);
          item.placedOnFurniture = furnObj;
          item.furnitureOriginKey = originKey;
          furnObj.attachItem(item);
          this.placedItems.push(item);
          this._setupItemTap(item);
        }
        this.inventory.refreshItems();
      } else {
        // Place on floor (empty cell) — allowed but will cause failure
        drag.ghost.destroy();
        window.GameState.addFloorItem(def, col, row);

        var floorItem = new ItemObject(this, def);
        var pos = this.grid.cellToScreen(col, row);
        floorItem.setPosition(pos.x, pos.y - 10);
        floorItem.floorCol = col;
        floorItem.floorRow = row;
        this.floorItems.push(floorItem);
        this._setupFloorItemTap(floorItem);

        // Remove from inventory
        window.GameState._removeFromInventory(window.GameState._tabForItem(def), def.id);
        this.inventory.refreshItems();
      }
    },

    _cancelDrag: function (drag) {
      drag.ghost.destroy();
      this.inventory.refreshItems();
    },

    _setupFurnitureTap: function (furn) {
      var scene = this;
      furn.container.on('pointerdown', function () {
        if (!scene.activeDrag) {
          scene._startFurnitureDragFromGrid(furn);
        }
      });
    },

    _setupItemTap: function (item) {
      var scene = this;
      item.container.on('pointerdown', function () {
        if (!scene.activeDrag) {
          scene._startItemDragFromGrid(item);
        }
      });
    },

    _setupFloorItemTap: function (floorItem) {
      var scene = this;
      floorItem.container.on('pointerdown', function () {
        if (!scene.activeDrag) {
          scene._startFloorItemDragFromGrid(floorItem);
        }
      });
    },

    shutdown: function () {
      if (this.inventory) this.inventory.destroy();
      this.placedFurnitures = {};
      this.placedItems = [];
      this.floorItems = [];
      this.activeDrag = null;
    }
  });

})();
