'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface ShieldModeContextType {
  isShieldActive: boolean;
  toggleShield: () => void;
}

const ShieldModeContext = createContext<ShieldModeContextType | undefined>(undefined);

export const useShieldMode = () => {
  const context = useContext(ShieldModeContext);
  if (context === undefined) {
    throw new Error('useShieldMode must be used within a ShieldModeProvider');
  }
  return context;
};

export const ShieldModeProvider = ({ children }: { children: ReactNode }) => {
  const [isShieldActive, setIsShieldActive] = useState(false);

  const toggleShield = useCallback(() => {
    setIsShieldActive(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    isShieldActive,
    toggleShield,
  }), [isShieldActive, toggleShield]);

  return (
    <ShieldModeContext.Provider value={value}>
      {children}
    </ShieldModeContext.Provider>
  );
};
