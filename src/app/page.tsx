// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://m.saladillovivo.com.ar';

type Props = {
  searchParams: Promise<{ id?: string; v?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const title = "Saladillo ViVo";
  const description = "Noticias y videos de Saladillo en tiempo real.";
  const imageUrl = `${SITE_URL}/logo_social.png`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: 'Saladillo ViVo',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        type: 'image/png',
      }],
      locale: 'es_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: SITE_URL,
    }
  };
}

export default async function Home() {
  const data = await getPageData();
  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} />
    </main>
  );
}