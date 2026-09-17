# CLAUDE.md

Arkanoid/Breakout en HTML5 Canvas. **Zero deps** - vanilla JS + browser APIs.

## Patrón: Spec-Driven Design

### Workflow
1. **Crear spec** (`specs/NN-nombre.md`) → define scope, data model, plan, acceptance criteria, decisiones, riesgos
2. **Implementar** siguiendo plan de spec
3. **Marcar** acceptance criteria al completar
4. **Actualizar** estado spec a `Implemented`

### Estructura de Spec
```markdown
# SPEC NN — Título
**Estado:** Draft | In Progress | Implemented
**Depende de:** SPEC XX
**Fecha:** YYYY-MM-DD
**Objetivo:** Una línea

## Scope
### Incluido / NO incluido

## Data Model
Estructuras de datos afectadas

## Implementation Plan
Pasos numerados, secuenciales

## Acceptance Criteria
- [ ] Checkboxes verificables

## Decisiones
Por qué cada decisión de diseño (crucial para futuro)

## Riesgos
Qué puede fallar + mitigación
```

## Estado Actual

**Implementado:**
- ✅ SPEC 01 — MVP Jugable
- ✅ SPEC 02 — Mejoras visualización, audio, 3 niveles

**Juego funcional completo:**
- 3 niveles con patrones geométricos aleatorios (círculo, triángulo, rombo, cruz, espiral)
- 200 bloques/nivel, generación procedural
- Velocidad incremental por nivel (+0%, +10%, +20%)
- Velocidad variable por impacto paddle (bordes aceleran, centro desacelera)
- Explosiones animadas 4-frames por color
- Audio pooling (bounce, break) con baja latencia
- Vidas/score acumulativos entre niveles
- 6 estados: START → PLAYING → LEVEL_COMPLETE → WIN / GAMEOVER / PAUSED

## Arquitectura

### Canvas
- 800×600px
- `requestAnimationFrame` loop: `update()` → `render()`

### Sprites (`assets/spritesheet.js`)
- `spritesheet-breakout.png` único
- `SPRITES` - rects fuente (sx,sy,sw,sh)
- `EXPLOSION_FRAMES` - 4 frames/color, 150ms total
- `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, `drawFrame()`

### Entidades
- **Paddle**: 120×14px, teclado, 6px/frame
- **Ball**: 16×16px, física con velocidad variable (min 2.8, max 7.2)
- **Block**: 32×16px, 7 colores (red/yellow/cyan/magenta/hotpink/green/gray)
- **Explosion**: 4 frames, array temporal, auto-elimina al completar

### Audio (`assets/sounds/`)
- Pool de 5 instancias/sonido (reduce latency)
- `ball-bounce.mp3` - colisiones
- `break-sound.mp3` - destrucción bloques

### Generación Niveles (`levelGenerator.js`)
- 5 patrones: `circle`, `triangle`, `diamond`, `cross`, `spiral`
- Selección aleatoria/nivel
- `assignBalancedColors()` - distribución proporcional (30% high, 40% mid, 30% low)

### Game Loop (`game.js`)
```javascript
gameState: {state, score, lives, blocks[], currentLevel}
paddle: {x,y,width,height,speed}
ball: {x,y,vx,vy,speed,baseSpeed,minSpeed,maxSpeed,active}
explosions: [{x,y,color,frameIndex,elapsed}]
```

## Desarrollo

### Ejecutar
```bash
python -m http.server 8000
# http://localhost:8000
```

### Nueva Feature
1. Crear spec en `specs/` siguiendo template
2. Discutir scope/decisiones antes de implementar
3. Implementar según plan de spec
4. Testing contra acceptance criteria
5. Marcar spec como `Implemented`

### Modificar Existente
1. Leer spec relevante (entender decisiones originales)
2. Si cambio grande: nueva spec dependiente
3. Si cambio pequeño: actualizar spec existente + acceptance criteria

## Referencias

- **Clean Code**: `C:\Users\0015054\.claude\clean-code.md` - aplicar antes de generar código
- **Memory**: workflow spec (`/spec`) y spec-impl (`/spec-impl`) disponibles
- **Specs**: `specs/01-mvp-jugable.md`, `specs/02-mejoras-visualizacion-jugabilidad.md`

## Próximos Pasos Posibles

NO incluidos actualmente (requieren nueva spec):
- Power-ups / ítems
- Control mouse
- Highscore persistente (localStorage)
- Niveles >3 o infinitos
- Efectos partículas / shake / trail
- Bonus por vidas restantes
