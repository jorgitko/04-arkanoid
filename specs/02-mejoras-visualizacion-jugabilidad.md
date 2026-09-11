# SPEC 02 — Mejoras en Visualización, Jugabilidad y Sistema de Niveles

**Estado:** Approved  
**Depende de:** SPEC 01  
**Fecha:** 2026-09-11  
**Objetivo:** Agregar explosiones animadas, audio de colisiones, velocidad variable de pelota, ajustar dimensiones para canvas 800×600 e implementar sistema de 3 niveles con patrones geométricos aleatorios y dificultad creciente.

---

## Scope

### Incluido
- Canvas redimensionado a 800×600px
- Paddle acortado a 120px (25% reducción desde 162px)
- Animaciones de explosión al destruir bloques (4 frames por color, 150ms total)
- Audio integrado:
  - `ball-bounce.mp3` en colisiones pelota-paddle y pelota-paredes
  - `break-sound.mp3` al destruir bloques
- Velocidad variable de pelota basada en ángulo de impacto con paddle:
  - Impacto en bordes del paddle → pelota acelera
  - Impacto en centro del paddle → pelota desacelera
  - Velocidad limitada por máximo/mínimo para evitar extremos injugables
- Sistema de 3 niveles totales con progresión
- Generación procedural de bloques con patrones geométricos aleatorios:
  - Patrones disponibles: círculo, triángulo, rombo, cruz, espiral
  - Cada nivel elige un patrón al azar
  - 200 bloques por nivel
  - Distribución balanceada de colores (mix red/yellow/cyan/hotpink/green)
- Incremento acumulativo de velocidad base de pelota:
  - Nivel 1: velocidad base
  - Nivel 2: velocidad base × 1.1 (+10%)
  - Nivel 3: velocidad base × 1.2 (+20%)
- Estado LEVEL_COMPLETE con pantalla intermedia "Level N Complete! Press SPACE"
- Transición manual entre niveles (usuario presiona SPACE)
- Vidas acumulativas (se mantienen entre niveles)
- Score acumulativo (suma total de los 3 niveles)
- Victoria final al completar nivel 3: estado WIN con "You Win! Game Complete! Press R to Restart"

### NO incluido (fuera de scope)
- Power-ups o ítems que caen
- Control por mouse
- Efectos de partículas, shake de pantalla, trail de pelota
- Persistencia de highscore o progreso entre sesiones
- Niveles infinitos o más de 3 niveles
- Selección manual de nivel
- Bonificación por vidas restantes al completar nivel

---

## Data Model

### Cambios en Canvas
```javascript
const CANVAS_WIDTH = 800   // antes: 640
const CANVAS_HEIGHT = 600  // antes: 480
```

### Cambios en Paddle
```javascript
const paddle = {
  x: number,
  y: number,
  width: 120,      // antes: 162 (25% reducción)
  height: 14,
  speed: number
}
```

### Cambios en Ball
```javascript
const ball = {
  x: number,
  y: number,
  width: 16,
  height: 16,
  vx: number,
  vy: number,
  speed: number,      // magnitud actual de velocidad (afectada por paddle impacts)
  baseSpeed: number,  // velocidad base del nivel (varía según currentLevel)
  minSpeed: number,   // límite inferior (ajustado proporcionalmente al baseSpeed)
  maxSpeed: number,   // límite superior (ajustado proporcionalmente al baseSpeed)
  active: boolean
}
```

### Game State - Nuevos Estados
```javascript
const gameState = {
  state: 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'LEVEL_COMPLETE' | 'WIN',
  score: number,
  lives: number,
  blocks: Block[],
  currentLevel: number,        // 1, 2 o 3
  levelBaseSpeed: number        // velocidad base del nivel actual
}
```

### Nueva Estructura: Explosion
```javascript
const Explosion = {
  x: number,          // posición del bloque destruido
  y: number,
  color: string,      // color del bloque para seleccionar frames
  frameIndex: number, // 0-3, índice actual en EXPLOSION_FRAMES
  elapsed: number,    // ms acumulados desde inicio
  duration: 150       // ms totales (4 frames × ~37.5ms/frame)
}

// Array global de explosiones activas
const explosions = [] // se agregan al destruir bloque, se eliminan al completar
```

