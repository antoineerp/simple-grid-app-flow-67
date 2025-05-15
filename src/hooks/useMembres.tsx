
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { useToast } from '@/hooks/use-toast';
import { loadMembresFromStorage, saveMembrestoStorage } from '@/services/membres/membresService';
import { useGlobalSync } from '@/hooks/useGlobalSync';

interface MembresContextProps {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([]);
  const { appData, saveData } = useGlobalSync();

  // Récupérer l'identifiant technique de l'utilisateur connecté
  const getUserId = (): string => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return 'default';
    
    try {
      const currentUser = JSON.parse(currentUserStr);
      return currentUser.identifiant_technique || currentUser.id || 'default';
    } catch (e) {
      return currentUserStr;
    }
  };
  
  const userId = getUserId();

  // Charger les données au démarrage
  useEffect(() => {
    // Charger depuis les données globales quand elles sont disponibles
    if (appData.membres) {
      setMembres(appData.membres);
    } else {
      // Charger depuis le stockage local
      const localData = loadMembresFromStorage(userId);
      setMembres(localData);
    }
    
    // Écouter les mises à jour des membres
    const handleMembresUpdate = () => {
      const localData = loadMembresFromStorage(userId);
      setMembres(localData);
    };
    
    window.addEventListener('membresUpdate', handleMembresUpdate);
    
    return () => {
      window.removeEventListener('membresUpdate', handleMembresUpdate);
    };
  }, [userId, appData.membres]);

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (membres.length > 0) {
      saveMembrestoStorage(membres, userId);
      
      // Mettre à jour les données globales
      saveData({
        ...appData,
        membres: membres
      });
    }
  }, [membres, userId, appData, saveData]);

  return (
    <MembresContext.Provider value={{ 
      membres, 
      setMembres
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
