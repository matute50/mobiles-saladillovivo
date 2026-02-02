import { Article, Video } from './types';

export const handleShareContent = (content: Article | Video) => {
    const isVideo = 'url' in content;
    const shareUrl = isVideo
        ? `https://saladillovivo.com.ar/video/${content.id}`
        : `https://saladillovivo.com.ar/articulo/${content.id}`;

    const shareTitle = 'titulo' in content ? content.titulo : (content as Video).nombre;
    const text = `Mira esto en Saladillo Vivo: ${shareTitle}`;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: text,
            url: shareUrl,
        }).catch(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
        });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
    }
};
