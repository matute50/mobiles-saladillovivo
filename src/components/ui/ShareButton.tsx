'use client';

import React from 'react';
import { Share2, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Video, Article } from '@/lib/types';
import { toast } from 'sonner';

interface ShareButtonProps {
    content?: Video | Article | null;
    className?: string;
    iconSize?: number;
    variant?: 'player-control' | 'floating' | 'simple';
    customUrl?: string;
    customTitle?: string;
}

export const ShareButton = ({
    content,
    className,
    iconSize = 24,
    variant = 'player-control',
    customUrl,
    customTitle
}: ShareButtonProps) => {
    const [copied, setCopied] = React.useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const siteUrl = 'https://m.saladillovivo.com.ar';
        let shareUrl = customUrl || siteUrl;
        let shareTitle = customTitle || "Saladillo ViVo";

        if (content) {
            if ('url_slide' in content) {
                // Es Noticia (Article)
                shareUrl = `${siteUrl}/?id=${content.id}`;
                shareTitle = content.titulo;
            } else if ('url' in content) {
                // Es Video (Video)
                shareUrl = `${siteUrl}/?v=${content.id}`;
                shareTitle = content.nombre;
            }
        }

        // WhatsApp Direct Share
        const text = `${shareTitle}\n${shareUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

        window.open(whatsappUrl, '_blank');

        // Feedback visual simple
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (variant === 'player-control') {
        return (
            <button
                onClick={handleShare}
                className={cn(
                    "group flex items-center justify-center rounded-full p-6 active:scale-90 transition-all duration-200 border bg-white/10 border-white/30 backdrop-blur-md",
                    className
                )}
            >
                {copied ? <Check size={36} className="text-green-400" /> : <Share2 size={36} fill="white" />}
            </button>
        );
    }

    if (variant === 'floating') {
        return (
            <button
                onClick={handleShare}
                className={cn(
                    "p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all shadow-lg",
                    className
                )}
            >
                {copied ? <Check size={iconSize} className="text-green-400" /> : <Share2 size={iconSize} />}
            </button>
        );
    }

    // Variant 'simple' (e.g. for Decree Modal or lists)
    return (
        <button
            onClick={handleShare}
            className={cn(
                "p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95",
                className
            )}
        >
            {copied ? <Check size={iconSize} className="text-green-500" /> : <Share2 size={iconSize} />}
        </button>
    );
};
