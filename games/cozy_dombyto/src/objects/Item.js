// Cozy Dombyto — Draggable item on the grid
(function () {

  window.ItemObject = function (scene, def) {
    this.scene = scene;
    this.def = def;
    this.placedOnFurniture = null; // FurnitureObject ref
    this.furnitureOriginKey = null; // "col,row" of the furniture origin cell

    this.container = scene.add.container(0, 0).setDepth(50);

    this.emoji = scene.add.text(0, 0, def.emoji, {
      fontSize: '28px',
      padding: { x: 2, y: 2 }
    }).setOrigin(0.5, 0.5);
    this.container.add(this.emoji);

    // Make interactive
    this.container.setSize(36, 36);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-18, -18, 36, 36),
      Phaser.Geom.Rectangle.Contains
    );
  };

  var proto = ItemObject.prototype;

  proto.setPosition = function (x, y) {
    this.container.setPosition(x, y);
  };

  proto.destroy = function () {
    this.container.destroy();
  };

})();
