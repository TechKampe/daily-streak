// Cozy Dombyto — Core gameplay scene (landscape layout)
(function () {

  var W = 1864, H = 860;
  var HEADER_H = 0;
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

      // Zoomable container for all grid-area content
      this.gridContainer = this.add.container(0, 0).setDepth(0);
      this.zoomLevel = 1.0;

      this._buildBackground();
      this._buildHeader();
      this._buildGrid();
      this._buildInventory();
      this._restoreGridFromState();
      this._setupInput();
    },

    _buildBackground: function () {
      // Full-screen cream fill (stays outside container — always fills screen)
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3).setDepth(-2);

      // Workshop background image — zooms with grid
      var BG_SCALE_FACTOR = 1.135;
      var bg = this.add.image(GRID_AREA_RIGHT / 2, H, 'workshop_bg').setOrigin(0.5, 1).setDepth(-1);
      var scale = (GRID_AREA_RIGHT / bg.width) * BG_SCALE_FACTOR;
      bg.setScale(scale);
      this.gridContainer.add(bg);
    },

    _buildHeader: function () {
      // Play button — bottom-left corner using ui_play image
      var btnX = 170, btnY = H - 84;
      var btnImg = this.add.image(btnX, btnY, 'ui_play').setScale(2.10).setDepth(201)
        .setInteractive({ useHandCursor: true });
      var btnLabel = this.add.text(btnX, btnY, 'Sal a la urgencia', {
        fontSize: '32px', fontFamily: '"Baloo 2", cursive',
        color: '#ffffff', fontStyle: 'bold',
        stroke: '#3a1a5a', strokeThickness: 3
      }).setOrigin(0.5, 0.5).setDepth(202);

      btnImg.on('pointerdown', function () {
        this.scene.start('EvalScene');
      }, this);

      // Zoom buttons — right side, between grid and inventory
      var zoomX = GRID_AREA_RIGHT - 74;
      var zoomBtnSize = 72;
      var zoomGap = 12;
      var zoomY1 = H - zoomBtnSize - zoomGap - zoomBtnSize / 2 - 30;
      var zoomY2 = H - zoomBtnSize / 2 - 30;
      var zoomStyle = {
        fontSize: '44px', fontFamily: '"Baloo 2", cursive',
        color: '#ffffff', fontStyle: 'bold',
        stroke: '#3a1a5a', strokeThickness: 3
      };

      var plusBg = this.add.image(zoomX, zoomY1, 'ui_button').setDepth(201);
      plusBg.setScale(zoomBtnSize / plusBg.width * 1.5, zoomBtnSize / plusBg.height * 1.3);
      plusBg.setInteractive({ useHandCursor: true });
      this.add.text(zoomX, zoomY1, '+', zoomStyle).setOrigin(0.5).setDepth(202);

      var minusBg = this.add.image(zoomX, zoomY2, 'ui_button').setDepth(201);
      minusBg.setScale(zoomBtnSize / minusBg.width * 1.5, zoomBtnSize / minusBg.height * 1.3);
      minusBg.setInteractive({ useHandCursor: true });
      this.add.text(zoomX, zoomY2, '−', zoomStyle).setOrigin(0.5).setDepth(202);

      var self = this;
      plusBg.on('pointerdown', function () { self._applyZoom(0.15); });
      minusBg.on('pointerdown', function () { self._applyZoom(-0.15); });
    },

    _applyZoom: function (delta) {
      this.zoomLevel = Phaser.Math.Clamp(this.zoomLevel + delta, 1.0, 1.6);
      var z = this.zoomLevel;

      // Scale around grid area center
      var cx = GRID_AREA_RIGHT / 2;
      var cy = H / 2;
      this.gridContainer.setScale(z);
      this.gridContainer.setPosition(cx * (1 - z), cy * (1 - z));
    },

    // Convert screen coords → grid-container-local coords
    _screenToGrid: function (sx, sy) {
      var gc = this.gridContainer;
      return {
        x: (sx - gc.x) / gc.scaleX,
        y: (sy - gc.y) / gc.scaleY
      };
    },

    // Convert grid-container-local coords → screen coords
    _gridToScreen: function (gx, gy) {
      var gc = this.gridContainer;
      return {
        x: gc.x + gx * gc.scaleX,
        y: gc.y + gy * gc.scaleY
      };
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
      var originY = HEADER_H + (areaH - gridTotalH) / 2;

      // Manual offset — tweak these to align grid with background
      var GRID_OFFSET_X = 0;
      var GRID_OFFSET_Y = 140;
      originX += GRID_OFFSET_X;
      originY += GRID_OFFSET_Y;

      this.grid = new IsometricGrid(this, originX, originY);

      // Add grid graphics to zoomable container
      this.gridContainer.add(this.grid.floorGfx);
      this.gridContainer.add(this.grid.highlightGfx);

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
        this.gridContainer.add(furn.container);
        this.placedFurnitures[furnitureDef.id] = furn;
        this.grid.occupyCells(col, row, furnitureDef.gridW, furnitureDef.gridH, furnitureDef.id);

        for (var j = 0; j < cell.items.length; j++) {
          var itemDef = window.findItemDef(cell.items[j]);
          if (!itemDef) continue;
          var item = new ItemObject(this, itemDef);
          this.gridContainer.add(item.container);
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
        this.gridContainer.add(floorItem.container);
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
        if (pointer.x >= scene.inventoryLeft) return;

        // Convert pointer to grid-local coords for hit testing
        var gp = scene._screenToGrid(pointer.x, pointer.y);

        // Collect all hittable objects with bounding rects (in grid-local coords)
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

        // First candidate whose rect contains the pointer (grid-local coords)
        for (var m = 0; m < candidates.length; m++) {
          var c = candidates[m];
          if (gp.x >= c.x - c.hw && gp.x <= c.x + c.hw &&
              gp.y >= c.y - c.hh && gp.y <= c.y + c.hh) {
            scene._pendingGridDrag = {
              type: c.type, obj: c.obj,
              startX: pointer.x, startY: pointer.y // screen coords for drag threshold
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
      var sp = this._gridToScreen(item.container.x, item.container.y);
      var ghost = this.add.image(sp.x, sp.y, 'item_' + def.id)
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
      var sp = this._gridToScreen(floorItem.container.x, floorItem.container.y);
      var ghost = this.add.image(sp.x, sp.y, 'item_' + def.id)
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
      var sp = this._gridToScreen(furn.container.x, furn.container.y);
      var ghost = this.add.image(sp.x, sp.y, 'item_' + def.id)
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
        drag.ghost.setPosition(pointer.x, pointer.y); // screen coords

        // Clear previous furniture highlight tint
        this._clearFurnitureHighlight();

        if (pointer.x < this.inventoryLeft) {
          // Convert to grid-local for cell detection
          var gp = this._screenToGrid(pointer.x, pointer.y);
          var cell = this.grid.screenToCell(gp.x, gp.y + DRAG_CELL_OFFSET_Y);
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

      // Convert to grid-local for cell detection
      var gp = this._screenToGrid(pointer.x, pointer.y);
      var cell = this.grid.screenToCell(gp.x, gp.y + DRAG_CELL_OFFSET_Y);
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
      this.gridContainer.add(furn.container);
      this.placedFurnitures[def.id] = furn;

      // Re-attach carried items
      var carried = drag.carriedItems || [];
      var originKey = col + ',' + row;
      for (var i = 0; i < carried.length; i++) {
        var itemDef = carried[i];
        window.GameState.placeItem(col, row, itemDef);
        var item = new ItemObject(this, itemDef);
        this.gridContainer.add(item.container);
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
          this.gridContainer.add(item.container);
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
        this.gridContainer.add(floorItem.container);
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
