
import { useState, useEffect } from 'react';
import { db } from '@/services/database';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<string>('p71x6d_richard');
  const [userTables, setUserTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Chargement des données pour l'utilisateur: ${userId}`);
      
      // Vérifier que l'utilisateur existe
      const exists = await db.userExists(userId);
      if (!exists) {
        throw new Error(`L'utilisateur ${userId} n'existe pas dans la base de données`);
      }

      // Charger les tables de l'utilisateur
      const tables = await db.getUserTables(userId);
      setUserTables(tables);
      setCurrentUser(userId);
      
      // Stocker dans localStorage pour persistence
      localStorage.setItem('currentUser', userId);
      localStorage.setItem('userTables', JSON.stringify(tables));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors du chargement des données utilisateur:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser') || 'p71x6d_richard';
    loadUserData(savedUser);
  }, []);

  const switchUser = (userId: string) => {
    loadUserData(userId);
  };

  return {
    currentUser,
    userTables,
    loading,
    error,
    switchUser,
    refreshUserData: () => loadUserData(currentUser)
  };
};
