
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider = ({ children }: { children: ReactNode }) => {
  // Obtenir l'identifiant de l'utilisateur actuel
  const currentUser = localStorage.getItem('userId') || 'anonymous';
  const storageKey = `membres_${currentUser}`;
  
  // Récupérer les membres du localStorage pour l'utilisateur spécifique ou utiliser un tableau vide
  const [membres, setMembres] = useState<Membre[]>(() => {
    const storedMembres = localStorage.getItem(storageKey);
    return storedMembres ? JSON.parse(storedMembres) : [
      { 
        id: "1", 
        nom: 'BONNET', 
        prenom: 'RICHARD', 
        fonction: 'DXDXD', 
        initiales: 'RB',
        date_creation: new Date(),
        mot_de_passe: ''
      }
    ];
  });

  // Sauvegarder les membres dans le localStorage lorsqu'ils changent
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(membres));
  }, [membres, storageKey]);

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
