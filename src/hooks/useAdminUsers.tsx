
import { useState, useEffect, useCallback } from 'react';
import { connectAsUser, testDatabaseConnection, Utilisateur } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { checkPermission, UserRole } from '@/types/roles';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { UserManager } from '@/services/users/userManager';

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Charger les utilisateurs au montage du composant avec retry
  useEffect(() => {
    loadUtilisateurs();
    
    // Si erreur, réessayer après 2 secondes (max 3 tentatives)
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Tentative de reconnexion (${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        loadUtilisateurs();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const loadUtilisateurs = useCallback(async () => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    const currentDatabaseUser = getDatabaseConnectionCurrentUser();
    
    // Vérifier les permissions avant de charger les utilisateurs
    if (!checkPermission(currentUserRole, 'isAdmin')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour voir la liste des utilisateurs.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Début du chargement des utilisateurs...");
      console.log("Utilisateur base de données actuel:", currentDatabaseUser);
      
      // Vérifier d'abord la connexion à la base de données
      const dbConnected = await testDatabaseConnection();
      console.log("Test de connexion à la base de données:", dbConnected);
      
      if (!dbConnected) {
        throw new Error("Impossible de se connecter à la base de données. Vérifiez la configuration.");
      }
      
      // Forcer le rafraîchissement du cache lors d'un chargement explicite
      const data = await UserManager.getUtilisateurs(true);
      console.log("Données utilisateurs récupérées:", data);
      
      setUtilisateurs(data);
      setError(null); // Réinitialiser l'erreur si réussite
      setRetryCount(0); // Réinitialiser le compteur de tentatives
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleConnectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions de connexion
    if (!checkPermission(currentUserRole, 'isAdmin')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour changer d'utilisateur.",
        variant: "destructive",
      });
      return false;
    }
    
    console.log(`Tentative de connexion en tant que: ${identifiantTechnique}`);

    try {
      // Vérifier d'abord la connexion à la base de données
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error("Impossible de se connecter à la base de données. Vérifiez la configuration.");
      }
      
      const success = await connectAsUser(identifiantTechnique);
      if (success) {
        console.log(`Connexion réussie en tant que: ${identifiantTechnique}`);
        toast({
          title: "Connexion réussie",
          description: `Connecté en tant que ${identifiantTechnique}`,
        });
        
        // Mettre à jour explicitement localStorage
        localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      } else {
        console.error(`Échec de connexion en tant que: ${identifiantTechnique}`);
      }
      return success;
    } catch (error) {
      console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue lors de la connexion",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    utilisateurs,
    loading,
    error,
    loadUtilisateurs,
    handleConnectAsUser,
    retryCount
  };
};
