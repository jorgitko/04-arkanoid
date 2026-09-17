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
  currentLevel: 1,
  powerups: [],
  projectiles: []
};

// Paddle
const paddle = {
  x: CANVAS_WIDTH / 2 - 60,
  y: CANVAS_HEIGHT - 40,
  width: 120,
  height: 14,
  speed: 6,
  hasProjectiles: false,
  projectileEndTime: 0,
  projectileLastShot: 0
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
  minSpeed: 2.8,
  maxSpeed: 7.2,
  active: true
};

// Input state
const keys = {
  left: false,
  right: false
};

// Explosiones
const explosions = [];

// Audio - Pool de instancias para reducir latency
const soundPools = {
  bounce: [],
  break: []
};

// Pre-cargar pool de audio
function initAudio() {
  // Crear 5 instancias de cada sonido
  for (let i = 0; i < 5; i++) {
    const bounceAudio = new Audio('assets/sounds/ball-bounce.mp3');
    bounceAudio.preload = 'auto';
    bounceAudio.volume = 0.6;
    soundPools.bounce.push(bounceAudio);

    const breakAudio = new Audio('assets/sounds/break-sound.mp3');
    breakAudio.preload = 'auto';
    breakAudio.volume = 0.6;
    soundPools.break.push(breakAudio);
  }
}

function playSound(soundName) {
  const pool = soundPools[soundName];
  if (!pool) return;

  // Buscar instancia disponible (no reproduciendo)
  let audio = pool.find(a => a.paused || a.ended || a.currentTime === 0);

  // Si todas están ocupadas, usar la primera
  if (!audio) audio = pool[0];

  audio.currentTime = 0;
  audio.play().catch(() => {}); // Ignorar error si user no ha interactuado
}

// Block config ahora manejado por levelGenerator.js

// Helper para normalizar velocidad de pelota a ball.speed
function normalizeBallSpeed() {
  const magnitude = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (magnitude > 0) {
    ball.vx = (ball.vx / magnitude) * ball.speed;
    ball.vy = (ball.vy / magnitude) * ball.speed;
  }
}

