
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
  syncWithServer: () => Promise<void>;
  loadData: () => Promise<void>;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
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
    // D'abord, essayer de charger depuis le serveur
    if (isOnline) {
      try {
        const serverData = await loadMembresFromServer(currentUser);
        if (serverData) {
          setMembres(serverData);
          setLastSynced(new Date());
          return;
        }
      } catch (error) {
        console.error('Erreur lors du chargement depuis le serveur:', error);
      }
    }
    
    // Charger depuis le stockage local si le serveur n'est pas disponible
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
    
    try {
      const success = await syncMembresWithServer(membres, currentUser);
      
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "Les membres ont été synchronisés avec le serveur",
        });
        setLastSynced(new Date());
      } else {
        toast({
          title: "Échec de la synchronisation",
          description: "Une erreur est survenue lors de la synchronisation",
          variant: "destructive",
        });
      }
    } catch (error) {
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
