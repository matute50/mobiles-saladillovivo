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

## 2. Progresión y Transiciones (Flujo Maestro)

La aplicación utiliza un sistema de **capas superpuestas** para garantizar transiciones suaves entre contenidos de YouTube y videos institucionales (Intros).

### Flujo de Transición: YouTube -> Intro
1. **Detección de Fin:** Cuando un video de YouTube termina (`onEnded`), se activa la lógica de `usePlayerStore`.
2. **Selección del Próximo:** Se busca el siguiente video en la cola/DB.
3. **Capa Institucional:** Si el próximo destino es otro video de YouTube, **no se muestra directamente**. En su lugar, se activa el `overlayIntroVideo` (Capa de Intro).
4. **Estado:** `isPreRollOverlayActive` se establece en `true`.

### Flujo de Transición: Intro -> YouTube
1. **Carga en Segundo Plano:** Mientras la Intro (.mp4 local) se reproduce en la capa superior, el `VideoPlayer` de YouTube comienza a cargar el video real por debajo (Capa Inferior).
2. **Temporizador de Salida:** Se activa un temporizador de 4 segundos (3.5s estables + 0.5s de desvanecimiento).
3. **Sincronización TV (Modo TV):** Para una fluidez total, el video de YouTube en el fondo puede empezar a reproducirse hasta **5 segundos antes** de que termine el video de la intro local.
4. **Revelación:** Tras el temporizador, el overlay se destruye (`null`), revelando el video de YouTube ya cargado y en reproducción.

## 3. Estándares Específicos de Saladillo Vivo

### Autoplay y Volumen
- **Volumen Inicial:** El volumen global por defecto debe ser **100%** (valor 1).
- **Manejo de Transiciones de Audio:**
  - **Fade-in:** 1 segundo al iniciar la reproducción.
  - **Fade-out:** Iniciar el desvanecimiento en el último **1 segundo** del video de YouTube.
- **Sincronización:** El volumen local se sincroniza con `useVolumeStore`, pero se desacopla durante los efectos de fade.

### Técnicas Anti-Branding (Obligatorio)
1. **Controles:** `controls=0` en los `playerVars` de YouTube.
2. **Capa de Bloqueo:** Un `div` con `absolute inset-0` y `z-index` superior para evitar clics directos sobre el iframe.
3. **Cropping (Recorte):** Es **obligatorio** envolver el iframe en un contenedor con `overflow: hidden` y aplicar una altura del **110%** para ocultar la marca de agua de YouTube.

## 4. Implementación en Antigravity

Usa estas reglas para diagnosticar problemas de "videos que no arrancan" o "branding de YouTube visible". Prioriza siempre el uso de `usePlayerStore` y `useVolumeStore` para mantener la lógica centralizada.
