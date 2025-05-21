
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserIdFromToken } from '@/services/auth/authService';
import { getCurrentUser, isDefaultUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

/**
 * Composant qui initialise l'identifiant utilisateur au chargement de l'application
 * en s'assurant que l'ID utilisateur est cohérent entre le token JWT et le service de base de données
 */
export const UserInitializer: React.FC = () => {
  const { isLoggedIn } = useAuth();
  
  useEffect(() => {
    // Initialiser l'identifiant utilisateur
    if (isLoggedIn) {
      // Forcer la récupération de l'ID utilisateur depuis le token JWT
      const userId = ensureUserIdFromToken();
      
      if (userId) {
        console.log(`UserInitializer: Utilisateur connecté avec l'ID: ${userId}`);
        
        // Vérification supplémentaire pour s'assurer que l'ID est bien enregistré
        const currentUser = getCurrentUser();
        if (currentUser !== userId) {
          console.error(`UserInitializer: Incohérence d'identifiant utilisateur: JWT=${userId}, DB=${currentUser}`);
          
          // Mettre à jour le stockage local avec l'ID correct issu du token
          localStorage.setItem('userId', userId);
          sessionStorage.setItem('userId', userId);
          
          toast({
            title: "Correction d'identifiant",
            description: `L'identifiant utilisateur a été corrigé: ${userId}`
          });
        } else {
          console.log("UserInitializer: Identifiant utilisateur cohérent");
        }
      } else if (isDefaultUser()) {
        console.warn("UserInitializer: Utilisateur connecté mais utilisant l'ID par défaut");
        toast({
          variant: "destructive",
          title: "ID utilisateur par défaut",
          description: "Vous utilisez l'utilisateur par défaut. Déconnectez-vous et reconnectez-vous."
        });
      }
    } else {
      console.log("UserInitializer: Aucun utilisateur connecté");
    }
  }, [isLoggedIn]);
  
  // Composant invisible, ne rend rien
  return null;
};

export default UserInitializer;
