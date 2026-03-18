import { Metadata } from 'next';
import { getArticleById } from '@/lib/data';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const article = await getArticleById(id);

    const title = article?.titulo ?? 'Noticia - Saladillo Vivo';
    const image = article?.imagen ?? 'https://m.saladillovivo.com.ar/icon-512.png';
    const url = `https://m.saladillovivo.com.ar/articulo/${id}`;
    const description = article?.titulo ? `${article.titulo}` : 'Información de Saladillo Vivo';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: image, width: 1280, height: 720 }],
            url,
            type: 'article',
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

export default async function ArticuloPage({ params }: Props) {
    const { id } = await params;
    
    // Devolvemos 200 OK en lugar de 307 Redirect para que WhatsApp lea los metadatos correctamente.
    return (
        <main style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
            <p>Sintonizando Saladillo Vivo...</p>
            <script dangerouslySetInnerHTML={{ __html: `window.location.replace('/?id=${id}');` }} />
        </main>
    );
}
