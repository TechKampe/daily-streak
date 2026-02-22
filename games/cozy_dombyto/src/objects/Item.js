// Cozy Dombyto — Draggable item on the grid
(function () {

  window.ItemObject = function (scene, def) {
    this.scene = scene;
    this.def = def;
    this.placedOnFurniture = null; // FurnitureObject ref
    this.furnitureOriginKey = null; // "col,row" of the furniture origin cell

    this.container = scene.add.container(0, 0).setDepth(50);

    var itemScale = def.spriteScale !== undefined ? def.spriteScale : 0.44;
    this.sprite = scene.add.image(0, 0, 'item_' + def.id).setScale(itemScale);
    this.container.add(this.sprite);

    // Make interactive
    this.container.setSize(72, 72);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-36, -36, 72, 72),
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
