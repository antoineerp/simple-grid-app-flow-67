
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  const initialized = useRef<boolean>(false);

  // Fonction pour charger/recharger les membres
  const loadMembres = async () => {
    if (initialized.current) {
      console.log("MembresProvider: Rechargement des membres déjà initialisés");
    } else {
      console.log("MembresProvider: Première initialisation des membres");
    }
    
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
        try {
          const loadedMembres = await getMembresService();
          if (loadedMembres && loadedMembres.length > 0) {
            console.log(`MembresProvider: ${loadedMembres.length} membres chargés depuis le service`);
            setMembres(loadedMembres);
            initialized.current = true;
          } else {
            // Utiliser les membres par défaut si aucun membre n'est chargé
            console.log("MembresProvider: Aucun membre chargé depuis le service, utilisation des valeurs par défaut");
            setMembres(defaultMembres);
          }
        } catch (serviceError) {
          console.error("MembresProvider: Erreur du service de membres:", serviceError);
          // Utiliser les membres par défaut en cas d'erreur du service
          setMembres(defaultMembres);
          throw serviceError;
        }
      } else {
        // Utiliser les membres par défaut si hors ligne
        console.log("MembresProvider: Mode hors ligne, utilisation des valeurs par défaut");
        setMembres(defaultMembres);
      }
      
      setLastSynced(new Date());
      setSyncFailed(false);
    } catch (err) {
      console.error('MembresProvider: Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setSyncFailed(true);
      // Utiliser les membres par défaut en cas d'erreur générale
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
    let isMounted = true;
    const loadMembresIfMounted = async () => {
      try {
        await loadMembres();
      } catch (error) {
        console.error("MembresProvider: Erreur lors du chargement initial des membres:", error);
      }
    };
    
    // Charger les membres uniquement si le composant est monté
    if (isMounted) {
      loadMembresIfMounted();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOnline]);

  const resetSyncFailed = () => {
    setSyncFailed(false);
  };

  const refreshMembres = async () => {
    return await loadMembres();
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
