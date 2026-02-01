---
name: video-playback-mastery
description: Domina la reproducción de video en Next.js, incluyendo políticas de YouTube, Cloudflare R2 para noticias, intros y técnicas anti-branding.
---

# Maestría en Reproducción de Video (Video Playback Mastery)

Este skill proporciona el conocimiento técnico necesario para implementar sistemas de video avanzados, optimizados y con una estética premium en aplicaciones Next.js.

## 1. Política de Reproducción Automática (YouTube & HTML5)

Los navegadores modernos (Chrome, Safari, Edge) bloquean el autoplay con sonido para mejorar la UX y ahorrar datos.

### YouTube IFrame API
Para garantizar el autoplay en embeds de YouTube, es obligatorio usar `autoplay=1` y `mute=1`.
- **URL Completa:** `https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&enablejsapi=1`
- **Nota:** Si el usuario no ha interactuado con el sitio previamente, la API de YouTube ignorará la instrucción de "unmute" programática.

### HTML5 Video (`<video>`)
Para videos locales o de Cloudflare R2:
- **Atributos Críticos:** `autoPlay`, `muted`, `playsInline` (esencial para iOS), `loop`.
- **Preload:** Usa `preload="auto"` para intros cortas o `preload="metadata"` para galerías de noticias.

## 2. Reproducción de Noticias (Optimización)

Para noticias alojadas en **Cloudflare R2** (accesibles vía URLs en Supabase):
- **Carga Diferida:** No cargues el video hasta que el usuario haga scroll o el slide sea el activo.
- **Formátos:** Asegúrate de servir `.mp4` (H.264) para compatibilidad universal.
- **Poster:** Usa siempre una imagen de `poster` para evitar huecos negros mientras el video carga.

## 3. Inserción de Videos Intro (Splash Screen)

Un video de intro eleva la calidad percibida (Premium Splash). 
- **Lógica:** Implementar un estado `showIntro` que se ponga en `false` cuando el video termine (`onEnded`).
- **Persistencia:** Puedes usar `sessionStorage` para mostrar el intro solo una vez por sesión.
- **Efecto de Salida:** Usa una transición CSS (`opacity`, `scale`) para que el paso del intro al contenido principal sea suave.

## 4. Recursos Anti-Branding (YouTube)

YouTube ha dificultado ocultar su marca (deprecación de `modestbranding` y `showinfo`).

### Técnicas Actuales:
1. **Controles Desactivados:** Usa `controls=0`. Esto elimina la barra inferior.
2. **Overlay CSS:** Coloca un `div` invisible o con un gradiente sutil encima del reproductor para bloquear clics directos y ocultar el logo de YouTube en la esquina inferior derecha.
   - **Tip:** Usa `pointer-events: none` si necesitas que se pueda interactuar con el video, o crea tus propios botones de play/pause personalizados vinculados a la API.
3. **Recorte (Cropping):** Envuelve el iframe en un contenedor con `overflow: hidden` y haz que el iframe sea ligeramente más grande (ej: 110% de altura) para "sacar" la marca de agua del área visible.

## 5. Implementación en Antigravity

Cada vez que el usuario pida "solucionar el autoplay" o "quitar el logo de YouTube", consulta estas políticas para aplicar las soluciones más actualizadas y robustas.
