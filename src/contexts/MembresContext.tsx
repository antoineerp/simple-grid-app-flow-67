
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider = ({ children }: { children: ReactNode }) => {
  // Récupérer l'identifiant de l'utilisateur connecté
  const currentUser = localStorage.getItem('currentUser') || 'default';
  
  // Récupérer les membres du localStorage spécifiques à l'utilisateur actuel
  const [membres, setMembres] = useState<Membre[]>(() => {
    const storedMembres = localStorage.getItem(`membres_${currentUser}`);
    return storedMembres ? JSON.parse(storedMembres) : [
      { 
        id: "1", 
        nom: 'BONNET', 
        prenom: 'RICHARD', 
        fonction: 'DXDXD', 
        initiales: 'RB',
        date_creation: new Date(),
        mot_de_passe: '****' // Ajout du champ obligatoire
      }
    ];
  });

  // Sauvegarder les membres dans le localStorage spécifique à l'utilisateur actuel
  useEffect(() => {
    localStorage.setItem(`membres_${currentUser}`, JSON.stringify(membres));
  }, [membres, currentUser]);

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
