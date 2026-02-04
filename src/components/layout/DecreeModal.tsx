'use client';

import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DecreeModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export const DecreeModal = ({ isOpen, onClose, isDark }: DecreeModalProps) => {
    const [view, setView] = useState<'decree' | 'author'>('decree');

    if (!isOpen) return null;

    const handleClose = () => {
        setView('decree');
        onClose();
    };

    const mainColor = isDark ? "#6699ff" : "#003399";

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 px-3"
            onClick={handleClose}
        >
            <div
                className={cn(
                    "relative w-full max-w-lg max-h-[92vh] rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-500 transform scale-100 border border-white/10 flex flex-col",
                    isDark ? "bg-black/80" : "bg-white/80"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* LOGO DINÁMICO SUPERPUESTO (v8.5) */}
                <div className="absolute top-3 left-0 right-0 flex justify-center z-[210] pointer-events-none">
                    <div className="bg-transparent px-4 py-2">
                        <Image
                            src={isDark ? "/FONDO_OSCURO.png" : "/FONDO_CLARO.png"}
                            alt="Saladillo Vivo Logo"
                            width={110}
                            height={28}
                            className="h-7 w-auto object-contain drop-shadow-lg"
                        />
                    </div>
                </div>

                {/* HEADER DEL MODAL (Compactado) */}
                <div className="shrink-0 flex items-center justify-between px-4 py-1 border-b border-white/10">
                    {/* Botón Volver eliminado */}
                    <div className="flex-1" />
                    <button
                        onClick={handleClose}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/10 text-black"
                        )}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 p-5">

                    {view === 'decree' ? (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-[15px] font-black italic leading-tight text-center uppercase tracking-tighter" style={{ color: mainColor }}>
                                SALADILLO VIVO declarado de interes cultural y municipal, decreto HCD nro. 37/2022.
                            </h2>

                            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-white">
                                <Image
                                    src="/decreto.png"
                                    alt="Decreto Municipal"
                                    width={800}
                                    height={1100}
                                    className="w-full h-auto object-contain"
                                    priority
                                />
                            </div>

                            <button
                                onClick={() => setView('author')}
                                className="mt-2 text-xl font-black italic hover:scale-105 transition-transform text-center uppercase tracking-tighter"
                                style={{ color: mainColor }}
                            >
                                Nota del Autor
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right duration-500">
                            {/* IMAGEN FLOTANTE CIRCULAR (v9.2) */}
                            <div
                                className="float-right ml-4 mb-2 w-[120px] h-[120px] rounded-full overflow-hidden shadow-xl border-2 z-20 relative bg-white"
                                style={{
                                    borderColor: `${mainColor}33`,
                                    shapeOutside: 'circle(50%)'
                                }}
                            >
                                <Image
                                    src="/maraton.png"
                                    alt="Matías Vidal"
                                    width={240}
                                    height={240}
                                    className="w-full h-full object-cover scale-110"
                                />
                            </div>

                            <div className="relative z-10">
                                <h4 className={cn(
                                    "text-sm font-black italic tracking-tighter leading-none mb-0.5",
                                    isDark ? "text-white" : "text-black"
                                )}>
                                    Matías Vidal
                                </h4>
                                <p className="text-[9px] font-bold tracking-[0.2em] opacity-50 uppercase mb-4">
                                    CREADOR DE SALADILLO VIVO
                                </p>

                                <div className={cn(
                                    "text-[11.5px] font-bold leading-[1.35] text-pretty text-justify",
                                    isDark ? "text-white/80" : "text-black/80"
                                )}>
                                    <p className="mb-2">
                                        Soy el creador de SALADILLO VIVO, un medio local hecho desde cero con tecnología propia y una visión muy clara: conectar a los usuarios con contenidos relevantes y cercanos.
                                    </p>
                                    <p className="mb-2">
                                        Desde las apps para TV, web y móviles, el sistema de noticias, todo lo pensé y programé yo. No lo compré, no se lo pedí a nadie, no tercericé tareas: el código, el acopio de contenidos, la cámara, la edición y el streaming, salen de mis propias ideas.
                                    </p>
                                    <p className="mb-2">
                                        Nunca fue mi intención poner a funcionar una plataforma más, sino crear identidad.
                                    </p>
                                    <p className="mb-2">
                                        Quiero mostrar a Saladillo en su diversidad: sus historias, sus voces, su arte, sus frutos, porque soy parte de una red viva llena de talentosos e incansables a los que acompaño desde mi lugar, ofreciendo este medio como espacio para que sus expresiones lleguen más lejos.
                                    </p>
                                    <p className="mb-2">
                                        El motor detrás de todo esto no es una estrategia de negocio sino el amor por mi ciudad y el deseo de hacer mi aporte a nuestro sentido de pertenencia.
                                    </p>
                                    <p className="mb-2">
                                        Hago SALADILLO VIVO con la misma energía que me lleva, cada semana, a correr muchos kilómetros entrenando para una nueva maratón, donde cada paso es constancia, esfuerzo, y visión de llegada.
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t" style={{ borderColor: `${mainColor}1A` }}>
                                    <p className="font-black italic text-center text-[12px] leading-tight uppercase tracking-tight" style={{ color: mainColor }}>
                                        SALADILLO VIVO, lo que somos, lo que hacemos, lo que nos pasa.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
