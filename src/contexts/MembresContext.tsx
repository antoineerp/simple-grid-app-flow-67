
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types pour les membres
interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role?: string;
  departement?: string;
}

// Type pour le contexte
interface MembresContextType {
  membres: Membre[];
  isLoading: boolean;
  error: string | null;
  addMembre: (membre: Membre) => void;
  updateMembre: (id: string, membre: Membre) => void;
  deleteMembre: (id: string) => void;
  refreshMembres: () => void;
}

// Création du contexte
const MembresContext = createContext<MembresContextType | undefined>(undefined);

// Provider component
export const MembresProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      // Dans une implémentation réelle, remplacer par un appel API
      const data = [
        { id: "1", nom: "Dupont", prenom: "Jean", email: "jean.dupont@example.com", role: "Directeur", departement: "Direction" },
        { id: "2", nom: "Martin", prenom: "Sophie", email: "sophie.martin@example.com", role: "Responsable RH", departement: "RH" },
        { id: "3", nom: "Bernard", prenom: "Pierre", email: "pierre.bernard@example.com", role: "Formateur", departement: "Formation" },
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
        refreshMembres 
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

// Export par défaut au cas où
export default { MembresProvider, useMembres };
