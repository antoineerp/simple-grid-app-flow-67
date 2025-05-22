
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ID sécurisé à utiliser pour TOUS les utilisateurs
const SAFE_DB_USER = 'p71x6d_richard';

/**
 * Composant qui initialise l'identifiant utilisateur au chargement de l'application
 * en s'assurant que tous les utilisateurs utilisent TOUJOURS p71x6d_richard
 */
export const UserInitializer: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialiser l'identifiant utilisateur
    if (isLoggedIn) {
      console.log("UserInitializer: Démarrage de l'initialisation de l'utilisateur");
      
      // Nettoyer les stockages locaux avant de définir la nouvelle valeur
      localStorage.removeItem('userId');
      sessionStorage.removeItem('userId');
      
      // Définir explicitement l'ID sécurisé pour tous les utilisateurs
      localStorage.setItem('userId', SAFE_DB_USER);
      sessionStorage.setItem('userId', SAFE_DB_USER);
      localStorage.setItem('user_id', SAFE_DB_USER);
      
      // Stocker l'email de l'utilisateur pour référence (sans impact sur la sélection de la base)
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        console.log(`UserInitializer: Utilisateur connecté avec email: ${storedEmail}`);
        
        // Créer un préfixe utilisateur unique basé sur l'email
        const emailPrefix = storedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
        localStorage.setItem('userPrefix', emailPrefix);
      } else {
        // Préfixe par défaut
        localStorage.setItem('userPrefix', 'default_user');
      }
      
      console.log(`UserInitializer: ID utilisateur défini à ${SAFE_DB_USER}`);
      
      // Stocker l'information de dernière vérification d'ID utilisateur
      localStorage.setItem('user_id_last_verified', new Date().toISOString());
      
      // Émettre un événement pour informer que l'initialisation est terminée
      window.dispatchEvent(new CustomEvent('user-initialized', {
        detail: { userId: SAFE_DB_USER, timestamp: new Date().toISOString() }
      }));
    } else {
      console.log("UserInitializer: Aucun utilisateur connecté");
    }
  }, [isLoggedIn, toast]);
  
  // Composant invisible, ne rend rien
  return null;
};

export default UserInitializer;
