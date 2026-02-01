---
name: video-playback-mastery
description: Domina la reproducción de video en Next.js, incluyendo políticas de YouTube, Cloudflare R2 para noticias, intros y técnicas anti-branding. Actualizado con los estándares específicos de Saladillo Vivo.
---

# Maestría en Reproducción de Video (Video Playback Mastery)

Este skill proporciona el conocimiento técnico necesario para implementar sistemas de video avanzados, optimizados y con una estética premium en aplicaciones Next.js.

## 1. Política de Reproducción Automática (YouTube & HTML5)

Los navegadores modernos bloquean el autoplay con sonido. Para garantizar la funcionalidad:

### YouTube IFrame API
- **Parámetros obligatorios:** `autoplay=1`, `mute=1`, `enablejsapi=1`, `controls=0`.
- **Reintento Agresivo:** Implementar un `setInterval` que verifique el estado del reproductor cada segundo. Si el estado es `PAUSED` (2), `CUED` (5), o `UNSTARTED` (-1) durante el inicio, forzar `playVideo()`.
- **Bloqueador de Pausas:** Si se detecta una pausa en los primeros 5 segundos (posible bloqueo del sistema), re-disparar el Play.

### HTML5 Video (`<video>`)
- **Atributos:** `autoPlay`, `muted`, `playsInline`, `loop`.
- **R2 (Noticias):** Servir `.mp4` con `preload="metadata"` y siempre usar una imagen de `poster` para evitar pantallas negras.

## 2. Progresión y Transiciones (Flujo Maestro 4.0)

La aplicación utiliza un sistema de **capas superpuestas** y **selección anticipada** para garantizar transiciones invisibles.

### Selección de Contenido (Reglas de Oro)
1. **Anticipación**: El reproductor debe elegir el siguiente video *durante* la reproducción del actual.
2. **Diversidad de Categoría**: El próximo video debe ser de una categoría **diferente** a la del video actual.
3. **Exclusión**: Nunca elegir videos de la categoría "HCD de Saladillo".
4. **Estado**: Se debe precargar el `nextContent` en una capa inferior para reproducción inmediata.

### Flujo de Transición: YouTube -> Intro
1. **Disparador (T - 0.5s)**: Exactamente **0.5 segundos** antes del final del video actual:
   - Iniciar **Fade-out** de audio del video en reproducción.
   - Iniciar reproducción de un **Video Intro** al azar en la Capa Superior.
2. **Capas**:
   - **Capa Superior**: Reproduce la Intro (.mp4 local).
   - **Capa Inferior**: El nuevo video de YouTube ya ha sido precargado y comienza su reproducción paralelamente a la Intro.

### Flujo de Transición: Intro -> YouTube
1. **Tuning de Intro**: Ajustar la velocidad de reproducción (`playbackRate`) del video intro para que dure exactamente **4 segundos**.
2. **Independencia de Capas**: El video de YouTube debe iniciar paralelamente bajo la intro, pero **no debe ocultar la intro** al arrancar. La intro solo se retira por su propio fin o el temporizador de 4s.
3. **Fade-out Intro**: Iniciar desvanecimiento de la intro (opacidad) **0.5 segundos** antes de su fin.
4. **Sincronización TV**: El video de YouTube en el fondo puede empezar hasta 5 segundos antes (si el flujo lo permite) para estar en un punto de interés al revelarse.

## 3. Estándares Específicos de Saladillo Vivo

### Autoplay y Volumen
- **Volumen Inicial:** El volumen global por defecto debe ser **100%** (valor 1).
- **Manejo de Transiciones de Audio:**
  - **Fade-in:** 1 segundo al iniciar la reproducción.
  - **Fade-out:** Iniciar el desvanecimiento **0.5 segundos** antes del final del video de YouTube.
- **Sincronización:** El volumen local se sincroniza con `useVolumeStore`, pero se desacopla durante los efectos de fade.

### Técnicas Anti-Branding (Obligatorio)
1. **Controles:** `controls=0` en los `playerVars` de YouTube.
2. **Capa de Bloqueo:** Un `div` con `absolute inset-0` y `z-index` superior para evitar clics directos sobre el iframe.
3. **Cropping (Recorte):** Es **obligatorio** envolver el iframe en un contenedor con `overflow: hidden` y aplicar una altura del **110%** para ocultar la marca de agua de YouTube.

## 4. Implementación en Antigravity

Usa estas reglas para diagnosticar problemas de "videos que no arrancan" o "branding de YouTube visible". Prioriza siempre el uso de `usePlayerStore` y `useVolumeStore` para mantener la lógica centralizada.
