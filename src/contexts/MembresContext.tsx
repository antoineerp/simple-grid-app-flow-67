
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromStorage, saveMembresInStorage } from '@/services/membres/membresService';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/services/auth/authService';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  loading: boolean;
  refreshMembres: () => Promise<void>;
}

const MembresContext = createContext<MembresContextType>({
  membres: [],
  setMembres: () => {},
  loading: true,
  refreshMembres: async () => {}
});

export const useMembres = () => useContext(MembresContext);

export const MembresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingInProgress, setSavingInProgress] = useState(false);

  const getCurrentUser = () => {
    const authHeaders = getAuthHeaders();
    const token = authHeaders['Authorization']?.split(' ')[1];
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.email || null;
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      return null;
    }
  };

  const loadMembres = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.warn("Aucun utilisateur connecté, impossible de charger les membres");
        setLoading(false);
        return;
      }
      
      console.log("Chargement des membres pour:", currentUser);
      const loadedMembres = await loadMembresFromStorage(currentUser);
      
      console.log(`${loadedMembres.length} membres chargés`);
      setMembres(loadedMembres);
      
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les membres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Charger les membres au montage du composant
  useEffect(() => {
    const runLoadMembres = async () => {
      await loadMembres();
    };
    runLoadMembres();
  }, [loadMembres]);

  // Sauvegarder les membres quand ils changent
  useEffect(() => {
    const saveMembres = async () => {
      if (membres.length > 0 && !loading && !savingInProgress) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.warn("Aucun utilisateur connecté, impossible de sauvegarder les membres");
          return;
        }
        
        console.log(`Sauvegarde de ${membres.length} membres pour ${currentUser}`);
        setSavingInProgress(true);
        
        try {
          await saveMembresInStorage(membres, currentUser);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde des membres:", error);
          toast({
            title: "Erreur de sauvegarde",
            description: "Impossible de sauvegarder les modifications",
            variant: "destructive",
          });
        } finally {
          setSavingInProgress(false);
        }
      }
    };
    
    saveMembres();
  }, [membres, loading, toast]);

  const refreshMembres = async () => {
    await loadMembres();
  };

  return (
    <MembresContext.Provider value={{ membres, setMembres, loading, refreshMembres }}>
      {children}
    </MembresContext.Provider>
  );
};
