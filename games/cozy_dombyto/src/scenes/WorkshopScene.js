// Cozy Dombyto — Core gameplay scene (landscape layout)
(function () {

  var W = 1864, H = 860;
  var HEADER_H = 88;
  var INVENTORY_W = 400;
  var GRID_AREA_RIGHT = W - INVENTORY_W;
  var GRID_DRAG_THRESHOLD = 20;
  var DRAG_CELL_OFFSET_Y = 70; // offset pointer Y when calculating target cell during drag

  window.WorkshopScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function WorkshopScene() {
      Phaser.Scene.call(this, { key: 'WorkshopScene' });
    },

    create: function () {
      this.grid = null;
      this.inventory = null;
      this.placedFurnitures = {};
      this.placedItems = [];
      this.floorItems = [];
      this.activeDrag = null;
      this._pendingGridDrag = null;

      this._buildBackground();
      this._buildHeader();
      this._buildGrid();
      this._buildInventory();
      this._restoreGridFromState();
      this._setupInput();
    },

    _buildBackground: function () {
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);
    },

    _buildHeader: function () {
      this.add.rectangle(W / 2, HEADER_H / 2, W, HEADER_H, 0x5b8c5a, 0.95).setDepth(200);

      var roundNum = window.GameState.roundNumber;
      var msg = roundNum <= 1
        ? '📞 ¡Yaiza necesita a Dombyto!'
        : '🔄 Intento #' + roundNum + ' — ¡Corrige!';

      this.add.text(28, HEADER_H / 2, msg, {
        fontSize: '26px', fontFamily: '"Baloo 2", cursive', color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(201);

      var btn = this.add.text(W - INVENTORY_W - 40, HEADER_H / 2, '▶️ ¡Sal!', {
        fontSize: '28px', fontFamily: '"Baloo 2", cursive',
        backgroundColor: '#d9534f', color: '#ffffff',
        padding: { x: 24, y: 12 }
      }).setOrigin(1, 0.5).setDepth(201).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', function () {
        this.scene.start('EvalScene');
      }, this);
    },

    _buildGrid: function () {
      var tileW = IsometricGrid.TILE_W;
      var tileH = IsometricGrid.TILE_H;
      var cols = IsometricGrid.COLS;
      var rows = IsometricGrid.ROWS;

      var gridLeftExtent = rows * tileW / 2;
      var gridRightExtent = cols * tileW / 2;
      var gridTotalH = (cols + rows) * tileH / 2;

      var areaW = GRID_AREA_RIGHT;
      var areaH = H - HEADER_H;

      var originX = areaW / 2 + (gridLeftExtent - gridRightExtent) / 2;
      // Center vertically + nudge down 30px
      var originY = HEADER_H + (areaH - gridTotalH) / 2 + 30;

      this.grid = new IsometricGrid(this, originX, originY);

      this.inventoryLeft = GRID_AREA_RIGHT;
    },

    _buildInventory: function () {
      var invX = GRID_AREA_RIGHT;
      var invY = HEADER_H;
      this.inventory = new Inventory(this, invX, invY, INVENTORY_W, H - HEADER_H);
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

        for (var j = 0; j < cell.items.length; j++) {
          var itemDef = window.findItemDef(cell.items[j]);
          if (!itemDef) continue;
          var item = new ItemObject(this, itemDef);
          item.placedOnFurniture = furn;
          item.furnitureOriginKey = origins[i].key;
          furn.attachItem(item);
          this.placedItems.push(item);
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
        floorItem.setPosition(pos.x, pos.y - 20);
        floorItem.floorCol = fi.col;
        floorItem.floorRow = fi.row;
        this.floorItems.push(floorItem);
      }
    },

    // --- Input setup ---

    _setupInput: function () {
      var scene = this;

      this.input.on('pointerdown', function (pointer) {
        if (scene.activeDrag || scene._pendingGridDrag) return;
        if (pointer.x >= scene.inventoryLeft || pointer.y <= HEADER_H) return;

        // Collect all hittable objects with bounding rects
        var candidates = [];
        var ITEM_HW = 36, ITEM_HH = 36;

        // Attached items on furniture
        for (var i = 0; i < scene.placedItems.length; i++) {
          var item = scene.placedItems[i];
          var ic = item.container;
          candidates.push({ type: 'item', obj: item, depth: ic.depth, x: ic.x, y: ic.y, hw: ITEM_HW, hh: ITEM_HH });
        }

        // Floor items
        for (var j = 0; j < scene.floorItems.length; j++) {
          var fi = scene.floorItems[j];
          var fc = fi.container;
          candidates.push({ type: 'floorItem', obj: fi, depth: fc.depth, x: fc.x, y: fc.y, hw: ITEM_HW, hh: ITEM_HH });
        }

        // Furniture
        var furnKeys = Object.keys(scene.placedFurnitures);
        for (var k = 0; k < furnKeys.length; k++) {
          var furn = scene.placedFurnitures[furnKeys[k]];
          var cc = furn.container;
          var hw = furn.grid.tileW * furn.def.gridW / 2 + 10;
          var hh = furn.grid.tileH * furn.def.gridH / 2 + 30;
          candidates.push({ type: 'furniture', obj: furn, depth: cc.depth, x: cc.x, y: cc.y, hw: hw, hh: hh });
        }

        // Sort by depth descending — frontmost wins
        candidates.sort(function (a, b) { return b.depth - a.depth; });

        // First candidate whose rect contains the pointer
        for (var m = 0; m < candidates.length; m++) {
          var c = candidates[m];
          if (pointer.x >= c.x - c.hw && pointer.x <= c.x + c.hw &&
              pointer.y >= c.y - c.hh && pointer.y <= c.y + c.hh) {
            scene._pendingGridDrag = {
              type: c.type, obj: c.obj,
              startX: pointer.x, startY: pointer.y
            };
            return;
          }
        }
      });

      this.input.on('pointermove', this._onPointerMove, this);
      this.input.on('pointerup', this._onPointerUp, this);
    },

    // --- Drag from inventory ---

    startItemDrag: function (def, pointer) {
      if (this.activeDrag) return;
      var isFurniture = def.gridW !== undefined;

      var ghostScale = isFurniture ? 0.56 : 0.44;
      var ghost = this.add.image(pointer.x, pointer.y, 'item_' + def.id)
        .setScale(ghostScale).setDepth(500).setAlpha(0.85);

      this.activeDrag = { def: def, ghost: ghost, isFurniture: isFurniture };
    },

    // --- Drag from placed item on furniture ---

    _startItemDragFromGrid: function (item) {
      if (this.activeDrag) return;

      var def = item.def;
      var ghost = this.add.image(item.container.x, item.container.y, 'item_' + def.id)
        .setScale(0.44).setDepth(500).setAlpha(0.85);

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
      var ghost = this.add.image(floorItem.container.x, floorItem.container.y, 'item_' + def.id)
        .setScale(0.44).setDepth(500).setAlpha(0.85);

      window.GameState.removeFloorItem(def.id, floorItem.floorCol, floorItem.floorRow);

      var idx = this.floorItems.indexOf(floorItem);
      if (idx !== -1) this.floorItems.splice(idx, 1);
      floorItem.destroy();

      this.activeDrag = { def: def, ghost: ghost, isFurniture: false };
    },

    // --- Drag from placed furniture (carries attached items along) ---

    _startFurnitureDragFromGrid: function (furn) {
      if (this.activeDrag) return;

      var def = furn.def;
      var ghost = this.add.image(furn.container.x, furn.container.y, 'item_' + def.id)
        .setScale(0.56).setDepth(500).setAlpha(0.85);

      // Remember attached item defs before removing from state
      var carriedItemDefs = [];
      for (var i = 0; i < furn.attachedItems.length; i++) {
        carriedItemDefs.push(furn.attachedItems[i].def);
        var idx = this.placedItems.indexOf(furn.attachedItems[i]);
        if (idx !== -1) this.placedItems.splice(idx, 1);
      }

      window.GameState.returnFurniture(def, furn.col, furn.row);
      this.grid.freeCells(furn.col, furn.row, def.gridW, def.gridH);

      delete this.placedFurnitures[def.id];
      furn.destroy();

      this.activeDrag = { def: def, ghost: ghost, isFurniture: true, carriedItems: carriedItemDefs };
    },

    // --- Pointer events ---

    _onPointerMove: function (pointer) {
      // Check pending grid drag — promote to real drag after threshold
      if (this._pendingGridDrag) {
        var pdx = pointer.x - this._pendingGridDrag.startX;
        var pdy = pointer.y - this._pendingGridDrag.startY;
        if (pdx * pdx + pdy * pdy > GRID_DRAG_THRESHOLD * GRID_DRAG_THRESHOLD) {
          var pending = this._pendingGridDrag;
          this._pendingGridDrag = null;
          if (pending.type === 'furniture') this._startFurnitureDragFromGrid(pending.obj);
          else if (pending.type === 'item') this._startItemDragFromGrid(pending.obj);
          else if (pending.type === 'floorItem') this._startFloorItemDragFromGrid(pending.obj);
        }
        return;
      }

      // Active item/furniture drag
      if (this.activeDrag) {
        var drag = this.activeDrag;
        drag.ghost.setPosition(pointer.x, pointer.y);

        // Clear previous furniture highlight tint
        this._clearFurnitureHighlight();

        if (pointer.x < this.inventoryLeft) {
          var cell = this.grid.screenToCell(pointer.x, pointer.y + DRAG_CELL_OFFSET_Y);
          if (this.grid.isValidCell(cell.col, cell.row)) {
            if (drag.isFurniture) {
              this.grid.highlightCells(cell.col, cell.row, drag.def.gridW, drag.def.gridH);
            } else {
              this.grid.highlightSingleCell(cell.col, cell.row);
              // Tint furniture that accepts this item's category
              var furnCell = window.GameState.getFurnitureAtCell(cell.col, cell.row);
              if (furnCell) {
                var furnObj = this.placedFurnitures[furnCell.furnitureId];
                if (furnObj && furnObj.def.accepts &&
                    furnObj.def.accepts.indexOf(drag.def.category) !== -1) {
                  furnObj.sprite.setTint(0x88cc88); // green tint = valid drop
                  this._highlightedFurniture = furnObj;
                }
              }
            }
          } else {
            this.grid.clearHighlights();
          }
        } else {
          this.grid.clearHighlights();
        }
      }
    },

    _clearFurnitureHighlight: function () {
      if (this._highlightedFurniture) {
        this._highlightedFurniture.sprite.clearTint();
        this._highlightedFurniture = null;
      }
    },

    _onPointerUp: function (pointer) {
      this._clearFurnitureHighlight();
      // Pending grid drag without movement = tap to return to inventory
      if (this._pendingGridDrag) {
        var pending = this._pendingGridDrag;
        this._pendingGridDrag = null;
        if (pending.type === 'furniture') this._returnFurnitureToInventory(pending.obj);
        else if (pending.type === 'item') this._returnItemToInventory(pending.obj);
        else if (pending.type === 'floorItem') this._returnFloorItemToInventory(pending.obj);
        return;
      }

      if (!this.activeDrag) return;
      var drag = this.activeDrag;
      this.activeDrag = null;
      this.grid.clearHighlights();

      var cell = this.grid.screenToCell(pointer.x, pointer.y + DRAG_CELL_OFFSET_Y);
      var isOnGrid = pointer.x < this.inventoryLeft && this.grid.isValidCell(cell.col, cell.row);

      if (isOnGrid && drag.isFurniture) {
        this._tryPlaceFurniture(drag, cell.col, cell.row);
      } else if (isOnGrid && !drag.isFurniture) {
        this._tryPlaceItem(drag, cell.col, cell.row);
      } else {
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

      // Re-attach carried items
      var carried = drag.carriedItems || [];
      var originKey = col + ',' + row;
      for (var i = 0; i < carried.length; i++) {
        var itemDef = carried[i];
        window.GameState.placeItem(col, row, itemDef);
        var item = new ItemObject(this, itemDef);
        item.placedOnFurniture = furn;
        item.furnitureOriginKey = originKey;
        furn.attachItem(item);
        this.placedItems.push(item);
      }

      this.inventory.refreshItems();
    },

    _tryPlaceItem: function (drag, col, row) {
      var def = drag.def;
      var furnCell = window.GameState.getFurnitureAtCell(col, row);

      if (furnCell) {
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
        }
        this.inventory.refreshItems();
      } else {
        drag.ghost.destroy();
        window.GameState.addFloorItem(def, col, row);

        var floorItem = new ItemObject(this, def);
        var pos = this.grid.cellToScreen(col, row);
        floorItem.setPosition(pos.x, pos.y - 20);
        floorItem.floorCol = col;
        floorItem.floorRow = row;
        this.floorItems.push(floorItem);

        window.GameState._removeFromInventory(window.GameState._tabForItem(def), def.id);
        this.inventory.refreshItems();
      }
    },

    _cancelDrag: function (drag) {
      // If furniture drag with carried items, return everything to inventory
      if (drag.carriedItems && drag.carriedItems.length > 0) {
        for (var i = 0; i < drag.carriedItems.length; i++) {
          window.GameState._addToInventory(drag.carriedItems[i]);
        }
      }
      drag.ghost.destroy();
      this.inventory.refreshItems();
    },

    // --- Return-to-inventory helpers (for tap on placed objects) ---

    _returnFurnitureToInventory: function (furn) {
      var def = furn.def;
      window.GameState.returnFurniture(def, furn.col, furn.row);
      this.grid.freeCells(furn.col, furn.row, def.gridW, def.gridH);
      for (var i = 0; i < furn.attachedItems.length; i++) {
        var idx = this.placedItems.indexOf(furn.attachedItems[i]);
        if (idx !== -1) this.placedItems.splice(idx, 1);
      }
      delete this.placedFurnitures[def.id];
      furn.destroy();
      this.inventory.refreshItems();
    },

    _returnItemToInventory: function (item) {
      if (item.placedOnFurniture) item.placedOnFurniture.detachItem(item);
      if (item.furnitureOriginKey) window.GameState.returnItem(item.def, item.furnitureOriginKey);
      var idx = this.placedItems.indexOf(item);
      if (idx !== -1) this.placedItems.splice(idx, 1);
      item.destroy();
      this.inventory.refreshItems();
    },

    _returnFloorItemToInventory: function (floorItem) {
      window.GameState.removeFloorItem(floorItem.def.id, floorItem.floorCol, floorItem.floorRow);
      var idx = this.floorItems.indexOf(floorItem);
      if (idx !== -1) this.floorItems.splice(idx, 1);
      floorItem.destroy();
      this.inventory.refreshItems();
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
