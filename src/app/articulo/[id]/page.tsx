import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

interface Props {
    params: Promise<{ id: string }>;
}

async function getArticle(id: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
        .from('noticias')
        .select('id, titulo, imagen')
        .eq('id', id)
        .single();
    return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const article = await getArticle(id);

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
    redirect(`/?id=${id}`);
}
