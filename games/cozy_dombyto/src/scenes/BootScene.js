// Cozy Dombyto — Boot / loading scene
(function () {

  var W = 1864, H = 860;

  window.BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
      Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
      // --- Loading UI (drawn with graphics, no assets needed) ---
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);

      this.add.text(W / 2, H * 0.42, 'Cargando juego...', {
        fontSize: '28px', fontFamily: 'Arial, sans-serif',
        color: '#7a6a5a'
      }).setOrigin(0.5);

      // Progress bar
      var barW = 480, barH = 28, barX = W / 2 - barW / 2, barY = H * 0.56;

      var barBg = this.add.graphics();
      barBg.fillStyle(0xd4c4a8, 1);
      barBg.fillRoundedRect(barX, barY, barW, barH, 14);

      var barFill = this.add.graphics();

      this.load.on('progress', function (value) {
        barFill.clear();
        barFill.fillStyle(0xe8a435, 1);
        barFill.fillRoundedRect(barX, barY, Math.max(barW * value, barH), barH, 14);
      });

      // --- Load all game assets ---
      this.load.image('dombyto_still', 'assets/characters/dombyto_still.png');
      this.load.image('dombyto_happy', 'assets/characters/dombyto_happy.png');
      this.load.image('dombyto_worried', 'assets/characters/dombyto_worried.png');
      this.load.image('dombyto_celebrating', 'assets/characters/dombyto_celebrating.png');
      this.load.image('yaiza_worried', 'assets/characters/yaiza_worried.png');
      this.load.image('yaiza_happy', 'assets/characters/yaiza_happy.png');

      // Workshop background
      this.load.image('workshop_bg', 'assets/background/bg.jpg');

      // UI buttons
      this.load.image('ui_button', 'assets/ui/button.png');
      this.load.image('ui_play', 'assets/ui/play.png');

      // Item sprites
      var allItems = window.ITEMS_DATA;
      var cats = Object.keys(allItems);
      for (var c = 0; c < cats.length; c++) {
        var arr = allItems[cats[c]];
        for (var i = 0; i < arr.length; i++) {
          this.load.image('item_' + arr[i].id, 'assets/items/' + arr[i].id + '.png');
        }
      }
    },

    create: function () {
      this.scene.start('IntroScene');
    }
  });

})();
