// Cozy Dombyto — Phaser 3 entry point
(function () {
  window.GameState.reset();

  const config = {
    type: Phaser.AUTO,
    width: 430,
    height: 932,
    backgroundColor: '#fff5eb',
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 430,
      height: 932
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
