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

      // --- Left side: Dombyto + bubble + score ---
      var leftX = W * 0.3;

      var exprKey = isVictory ? 'dombyto_celebrating' : 'dombyto_worried';
      this.add.image(leftX, H * 0.22, exprKey).setOrigin(0.5).setScale(0.64);

      // Build Dombyto's bubble content: successes + failure
      var bubbleLines = [];
      for (var i = 0; i < result.successes.length; i++) {
        bubbleLines.push({ text: '✅ ' + result.successes[i], color: '#27ae60' });
      }

      // --- Right side: Yaiza ---
      var rightX = W * 0.68;
      var scoreColor = isVictory ? '#2ECC71' : '#e8a435';
      var self = this;

      if (result.failedRule) {
        this.time.delayedCall(1400, function () {
          bubbleLines.push({ text: '❌ ' + result.failMessage, color: '#d9534f' });
          var bubbleBottom = self._createBubbleMulti(leftX, H * 0.40, 'Dombyto', bubbleLines, 540);
          self._showScore(leftX, bubbleBottom + 16, scoreColor, result.score);
          self._showYaizaSad(rightX);
        });
      } else {
        var bubbleBottom = this._createBubbleMulti(leftX, H * 0.40, 'Dombyto', bubbleLines, 540);
        this._showScore(leftX, bubbleBottom + 16, scoreColor, result.score);
        this.time.delayedCall(2200, function () {
          self.scene.start('VictoryScene');
        });
      }
    },

    _showScore: function (x, topY, color, score) {
      this.add.text(x, topY, 'Tu taller estaba al:', {
        fontSize: '36px', fontFamily: '"Baloo 2", cursive',
        color: color, fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      this.pctText = this.add.text(x, topY + 44, '0%', {
        fontSize: '128px', fontFamily: '"Baloo 2", cursive',
        color: color, fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      this.tweens.addCounter({
        from: 0,
        to: score,
        duration: 1200,
        ease: 'Power2',
        onUpdate: function (tween) {
          this.pctText.setText(Math.floor(tween.getValue()) + '%');
        }.bind(this)
      });
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
    },

    // Returns the bottom Y of the bubble so callers can position below it
    _createBubbleMulti: function (x, y, name, lines, width) {
      var padTop = 48;
      var padBottom = 24;
      var textWidth = width - 40;
      var gap = 14;

      // Measure heights with temporary texts
      var heights = [];
      var totalTextH = 0;
      for (var i = 0; i < lines.length; i++) {
        var tmp = this.add.text(0, -9999, lines[i].text, {
          fontSize: '20px', fontFamily: '"Baloo 2", cursive',
          wordWrap: { width: textWidth }, lineSpacing: 2
        }).setOrigin(0.5, 0);
        heights.push(tmp.height);
        totalTextH += tmp.height + (i < lines.length - 1 ? gap : 0);
        tmp.destroy();
      }

      var bubbleH = padTop + totalTextH + padBottom;
      var top = y - bubbleH / 2;

      // Draw bubble background first
      var bg = this.add.graphics();
      bg.fillStyle(0xfaf6f0, 1);
      bg.fillRoundedRect(x - width / 2, top, width, bubbleH, 24);
      bg.lineStyle(4, 0xc4b8a4, 1);
      bg.strokeRoundedRect(x - width / 2, top, width, bubbleH, 24);

      // Name label
      this.add.text(x, top + 18, name, {
        fontSize: '18px', fontFamily: '"Baloo 2", cursive',
        color: '#5b8c5a', fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      // Create text lines on top of background
      var curY = top + padTop;
      for (var j = 0; j < lines.length; j++) {
        this.add.text(x, curY, lines[j].text, {
          fontSize: '20px', fontFamily: '"Baloo 2", cursive',
          color: lines[j].color,
          wordWrap: { width: textWidth },
          align: 'center', lineSpacing: 2
        }).setOrigin(0.5, 0);
        curY += heights[j] + gap;
      }

      return top + bubbleH;
    }
  });

})();
