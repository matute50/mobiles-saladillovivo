import MobileLayout from "@/components/layout/MobileLayout";
import { getPageData } from "@/lib/data";
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Resumen de Noticias - Saladillo Vivo',
    description: 'Mira el resumen de noticias y videos seleccionados para hoy.',
};

export default async function ResumenPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getPageData();

    return (
        <main className="min-h-screen bg-black">
            <Suspense fallback={<div className="min-h-screen bg-black" />}>
                <MobileLayout data={data} resumenId={id} />
            </Suspense>
        </main>
    );
}
