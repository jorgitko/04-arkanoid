# SPEC 03 — Powerup Disparadores

**Estado:** Approved
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-09-17
**Objetivo:** Implementar powerup temporal que equipa paddle con 2 disparadores que destruyen bloques.

---

## Scope

### Incluido
- Sprites: `powerup` (16×16px), `projectile` (4×4px cuadrado)
- 10% probabilidad al romper bloque → cae powerup vertical
- Máximo 1 powerup activo por nivel
- Paddle recoge powerup: activa 2 disparadores laterales
- Paddle visual cambia (color + cañones en bordes)
- Disparadores lanzan projectiles cada 0.5s (2 simultáneos)
- Projectiles destruyen bloques, suman **mismo score que pelota**
- Duración: 8 segundos, reinicia si recoge otro powerup
- Powerup se mantiene al pasar nivel
- Sin audio

### NO incluido
- Otros powerup types, persistencia sesiones, partículas, sonido

---

## Data Model

```javascript
const Powerup = {
  x, y, vx: 0, vy: 2,
  width: 16, height: 16,
  active: boolean
}

const Projectile = {
  x, y, vx: 0, vy: -6,
  width: 4, height: 4,
  active: boolean
}

paddle.hasProjectiles = boolean
paddle.projectileEndTime = number
paddle.projectileLastShot = number

gameState.powerups = []
gameState.projectiles = []
```

---

## Implementation Plan

1. Agregar `SPRITES.powerup` y `SPRITES.projectile` en `spritesheet.js`
2. En destrucción bloque: `if (Math.random() < 0.1 && gameState.powerups.length < 1) spawnPowerup(x, y)`
3. Update: mover powerups (`y += vy`), eliminar si sale canvas
4. Colisión powerup-paddle (AABB): recoge, activa disparadores, reinicia 8s
5. Update: si `hasProjectiles && (now - lastShot >= 500)`: spawn 2 projectiles (izq/der), set lastShot
6. Update: mover projectiles, eliminar si `y < 0`
7. Colisión projectile-bloque (AABB): destruye, suma score, spawn explosión, elimina projectile
8. Render: paddle con sprite mejorado (cañones) si `hasProjectiles`
9. Cada frame: si `now >= projectileEndTime`: `hasProjectiles = false`

---

## Acceptance Criteria

- [ ] Sprites powerup/projectile en spritesheet cargables
- [ ] 10% → powerup al romper bloque, máx 1 por nivel
- [ ] Powerup cae vertical, paddle lo recoge
- [ ] Paddle visual cambia (cañones visibles)
- [ ] 2 disparadores lanzan projectiles cada 0.5s simultáneamente
- [ ] Projectiles destruyen bloques, suman puntos (igual pelota)
- [ ] Explosión animada al impacto
- [ ] Disparadores duran 8s exactos
- [ ] Recoger otro powerup reinicia 8s
- [ ] Powerup persiste entre niveles
- [ ] Sin sonido

---

## Decisiones

- **10% probabilidad:** Raro pero accesible (~1-2 por 200 bloques), equilibra poder
- **2 disparadores:** Visual claro + poder sin caos (3+ sería excesivo)
- **0.5s frecuencia:** ~4 projectiles/s total, densidad visible
- **8s duración:** Suficiente reward, no trivializa nivel 3
- **Mismo score:** Mantiene economía consistente
- **1 por nivel:** Limita ventaja acumulativa
- **Persiste entre niveles:** Reward interesante, genera progresión
- **Paddle visual mejorado:** Feedback claro para usuario
- **Sin audio:** Simplifica MVP, futuro si se pide

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Trivializa nivel | Alto | 10% + 1/nivel + 8s + testing nivel 3 |
| Colisiones imperfectas | Medio | AABB riguroso, hitbox 4×4, testing |
| Performance >100 projectiles | Bajo-Medio | Pool reutilizable, limpiar inactivos |
| Paddle visual confuso | Bajo | Cañones obvios en sprite |
| Memory leak projectiles | Medio | Eliminar si y < -16, limpiar array |
| 8s se resetea mal | Medio | Timestamp absoluto `performance.now()` |

---

✅ SPEC 03 completa, lista para implementar.
