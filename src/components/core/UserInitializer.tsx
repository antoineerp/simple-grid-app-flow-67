
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserIdFromToken } from '@/services/auth/authService';
import { getCurrentUser, setCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';

// ID sécurisé à utiliser pour tous les utilisateurs
const SAFE_DB_USER = 'p71x6d_richard';

/**
 * Composant qui initialise l'identifiant utilisateur au chargement de l'application
 * en s'assurant que l'ID utilisateur est cohérent et utilise toujours p71x6d_richard
 */
export const UserInitializer: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialiser l'identifiant utilisateur
    if (isLoggedIn) {
      console.log("UserInitializer: Démarrage de l'initialisation de l'utilisateur");
      
      // Vérifier si c'est l'administrateur antcirier@gmail.com
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail === 'antcirier@gmail.com') {
        console.log("UserInitializer: Administrateur antcirier@gmail.com détecté - Utilisation de p71x6d_richard");
        
        // Nettoyer les stockages locaux avant de définir la nouvelle valeur
        localStorage.removeItem('userId');
        sessionStorage.removeItem('userId');
        
        // Définir explicitement l'ID sécurisé pour l'administrateur
        localStorage.setItem('userId', SAFE_DB_USER);
        sessionStorage.setItem('userId', SAFE_DB_USER);
        localStorage.setItem('user_id', SAFE_DB_USER);
        setCurrentUser(SAFE_DB_USER);
        
        console.log(`UserInitializer: ID administrateur défini à ${SAFE_DB_USER}`);
        
        // Stocker l'information de dernière vérification d'ID utilisateur
        localStorage.setItem('user_id_last_verified', new Date().toISOString());
        
        // Émettre un événement pour informer que l'initialisation est terminée
        window.dispatchEvent(new CustomEvent('user-initialized', {
          detail: { userId: SAFE_DB_USER, timestamp: new Date().toISOString() }
        }));
        
        return;
      }
      
      // Pour les autres utilisateurs, forcer la récupération de l'ID utilisateur
      const userId = ensureUserIdFromToken();
      
      if (userId) {
        console.log(`UserInitializer: Utilisateur connecté avec l'ID: ${userId}`);
        
        // Mais toujours utiliser p71x6d_richard
        const safeId = SAFE_DB_USER;
        
        // Nettoyer les stockages locaux avant de définir la nouvelle valeur
        localStorage.removeItem('userId');
        sessionStorage.removeItem('userId');
        
        // Mettre à jour avec l'identifiant sûr
        localStorage.setItem('userId', safeId);
        sessionStorage.setItem('userId', safeId);
        setCurrentUser(safeId);
        
        console.log(`UserInitializer: ID utilisateur forcé vers ${safeId} (original: ${userId})`);
        
        // Stocker l'information de dernière vérification d'ID utilisateur
        localStorage.setItem('user_id_last_verified', new Date().toISOString());
        
        // Émettre un événement pour informer que l'initialisation est terminée
        window.dispatchEvent(new CustomEvent('user-initialized', {
          detail: { userId: safeId, timestamp: new Date().toISOString() }
        }));
      } else {
        // Si aucun ID n'est récupéré, utiliser l'ID sécurisé par défaut
        console.log("UserInitializer: Aucun ID récupéré, utilisation de l'ID par défaut");
        
        // Nettoyer les stockages locaux
        localStorage.removeItem('userId');
        sessionStorage.removeItem('userId');
        
        // Mettre à jour avec l'ID sûr
        localStorage.setItem('userId', SAFE_DB_USER);
        sessionStorage.setItem('userId', SAFE_DB_USER);
        setCurrentUser(SAFE_DB_USER);
        
        console.log(`UserInitializer: ID utilisateur défini par défaut à ${SAFE_DB_USER}`);
        
        // Stocker l'information de dernière vérification d'ID utilisateur
        localStorage.setItem('user_id_last_verified', new Date().toISOString());
      }
      
      // Diffuser un événement de synchronisation pour les autres composants
      window.dispatchEvent(new CustomEvent('user-id-verified', {
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
