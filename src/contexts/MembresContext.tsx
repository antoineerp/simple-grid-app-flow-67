
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { syncMembres, getMembres } from '@/services/users/membresService';
import { useSyncContext } from '@/hooks/useSyncContext';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MembresContextType {
  membres: Membre[];
  isLoading: boolean;
  error: string | Error | null;
  syncFailed: boolean;
  lastSynced: Date | null;
  refreshMembres: () => Promise<void>;
  addMembre: (membre: Membre) => Promise<void>;
  updateMembre: (id: string, membre: Membre) => Promise<void>;
  deleteMembre: (id: string) => Promise<void>;
  getMembre: (id: string) => Membre | undefined;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | Error | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isAuthenticated } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  const refreshMembres = useCallback(async () => {
    if (!isAuthenticated()) {
      console.log("MembresContext: Tentative de récupération des membres sans authentification");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Synchroniser les données avec le serveur
      if (isOnline) {
        console.log("MembresContext: Synchronisation des membres depuis le serveur");
        await syncMembres();
        setLastSynced(new Date());
        setSyncFailed(false);
      } else {
        console.log("MembresContext: Mode hors ligne, pas de synchronisation");
      }
      
      // Charger les données (potentiellement depuis la base locale)
      console.log("MembresContext: Chargement des membres");
      const membresData = await getMembres();
      setMembres(membresData);
    } catch (err) {
      console.error("MembresContext: Erreur lors du chargement des membres", err);
      setSyncFailed(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isOnline]);

  const addMembre = async (membre: Membre): Promise<void> => {
    // Implémentation à venir
    console.log("Ajout d'un membre", membre);
  };

  const updateMembre = async (id: string, membre: Membre): Promise<void> => {
    // Implémentation à venir
    console.log("Mise à jour d'un membre", id, membre);
  };

  const deleteMembre = async (id: string): Promise<void> => {
    // Implémentation à venir
    console.log("Suppression d'un membre", id);
  };

  const getMembre = (id: string): Membre | undefined => {
    return membres.find(membre => membre.id === id);
  };

  // Charger les membres lors du montage du composant
  useEffect(() => {
    if (isAuthenticated()) {
      refreshMembres();
    }
  }, [refreshMembres, isAuthenticated]);

  return (
    <MembresContext.Provider 
      value={{ 
        membres, 
        isLoading, 
        error, 
        syncFailed,
        lastSynced,
        refreshMembres,
        addMembre,
        updateMembre,
        deleteMembre,
        getMembre
      }}
    >
      {children}
    </MembresContext.Provider>
  );
};

export const useMembres = (): MembresContextType => {
  const context = useContext(MembresContext);
  if (context === undefined) {
    throw new Error('useMembres doit être utilisé à l\'intérieur d\'un MembresProvider');
  }
  return context;
};
