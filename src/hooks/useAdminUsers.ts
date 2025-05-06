
import { useState, useEffect, useCallback } from 'react';
import { getUtilisateurs, Utilisateur } from '@/services/users/userService';
import { connectAsUser } from '@/services';
import { createLocalTableForUser, deleteLocalTablesForUser } from '@/services/membres/membreLocalSync';

export const useAdminUsers = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUtilisateurs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUtilisateurs();
      
      // Convertir le format des dates si nécessaire
      const formattedUsers = data.map(user => ({
        ...user,
        // Assurer que date_creation est un string formaté
        date_creation: user.date_creation 
          ? (typeof user.date_creation === 'object' && user.date_creation instanceof Date 
              ? user.date_creation.toISOString().split('T')[0]
              : String(user.date_creation))
          : ''
      }));
      
      setUtilisateurs(formattedUsers);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnectAsUser = useCallback(async (identifiant: string) => {
    setError(null);
    
    try {
      console.log(`Tentative de connexion avec: ${identifiant}`);
      
      // Si la table locale n'existe pas pour cet utilisateur, la créer
      createLocalTableForUser(identifiant);
      
      // Effectuer la connexion
      const success = await connectAsUser(identifiant);
      
      console.log(`Résultat de la connexion: ${success ? 'Réussie' : 'Échec'}`);
      return success;
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
      return false;
    }
  }, []);
  
  const handleUserDelete = useCallback(async (userId: number, identifiantTechnique: string) => {
    // Supprimer les tables locales pour l'utilisateur
    deleteLocalTablesForUser(identifiantTechnique);
    
    // Le reste de la logique de suppression...
    // Notez que la suppression côté serveur est déjà gérée dans le composant UserManagement
  }, []);

  useEffect(() => {
    loadUtilisateurs();
  }, [loadUtilisateurs]);

  return {
    utilisateurs,
    loading,
    error,
    loadUtilisateurs,
    handleConnectAsUser,
    handleUserDelete
  };
};
