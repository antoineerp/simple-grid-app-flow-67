
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { loadMembresFromStorage, saveMembrestoStorage } from '@/services/membres/membresService';
import { syncMembresWithServer, loadMembresFromServer } from '@/services/membres/membresSync';
import { useToast } from '@/hooks/use-toast';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date;
  syncWithServer: () => Promise<void>;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider = ({ children }: { children: ReactNode }) => {
  // Récupérer l'identifiant de l'utilisateur connecté
  const currentUser = localStorage.getItem('currentUser') || 'default';
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  
  // Récupérer les membres du localStorage spécifiques à l'utilisateur actuel
  const [membres, setMembres] = useState<Membre[]>(() => {
    const storedMembres = localStorage.getItem(`membres_${currentUser}`);
    return storedMembres ? JSON.parse(storedMembres) : [
      { 
        id: "1", 
        nom: 'BONNET', 
        prenom: 'RICHARD', 
        fonction: 'DXDXD', 
        initiales: 'RB',
        date_creation: new Date(),
        mot_de_passe: '****' // Ajout du champ obligatoire
      }
    ];
  });

  // Sauvegarder les membres dans le localStorage spécifique à l'utilisateur actuel
  useEffect(() => {
    localStorage.setItem(`membres_${currentUser}`, JSON.stringify(membres));
  }, [membres, currentUser]);

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
      syncWithServer
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
