import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/types/auth';

interface MembresContextProps {
  membres: User[];
  setMembres: React.Dispatch<React.SetStateAction<User[]>>;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const MembresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [membres, setMembres] = useState<User[]>([]);

  useEffect(() => {
    // Charger les membres depuis le localStorage au montage
    const storedMembres = localStorage.getItem('membres');
    if (storedMembres) {
      setMembres(JSON.parse(storedMembres));
    }
  }, []);

  useEffect(() => {
    // Sauvegarder les membres dans le localStorage à chaque modification
    localStorage.setItem('membres', JSON.stringify(membres));
  }, [membres]);

  const value: MembresContextProps = {
    membres,
    setMembres,
  };

  return (
    <MembresContext.Provider value={value}>
      {children}
    </MembresContext.Provider>
  );
};

// Ajouter le hook useMembresContext
export const useMembresContext = () => {
  const context = useContext(MembresContext);
  if (!context) {
    throw new Error("useMembresContext must be used within a MembresProvider");
  }
  return context;
};

export default MembresContext;
