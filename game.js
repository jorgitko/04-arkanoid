// Arkanoid MVP - Game Logic

// Canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensiones
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Estados del juego
const STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  WIN: 'WIN'
};

// Level configuration
const LEVEL_CONFIG = {
  totalLevels: 3,
  blocksPerLevel: 200,
  speedMultipliers: [1.0, 1.1, 1.2],
  baseSpeed: 4
};

// Game state
const gameState = {
  state: STATES.START,
  score: 0,
  lives: 3,
  blocks: [],
  currentLevel: 1
};

// Paddle
const paddle = {
  x: CANVAS_WIDTH / 2 - 60,
  y: CANVAS_HEIGHT - 40,
  width: 120,
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
  speed: 4,
  baseSpeed: 4,
  minSpeed: 2.4,
  maxSpeed: 8,
  active: true
};

// Input state
const keys = {
  left: false,
  right: false
};

// Explosiones
const explosions = [];

// Block config ahora manejado por levelGenerator.js

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

  // Verificar condición victoria
  const allBlocksDestroyed = gameState.blocks.every(block => !block.alive);
  if (allBlocksDestroyed) {
    gameState.state = STATES.WIN;
  }
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
      drawSprite(ctx, 'block_' + block.color, block.x, block.y, block.width, block.height);
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

  // Normalizar velocidad a ball.speed actual
  const currentSpeed = ball.speed;
  const angle = Math.atan2(ball.vy, ball.vx);
  ball.vx = Math.cos(angle) * currentSpeed;
  ball.vy = Math.sin(angle) * currentSpeed;

  ball.active = true;
}

function initLevel() {
  // Generar bloques para el nivel actual
  gameState.blocks = generateLevel(gameState.currentLevel);

  // Ajustar velocidad base según nivel
  ball.baseSpeed = LEVEL_CONFIG.baseSpeed * LEVEL_CONFIG.speedMultipliers[gameState.currentLevel - 1];
  ball.speed = ball.baseSpeed;
  ball.minSpeed = ball.baseSpeed * 0.6;
  ball.maxSpeed = ball.baseSpeed * 2.0;

  // Resetear posiciones
  paddle.x = CANVAS_WIDTH / 2 - 60;

  ball.x = CANVAS_WIDTH / 2 - 8;
  ball.y = CANVAS_HEIGHT / 2;
  ball.vx = ball.baseSpeed * 0.707; // 45 grados
  ball.vy = -ball.baseSpeed * 0.707;
  ball.active = true;
}

function restart() {
  gameState.score = 0;
  gameState.lives = 3;
  gameState.currentLevel = 1;
  gameState.state = STATES.START;

  initLevel();
}

// Event listeners
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && gameState.state === STATES.START) {
    initLevel();
    gameState.state = STATES.PLAYING;
  }

  if (e.code === 'KeyR' && (gameState.state === STATES.GAMEOVER || gameState.state === STATES.WIN)) {
    restart();
  }

  // Toggle pausa con ESC
  if (e.code === 'Escape') {
    if (gameState.state === STATES.PLAYING) {
      gameState.state = STATES.PAUSED;
    } else if (gameState.state === STATES.PAUSED) {
      gameState.state = STATES.PLAYING;
    }
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
  initLevel();
  startGameLoop();
});
