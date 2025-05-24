
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { userService } from '@/services/users/userService';
import type { Utilisateur } from '@/types/auth';

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Charger les utilisateurs avec retry
  const loadUtilisateurs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Début du chargement des utilisateurs de la base de données...");
      
      // Utiliser le service pour charger directement depuis la base de données
      const users = await userService.getAllUsers();
      
      if (users && users.length > 0) {
        console.log(`${users.length} utilisateurs chargés depuis la base de données`);
        setUtilisateurs(users);
        setError(null);
        setRetryCount(0);
      } else {
        console.warn("Aucun utilisateur récupéré ou format de données incorrect");
        setError("Aucun utilisateur récupéré");
      }
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

  // Charger les utilisateurs au montage avec retry
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
  }, [error, retryCount, loadUtilisateurs]);

  const handleConnectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
    console.log(`Tentative de connexion en tant que: ${identifiantTechnique}`);

    try {
      // Utiliser le service pour la connexion directe à la base de données
      const success = await userService.connectAsUser(identifiantTechnique);
      
      if (success) {
        console.log(`Connexion réussie avec identifiant: ${identifiantTechnique}`);
        toast({
          title: "Connexion réussie",
          description: `Connecté en tant que ${identifiantTechnique}`,
        });
      } else {
        toast({
          title: "Échec de connexion",
          description: `Impossible de se connecter en tant que ${identifiantTechnique}`,
          variant: "destructive",
        });
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
    try {
      console.log(`Tentative de suppression de l'utilisateur avec ID: ${userId}`);
      
      // Utiliser le service pour la suppression depuis la base de données
      const result = await userService.deleteUser(userId);
      
      if (result && result.success) {
        // Recharger la liste des utilisateurs directement depuis la base de données
        await loadUtilisateurs();
        
        toast({
          title: "Utilisateur supprimé",
          description: "L'utilisateur a été supprimé avec succès de la base de données",
        });
        
        return true;
      }
      
      toast({
        title: "Échec de la suppression",
        description: result && result.message ? result.message : "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
      
      return false;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  // Vérifier toutes les tables utilisateurs directement dans la base de données
  const verifyAllUserTables = async () => {
    try {
      return await userService.verifyAllUserTables();
    } catch (error) {
      console.error("Erreur lors de la vérification des tables:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la vérification des tables",
        variant: "destructive",
      });
      return [];
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