### Audio Manager
```javascript
const sounds = {
  bounce: HTMLAudioElement,  // ball-bounce.mp3
  break: HTMLAudioElement    // break-sound.mp3
}

// Función helper para reproducir sin overlap excesivo
function playSound(audio) {
  audio.currentTime = 0
  audio.play()
}
```

### Level Configuration
```javascript
const LEVEL_CONFIG = {
  totalLevels: 3,
  blocksPerLevel: 200,
  speedMultipliers: [1.0, 1.1, 1.2],  // multiplicadores por nivel
  baseSpeed: 4  // velocidad base referencia
}
```

### Pattern Generator
```javascript
// Funciones generadoras de patrones geométricos
const PATTERNS = {
  circle: (centerX, centerY, radius, blockCount) => Block[],
  triangle: (centerX, centerY, size, blockCount) => Block[],
  diamond: (centerX, centerY, size, blockCount) => Block[],
  cross: (centerX, centerY, armLength, blockCount) => Block[],
  spiral: (centerX, centerY, radius, blockCount) => Block[]
}

// Función principal de generación
function generateLevel(levelNumber) {
  const patternNames = Object.keys(PATTERNS)
  const randomPattern = patternNames[Math.floor(Math.random() * patternNames.length)]
  const blocks = PATTERNS[randomPattern](400, 200, 150, 200)  // centrado en canvas
  
  // Asignar colores balanceados
  return assignBalancedColors(blocks)
}

function assignBalancedColors(blocks) {
  // Distribuir: ~30% red/yellow (high value), ~40% cyan/hotpink (mid), ~30% green (low)
  // Shuffle para evitar agrupación por color
}
```

---

## Implementation Plan

1. **Actualizar dimensiones canvas**
   - Modificar `index.html`: `<canvas width="800" height="600">`
   - Ajustar constantes en `game.js`: `CANVAS_WIDTH = 800`, `CANVAS_HEIGHT = 600`
   - Reposicionar paddle.y para nuevo espacio vertical

2. **Reducir ancho del paddle**
   - Cambiar `paddle.width` de 162 a 120
   - Verificar que sprite rendering escale correctamente

3. **Agregar tracking de nivel actual**
   - Inicializar `gameState.currentLevel = 1` en setup
   - Crear constante `LEVEL_CONFIG` con configuración de niveles

4. **Implementar generadores de patrones geométricos**
   - Crear módulo `levelGenerator.js` (o integrar en `game.js`)
   - Implementar 5 funciones de patrón:
     - **circle**: distribuir bloques en círculo/anillo
     - **triangle**: formar triángulo equilátero
     - **diamond**: rombo centrado
     - **cross**: cruz con brazos horizontales/verticales
     - **spiral**: espiral desde centro hacia afuera
   - Cada función retorna array de 200 bloques con posiciones (x, y)
   - Implementar `assignBalancedColors()` para distribuir red/yellow/cyan/hotpink/green proporcionalmente

5. **Modificar inicialización de nivel**
   - Al empezar nivel (START o LEVEL_COMPLETE → PLAYING):
     - Generar bloques con `generateLevel(currentLevel)`
     - Ajustar `ball.baseSpeed = LEVEL_CONFIG.baseSpeed * LEVEL_CONFIG.speedMultipliers[currentLevel - 1]`
     - Ajustar `ball.minSpeed = ball.baseSpeed * 0.6` y `ball.maxSpeed = ball.baseSpeed * 2.0`
     - Resetear posición de pelota y paddle
     - **No** resetear vidas ni score (acumulativos)

6. **Implementar sistema de explosiones**
   - Crear array global `explosions = []`
   - Al destruir bloque: push nueva `Explosion` con color, posición, frameIndex=0, elapsed=0
   - En `update()`: iterar explosiones, incrementar `elapsed += deltaTime`, avanzar `frameIndex` cada ~37.5ms
   - Eliminar explosión cuando `elapsed >= duration`
   - En `render()`: dibujar explosiones activas usando `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, w, h)`

