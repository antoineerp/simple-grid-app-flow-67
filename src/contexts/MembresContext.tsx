
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { loadMembresFromServer } from '@/services/membres/membresService';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

interface MembresContextType {
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  isLoading: boolean;
  error: string | null;
}

const MembresContext = createContext<MembresContextType | undefined>(undefined);

export const MembresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
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
        
        // S'assurer que l'utilisateur est un identifiant valide
        const userId = typeof currentUser === 'object' ? 
          (currentUser.identifiant_technique || currentUser.email || 'p71x6d_system') : 
          currentUser;
          
        console.log("Chargement des membres pour l'utilisateur", userId);
        
        try {
          const serverMembres = await loadMembresFromServer(userId);
          
          setMembres(serverMembres);
          console.log("Membres chargés depuis le serveur:", serverMembres.length);
        } catch (err) {
          console.error("Erreur lors du chargement des membres depuis le serveur:", err);
          setError(err instanceof Error ? err.message : "Erreur inconnue");
          // Si erreur, initialiser avec un tableau vide
          setMembres([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors du chargement des membres:", errorMessage);
        // Si erreur, initialiser avec un tableau vide
        setMembres([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMembres();
    
  }, []);
  
  return (
    <MembresContext.Provider value={{
      membres,
      setMembres,
      isLoading,
      error
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
