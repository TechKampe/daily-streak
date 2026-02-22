// Cozy Dombyto — Victory scene (landscape)
(function () {

  var W = 1864, H = 860;

  window.VictoryScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function VictoryScene() {
      Phaser.Scene.call(this, { key: 'VictoryScene' });
    },

    create: function () {
      // Warm cream background
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);

      // Confetti
      this._generateConfettiTextures();
      this._spawnConfetti();

      // --- Title ---
      var cx = W / 2;
      var title = this.add.text(cx, H * 0.08, '🎉 ¡100%! 🎉', {
        fontSize: '84px', fontFamily: '"Baloo 2", cursive',
        color: '#e8a435', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: title,
        alpha: 1, scaleX: 1.1, scaleY: 1.1,
        duration: 600,
        ease: 'Back.easeOut'
      });

      // --- Left side: Yaiza happy + bubble ---
      var leftX = W * 0.28;

      this.time.delayedCall(400, function () {
        this.add.image(leftX, H * 0.26, 'yaiza_happy').setOrigin(0.5).setScale(0.56);

        this._createBubble(leftX, H * 0.46, 'Yaiza',
          '¡Tenemos luz! ¡Gracias Dombyto!\n¡Ya podemos soplar las velas!', 500);
      }.bind(this));

      // --- Right side: Dombyto celebrating + bubble ---
      var rightX = W * 0.72;

      this.time.delayedCall(800, function () {
        this.add.image(rightX, H * 0.26, 'dombyto_celebrating').setOrigin(0.5).setScale(0.56);

        this._createBubble(rightX, H * 0.46, 'Dombyto',
          '¡Taller organizado, urgencia resuelta!\nEl checklist de cierre funciona.', 500);
      }.bind(this));

      // --- Bottom: Rounds + Checklist + Replay ---
      this.time.delayedCall(1200, function () {
        var rounds = window.GameState.roundNumber;
        this.add.text(cx, H * 0.70, '🏆 Lo lograste en ' + rounds + ' intento' + (rounds > 1 ? 's' : ''), {
          fontSize: '28px', fontFamily: '"Baloo 2", cursive',
          color: '#e8a435', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Checklist reminder
        this.add.text(cx, H * 0.77, 'Recuerda: un cierre pro = mañana arrancas en 30 segundos', {
          fontSize: '22px', fontFamily: '"Baloo 2", cursive',
          color: '#7a6a5a'
        }).setOrigin(0.5);

        // Replay button (ui_play style)
        var btnY = H * 0.90;
        var btnImg = this.add.image(cx, btnY, 'ui_play').setScale(2.4)
          .setInteractive({ useHandCursor: true });
        var btnLabel = this.add.text(cx, btnY, 'Volver a jugar', {
          fontSize: '32px', fontFamily: '"Baloo 2", cursive',
          color: '#ffffff', fontStyle: 'bold',
          stroke: '#3a1a5a', strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
          targets: [btnImg, btnLabel],
          scaleX: '+=0.05', scaleY: '+=0.05',
          duration: 800, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut'
        });

        btnImg.on('pointerdown', function () {
          window.GameState.reset();
          this.scene.start('IntroScene');
        }.bind(this));
      }.bind(this));

      // TASK_COMPLETED after 2.5s
      this.time.delayedCall(2500, function () {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'TASK_COMPLETED' }));
        } else {
          console.log('TASK_COMPLETED');
        }
      });
    },

    _createBubble: function (x, y, name, text, width) {
      var bubbleH = 140;
      var top = y - bubbleH / 2;
      var bg = this.add.graphics();
      bg.fillStyle(0xfaf6f0, 1);
      bg.fillRoundedRect(x - width / 2, top, width, bubbleH, 24);
      bg.lineStyle(4, 0xc4b8a4, 1);
      bg.strokeRoundedRect(x - width / 2, top, width, bubbleH, 24);

      this.add.text(x, top + 18, name, {
        fontSize: '18px', fontFamily: '"Baloo 2", cursive',
        color: '#5b8c5a', fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      this.add.text(x, top + 44, text, {
        fontSize: '22px', fontFamily: '"Baloo 2", cursive',
        color: '#3d2b1f', wordWrap: { width: width - 40 },
        align: 'center', lineSpacing: 4
      }).setOrigin(0.5, 0);
    },

    _generateConfettiTextures: function () {
      var colors = [0xe8a435, 0x5b8c5a, 0xd4b896, 0xd9534f, 0x7ec8e3];
      for (var i = 0; i < colors.length; i++) {
        var key = 'confetti_' + i;
        if (this.textures.exists(key)) continue;
        var g = this.make.graphics({ add: false });
        g.fillStyle(colors[i], 1);
        g.fillRect(0, 0, 16, 16);
        g.generateTexture(key, 16, 16);
        g.destroy();
      }
    },

    _spawnConfetti: function () {
      for (var i = 0; i < 5; i++) {
        this.add.particles(0, 0, 'confetti_' + i, {
          x: { min: 0, max: W },
          y: -20,
          speedY: { min: 120, max: 320 },
          speedX: { min: -80, max: 80 },
          rotate: { min: 0, max: 360 },
          scale: { start: 1, end: 0.5 },
          lifespan: 4000,
          quantity: 1,
          frequency: 120,
          gravityY: 60
        });
      }
    }
  });

})();
