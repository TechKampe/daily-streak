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

    var hw = grid.tileW * def.gridW / 2;
    var hh = grid.tileH * def.gridH / 2;

    // Sprite
    var spriteScale = def.gridW >= 2 ? 0.90 : 0.50;
    this.sprite = scene.add.image(-20, -30, 'item_' + def.id).setScale(spriteScale);
    this.container.add(this.sprite);

    // Label
    this.label = scene.add.text(0, 36, def.label, {
      fontSize: '18px', fontFamily: '"Baloo 2", cursive',
      color: '#5a4a3a', backgroundColor: 'rgba(245,230,211,0.9)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 0);
    this.container.add(this.label);

    // Make interactive for tap-to-remove
    this.container.setSize(hw * 2 + 20, hh * 2 + 60);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-(hw + 10), -(hh + 20), hw * 2 + 20, hh * 2 + 60),
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
    var spacing = Math.min(48, 120 / Math.max(count, 1));
    var startX = -(count - 1) * spacing / 2;

    for (var i = 0; i < count; i++) {
      var item = this.attachedItems[i];
      var tx = startX + i * spacing;
      var ty = -56 - (i % 2) * 20;
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
