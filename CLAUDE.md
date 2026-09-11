# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del Proyecto

Juego de Arkanoid/Breakout construido con HTML, CSS y JavaScript vanilla. **Cero dependencias** - toda la funcionalidad implementada desde cero usando APIs del navegador.

## Arquitectura

### Sistema de Sprites (`assets/spritesheet.js`)
- Spritesheet PNG único (`assets/spritesheet-breakout.png`) contiene todos los assets visuales
- Objeto `SPRITES` define rectángulos fuente (sx, sy, sw, sh) para cada entidad del juego
- `EXPLOSION_FRAMES` define animaciones de 4 frames por color de bloque
- `loadSpritesheet(cb)` - cargador asíncrono con cola de callbacks
- `drawSprite(ctx, name, x, y, w, h)` - renderiza sprites al canvas
- `drawFrame(ctx, frame, x, y, w, h)` - renderiza frames de animación

### Entidades del Juego
- **Paddle**: 162x14px, controlado por jugador
- **Ball**: 16x16px, física de movimiento
- **Blocks**: 32x16px, 7 variantes de color (red, yellow, cyan, magenta, hotpink, green, gray)
- **Explosions**: animaciones de 4 frames por color, duración total 150ms

### Audio
Archivos de sonido en `assets/sounds/`:
- `ball-bounce.mp3` - sonido de colisión de pelota
- `break-sound.mp3` - sonido de destrucción de bloque

## Desarrollo

### Ejecutar el Juego
Crear `index.html` con elemento canvas, luego:
```bash
# Servidor HTTP simple (Python 3)
python -m http.server 8000

# Abrir http://localhost:8000
```

### Estado de Implementación
Juego **no implementado aún**. Sistema de spritesheet existe. Faltan:
- Bucle principal del juego
- Setup y renderizado del canvas
- Manejo de input del paddle
- Física de la pelota (velocidad, detección de colisiones)
- Gestión de la cuadrícula de bloques
- Sistema de puntuación/vidas
- Estados del juego (inicio, jugando, game over)

### Patrón de Arquitectura Canvas
Al implementar:
1. Cargar spritesheet antes de iniciar game loop
2. Usar `requestAnimationFrame` para game loop
3. Limpiar canvas cada frame, redibujar todas las entidades
4. Manejar input vía event listeners (mouse/teclado)
5. Usar coordenadas sprite de constante `SPRITES`
