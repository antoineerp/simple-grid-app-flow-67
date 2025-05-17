
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Membre } from '@/types/membres';
import { getMembres, refreshMembres, createMembre, updateMembre, deleteMembre, syncMembres } from '@/services/membres/membresService';

// Type pour le contexte
export interface MembresContextType {
  membres: Membre[];
  isLoading: boolean;
  error: string | null;
  addMembre: (membre: Omit<Membre, 'id'>) => Promise<Membre>;
  updateMembre: (id: string, membre: Partial<Membre>) => Promise<Membre>;
  deleteMembre: (id: string) => Promise<boolean>;
  refreshMembres: () => Promise<void>;
}

// Création du contexte
const MembresContext = createContext<MembresContextType | undefined>(undefined);

// Configuration de la synchronisation globale
const GLOBAL_SYNC_INTERVAL = 10000; // 10 secondes

// Provider component
export const MembresProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les membres au montage du composant
  useEffect(() => {
    loadMembres();

    // Configurer la synchronisation globale
    const syncInterval = setInterval(() => {
      // Synchronisation silencieuse en arrière-plan
      syncMembres().catch(err => {
        console.error("Erreur de synchronisation en arrière-plan:", err);
      });
    }, GLOBAL_SYNC_INTERVAL);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  // Fonction pour charger les membres
  const loadMembres = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getMembres();
      setMembres(data);
    } catch (err) {
      console.error("Erreur lors du chargement des membres:", err);
      setError("Impossible de charger les membres");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour rafraîchir les membres
  const handleRefreshMembres = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await refreshMembres();
      setMembres(data);
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des membres:", err);
      setError("Impossible de rafraîchir les membres");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ajouter un membre
  const handleAddMembre = async (membre: Omit<Membre, 'id'>): Promise<Membre> => {
    const newMembre = await createMembre(membre);
    setMembres(prevMembres => [...prevMembres, newMembre]);
    return newMembre;
  };

  // Fonction pour mettre à jour un membre
  const handleUpdateMembre = async (id: string, membre: Partial<Membre>): Promise<Membre> => {
    const updatedMembre = await updateMembre(id, membre);
    setMembres(prevMembres => 
      prevMembres.map(m => m.id === id ? updatedMembre : m)
    );
    return updatedMembre;
  };

  // Fonction pour supprimer un membre
  const handleDeleteMembre = async (id: string): Promise<boolean> => {
    const success = await deleteMembre(id);
    if (success) {
      setMembres(prevMembres => prevMembres.filter(m => m.id !== id));
    }
    return success;
  };

  return (
    <MembresContext.Provider 
      value={{ 
        membres, 
        isLoading, 
        error, 
        addMembre: handleAddMembre, 
        updateMembre: handleUpdateMembre, 
        deleteMembre: handleDeleteMembre, 
        refreshMembres: handleRefreshMembres
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
