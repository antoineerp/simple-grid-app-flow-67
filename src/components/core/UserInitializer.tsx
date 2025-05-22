
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Composant qui initialise l'identifiant utilisateur au chargement de l'application
 * et respecte le rôle de l'utilisateur
 */
export const UserInitializer: React.FC = () => {
  const { isLoggedIn, userId, userRole } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialiser l'identifiant utilisateur
    if (isLoggedIn) {
      console.log("UserInitializer: Démarrage de l'initialisation de l'utilisateur");
      
      // Conserver l'ID utilisateur
      console.log(`UserInitializer: ID utilisateur: ${userId}, Rôle: ${userRole || 'non défini'}`);
      
      // Stocker l'information de dernière vérification d'ID utilisateur
      localStorage.setItem('user_id_last_verified', new Date().toISOString());
      
      // Émettre un événement pour informer que l'initialisation est terminée
      window.dispatchEvent(new CustomEvent('user-initialized', {
        detail: { userId, userRole, timestamp: new Date().toISOString() }
      }));
    } else {
      console.log("UserInitializer: Aucun utilisateur connecté");
    }
  }, [isLoggedIn, userId, userRole, toast]);
  
  // Composant invisible, ne rend rien
  return null;
};

export default UserInitializer;
