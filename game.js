// Arkanoid MVP - Game Logic

// Canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensiones
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Estados del juego
const STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  WIN: 'WIN'
};

// Game state
const gameState = {
  state: STATES.START,
  score: 0,
  lives: 3,
  blocks: []
};

// Paddle
const paddle = {
  x: CANVAS_WIDTH / 2 - 81,
  y: CANVAS_HEIGHT - 40,
  width: 162,
  height: 14,
  speed: 6
};

// Ball
const ball = {
  x: CANVAS_WIDTH / 2 - 8,
  y: CANVAS_HEIGHT / 2,
  width: 16,
  height: 16,
  vx: 3,
  vy: -3,
  active: true
};

// Input state
const keys = {
  left: false,
  right: false
};

// Game loop
function update() {
  if (gameState.state !== STATES.PLAYING) {
    return;
  }
  // TODO: actualizar lógica cuando jugando
}

function render() {
  // Limpiar canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Renderizar según estado
  if (gameState.state === STATES.START) {
    drawCenteredText('Press SPACE to Start', CANVAS_HEIGHT / 2);
  } else if (gameState.state === STATES.GAMEOVER) {
    drawCenteredText('GAME OVER', CANVAS_HEIGHT / 2 - 20);
    drawCenteredText('Press R to Restart', CANVAS_HEIGHT / 2 + 20);
  } else if (gameState.state === STATES.WIN) {
    drawCenteredText('You Win!', CANVAS_HEIGHT / 2 - 20);
    drawCenteredText('Press R to Restart', CANVAS_HEIGHT / 2 + 20);
  } else if (gameState.state === STATES.PAUSED) {
    // TODO: renderizar juego + texto PAUSED
    drawCenteredText('PAUSED', CANVAS_HEIGHT / 2);
  } else if (gameState.state === STATES.PLAYING) {
    // TODO: renderizar juego completo
  }
}

function drawCenteredText(text, y) {
  ctx.fillStyle = '#fff';
  ctx.font = '24px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function startGameLoop() {
  gameLoop();
}

function restart() {
  gameState.score = 0;
  gameState.lives = 3;
  gameState.state = STATES.START;
  gameState.blocks = [];

  // Resetear paddle
  paddle.x = CANVAS_WIDTH / 2 - 81;

  // Resetear ball
  ball.x = CANVAS_WIDTH / 2 - 8;
  ball.y = CANVAS_HEIGHT / 2;
  ball.vx = 3;
  ball.vy = -3;
  ball.active = true;

  // TODO: regenerar bloques (paso 5)
}

// Event listeners
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && gameState.state === STATES.START) {
    gameState.state = STATES.PLAYING;
  }

  if (e.code === 'KeyR' && (gameState.state === STATES.GAMEOVER || gameState.state === STATES.WIN)) {
    restart();
  }
});

// Inicializar juego
loadSpritesheet(() => {
  startGameLoop();
});
