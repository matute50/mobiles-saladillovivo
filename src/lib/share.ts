export const shareToWhatsApp = (content: any) => {
    if (!content) return;

    // 1. Extraction & Cleaning (Adaptado al Prompt + Contexto de App)
    // v46.0: Robust Detection based on types.ts (Article has 'titulo', Video has 'nombre')
    const isVideo = 'nombre' in content && !('titulo' in content);
    const isArticle = 'titulo' in content;

    const rawTitle = content.titulo || content.title || content.nombre || "Nuevo Contenido";
    const id = content.id;

    // Generamos el App Link (Canonical) para que WhatsApp use nuestros metadatos optimizados (page.tsx)
    const baseUrl = 'https://m.saladillovivo.com.ar';

    // v50.0 CRITICAL FIX: The app does NOT have /video or /articulo routes. 
    // It relies on Query Params (?v=... & ?id=...) handled by page.tsx
    const path = isArticle ? `/?id=${id}` : `/?v=${id}`;

    // "CleanUrl" según prompt (force https), applied to our App Link
    // v45.0: CACHE BUSTER FORCE (Re-activado estrategicamente)
    // Agregamos ?t=timestamp para obligar a WhatsApp a leer la imagen NUEVA y no usar su caché vieja equivocada.
    const cleanUrl = `${baseUrl}${path}?t=${Date.now()}`;

    // 2. Formateo de Mensaje (Reglas de Oro: Negritas y Link al final)
    const titleUpper = rawTitle.toString().toUpperCase().replaceAll('|', ' ').trim();

    // Prompt Text: "*TITLE*\n\nHe seleccionado este video para ti. Míralo aquí:\n\nURL"
    const contextText = isArticle ? "He seleccionado esta noticia para ti." : "He seleccionado este video para ti.";
    const body = `*${titleUpper}*\n\n${contextText} Míralo aquí:\n\n${cleanUrl}`;

    // 3. Generación de Deep Link
    // encodeURIComponent es CRÍTICO según el prompt
    const waApiUrl = `https://wa.me/?text=${encodeURIComponent(body)}`;

    // 4. Ejecución
    window.open(waApiUrl, '_blank');
};
