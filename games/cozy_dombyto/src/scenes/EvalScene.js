// Cozy Dombyto — Evaluation scene (landscape)
(function () {

  var W = 1864, H = 860;

  window.EvalScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function EvalScene() {
      Phaser.Scene.call(this, { key: 'EvalScene' });
    },

    create: function () {
      var result = window.RulesEngine.evaluate(window.GameState);
      window.GameState.lastResult = result;

      // Warm cream background
      this.add.rectangle(W / 2, H / 2, W, H, 0xf5e6d3);

      var isVictory = result.score === 100;

      // --- Left side: Dombyto + Score ---
      var leftX = W * 0.3;

      var exprKey = isVictory ? 'dombyto_celebrating' : result.score >= 50 ? 'dombyto_worried' : 'dombyto_worried';
      this.add.image(leftX, H * 0.22, exprKey).setOrigin(0.5).setScale(0.64);

      this.add.text(leftX, H * 0.38, 'Dombyto', {
        fontSize: '30px', fontFamily: '"Baloo 2", cursive',
        color: '#5a4a3a', fontStyle: 'bold'
      }).setOrigin(0.5);

      var scoreColor = isVictory ? '#2ECC71' : '#e8a435';
      this.pctText = this.add.text(leftX, H * 0.58, '0%', {
        fontSize: '128px', fontFamily: '"Baloo 2", cursive',
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

      this.add.text(leftX, H * 0.72, 'Tu taller estaba al ' + result.score + '%', {
        fontSize: '28px', fontFamily: '"Baloo 2", cursive',
        color: '#5a4a3a'
      }).setOrigin(0.5);

      // --- Right side: Results ---
      var rightX = W * 0.68;

      // Successes
      var successY = H * 0.15;
      for (var i = 0; i < result.successes.length; i++) {
        this.add.text(rightX, successY + i * 52, '✅ ' + result.successes[i], {
          fontSize: '26px', fontFamily: '"Baloo 2", cursive',
          color: '#27ae60'
        }).setOrigin(0.5);
      }

      // Failure message
      if (result.failedRule) {
        var failY = successY + result.successes.length * 52 + 32;
        this.time.delayedCall(1400, function () {
          this.add.text(rightX, failY, '❌ ' + result.failMessage, {
            fontSize: '28px', fontFamily: '"Baloo 2", cursive',
            color: '#d9534f', wordWrap: { width: 680 }, align: 'center'
          }).setOrigin(0.5, 0);

          this._showYaizaSad(rightX, failY + 100);
        }.bind(this));
      } else {
        this.time.delayedCall(2200, function () {
          this.scene.start('VictoryScene');
        }.bind(this));
      }
    },

    _showYaizaSad: function (cx, startY) {
      this.add.image(cx, startY + 40, 'yaiza_worried').setOrigin(0.5).setScale(0.44);

      this.add.text(cx, startY + 120, 'Yaiza sigue sin luz en su cumpleaños...\n🎂🕯️', {
        fontSize: '26px', fontFamily: '"Baloo 2", cursive',
        color: '#7a6a5a', align: 'center', wordWrap: { width: 600 }
      }).setOrigin(0.5, 0);

      var round = window.GameState.roundNumber;
      var encouragement = round <= 2
        ? '¡No te rindas! Organiza mejor el taller.'
        : '¡Casi lo tienes! Revisa lo que falta.';

      this.add.text(cx, startY + 220, encouragement, {
        fontSize: '24px', fontFamily: '"Baloo 2", cursive',
        color: '#8a7a6a', fontStyle: 'italic'
      }).setOrigin(0.5);

      // Retry button
      this.time.delayedCall(800, function () {
        var btn = this.add.text(cx, startY + 300, '🔄 Corregir taller', {
          fontSize: '36px', fontFamily: '"Baloo 2", cursive',
          backgroundColor: '#5b8c5a', color: '#ffffff',
          padding: { x: 48, y: 20 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

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
