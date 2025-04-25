
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { useToast } from '@/hooks/use-toast';
import { loadMembresFromStorage, saveMembrestoStorage } from '@/services/membres/membresService';
import { syncMembresWithServer, loadMembresFromServer } from '@/services/membres/membresSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MembresContextProps {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date;
  hasError: boolean;
  syncError: string | null;
  syncWithServer: () => Promise<void>;
  loadData: () => Promise<void>;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const currentUser = localStorage.getItem('currentUser') || 'default';

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (membres.length > 0) {
      saveMembrestoStorage(membres, currentUser);
    }
  }, [membres]);

  // Charger les données
  const loadData = async () => {
    // Réinitialiser l'état d'erreur
    setHasError(false);
    setSyncError(null);
    
    // D'abord, essayer de charger depuis le serveur
    if (isOnline) {
      try {
        setIsSyncing(true);
        const serverData = await loadMembresFromServer(currentUser);
        setIsSyncing(false);
        
        if (serverData) {
          setMembres(serverData);
          setLastSynced(new Date());
          return;
        }
      } catch (error) {
        setIsSyncing(false);
        setHasError(true);
        setSyncError(error instanceof Error ? error.message : "Erreur inconnue");
        console.error('Erreur lors du chargement depuis le serveur:', error);
        
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de charger les données depuis le serveur. Utilisation des données locales.",
          variant: "destructive",
        });
      }
    }
    
    // Charger depuis le stockage local si le serveur n'est pas disponible
    console.log("Chargement des données depuis le stockage local");
    const localData = loadMembresFromStorage(currentUser);
    setMembres(localData);
  };

  // Méthode de synchronisation avec le serveur
  const syncWithServer = async () => {
    if (!isOnline) {
      toast({
        title: "Synchronisation impossible",
        description: "Vous êtes actuellement hors ligne",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setHasError(false);
    setSyncError(null);
    
    try {
      const success = await syncMembresWithServer(membres, currentUser);
      
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "Les membres ont été synchronisés avec le serveur",
        });
        setLastSynced(new Date());
      } else {
        setHasError(true);
        setSyncError("Échec de la synchronisation");
        toast({
          title: "Échec de la synchronisation",
          description: "Une erreur est survenue lors de la synchronisation",
          variant: "destructive",
        });
      }
    } catch (error) {
      setHasError(true);
      setSyncError(error instanceof Error ? error.message : "Erreur inconnue");
      console.error('Erreur de synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: `${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <MembresContext.Provider value={{ 
      membres, 
      setMembres, 
      isSyncing,
      isOnline,
      lastSynced,
      hasError,
      syncError,
      syncWithServer,
      loadData
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
