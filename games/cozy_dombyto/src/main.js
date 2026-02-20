// Cozy Dombyto — Phaser 3 entry point
(function () {
  window.GameState.reset();

  const config = {
    type: Phaser.AUTO,
    width: 932,
    height: 430,
    backgroundColor: '#fff5eb',
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 932,
      height: 430
    },
    scene: [IntroScene, WorkshopScene, EvalScene, VictoryScene],
    render: {
      pixelArt: false,
      roundPixels: true
    },
    input: {
      activePointers: 2
    }
  };

  new Phaser.Game(config);
})();
