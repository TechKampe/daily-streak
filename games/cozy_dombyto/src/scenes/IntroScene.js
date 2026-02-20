// Cozy Dombyto — Intro scene (Yaiza's call) — landscape
(function () {

  var W = 932, H = 430;

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

      // --- First round: full intro (landscape two-column layout) ---

      // Background
      this.add.rectangle(W / 2, H / 2, W, H, 0xfff5eb);

      // Title
      this.add.text(W / 2, 30, '📞 Llamada entrante...', {
        fontSize: '20px', fontFamily: '"Baloo 2", cursive',
        color: '#e8917a', fontStyle: 'bold'
      }).setOrigin(0.5);

      // --- Left column: Characters ---
      var leftX = W * 0.25;

      // Yaiza
      this.add.text(leftX - 60, H * 0.28, '😟', { fontSize: '64px' }).setOrigin(0.5);
      this.add.text(leftX - 60, H * 0.40, 'Yaiza', {
        fontSize: '13px', fontFamily: '"Baloo 2", cursive',
        color: '#6b4c3b', fontStyle: 'bold'
      }).setOrigin(0.5);

      this._createBubble(
        leftX + 80, H * 0.28,
        '¡Dombyto! ¡Se ha ido la luz\ny es mi cumpleaños!\n¡Ven rápido!',
        240
      );

      // Dombyto
      this.add.text(leftX + 180, H * 0.65, '😰', { fontSize: '64px' }).setOrigin(0.5);
      this.add.text(leftX + 180, H * 0.77, 'Dombyto', {
        fontSize: '13px', fontFamily: '"Baloo 2", cursive',
        color: '#6b4c3b', fontStyle: 'bold'
      }).setOrigin(0.5);

      this._createBubble(
        leftX + 20, H * 0.65,
        '¡30 segundos y estoy ahí!\n...si encuentro mis cosas.',
        220
      );

      // --- Right column: Instructions + CTA ---
      var rightX = W * 0.7;

      this.add.text(rightX, H * 0.18, '🏠', { fontSize: '44px' }).setOrigin(0.5);
      this.add.text(rightX, H * 0.30, 'El taller de Dombyto está\nhecho un desastre.\n¡Ayúdale a organizarlo!', {
        fontSize: '14px', fontFamily: '"Baloo 2", cursive',
        color: '#8b6c5c', align: 'center', lineSpacing: 4
      }).setOrigin(0.5);

      var instrY = H * 0.52;
      var instructions = [
        '🔧  Arrastra muebles al taller',
        '🛠️  Coloca herramientas en los muebles',
        '▶️  Pulsa "¡Sal!" cuando esté listo'
      ];
      for (var i = 0; i < instructions.length; i++) {
        this.add.text(rightX, instrY + i * 26, instructions[i], {
          fontSize: '12px', fontFamily: '"Baloo 2", cursive',
          color: '#a0887a'
        }).setOrigin(0.5);
      }

      // CTA Button
      var btn = this.add.text(rightX, H * 0.85, '🏠 Organizar taller', {
        fontSize: '20px', fontFamily: '"Baloo 2", cursive',
        backgroundColor: '#e8917a', color: '#ffffff',
        padding: { x: 28, y: 12 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

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
      var bg = this.add.graphics();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(x - width / 2, y - 36, width, 72, 12);
      bg.lineStyle(2, 0xe8d4c0, 1);
      bg.strokeRoundedRect(x - width / 2, y - 36, width, 72, 12);

      this.add.text(x, y, text, {
        fontSize: '12px', fontFamily: '"Baloo 2", cursive',
        color: '#3d2b1f', wordWrap: { width: width - 20 },
        align: 'center', lineSpacing: 2
      }).setOrigin(0.5);
    }
  });

})();
