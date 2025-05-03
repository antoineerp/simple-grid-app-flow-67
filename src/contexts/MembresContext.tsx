
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

export const MembresProvider: React.FC<MembresProviderProps> = ({ children }) => {
  // Démarrer avec un tableau vide
  const [membres, setMembres] = useState<Membre[]>([]);
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
    
    if (initialized.current && !forceRefresh) {
      console.log("MembresProvider: Les membres sont déjà initialisés et aucun rechargement forcé n'est demandé");
      return;
    }
    
    try {
      console.log(`MembresProvider: ${initialized.current ? "Rechargement" : "Première initialisation"} des membres`);
      setIsLoading(true);
      
      if (isOnline) {
        try {
          // Récupère le token d'authentification
          const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
          
          if (!authToken) {
            console.log("MembresProvider: Aucun token d'authentification trouvé, utilisation d'un tableau vide");
            setMembres([]);
            setLastSynced(new Date());
            initialized.current = true;
            return;
          }
          
          const loadedMembres = await getMembresService(forceRefresh);
          
          if (!mountedRef.current) return;
          
          if (loadedMembres && loadedMembres.length > 0) {
            console.log(`MembresProvider: ${loadedMembres.length} membres chargés depuis le service`);
            setMembres(loadedMembres);
            initialized.current = true;
            consecutiveErrorsRef.current = 0;
            setSyncFailed(false);
            authErrorShownRef.current = false;
          } else {
            console.log("MembresProvider: Aucun membre chargé depuis le service - initialisation avec tableau vide");
            setMembres([]); // Initialiser avec tableau vide au lieu des données par défaut
          }
          
          setLastSynced(new Date());
          setSyncFailed(false);
          setError(null);
        } catch (serviceError) {
          if (!mountedRef.current) return;
          
          console.error("MembresProvider: Erreur du service de membres:", serviceError);
          
          // Check for authentication error
          const isAuthError = serviceError instanceof Error && 
                              (serviceError.message.includes("authentifi") || 
                               serviceError.message.includes("auth") || 
                               serviceError.message.includes("token") ||
                               serviceError.message.includes("permission"));
          
          // Display authentication error only once
          if (isAuthError && !authErrorShownRef.current) {
            toast({
              title: "Problème d'authentification",
              description: "Vous n'êtes pas authentifié ou votre session a expiré",
              variant: "destructive",
              duration: 5000
            });
            authErrorShownRef.current = true;
          } 
          // For other errors, track consecutive failures
          else if (!isAuthError) {
            // Incrémenter le compteur d'erreurs consécutives
            consecutiveErrorsRef.current++;
            
            // Afficher un toast d'erreur uniquement après plusieurs échecs
            if (consecutiveErrorsRef.current >= 2) {
              toast({
                title: "Problème de synchronisation",
                description: "Les données des membres n'ont pas pu être synchronisées",
                variant: "destructive",
                duration: 5000
              });
            }
          }
          
          setError(serviceError instanceof Error ? serviceError : new Error(String(serviceError)));
          setSyncFailed(true);
          
          // Conserver un tableau vide en cas d'erreur pour un nouveau utilisateur
          if (!initialized.current) {
            setMembres([]);
          }
        }
      } else {
        console.log("MembresProvider: Mode hors ligne, utilisation des données existantes");
      }
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
  }, [isOnline, isLoading, toast]);

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

  // Effet supplémentaire pour surveiller les changements de connectivité
  useEffect(() => {
    if (isOnline && lastSynced === null && !isLoading) {
      console.log("MembresProvider: Connexion rétablie, tentative de rechargement des membres");
      
      // Délai avant de recharger pour laisser le temps à la connexion de se stabiliser
      const reconnectTimeout = setTimeout(() => {
        if (mountedRef.current) {
          loadMembres(true).catch(error => {
            console.error("MembresProvider: Erreur lors du rechargement après reconnexion:", error);
          });
        }
      }, 2000);
      
      return () => clearTimeout(reconnectTimeout);
    }
  }, [isOnline, lastSynced, isLoading, loadMembres]);

  const resetSyncFailed = useCallback(() => {
    setSyncFailed(false);
    consecutiveErrorsRef.current = 0;
    authErrorShownRef.current = false;
  }, []);

  const refreshMembres = useCallback(async () => {
    console.log("MembresProvider: Rechargement forcé des membres");
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