function spawnPowerup(x, y) {
  if (gameState.powerups.length >= 1) return; // Máx 1 por nivel
  
  const powerup = {
    x: x + 16, // Centrado en bloque (32/2)
    y: y,
    vx: 0,
    vy: 2,
    width: 16,
    height: 16,
    active: true
  };
  
  gameState.powerups.push(powerup);
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
      normalizeBallSpeed();
      playSound('bounce');
    }

    // Rebote techo
    if (ball.y <= 0) {
      ball.vy = -ball.vy;
      normalizeBallSpeed();
      playSound('bounce');
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

      // Calcular offset del impacto (-1 a 1, siendo 0 el centro)
      const paddleCenter = paddle.x + paddle.width / 2;
      const ballCenter = ball.x + ball.width / 2;
      const offset = (ballCenter - paddleCenter) / (paddle.width / 2);

      // Velocidad variable según offset
      const absOffset = Math.abs(offset);
      if (absOffset > 0.6) {
        // Bordes: acelera 10%
        ball.speed = Math.min(ball.speed * 1.1, ball.maxSpeed);
      } else if (absOffset <= 0.3) {
        // Centro: desacelera 5%
        ball.speed = Math.max(ball.speed * 0.95, ball.minSpeed);
      }

      // Ajustar ángulo según punto de impacto
      ball.vx = offset * ball.speed * 0.7;

      // Normalizar velocidad a ball.speed
      normalizeBallSpeed();

      playSound('bounce');
    }

    // Colisión pelota-bloques
    for (let i = 0; i < gameState.blocks.length; i++) {
      const block = gameState.blocks[i];
      if (block.alive && checkAABB(ball, block)) {
        block.alive = false;
        gameState.score += block.points;
        ball.vy = -ball.vy;
        normalizeBallSpeed();

        // Crear explosión
        explosions.push({
          x: block.x,
          y: block.y,
          color: block.color,
          frameIndex: 0,
          elapsed: 0,
          duration: 150
        });

        playSound('break');

        // Spawn powerup (10% probabilidad, máx 1 por nivel)
        if (Math.random() < 0.1 && gameState.powerups.length < 1) {
          spawnPowerup(block.x, block.y);
        }

        break;
      }
    }
  }

  // Verificar condición victoria o nivel completado
  const allBlocksDestroyed = gameState.blocks.every(block => !block.alive);
  if (allBlocksDestroyed) {
    if (gameState.currentLevel < LEVEL_CONFIG.totalLevels) {
      // Niveles 1-2: pantalla intermedia
      gameState.state = STATES.LEVEL_COMPLETE;
      ball.active = false;
    } else {
      // Nivel 3: victoria final
      gameState.state = STATES.WIN;
      ball.active = false;
    }
  }

  // Actualizar explosiones
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    explosion.elapsed += 16; // ~16ms por frame (60fps)

    // Avanzar frame cada ~37.5ms (150ms / 4 frames)
    explosion.frameIndex = Math.floor(explosion.elapsed / 37.5);

    // Eliminar explosión completada
    if (explosion.elapsed >= explosion.duration) {
      explosions.splice(i, 1);
    }
  }

  // Actualizar powerups
  for (let i = gameState.powerups.length - 1; i >= 0; i--) {
    const powerup = gameState.powerups[i];
    powerup.y += powerup.vy;

    // Eliminar si sale del canvas
    if (powerup.y > CANVAS_HEIGHT + 16) {
      gameState.powerups.splice(i, 1);
    }
  }

  // Colisión powerup-paddle
  for (let i = gameState.powerups.length - 1; i >= 0; i--) {
    const powerup = gameState.powerups[i];
    if (checkAABB(powerup, paddle)) {
      // Activar disparadores por 8 segundos
      const now = performance.now();
      paddle.hasProjectiles = true;
      paddle.projectileEndTime = now + 8000;
      paddle.projectileLastShot = now;
      gameState.powerups.splice(i, 1);
    }
  }

  // Spawn projectiles cada 0.5s si disparadores activos
  if (paddle.hasProjectiles) {
    const now = performance.now();
    if (now - paddle.projectileLastShot >= 500) {
      // Projectile izquierdo
      gameState.projectiles.push({
        x: paddle.x + 10,
        y: paddle.y - 10,
        vx: 0,
        vy: -6,
        width: 4,
        height: 4,
        active: true
      });
      // Projectile derecho
      gameState.projectiles.push({
        x: paddle.x + paddle.width - 14,
        y: paddle.y - 10,
        vx: 0,
        vy: -6,
        width: 4,
        height: 4,
        active: true
      });
      paddle.projectileLastShot = now;
    }
  }

  // Actualizar projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.projectiles[i];
    projectile.y += projectile.vy;
    if (projectile.y < 0) {
      gameState.projectiles.splice(i, 1);
    }
  }

  // Colisión projectile-bloque
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.projectiles[i];
    for (let j = 0; j < gameState.blocks.length; j++) {
      const block = gameState.blocks[j];
      if (block.alive && checkAABB(projectile, block)) {
        block.alive = false;
        gameState.score += block.points;
        explosions.push({
          x: block.x,
          y: block.y,
          color: block.color,
          frameIndex: 0,
          elapsed: 0,
          duration: 150
        });
        gameState.projectiles.splice(i, 1);
        break;
      }
    }
  }

  // Desactivar disparadores después 8 segundos
  if (paddle.hasProjectiles && performance.now() >= paddle.projectileEndTime) {
    paddle.hasProjectiles = false;
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
  } else if (gameState.state === STATES.LEVEL_COMPLETE) {
    renderGame();
    drawCenteredText(`Level ${gameState.currentLevel} Complete!`, CANVAS_HEIGHT / 2 - 20);
    drawCenteredText('Press SPACE for Next Level', CANVAS_HEIGHT / 2 + 20);
  } else if (gameState.state === STATES.WIN) {
    drawCenteredText('You Win! Game Complete!', CANVAS_HEIGHT / 2 - 30);
    drawCenteredText('Press R to Restart', CANVAS_HEIGHT / 2 + 10);
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

  // Renderizar explosiones
  for (let i = 0; i < explosions.length; i++) {
    const explosion = explosions[i];
    const frameIndex = Math.min(explosion.frameIndex, 3); // Clamp a 0-3

    if (EXPLOSION_FRAMES[explosion.color] && EXPLOSION_FRAMES[explosion.color][frameIndex]) {
      drawFrame(
        ctx,
        EXPLOSION_FRAMES[explosion.color][frameIndex],
        explosion.x,
        explosion.y,
        32,
        16
      );
    }
  }

  // Renderizar paddle
  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height);

  // Renderizar cañones si disparadores activos
  if (paddle.hasProjectiles) {
    ctx.fillStyle = '#ff9900';
    // Cañón izquierdo
    ctx.fillRect(paddle.x + 8, paddle.y - 6, 6, 6);
    // Cañón derecho
    ctx.fillRect(paddle.x + paddle.width - 14, paddle.y - 6, 6, 6);
  }

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

  ctx.textAlign = 'center';
  ctx.fillText('Level ' + gameState.currentLevel, CANVAS_WIDTH / 2, 25);

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
  ball.minSpeed = ball.baseSpeed * 0.7; // Ajustado: evita pelota muy lenta
  ball.maxSpeed = ball.baseSpeed * 1.8; // Ajustado: reduce extremo superior en nivel 3

  // Resetear posiciones
  paddle.x = CANVAS_WIDTH / 2 - 60;
  paddle.hasProjectiles = false;
  paddle.projectileEndTime = 0;
  paddle.projectileLastShot = 0;

  ball.x = CANVAS_WIDTH / 2 - 8;
  ball.y = CANVAS_HEIGHT / 2;
  ball.vx = ball.baseSpeed * 0.707; // 45 grados
  ball.vy = -ball.baseSpeed * 0.707;
  ball.active = true;

  // Limpiar powerups y projectiles
  gameState.powerups = [];
  gameState.projectiles = [];
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

  if (e.code === 'Space' && gameState.state === STATES.LEVEL_COMPLETE) {
    gameState.currentLevel++;
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
  initAudio();
  initLevel();
  startGameLoop();
});
