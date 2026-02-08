import { useState, useEffect } from 'react';

/**
 * Hook para detectar la orientación del dispositivo y manejar el estado de landscape.
 */
export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      const isLand = window.matchMedia("(orientation: landscape)").matches;
      // Pequeño workaround para teclados virtuales: verificar que el alto sea razonable
      const isKeyboardEffect = (window.visualViewport?.height || window.innerHeight) < 300 && !isLand;

      if (!isKeyboardEffect) {
        setIsLandscape(isLand);
      }
    };

    handleOrientationChange();

    const mediaQuery = window.matchMedia("(orientation: landscape)");

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOrientationChange);
    } else {
      mediaQuery.addListener(handleOrientationChange);
    }

    window.addEventListener("resize", handleOrientationChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOrientationChange);
      } else {
        mediaQuery.removeListener(handleOrientationChange);
      }
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return isLandscape;
}
