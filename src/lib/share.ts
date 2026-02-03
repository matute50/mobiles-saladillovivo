import { Article, Video } from './types';

export const handleShareContent = (content: Article | Video) => {
    const isVideo = 'url' in content;
    const shareUrl = isVideo
        ? `https://m.saladillovivo.com.ar/video/${content.id}`
        : `https://m.saladillovivo.com.ar/articulo/${content.id}`;

    const shareTitle = ('titulo' in content ? content.titulo : (content as Video).nombre).replaceAll('|', ' ').replaceAll('"', '').trim();
    const text = `Mira esto en Saladillo Vivo: ${shareTitle}`.trim();

    // v30.0: Timestamp Cache-Busting (?t=123...) para forzar SCRARE NUEVO en WhatsApp
    // Esto garantiza que la URL sea única y WhatsApp no use una caché corrupta.
    const bustUrl = `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

    // v22.0: Forzar siempre WhatsApp Directo (User Request)
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + bustUrl)}`, '_blank');
};
