// Cozy Dombyto — Placed furniture on the grid
(function () {

  window.FurnitureObject = function (scene, def, col, row, grid) {
    this.scene = scene;
    this.def = def;
    this.col = col;
    this.row = row;
    this.grid = grid;
    this.attachedItems = []; // Array of ItemObject instances
    this.originKey = col + ',' + row;

    // Calculate screen position (center of the multi-cell footprint)
    var centerCol = col + (def.gridW - 1) / 2;
    var centerRow = row + (def.gridH - 1) / 2;
    var pos = grid.cellToScreen(centerCol, centerRow);

    this.container = scene.add.container(pos.x, pos.y).setDepth(10 + row + col);

    // Background highlight for the furniture area
    var hw = grid.tileW * def.gridW / 2;
    var hh = grid.tileH * def.gridH / 2;
    this.bgGfx = scene.add.graphics();
    this.bgGfx.fillStyle(0xd4a99a, 0.35);
    this.bgGfx.fillRoundedRect(-hw, -hh - 4, hw * 2, hh * 2 + 8, 6);
    this.container.add(this.bgGfx);

    // Emoji
    var fontSize = def.gridW >= 2 ? '44px' : '36px';
    this.emoji = scene.add.text(0, -6, def.emoji, {
      fontSize: fontSize,
      padding: { x: 4, y: 4 }
    }).setOrigin(0.5, 0.5);
    this.container.add(this.emoji);

    // Label
    this.label = scene.add.text(0, 18, def.label, {
      fontSize: '9px', fontFamily: '"Baloo 2", cursive',
      color: '#5a3e28', backgroundColor: 'rgba(255,245,235,0.85)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0);
    this.container.add(this.label);

    // Make interactive for tap-to-remove
    this.container.setSize(hw * 2 + 10, hh * 2 + 30);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-(hw + 5), -(hh + 10), hw * 2 + 10, hh * 2 + 30),
      Phaser.Geom.Rectangle.Contains
    );
  };

  var proto = FurnitureObject.prototype;

  proto.attachItem = function (itemObj) {
    this.attachedItems.push(itemObj);
    this._layoutItems();
  };

  proto.detachItem = function (itemObj) {
    var idx = this.attachedItems.indexOf(itemObj);
    if (idx !== -1) this.attachedItems.splice(idx, 1);
    this._layoutItems();
  };

  proto._layoutItems = function () {
    var count = this.attachedItems.length;
    var spacing = Math.min(24, 60 / Math.max(count, 1));
    var startX = -(count - 1) * spacing / 2;

    for (var i = 0; i < count; i++) {
      var item = this.attachedItems[i];
      var tx = startX + i * spacing;
      var ty = -28 - (i % 2) * 10;
      item.container.setPosition(this.container.x + tx, this.container.y + ty);
    }
  };

  proto.getItemCount = function () {
    return this.attachedItems.length;
  };

  proto.destroy = function () {
    // Destroy attached items
    for (var i = 0; i < this.attachedItems.length; i++) {
      this.attachedItems[i].destroy();
    }
    this.attachedItems = [];
    this.container.destroy();
  };

})();
