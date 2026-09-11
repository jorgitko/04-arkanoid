// Level Generator - Patrones geométricos para bloques

const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;

// Patrones geométricos
const PATTERNS = {
  circle: function(centerX, centerY, radius, blockCount) {
    const blocks = [];
    const rings = 5; // Múltiples anillos concéntricos
    const blocksPerRing = Math.floor(blockCount / rings);

    for (let ring = 0; ring < rings; ring++) {
      const r = (radius / rings) * (ring + 1);
      const blocksInRing = ring === rings - 1 ? blockCount - (blocks.length) : blocksPerRing;
      const angleStep = (Math.PI * 2) / blocksInRing;

      for (let i = 0; i < blocksInRing; i++) {
        const angle = i * angleStep;
        const x = centerX + Math.cos(angle) * r - BLOCK_WIDTH / 2;
        const y = centerY + Math.sin(angle) * r - BLOCK_HEIGHT / 2;

        blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
      }
    }

    return blocks;
  },

  triangle: function(centerX, centerY, size, blockCount) {
    const blocks = [];
    const rows = Math.ceil(Math.sqrt(blockCount * 2));
    let blockIndex = 0;

    for (let row = 0; row < rows && blockIndex < blockCount; row++) {
      const blocksInRow = row + 1;
      const rowWidth = blocksInRow * BLOCK_WIDTH;
      const startX = centerX - rowWidth / 2;
      const y = centerY - (rows * BLOCK_HEIGHT) / 2 + row * BLOCK_HEIGHT;

      for (let col = 0; col < blocksInRow && blockIndex < blockCount; col++) {
        const x = startX + col * BLOCK_WIDTH;
        blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
        blockIndex++;
      }
    }

    return blocks;
  },

  diamond: function(centerX, centerY, size, blockCount) {
    const blocks = [];
    const halfRows = Math.ceil(Math.sqrt(blockCount) / 2);
    let blockIndex = 0;

    // Mitad superior
    for (let row = 0; row < halfRows && blockIndex < blockCount; row++) {
      const blocksInRow = (row + 1) * 2;
      const rowWidth = blocksInRow * BLOCK_WIDTH;
      const startX = centerX - rowWidth / 2;
      const y = centerY - halfRows * BLOCK_HEIGHT + row * BLOCK_HEIGHT;

      for (let col = 0; col < blocksInRow && blockIndex < blockCount; col++) {
        const x = startX + col * BLOCK_WIDTH;
        blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
        blockIndex++;
      }
    }

    // Mitad inferior
    for (let row = halfRows - 2; row >= 0 && blockIndex < blockCount; row--) {
      const blocksInRow = (row + 1) * 2;
      const rowWidth = blocksInRow * BLOCK_WIDTH;
      const startX = centerX - rowWidth / 2;
      const y = centerY + (halfRows - row - 1) * BLOCK_HEIGHT;

      for (let col = 0; col < blocksInRow && blockIndex < blockCount; col++) {
        const x = startX + col * BLOCK_WIDTH;
        blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
        blockIndex++;
      }
    }

    return blocks;
  },

  cross: function(centerX, centerY, armLength, blockCount) {
    const blocks = [];
    const blocksPerArm = Math.floor(blockCount / 4);

    // Brazo horizontal izquierdo
    for (let i = 0; i < blocksPerArm; i++) {
      const x = centerX - (i + 1) * BLOCK_WIDTH;
      const y = centerY - BLOCK_HEIGHT / 2;
      blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
    }

    // Brazo horizontal derecho
    for (let i = 0; i < blocksPerArm; i++) {
      const x = centerX + i * BLOCK_WIDTH;
      const y = centerY - BLOCK_HEIGHT / 2;
      blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
    }

    // Brazo vertical superior
    for (let i = 0; i < blocksPerArm; i++) {
      const x = centerX - BLOCK_WIDTH / 2;
      const y = centerY - (i + 1) * BLOCK_HEIGHT;
      blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
    }

    // Brazo vertical inferior
    for (let i = 0; i < blocksPerArm; i++) {
      const x = centerX - BLOCK_WIDTH / 2;
      const y = centerY + i * BLOCK_HEIGHT;
      blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
    }

    // Rellenar bloques restantes en el centro
    const remaining = blockCount - blocks.length;
    for (let i = 0; i < remaining; i++) {
      const x = centerX - BLOCK_WIDTH / 2;
      const y = centerY - BLOCK_HEIGHT / 2;
      blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
    }

    return blocks;
  },

  spiral: function(centerX, centerY, radius, blockCount) {
    const blocks = [];
    const turns = 3; // Reducido a 3 para mayor densidad
    const angleStep = (Math.PI * 2 * turns) / blockCount;
    const radiusStep = radius / blockCount;

    for (let i = 0; i < blockCount; i++) {
      const angle = i * angleStep;
      const r = i * radiusStep;
      const x = centerX + Math.cos(angle) * r - BLOCK_WIDTH / 2;
      const y = centerY + Math.sin(angle) * r - BLOCK_HEIGHT / 2;

      blocks.push({ x, y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, alive: true });
    }

    return blocks;
  }
};

