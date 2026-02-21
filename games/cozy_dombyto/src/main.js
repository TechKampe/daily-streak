// Cozy Dombyto — Phaser 3 entry point
(function () {
  window.GameState.reset();

  const config = {
    type: Phaser.AUTO,
    width: 1864,
    height: 860,
    backgroundColor: '#f5e6d3',
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1864,
      height: 860
    },
    scene: [IntroScene, WorkshopScene, EvalScene, VictoryScene],
    render: {
      pixelArt: false,
      roundPixels: false,
      antialias: true
    },
    input: {
      activePointers: 1
    }
  };

  new Phaser.Game(config);
})();
