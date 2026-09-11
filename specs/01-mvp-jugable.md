# SPEC 01 — MVP Jugable

**Estado:** Implemented  
**Depende de:** —  
**Fecha:** 2026-09-11  
**Objetivo:** Implementar versión jugable de Arkanoid con un nivel, vidas, puntuación y estados de juego completos.

---

## Scope

### Incluido
- Canvas setup y game loop con `requestAnimationFrame`
- Paddle controlado por teclado (flechas izquierda/derecha o A/D)
- Pelota con física básica (velocidad fija, rebotes en paredes/paddle/bloques)
- Grid hardcoded de bloques (7 filas × 10 columnas, colores variados)
- Sistema de 3 vidas (perder pelota = -1 vida, 0 vidas = game over)
- Sistema de puntuación visible (colores distintos = puntos distintos)
- 4 estados del juego:
  1. **Inicio** — pantalla con botón/texto "Press SPACE to Start"
  2. **Jugando** — loop activo, input habilitado
  3. **Pausa** — tecla ESC congela/descongela juego
  4. **Game Over** — al perder 3 vidas, botón "Press R to Restart"
  5. **Victoria** — al destruir todos los bloques, "You Win! Press R to Restart"
- Detección de colisiones paddle-pelota y pelota-bloques
- Renderizado de sprites vía `assets/spritesheet.js`

### NO incluido (fuera de scope)
- Animaciones de explosión al destruir bloques
- Power-ups (spec futura)
- Múltiples niveles o progresión
- Persistencia de highscore en localStorage
- Audio (sin `ball-bounce.mp3` ni `break-sound.mp3`)
- Velocidad de pelota incremental
- Control por mouse

---

## Data Model

### Estado del Juego
```javascript
const gameState = {
  state: 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'WIN',
  score: number,
  lives: number, // inicia en 3
  blocks: Block[]
}
```

### Paddle
```javascript
const paddle = {
  x: number,      // posición horizontal (centrado inicial)
  y: number,      // fixed cerca del bottom del canvas
  width: 162,     // de SPRITES.paddle
  height: 14,
  speed: number   // px/frame al mover con teclas
}
```

### Ball
```javascript
const ball = {
  x: number,
  y: number,
  width: 16,      // de SPRITES.ball
  height: 16,
  vx: number,     // velocidad horizontal (fija)
  vy: number,     // velocidad vertical (fija)
  active: boolean // false cuando se pierde, espera respawn
}
```

### Block
```javascript
const Block = {
  x: number,
  y: number,
  width: 32,      // de SPRITES.blocks
  height: 16,
  color: 'red' | 'yellow' | 'cyan' | 'magenta' | 'hotpink' | 'green' | 'gray',
  points: number, // valor según color
  alive: boolean
}
```

---

## Implementation Plan

1. **Setup canvas y estructura HTML**
   - Crear/modificar `index.html` con `<canvas id="gameCanvas"></canvas>`
   - Crear `game.js` como script principal
   - Opcional: `style.css` para centrar canvas y UI text

2. **Inicializar game state y constantes**
   - Dimensiones canvas (ej: 640×480)
   - Configuración inicial de paddle, ball, vidas=3, score=0
   - Estado `START`

3. **Cargar spritesheet y arrancar loop**
   - `loadSpritesheet(() => startGameLoop())`
   - `requestAnimationFrame` loop que llama `update()` y `render()`

4. **Implementar estados START/GAMEOVER/WIN**
   - Renderizar texto centrado según estado
   - Listener `keydown` SPACE (start) y R (restart)
   - `restart()` resetea score, vidas, bloques, ball

5. **Generar grid de bloques hardcoded**
   - 7 filas × 10 columnas (70 bloques)
   - Asignar colores: filas superiores = más puntos
   - Ej: fila 1-2 red (10pts), 3-4 yellow (5pts), 5-6 cyan (3pts), 7 gray (1pt)

6. **Implementar movimiento del paddle**
   - Listeners `keydown`/`keyup` para ArrowLeft, ArrowRight, A, D
   - Actualizar `paddle.x` en `update()`, limitar a bordes canvas

7. **Implementar física de la pelota**
   - Actualizar `ball.x += vx`, `ball.y += vy` en cada frame
   - Rebote en paredes laterales (invertir `vx`)
   - Rebote en techo (invertir `vy`)
   - Perder pelota si `ball.y > canvas.height` → `-1 vida`, respawn

