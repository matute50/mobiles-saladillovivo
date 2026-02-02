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

### 2. Regla de Oro de Videos Intro (Flujo Maestro 4.0)
Los videos intro son el puente entre contenidos y deben cumplir estrictamente:

1. **Ubicación y Nomenclatura**:
   - Ruta: `public/videos_intro/`
   - Nombres: `intro1.mp4`, `intro2.mp4`, `intro3.mp4`, `intro4.mp4`, `intro5.mp4`.
2. **Sincronización de Capas**:
   - Siempre se reproducen en la **Capa Superior** con `z-index: 100`.
   - Deben ocultar completamente la carga del siguiente video de YouTube.
3. **Duración Exacta (4 Segundos)**:
   - Independientemente de la duración original del archivo, se debe alterar la velocidad (`playbackRate`) para que dure exactamente **4 segundos**.
   - `playbackRate = video.duration / 4`.
4. **Efecto de Transición**:
   - **Fade-out de Opacidad**: Debe iniciar exactamente **0.5 segundos** antes del final de la intro (T-0.5s).
   - Este desvanecimiento permite que el video de YouTube (Capa Inferior) se vuelva visible suavemente.

### 3. Técnicas Anti-Branding 5.0 (White-Label YouTube)
Para que YouTube parezca un reproductor propietario, se deben aplicar simultáneamente:

1. **Ajuste de Escala (Perfect Fit)**:
   - El player debe escalarse exactamente al **100% de ancho** y **100% de alto**.
   - Posicionamiento: `left: 0`, `top: 0`. Esto garantiza la visibilidad íntegra del contenido original.
2. **Parámetros del Player (Hardening)**:
   - `modestbranding: 1`, `controls: 0`, `showinfo: 0`, `rel: 0`, `iv_load_policy: 3`.
   - `disablekb: 1` (desactiva atajos de teclado), `fs: 0` (desactiva pantalla completa nativa).
3. **Bloqueo de Interacción (Glass-Wall Defense)**:
   - Una capa invisible (`z-index: 20`) sobre todo el área del video con `pointer-events: auto` (intercepta clics antes del iframe).
   - Esto impide que el usuario haga clic en "Watch on YouTube" o abra menús nativos.

## 4. Estándares Específicos de Saladillo Vivo

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
