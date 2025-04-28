
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromStorage, saveMembrestoStorage } from '@/services/membres/membresService';
import { syncMembresWithServer, loadMembresFromServer } from '@/services/membres/membresSync';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSynced: Date | null;
  syncWithServer: () => Promise<boolean>;
  isOnline: boolean;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Fonction pour synchroniser les données avec le serveur
  const syncWithServer = async (): Promise<boolean> => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      console.error("Aucun utilisateur connecté pour synchroniser");
      toast({
        title: "Erreur de synchronisation",
        description: "Vous devez être connecté pour synchroniser vos données",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isOnline) {
      toast({
        title: "Mode hors-ligne",
        description: "La synchronisation est indisponible en mode hors-ligne",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setIsSyncing(true);
      setError(null);
      
      // Envoyer les données au serveur
      const success = await syncMembresWithServer(membres, currentUser);
      
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur",
        });
        return true;
      } else {
        setError("Échec de la synchronisation");
        toast({
          title: "Échec de synchronisation",
          description: "Impossible de synchroniser avec le serveur",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Sauvegarder les membres dans le stockage local quand ils changent
  useEffect(() => {
    if (!isLoading && membres.length > 0) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        console.log("Sauvegarde des membres dans le stockage local pour", currentUser);
        saveMembrestoStorage(membres, currentUser);
      }
    }
  }, [membres, isLoading]);
  
  // Charger les membres au démarrage
  useEffect(() => {
    const loadMembres = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.warn("Aucun utilisateur connecté pour charger les membres");
          setMembres([]);
          return;
        }
        
        console.log("Chargement des membres pour l'utilisateur", currentUser);
        
        // Essayer d'abord de charger depuis le serveur si en ligne
        if (isOnline) {
          try {
            setIsSyncing(true);
            const serverMembres = await loadMembresFromServer(currentUser);
            
            if (serverMembres && serverMembres.length > 0) {
              console.log("Membres chargés depuis le serveur:", serverMembres.length);
              setMembres(serverMembres);
              saveMembrestoStorage(serverMembres, currentUser);
              setLastSynced(new Date());
              return;
            }
          } catch (err) {
            console.error("Erreur lors du chargement des membres depuis le serveur:", err);
          } finally {
            setIsSyncing(false);
          }
        }
        
        // Fallback: charger depuis le stockage local
        console.log("Chargement des membres depuis le stockage local");
        const storageMembres = loadMembresFromStorage(currentUser);
        setMembres(storageMembres);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors du chargement des membres:", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMembres();
    
    // Configurer une synchronisation automatique toutes les 5 minutes si en ligne
    const autoSyncInterval = setInterval(() => {
      if (isOnline && !isSyncing && getCurrentUser()) {
        console.log("Tentative de synchronisation automatique");
        syncWithServer().catch(console.error);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(autoSyncInterval);
  }, [isOnline]);
  
  return (
    <MembresContext.Provider value={{
      membres,
      setMembres,
      isLoading,
      isSyncing,
      error,
      lastSynced,
      syncWithServer,
      isOnline
    }}>
      {children}
    </MembresContext.Provider>
  );
};

export const useMembres = (): MembresContextType => {
  const context = useContext(MembresContext);
  if (context === undefined) {
    throw new Error('useMembres must be used within a MembresProvider');
  }
  return context;
};
