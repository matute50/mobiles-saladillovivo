import { Metadata } from 'next';
import { getVideoById } from '@/lib/data';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const video = await getVideoById(id);

    const title = video?.nombre ?? 'Video - Saladillo Vivo';
    let image = video?.imagen;

    if (!image && video?.url) {
        const match = video.url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/);
        const ytId = (match && match[1]) ? match[1] : null;
        if (ytId && ytId.length === 11) {
            image = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
        }
    }

    if (!image) {
        image = 'https://m.saladillovivo.com.ar/icon-512.png';
    }

    const url = `https://m.saladillovivo.com.ar/video/${id}`;
    const description = video?.nombre ? `${video.nombre}` : 'Video de Saladillo Vivo';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: image, width: 1280, height: 720 }],
            url,
            type: 'video.other',
            siteName: 'Saladillo Vivo',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function VideoPage({ params }: Props) {
    const { id } = await params;
    
    // Devolvemos 200 OK en lugar de 307 Redirect para que WhatsApp lea los metadatos correctamente.
    return (
        <main style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
            <p>Sintonizando Saladillo Vivo...</p>
            <script dangerouslySetInnerHTML={{ __html: `window.location.replace('/?v=${id}');` }} />
        </main>
    );
}
