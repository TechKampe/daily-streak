// Cozy Dombyto — Draggable item on the grid
(function () {

  window.ItemObject = function (scene, def) {
    this.scene = scene;
    this.def = def;
    this.placedOnFurniture = null; // FurnitureObject ref
    this.furnitureOriginKey = null; // "col,row" of the furniture origin cell

    this.container = scene.add.container(0, 0).setDepth(50);

    this.sprite = scene.add.image(0, 0, 'item_' + def.id).setScale(0.22);
    this.container.add(this.sprite);

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
