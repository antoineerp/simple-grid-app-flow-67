
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';

// Type pour le contexte
export interface MembresContextType {
  membres: Membre[];
  isLoading: boolean;
  error: string | null;
  addMembre: (membre: Membre) => void;
  updateMembre: (id: string, membre: Membre) => void;
  deleteMembre: (id: string) => void;
  refreshMembres: () => void;
  syncMembres: () => Promise<boolean>;
  lastSynced: Date | null;
  syncFailed: boolean;
}

// Création du contexte
const MembresContext = createContext<MembresContextType | undefined>(undefined);

// Provider component
export const MembresProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);

  // Charger les membres au montage du composant
  useEffect(() => {
    refreshMembres();
  }, []);

  // Fonction pour charger les membres
  const refreshMembres = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler un appel API avec des données statiques pour l'instant
      const data: Membre[] = [
        { 
          id: "1", 
          nom: "Dupont", 
          prenom: "Jean", 
          email: "jean.dupont@example.com", 
          role: "Directeur", 
          departement: "Direction",
          fonction: "Directeur général",
          initiales: "JD",
          date_creation: new Date("2023-01-15")
        },
        { 
          id: "2", 
          nom: "Martin", 
          prenom: "Sophie", 
          email: "sophie.martin@example.com", 
          role: "Responsable RH", 
          departement: "RH",
          fonction: "Responsable des ressources humaines",
          initiales: "SM",
          date_creation: new Date("2023-02-20")
        },
        { 
          id: "3", 
          nom: "Bernard", 
          prenom: "Pierre", 
          email: "pierre.bernard@example.com", 
          role: "Formateur", 
          departement: "Formation",
          fonction: "Formateur principal",
          initiales: "PB",
          date_creation: new Date("2023-03-10")
        },
      ];
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMembres(data);
    } catch (err) {
      console.error("Erreur lors du chargement des membres:", err);
      setError("Impossible de charger les membres");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour synchroniser les membres
  const syncMembres = async (): Promise<boolean> => {
    setIsLoading(true);
    setSyncFailed(false);
    
    try {
      // Simuler une synchronisation avec le serveur
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSynced(new Date());
      return true;
    } catch (error) {
      console.error("Erreur lors de la synchronisation des membres:", error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ajouter un membre
  const addMembre = (membre: Membre) => {
    setMembres(prevMembres => [...prevMembres, membre]);
  };

  // Fonction pour mettre à jour un membre
  const updateMembre = (id: string, membre: Membre) => {
    setMembres(prevMembres => 
      prevMembres.map(m => m.id === id ? membre : m)
    );
  };

  // Fonction pour supprimer un membre
  const deleteMembre = (id: string) => {
    setMembres(prevMembres => 
      prevMembres.filter(m => m.id !== id)
    );
  };

  return (
    <MembresContext.Provider 
      value={{ 
        membres, 
        isLoading, 
        error, 
        addMembre, 
        updateMembre, 
        deleteMembre, 
        refreshMembres,
        syncMembres,
        lastSynced,
        syncFailed
      }}
    >
      {children}
    </MembresContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useMembres = () => {
  const context = useContext(MembresContext);
  
  if (context === undefined) {
    throw new Error('useMembres must be used within a MembresProvider');
  }
  
  return context;
};
