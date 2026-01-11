import { useState, useEffect } from 'react';

export const useThemeButtonColors = () => {
  const [buttonColor, setButtonColor] = useState("#FFFFFF");
  const [buttonBorderColor, setButtonBorderColor] = useState("#FFFFFF");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateButtonColors = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue('--carousel-button-color').trim();
        const borderColor = rootStyles.getPropertyValue('--carousel-button-border-color').trim();
        setButtonColor(`rgb(${color})`);
        setButtonBorderColor(`rgb(${borderColor})`);
      };

      updateButtonColors();
      const observer = new MutationObserver(updateButtonColors);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      return () => observer.disconnect();
    }
  }, []);

  return { buttonColor, buttonBorderColor };
};
