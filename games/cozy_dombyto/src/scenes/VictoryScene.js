// Cozy Dombyto — Victory scene (landscape)
(function () {

  var W = 932, H = 430;

  window.VictoryScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function VictoryScene() {
      Phaser.Scene.call(this, { key: 'VictoryScene' });
    },

    create: function () {
      // Warm cream background
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);

      // Generate confetti texture
      this._generateConfettiTextures();

      // Confetti particles
      this._spawnConfetti();

      // --- Left side: Title + Party + Dombyto ---
      var leftX = W * 0.28;

      var title = this.add.text(leftX, H * 0.10, '🎉 ¡100%! 🎉', {
        fontSize: '42px', fontFamily: '"Baloo 2", cursive',
        color: '#e8a435', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: title,
        alpha: 1, scaleX: 1.1, scaleY: 1.1,
        duration: 600,
        ease: 'Back.easeOut'
      });

      this.time.delayedCall(400, function () {
        this.add.image(leftX - 40, H * 0.30, 'yaiza_celebrating').setOrigin(0.5).setScale(0.28);
        this.add.text(leftX + 30, H * 0.28, '🎊✨🎂', {
          fontSize: '36px'
        }).setOrigin(0.5);

        this.add.text(leftX, H * 0.43, '¡Yaiza y sus amigas celebran!', {
          fontSize: '16px', fontFamily: '"Baloo 2", cursive',
          color: '#5a4a3a', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(leftX, H * 0.48, '¡La luz está de vuelta gracias a Dombyto!', {
          fontSize: '13px', fontFamily: '"Baloo 2", cursive',
          color: '#7a6a5a'
        }).setOrigin(0.5);
      }.bind(this));

      // Dombyto hero
      this.time.delayedCall(800, function () {
        this.add.image(leftX, H * 0.64, 'dombyto_celebrating').setOrigin(0.5).setScale(0.28);
        this.add.text(leftX, H * 0.76, 'Dombyto', {
          fontSize: '14px', fontFamily: '"Baloo 2", cursive',
          color: '#5a4a3a', fontStyle: 'bold'
        }).setOrigin(0.5);

        var bg = this.add.graphics();
        bg.fillStyle(0xfaf6f0, 1);
        bg.fillRoundedRect(leftX - 150, H * 0.80, 300, 48, 12);
        bg.lineStyle(2, 0xc4b8a4, 1);
        bg.strokeRoundedRect(leftX - 150, H * 0.80, 300, 48, 12);

        this.add.text(leftX, H * 0.80 + 24, '¡Lo logré gracias a mi taller organizado!', {
          fontSize: '12px', fontFamily: '"Baloo 2", cursive',
          color: '#3d2b1f', fontStyle: 'italic', align: 'center'
        }).setOrigin(0.5);
      }.bind(this));

      // --- Right side: Checklist + Rounds ---
      var rightX = W * 0.72;

      this.time.delayedCall(1200, function () {
        var closingBg = this.add.graphics();
        closingBg.fillStyle(0xe0d4c0, 0.8);
        closingBg.fillRoundedRect(rightX - 160, H * 0.15, 320, 120, 12);

        this.add.text(rightX, H * 0.19, '📋 Recuerda para completar tu checklist:', {
          fontSize: '12px', fontFamily: '"Baloo 2", cursive',
          color: '#5a4a3a', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.add.text(rightX, H * 0.28, '📸 Haz una foto del puesto listo', {
          fontSize: '11px', fontFamily: '"Baloo 2", cursive',
          color: '#7a6a5a'
        }).setOrigin(0.5, 0);

        this.add.text(rightX, H * 0.36, '📝 Escribe 3 líneas en la bitácora', {
          fontSize: '11px', fontFamily: '"Baloo 2", cursive',
          color: '#7a6a5a'
        }).setOrigin(0.5, 0);
      }.bind(this));

      this.time.delayedCall(1600, function () {
        var rounds = window.GameState.roundNumber;
        this.add.text(rightX, H * 0.60, '🏆 Lo lograste en ' + rounds + ' intento' + (rounds > 1 ? 's' : ''), {
          fontSize: '14px', fontFamily: '"Baloo 2", cursive',
          color: '#e8a435', fontStyle: 'bold'
        }).setOrigin(0.5);
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

    _generateConfettiTextures: function () {
      var colors = [0xe8a435, 0x5b8c5a, 0xd4b896, 0xd9534f, 0x7ec8e3];
      for (var i = 0; i < colors.length; i++) {
        var key = 'confetti_' + i;
        if (this.textures.exists(key)) continue;
        var g = this.make.graphics({ add: false });
        g.fillStyle(colors[i], 1);
        g.fillRect(0, 0, 8, 8);
        g.generateTexture(key, 8, 8);
        g.destroy();
      }
    },

    _spawnConfetti: function () {
      for (var i = 0; i < 5; i++) {
        this.add.particles(0, 0, 'confetti_' + i, {
          x: { min: 0, max: W },
          y: -10,
          speedY: { min: 60, max: 160 },
          speedX: { min: -40, max: 40 },
          rotate: { min: 0, max: 360 },
          scale: { start: 1, end: 0.5 },
          lifespan: 4000,
          quantity: 1,
          frequency: 120,
          gravityY: 30
        });
      }
    }
  });

})();
