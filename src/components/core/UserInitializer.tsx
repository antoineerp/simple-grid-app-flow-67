
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
      const userId = ensureUserIdFromToken();
      
      if (userId) {
        console.log(`UserInitializer: Utilisateur connecté avec l'ID: ${userId}`);
        
        // Vérification supplémentaire
        const currentUser = getCurrentUser();
        if (currentUser !== userId) {
          console.error(`UserInitializer: Incohérence d'identifiant utilisateur: JWT=${userId}, DB=${currentUser}`);
          toast({
            variant: "destructive",
            title: "Erreur d'identification",
            description: "Incohérence détectée dans l'identifiant utilisateur, déconnexion recommandée."
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
