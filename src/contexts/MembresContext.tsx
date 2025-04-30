
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

// Membres par défaut pour éviter une page vide
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

export const MembresProvider: React.FC<MembresProviderProps> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>(defaultMembres);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { isOnline } = useNetworkStatus();
  const initialized = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Fonction pour charger/recharger les membres
  const loadMembres = async () => {
    if (!mountedRef.current) return;
    
    if (initialized.current) {
      console.log("MembresProvider: Rechargement des membres déjà initialisés");
    } else {
      console.log("MembresProvider: Première initialisation des membres");
    }
    
    try {
      setIsLoading(true);
      
      if (isOnline) {
        try {
          const loadedMembres = await getMembresService();
          if (loadedMembres && loadedMembres.length > 0 && mountedRef.current) {
            console.log(`MembresProvider: ${loadedMembres.length} membres chargés depuis le service`);
            setMembres(loadedMembres);
            initialized.current = true;
          } else if (mountedRef.current) {
            // Conserver les membres par défaut si aucun membre n'est chargé
            console.log("MembresProvider: Aucun membre chargé depuis le service, conservation des valeurs par défaut");
          }
        } catch (serviceError) {
          console.error("MembresProvider: Erreur du service de membres:", serviceError);
          // Conserver les membres actuels en cas d'erreur
          if (mountedRef.current) {
            setError(serviceError instanceof Error ? serviceError : new Error(String(serviceError)));
            setSyncFailed(true);
          }
        }
      }
      
      if (mountedRef.current) {
        setLastSynced(new Date());
        setSyncFailed(false);
      }
    } catch (err) {
      console.error('MembresProvider: Erreur lors du chargement des membres:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setSyncFailed(true);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Charger les membres au démarrage et nettoyer au démontage
  useEffect(() => {
    mountedRef.current = true;
    
    const loadMembresIfMounted = async () => {
      try {
        await loadMembres();
      } catch (error) {
        console.error("MembresProvider: Erreur lors du chargement initial des membres:", error);
      }
    };
    
    loadMembresIfMounted();
    
    // Nettoyer lors du démontage du composant
    return () => {
      mountedRef.current = false;
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
