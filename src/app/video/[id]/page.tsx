import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getVideoById } from '@/lib/data';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const video = await getVideoById(id);

    const title = video?.nombre ?? 'Video - Saladillo Vivo';
    const image = video?.imagen ?? 'https://m.saladillovivo.com.ar/icon-512.png';
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
    redirect(`/?v=${id}`);
}
