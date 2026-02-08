import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el teclado virtual está abierto en dispositivos móviles.
 * Utiliza el visualViewport API para mayor precisión.
 */
export function useKeyboard(isSearchOpen: boolean) {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const handleResize = () => {
            const height = window.visualViewport?.height || window.innerHeight;
            const screenHeight = window.innerHeight;
            // Si el viewport es menor al 85% de la pantalla, asumimos teclado
            setIsKeyboardOpen(height < (screenHeight * 0.85) && isSearchOpen);
        };

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);

        handleResize();

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
        };
    }, [isSearchOpen]);

    return isKeyboardOpen;
}
