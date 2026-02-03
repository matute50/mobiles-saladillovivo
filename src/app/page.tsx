// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';
import { createClient } from '@supabase/supabase-js'; // DIRECTO

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

export default async function Home({ searchParams }: Props) {
  const data = await getPageData();
  const sParams = await searchParams;
  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} initialParams={sParams} />
    </main>
  );
}