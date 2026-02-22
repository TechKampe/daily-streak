// Cozy Dombyto — Isometric grid 5×5
(function () {

  var TILE_W = 192;
  var TILE_H = 96;
  var COLS = 6;
  var ROWS = 6;

  // Colors — warm wood casual palette (Homescapes-inspired)
  var TOP_COLOR   = 0xd4b896;  // light hardwood floor
  var LEFT_COLOR  = 0xb89a78;  // medium wood shadow
  var RIGHT_COLOR = 0xa6845e;  // darker wood shadow
  var STROKE_COLOR = 0x8b7355; // wood grain outline
  var HIGHLIGHT_COLOR = 0x5b8c5a; // green placement highlight
  var DEPTH = 12; // tile depth in pixels for 3D effect

  window.IsometricGrid = function (scene, originX, originY) {
    this.scene = scene;
    this.originX = originX;
    this.originY = originY;
    this.cols = COLS;
    this.rows = ROWS;
    this.tileW = TILE_W;
    this.tileH = TILE_H;
    this.occupancy = {}; // "col,row" → furnitureId

    // Graphics layer for floor tiles
    this.floorGfx = scene.add.graphics().setDepth(0);
    // Graphics layer for highlights (drawn on top)
    this.highlightGfx = scene.add.graphics().setDepth(1);

    this._drawFloor();
  };

  var proto = IsometricGrid.prototype;

  proto.cellToScreen = function (col, row) {
    return {
      x: this.originX + (col - row) * (this.tileW / 2),
      y: this.originY + (col + row) * (this.tileH / 2)
    };
  };

  proto.screenToCell = function (sx, sy) {
    var dx = sx - this.originX;
    var dy = sy - this.originY;
    var hw = this.tileW / 2;
    var hh = this.tileH / 2;
    var col = Math.floor((dx / hw + dy / hh) / 2);
    var row = Math.floor((dy / hh - dx / hw) / 2);
    return { col: col, row: row };
  };

  proto.isValidCell = function (col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  };

  proto.canPlaceFurniture = function (col, row, gridW, gridH) {
    for (var dc = 0; dc < gridW; dc++) {
      for (var dr = 0; dr < gridH; dr++) {
        var c = col + dc, r = row + dr;
        if (!this.isValidCell(c, r)) return false;
        if (this.occupancy[c + ',' + r]) return false;
      }
    }
    return true;
  };

  proto.occupyCells = function (col, row, gridW, gridH, furnitureId) {
    for (var dc = 0; dc < gridW; dc++) {
      for (var dr = 0; dr < gridH; dr++) {
        this.occupancy[(col + dc) + ',' + (row + dr)] = furnitureId;
      }
    }
  };

  proto.freeCells = function (col, row, gridW, gridH) {
    for (var dc = 0; dc < gridW; dc++) {
      for (var dr = 0; dr < gridH; dr++) {
        delete this.occupancy[(col + dc) + ',' + (row + dr)];
      }
    }
  };

  proto.getFurnitureIdAtCell = function (col, row) {
    return this.occupancy[col + ',' + row] || null;
  };

  // --- Drawing ---

  proto._drawFloor = function () {
    // Floor tiles hidden — background image provides the floor visual.
    // Only the highlight layer is used for drag feedback.
  };

  proto._drawTile = function (g, cx, cy, top, left, right, stroke) {
    var hw = this.tileW / 2;
    var hh = this.tileH / 2;
    var d = DEPTH;

    // Left face
    g.fillStyle(left, 1);
    g.beginPath();
    g.moveTo(cx - hw, cy);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx, cy + hh + d);
    g.lineTo(cx - hw, cy + d);
    g.closePath();
    g.fillPath();

    // Right face
    g.fillStyle(right, 1);
    g.beginPath();
    g.moveTo(cx + hw, cy);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx, cy + hh + d);
    g.lineTo(cx + hw, cy + d);
    g.closePath();
    g.fillPath();

    // Top face (rhombus)
    g.fillStyle(top, 1);
    g.beginPath();
    g.moveTo(cx, cy - hh);
    g.lineTo(cx + hw, cy);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx - hw, cy);
    g.closePath();
    g.fillPath();

    // Stroke
    g.lineStyle(2, stroke, 0.5);
    g.beginPath();
    g.moveTo(cx, cy - hh);
    g.lineTo(cx + hw, cy);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx - hw, cy);
    g.closePath();
    g.strokePath();
  };

  proto.highlightCells = function (col, row, gridW, gridH) {
    var g = this.highlightGfx;
    g.clear();
    for (var dc = 0; dc < gridW; dc++) {
      for (var dr = 0; dr < gridH; dr++) {
        var c = col + dc, r = row + dr;
        if (this.isValidCell(c, r)) {
          var p = this.cellToScreen(c, r);
          this._drawTileFlat(g, p.x, p.y, HIGHLIGHT_COLOR, 0.45);
        }
      }
    }
  };

  proto.highlightSingleCell = function (col, row) {
    this.highlightCells(col, row, 1, 1);
  };

  proto.clearHighlights = function () {
    this.highlightGfx.clear();
  };

  proto._drawTileFlat = function (g, cx, cy, color, alpha) {
    var hw = this.tileW / 2;
    var hh = this.tileH / 2;
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(cx, cy - hh);
    g.lineTo(cx + hw, cy);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx - hw, cy);
    g.closePath();
    g.fillPath();
    g.lineStyle(4, color, 0.8);
    g.strokePath();
  };

  // Expose constants
  IsometricGrid.TILE_W = TILE_W;
  IsometricGrid.TILE_H = TILE_H;
  IsometricGrid.COLS = COLS;
  IsometricGrid.ROWS = ROWS;

})();
