
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider = ({ children }: { children: ReactNode }) => {
  // Récupérer les membres du localStorage ou utiliser un tableau vide si aucun n'existe
  const [membres, setMembres] = useState<Membre[]>(() => {
    const storedMembres = localStorage.getItem('membres');
    return storedMembres ? JSON.parse(storedMembres) : [
      { 
        id: "1", 
        nom: 'BONNET', 
        prenom: 'RICHARD', 
        fonction: 'DXDXD', 
        initiales: 'RB',
        date_creation: new Date()
      }
    ];
  });

  // Sauvegarder les membres dans le localStorage lorsqu'ils changent
  useEffect(() => {
    localStorage.setItem('membres', JSON.stringify(membres));
  }, [membres]);

  return (
    <MembresContext.Provider value={{ membres, setMembres }}>
      {children}
    </MembresContext.Provider>
  );
};

export const useMembres = (): MembresContextType => {
  const context = useContext(MembresContext);
  if (context === undefined) {
    throw new Error('useMembres must be used within a MembresProvider');
  }
  return context;
};
