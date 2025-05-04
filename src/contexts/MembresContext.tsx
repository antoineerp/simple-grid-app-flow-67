
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { syncMembres, getMembres } from '@/services/users/membresService';
import { useSyncContext } from '@/hooks/useSyncContext';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  const refreshMembres = useCallback(async () => {
    if (!isAuthenticated()) {
      console.log("MembresContext: Tentative de récupération des membres sans authentification");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // S'assurer que membres est toujours un tableau valide, même si vide
      const membresToSync = Array.isArray(membres) ? [...membres] : [];
      
      // Synchroniser les données avec le serveur
      if (isOnline) {
        console.log("MembresContext: Synchronisation des membres depuis le serveur");
        console.log("MembresContext: État des membres avant synchronisation:", membresToSync);
        
        let syncSuccess = false;
        try {
          syncSuccess = await syncMembres(membresToSync);
          
          if (syncSuccess) {
            setLastSynced(new Date());
            setSyncFailed(false);
            console.log("MembresContext: Synchronisation des membres réussie");
          } else {
            console.warn("MembresContext: Synchronisation des membres incomplète");
            toast({
              title: "Synchronisation incomplète",
              description: "Des problèmes sont survenus lors de la synchronisation des membres",
              variant: "warning",
            });
          }
        } catch (syncError) {
          console.error("MembresContext: Erreur lors de la synchronisation des membres", syncError);
          toast({
            title: "Erreur de synchronisation",
            description: syncError instanceof Error ? syncError.message : "Erreur inconnue",
            variant: "destructive",
          });
          
          // Ne pas interrompre le flux, on essaie quand même de charger les données locales
          setSyncFailed(true);
        }
      } else {
        console.log("MembresContext: Mode hors ligne, pas de synchronisation");
        toast({
          title: "Mode hors ligne",
          description: "Vous êtes en mode hors ligne, les données sont chargées localement",
          variant: "default",
        });
      }
      
      // Charger les données (potentiellement depuis la base locale)
      console.log("MembresContext: Chargement des membres");
      try {
        const membresData = await getMembres();
        
        // S'assurer que membresData est toujours un tableau
        if (Array.isArray(membresData)) {
          setMembres(membresData);
          console.log("MembresContext: Membres chargés avec succès:", membresData.length);
        } else {
          console.error("MembresContext: Les données des membres ne sont pas un tableau valide");
          setMembres([]);
          toast({
            title: "Erreur de format",
            description: "Format de données invalide",
            variant: "destructive",
          });
        }
      } catch (loadError) {
        console.error("MembresContext: Erreur lors du chargement des membres", loadError);
        toast({
          title: "Erreur de chargement",
          description: loadError instanceof Error ? loadError.message : "Erreur inconnue",
          variant: "destructive",
        });
        
        // Continuer avec un tableau vide
        setMembres([]);
        throw loadError;
      }
    } catch (err) {
      console.error("MembresContext: Erreur lors du chargement des membres", err);
      setSyncFailed(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isOnline, membres, toast]);

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
