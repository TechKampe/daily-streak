// Cozy Dombyto — Intro scene (Yaiza's call)
(function () {

  var W = 430, H = 932;

  window.IntroScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function IntroScene() {
      Phaser.Scene.call(this, { key: 'IntroScene' });
    },

    create: function () {
      var isFirstRound = window.GameState.roundNumber === 0;

      if (!isFirstRound) {
        // Quick skip on repeat rounds
        var skipBg = this.add.rectangle(W / 2, H / 2, W, H, 0xfff5eb);
        var skipText = this.add.text(W / 2, H / 2, '🔄 ¡Inténtalo de nuevo!', {
          fontSize: '22px', fontFamily: '"Baloo 2", cursive',
          color: '#e8917a', fontStyle: 'bold'
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

      // --- First round: full intro ---

      // Background
      this.add.rectangle(W / 2, H / 2, W, H, 0xfff5eb);

      // Title
      this.add.text(W / 2, H * 0.06, '📞 Llamada entrante...', {
        fontSize: '18px', fontFamily: '"Baloo 2", cursive',
        color: '#e8917a', fontStyle: 'bold'
      }).setOrigin(0.5);

      // --- Yaiza character ---
      this.add.text(W * 0.25, H * 0.18, '😟', { fontSize: '72px' }).setOrigin(0.5);
      this.add.text(W * 0.25, H * 0.24, 'Yaiza', {
        fontSize: '14px', fontFamily: '"Baloo 2", cursive',
        color: '#6b4c3b', fontStyle: 'bold'
      }).setOrigin(0.5);

      // Yaiza bubble
      this._createBubble(
        W * 0.6, H * 0.18,
        '¡Dombyto! ¡Se ha ido la luz\ny es mi cumpleaños!\n¡Ven rápido!',
        280
      );

      // --- Dombyto character ---
      this.add.text(W * 0.75, H * 0.38, '😰', { fontSize: '72px' }).setOrigin(0.5);
      this.add.text(W * 0.75, H * 0.44, 'Dombyto', {
        fontSize: '14px', fontFamily: '"Baloo 2", cursive',
        color: '#6b4c3b', fontStyle: 'bold'
      }).setOrigin(0.5);

      // Dombyto bubble
      this._createBubble(
        W * 0.35, H * 0.38,
        '¡30 segundos y estoy ahí!\n...si encuentro mis cosas.',
        260
      );

      // --- Workshop illustration ---
      this.add.text(W / 2, H * 0.56, '🏠', { fontSize: '48px' }).setOrigin(0.5);
      this.add.text(W / 2, H * 0.62, 'El taller de Dombyto está\nhecho un desastre.\n¡Ayúdale a organizarlo!', {
        fontSize: '15px', fontFamily: '"Baloo 2", cursive',
        color: '#8b6c5c', align: 'center', lineSpacing: 4
      }).setOrigin(0.5);

      // --- Instructions ---
      var instrY = H * 0.74;
      var instructions = [
        '🔧  Arrastra muebles al taller',
        '🛠️  Coloca herramientas en los muebles',
        '▶️  Pulsa "¡Sal!" cuando esté listo'
      ];
      for (var i = 0; i < instructions.length; i++) {
        this.add.text(W / 2, instrY + i * 30, instructions[i], {
          fontSize: '13px', fontFamily: '"Baloo 2", cursive',
          color: '#a0887a'
        }).setOrigin(0.5);
      }

      // --- CTA Button ---
      var btn = this.add.text(W / 2, H * 0.9, '🏠 Organizar taller', {
        fontSize: '22px', fontFamily: '"Baloo 2", cursive',
        backgroundColor: '#e8917a', color: '#ffffff',
        padding: { x: 32, y: 16 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      // Pulse animation
      this.tweens.add({
        targets: btn,
        scaleX: 1.05, scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      btn.on('pointerdown', function () {
        window.GameState.roundNumber = 1;
        this.scene.start('WorkshopScene');
      }, this);
    },

    _createBubble: function (x, y, text, width) {
      // White rounded bubble
      var bg = this.add.graphics();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(x - width / 2, y - 40, width, 80, 14);
      bg.lineStyle(2, 0xe8d4c0, 1);
      bg.strokeRoundedRect(x - width / 2, y - 40, width, 80, 14);

      this.add.text(x, y, text, {
        fontSize: '13px', fontFamily: '"Baloo 2", cursive',
        color: '#3d2b1f', wordWrap: { width: width - 24 },
        align: 'center', lineSpacing: 2
      }).setOrigin(0.5);
    }
  });

})();
