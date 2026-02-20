// Cozy Dombyto — Victory scene
(function () {

  var W = 430, H = 932;

  window.VictoryScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function VictoryScene() {
      Phaser.Scene.call(this, { key: 'VictoryScene' });
    },

    create: function () {
      // Warm cream background
      this.add.rectangle(W / 2, H / 2, W, H, 0xfff5eb);

      // Generate confetti texture
      this._generateConfettiTextures();

      // Confetti particles
      this._spawnConfetti();

      // Big victory text
      var title = this.add.text(W / 2, H * 0.1, '🎉 ¡100%! 🎉', {
        fontSize: '48px', fontFamily: '"Baloo 2", cursive',
        color: '#e8917a', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: title,
        alpha: 1, scaleX: 1.1, scaleY: 1.1,
        duration: 600,
        ease: 'Back.easeOut'
      });

      // Yaiza party scene
      this.time.delayedCall(400, function () {
        // Party emojis
        this.add.text(W / 2, H * 0.22, '🥳👯‍♀️🎊✨🎂', {
          fontSize: '48px'
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.30, '¡Yaiza y sus amigas celebran!', {
          fontSize: '18px', fontFamily: '"Baloo 2", cursive',
          color: '#6b4c3b', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.35, '¡La luz está de vuelta gracias a Dombyto!', {
          fontSize: '14px', fontFamily: '"Baloo 2", cursive',
          color: '#8b6c5c'
        }).setOrigin(0.5);
      }.bind(this));

      // Dombyto hero
      this.time.delayedCall(800, function () {
        this.add.text(W / 2, H * 0.44, '🎉', { fontSize: '72px' }).setOrigin(0.5);
        this.add.text(W / 2, H * 0.51, 'Dombyto', {
          fontSize: '16px', fontFamily: '"Baloo 2", cursive',
          color: '#6b4c3b', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Bubble
        var bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(W / 2 - 160, H * 0.54, 320, 60, 14);
        bg.lineStyle(2, 0xe8d4c0, 1);
        bg.strokeRoundedRect(W / 2 - 160, H * 0.54, 320, 60, 14);

        this.add.text(W / 2, H * 0.54 + 30, '¡Lo logré gracias a mi taller organizado!', {
          fontSize: '14px', fontFamily: '"Baloo 2", cursive',
          color: '#3d2b1f', fontStyle: 'italic', align: 'center'
        }).setOrigin(0.5);
      }.bind(this));

      // Educational closing: checklist items 9-10
      this.time.delayedCall(1200, function () {
        var closingBg = this.add.graphics();
        closingBg.fillStyle(0xf0e4d8, 0.8);
        closingBg.fillRoundedRect(30, H * 0.66, W - 60, 120, 12);

        this.add.text(W / 2, H * 0.68, '📋 Recuerda para completar tu checklist:', {
          fontSize: '13px', fontFamily: '"Baloo 2", cursive',
          color: '#6b4c3b', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.add.text(W / 2, H * 0.72, '📸 Haz una foto del puesto listo', {
          fontSize: '12px', fontFamily: '"Baloo 2", cursive',
          color: '#8b6c5c'
        }).setOrigin(0.5, 0);

        this.add.text(W / 2, H * 0.76, '📝 Escribe 3 líneas en la bitácora', {
          fontSize: '12px', fontFamily: '"Baloo 2", cursive',
          color: '#8b6c5c'
        }).setOrigin(0.5, 0);
      }.bind(this));

      // Rounds taken
      this.time.delayedCall(1600, function () {
        var rounds = window.GameState.roundNumber;
        this.add.text(W / 2, H * 0.84, '🏆 Lo lograste en ' + rounds + ' intento' + (rounds > 1 ? 's' : ''), {
          fontSize: '15px', fontFamily: '"Baloo 2", cursive',
          color: '#e8917a', fontStyle: 'bold'
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
      var colors = [0xff6b9d, 0xf0c4b8, 0xffd166, 0x90ee90, 0x7ec8e3];
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
