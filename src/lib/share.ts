export const shareToWhatsApp = (content: any) => {
    if (!content) return;

    // 1. Extraction & Cleaning (Adaptado al Prompt + Contexto de App)
    const isVideo = 'videoUrl' in content || 'url' in content || 'youtube_id' in content; // Basic detection
    const rawTitle = content.titulo || content.title || content.nombre || "Nuevo Contenido";
    const id = content.id;

    // Generamos el App Link (Canonical) para que WhatsApp use nuestros metadatos optimizados (page.tsx)
    // Usamos t=Date.now() como "Cache Buster" implícito si quisiéramos, pero el prompt pide "Limpieza de URL".
    // Sin embargo, para que el preview funcione, necesitamos el link de la APP, no el directo de YouTube/mp4.
    const baseUrl = 'https://m.saladillovivo.com.ar';
    const path = isVideo ? `/video/${id}` : `/articulo/${id}`;

    // "CleanUrl" según prompt (force https), applied to our App Link
    const cleanUrl = `${baseUrl}${path}`;

    // 2. Formateo de Mensaje (Reglas de Oro: Negritas y Link al final)
    const titleUpper = rawTitle.toString().toUpperCase().replaceAll('|', ' ').trim();

    // Prompt Text: "*TITLE*\n\nHe seleccionado este video para ti. Míralo aquí:\n\nURL"
    const body = `*${titleUpper}*\n\nHe seleccionado este video para ti. Míralo aquí:\n\n${cleanUrl}`;

    // 3. Generación de Deep Link
    // encodeURIComponent es CRÍTICO según el prompt
    const waApiUrl = `https://wa.me/?text=${encodeURIComponent(body)}`;

    // 4. Ejecución
    window.open(waApiUrl, '_blank');
};
