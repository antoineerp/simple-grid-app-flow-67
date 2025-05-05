
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/useSync';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  isLoading: boolean;
  error: string | null;
  syncWithServer: () => Promise<boolean>;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  resetSyncFailed: () => void;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Utilisation du hook de synchronisation central
  const { 
    isSyncing, 
    isOnline, 
    lastSynced, 
    syncFailed, 
    syncAndProcess, 
    resetSyncStatus 
  } = useSync('membres');
  
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
    
    try {
      const result = await syncAndProcess({
        tableName: 'membres',
        data: membres
      });
      
      return result.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      return false;
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
        
        // Pour l'instant, initialisons avec un tableau vide
        // Le chargement depuis le serveur sera implémenté plus tard
        setMembres([]);
        
        if (!isOnline) {
          toast({
            title: "Mode hors-ligne",
            description: "Vous êtes en mode hors-ligne. Les données peuvent ne pas être à jour.",
            variant: "default",
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors du chargement des membres:", errorMessage);
        setMembres([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMembres();
  }, [isOnline, toast]);
  
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
      resetSyncFailed: resetSyncStatus
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
