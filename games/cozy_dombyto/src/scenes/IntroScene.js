// Cozy Dombyto — Intro scene (3-step tap-through) — landscape
(function () {

  var W = 1864, H = 860;

  window.IntroScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function IntroScene() {
      Phaser.Scene.call(this, { key: 'IntroScene' });
    },

    preload: function () {
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
      var isFirstRound = window.GameState.roundNumber === 0;

      if (!isFirstRound) {
        // Quick skip on repeat rounds
        this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);
        var skipText = this.add.text(W / 2, H / 2, '🔄 ¡Inténtalo de nuevo!', {
          fontSize: '44px', fontFamily: '"Baloo 2", cursive',
          color: '#e8a435', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: skipText,
          alpha: 1,
          duration: 300,
          yoyo: true,
          hold: 500,
          onComplete: function () {
            this.scene.start('WorkshopScene');
          }.bind(this)
        });
        return;
      }

      // --- First round: 3-step intro ---
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);
      this.step = 0;
      this.stepObjects = [];
      this.transitioning = false;
      this._showStep(1);
    },

    _showStep: function (n) {
      this.step = n;
      var objects;
      if (n === 1) objects = this._buildStep1();
      else if (n === 2) objects = this._buildStep2();
      else objects = this._buildStep3();

      this.stepObjects = objects;

      // Fade in all objects
      for (var i = 0; i < objects.length; i++) {
        objects[i].setAlpha(0);
      }
      this.tweens.add({
        targets: objects,
        alpha: 1,
        duration: 300,
        ease: 'Power1'
      });

      // Tap-to-advance for steps 1-2
      if (n <= 2) {
        var self = this;
        var handler = function () {
          if (self.transitioning) return;
          self.transitioning = true;
          self.input.off('pointerdown', handler);
          self.tweens.add({
            targets: self.stepObjects,
            alpha: 0,
            duration: 200,
            onComplete: function () {
              for (var j = 0; j < self.stepObjects.length; j++) {
                self.stepObjects[j].destroy();
              }
              self.stepObjects = [];
              self.transitioning = false;
              self._showStep(n + 1);
            }
          });
        };
        this.input.on('pointerdown', handler);
      }
    },

    // --- Step 1: Dombyto alone, phone ringing ---
    _buildStep1: function () {
      var objs = [];
      var cx = W / 2;

      objs.push(this.add.text(cx, 60, '📞 Llamada entrante...', {
        fontSize: '40px', fontFamily: '"Baloo 2", cursive',
        color: '#e8a435', fontStyle: 'bold'
      }).setOrigin(0.5));

      // Dombyto still — centered
      objs.push(this.add.image(cx - 160, H * 0.45, 'dombyto_still').setOrigin(0.5).setScale(0.6));

      // Speech bubble
      var bubbleObjs = this._createBubble(
        cx + 160, H * 0.40, 'Dombyto',
        'Vaya, ¿quién llamará\na estas horas?',
        420, 130
      );
      for (var i = 0; i < bubbleObjs.length; i++) objs.push(bubbleObjs[i]);

      // Hint
      objs.push(this._createHint());

      return objs;
    },

    // --- Step 2: Yaiza & Dombyto dialog ---
    _buildStep2: function () {
      var objs = [];
      var cx = W / 2;

      objs.push(this.add.text(cx, 60, '📞 Llamada entrante...', {
        fontSize: '40px', fontFamily: '"Baloo 2", cursive',
        color: '#e8a435', fontStyle: 'bold'
      }).setOrigin(0.5));

      // Yaiza — left side
      objs.push(this.add.image(cx - 320, H * 0.28, 'yaiza_worried').setOrigin(0.5).setScale(0.56));

      var yaizaBubble = this._createBubble(
        cx, H * 0.28, 'Yaiza',
        '¡Dombyto! ¡Se ha ido la luz\ny es mi cumpleaños!\n¡Ven rápido!',
        480
      );
      for (var i = 0; i < yaizaBubble.length; i++) objs.push(yaizaBubble[i]);

      // Dombyto — right side
      objs.push(this.add.image(cx + 320, H * 0.68, 'dombyto_worried').setOrigin(0.5).setScale(0.56));

      var domBubble = this._createBubble(
        cx, H * 0.68, 'Dombyto',
        '¡30 segundos y estoy ahí!\n...si encuentro mis cosas.\n¡Que no cunda el pánico!',
        480
      );
      for (var i = 0; i < domBubble.length; i++) objs.push(domBubble[i]);

      // Hint
      objs.push(this._createHint());

      return objs;
    },

    // --- Step 3: Instructions + CTA ---
    _buildStep3: function () {
      var objs = [];
      var cx = W / 2;

      objs.push(this.add.text(cx, H * 0.12, '🏠', { fontSize: '88px' }).setOrigin(0.5));

      objs.push(this.add.text(cx, H * 0.26, 'El taller de Dombyto está\nhecho un desastre.\n¡Ayúdale a organizarlo!', {
        fontSize: '32px', fontFamily: '"Baloo 2", cursive',
        color: '#7a6a5a', align: 'center', lineSpacing: 8
      }).setOrigin(0.5));

      var instrY = H * 0.50;
      var instructions = [
        '🔧  Arrastra muebles al taller',
        '🛠️  Coloca herramientas en los muebles',
        '▶️  Pulsa "Sal a la urgencia" cuando esté listo'
      ];
      for (var i = 0; i < instructions.length; i++) {
        objs.push(this.add.text(cx, instrY + i * 56, instructions[i], {
          fontSize: '28px', fontFamily: '"Baloo 2", cursive',
          color: '#8a7a6a'
        }).setOrigin(0.5));
      }

      // CTA Button
      var btnY = H * 0.85;
      var btnImg = this.add.image(cx, btnY, 'ui_play').setScale(2.4)
        .setInteractive({ useHandCursor: true });
      objs.push(btnImg);

      var btnLabel = this.add.text(cx, btnY, 'Organizar taller', {
        fontSize: '32px', fontFamily: '"Baloo 2", cursive',
        color: '#ffffff', fontStyle: 'bold',
        stroke: '#3a1a5a', strokeThickness: 3
      }).setOrigin(0.5, 0.5);
      objs.push(btnLabel);

      this.tweens.add({
        targets: [btnImg, btnLabel],
        scaleX: '+=0.05', scaleY: '+=0.05',
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      btnImg.on('pointerdown', function () {
        window.GameState.roundNumber = 1;
        this.scene.start('WorkshopScene');
      }, this);

      return objs;
    },

    _createHint: function () {
      var hint = this.add.text(W / 2, H - 50, 'Toca para continuar', {
        fontSize: '24px', fontFamily: '"Baloo 2", cursive',
        color: '#8a7a6a'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: hint,
        alpha: 0.3,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      return hint;
    },

    _createBubble: function (x, y, name, text, width, height) {
      var objs = [];
      var bubbleH = height || 180;
      var top = y - bubbleH / 2;

      var bg = this.add.graphics();
      bg.fillStyle(0xfaf6f0, 1);
      bg.fillRoundedRect(x - width / 2, top, width, bubbleH, 24);
      bg.lineStyle(4, 0xc4b8a4, 1);
      bg.strokeRoundedRect(x - width / 2, top, width, bubbleH, 24);
      objs.push(bg);

      objs.push(this.add.text(x, top + 24, name, {
        fontSize: '18px', fontFamily: '"Baloo 2", cursive',
        color: '#5b8c5a', fontStyle: 'bold'
      }).setOrigin(0.5, 0));

      objs.push(this.add.text(x, top + 52, text, {
        fontSize: '24px', fontFamily: '"Baloo 2", cursive',
        color: '#3d2b1f', wordWrap: { width: width - 40 },
        align: 'center', lineSpacing: 4
      }).setOrigin(0.5, 0));

      return objs;
    }
  });

})();
