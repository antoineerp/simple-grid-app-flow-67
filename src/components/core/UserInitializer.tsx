
import { useEffect } from 'react';
import { getCurrentUser, setCurrentUser } from '@/services/core/databaseConnectionService';

/**
 * Composant pour initialiser l'utilisateur au chargement de l'application
 */
const UserInitializer = () => {
  useEffect(() => {
    // Vérifier s'il y a un utilisateur sauvegardé
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && savedUser !== getCurrentUser()) {
      setCurrentUser(savedUser);
    }
  }, []);

  return null;
};

export default UserInitializer;
