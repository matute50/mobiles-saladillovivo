'use client';

import React from 'react';
import { X, Share, MoreVertical, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface InstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export const InstallModal = ({ isOpen, onClose, isDark }: InstallModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 px-4"
            onClick={onClose}
        >
            <div
                className={cn(
                    "relative w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 border flex flex-col items-center p-6 text-center animate-in zoom-in-95",
                    isDark ? "bg-neutral-900 border-white/10" : "bg-white border-black/10"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className={cn(
                        "absolute top-3 right-3 p-2 rounded-full transition-colors",
                        isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-black/50 hover:bg-black/10 hover:text-black"
                    )}
                >
                    <X size={20} />
                </button>

                {/* Cabecera con Logo */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative w-24 h-24 mb-4 rounded-[22px] overflow-hidden shadow-2xl border border-white/10">
                        <Image
                            src="/icon-192.png"
                            alt="Saladillo Vivo"
                            fill
                            className="object-cover"
                            sizes="96px"
                            priority
                        />
                    </div>
                    <h3 className={cn(
                        "text-xl font-black italic tracking-tight",
                        isDark ? "text-white" : "text-neutral-900"
                    )}>
                        Instalar Saladillo Vivo
                    </h3>
                    <p className={cn(
                        "text-sm font-medium mt-1",
                        isDark ? "text-neutral-400" : "text-neutral-500"
                    )}>
                        Agrega la app a tu inicio para una mejor experiencia.
                    </p>
                </div>

                {/* Instrucciones */}
                <div className={cn(
                    "w-full text-left space-y-4 mb-6 p-4 rounded-xl",
                    isDark ? "bg-white/5" : "bg-neutral-100"
                )}>
                    {/* iOS */}
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                            <Share size={18} />
                        </div>
                        <div>
                            <p className={cn("text-xs font-bold uppercase mb-1 opacity-70", isDark ? "text-white" : "text-black")}>iPhone / iPad (Safari)</p>
                            <p className={cn("text-sm leading-snug", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                Toca <b className="text-blue-500">Compartir</b> y elige <span className="whitespace-nowrap font-bold"><PlusSquare size={12} className="inline mx-1 mb-0.5" />Agregar a Inicio</span>
                            </p>
                        </div>
                    </div>

                    <div className={cn("w-full h-px", isDark ? "bg-white/10" : "bg-black/10")} />

                    {/* Android */}
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 p-2 bg-green-500/10 rounded-lg text-green-500 mt-1">
                            <MoreVertical size={18} />
                        </div>
                        <div>
                            <p className={cn("text-xs font-bold uppercase mb-1 opacity-70", isDark ? "text-white" : "text-black")}>Android (Chrome)</p>
                            <p className={cn("text-sm leading-snug", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                Toca el <b className="text-green-500">Menú</b> y elige <span className="font-bold">Instalar aplicación</span>
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="py-3 px-8 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 active:scale-95 transition-all w-full"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};