// Asignar colores balanceados
function assignBalancedColors(blocks) {
  const totalBlocks = blocks.length;

  // Distribución: ~30% red/yellow (high value), ~40% cyan/hotpink (mid), ~30% green (low)
  const redCount = Math.floor(totalBlocks * 0.15);
  const yellowCount = Math.floor(totalBlocks * 0.15);
  const cyanCount = Math.floor(totalBlocks * 0.20);
  const hotpinkCount = Math.floor(totalBlocks * 0.20);
  const greenCount = totalBlocks - redCount - yellowCount - cyanCount - hotpinkCount;

  const colors = [];
  for (let i = 0; i < redCount; i++) colors.push('red');
  for (let i = 0; i < yellowCount; i++) colors.push('yellow');
  for (let i = 0; i < cyanCount; i++) colors.push('cyan');
  for (let i = 0; i < hotpinkCount; i++) colors.push('hotpink');
  for (let i = 0; i < greenCount; i++) colors.push('green');

  // Shuffle colores
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  // Asignar puntos según color
  const colorPoints = {
    red: 10,
    yellow: 5,
    cyan: 3,
    hotpink: 3,
    green: 1
  };

  // Asignar colores a bloques
  for (let i = 0; i < blocks.length; i++) {
    blocks[i].color = colors[i];
    blocks[i].points = colorPoints[colors[i]];
  }

  return blocks;
}

// Generar nivel con patrón aleatorio
function generateLevel(levelNumber) {
  const patternNames = Object.keys(PATTERNS);
  const randomPattern = patternNames[Math.floor(Math.random() * patternNames.length)];

  // Parámetros centrados en canvas 800×600
  // Área segura: 80% superior (600 * 0.8 = 480px), márgenes 20px laterales
  const centerX = 400;
  const centerY = 200;
  const size = 150;
  const minX = 20;
  const maxX = 780;
  const minY = 20;
  const maxY = 480; // 20% inferior (120px) libre

  let blocks = PATTERNS[randomPattern](centerX, centerY, size, LEVEL_CONFIG.blocksPerLevel);

  // Filtrar bloques fuera de límites
  blocks = blocks.filter(block =>
    block.x >= minX &&
    block.x + block.width <= maxX &&
    block.y >= minY &&
    block.y + block.height <= maxY
  );

  // Si faltan bloques (>5% filtrados), ajustar patrón
  if (blocks.length < LEVEL_CONFIG.blocksPerLevel * 0.95) {
    // Regenerar con tamaño reducido para caber mejor
    const adjustedSize = size * 0.8;
    const adjustedCenterY = centerY - 30;
    blocks = PATTERNS[randomPattern](centerX, adjustedCenterY, adjustedSize, LEVEL_CONFIG.blocksPerLevel);

    blocks = blocks.filter(block =>
      block.x >= minX &&
      block.x + block.width <= maxX &&
      block.y >= minY &&
      block.y + block.height <= maxY
    );
  }

  return assignBalancedColors(blocks);
}
