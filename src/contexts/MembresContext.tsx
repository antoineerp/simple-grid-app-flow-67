
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { useSync } from '@/hooks/useSync';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { useGlobalData } from './GlobalDataContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MembresContextProps {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  addMembre: (membre: Membre) => void;
  updateMembre: (id: string, membre: Membre) => void;
  deleteMembre: (id: string) => void;
  syncWithServer: () => Promise<boolean>;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced: Date | null;
  isLoading: boolean;
  error: string | null;
  syncFailed: boolean;
  resetSyncFailed: () => void;
}

const MembresContext = createContext<MembresContextProps | undefined>(undefined);

export const useMembres = () => {
  const context = useContext(MembresContext);
  if (!context) {
    throw new Error('useMembres doit être utilisé à l\'intérieur de MembresProvider');
  }
  return context;
};

export const MembresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Utiliser le contexte global
  const { 
    membres: globalMembres, 
    setMembres: setGlobalMembres,
    lastSynced: globalLastSynced,
    setLastSynced: setGlobalLastSynced,
    syncFailed: globalSyncFailed,
    setSyncFailed: setGlobalSyncFailed,
    isSyncing: globalIsSyncing,
    setIsSyncing: setGlobalIsSyncing
  } = useGlobalData();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const { syncAndProcess } = useSync('membres');
  
  // Charger les membres depuis le localStorage au démarrage
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const addMembre = useCallback((membre: Membre) => {
    setGlobalMembres(prev => [...prev, membre]);
  }, [setGlobalMembres]);

  const updateMembre = useCallback((id: string, membre: Membre) => {
    setGlobalMembres(prev => prev.map(m => m.id === id ? membre : m));
  }, [setGlobalMembres]);

  const deleteMembre = useCallback((id: string) => {
    setGlobalMembres(prev => prev.filter(m => m.id !== id));
  }, [setGlobalMembres]);

  const syncWithServer = async (): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "Les données sont sauvegardées localement. La synchronisation sera effectuée lorsque vous serez en ligne.",
        variant: "destructive"
      });
      return false;
    }

    setGlobalIsSyncing(true);

    try {
      const result = await syncAndProcess({
        tableName: 'membres',
        data: globalMembres
      });

      if (result.success) {
        setGlobalLastSynced(new Date());
        setGlobalSyncFailed(false);
        return true;
      } else {
        setGlobalSyncFailed(true);
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation des membres:", error);
      setGlobalSyncFailed(true);
      setError(error instanceof Error ? error.message : "Erreur de synchronisation");
      return false;
    } finally {
      setGlobalIsSyncing(false);
    }
  };

  const resetSyncFailed = () => {
    setGlobalSyncFailed(false);
    setError(null);
  };

  const value = {
    membres: globalMembres,
    setMembres: setGlobalMembres,
    addMembre,
    updateMembre,
    deleteMembre,
    syncWithServer,
    isSyncing: globalIsSyncing,
    isOnline,
    lastSynced: globalLastSynced,
    isLoading,
    error,
    syncFailed: globalSyncFailed,
    resetSyncFailed
  };

  return (
    <MembresContext.Provider value={value}>
      {children}
    </MembresContext.Provider>
  );
};