7. **Integrar audio**
   - Cargar `ball-bounce.mp3` y `break-sound.mp3` en inicio:
     ```javascript
     sounds.bounce = new Audio('assets/sounds/ball-bounce.mp3')
     sounds.break = new Audio('assets/sounds/break-sound.mp3')
     ```
   - En colisión pelota-paddle: `playSound(sounds.bounce)`
   - En colisión pelota-paredes: `playSound(sounds.bounce)`
   - Al destruir bloque: `playSound(sounds.break)`

8. **Implementar velocidad variable de pelota por impacto**
   - Agregar `ball.speed`, `ball.baseSpeed`, `ball.minSpeed`, `ball.maxSpeed`
   - Velocidad inicial: `ball.speed = ball.baseSpeed`
   - En colisión pelota-paddle:
     - Calcular distancia del impacto al centro del paddle: `offset = (ball.x - paddle.center) / (paddle.width / 2)` (rango -1 a 1)
     - Si `|offset| > 0.6` (bordes): `ball.speed = Math.min(ball.speed * 1.1, ball.maxSpeed)` (acelera 10%)
     - Si `|offset| <= 0.3` (centro): `ball.speed = Math.max(ball.speed * 0.95, ball.minSpeed)` (desacelera 5%)
     - Normalizar velocidad: `ball.vx = ball.vx / |ball.v| * ball.speed`, `ball.vy = ball.vy / |ball.v| * ball.speed`

9. **Ajustar física de pelota a nueva velocidad**
   - En cada frame: aplicar `ball.vx` y `ball.vy` ya normalizados a `ball.speed`
   - Mantener detección de colisiones funcionando con velocidades variables

10. **Implementar estado LEVEL_COMPLETE**
    - Al destruir último bloque en niveles 1-2:
      - Cambiar estado a `LEVEL_COMPLETE` (no `WIN`)
      - Renderizar texto centrado: `"Level ${currentLevel} Complete! Press SPACE for Next Level"`
      - Detener pelota y paddle
    - Listener SPACE en estado LEVEL_COMPLETE:
      - `currentLevel++`
      - Cambiar estado a `PLAYING`
      - Generar nuevo nivel con `generateLevel(currentLevel)`

11. **Modificar condición de victoria final**
    - Al destruir último bloque en nivel 3:
      - Cambiar estado a `WIN` (no `LEVEL_COMPLETE`)
      - Renderizar texto: `"You Win! Game Complete! Press R to Restart"`
    - Tecla R en estado WIN resetea todo: `currentLevel = 1`, `score = 0`, `lives = 3`

12. **Testing visual y funcional**
    - Verificar explosiones aparecen en cada bloque destruido, 4 frames visibles
    - Verificar audio suena sin retardo en colisiones
    - Jugar varias partidas observando aceleración/desaceleración de pelota según impactos
    - Verificar paddle 120px manejable pero más desafiante
    - Jugar desde nivel 1 hasta victoria en nivel 3
    - Verificar cada nivel tiene patrón geométrico distinto
    - Verificar velocidad incrementa correctamente (nivel 2 más rápido que 1, nivel 3 más que 2)
    - Verificar vidas se mantienen entre niveles
    - Verificar score acumula entre niveles
    - Probar game over en nivel 2 (vidas llegan a 0 sin completar los 3 niveles)

13. **Balanceo de patrones y ajustes**
    - Si paddle 120px demasiado difícil: ajustar `ball.minSpeed` o velocidad inicial
    - Si explosiones bloquean visibilidad: reducir duración a 100ms (opcional)
    - Si algún patrón genera configuración injugable: ajustar algoritmo generador
    - Verificar que cada patrón tiene ~200 bloques válidos dentro del canvas

---

## Acceptance Criteria

### Mejoras Visuales y Audio
- [ ] Canvas tiene dimensiones 800×600px
- [ ] Paddle tiene ancho de 120px y se renderiza correctamente
- [ ] Al destruir bloque aparece animación de explosión de 4 frames en color correspondiente
- [ ] Explosión dura ~150ms y desaparece automáticamente
- [ ] Audio `ball-bounce.mp3` suena al rebotar pelota en paddle y paredes
- [ ] Audio `break-sound.mp3` suena al destruir cada bloque
- [ ] No hay errores de audio (clips superpuestos aceptables, sin crashes)

