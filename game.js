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

// Block config
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_ROWS = 7;
const BLOCK_COLS = 10;
const BLOCK_OFFSET_X = 80;
const BLOCK_OFFSET_Y = 60;

const BLOCK_COLORS = {
  red: 10,
  yellow: 5,
  cyan: 3,
  gray: 1
};

function createBlocks() {
  const blocks = [];

  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      let color, points;

      if (row < 2) {
        color = 'red';
        points = BLOCK_COLORS.red;
      } else if (row < 4) {
        color = 'yellow';
        points = BLOCK_COLORS.yellow;
      } else if (row < 6) {
        color = 'cyan';
        points = BLOCK_COLORS.cyan;
      } else {
        color = 'gray';
        points = BLOCK_COLORS.gray;
      }

      blocks.push({
        x: BLOCK_OFFSET_X + col * BLOCK_WIDTH,
        y: BLOCK_OFFSET_Y + row * BLOCK_HEIGHT,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: color,
        points: points,
        alive: true
      });
    }
  }

  return blocks;
}

function checkAABB(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Game loop
function update() {
  if (gameState.state !== STATES.PLAYING) {
    return;
  }

  // Movimiento paddle
  if (keys.left) {
    paddle.x -= paddle.speed;
  }
  if (keys.right) {
    paddle.x += paddle.speed;
  }

  // Limitar paddle a bordes canvas
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > CANVAS_WIDTH) {
    paddle.x = CANVAS_WIDTH - paddle.width;
  }

  // Física pelota
  if (ball.active) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Rebote paredes laterales
    if (ball.x <= 0 || ball.x + ball.width >= CANVAS_WIDTH) {
      ball.vx = -ball.vx;
    }

    // Rebote techo
    if (ball.y <= 0) {
      ball.vy = -ball.vy;
    }

    // Perder pelota (sale por abajo)
    if (ball.y > CANVAS_HEIGHT) {
      gameState.lives--;
      if (gameState.lives === 0) {
        gameState.state = STATES.GAMEOVER;
      } else {
        respawnBall();
      }
    }

    // Colisión pelota-paddle
    if (checkAABB(ball, paddle)) {
      ball.vy = -Math.abs(ball.vy);

      // Ajustar vx según punto de impacto
      const hitPos = (ball.x + ball.width / 2) - (paddle.x + paddle.width / 2);
      const normalizedHit = hitPos / (paddle.width / 2);
      ball.vx = normalizedHit * 4;
    }

    // Colisión pelota-bloques
    for (let i = 0; i < gameState.blocks.length; i++) {
      const block = gameState.blocks[i];
      if (block.alive && checkAABB(ball, block)) {
        block.alive = false;
        gameState.score += block.points;
        ball.vy = -ball.vy;
        break;
      }
    }
  }

  // TODO: verificar condición victoria
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
  } else if (gameState.state === STATES.PAUSED || gameState.state === STATES.PLAYING) {
    renderGame();

    if (gameState.state === STATES.PAUSED) {
      drawCenteredText('PAUSED', CANVAS_HEIGHT / 2);
    }
  }
}

function renderGame() {
  // Renderizar bloques vivos
  for (let i = 0; i < gameState.blocks.length; i++) {
    const block = gameState.blocks[i];
    if (block.alive) {
      drawSprite(ctx, 'blocks.' + block.color, block.x, block.y, block.width, block.height);
    }
  }

  // Renderizar paddle
  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height);

  // Renderizar ball
  if (ball.active) {
    drawSprite(ctx, 'ball', ball.x, ball.y, ball.width, ball.height);
  }

  // Renderizar HUD
  drawHUD();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + gameState.score, 10, 25);

  ctx.textAlign = 'right';
  ctx.fillText('Lives: ' + gameState.lives, CANVAS_WIDTH - 10, 25);
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

function respawnBall() {
  ball.x = CANVAS_WIDTH / 2 - 8;
  ball.y = CANVAS_HEIGHT / 2;
  ball.vx = 3;
  ball.vy = -3;
  ball.active = true;
}

function restart() {
  gameState.score = 0;
  gameState.lives = 3;
  gameState.state = STATES.START;
  gameState.blocks = createBlocks();

  // Resetear paddle
  paddle.x = CANVAS_WIDTH / 2 - 81;

  // Resetear ball
  respawnBall();
}

// Event listeners
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && gameState.state === STATES.START) {
    gameState.state = STATES.PLAYING;
  }

  if (e.code === 'KeyR' && (gameState.state === STATES.GAMEOVER || gameState.state === STATES.WIN)) {
    restart();
  }

  // Movimiento paddle
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = true;
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = false;
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = false;
  }
});

// Inicializar juego
loadSpritesheet(() => {
  gameState.blocks = createBlocks();
  startGameLoop();
});
