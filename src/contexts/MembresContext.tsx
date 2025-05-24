
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromServer } from '@/services/membres/membresService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { isOnline } = useNetworkStatus();
  const initialized = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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

  const loadMembres = useCallback(async (forceRefresh = false) => {
    // VÉRIFICATION STRICTE: Ne pas charger si l'utilisateur n'est pas connecté
    if (!getIsLoggedIn()) {
      console.log("MembresProvider: ERREUR - Utilisateur non connecté, impossible de charger les membres depuis la base de données Infomaniak");
      setError(new Error("Utilisateur non connecté - impossible d'accéder à la base de données Infomaniak"));
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log("MembresProvider: ERREUR - Aucun utilisateur courant identifié pour la base de données Infomaniak");
      setError(new Error("Aucun utilisateur courant - impossible d'accéder à la base de données Infomaniak"));
      return;
    }

    if (!mountedRef.current) return;
    
    if (isLoading) {
      console.log("MembresProvider: Déjà en cours de chargement depuis la base de données Infomaniak");
      return;
    }

    // NE PAS utiliser de cache local - TOUJOURS aller chercher en base de données
    console.log(`MembresProvider: CHARGEMENT EXCLUSIF depuis la base de données Infomaniak pour l'utilisateur: ${currentUser}`);
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!isOnline) {
        throw new Error("Connexion internet requise pour accéder à la base de données Infomaniak");
      }

      // CHARGEMENT EXCLUSIF depuis la base de données Infomaniak
      const loadedMembres = await loadMembresFromServer(currentUser);
      
      if (!mountedRef.current) return;
      
      console.log(`MembresProvider: ${loadedMembres.length} membres chargés EXCLUSIVEMENT depuis la base de données Infomaniak`);
      
      // MISE À JOUR STRICTE : Utiliser uniquement les données de la base
      setMembres(loadedMembres);
      setLastSynced(new Date());
      setSyncFailed(false);
      setError(null);
      initialized.current = true;
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'accès à la base de données Infomaniak';
      console.error("MembresProvider: ERREUR CRITIQUE - Impossible d'accéder à la base de données Infomaniak:", errorMessage);
      
      setError(new Error(`ERREUR BASE DE DONNÉES INFOMANIAK: ${errorMessage}`));
      setSyncFailed(true);
      
      // AFFICHER UNE ERREUR CLAIRE À L'UTILISATEUR
      toast({
        title: "Erreur de base de données",
        description: `Impossible d'accéder à la base de données Infomaniak: ${errorMessage}`,
        variant: "destructive",
        duration: 10000
      });
      
      // NE PAS utiliser de données de fallback - laisser vide en cas d'erreur
      setMembres([]);
      
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isOnline, isLoading, toast]);

  // Charger les membres au démarrage UNIQUEMENT si connecté
  useEffect(() => {
    if (!getIsLoggedIn()) {
      console.log("MembresProvider: Utilisateur non connecté, aucun chargement depuis la base de données Infomaniak");
      return;
    }

    const initTimeout = setTimeout(() => {
      if (!mountedRef.current) return;
      
      loadMembres()
        .catch(error => {
          console.error("MembresProvider: Erreur lors du chargement initial depuis la base de données Infomaniak:", error);
        });
    }, 500);
    
    return () => clearTimeout(initTimeout);
  }, [loadMembres]);

  const resetSyncFailed = useCallback(() => {
    setSyncFailed(false);
    setError(null);
  }, []);

  const refreshMembres = useCallback(async () => {
    if (!getIsLoggedIn()) {
      console.log("MembresProvider: Utilisateur non connecté, impossible de rafraîchir depuis la base de données Infomaniak");
      setError(new Error("Utilisateur non connecté - impossible de rafraîchir depuis la base de données Infomaniak"));
      return;
    }

    console.log("MembresProvider: Rechargement forcé EXCLUSIVEMENT depuis la base de données Infomaniak");
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
