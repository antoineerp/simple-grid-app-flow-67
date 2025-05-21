
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserIdFromToken } from '@/services/auth/authService';
import { getCurrentUser, setCurrentUser, purgeSystem2Data } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

/**
 * Composant qui initialise l'identifiant utilisateur au chargement de l'application
 * en s'assurant que l'ID utilisateur est cohérent entre le token JWT et le service de base de données
 */
export const UserInitializer: React.FC = () => {
  const { isLoggedIn } = useAuth();
  
  useEffect(() => {
    // Nettoyer d'abord les données potentiellement problématiques
    purgeSystem2Data();
    
    // Initialiser l'identifiant utilisateur
    if (isLoggedIn) {
      console.log("UserInitializer: Démarrage de l'initialisation de l'utilisateur");
      
      // Forcer la récupération de l'ID utilisateur depuis le token JWT
      const userId = ensureUserIdFromToken();
      
      if (userId) {
        console.log(`UserInitializer: Utilisateur connecté avec l'ID: ${userId}`);
        
        // Vérification supplémentaire pour s'assurer que l'ID est bien enregistré
        const currentUser = getCurrentUser();
        
        if (currentUser !== userId) {
          console.warn(`UserInitializer: Incohérence d'identifiant utilisateur: JWT=${userId}, DB=${currentUser}`);
          
          // Nettoyer les stockages locaux avant de définir la nouvelle valeur
          localStorage.removeItem('userId');
          sessionStorage.removeItem('userId');
          
          // Mettre à jour le stockage local avec l'ID correct issu du token
          localStorage.setItem('userId', userId);
          sessionStorage.setItem('userId', userId);
          setCurrentUser(userId);
          
          toast({
            title: "Correction d'identifiant",
            description: `L'identifiant utilisateur a été corrigé: ${userId}`
          });
          
          // Déclencher un événement pour informer l'application du changement d'utilisateur
          window.dispatchEvent(new CustomEvent('userChanged', { 
            detail: { userId } 
          }));
          
          console.log(`UserInitializer: ID utilisateur corrigé et synchronisé: ${userId}`);
          
          // Force un rechargement des données avec le bon utilisateur
          window.dispatchEvent(new CustomEvent('force-sync-required', {
            detail: { reason: 'userId_changed', timestamp: new Date().toISOString() }
          }));
        } else {
          console.log("UserInitializer: Identifiant utilisateur cohérent");
        }
      } else {
        const currentUser = getCurrentUser();
        
        if (currentUser === 'p71x6d_richard' || currentUser === 'p71x6d_system2') {
          console.warn("UserInitializer: Utilisateur connecté mais utilisant l'ID par défaut");
          toast({
            variant: "destructive",
            title: "ID utilisateur par défaut",
            description: "Vous utilisez l'utilisateur par défaut. Déconnectez-vous et reconnectez-vous."
          });
        } else {
          console.log(`UserInitializer: Utilisateur initialisé: ${currentUser}`);
        }
      }
    } else {
      console.log("UserInitializer: Aucun utilisateur connecté");
    }
  }, [isLoggedIn]);
  
  // Composant invisible, ne rend rien
  return null;
};

export default UserInitializer;
