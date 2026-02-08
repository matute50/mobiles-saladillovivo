---
name: video-playback-mastery
description: Domina la reproducción de video en Next.js con arquitectura "TV-Grade". Incluye Safety Delay (v23), Smart Slots (v18), Deep Linking Blindado (v22.7) y Transición Zero-Black (v20).
---

# Maestría en Reproducción de Video (Video Playback Mastery v23.0)

Este skill define la arquitectura "TV-Grade" para aplicaciones de streaming, enfocada en latencia cero, transiciones invisibles y optimización extrema de recursos.

## 1. Arquitectura de Slots Persistentes (Smart Slot System v18.0)

Para lograr una reproducción continua ("gapless"), nunca se debe montar/desmontar reproductores condicionalmente.

### Principios:
1.  **Doble Slot Permanente (A/B)**:
    -   Existen dos contenedores de video (`VideoPlayer`) siempre montados en el DOM.
    -   **Active Slot**: El que el usuario ve (`opacity-100`, `z-10`).
    -   **Inactive Slot**: El que precarga el siguiente video (`opacity-100`, `z-0`).
    -   *Nota*: La opacidad del inactivo es 100% (pero tapado por el activo) para evitar que el navegador congele el buffering.

2.  **Reciclaje de Instancias**:
    -   Al cambiar de video, **NO** cambiar el componente.
    -   Solo cambiar la visibilidad (`z-index`) e iniciar la reproducción.
    -   El estado se gestiona via `useRef` o lógica de Slots (`slotAContent`, `slotBContent`) para evitar re-renders innecesarios.

## 2. Intros con Persistencia de Nodo (Node Persistence v16.0)

Los videos de transición (Intros) son críticos y no toleran "pantallazos negros" por re-montaje.

### Implementación:
-   **Elemento Único**: Un solo tag `<video>` en `VideoSection` que nunca se desmonta.
-   **Sin Atributo `key`**: Prohibido usar `key={id}` en el tag `<video>`, ya que fuerza la destrucción del nodo.
-   **Z-Index Supremacy (v23.0)**: La intro debe tener un `z-index: 999` para garantizar que cubra absolutamente todo el contenido subyacente.
-   **Buffer Cleaning**: Al terminar, pausar y limpiar recursos, pero mantener el nodo vivo.

## 3. Transiciones Avanzadas (v23.0 - TV Grade)

### A. Principio "Cover First, Swap Later" (Safety Delay - v23.0)
El mayor error es sincronizar la aparición de la intro con el cambio de video. Esto causa parpadeos si la intro tarda 1ms en cargar.
-   **Fase 1 (Inmediata)**: Activar visualmente la Intro (`isIntroVisible = true`).
-   **Fase 2 (Diferida 800ms)**: Esperar el **Safety Delay**. Mientras tanto, el video anterior sigue reproduciéndose (o pausado) DEBAJO de la intro.
-   **Fase 3 (Swap)**: Recién cuando la intro es sólida (T+800ms), cambiar el contenido subyacente (`currentContent = nextContent`).
-   **Resultado**: El usuario jamás ve el cambio técnico.

### B. Transición Aditiva ("Cover, Don't Fade" - v20.0)
-   **Regla**: El contenido saliente (video/noticia) **NUNCA** baja su opacidad (fade-out).
-   **Acción**: La Intro aparece *encima* con un `fade-in` (o corte directo).
-   **Resultado**: Opacidad base siempre = 1. No hay transparencias accidentales.

## 4. Deep Linking Blindado (v22.7)

El sistema debe recuperar el estado desde una URL compartida (`/video/:id`) sin fallos.

1.  **Fetch-On-Demand**: Si el ID no está en la carga inicial (cache/pool), hacer un fetch directo a la DB, inyectar el video en la lista y reproducirlo.
2.  **Loop Protection**: Usar `useRef` para marcar IDs procesados. Nunca re-procesar un deep link en el mismo montaje del componente.
3.  **Sync Fix**: Si el video ya existe localmente, no enviar doble comando de play.

## 5. Política de Reproducción Automática y Anti-Branding

### YouTube Hardening
-   **Parametros Vitales**: `autoplay=1`, `mute=1`, `controls=0`, `modestbranding=1`, `rel=0`.
-   **Escalado 100%**: El video debe ocupar todo el contenedor para ocultar elementos de UI residuales.
-   **Capa de Bloqueo**: `div` transparente con `pointer-events: auto` sobre el iframe para impedir navegación a YouTube.

### HTML5 News
-   **Prioridad de Carga**: Usar `loading="eager"` y `fetchPriority="high"` en imágenes poster.

## 6. Normalización de Audio (Audio Levelling v23.1)

El volumen no es constante entre fuentes. Se debe implementar una lógica de multiplicador en el cliente.

### Lógica de Multiplicador:
-   **Fuente**: Columna `volumen_extra` en DB.
-   **Fórmula**: `TargetVolume = Math.min(1, GlobalVolume * (volumen_extra || 1))`.
-   **Comportamiento**:
    -   `1.0`: Volumen Nnativo (x1).
    -   `2.0`: Incremento del 100% (x2, tope 1.0).
    -   `0.5`: Reducción al 50% (x0.5).
-   **Aplicación**: En el `useEffect` de control de volumen, aplicar este multiplicador al objetivo final antes del fade-in.

## 7. Estabilidad de Interacción (Interaction Stability v23.2)

Al seleccionar contenido desde interfaces complejas (Búsquedas, Listas filtradas), la estabilidad del DOM es vital para evitar interrupciones de reproducción ("Race Conditions").

### A. Prevención de Layout Thrashing
-   **Problema**: Al cerrar una búsqueda, elementos grandes (como `NewsSlider`) reaparecen, empujando el DOM y causando que el reproductor pierda contexto o se reinicie.
-   **Solución**: Mantener **OCULTOS** los elementos competidores mientras la interacción de selección ocurre.
    -   *Regla*: `{!isSearchOpen && <NewsSlider />}`. No renderizar condicionalmente basado en "teclado", sino en el "modo" global de la UI.

### B. Safety Delay en Resets
-   **Problema**: Resetear el estado de la UI (borrar búsqueda, cerrar teclado) *inmediatamente* después del click de reproducción puede desmontar componentes antes de que el comando de `play()` llegue al iframe.
-   **Solución (500ms Rule)**:
    1.  Ejecutar `playManual(video)`.
    2.  Esperar `setTimeout(..., 500)`.
    3.  Ejecutar el reset de UI (`setSearchQuery("")`, etc.).
    -   Esto da tiempo al motor de JS para procesar el evento de media antes de calcular el nuevo layout.

## 8. Sincronización de Audio Paralelo (v24.0)

Para eliminar baches de silencio durante las transiciones, el audio de la fuente principal (YouTube) debe ser audible incluso mientras la capa de Intro está activa.

### Principios:
1.  **Audio Unhidden**: La prop `muted` del `VideoPlayer` NO debe depender de la visibilidad de la intro.
2.  **Fast Fade-In (0.75s)**: El incremento de volumen debe ser lo suficientemente rápido para establecer la atmósfera antes de que el video intro termine.
    -   *Cálculo*: Incremento de `0.14` cada `100ms`.
3.  **Auditabilidad Durante Intro**: La intro visual (`z-index: 999`) actúa como un velo cinematográfico, pero la "voz" de la aplicación es el audio del contenido que está por venir.

---
*Estándar actualizado a v24.0 - Saladillo Vivo Mobile*
