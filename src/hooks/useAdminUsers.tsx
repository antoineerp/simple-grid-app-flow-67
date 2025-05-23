
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { checkPermission, UserRole } from '@/types/roles';
import { verifyUserTables } from '@/utils/userTableVerification';
import type { Utilisateur } from '@/types/auth';
import { userService } from '@/services/api/apiService';

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

  // Fonction pour charger les utilisateurs avec le nouveau service centralisé
  const loadUtilisateurs = useCallback(async () => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
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
      console.log("Début du chargement des utilisateurs depuis le service centralisé...");
      
      // Utilisation du nouveau service API centralisé
      const users = await userService.getAllUsers();
      
      console.log(`${users.length} utilisateurs chargés depuis l'API`);
      setUtilisateurs(users);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs depuis la base de données.",
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
      // Utiliser le service centralisé pour la connexion
      const success = await userService.connectAsUser(identifiantTechnique);
      
      if (success) {
        console.log(`Connexion réussie avec identifiant: ${identifiantTechnique}`);
        toast({
          title: "Connexion réussie",
          description: `Connecté en tant que ${identifiantTechnique}`,
        });
        
        // S'assurer que les tables existent pour cet utilisateur
        try {
          await verifyUserTables(identifiantTechnique);
        } catch (tableError) {
          console.error("Erreur lors de la vérification des tables:", tableError);
          toast({
            title: "Attention",
            description: `Connecté, mais problème lors de la vérification des tables: ${tableError instanceof Error ? tableError.message : 'Erreur inconnue'}`,
            variant: "destructive",
          });
        }
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

  const deleteUser = async (userId: string): Promise<boolean> => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions de suppression
    if (!checkPermission(currentUserRole, 'isAdmin')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour supprimer un utilisateur.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      console.log(`Tentative de suppression de l'utilisateur avec ID: ${userId}`);
      
      // Utiliser le service centralisé pour la suppression
      const success = await userService.deleteUser(userId);
      
      if (success) {
        // Recharger la liste des utilisateurs
        await loadUtilisateurs();
      }
      
      return success;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw error;
    }
  };
  
  // Vérifie que les tables de tous les utilisateurs existent avec le service centralisé
  const verifyAllUserTables = async (): Promise<boolean> => {
    try {
      // Utiliser le service centralisé
      const results = await userService.verifyAllUserTables();
      
      toast({
        title: "Vérification terminée",
        description: `Tables vérifiées pour ${results.length || 0} utilisateurs`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification des tables:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la vérification des tables",
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
    deleteUser,
    verifyAllUserTables,
    retryCount
  };
};
