'use client';

import React from 'react';
import { X, ArrowUpRight, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface InstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export const InstallModal = ({ isOpen, onClose, isDark }: InstallModalProps) => {
    if (!isOpen) return null;

    const mainColor = isDark ? "#6699ff" : "#003399";

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4"
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
                        "absolute top-3 right-3 p-1 rounded-full transition-colors",
                        isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-black/50 hover:bg-black/10 hover:text-black"
                    )}
                >
                    <X size={20} />
                </button>

                {/* Icono de la App */}
                <div className="mb-4 relative w-20 h-20 rounded-[18px] overflow-hidden shadow-lg border border-white/10">
                    <Image
                        src="/icon.png"
                        alt="Saladillo Vivo"
                        fill
                        className="object-cover"
                    />
                </div>

                <h3 className={cn(
                    "text-xl font-black italic tracking-tight mb-2",
                    isDark ? "text-white" : "text-neutral-900"
                )}>
                    Instalar Aplicación
                </h3>

                <p className={cn(
                    "text-sm font-medium leading-relaxed mb-6",
                    isDark ? "text-neutral-400" : "text-neutral-600"
                )}>
                    Instalación desde el menu: pulsa en <b className={isDark ? "text-white" : "text-black"}>Opciones</b> y elige <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-black text-xs font-bold border border-neutral-200 mt-1">Agregar a pantalla de inicio</span>
                </p>

                {/* Visual Aid / Flecha animada opcional */}
                <div className="flex items-center justify-center gap-2 mb-2 opacity-50">
                    <Menu size={20} />
                    <ArrowUpRight size={20} className="animate-bounce" />
                </div>

                <button
                    onClick={onClose}
                    className="mt-2 text-sm font-bold text-blue-500 hover:underline"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};
