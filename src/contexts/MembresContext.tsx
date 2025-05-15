
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromStorage, saveMembrestoStorage } from '@/services/membres/membresService';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useGlobalSync } from '@/hooks/useGlobalSync';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { isSyncing, lastSynced, syncWithServer, appData } = useGlobalSync();
  
  const currentUser = getCurrentUser() || localStorage.getItem('currentUser') || 'default';
  
  // Charger les membres au démarrage
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Si des données sont disponibles depuis la synchronisation globale
        if (appData.membres && appData.membres.length > 0) {
          console.log("Chargement des membres depuis les données globales:", appData.membres.length);
          setMembres(appData.membres);
        } else {
          // Sinon, charger depuis le stockage local
          console.log("Chargement des membres depuis le stockage local");
          const storageMembres = loadMembresFromStorage(currentUser);
          setMembres(storageMembres);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors du chargement des membres:", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, appData.membres]);

  // Sauvegarder les membres dans le stockage local quand ils changent
  useEffect(() => {
    if (!isLoading && membres.length > 0) {
      console.log("Sauvegarde des membres dans le stockage local pour", currentUser);
      saveMembrestoStorage(membres, currentUser);
    }
  }, [membres, isLoading, currentUser]);

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
