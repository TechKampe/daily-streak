// Cozy Dombyto — Intro scene (3-step tap-through) — landscape
(function () {

  var W = 1864, H = 860;

  window.IntroScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function IntroScene() {
      Phaser.Scene.call(this, { key: 'IntroScene' });
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

      // Title
      objs.push(this.add.text(cx - 80, H * 0.08, 'El taller de Dombyto está\nhecho un desastre.\n¡Ayúdale a organizarlo!', {
        fontSize: '32px', fontFamily: '"Baloo 2", cursive',
        color: '#7a6a5a', align: 'center', lineSpacing: 6
      }).setOrigin(0.5));

      // Instruction panel background
      var panelW = 680, panelH = 420;
      var panelX = cx - 80 - panelW / 2;
      var panelY = H * 0.22;
      var panelGfx = this.add.graphics();
      panelGfx.fillStyle(0xe8d5b8, 1);
      panelGfx.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
      panelGfx.lineStyle(3, 0xc4a882, 1);
      panelGfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);
      objs.push(panelGfx);

      // Instruction rows with item sprites
      var instructions = [
        { sprite: 'item_estanteria',     text: 'Arrastra muebles al taller',        scale: 0.40 },
        { sprite: 'item_destornillador', text: 'Coloca herramientas en los muebles', scale: 0.45 }
      ];
      var rowH = panelH / 3;
      var iconX = panelX + 80;
      var textX = panelX + 160;

      for (var i = 0; i < instructions.length; i++) {
        var rowY = panelY + rowH / 2 + i * rowH;

        // Separator line between rows
        if (i > 0) {
          var sepGfx = this.add.graphics();
          sepGfx.lineStyle(1, 0xc4a882, 0.5);
          sepGfx.lineBetween(panelX + 20, panelY + i * rowH, panelX + panelW - 20, panelY + i * rowH);
          objs.push(sepGfx);
        }

        // Item sprite
        objs.push(this.add.image(iconX, rowY, instructions[i].sprite)
          .setOrigin(0.5).setScale(instructions[i].scale));

        // Instruction text
        objs.push(this.add.text(textX, rowY, instructions[i].text, {
          fontSize: '26px', fontFamily: '"Baloo 2", cursive',
          color: '#5a4a3a', lineSpacing: 4
        }).setOrigin(0, 0.5));
      }

      // Row 3: "Pulsa [mini button] cuando esté listo"
      var row3Y = panelY + rowH / 2 + 2 * rowH;
      var sep3 = this.add.graphics();
      sep3.lineStyle(1, 0xc4a882, 0.5);
      sep3.lineBetween(panelX + 20, panelY + 2 * rowH, panelX + panelW - 20, panelY + 2 * rowH);
      objs.push(sep3);

      // "Pulsa" aligned to iconX (same left edge as icon in rows above)
      objs.push(this.add.text(iconX, row3Y, 'Pulsa', {
        fontSize: '26px', fontFamily: '"Baloo 2", cursive',
        color: '#5a4a3a'
      }).setOrigin(0, 0.5));

      // Mini replica of the "Sal a la urgencia" button
      var miniBtnX = iconX + 175;
      var miniBtnImg = this.add.image(miniBtnX, row3Y, 'ui_play').setScale(1.2);
      objs.push(miniBtnImg);
      objs.push(this.add.text(miniBtnX, row3Y, 'Sal a la urgencia', {
        fontSize: '16px', fontFamily: '"Baloo 2", cursive',
        color: '#ffffff', fontStyle: 'bold',
        stroke: '#3a1a5a', strokeThickness: 2
      }).setOrigin(0.5));

      objs.push(this.add.text(miniBtnX + 105, row3Y, 'cuando esté listo', {
        fontSize: '26px', fontFamily: '"Baloo 2", cursive',
        color: '#5a4a3a'
      }).setOrigin(0, 0.5));

      // Dombyto happy on the right, slightly overlapping the panel
      objs.push(this.add.image(panelX + panelW + 40, H * 0.42, 'dombyto_happy').setOrigin(0.5).setScale(0.7));

      // CTA Button
      var btnY = H * 0.88;
      var btnImg = this.add.image(cx - 80, btnY, 'ui_play').setScale(2.4)
        .setInteractive({ useHandCursor: true });
      objs.push(btnImg);

      var btnLabel = this.add.text(cx - 80, btnY, 'Organizar taller', {
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
