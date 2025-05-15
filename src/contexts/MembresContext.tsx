
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { getMembres as getMembresService } from '@/services/users/membresService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MembresContextProps {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  lastSynced: Date | null;
  isLoading: boolean;
  error: Error | null;
  syncFailed: boolean;
  resetSyncFailed: () => void;
  refreshMembres: () => Promise<void>;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const useMembres = () => {
  const context = useContext(MembresContext);
  if (!context) {
    throw new Error('useMembres doit être utilisé à l\'intérieur d\'un MembresProvider');
  }
  return context;
};

interface MembresProviderProps {
  children: ReactNode;
}

export const MembresProvider: React.FC<MembresProviderProps> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { isOnline } = useNetworkStatus();

  // Fonction pour charger/recharger les membres
  const loadMembres = async () => {
    try {
      setIsLoading(true);
      // Ajouter des membres en dur par défaut pour éviter une page vide
      const defaultMembres: Membre[] = [
        {
          id: '1',
          nom: 'Dupont',
          prenom: 'Jean',
          fonction: 'Directeur',
          initiales: 'JD',
          date_creation: new Date()
        },
        {
          id: '2',
          nom: 'Martin',
          prenom: 'Sophie',
          fonction: 'Responsable RH',
          initiales: 'SM',
          date_creation: new Date()
        }
      ];
      
      if (isOnline) {
        const loadedMembres = await getMembresService();
        if (loadedMembres && loadedMembres.length > 0) {
          setMembres(loadedMembres);
        } else {
          // Utiliser les membres par défaut si aucun membre n'est chargé
          setMembres(defaultMembres);
        }
      } else {
        // Utiliser les membres par défaut si hors ligne
        setMembres(defaultMembres);
      }
      
      setLastSynced(new Date());
      setSyncFailed(false);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setSyncFailed(true);
      // Utiliser les membres par défaut en cas d'erreur
      setMembres([
        {
          id: '1',
          nom: 'Dupont',
          prenom: 'Jean',
          fonction: 'Directeur',
          initiales: 'JD',
          date_creation: new Date()
        },
        {
          id: '2',
          nom: 'Martin',
          prenom: 'Sophie',
          fonction: 'Responsable RH',
          initiales: 'SM',
          date_creation: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les membres au démarrage
  useEffect(() => {
    loadMembres();
  }, [isOnline]);

  const resetSyncFailed = () => {
    setSyncFailed(false);
  };

  const refreshMembres = async () => {
    await loadMembres();
  };

  const value = {
    membres,
    setMembres,
    lastSynced,
    isLoading,
    error,
    syncFailed,
    resetSyncFailed,
    refreshMembres
  };

  return (
    <MembresContext.Provider value={value}>
      {children}
    </MembresContext.Provider>
  );
};

export default MembresProvider;