### Velocidad Variable
- [ ] Pelota acelera cuando impacta bordes del paddle (offset > 60%)
- [ ] Pelota desacelera cuando impacta centro del paddle (offset < 30%)
- [ ] Velocidad pelota nunca excede `maxSpeed` ni baja de `minSpeed`

### Sistema de Niveles
- [ ] Juego inicia en nivel 1 con patrón geométrico aleatorio
- [ ] Cada nivel genera exactamente 200 bloques
- [ ] Distribución de colores es balanceada (no todos red, no todos green)
- [ ] Patrones son jugables (bloques dentro del canvas, accesibles por pelota)
- [ ] Al destruir todos los bloques del nivel 1 aparece "Level 1 Complete! Press SPACE for Next Level"
- [ ] Presionar SPACE en LEVEL_COMPLETE avanza a nivel 2
- [ ] Nivel 2 tiene patrón geométrico (puede repetir, probabilidad baja)
- [ ] Pelota en nivel 2 es ~10% más rápida que velocidad base del nivel 1
- [ ] Vidas no se resetean entre niveles (acumulativas)
- [ ] Score acumula entre niveles (score total suma los 3 niveles)
- [ ] Al completar nivel 2 aparece "Level 2 Complete! Press SPACE for Next Level"
- [ ] Nivel 3 tiene patrón geométrico
- [ ] Pelota en nivel 3 es ~20% más rápida que velocidad base del nivel 1
- [ ] Al destruir todos los bloques del nivel 3 aparece "You Win! Game Complete! Press R to Restart"
- [ ] Tecla R en pantalla WIN resetea juego a nivel 1, score 0, vidas 3
- [ ] Si vidas llegan a 0 en cualquier nivel aparece GAMEOVER (no se puede continuar)

### Integración
- [ ] Juego mantiene todas funcionalidades de SPEC 01 (vidas, score, estados, pausa)
- [ ] Partida completa jugable inicio → victoria nivel 3 sin bugs visuales o de física

---

## Decisiones

### ¿Por qué paddle 120px específicamente?
Usuario pidió 25% reducción desde 162px. Aumenta dificultad sin hacer juego imposible. Testing determinará si balance es correcto.

### ¿Por qué velocidad basada en ángulo de impacto y no colisiones acumuladas?
Usuario eligió opción C. Da control al jugador: impactos precisos en centro frenan pelota, bordes aceleran. Más skill-based que aleatorio o automático.

### ¿Por qué límites minSpeed/maxSpeed?
Evitar extremos injugables: pelota demasiado lenta (aburrido) o demasiado rápida (imposible seguir). Rangos proporcionales a `baseSpeed` del nivel, ajustables en testing.

### ¿Por qué explosiones 150ms y no más largas?
Valor ya definido en `spritesheet.js`. 4 frames × ~37.5ms/frame da feedback visual inmediato sin bloquear visión del juego durante colisiones rápidas.

### ¿Por qué resetear `currentTime` en `playSound()`?
Permite reproducir mismo sonido en rápida sucesión (múltiples rebotes) sin esperar que termine el anterior. Trade-off: clips superpuestos aceptables vs delays frustrantes.

### ¿Por qué 3 niveles específicamente?
Usuario eligió 3 niveles como balance entre contenido y scope de MVP. Más de 3 requeriría mayor balanceo y testing. Menos de 3 sería muy corto.

### ¿Por qué patrones geométricos en vez de grid con huecos?
Usuario pidió "distribución aleatoria" y eligió "generación procedural pura" con "patrones geométricos". Da variedad visual mayor que simplemente eliminar bloques de un grid.

### ¿Por qué velocidad acumulativa en vez de exponencial?
Usuario eligió incremento acumulativo (+10%, +20%) en vez de exponencial (×1.1, ×1.21). Hace curva de dificultad más predecible y menos brutal en nivel 3.

### ¿Por qué vidas y score acumulativos?
Usuario eligió mantener vidas entre niveles. Hace juego más desafiante (un error en nivel 1 afecta nivel 3) y el score total más significativo.

### ¿Por qué transición manual con SPACE?
Usuario eligió pantalla intermedia manual. Permite al jugador respirar entre niveles, leer score actual, prepararse para siguiente ronda. Automático sería muy abrupto.

