// Cozy Dombyto — Core gameplay scene (landscape layout + pinch zoom + pan)
(function () {

  var W = 932, H = 430;
  var HEADER_H = 44;
  var INVENTORY_W = 200;
  var GRID_AREA_RIGHT = W - INVENTORY_W;
  var GRID_DRAG_THRESHOLD = 10;

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

      // Zoom & pan state
      this.gridLayer = this.add.container(0, 0).setDepth(5);
      this.zoomLevel = 1;
      this._isPanning = false;
      this._isPinching = false;
      this._lastPinchDist = 0;
      this._panStartX = 0;
      this._panStartY = 0;
      this._gridLayerStartX = 0;
      this._gridLayerStartY = 0;

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

      this.add.text(14, HEADER_H / 2, msg, {
        fontSize: '13px', fontFamily: '"Baloo 2", cursive', color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(201);

      var btn = this.add.text(W - INVENTORY_W - 20, HEADER_H / 2, '▶️ ¡Sal!', {
        fontSize: '14px', fontFamily: '"Baloo 2", cursive',
        backgroundColor: '#d9534f', color: '#ffffff',
        padding: { x: 12, y: 6 }
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
      // Center vertically + nudge down 15px
      var originY = HEADER_H + (areaH - gridTotalH) / 2 + 15;

      this.grid = new IsometricGrid(this, originX, originY);

      // Add grid graphics to the zoomable layer
      this.gridLayer.add([this.grid.floorGfx, this.grid.highlightGfx]);

      // Store pivot point for zoom (center of grid diamond)
      this._gridPivotX = originX + (cols - rows) * tileW / 4;
      this._gridPivotY = originY + (cols + rows) * tileH / 4;

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
        this.gridLayer.add(furn.container);
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
          this.gridLayer.add(item.container);
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
        this.gridLayer.add(floorItem.container);
        this.floorItems.push(floorItem);
        this._setupFloorItemTap(floorItem);
      }

      this.gridLayer.sort('depth');
    },

    // --- Coordinate helpers ---

    _screenToGridCoords: function (sx, sy) {
      return {
        x: (sx - this.gridLayer.x) / this.gridLayer.scaleX,
        y: (sy - this.gridLayer.y) / this.gridLayer.scaleY
      };
    },

    _gridToScreenCoords: function (gx, gy) {
      return {
        x: gx * this.gridLayer.scaleX + this.gridLayer.x,
        y: gy * this.gridLayer.scaleY + this.gridLayer.y
      };
    },

    // --- Input setup ---

    _setupInput: function () {
      var scene = this;

      this.input.on('pointerdown', function (pointer) {
        // Start pan if in grid area and no active drag
        if (!scene.activeDrag && !scene._isPinching &&
            pointer.x < scene.inventoryLeft && pointer.y > HEADER_H) {
          scene._isPanning = true;
          scene._panStartX = pointer.x;
          scene._panStartY = pointer.y;
          scene._gridLayerStartX = scene.gridLayer.x;
          scene._gridLayerStartY = scene.gridLayer.y;
        }
      });

      this.input.on('pointermove', this._onPointerMove, this);
      this.input.on('pointerup', this._onPointerUp, this);

      // Mouse wheel zoom (desktop)
      this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY) {
        if (pointer.x >= scene.inventoryLeft) return;
        scene._applyZoom(deltaY > 0 ? 0.9 : 1.1);
      });
    },

    _applyZoom: function (factor) {
      var oldZoom = this.zoomLevel;
      var newZoom = Phaser.Math.Clamp(oldZoom * factor, 1, 2);
      if (newZoom === oldZoom) return;

      this.gridLayer.x += this._gridPivotX * (oldZoom - newZoom);
      this.gridLayer.y += this._gridPivotY * (oldZoom - newZoom);
      this.zoomLevel = newZoom;
      this.gridLayer.setScale(newZoom);
      this._clampPan();
    },

    // --- Drag from inventory ---

    startItemDrag: function (def, pointer) {
      if (this.activeDrag) return;
      this._isPanning = false;
      var isFurniture = def.gridW !== undefined;

      var ghostScale = isFurniture ? 0.28 : 0.22;
      var ghost = this.add.image(pointer.x, pointer.y, 'item_' + def.id)
        .setScale(ghostScale).setDepth(500).setAlpha(0.85);

      this.activeDrag = { def: def, ghost: ghost, isFurniture: isFurniture };
    },

    // --- Drag from placed item on furniture ---

    _startItemDragFromGrid: function (item) {
      if (this.activeDrag) return;
      this._isPanning = false;

      var def = item.def;
      var screenPos = this._gridToScreenCoords(item.container.x, item.container.y);
      var ghost = this.add.image(screenPos.x, screenPos.y, 'item_' + def.id)
        .setScale(0.22).setDepth(500).setAlpha(0.85);

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
      this._isPanning = false;

      var def = floorItem.def;
      var screenPos = this._gridToScreenCoords(floorItem.container.x, floorItem.container.y);
      var ghost = this.add.image(screenPos.x, screenPos.y, 'item_' + def.id)
        .setScale(0.22).setDepth(500).setAlpha(0.85);

      window.GameState.removeFloorItem(def.id, floorItem.floorCol, floorItem.floorRow);

      var idx = this.floorItems.indexOf(floorItem);
      if (idx !== -1) this.floorItems.splice(idx, 1);
      floorItem.destroy();

      this.activeDrag = { def: def, ghost: ghost, isFurniture: false };
    },

    // --- Drag from placed furniture ---

    _startFurnitureDragFromGrid: function (furn) {
      if (this.activeDrag) return;
      this._isPanning = false;

      var def = furn.def;
      var screenPos = this._gridToScreenCoords(furn.container.x, furn.container.y);
      var ghost = this.add.image(screenPos.x, screenPos.y, 'item_' + def.id)
        .setScale(0.28).setDepth(500).setAlpha(0.85);

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
      if (this._isPinching) return;

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
        this._isPanning = false;
        var drag = this.activeDrag;
        drag.ghost.setPosition(pointer.x, pointer.y);

        if (pointer.x < this.inventoryLeft) {
          var gc = this._screenToGridCoords(pointer.x, pointer.y);
          var cell = this.grid.screenToCell(gc.x, gc.y);
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
        return;
      }

      // Pan the grid
      if (this._isPanning) {
        var dx = pointer.x - this._panStartX;
        var dy = pointer.y - this._panStartY;
        this.gridLayer.x = this._gridLayerStartX + dx;
        this.gridLayer.y = this._gridLayerStartY + dy;
        this._clampPan();
      }
    },

    _onPointerUp: function (pointer) {
      this._isPanning = false;

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

      var gc = this._screenToGridCoords(pointer.x, pointer.y);
      var cell = this.grid.screenToCell(gc.x, gc.y);
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
      this.gridLayer.add(furn.container);
      this.gridLayer.sort('depth');
      this.placedFurnitures[def.id] = furn;
      this._setupFurnitureTap(furn);
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
          this.gridLayer.add(item.container);
          this.gridLayer.sort('depth');
          this.placedItems.push(item);
          this._setupItemTap(item);
        }
        this.inventory.refreshItems();
      } else {
        drag.ghost.destroy();
        window.GameState.addFloorItem(def, col, row);

        var floorItem = new ItemObject(this, def);
        var pos = this.grid.cellToScreen(col, row);
        floorItem.setPosition(pos.x, pos.y - 10);
        floorItem.floorCol = col;
        floorItem.floorRow = row;
        this.gridLayer.add(floorItem.container);
        this.gridLayer.sort('depth');
        this.floorItems.push(floorItem);
        this._setupFloorItemTap(floorItem);

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
      furn.container.on('pointerdown', function (pointer) {
        if (!scene.activeDrag && !scene._pendingGridDrag) {
          scene._pendingGridDrag = {
            type: 'furniture', obj: furn,
            startX: pointer.x, startY: pointer.y
          };
          scene._isPanning = false;
        }
      });
    },

    _setupItemTap: function (item) {
      var scene = this;
      item.container.on('pointerdown', function (pointer) {
        if (!scene.activeDrag && !scene._pendingGridDrag) {
          scene._pendingGridDrag = {
            type: 'item', obj: item,
            startX: pointer.x, startY: pointer.y
          };
          scene._isPanning = false;
        }
      });
    },

    _setupFloorItemTap: function (floorItem) {
      var scene = this;
      floorItem.container.on('pointerdown', function (pointer) {
        if (!scene.activeDrag && !scene._pendingGridDrag) {
          scene._pendingGridDrag = {
            type: 'floorItem', obj: floorItem,
            startX: pointer.x, startY: pointer.y
          };
          scene._isPanning = false;
        }
      });
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

    // --- Pinch-to-zoom (update loop) ---

    update: function () {
      if (this.activeDrag) return;

      var pointer1 = this.input.pointer1;
      var pointer2 = this.input.pointer2;

      if (pointer1 && pointer2 && pointer1.isDown && pointer2.isDown) {
        // Cancel any pending grid drag — user is pinching, not tapping
        if (this._pendingGridDrag) this._pendingGridDrag = null;

        var dist = Phaser.Math.Distance.Between(
          pointer1.x, pointer1.y, pointer2.x, pointer2.y
        );

        if (this._lastPinchDist > 0) {
          var ratio = dist / this._lastPinchDist;
          this._applyZoom(ratio);
        }

        this._lastPinchDist = dist;
        this._isPinching = true;
        this._isPanning = false;
      } else {
        if (this._isPinching) {
          this._isPinching = false;
        }
        this._lastPinchDist = 0;
      }
    },

    _clampPan: function () {
      var basePan = 40; // allow small pan even at 1x for feel
      var maxPanX = basePan + (this.zoomLevel - 1) * GRID_AREA_RIGHT * 0.5;
      var maxPanY = basePan + (this.zoomLevel - 1) * (H - HEADER_H) * 0.5;
      this.gridLayer.x = Phaser.Math.Clamp(this.gridLayer.x, -maxPanX, maxPanX);
      this.gridLayer.y = Phaser.Math.Clamp(this.gridLayer.y, -maxPanY, maxPanY);
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
