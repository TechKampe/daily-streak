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

      var scoreColor = isVictory ? '#2ECC71' : '#e8a435';
      this.add.text(leftX, H * 0.52, 'Tu taller estaba al:', {
        fontSize: '36px', fontFamily: '"Baloo 2", cursive',
        color: scoreColor, fontStyle: 'bold'
      }).setOrigin(0.5);

      this.pctText = this.add.text(leftX, H * 0.62, '0%', {
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
        this.time.delayedCall(1400, function () {
          // Dombyto speech bubble — positioned next to his image
          this._createBubble(leftX, H * 0.40, 'Dombyto', '❌ ' + result.failMessage, 500, '#d9534f');

          this._showYaizaSad(rightX);
        }.bind(this));
      } else {
        this.time.delayedCall(2200, function () {
          this.scene.start('VictoryScene');
        }.bind(this));
      }
    },

    _showYaizaSad: function (cx) {
      this.add.image(cx, H * 0.20, 'yaiza_worried').setOrigin(0.5).setScale(0.54);

      var round = window.GameState.roundNumber;
      var encouragement = round <= 2
        ? '¡Recuerda el checklist de cierre!'
        : '¡Casi lo tienes! Cada cosa en su sitio fijo.';

      var bubbleText = '¡Sigo sin luz en mi cumpleaños!\n' + encouragement;
      this._createBubble(cx, H * 0.40, 'Yaiza', bubbleText, 540);

      // Retry button
      this.time.delayedCall(800, function () {
        var btnY = H * 0.62;
        var btnImg = this.add.image(cx, btnY, 'ui_play').setScale(2.4)
          .setInteractive({ useHandCursor: true });
        var btnLabel = this.add.text(cx, btnY, 'Corregir taller', {
          fontSize: '32px', fontFamily: '"Baloo 2", cursive',
          color: '#ffffff', fontStyle: 'bold',
          stroke: '#3a1a5a', strokeThickness: 3
        }).setOrigin(0.5, 0.5);

        btnImg.setAlpha(0);
        btnLabel.setAlpha(0);
        this.tweens.add({ targets: [btnImg, btnLabel], alpha: 1, duration: 400 });

        this.tweens.add({
          targets: [btnImg, btnLabel],
          scaleX: '+=0.05', scaleY: '+=0.05',
          duration: 800, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut'
        });

        btnImg.on('pointerdown', function () {
          window.GameState.roundNumber++;
          this.scene.start('WorkshopScene');
        }, this);
      }.bind(this));
    },

    _createBubble: function (x, y, name, text, width, textColor) {
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
        color: textColor || '#3d2b1f', wordWrap: { width: width - 40 },
        align: 'center', lineSpacing: 4
      }).setOrigin(0.5, 0);
    }
  });

})();