### ¿Por qué victoria definitiva en nivel 3?
Usuario eligió "You Win! Game Complete" en vez de bucle infinito. Juego tiene final claro. Rejugabilidad viene de intentar completar los 3 niveles con más vidas/score.

### ¿Por qué 200 bloques fijos en cada nivel?
Usuario eligió cantidad fija. Simplifica balanceo (dificultad solo viene de velocidad y distribución). Variable complicaría estimación de duración por nivel.

### ¿Por qué 5 patrones predefinidos y no generación pura aleatoria?
Generación 100% aleatoria (posiciones libres sin restricción) puede crear configuraciones injugables (bloques todos en esquinas, imposibles de alcanzar). Patrones geométricos garantizan distribución jugable con variedad visual.

### ¿Por qué fusionar sistema de niveles con mejoras visuales en una spec?
Usuario pidió combinar SPEC 02 y 03. Ambas features se implementan juntas, evita dependencias entre specs separadas. Trade-off: spec más grande pero flujo de implementación más cohesivo.

---

## Riesgos

### Colisiones con velocidad variable
Pelota a velocidades altas (especialmente nivel 3 con `baseSpeed × 1.2` más aceleración por paddle) puede atravesar bloques delgados si deltaTime irregular. Mitigación: testing riguroso, posible reducción de multiplicadores de velocidad si ocurre.

### Audio delay en navegadores
Algunos navegadores imponen latencia en `audio.play()`. Impacto menor en gameplay pero puede romper inmersión. Sin mitigación técnica simple (Web Audio API sería overengineering para MVP).

### Explosiones múltiples simultáneas
Destruir varios bloques en un frame genera múltiples explosiones superpuestas. Array `explosions` puede crecer. Mitigación: eliminar explosiones completadas cada frame, límite teórico = bloques totales (200).

### Paddle 120px demasiado difícil
Reducción 25% puede hacer juego frustrante, especialmente en niveles 2-3 con velocidad incrementada. Mitigación: ajustar `ball.minSpeed` o velocidad inicial después de testing si necesario.

### Patrones geométricos injugables
Algunos patrones (especialmente espiral o círculo muy abierto) pueden dejar bloques muy dispersos, haciendo nivel muy largo. Mitigación: ajustar parámetros de cada patrón (radio, densidad) durante testing. Considerar eliminar patrón problemático del pool.

### Velocidad nivel 3 demasiado difícil
Base × 1.2 (+20%) combinado con sistema de aceleración por paddle puede hacer nivel 3 imposible. Mitigación: testing extensivo, posible reducción a +15% o ajuste de `maxSpeed` del nivel 3.

### Repetición de patrones
Con solo 5 patrones y 3 niveles, probabilidad de repetir patrón en una partida es ~30%. Puede sentirse menos aleatorio. Mitigación aceptada: 5 patrones suficientes para MVP, se pueden agregar más patrones en spec futura.

### Vidas acumulativas muy punitivas
Perder 2 vidas en nivel 1 hace nivel 3 casi imposible (una vida restante con velocidad +20%). Puede frustrar jugadores. Mitigación: comunicar claramente vidas restantes en HUD, considerar bonus de +1 vida al completar nivel (fuera de scope, spec futura).

### Distribución de colores desbalanceada por patrón
Patrones geométricos pueden agrupar colores de forma no intencional (ej: todos los bloques del centro son red). Afecta scoring. Mitigación: `assignBalancedColors()` debe shuffle antes de asignar para distribuir uniformemente.

### Game over en nivel 2 puede sentirse injusto
Usuario espera "segundo intento" pero vidas acumulativas significan que game over en nivel 2 termina progreso. Mitigación aceptada: es diseño intencional, aumenta tensión y valor de cada vida.

### Transición LEVEL_COMPLETE puede perder momentum
Pantalla intermedia obligatoria interrumpe flow. Jugadores en racha pueden preferir continuar inmediatamente. Mitigación aceptada: usuario eligió manual, se puede hacer automática en futuro si se pide.

### Scope grande dificulta debugging
Combinar mejoras visuales + audio + sistema de niveles en una spec aumenta complejidad de testing. Un bug puede tener múltiples causas (explosiones, audio, velocidad, generación). Mitigación: implementación incremental siguiendo plan secuencial, testing por feature antes de integrar siguiente.
