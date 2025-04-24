
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromStorage, saveMembresInStorage, syncMembresWithServer } from '@/services/membres/membresService';
import { getCurrentUserId } from '@/services/core/syncService';

// Interface pour le contexte
interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  loading: boolean;
  syncWithServer: () => Promise<boolean>;
}

// Création du contexte avec une valeur par défaut
const MembresContext = createContext<MembresContextType>({
  membres: [],
  setMembres: () => {},
  loading: true,
  syncWithServer: async () => false
});

// Hook personnalisé pour utiliser le contexte
export const useMembres = () => useContext(MembresContext);

export const MembresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [membres, setMembresState] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const loadMembres = () => {
      // Utilisez getCurrentUserId du service de synchronisation
      const user = getCurrentUserId();
      setCurrentUser(user);
      
      console.log("Chargement des membres pour", user);
      const loadedMembres = loadMembresFromStorage(user);
      setMembresState(loadedMembres);
      setLoading(false);
    };

    loadMembres();
    
    // Écouter les changements d'utilisateur
    const handleUserChange = () => {
      const newUser = getCurrentUserId();
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

  // Synchroniser avec le serveur au chargement
  useEffect(() => {
    const syncWithServer = async () => {
      if (membres.length > 0 && !loading && currentUser) {
        try {
          setIsSyncing(true);
          await syncMembresWithServer(membres, currentUser);
        } catch (error) {
          console.error("Erreur lors de la synchronisation initiale:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    syncWithServer();
  }, [membres, loading, currentUser]);

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

  // Function to trigger manual synchronization
  const syncWithServer = async () => {
    if (!currentUser) return false;
    
    setIsSyncing(true);
    const success = await syncMembresWithServer(membres, currentUser);
    setIsSyncing(false);
    
    return success;
  };

  return (
    <MembresContext.Provider value={{ membres, setMembres, loading, syncWithServer }}>
      {children}
    </MembresContext.Provider>
  );
};
