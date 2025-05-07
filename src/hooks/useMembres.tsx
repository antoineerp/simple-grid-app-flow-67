
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { useToast } from '@/hooks/use-toast';
import { loadMembresFromStorage, saveMembrestoStorage } from '@/services/membres/membresService';
import { useGlobalSync } from '@/hooks/useGlobalSync';

interface MembresContextProps {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([]);
  const { isSyncing, isOnline, lastSynced, appData, saveData } = useGlobalSync();
  const currentUser = localStorage.getItem('currentUser') || 'default';

  // Charger les données au démarrage
  useEffect(() => {
    // Charger depuis le stockage local
    const loadFromStorage = () => {
      const localData = loadMembresFromStorage(currentUser);
      setMembres(localData);
    };
    
    // Charger depuis les données globales quand elles sont disponibles
    if (appData.membres) {
      setMembres(appData.membres);
    } else {
      loadFromStorage();
    }
    
    // Écouter les mises à jour des membres
    const handleMembresUpdate = () => {
      loadFromStorage();
    };
    
    window.addEventListener('membresUpdate', handleMembresUpdate);
    
    return () => {
      window.removeEventListener('membresUpdate', handleMembresUpdate);
    };
  }, [currentUser, appData.membres]);

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (membres.length > 0) {
      saveMembrestoStorage(membres, currentUser);
      
      // Mettre à jour les données globales
      saveData({
        ...appData,
        membres: membres
      });
    }
  }, [membres]);

  return (
    <MembresContext.Provider value={{ 
      membres, 
      setMembres, 
      isSyncing,
      isOnline,
      lastSynced
    }}>
      {children}
    </MembresContext.Provider>
  );
};

export const useMembres = () => {
  const context = useContext(MembresContext);
  if (context === undefined) {
    throw new Error('useMembres doit être utilisé à l\'intérieur d\'un MembresProvider');
  }
  return context;
};
