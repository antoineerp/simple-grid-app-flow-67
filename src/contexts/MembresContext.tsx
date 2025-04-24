
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromStorage, saveMembresInStorage } from '@/services/membres/membresService';

// Interface pour le contexte
interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  loading: boolean;
}

// Création du contexte avec une valeur par défaut
const MembresContext = createContext<MembresContextType>({
  membres: [],
  setMembres: () => {},
  loading: true
});

// Hook personnalisé pour utiliser le contexte
export const useMembres = () => useContext(MembresContext);

export const MembresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [membres, setMembresState] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = () => {
      // Récupérer l'utilisateur connecté (identifiant technique ou email)
      const userId = localStorage.getItem('currentUser');
      const userEmail = localStorage.getItem('userEmail');
      return userId || userEmail || 'default_user';
    };

    const loadMembres = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      console.log("Chargement des membres pour", user);
      const loadedMembres = loadMembresFromStorage(user);
      setMembresState(loadedMembres);
      setLoading(false);
    };

    loadMembres();
    
    // Écouter les changements d'utilisateur
    const handleUserChange = () => {
      const newUser = getCurrentUser();
      if (newUser !== currentUser) {
        console.log("Changement d'utilisateur détecté:", newUser);
        loadMembres();
      }
    };

    window.addEventListener('userChanged', handleUserChange);
    
    return () => {
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [currentUser]);

  // Wrapped setMembres to also save to storage
  const setMembres = (membresOrFunction: React.SetStateAction<Membre[]>) => {
    setMembresState(prev => {
      const newMembres = typeof membresOrFunction === 'function' 
        ? membresOrFunction(prev)
        : membresOrFunction;
        
      if (currentUser) {
        saveMembresInStorage(newMembres, currentUser);
      }
      
      return newMembres;
    });
  };

  return (
    <MembresContext.Provider value={{ membres, setMembres, loading }}>
      {children}
    </MembresContext.Provider>
  );
};
