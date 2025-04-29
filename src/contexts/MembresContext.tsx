
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { useGlobalData } from './GlobalDataContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useGlobalSync } from './GlobalSyncContext';

interface MembresContextProps {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  addMembre: (membre: Membre) => void;
  updateMembre: (id: string, membre: Membre) => void;
  deleteMembre: (id: string) => void;
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
    syncFailed: globalSyncFailed,
    setSyncFailed: setGlobalSyncFailed
  } = useGlobalData();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const { syncTable, syncStates } = useGlobalSync();
  
  // Charger les membres depuis le localStorage au démarrage
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const addMembre = useCallback((membre: Membre) => {
    const updatedMembres = [...globalMembres, membre];
    setGlobalMembres(updatedMembres);
    
    // Si connecté, synchroniser immédiatement
    if (isOnline && !globalSyncFailed && !syncStates['membres']?.isSyncing) {
      syncTable('membres', updatedMembres).catch(console.error);
    }
  }, [globalMembres, setGlobalMembres, isOnline, globalSyncFailed, syncStates, syncTable]);

  const updateMembre = useCallback((id: string, membre: Membre) => {
    const updatedMembres = globalMembres.map(m => m.id === id ? membre : m);
    setGlobalMembres(updatedMembres);
    
    // Si connecté, synchroniser immédiatement
    if (isOnline && !globalSyncFailed && !syncStates['membres']?.isSyncing) {
      syncTable('membres', updatedMembres).catch(console.error);
    }
  }, [globalMembres, setGlobalMembres, isOnline, globalSyncFailed, syncStates, syncTable]);

  const deleteMembre = useCallback((id: string) => {
    const updatedMembres = globalMembres.filter(m => m.id !== id);
    setGlobalMembres(updatedMembres);
    
    // Si connecté, synchroniser immédiatement
    if (isOnline && !globalSyncFailed && !syncStates['membres']?.isSyncing) {
      syncTable('membres', updatedMembres).catch(console.error);
    }
  }, [globalMembres, setGlobalMembres, isOnline, globalSyncFailed, syncStates, syncTable]);

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
