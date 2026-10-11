# Memorama del Software Libre

Juego de memoria para la Feria de Logros de 5.º grado. El reto es emparejar cada programa
**privativo** 🔒 con su alternativa **libre** 🔓 (por ejemplo, Photoshop ➜ GIMP).

## Cómo abrirlo

- **En la computadora del stand:** doble clic en `index.html`. No necesita internet ni instalar nada.
- **Pantalla completa:** botón ⛶ de la esquina superior derecha (o la tecla `F11`). Se recomienda
  en laptops para que las cartas se vean más grandes.
- **Sonido:** botón 🔊 de la esquina superior derecha.

## Cómo se juega

| Modo | Reglas |
|---|---|
| 🎮 **Jugar solo** | +100 puntos por pareja, bono por racha de aciertos seguidos, −10 por fallo y bono por terminar rápido. Al final se ganan de 1 a 3 estrellas y, si el puntaje entra en los récords, se guarda solo. |
| ⚔️ **Duelo** | Jugador 1 contra Jugador 2, por turnos en la misma pantalla. Quien acierta gana la pareja y repite turno; quien falla, pasa el turno. Gana quien junte más parejas. |

En ambos modos se elige el **tipo de memorama**:

| Tipo | Pareja |
|---|---|
| 🔁 **Libre vs. privativo** | El programa privativo con su alternativa libre (Word ➜ Writer). |
| 🃏 **Clásico** | Dos cartas iguales (Word ➜ Word). Al acertar, Tux cuenta cuál es su pareja libre o privativa. |

Niveles: **Fácil** (6 parejas), **Normal** (8) y **Difícil** (10). En cada partida las parejas se
eligen al azar.

La sección **Aprende** resume los temas del proyecto: las 4 libertades, la comparación libre vs.
privativo, la historia de Tux y por qué el software libre ayuda a la escuela y al planeta.

Los **récords** se guardan en el navegador de cada computadora, separados por tipo y nivel. Para empezar la feria con la
tabla vacía: *Récords ➜ Borrar récords*.

## Publicarlo en internet (GitHub Pages)

1. Subir los cambios al repositorio en GitHub.
2. En GitHub: **Settings ➜ Pages ➜ Build and deployment**.
3. En *Source* elegir **Deploy from a branch**, rama `master`, carpeta `/ (root)` y guardar.
4. En unos minutos el juego queda en `https://javier-wq.github.io/Memory_Game/`.

Con ese enlace se puede crear un código QR para que los visitantes jueguen desde su celular.
Después de abrirlo una vez, el juego queda guardado (`sw.js`) y funciona aunque no haya internet.

## Cambiar las parejas o los textos

Todo el contenido está en [`js/data.js`](js/data.js): nombre, logo, categoría y dato curioso de
cada pareja. Los logos van en `assets/logos/`.

## Estructura

```
index.html        Pantallas del juego
css/styles.css    Diseño y animaciones
js/data.js        Parejas, niveles y textos
js/game.js        Reglas y puntaje
js/ui.js          Tablero, marcador, Tux y efectos
js/audio.js       Efectos de sonido
js/records.js     Tabla de récords
assets/           Logos, Tux y tipografía
sw.js             Copia sin conexión para la versión publicada
```

Hecho con HTML, CSS y JavaScript, sin librerías externas. Créditos de logos y tipografía en
[`CREDITOS.md`](CREDITOS.md).
