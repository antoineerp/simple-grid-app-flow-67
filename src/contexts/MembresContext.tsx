
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { getMembres as getMembresService } from '@/services/users/membresService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';

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

// Membres par défaut - tableau vide
const defaultMembres: Membre[] = [];

export const MembresProvider: React.FC<MembresProviderProps> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>(defaultMembres);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { isOnline } = useNetworkStatus();
  const initialized = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);
  const { toast } = useToast();
  const authErrorShownRef = useRef<boolean>(false);

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // Utiliser un useCallback pour rendre la fonction réutilisable et stable
  const loadMembres = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    
    // Si déjà en chargement, ne pas lancer un nouveau chargement
    if (isLoading) {
      console.log("MembresProvider: Déjà en cours de chargement, requête ignorée");
      return;
    }
    
    // Limiter la durée de chargement à 15 secondes maximum
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.log("MembresProvider: Timeout de chargement atteint");
        setIsLoading(false);
      }
    }, 15000);
    
    try {
      console.log(`MembresProvider: ${initialized.current ? "Rechargement" : "Première initialisation"} des membres`);
      setIsLoading(true);
      
      // Initialiser avec un tableau vide
      console.log("MembresProvider: Initialisation avec un tableau vide");
      setMembres([]);
      initialized.current = true;
      consecutiveErrorsRef.current = 0;
      setSyncFailed(false);
      authErrorShownRef.current = false;
      
      setLastSynced(new Date());
      setSyncFailed(false);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('MembresProvider: Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setSyncFailed(true);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        
        // Nettoyer le timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    }
  }, [isLoading, toast]);

  // Charger les membres au démarrage avec un délai pour éviter les conflits d'initialisation
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      if (!mountedRef.current) return;
      
      // Fonction asynchrone auto-exécutée
      loadMembres()
        .catch(error => {
          console.error("MembresProvider: Erreur lors du chargement initial des membres:", error);
        });
    }, 500); // petit délai pour laisser les autres composants s'initialiser
    
    return () => clearTimeout(initTimeout);
  }, [loadMembres]);

  const resetSyncFailed = useCallback(() => {
    setSyncFailed(false);
    consecutiveErrorsRef.current = 0;
    authErrorShownRef.current = false;
  }, []);

  const refreshMembres = useCallback(async () => {
    console.log("MembresProvider: Rechargement forcé des membres");
    // Lors du rechargement forcé, on vide le tableau de membres
    setMembres([]);
    await loadMembres(true);
  }, [loadMembres]);

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