8. **Detección de colisión pelota-paddle**
   - AABB básico
   - Al colisionar: invertir `vy`, ajustar `vx` según punto de impacto (centro vs bordes)

9. **Detección de colisión pelota-bloques**
   - Iterar bloques vivos
   - AABB con pelota
   - Al colisionar: `block.alive = false`, `score += block.points`, invertir `vy`

10. **Renderizado completo**
    - Limpiar canvas cada frame
    - Dibujar bloques vivos con `drawSprite(ctx, 'blocks.' + color, ...)`
    - Dibujar paddle y ball
    - Dibujar HUD: score y vidas en esquinas

11. **Estado PAUSED**
    - Listener ESC toggle `PLAYING ↔ PAUSED`
    - Si paused: skip `update()`, solo `render()` + texto "PAUSED"

12. **Condiciones de victoria y derrota**
    - Cada frame verificar:
      - Si `lives === 0` → `state = GAMEOVER`
      - Si todos `blocks.alive === false` → `state = WIN`

13. **Testing funcional**
    - Jugar partida completa: inicio → destruir todos → victoria → restart
    - Jugar partida perdida: perder 3 vidas → game over → restart
    - Pausar/despausar varias veces
    - Verificar score suma correctamente

---

## Acceptance Criteria

- [x] `index.html` tiene canvas y carga `game.js` y `assets/spritesheet.js`
- [x] Al abrir página aparece estado START con mensaje "Press SPACE to Start"
- [x] SPACE inicia juego: paddle y pelota aparecen, pelota se mueve
- [x] Flechas izquierda/derecha (o A/D) mueven paddle, no sale de canvas
- [x] Pelota rebota en paredes laterales y techo
- [x] Pelota rebota en paddle cuando colisiona
- [x] Pelota destruye bloques al colisionar, bloque desaparece
- [x] Score aumenta según color del bloque destruido
- [x] Perder pelota (sale por abajo) resta 1 vida y respawnea pelota
- [x] Al llegar a 0 vidas aparece estado GAMEOVER con "Press R to Restart"
- [x] Al destruir todos los bloques aparece estado WIN con "You Win! Press R to Restart"
- [x] Tecla R en GAMEOVER o WIN resetea juego (score=0, lives=3, bloques regenerados)
- [x] ESC pausa/despausa juego, muestra "PAUSED"
- [x] HUD muestra score y vidas actuales en todo momento
- [x] No hay sonido (silencioso)
- [x] Velocidad de pelota constante durante toda la partida

---

## Decisiones

### ¿Por qué un solo nivel hardcoded?
MVP necesita validar mecánicas core sin overhead de sistema de niveles. Grid fijo en código es más rápido de implementar y debuggear.

### ¿Por qué solo teclado sin mouse?
Usuario prefirió control por teclado. Mouse queda para iteración futura si se solicita.

### ¿Por qué sin persistencia de highscore?
Scope reducido para MVP. localStorage se agregará en spec futura si se requiere competencia entre sesiones.

### ¿Por qué sin audio?
Simplifica MVP. Assets de audio existen pero se integrarán después si se pide feedback sonoro.

### ¿Por qué velocidad de pelota fija?
Física predecible facilita testing y balance inicial. Aceleración incremental se puede agregar luego.

### ¿Por qué 4 estados explícitos?
Separar START/PLAYING/PAUSED/GAMEOVER/WIN hace flujo más claro que banderas booleanas mezcladas. Cada estado tiene render y lógica bien definida.

### ¿Por qué sin explosiones?
Simplifica MVP. Bloques desaparecen instantáneamente al ser destruidos. Animaciones se pueden agregar en spec futura si se pide feedback visual más rico.

---

## Riesgos

### Colisiones imperfectas
Pelota muy rápida o deltaTime irregular puede atravesar bloques delgados. Mitigación: velocidad conservadora inicial (ej: 3-4 px/frame).

### Pelota atrapada en loop horizontal
Si pelota rebota entre paredes sin tocar paddle ni bloques (ángulo muy horizontal), partida se estanca. Mitigación: ajustar `vx` en rebote con paddle para evitar ángulos extremos.
