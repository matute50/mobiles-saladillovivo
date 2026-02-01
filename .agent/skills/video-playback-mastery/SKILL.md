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

## 2. Estándares Específicos de Saladillo Vivo

Para mantener la consistencia premium en toda la aplicación (PC y Mobile):

### Autoplay y Volumen
- **Volumen Inicial:** El volumen global por defecto debe ser **100%** (valor 1).
- **Manejo de Transiciones de Audio:**
  - **Fade-in:** 1 segundo al iniciar la reproducción para evitar saltos bruscos.
  - **Fade-out:** Iniciar el desvanecimiento en los últimos **0.5 a 1 segundo** del video.
- **Sincronización:** El volumen local del reproductor debe sincronizarse con el `useVolumeStore` global, pero permitiendo el control fino para los efectos de fade.

### Secuencia de Intro (Espacio Publicitario)
- **Overlay de Intro:** Antes de cada video de YouTube, se muestra un overlay de 4 segundos (`3.5s` fijos + `0.5s` de fade CSS).
- **Precarga:** El video principal debe empezar a cargarse por debajo del overlay de intro para estar listo inmediatamente después.
- **Transición TV:** En el modo TV, el video de fondo puede empezar a reproducirse hasta 5 segundos antes de que termine la intro para una transición fluida.

### Técnicas Anti-Branding (Obligatorio)
1. **Controles:** `controls=0` en los `playerVars` de YouTube.
2. **Capa de Bloqueo:** Un `div` con `absolute inset-0` y `z-index` superior para evitar que el usuario haga clic derecho o interactúe directamente con el iframe (Regla de Oro).
3. **Cropping (Recorte):** Es **obligatorio** envolver el iframe en un contenedor con `overflow: hidden` y aplicar un escalado o altura del **110%** para ocultar la marca de agua de YouTube en la esquina inferior.

## 3. Implementación en Antigravity

Usa estas reglas para diagnosticar problemas de "videos que no arrancan" o "branding de YouTube visible". Prioriza siempre el uso de `usePlayerStore` y `useVolumeStore` para mantener la lógica centralizada.
