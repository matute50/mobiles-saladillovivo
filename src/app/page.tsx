import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';

// Esto hace que la página no se guarde en caché (siempre busca noticias frescas)
export const dynamic = 'force-dynamic';

export default async function Home() {
  let data = null;

  try {
    // Intentamos buscar los datos reales en Supabase
    data = await getPageData();
    console.log("✅ Datos obtenidos de Supabase");
  } catch (error) {
    console.error("❌ Error buscando datos:", error);
    // Si falla, MobileLayout usará el MOCK_DATA automáticamente
  }

  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} isMobile={true} />
    </main>
  );
}