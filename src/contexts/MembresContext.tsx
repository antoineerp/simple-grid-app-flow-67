
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromStorage, saveMembresInStorage } from '@/services/membres/membresService';
import { useToast } from '@/hooks/use-toast';

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

  // Fonction pour charger les membres depuis le serveur ou le localStorage
  const loadMembres = async () => {
    setLoading(true);
    
    try {
      // Récupérer l'identifiant de l'utilisateur courant
      const currentUser = localStorage.getItem('currentUser') || 
                         localStorage.getItem('userEmail') || 
                         'default_user';
      
      console.log("Chargement des membres pour:", currentUser);
      
      // Charger les membres (essaie d'abord le serveur, puis localStorage)
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

  // Charger les membres au montage du composant
  useEffect(() => {
    loadMembres();
    
    // Écouter les événements de mise à jour des membres
    const handleMembresUpdate = () => {
      console.log("Événement de mise à jour des membres détecté");
      loadMembres();
    };
    
    window.addEventListener('membresUpdate', handleMembresUpdate);
    
    // Nettoyer l'écouteur d'événements
    return () => {
      window.removeEventListener('membresUpdate', handleMembresUpdate);
    };
  }, []);

  // Sauvegarder les membres lorsqu'ils changent
  useEffect(() => {
    if (membres.length > 0 && !loading) {
      const currentUser = localStorage.getItem('currentUser') || 
                         localStorage.getItem('userEmail') || 
                         'default_user';
      
      console.log(`Sauvegarde de ${membres.length} membres pour ${currentUser}`);
      saveMembresInStorage(membres, currentUser);
    }
  }, [membres, loading]);

  // Fonction pour rafraîchir les membres
  const refreshMembres = async () => {
    await loadMembres();
  };

  return (
    <MembresContext.Provider value={{ membres, setMembres, loading, refreshMembres }}>
      {children}
    </MembresContext.Provider>
  );
};
