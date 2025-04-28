
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromServer, syncMembresWithServer } from '@/services/membres/membresService';
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
  syncFailed: boolean;
  resetSyncFailed: () => void;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Fonction pour réinitialiser l'état d'échec de synchronisation
  const resetSyncFailed = () => {
    setSyncFailed(false);
    setSyncAttempts(0);
  };
  
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
    
    // Si on a déjà eu trop d'échecs consécutifs, bloquer la synchronisation
    if (syncFailed && syncAttempts >= 3) {
      toast({
        title: "Synchronisation bloquée",
        description: "La synchronisation a échoué plusieurs fois. Veuillez essayer plus tard ou contacter le support.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setIsSyncing(true);
      setError(null);
      
      // S'assurer que l'utilisateur est un identifiant valide
      const userId = typeof currentUser === 'object' ? 
        (currentUser.identifiant_technique || currentUser.email || 'p71x6d_system') : 
        currentUser;
        
      console.log(`Synchronisation des membres pour l'utilisateur ${userId} avec ${membres.length} membres`);
      
      const success = await syncMembresWithServer(membres, userId);
      
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        setSyncAttempts(0);
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur",
        });
        
        // Recharger les données après synchronisation pour avoir l'état le plus récent
        const updatedMembres = await loadMembresFromServer(userId);
        setMembres(updatedMembres);
        
        return true;
      } else {
        setSyncFailed(true);
        setSyncAttempts(prev => prev + 1);
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
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
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
          setIsLoading(false);
          return;
        }
        
        // S'assurer que l'utilisateur est un identifiant valide
        const userId = typeof currentUser === 'object' ? 
          (currentUser.identifiant_technique || currentUser.email || 'p71x6d_system') : 
          currentUser;
          
        console.log("Chargement des membres pour l'utilisateur", userId);
        
        if (isOnline) {
          try {
            setIsSyncing(true);
            const serverMembres = await loadMembresFromServer(userId);
            
            setMembres(serverMembres);
            setLastSynced(new Date());
            console.log("Membres chargés depuis le serveur:", serverMembres.length);
          } catch (err) {
            console.error("Erreur lors du chargement des membres depuis le serveur:", err);
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            // Si erreur, initialiser avec un tableau vide
            setMembres([]);
            setSyncFailed(true);
            setSyncAttempts(prev => prev + 1);
          } finally {
            setIsSyncing(false);
          }
        } else {
          toast({
            title: "Mode hors-ligne",
            description: "Vous êtes en mode hors-ligne. Les données peuvent ne pas être à jour.",
            variant: "default",
          });
          // Initialiser avec un tableau vide en mode hors ligne
          setMembres([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors du chargement des membres:", errorMessage);
        // Si erreur, initialiser avec un tableau vide
        setMembres([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMembres();
    
    // Configurer une synchronisation automatique toutes les 5 minutes si en ligne
    // et seulement si la synchronisation précédente n'a pas échoué
    const autoSyncInterval = setInterval(() => {
      if (isOnline && !isSyncing && getCurrentUser() && !syncFailed) {
        console.log("Tentative de synchronisation automatique");
        syncWithServer().catch(console.error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
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
      isOnline,
      syncFailed,
      resetSyncFailed
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
