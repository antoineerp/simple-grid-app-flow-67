
import React, { createContext, useState, useContext, useEffect } from 'react';
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

  const getCurrentUser = () => {
    const authHeaders = getAuthHeaders();
    const token = authHeaders['Authorization']?.split(' ')[1];
    if (!token) return 'default_user';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.email || 'default_user';
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      return 'default_user';
    }
  };

  const loadMembres = async () => {
    setLoading(true);
    
    try {
      const currentUser = getCurrentUser();
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
  };

  useEffect(() => {
    loadMembres();
  }, []);

  useEffect(() => {
    if (membres.length > 0 && !loading) {
      const currentUser = getCurrentUser();
      console.log(`Sauvegarde de ${membres.length} membres pour ${currentUser}`);
      
      saveMembresInStorage(membres, currentUser)
        .catch(error => {
          console.error("Erreur lors de la sauvegarde des membres:", error);
          toast({
            title: "Erreur de sauvegarde",
            description: "Impossible de sauvegarder les modifications",
            variant: "destructive",
          });
        });
    }
  }, [membres, loading]);

  const refreshMembres = async () => {
    await loadMembres();
  };

  return (
    <MembresContext.Provider value={{ membres, setMembres, loading, refreshMembres }}>
      {children}
    </MembresContext.Provider>
  );
};
