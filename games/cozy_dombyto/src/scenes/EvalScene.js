// Cozy Dombyto — Evaluation scene
(function () {

  var W = 430, H = 932;

  window.EvalScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function EvalScene() {
      Phaser.Scene.call(this, { key: 'EvalScene' });
    },

    create: function () {
      var result = window.RulesEngine.evaluate(window.GameState);
      window.GameState.lastResult = result;

      // Warm cream background
      this.add.rectangle(W / 2, H / 2, W, H, 0xfff5eb);

      // Dombyto emoji expression
      var isVictory = result.score === 100;
      var expr = isVictory ? '🎉' : result.score >= 50 ? '😟' : '😫';

      this.add.text(W / 2, H * 0.12, expr, { fontSize: '80px' }).setOrigin(0.5);

      // Dombyto label
      this.add.text(W / 2, H * 0.18, 'Dombyto', {
        fontSize: '16px', fontFamily: '"Baloo 2", cursive',
        color: '#6b4c3b', fontStyle: 'bold'
      }).setOrigin(0.5);

      // Percentage display with animated count-up
      var scoreColor = isVictory ? '#2ECC71' : '#e8917a';
      this.pctText = this.add.text(W / 2, H * 0.27, '0%', {
        fontSize: '72px', fontFamily: '"Baloo 2", cursive',
        color: scoreColor, fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.addCounter({
        from: 0,
        to: result.score,
        duration: 1200,
        ease: 'Power2',
        onUpdate: function (tween) {
          this.pctText.setText(Math.floor(tween.getValue()) + '%');
        }.bind(this)
      });

      // "Tu taller estaba al X%" subtitle
      this.add.text(W / 2, H * 0.33, 'Tu taller estaba al ' + result.score + '%', {
        fontSize: '16px', fontFamily: '"Baloo 2", cursive',
        color: '#6b4c3b'
      }).setOrigin(0.5);

      // Successes
      var successY = H * 0.39;
      for (var i = 0; i < result.successes.length; i++) {
        this.add.text(W / 2, successY + i * 28, '✅ ' + result.successes[i], {
          fontSize: '14px', fontFamily: '"Baloo 2", cursive',
          color: '#27ae60'
        }).setOrigin(0.5);
      }

      // Failure message
      if (result.failedRule) {
        var failY = successY + result.successes.length * 28 + 20;
        this.time.delayedCall(1400, function () {
          this.add.text(W / 2, failY, '❌ ' + result.failMessage, {
            fontSize: '15px', fontFamily: '"Baloo 2", cursive',
            color: '#c0392b', wordWrap: { width: 360 }, align: 'center'
          }).setOrigin(0.5, 0);

          // Yaiza sad scene
          this._showYaizaSad(failY + 80);
        }.bind(this));
      } else {
        // Victory! transition after showing score
        this.time.delayedCall(2200, function () {
          this.scene.start('VictoryScene');
        }.bind(this));
      }
    },

    _showYaizaSad: function (startY) {
      // Yaiza alone, sad
      this.add.text(W / 2, startY + 30, '😢', { fontSize: '60px' }).setOrigin(0.5);

      // Sad message
      this.add.text(W / 2, startY + 80, 'Yaiza sigue sin luz en su cumpleaños...\n🎂🕯️', {
        fontSize: '14px', fontFamily: '"Baloo 2", cursive',
        color: '#8b6c5c', align: 'center', wordWrap: { width: 340 }
      }).setOrigin(0.5, 0);

      // Encouragement
      var round = window.GameState.roundNumber;
      var encouragement = round <= 2
        ? '¡No te rindas! Organiza mejor el taller.'
        : '¡Casi lo tienes! Revisa lo que falta.';

      this.add.text(W / 2, startY + 150, encouragement, {
        fontSize: '13px', fontFamily: '"Baloo 2", cursive',
        color: '#a0887a', fontStyle: 'italic'
      }).setOrigin(0.5);

      // Retry button
      this.time.delayedCall(800, function () {
        var btn = this.add.text(W / 2, H * 0.88, '🔄 Corregir taller', {
          fontSize: '20px', fontFamily: '"Baloo 2", cursive',
          backgroundColor: '#e8917a', color: '#ffffff',
          padding: { x: 28, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Fade in
        btn.setAlpha(0);
        this.tweens.add({ targets: btn, alpha: 1, duration: 400 });

        btn.on('pointerdown', function () {
          window.GameState.roundNumber++;
          this.scene.start('WorkshopScene');
        }, this);
      }.bind(this));
    }
  });

})();
