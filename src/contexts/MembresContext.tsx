
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Membre } from '@/types/membres';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Ne plus charger les membres du serveur, juste utiliser le tableau vide
  useEffect(() => {
    initialized.current = true;
    setMembres([]);
    setLastSynced(new Date());
    setSyncFailed(false);
    setError(null);
    setIsLoading(false);
    
    // Supprimer également les données du localStorage
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        localStorage.removeItem(`membres_${currentUser}`);
        console.log("Données de membres supprimées du localStorage");
      }
    } catch (e) {
      console.error("Erreur lors de la suppression des données du localStorage", e);
    }
  }, []);

  const resetSyncFailed = useCallback(() => {
    setSyncFailed(false);
    consecutiveErrorsRef.current = 0;
    authErrorShownRef.current = false;
  }, []);

  const refreshMembres = useCallback(async () => {
    console.log("MembresProvider: Réinitialisation des membres à un tableau vide");
    setMembres([]);
    return Promise.resolve();
  }, []);

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
